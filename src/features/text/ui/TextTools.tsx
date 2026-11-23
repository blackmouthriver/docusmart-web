// Herramientas de texto (W-113): contador de palabras, comparar textos, generador de
// contraseñas y resumir (W-142). Todo en el navegador; nada se envía ni se guarda.
import { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react'
import { go, useApp } from '../../../app/state'
import { Icon, type IconName } from '../../../shared/ui/Icon'
import { BackButton, HeroCard, Notice, Segmented } from '../../../shared/ui/ui'
import { useT } from '../../../shared/i18n/I18n'
import { tr } from '../../../shared/i18n/translate'
import { track } from '../../../shared/platform/analytics'
import type { MessageKey } from '../../../shared/i18n/messages/es'
import { CHAR_LIMITS, durationParts, minWordLength, readability, textStats, topWords } from '../core/stats'
import { DEFAULT_DIFF, diffReport, diffTexts, refineParts, sideBySide, type DiffOptions, type DiffPart } from '../core/textDiff'
import { DEFAULT_PASSPHRASE, DEFAULT_PASSWORD, MAX_LENGTH, MAX_WORDS, MIN_LENGTH, MIN_WORDS, SEPARATORS, entropyBits, generatePassphrase, generatePassword, passphraseBits, passphraseLang, pools, strength, type PassphraseOptions, type PasswordOptions } from '../core/password'
import { detectLanguage } from '../../study/core/summarize'

export type TextToolId = 'contar' | 'comparar' | 'contrasena' | 'resumir'
export const TEXT_TOOLS: readonly TextToolId[] = ['contar', 'comparar', 'contrasena', 'resumir']
// Resumir lee PDF y Word: se carga aparte, solo al abrirla.
const SummaryTool = lazy(() => import('../../summary/ui/SummaryTool').then((m) => ({ default: m.SummaryTool })))
const INFO: Record<TextToolId, { icon: IconName; cls: string }> = {
  contar: { icon: 'text', cls: 'ico-blue' },
  comparar: { icon: 'compare', cls: 'ico-violet' },
  contrasena: { icon: 'lock', cls: 'ico-green' },
  resumir: { icon: 'note', cls: 'ico-amber' },
}
const name = (id: TextToolId) => `tools.text.${id}` as MessageKey
const desc = (id: TextToolId) => `tools.text.${id}.desc` as MessageKey
const isTextTool = (id?: string): id is TextToolId => !!id && (TEXT_TOOLS as readonly string[]).includes(id)

export function TextScreen({ sub }: { sub?: string }) {
  return (
    <>
      <HeroCard title={tr('nav.text')} subtitle={tr('txt.heroSub')} />
      {isTextTool(sub) ? (
        <>
          <BackButton label={tr('txt.back')} onClick={() => go('texto')} />
          <h2 style={{ fontSize: 26, margin: '6px 0 4px' }}>{tr(name(sub))}</h2>
          <p className="muted" style={{ marginBottom: 16 }}>{tr(desc(sub))}</p>
          <TextTool id={sub} />
        </>
      ) : (
        <>
          <h2 className="section-title">{tr('pdf.choose')}</h2>
          <div className="tool-grid">
            {TEXT_TOOLS.map((id) => (
              <button key={id} type="button" className="tool-card" onClick={() => go('texto', id)}>
                <span className={'ico ' + INFO[id].cls}><Icon name={INFO[id].icon} /></span>
                <span>
                  <b>{tr(name(id))}</b>
                  <small>{tr(desc(id))}</small>
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </>
  )
}

export function TextTool({ id }: { id: TextToolId }) {
  if (id === 'comparar') return <CompareTexts />
  if (id === 'contrasena') return <PasswordGenerator />
  if (id === 'resumir')
    return (
      <Suspense fallback={null}>
        <SummaryTool />
      </Suspense>
    )
  return <WordCounter />
}

const FILE_ACCEPT = '.txt,.md,.csv,text/plain,.pdf,application/pdf,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document'

/** Abre un .txt, un PDF o un Word y entrega su texto (auditoría W-146.12; antes solo .txt). */
function OpenTxt({ onText }: { onText: (t: string) => void }) {
  const { toast } = useApp()
  const input = useRef<HTMLInputElement>(null)
  const open = async (f: File) => {
    try {
      const { readDocument } = await import('../../summary/infra/readDocument')
      const { pages, scanned } = await readDocument(f)
      if (scanned) toast(tr('txt.scannedFile'))
      else onText(pages.join('\n\n'))
    } catch {
      toast(tr('sum.cantRead'))
    }
  }
  return (
    <>
      <button type="button" className="btn btn-ghost btn-sm" onClick={() => input.current?.click()}><Icon name="upload" /> {tr('txt.openFile')}</button>
      <input ref={input} type="file" accept={FILE_ACCEPT} hidden aria-label={tr('txt.openFile')} onChange={(e) => { const f = e.target.files?.[0]; if (f) void open(f); e.target.value = '' }} />
    </>
  )
}

/* ───────────── Contador ───────────── */

function WordCounter() {
  const { lang } = useT()
  const [text, setText] = useState('')
  const stats = useMemo(() => textStats(text, lang), [text, lang])
  const top = useMemo(() => topWords(text, lang, 10, minWordLength(lang)), [text, lang])
  // El nivel de lectura usa el idioma del texto (no el de la web).
  const level = useMemo(() => (text.trim() ? readability(text, detectLanguage(text)) : null), [text])
  const time = (min: number) => {
    const d = durationParts(min)
    return tr('txt.duration', { m: d.minutes, s: d.seconds })
  }
  const nf = new Intl.NumberFormat(lang)
  const cells: Array<[MessageKey, string]> = [
    ['txt.words', nf.format(stats.words)],
    ['txt.characters', nf.format(stats.characters)],
    ['txt.charactersNoSpaces', nf.format(stats.charactersNoSpaces)],
    ['txt.sentences', nf.format(stats.sentences)],
    ['txt.paragraphs', nf.format(stats.paragraphs)],
    ['txt.lines', nf.format(stats.lines)],
    ['txt.reading', time(stats.readingMinutes)],
    ['txt.speaking', time(stats.speakingMinutes)],
  ]
  return (
    <div className="stack">
      <div className="card stack">
        <div className="row" style={{ justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
          <label htmlFor="txt-count" style={{ fontWeight: 600 }}>{tr('txt.input')}</label>
          <div className="row" style={{ gap: 6 }}>
            <OpenTxt onText={setText} />
            <button type="button" className="btn btn-ghost btn-sm" disabled={!text} onClick={() => setText('')}><Icon name="trash" /> {tr('txt.clear')}</button>
          </div>
        </div>
        <textarea id="txt-count" className="textarea txt-area" value={text} placeholder={tr('txt.placeholder')} onChange={(e) => setText(e.target.value)} />
        <dl className="txt-stats" aria-live="polite">
          {cells.map(([k, v]) => (
            <div key={k}>
              <dt>{tr(k)}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
        <small className="faint">{tr('txt.privacy')}</small>
      </div>
      <div className="card stack">
        <h3>{tr('txt.readability')}</h3>
        {level ? (
          <div className="stack" style={{ gap: 6 }} data-testid="readability">
            <div className={`pw-strength read-${level.level}`}>
              <i style={{ width: `${Math.max(4, level.score)}%` }} />
              <small>{tr('txt.readabilityScore', { score: level.score, label: tr(`txt.lvl.${level.level}` as MessageKey) })}</small>
            </div>
            <small className="faint">{tr('txt.readabilityHint', { formula: level.formula })}</small>
          </div>
        ) : (
          <small className="faint">{tr('txt.readabilityEmpty')}</small>
        )}
      </div>
      <div className="card stack">
        <h3>{tr('txt.limits')}</h3>
        <ul className="txt-limits" data-testid="char-limits">
          {CHAR_LIMITS.map((l) => {
            const over = stats.characters > l.max
            return (
              <li key={l.id} className={over ? 'is-over' : undefined}>
                <span>{tr(`txt.limit.${l.id}` as MessageKey)}</span>
                <span className="txt-limit-bar"><i style={{ width: `${Math.min(100, (stats.characters / l.max) * 100)}%` }} /></span>
                <b>{nf.format(stats.characters)} / {nf.format(l.max)}</b>
                {over && <small>{tr('txt.limitOver', { n: nf.format(stats.characters - l.max) })}</small>}
              </li>
            )
          })}
        </ul>
      </div>
      <div className="card stack">
        <h3>{tr('txt.top')}</h3>
        {top.length ? (
          <ol className="txt-top">
            {top.map((w) => (
              <li key={w.word}>
                <b>{w.word}</b>
                <span className="faint">{tr('txt.times', { n: w.count })} · {nf.format(w.percent)} %</span>
              </li>
            ))}
          </ol>
        ) : (
          <small className="faint">{tr('txt.topEmpty')}</small>
        )}
      </div>
    </div>
  )
}

/* ───────────── Comparar ───────────── */

function CompareTexts() {
  const { toast } = useApp()
  const [a, setA] = useState('')
  const [b, setB] = useState('')
  const [o, setO] = useState<DiffOptions>(DEFAULT_DIFF)
  const [shown, setShown] = useState<{ a: string; b: string; o: DiffOptions } | null>(null)
  const [view, setView] = useState<'inline' | 'side'>('inline')
  const result = useMemo(() => (shown ? diffTexts(shown.a, shown.b, shown.o) : null), [shown])
  const rows = useMemo(() => (shown && view === 'side' && result && !result.identical ? sideBySide(shown.a, shown.b, shown.o) : null), [shown, view, result])
  const compare = () => {
    setShown({ a, b, o })
    track('text_compare', { by: o.by })
  }
  // Si ya se comparó, cambiar una opción vuelve a comparar.
  useEffect(() => {
    if (shown) setShown((s) => (s ? { ...s, o } : s))
  }, [o])

  return (
    <div className="stack">
      <div className="card stack">
        <div className="txt-pair">
          {([['txt.original', a, setA, 'txt-a'], ['txt.changed', b, setB, 'txt-b']] as const).map(([label, value, set, idAttr]) => (
            <div key={idAttr} className="stack" style={{ gap: 6 }}>
              <div className="row" style={{ justifyContent: 'space-between', gap: 6 }}>
                <label htmlFor={idAttr} style={{ fontWeight: 600 }}>{tr(label)}</label>
                <OpenTxt onText={set} />
              </div>
              <textarea id={idAttr} className="textarea txt-area" value={value} onChange={(e) => set(e.target.value)} />
            </div>
          ))}
        </div>
        <div className="row" style={{ gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <Segmented label={tr('txt.by')} value={o.by} onChange={(v: DiffOptions['by']) => setO({ ...o, by: v })} options={[{ value: 'words', label: tr('txt.byWords') }, { value: 'lines', label: tr('txt.byLines') }]} />
          <label className="check"><input type="checkbox" checked={o.ignoreCase} onChange={(e) => setO({ ...o, ignoreCase: e.target.checked })} /><span>{tr('txt.ignoreCase')}</span></label>
          <label className="check"><input type="checkbox" checked={o.ignoreSpaces} onChange={(e) => setO({ ...o, ignoreSpaces: e.target.checked })} /><span>{tr('txt.ignoreSpaces')}</span></label>
          <label className="check"><input type="checkbox" checked={!!o.ignoreAccents} onChange={(e) => setO({ ...o, ignoreAccents: e.target.checked })} /><span>{tr('txt.ignoreAccents')}</span></label>
        </div>
        <small className="faint">{tr('txt.privacy')}</small>
        <div className="row row-end" style={{ gap: 8 }}>
          <button type="button" className="btn btn-outline" disabled={!a && !b} onClick={() => { setA(b); setB(a); setShown(null) }}><Icon name="convert" /> {tr('txt.swap')}</button>
          <button type="button" className="btn btn-primary" disabled={!a && !b} onClick={compare}><Icon name="compare" /> {tr('txt.compare')}</button>
        </div>
      </div>

      {result && (
        <div className="card stack" aria-live="polite">
          <div className="row" style={{ justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
            <h3>{tr('txt.result')}</h3>
            {!result.identical && (
              <button type="button" className="btn btn-soft btn-sm" onClick={() => void navigator.clipboard.writeText(diffReport(result)).then(() => toast(tr('ocr.copied')))}>
                <Icon name="copy" /> {tr('txt.copyReport')}
              </button>
            )}
          </div>
          {result.identical ? (
            <Notice kind="success">{tr('txt.identical')}</Notice>
          ) : (
            <>
              <p className="muted">{tr('txt.summary', { added: result.added, removed: result.removed, pct: result.similarity })}</p>
              {result.tooDifferent && <Notice kind="info">{tr('txt.tooDifferent')}</Notice>}
              <div className="row" style={{ justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                <p className="compare-legend"><del className="diff-del">{tr('txt.legendDel')}</del> <ins className="diff-ins">{tr('txt.legendIns')}</ins></p>
                <Segmented label={tr('txt.view')} value={view} onChange={setView} options={[{ value: 'inline', label: tr('txt.viewInline') }, { value: 'side', label: tr('txt.viewSide') }]} />
              </div>
              {rows ? (
                <div className="txt-side" role="table" aria-label={tr('txt.viewSide')}>
                  {rows.map((r, i) => (
                    <div key={i} role="row" className={'txt-side-row' + (r.changed ? ' is-changed' : '')}>
                      <span role="cell" className="txt-side-n">{r.left?.n ?? ''}</span>
                      <span role="cell" className={'txt-side-cell' + (r.left ? '' : ' is-empty')}>{r.left && <DiffParts parts={r.left.parts} />}</span>
                      <span role="cell" className="txt-side-n">{r.right?.n ?? ''}</span>
                      <span role="cell" className={'txt-side-cell' + (r.right ? '' : ' is-empty')}>{r.right && <DiffParts parts={r.right.parts} />}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="txt-diff">
                  <DiffParts parts={refineParts(result.parts)} />
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

/** Lo borrado tachado en rojo y lo agregado en verde; lo demás, tal cual. */
function DiffParts({ parts }: { parts: readonly DiffPart[] }) {
  return (
    <>
      {parts.map((p, i) => (p.type === 'del' ? <del key={i} className="diff-del">{p.text}</del> : p.type === 'ins' ? <ins key={i} className="diff-ins">{p.text}</ins> : <span key={i}>{p.text}</span>))}
    </>
  )
}

/* ───────────── Contraseñas ───────────── */

type PassMode = 'password' | 'phrase'

function PasswordGenerator() {
  const [mode, setMode] = useState<PassMode>('password')
  return (
    <div className="stack">
      <div className="card stack">
        <Segmented<PassMode> label={tr('txt.mode')} value={mode} onChange={setMode} options={[{ value: 'password', label: tr('txt.modePassword') }, { value: 'phrase', label: tr('txt.modePhrase') }]} />
      </div>
      {mode === 'password' ? <RandomPassword /> : <Passphrase />}
    </div>
  )
}

/** Resultado con copiar, generar otra y la barra de fuerza. */
function PassOutput({ value, bits, onNew, error }: { value: string; bits: number; onNew: () => void; error?: string }) {
  const { toast } = useApp()
  const level = strength(bits)
  return (
    <>
      <div className="pw-out">
        <output aria-label={tr('tools.text.contrasena')} className="pw-value">{error ? '—' : value}</output>
        <div className="row" style={{ gap: 6 }}>
          <button type="button" className="btn btn-soft btn-sm" disabled={!!error || !value} onClick={() => void navigator.clipboard.writeText(value).then(() => toast(tr('txt.copied')))}><Icon name="copy" /> {tr('txt.copy')}</button>
          <button type="button" className="btn btn-primary btn-sm" disabled={!!error} onClick={onNew}><Icon name="reset" /> {tr('txt.generate')}</button>
        </div>
      </div>
      {error ? (
        <Notice kind="error">{error}</Notice>
      ) : (
        <div className={`pw-strength pw-${level}`}>
          <i style={{ width: `${Math.min(100, (bits / 128) * 100)}%` }} />
          <small>{tr('txt.strength', { label: tr(`txt.s.${level}` as MessageKey), bits })}</small>
        </div>
      )}
    </>
  )
}

function RandomPassword() {
  const [o, setO] = useState<PasswordOptions>(DEFAULT_PASSWORD)
  const [password, setPassword] = useState(() => generatePassword(DEFAULT_PASSWORD))
  const valid = pools(o).length > 0
  const regenerate = (next: PasswordOptions) => {
    setO(next)
    setPassword(generatePassword(next))
  }
  const toggles: Array<[keyof PasswordOptions, MessageKey]> = [
    ['lower', 'txt.lower'],
    ['upper', 'txt.upper'],
    ['digits', 'txt.digits'],
    ['symbols', 'txt.symbols'],
    ['avoidAmbiguous', 'txt.ambiguous'],
  ]
  return (
    <div className="card stack">
      <PassOutput value={password} bits={entropyBits(o)} error={valid ? undefined : tr('txt.pickOne')} onNew={() => { setPassword(generatePassword(o)); track('password_generated', { length: o.length }) }} />
      <label className="field">
        <span>{tr('txt.length', { n: o.length })}</span>
        <input type="range" min={MIN_LENGTH} max={MAX_LENGTH} value={o.length} onChange={(e) => regenerate({ ...o, length: Number(e.target.value) })} />
      </label>
      <div className="stack" style={{ gap: 6 }}>
        {toggles.map(([k, label]) => (
          <label key={k} className="check">
            <input type="checkbox" checked={o[k] as boolean} onChange={(e) => regenerate({ ...o, [k]: e.target.checked })} />
            <span>{tr(label)}</span>
          </label>
        ))}
      </div>
      <label className="field">
        <span>{tr('txt.exclude')}</span>
        <input className="input" value={o.exclude ?? ''} maxLength={60} placeholder={tr('txt.excludePh')} autoComplete="off" spellCheck={false} onChange={(e) => regenerate({ ...o, exclude: e.target.value })} />
      </label>
      <small className="faint">{tr('txt.passNote')}</small>
    </div>
  )
}

function Passphrase() {
  const { lang: uiLang } = useT()
  const [o, setO] = useState<PassphraseOptions>(DEFAULT_PASSPHRASE)
  const [wordsLang, setWordsLang] = useState<'es' | 'en'>(() => passphraseLang(uiLang))
  const [list, setList] = useState<readonly string[]>([])
  const [phrase, setPhrase] = useState('')
  // Las listas de palabras se cargan solo al elegir "Frase" (no pesan en el resto de la web).
  useEffect(() => {
    let alive = true
    const load = wordsLang === 'es' ? import('../core/words/es') : import('../core/words/en')
    void load.then((m) => {
      if (!alive) return
      setList(m.default)
      setPhrase(generatePassphrase(o, m.default))
    })
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo al cambiar el idioma de las palabras.
  }, [wordsLang])
  const update = (next: PassphraseOptions) => {
    setO(next)
    if (list.length) setPhrase(generatePassphrase(next, list))
  }
  const sepLabel = (sep: string) => (sep === ' ' ? tr('txt.sepSpace') : sep)
  return (
    <div className="card stack">
      <PassOutput value={phrase} bits={passphraseBits(o, list.length)} onNew={() => { setPhrase(generatePassphrase(o, list)); track('password_generated', { length: o.words, kind: 'phrase' }) }} />
      <label className="field">
        <span>{tr('txt.wordCount', { n: o.words })}</span>
        <input type="range" min={MIN_WORDS} max={MAX_WORDS} value={o.words} onChange={(e) => update({ ...o, words: Number(e.target.value) })} />
      </label>
      <div className="field">
        <span>{tr('txt.separator')}</span>
        <Segmented label={tr('txt.separator')} value={o.separator} onChange={(separator: string) => update({ ...o, separator })} options={SEPARATORS.map((sep) => ({ value: sep, label: sepLabel(sep) }))} />
      </div>
      <div className="field">
        <span>{tr('txt.wordsLang')}</span>
        <Segmented<'es' | 'en'> label={tr('txt.wordsLang')} value={wordsLang} onChange={setWordsLang} options={[{ value: 'es', label: 'Español' }, { value: 'en', label: 'English' }]} />
      </div>
      <div className="stack" style={{ gap: 6 }}>
        <label className="check"><input type="checkbox" checked={o.capitalize} onChange={(e) => update({ ...o, capitalize: e.target.checked })} /><span>{tr('txt.capitalize')}</span></label>
        <label className="check"><input type="checkbox" checked={o.number} onChange={(e) => update({ ...o, number: e.target.checked })} /><span>{tr('txt.addNumber')}</span></label>
      </div>
      <small className="faint">{tr('txt.phraseNote', { n: list.length })}</small>
    </div>
  )
}
