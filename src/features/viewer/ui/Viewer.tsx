import { useEffect, useRef, useState } from 'react'
import { go, useApp } from '../../../app/state'
import { Icon } from '../../../shared/ui/Icon'
import { DropZone, Notice, Progress, errorMessage } from '../../../shared/ui/ui'
import { kindOf } from '../../../shared/files/files'
import { closePdf, openPdf, renderPage } from '../../../shared/pdf/pdf'
import { track } from '../../../shared/platform/analytics'
import { tr } from '../../../shared/i18n/translate'

const ZOOMS = [0.6, 0.8, 1, 1.25, 1.5]

export function Viewer() {
  const { openFile, setOpenFile } = useApp()

  if (!openFile) {
    return (
      <>
        <h1 style={{ fontSize: 28, marginBottom: 16 }}>{tr('nav.viewer')}</h1>
        <DropZone
          accept="application/pdf,image/*,text/plain,.txt,.csv,.md"
          title={tr('viewer.title')}
          hint={tr('viewer.hint')}
          onFiles={([f]) => {
            setOpenFile(f)
            track('document_opened', { document_type: kindOf(f) })
          }}
        />
      </>
    )
  }

  const kind = kindOf(openFile)
  return (
    <>
      <div className="viewer-bar">
        <button type="button" className="icon-btn" aria-label={tr('viewer.backHome')} onClick={() => go('')}>
          <Icon name="back" />
        </button>
        <span className="title" title={openFile.name}>
          {openFile.name}
        </span>
        <button type="button" className="btn btn-soft btn-sm" onClick={() => setOpenFile(null)}>
          {tr('settings.close')}
        </button>
      </div>
      {kind === 'pdf' && <PdfView file={openFile} />}
      {kind === 'image' && <ImageView file={openFile} />}
      {kind === 'text' && <TextView file={openFile} />}
      {kind === 'other' && <Notice kind="error">{tr('viewer.unsupported')}</Notice>}
    </>
  )
}

function PdfView({ file }: { file: File }) {
  const host = useRef<HTMLDivElement>(null)
  const [zoom, setZoom] = useState(2)
  const [progress, setProgress] = useState(0)
  const [pages, setPages] = useState(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const el = host.current
    if (!el) return
    el.replaceChildren()
    setError(null)
    setProgress(0)
    void (async () => {
      try {
        const doc = await openPdf(await file.arrayBuffer())
        if (cancelled) return void closePdf(doc)
        setPages(doc.numPages)
        const width = Math.min(860, el.clientWidth || 860) * ZOOMS[zoom] * Math.min(2, devicePixelRatio || 1)
        for (let i = 1; i <= doc.numPages && !cancelled; i++) {
          const canvas = await renderPage(doc, i, width)
          canvas.style.maxWidth = `${860 * ZOOMS[zoom]}px`
          canvas.setAttribute('aria-label', tr('viewer.pageN', { n: i }))
          if (!cancelled) el.appendChild(canvas)
          setProgress(i / doc.numPages)
        }
        await closePdf(doc)
      } catch (e) {
        if (!cancelled) setError(errorMessage(e))
      }
    })()
    return () => {
      cancelled = true
    }
  }, [file, zoom])

  return (
    <>
      <div className="row" style={{ justifyContent: 'space-between', margin: '4px 0 8px' }}>
        <span className="faint">{pages ? (pages === 1 ? tr('common.onePage') : tr('common.pagesCount', { n: pages })) : tr('common.loading')}</span>
        <div className="row" style={{ gap: 4 }}>
          <button type="button" className="icon-btn" aria-label={tr('viewer.zoomOut')} disabled={zoom === 0} onClick={() => setZoom((z) => z - 1)}>
            <Icon name="downArrow" />
          </button>
          <span className="faint" style={{ minWidth: 44, textAlign: 'center' }}>
            {Math.round(ZOOMS[zoom] * 100)}%
          </span>
          <button type="button" className="icon-btn" aria-label={tr('viewer.zoomIn')} disabled={zoom === ZOOMS.length - 1} onClick={() => setZoom((z) => z + 1)}>
            <Icon name="up" />
          </button>
        </div>
      </div>
      {error && <Notice kind="error">{error}</Notice>}
      {!error && progress < 1 && <Progress value={progress} />}
      <div className="pages" ref={host} />
    </>
  )
}

function ImageView({ file }: { file: File }) {
  const [url, setUrl] = useState<string>()
  useEffect(() => {
    const u = URL.createObjectURL(file)
    setUrl(u)
    return () => URL.revokeObjectURL(u)
  }, [file])
  return <div className="pages">{url && <img src={url} alt={file.name} />}</div>
}

function TextView({ file }: { file: File }) {
  const [text, setText] = useState('')
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    setFailed(false)
    file
      .text()
      .then(setText)
      .catch(() => setFailed(true))
  }, [file])
  if (failed) return <Notice kind="error">{tr('viewer.textError')}</Notice>
  return <pre className="text-view">{text}</pre>
}
