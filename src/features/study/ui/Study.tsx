import { Fragment, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { go, useApp } from '../../../app/state'
import { Icon, type IconName } from '../../../shared/ui/Icon'
import { BackButton, HeroCard, Notice, Segmented } from '../../../shared/ui/ui'
import { kindOf } from '../../../shared/files/files'
import { closePdf, extractPagesText, openPdf } from '../../../shared/pdf/pdf'
import { EDIT_PDF, handOff } from '../../../shared/files/handoff'
import { SaveOptions } from '../../../shared/ui/DocPreview'
import { documentId, entryPercent, removeEntry, resumeParagraph, upsertEntry, type ReadingEntry } from '../core/readingHistory'
import { loadFile as loadStoredFile, loadHistory, pruneFiles, saveHistory, storeFile } from '../infra/historyStore'
import { groupByDoc, isHighlighted, quoteNote, removeDocHighlights, removeHighlight, toggleHighlight, type Highlight } from '../core/highlights'
import { getHighlights, setHighlights, subscribeHighlights } from '../infra/highlightsStore'
import { PageNav, usePdfPreview } from '../../pdf/ui/PdfPreview'
import { track } from '../../../shared/platform/analytics'
import { tr } from '../../../shared/i18n/translate'
import { useT } from '../../../shared/i18n/I18n'
import type { MessageKey } from '../../../shared/i18n/messages/es'
import { firstParagraphOfPage, listenedPercent, nextPosition, pageProgress, toPagedParagraphs, toParagraphs } from '../core/reading'
import { guessFeminine, personaAvatar, personasForVoices, voicesForLanguage, type VoicePersona } from '../core/voicePersonas'

// ── Menú del Modo Estudio (W-59): una tarjeta por función, como en la app ──
type StudyTab = 'lectura' | 'notas' | 'pomodoro'
type Report = (status: string) => void

const STUDY_TABS: Array<{ id: StudyTab; icon: IconName; cls: string; title: MessageKey; desc: MessageKey }> = [
  { id: 'lectura', icon: 'volume', cls: 'ico-green', title: 'study.readAloud', desc: 'study.menuReadDesc' },
  { id: 'notas', icon: 'note', cls: 'ico-blue', title: 'study.notes', desc: 'study.menuNotesDesc' },
  { id: 'pomodoro', icon: 'timer', cls: 'ico-amber', title: 'study.pomodoro', desc: 'study.menuPomodoroDesc' },
]

export function Study({ sub }: { sub?: string }) {
  const tab = STUDY_TABS.find((t) => t.id === sub)?.id
  // Las secciones abiertas siguen montadas (ocultas) al volver al menú o cambiar de sección:
  // el Pomodoro sigue contando y la lectura sigue sonando.
  const [opened, setOpened] = useState<ReadonlySet<StudyTab>>(() => new Set(tab ? [tab] : []))
  const [status, setStatus] = useState<Partial<Record<StudyTab, string>>>({})
  useEffect(() => {
    if (tab) setOpened((o) => (o.has(tab) ? o : new Set([...o, tab])))
  }, [tab])
  const reporters = useMemo(() => {
    const make = (id: StudyTab): Report => (s) => setStatus((cur) => (cur[id] === s ? cur : { ...cur, [id]: s }))
    return { lectura: make('lectura'), notas: make('notas'), pomodoro: make('pomodoro') }
  }, [])

  const section = (id: StudyTab) => {
    if (id === 'lectura') return <ReadAloud onStatus={reporters.lectura} />
    if (id === 'notas') return <Notes />
    return <Pomodoro onStatus={reporters.pomodoro} />
  }

  return (
    <>
      <HeroCard title={tr('nav.study')} subtitle={tr('study.heroSub')} />
      {tab ? (
        <div style={{ margin: '14px 0' }}>
          <BackButton label={tr('nav.study')} onClick={() => go('estudio')} />
        </div>
      ) : (
        <>
          <h2 className="section-title">{tr('study.menuPrompt')}</h2>
          <div className="study-menu">
            {STUDY_TABS.map((t) => (
              <button key={t.id} type="button" className="tool-card study-card" onClick={() => go('estudio', t.id)}>
                <span className={'ico ' + t.cls}><Icon name={t.icon} /></span>
                <span className="study-card-text">
                  <b>{tr(t.title)}</b>
                  <small>{tr(t.desc)}</small>
                  {status[t.id] && <span className="study-live">{status[t.id]}</span>}
                </span>
                <span className="study-card-arrow"><Icon name="back" /></span>
              </button>
            ))}
          </div>
        </>
      )}
      {STUDY_TABS.filter((t) => opened.has(t.id)).map((t) => (
        <div key={t.id} hidden={t.id !== tab}>
          {section(t.id)}
        </div>
      ))}
    </>
  )
}

// ── Lectura en voz alta por párrafos (W-60) ─────────────────────────
type Pos = { p: number; c: number }

function ReadAloud({ onStatus }: { onStatus: Report }) {
  const { toast } = useApp()
  const { lang: uiLang } = useT()
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window
  const [text, setText] = useState('')
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [voiceURI, setVoiceURI] = useState(readSavedVoice)
  const [rate, setRate] = useState(1)
  const [view, setView] = useState<'edit' | 'read'>('edit')
  const [pos, setPos] = useState<Pos>({ p: 0, c: 0 })
  const [state, setState] = useState<'idle' | 'playing' | 'paused'>('idle')
  const [finished, setFinished] = useState(false)
  const [loading, setLoading] = useState(false)
  // PDF cargado: su texto por página, para mostrar el documento y el avance por páginas (W-60b).
  const [pdf, setPdf] = useState<{ file: File; pages: string[] } | null>(null)
  // Nombre del TXT cargado, para guardar el texto editado con el mismo nombre (W-80).
  const [txtName, setTxtName] = useState<string | null>(null)
  const textFile = useMemo(() => (text.trim() && !pdf ? new File([text], txtName ?? `${tr('file.studyText')}.txt`, { type: 'text/plain' }) : null), [text, pdf, txtName])
  const [docView, setDocView] = useState<'document' | 'text'>('document')
  // Retomar lectura (W-62): documentos recientes con su avance, solo en este navegador.
  const [history, setHistory] = useState<ReadingEntry[]>(loadHistory)
  const [doc, setDoc] = useState<{ id: string; name: string; kind: 'pdf' | 'text' } | null>(null)
  const [resumed, setResumed] = useState<string | null>(null)
  const highlights = useSyncExternalStore(subscribeHighlights, getHighlights)
  const paragraphs = useMemo(() => (pdf ? toPagedParagraphs(pdf.pages) : toParagraphs(text)), [pdf, text])
  const totalPages = pdf?.pages.length ?? 0
  const currentPage = paragraphs[pos.p]?.page ?? 1
  // Cada lectura lleva un número: al cancelar, los avisos de la anterior se ignoran.
  const run = useRef(0)
  const fileInput = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!supported) return
    const load = () => setVoices(speechSynthesis.getVoices())
    load()
    speechSynthesis.addEventListener('voiceschanged', load)
    return () => {
      speechSynthesis.removeEventListener('voiceschanged', load)
      run.current++
      speechSynthesis.cancel()
    }
  }, [supported])

  // Estado para la tarjeta del menú ("Leyendo · párrafo 3 de 18").
  useEffect(() => {
    const vars = totalPages ? { i: currentPage, n: totalPages } : { i: Math.min(pos.p + 1, paragraphs.length), n: paragraphs.length }
    const [reading, paused] = totalPages ? (['study.statusReadingPage', 'study.statusPausedPage'] as const) : (['study.statusReading', 'study.statusPaused'] as const)
    onStatus(state === 'playing' ? tr(reading, vars) : state === 'paused' ? tr(paused, vars) : '')
  }, [state, pos.p, paragraphs.length, totalPages, currentPage, onStatus])

  // Guarda el avance del documento abierto en cada cambio de párrafo.
  useEffect(() => {
    if (!doc || !paragraphs.length) return
    const entry: ReadingEntry = { ...doc, paragraph: pos.p, totalParagraphs: paragraphs.length, page: totalPages ? currentPage : 0, totalPages, finished, updatedAt: Date.now() }
    setHistory((list) => {
      const next = upsertEntry(list, entry)
      saveHistory(next)
      return next
    })
  }, [doc, pos.p, finished, paragraphs.length, totalPages, currentPage])

  // El párrafo que se lee queda siempre a la vista.
  useEffect(() => {
    if (view !== 'read' || state === 'idle') return
    const el = listRef.current?.querySelector<HTMLElement>(`[data-p="${pos.p}"]`)
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    el?.scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' })
  }, [pos.p, state, view])

  const chooseVoice = (uri: string) => {
    setVoiceURI(uri)
    // Con la lectura en marcha, el trozo actual se repite con la voz nueva.
    if (state === 'playing') speak(pos, rate, uri)
    try {
      localStorage.setItem(VOICE_KEY, uri)
    } catch {
      /* almacenamiento bloqueado: se elige de nuevo la próxima vez */
    }
  }

  const speak = (at: Pos, speed = rate, uri = voiceURI) => {
    const id = ++run.current
    speechSynthesis.cancel()
    const chunk = paragraphs[at.p]?.chunks[at.c]
    if (!chunk) return
    const u = new SpeechSynthesisUtterance(chunk)
    const voice = voices.find((v) => v.voiceURI === uri) ?? defaultVoice(voices, uiLang)
    if (voice) {
      u.voice = voice
      u.lang = voice.lang
    }
    u.rate = speed
    u.onend = () => {
      if (id !== run.current) return
      const next = nextPosition(paragraphs, at.p, at.c)
      if (next) speak(next, speed, uri)
      else {
        setState('idle')
        setFinished(true)
        setPos({ p: paragraphs.length - 1, c: 0 })
      }
    }
    u.onerror = (e) => {
      if (id !== run.current || e.error === 'interrupted' || e.error === 'canceled') return
      setState('idle')
      toast(tr('study.speakError'))
    }
    setPos(at)
    setState('playing')
    speechSynthesis.speak(u)
  }

  const start = (p = 0) => {
    if (!paragraphs.length) return
    setResumed(null)
    setView('read')
    setFinished(false)
    if (state === 'idle') track('study_session_started', { mode: 'read_aloud' })
    speak({ p, c: 0 })
  }
  // Pausar cancela y recuerda la posición: más confiable que speechSynthesis.pause() con voces en línea.
  const pause = () => {
    run.current++
    speechSynthesis.cancel()
    setState('paused')
  }
  const stop = () => {
    run.current++
    speechSynthesis.cancel()
    setState('idle')
  }
  const jump = (delta: number) => {
    const p = Math.max(0, Math.min(paragraphs.length - 1, pos.p + delta))
    setFinished(false)
    if (state === 'playing') speak({ p, c: 0 })
    else setPos({ p, c: 0 })
  }
  const changeRate = (r: number) => {
    setRate(r)
    if (state === 'playing') speak({ p: pos.p, c: pos.c }, r)
  }
  // Abrir el editor no mueve la posición (ni el avance guardado): solo cambiar el texto la reinicia.
  const edit = () => {
    stop()
    setView('edit')
  }

  const loadFile = async (file: File | undefined) => {
    if (!file) return
    stop()
    setLoading(true)
    try {
      const kind = kindOf(file)
      let loaded: string | null = null
      let pdfPages: string[] = []
      if (kind === 'pdf') {
        // Si se edita el texto del PDF, se guarda como TXT con el mismo nombre.
        setTxtName(`${file.name.replace(/\.[^.]+$/, '')}.txt`)
        const doc = await openPdf(await file.arrayBuffer())
        try {
          const pages = await extractPagesText(doc)
          pdfPages = pages
          loaded = pages.join('\n\n')
          setPdf({ file, pages })
          setDocView('document')
        } finally {
          await closePdf(doc)
        }
      } else if (kind === 'text') {
        loaded = await file.text()
        setPdf(null)
        setTxtName(/\.txt$/i.test(file.name) ? file.name : `${file.name.replace(/\.[^.]+$/, '')}.txt`)
      } else toast(tr('study.pickPdfTxt'))
      if (loaded !== null) {
        setText(loaded)
        setFinished(false)
        setView(loaded.trim() ? 'read' : 'edit')
        // Si ya se había leído antes, sigue donde quedó.
        const id = documentId(file)
        const kindOfDoc = kind === 'pdf' ? 'pdf' : 'text'
        const count = kindOfDoc === 'pdf' ? toPagedParagraphs(pdfPages).length : toParagraphs(loaded).length
        const before = history.find((e) => e.id === id)
        const p = resumeParagraph(before, count)
        setPos({ p, c: 0 })
        setResumed(p > 0 && before ? (before.totalPages ? tr('study.pageOf', { i: before.page, n: before.totalPages }) : tr('study.paragraphOf', { i: p + 1, n: count })) : null)
        if (loaded.trim()) {
          setDoc({ id, name: file.name, kind: kindOfDoc })
          const listed = upsertEntry(history, { id, name: file.name, kind: kindOfDoc, paragraph: p, totalParagraphs: count, page: 0, totalPages: 0, finished: false, updatedAt: Date.now() })
          void storeFile(id, file).then(() => pruneFiles(listed))
        } else setDoc(null)
      }
    } catch {
      toast(tr('study.cantRead'))
    } finally {
      setLoading(false)
    }
  }

  const continueEntry = async (e: ReadingEntry) => {
    const file = await loadStoredFile(e.id)
    if (file) await loadFile(file)
    else toast(tr('study.historyMissing', { name: e.name }))
  }
  const forget = (e: ReadingEntry) => {
    const next = removeEntry(history, e.id)
    setHistory(next)
    saveHistory(next)
    void pruneFiles(next)
    if (doc?.id === e.id) setDoc(null)
  }

  if (!supported) return <Notice kind="error">{tr('study.unsupported')}</Notice>

  const total = paragraphs.length
  // Resaltados (W-63): del documento abierto ('texto' si es texto pegado).
  const docKey = doc?.id ?? PASTED_ID
  const docLabel = doc?.name ?? tr('study.pastedText')
  const marked = (i: number) => !!paragraphs[i] && isHighlighted(highlights, { docId: docKey, paragraph: i, text: paragraphs[i].text })
  const docMarks = highlights.filter((h) => h.docId === docKey).length
  const toggleMark = () => {
    const para = paragraphs[pos.p]
    if (!para) return
    setHighlights(toggleHighlight(getHighlights(), { docId: docKey, docName: docLabel, paragraph: pos.p, page: para.page ?? 0, text: para.text, at: Date.now() }))
  }
  const pages = pageProgress(currentPage, totalPages, finished)
  const percent = totalPages ? pages.percent : listenedPercent(pos.p, total, finished)
  const active = state !== 'idle' || finished

  const paragraphList = (
    <div className="reading reading-paras" ref={listRef} aria-live="off">
      {paragraphs.map((para, i) => (
        <Fragment key={i}>
          {para.page && para.page !== paragraphs[i - 1]?.page && <div className="page-sep">{tr('study.pageLabel', { n: para.page })}</div>}
          <p data-p={i} className={[i === pos.p && active ? 'is-current' : '', marked(i) ? 'is-marked' : ''].join(' ').trim() || undefined}>
            <button type="button" className="para-btn" title={tr('study.readFromHere', { n: i + 1 })} onClick={() => start(i)}>
              {i === pos.p && state === 'playing'
                ? para.chunks.map((ch, j) => (
                    <span key={j}>{j === pos.c ? <mark>{ch}</mark> : ch} </span>
                  ))
                : para.text}
            </button>
          </p>
        </Fragment>
      ))}
    </div>
  )

  // Barra de progreso y controles: debajo del nombre del documento al leer.
  const playerBar = (
    <div className={'player' + (view === 'read' ? ' is-card' : '')}>
      {view === 'read' && total > 0 && (
        <div className="player-progress">
          <span className="faint">{totalPages ? tr('study.pageOf', { i: currentPage, n: totalPages }) : tr('study.paragraphOf', { i: Math.min(pos.p + 1, total), n: total })}</span>
          <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent} aria-label={tr('study.listened', { n: percent })}>
            <i style={{ width: `${percent}%` }} />
          </div>
          <span className="faint">{totalPages ? tr('study.pagesRead', { r: pages.read, n: totalPages, p: percent }) : tr('study.listened', { n: percent })}</span>
        </div>
      )}
      <div className="player-controls">
        <button type="button" className="icon-btn" aria-label={tr('study.prevParagraph')} disabled={view !== 'read' || pos.p === 0} onClick={() => jump(-1)}>
          <Icon name="back" />
        </button>
        {state === 'playing' ? (
          <button type="button" className="btn btn-primary" onClick={pause}><Icon name="pause" /> {tr('study.pause')}</button>
        ) : (
          <button type="button" className="btn btn-primary" onClick={() => (state === 'paused' ? speak(pos) : start(view === 'read' && !finished ? pos.p : 0))} disabled={!total}>
            <Icon name="play" /> {state === 'paused' ? tr('study.resume') : tr('study.read')}
          </button>
        )}
        <button type="button" className="icon-btn icon-flip" aria-label={tr('study.nextParagraph')} disabled={view !== 'read' || pos.p >= total - 1} onClick={() => jump(1)}>
          <Icon name="back" />
        </button>
        {state !== 'idle' && <button type="button" className="btn btn-soft" onClick={stop}><Icon name="stop" /> {tr('study.stop')}</button>}
        {view === 'read' && total > 0 && (
          <button type="button" className="btn btn-outline btn-sm mark-btn" aria-pressed={marked(pos.p)} onClick={toggleMark}>
            <Icon name="marker" /> {marked(pos.p) ? tr('study.unmarkParagraph') : tr('study.markParagraph')}
          </button>
        )}
        {view === 'read' && docMarks > 0 && (
          <button type="button" className="link-btn" onClick={() => go('estudio', 'notas')}>
            {tr('study.marksInNotes', { n: docMarks })}
          </button>
        )}
      </div>
      {view === 'edit' && total > 0 && <span className="faint">{tr('study.paragraphs', { n: total })}</span>}
    </div>
  )
  const resumedNotice = resumed && !finished && state === 'idle' && (
    <Notice kind="info">
      {tr('study.resumedAt', { where: resumed })}{' '}
      <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setPos({ p: 0, c: 0 }); setResumed(null) }}>
        <Icon name="reset" /> {tr('study.fromStart')}
      </button>
    </Notice>
  )
  const finishedNotice = finished && (
    <Notice kind="success">
      {tr('study.finished')}{' '}
      <button type="button" className="btn btn-soft btn-sm" onClick={() => start(0)}>
        <Icon name="reset" /> {tr('study.readAgain')}
      </button>
    </Notice>
  )

  return (
    <div className="card stack">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <h3>{tr('study.readAloud')}</h3>
        <div className="row read-actions">
          <VoiceMenu voices={voices} value={voiceURI} onChange={chooseVoice} rate={rate} onRate={changeRate} playing={state === 'playing'} />
          {view === 'read' && (
            <button type="button" className="btn btn-outline btn-sm" onClick={edit}>
              <Icon name="edit" /> {tr('study.editText')}
            </button>
          )}
          <button type="button" className="btn btn-soft btn-sm" onClick={() => fileInput.current?.click()} disabled={loading}>
            {loading ? <span className="spinner" /> : <Icon name="open" />} {tr('study.load')}
          </button>
        </div>
        <input ref={fileInput} type="file" hidden accept="application/pdf,text/plain,.txt,.md" onChange={(e) => { void loadFile(e.target.files?.[0]); e.target.value = '' }} />
      </div>

      {view === 'edit' ? (
        <>
          {history.length > 0 && (
            <section className="history" aria-label={tr('study.continueReading')}>
              <h4>{tr('study.continueReading')}</h4>
              <ul className="history-list">
                {history.map((e) => {
                  const pct = entryPercent(e)
                  return (
                    <li key={e.id} className="history-item">
                      <span className={'ico ' + (e.kind === 'pdf' ? 'ico-red' : 'ico-blue')}><Icon name={e.kind === 'pdf' ? 'pdf' : 'text'} /></span>
                      <span className="history-text">
                        <b title={e.name}>{e.name}</b>
                        <span className="faint">
                          {e.finished ? tr('study.readDone') : e.totalPages ? tr('study.pageOf', { i: e.page, n: e.totalPages }) : tr('study.paragraphOf', { i: e.paragraph + 1, n: e.totalParagraphs })} · {pct} %
                        </span>
                        <span className="progress" aria-hidden="true"><i style={{ width: `${pct}%` }} /></span>
                      </span>
                      <button type="button" className="btn btn-soft btn-sm" disabled={loading} onClick={() => void continueEntry(e)}>
                        <Icon name="play" /> {e.finished ? tr('study.readAgain') : tr('study.continue')}
                      </button>
                      <button type="button" className="icon-btn" aria-label={tr('study.removeFromList', { name: e.name })} title={tr('study.removeFromList', { name: e.name })} onClick={() => forget(e)}>
                        <Icon name="trash" />
                      </button>
                    </li>
                  )
                })}
              </ul>
              <small className="faint">{tr('study.historyLocal')}</small>
            </section>
          )}
          <label className="field">
            <span>{tr('study.textToRead')}</span>
            <textarea className="textarea" value={text} placeholder={tr('study.textPh')} onChange={(e) => { setText(e.target.value); setPdf(null); setDoc(null); setPos({ p: 0, c: 0 }); setFinished(false); setResumed(null) }} />
          </label>
          {playerBar}
          {textFile && (
            <section className="stack text-save" aria-label={tr('study.saveText')}>
              <h4>{tr('study.saveText')}</h4>
              <SaveOptions file={textFile} toolName="study_text" />
            </section>
          )}
        </>
      ) : pdf ? (
        <>
          <div className="doc-banner">
            <Icon name="pdf" />
            <span className="doc-banner-text">
              <b title={pdf.file.name}>{pdf.file.name}</b>
              <span className="faint">{tr('study.pagesCount', { n: totalPages })}</span>
            </span>
            <button type="button" className="btn btn-outline btn-sm" title={tr('study.editDocumentHint')} onClick={() => { stop(); handOff(EDIT_PDF, pdf.file); go('pdf', 'editar') }}>
              <Icon name="edit" /> {tr('study.editDocument')}
            </button>
            <Segmented
              label={tr('study.viewMode')}
              value={docView}
              onChange={setDocView}
              options={[
                { value: 'document', label: tr('study.viewDocument') },
                { value: 'text', label: tr('study.viewText') },
              ]}
            />
          </div>
          {playerBar}
          {finishedNotice}
          {resumedNotice}
          {docView === 'document' ? (
            <DocPages file={pdf.file} readingPage={active ? currentPage : null} follow={state === 'playing'} onReadPage={(n) => { const i = firstParagraphOfPage(paragraphs, n); if (i >= 0) start(i) }} />
          ) : (
            paragraphList
          )}
        </>
      ) : (
        <>
          {playerBar}
          {finishedNotice}
          {resumedNotice}
          {paragraphList}
        </>
      )}
    </div>
  )
}

