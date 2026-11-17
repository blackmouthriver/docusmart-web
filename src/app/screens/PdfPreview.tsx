// Abre un PDF y dibuja una página para mostrarla de fondo (Recortar, Firmar…).
import { useEffect, useRef, useState } from 'react'
import type { PDFDocumentProxy } from 'pdfjs-dist'
import { errorMessage } from '../components/ui'
import { Icon } from '../components/Icon'
import { closePdf, openPdf, renderPage } from '../lib/pdf'
import { tr } from '../i18n/translate'

export type PagePreview = { url: string; widthPt: number; heightPt: number }

export function usePdfPreview(file: Blob | null, previewWidth = 900, initialPage = 1, password?: string) {
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null)
  const [pageNo, setPageNo] = useState(initialPage)
  const [preview, setPreview] = useState<PagePreview | null>(null)
  const [error, setError] = useState<string | null>(null)
  /** El canvas de la página actual, por si hay que leer sus pixeles. */
  const canvas = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    setDoc(null)
    setPreview(null)
    setPageNo(initialPage)
    setError(null)
    if (!file) return
    let cancelled = false
    let opened: PDFDocumentProxy | null = null
    void (async () => {
      try {
        opened = await openPdf(await file.arrayBuffer(), password)
        if (cancelled) await closePdf(opened)
        else {
          setPageNo((n) => Math.min(Math.max(1, n), opened!.numPages))
          setDoc(opened)
        }
      } catch (e) {
        if (!cancelled) setError(/password/i.test(String(e)) ? tr('err.passwordPdf') : errorMessage(e))
      }
    })()
    return () => {
      cancelled = true
      if (opened) void closePdf(opened)
    }
  }, [file])

  useEffect(() => {
    if (!doc) return
    let cancelled = false
    void (async () => {
      const page = await doc.getPage(pageNo)
      const vp = page.getViewport({ scale: 1 })
      const c = await renderPage(doc, pageNo, previewWidth, 'print')
      if (cancelled) return
      canvas.current = c
      setPreview({ url: c.toDataURL('image/jpeg', 0.85), widthPt: vp.width, heightPt: vp.height })
    })().catch((e) => !cancelled && setError(errorMessage(e)))
    return () => {
      cancelled = true
    }
  }, [doc, pageNo, previewWidth])

  return { doc, pages: doc?.numPages ?? 0, ready: !!doc, pageNo, setPageNo, preview, canvas, error, setError }
}

/** "‹ Página 2 de 5 ›" para recorrer las páginas de la vista previa. */
export function PageNav({ pageNo, pages, onChange }: { pageNo: number; pages: number; onChange: (n: number) => void }) {
  if (pages < 2) return <span />
  return (
    <div className="row" style={{ gap: 4 }}>
      <button type="button" className="icon-btn" aria-label={tr('nav.prevPage')} disabled={pageNo === 1} onClick={() => onChange(pageNo - 1)}><Icon name="back" /></button>
      <span className="faint">{tr('nav.pageOf', { n: pageNo, total: pages })}</span>
      <button type="button" className="icon-btn" aria-label={tr('nav.nextPage')} disabled={pageNo === pages} onClick={() => onChange(pageNo + 1)} style={{ transform: 'scaleX(-1)' }}><Icon name="back" /></button>
    </div>
  )
}