// ── Vista del documento al leer (W-60b): la página que se lee, como en la app ──
function DocPages({ file, readingPage, follow, onReadPage }: { file: File; readingPage: number | null; follow: boolean; onReadPage: (page: number) => void }) {
  const { pages, pageNo, setPageNo, preview, error } = usePdfPreview(file, 900)
  // Mientras suena, la vista sigue a la página que se lee; en pausa se puede recorrer libre.
  useEffect(() => {
    if (follow && readingPage) setPageNo(readingPage)
  }, [follow, readingPage, setPageNo])

  if (error) return <Notice kind="error">{error}</Notice>
  const isReading = readingPage === pageNo
  return (
    <div className="doc-pages">
      <div className={'doc-page' + (isReading ? ' is-reading' : '')}>
        {preview ? (
          <img src={preview.url} alt={tr('study.pageLabel', { n: pageNo })} style={{ aspectRatio: `${preview.widthPt} / ${preview.heightPt}` }} />
        ) : (
          <span className="spinner" />
        )}
        {isReading && <span className="doc-page-badge"><Icon name="volume" /> {tr('study.pageLabel', { n: pageNo })}</span>}
      </div>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <PageNav pageNo={pageNo} pages={pages} onChange={setPageNo} />
        {!isReading && (
          <button type="button" className="btn btn-soft btn-sm" onClick={() => onReadPage(pageNo)}>
            <Icon name="play" /> {tr('study.readThisPage')}
          </button>
        )}
      </div>
    </div>
  )
}

// ── Personajes de voz (W-58): los mismos de la app ───────────────────
const VOICE_KEY = 'ds-study-voice'
const readSavedVoice = () => {
  try {
    return localStorage.getItem(VOICE_KEY) ?? ''
  } catch {
    return ''
  }
}

/** Voces que muestra el selector: las del idioma de la web o, si no hay, todas. */
function shownVoices(voices: SpeechSynthesisVoice[], lang: string, all: boolean) {
  const own = all ? [] : voicesForLanguage(voices, lang)
  return own.length ? own : voicesForLanguage(voices, null)
}
const defaultVoice = (voices: SpeechSynthesisVoice[], lang: string): SpeechSynthesisVoice | undefined => shownVoices(voices, lang, false)[0]

function languageName(code: string, uiLang: string) {
  try {
    return new Intl.DisplayNames([uiLang], { type: 'language' }).of(code) ?? code
  } catch {
    return code
  }
}

function VoiceAvatar({ persona, size }: { persona: VoicePersona; size: number }) {
  return <img className="voice-avatar" src={personaAvatar(persona)} alt="" width={size} height={size} style={{ borderColor: persona.color }} />
}

/** Avatar de la voz en la cabecera de Lectura: al tocarlo se despliega un panel para elegir voz y velocidad. */
function VoiceMenu({ voices, value, onChange, rate, onRate, playing }: { voices: SpeechSynthesisVoice[]; value: string; onChange: (uri: string) => void; rate: number; onRate: (r: number) => void; playing: boolean }) {
  const { lang } = useT()
  const [open, setOpen] = useState(false)
  const [all, setAll] = useState(false)
  const [previewing, setPreviewing] = useState('')
  const box = useRef<HTMLDivElement>(null)
  const shown = useMemo(() => shownVoices(voices, lang, all), [voices, lang, all])
  const personas = useMemo(() => personasForVoices(shown.map((v) => ({ id: v.voiceURI, feminine: guessFeminine(v.name) }))), [shown])
  const selected = voices.find((v) => v.voiceURI === value) ?? shown[0]
  // La voz guardada puede no estar en la lista visible (otro idioma): su personaje se calcula aparte.
  const selectedPersona = selected && (personas.get(selected.voiceURI) ?? personasForVoices([{ id: selected.voiceURI, feminine: guessFeminine(selected.name) }]).get(selected.voiceURI))

  // Se cierra al tocar fuera o con Esc.
  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const detail = (v: SpeechSynthesisVoice) => `${languageName(v.lang, lang)}${v.localService ? '' : ` · ${tr('study.voiceOnline')}`}`

  const preview = (v: SpeechSynthesisVoice, persona: VoicePersona) => {
    speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(tr('study.voiceSample', { name: persona.name }))
    u.voice = v
    u.lang = v.lang
    u.rate = rate
    u.onend = () => setPreviewing('')
    u.onerror = () => setPreviewing('')
    setPreviewing(v.voiceURI)
    speechSynthesis.speak(u)
  }

  if (!voices.length || !selected || !selectedPersona) {
    return (
      <button type="button" className="voice-chip" disabled title={tr('study.noVoices')}>
        <span className="voice-chip-empty"><Icon name="volume" /></span>
        <span className="voice-chip-text"><b>{tr('study.voice')}</b></span>
      </button>
    )
  }

  return (
    <div className="voice-menu" ref={box}>
      <button type="button" className="voice-chip" aria-expanded={open} aria-haspopup="dialog" aria-label={`${tr('study.voiceSettings')}: ${selectedPersona.name}, ${rate.toFixed(1)}×`} onClick={() => setOpen((o) => !o)}>
        <VoiceAvatar persona={selectedPersona} size={32} />
        <span className="voice-chip-text">
          <b>{selectedPersona.name}</b>
          <small>{rate.toFixed(1)}×</small>
        </span>
        <span className="voice-chip-caret" aria-hidden="true"><Icon name="back" /></span>
      </button>
      {open && (
        <div className="voice-pop" role="dialog" aria-label={tr('study.voiceSettings')}>
          <div className="voice-current">
            <VoiceAvatar persona={selectedPersona} size={56} />
            <div className="voice-text">
              <span className="faint">{tr('study.voice')}</span>
              <b>{selectedPersona.name}</b>
              <span className="faint">{detail(selected)}</span>
            </div>
          </div>
          <label className="field">
            <span>{tr('study.speed', { n: rate.toFixed(1) })}</span>
            <input type="range" min={0.6} max={1.8} step={0.1} value={rate} onChange={(e) => onRate(Number(e.target.value))} />
          </label>
          <div className="voice-list" role="radiogroup" aria-label={tr('study.chooseVoice')}>
            {shown.map((v) => {
              const p = personas.get(v.voiceURI)
              if (!p) return null
              const isSel = v.voiceURI === selected.voiceURI
              return (
                <div key={v.voiceURI} className={'voice-row' + (isSel ? ' is-selected' : '')}>
                  <label className="voice-choice">
                    <input type="radio" name="study-voice" checked={isSel} onChange={() => onChange(v.voiceURI)} />
                    <VoiceAvatar persona={p} size={40} />
                    <span className="voice-text">
                      <b>{p.name}</b>
                      <span className="faint" title={v.name}>{detail(v)}</span>
                    </span>
                  </label>
                  {/* Con la lectura en marcha no hay muestra: cortaría la lectura. */}
                  <button type="button" className="icon-btn" aria-label={`${tr('study.voicePreview')}: ${p.name}`} disabled={playing || previewing === v.voiceURI} onClick={() => preview(v, p)}>
                    <Icon name={previewing === v.voiceURI ? 'volume' : 'play'} />
                  </button>
                </div>
              )
            })}
            <label className="voice-all faint">
              <input type="checkbox" checked={all} onChange={(e) => setAll(e.target.checked)} />
              {tr('study.allVoices')}
            </label>
          </div>
          <button type="button" className="btn btn-primary btn-sm" onClick={() => setOpen(false)}>{tr('study.doneChoosing')}</button>
        </div>
      )}
    </div>
  )
}

// ── Notas (guardadas solo en este navegador) ─────────────────────────
type Note = { id: string; text: string; at: number }
const NOTES_KEY = 'ds-notes'
const readNotes = (): Note[] => {
  try {
    const v = JSON.parse(localStorage.getItem(NOTES_KEY) ?? '[]')
    return Array.isArray(v) ? v : []
  } catch {
    return []
  }
}

/** Id de los resaltados de un texto pegado (sin documento). */
const PASTED_ID = 'texto'

function Notes() {
  const { toast } = useApp()
  const [notes, setNotes] = useState<Note[]>(readNotes)
  const highlights = useSyncExternalStore(subscribeHighlights, getHighlights)
  const groups = useMemo(() => groupByDoc(highlights), [highlights])
  const [draft, setDraft] = useState('')
  const [storageOk, setStorageOk] = useState(true)

  useEffect(() => {
    try {
      localStorage.setItem(NOTES_KEY, JSON.stringify(notes))
      setStorageOk(true)
    } catch {
      setStorageOk(false)
    }
  }, [notes])

  const add = () => {
    if (!draft.trim()) return
    setNotes((n) => [{ id: crypto.randomUUID(), text: draft.trim(), at: Date.now() }, ...n])
    setDraft('')
    track('note_created')
  }
  // Un resaltado (o todos los de un documento) pasa a ser una nota con la cita y su origen.
  const source = (h: Highlight) => (h.page ? `${h.docName}, ${tr('study.pageLabel', { n: h.page })}` : h.docName)
  const saveMarks = (items: Highlight[], from: string) => {
    setNotes((n) => [{ id: crypto.randomUUID(), text: quoteNote(items, from), at: Date.now() }, ...n])
    track('note_created', { source: 'highlight' })
    toast(tr('study.markSaved'))
  }

  return (
    <div className="card stack">
      <h3>{tr('study.notes')}</h3>
      <label className="field">
        <span className="sr-only">{tr('study.newNote')}</span>
        <textarea
          className="textarea"
          style={{ minHeight: 100 }}
          value={draft}
          placeholder={tr('study.notePh')}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) add()
          }}
        />
      </label>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <span className="faint">{tr('study.localOnly')}</span>
        <button type="button" className="btn btn-primary" disabled={!draft.trim()} onClick={add}><Icon name="plus" /> {tr('study.saveNote')}</button>
      </div>
      {!storageOk && <Notice kind="error">{tr('study.noStorage')}</Notice>}
      {groups.length > 0 && (
        <section className="marks" aria-label={tr('study.highlightsTitle', { n: highlights.length })}>
          <h4><Icon name="marker" /> {tr('study.highlightsTitle', { n: highlights.length })}</h4>
          {groups.map((g) => (
            <div key={g.docId} className="mark-group">
              <div className="mark-head">
                <b title={g.docName}>{g.docName}</b>
                <span className="row" style={{ gap: 6 }}>
                  {g.items.length > 1 && (
                    <button type="button" className="btn btn-soft btn-sm" onClick={() => saveMarks(g.items, g.docName)}>
                      <Icon name="note" /> {tr('study.saveAllMarks')}
                    </button>
                  )}
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setHighlights(removeDocHighlights(getHighlights(), g.docId))}>
                    <Icon name="trash" /> {tr('study.removeAllMarks')}
                  </button>
                </span>
              </div>
              {g.items.map((h) => (
                <blockquote key={`${h.paragraph}-${h.at}`} className="mark">
                  <p>{h.text}</p>
                  <footer>
                    <span className="faint">{h.page ? tr('study.pageLabel', { n: h.page }) : ''}</span>
                    <span className="row" style={{ gap: 4 }}>
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => saveMarks([h], source(h))}>
                        <Icon name="note" /> {tr('study.saveMark')}
                      </button>
                      <button type="button" className="icon-btn" aria-label={tr('study.removeMark')} onClick={() => setHighlights(removeHighlight(getHighlights(), h))}>
                        <Icon name="close" />
                      </button>
                    </span>
                  </footer>
                </blockquote>
              ))}
            </div>
          ))}
        </section>
      )}
      {notes.length > 0 && (
        <div className="notes">
          {notes.map((n) => (
            <article key={n.id} className="note">
              <p>{n.text}</p>
              <footer>
                <time dateTime={new Date(n.at).toISOString()}>{new Date(n.at).toLocaleString()}</time>
                <button type="button" className="icon-btn" aria-label={tr('study.deleteNote')} onClick={() => setNotes((x) => x.filter((y) => y.id !== n.id))}>
                  <Icon name="trash" />
                </button>
              </footer>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Pomodoro: 25 min de foco, 5 de descanso, 15 cada 4 pomodoros ─────
const FOCUS = 25 * 60
const SHORT = 5 * 60
const LONG = 15 * 60
const CIRC = 2 * Math.PI * 100

function Pomodoro({ onStatus }: { onStatus: Report }) {
  const [phase, setPhase] = useState<'focus' | 'short' | 'long'>('focus')
  const [left, setLeft] = useState(FOCUS)
  const [running, setRunning] = useState(false)
  const [done, setDone] = useState(0)
  const endAt = useRef(0)
  const total = phase === 'focus' ? FOCUS : phase === 'short' ? SHORT : LONG

  useEffect(() => {
    if (!running) return
    endAt.current = Date.now() + left * 1000
    // Se calcula contra el reloj para no desfasarse si la pestaña queda en segundo plano.
    const id = setInterval(() => {
      const remaining = Math.max(0, Math.round((endAt.current - Date.now()) / 1000))
      setLeft(remaining)
      if (remaining === 0) {
        clearInterval(id)
        setRunning(false)
        beep()
        if (phase === 'focus') {
          const count = done + 1
          setDone(count)
          track('pomodoro_completed', { pomodoro_count: count })
          const next = count % 4 === 0 ? 'long' : 'short'
          setPhase(next)
          setLeft(next === 'long' ? LONG : SHORT)
        } else {
          setPhase('focus')
          setLeft(FOCUS)
        }
      }
    }, 250)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running])

  useEffect(() => {
    const base = `${tr('nav.study')} · DocuSmart Web`
    document.title = running ? `${fmt(left)} · ${phase === 'focus' ? tr('study.focus') : tr('study.break')}` : base
    return () => {
      document.title = base
    }
  }, [left, running, phase])

  useEffect(() => {
    onStatus(running ? `${fmt(left)} · ${phase === 'focus' ? tr('study.focused') : phase === 'short' ? tr('study.shortBreak') : tr('study.longBreak')}` : '')
  }, [running, left, phase, onStatus])

  const reset = () => {
    setRunning(false)
    setPhase('focus')
    setLeft(FOCUS)
  }

  return (
    <div className="card">
      <div className="timer-wrap">
        <div className={'timer' + (phase === 'focus' ? '' : ' is-break')}>
          <svg viewBox="0 0 220 220" aria-hidden="true">
            <circle className="track" cx="110" cy="110" r="100" />
            <circle className="prog" cx="110" cy="110" r="100" strokeDasharray={CIRC} strokeDashoffset={CIRC * (left / total)} />
          </svg>
          <div className="timer-label" role="timer" aria-live="off">
            <b>{fmt(left)}</b>
            <small>{phase === 'focus' ? (running ? tr('study.focused') : tr('study.paused')) : phase === 'short' ? tr('study.shortBreak') : tr('study.longBreak')}</small>
          </div>
        </div>
        <div className="row">
          <button type="button" className="btn btn-outline" onClick={reset}><Icon name="reset" /> {tr('study.restart')}</button>
          {running ? (
            <button type="button" className="btn btn-primary" onClick={() => setRunning(false)}><Icon name="pause" /> {tr('study.pause')}</button>
          ) : (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                if (phase === 'focus' && left === FOCUS) track('study_session_started', { mode: 'pomodoro' })
                setRunning(true)
              }}
            >
              <Icon name="play" /> {tr('study.start')}
            </button>
          )}
        </div>
        <div className="row" style={{ gap: 12 }}>
          <span className="faint">{tr('study.done', { n: done })}</span>
          <span className="dots" aria-hidden="true">
            {[0, 1, 2, 3].map((i) => <i key={i} className={i < done % 4 || (done > 0 && done % 4 === 0) ? 'on' : ''} />)}
          </span>
        </div>
        <span className="faint">{tr('study.every4')}</span>
      </div>
    </div>
  )
}

const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

function beep() {
  try {
    const ctx = new AudioContext()
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.frequency.value = 880
    g.gain.setValueAtTime(0.0001, ctx.currentTime)
    g.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.02)
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6)
    o.connect(g).connect(ctx.destination)
    o.start()
    o.stop(ctx.currentTime + 0.65)
  } catch {
    /* sin audio disponible */
  }
}
