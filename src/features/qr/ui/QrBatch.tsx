// Varios QR desde una lista (W-147.8): una línea por QR (o un CSV con el contenido y el nombre),
// con el mismo diseño que el QR de arriba. Salen en un ZIP de PNG o en una hoja A4 para imprimir.
import { useEffect, useMemo, useRef, useState } from 'react'
import { Icon } from '../../../shared/ui/Icon'
import { BusyButton, Notice, Progress, Segmented } from '../../../shared/ui/ui'
import { SaveOptions } from '../../../shared/ui/DocPreview'
import { bundleFiles, resultFile } from '../../../shared/files/share'
import { tr } from '../../../shared/i18n/translate'
import { track } from '../../../shared/platform/analytics'
import { MAX_LIST, itemFileName, parseQrList } from '../core/qrList'
import { QR_SHEET_CM, QR_SIZES, sheetLayout, type QrSize } from '../core/qrDesign'

export type QrDesign = { color: string; background: string; logo: File | null; size: QrSize }

const dataUrlBytes = (url: string) => Uint8Array.from(atob(url.split(',')[1] ?? ''), (c) => c.charCodeAt(0))

export function QrBatch({ design, disabled }: { design: QrDesign; disabled: boolean }) {
  const [text, setText] = useState('')
  const [format, setFormat] = useState<'sheet' | 'zip'>('sheet')
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState<number | null>(null)
  const [output, setOutput] = useState<File | null>(null)
  const [previews, setPreviews] = useState<string[]>([])
  const [skipped, setSkipped] = useState<number[]>([])
  const [error, setError] = useState<string | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)
  const { items, truncated } = useMemo(() => parseQrList(text), [text])
  // Cualquier cambio en la lista, el formato o el diseño invalida el resultado.
  useEffect(() => {
    setOutput(null)
    setPreviews([])
    setSkipped([])
  }, [text, format, design.color, design.background, design.logo, design.size])

  const load = async (file: File | undefined) => {
    if (!file) return
    setText(await file.text())
  }

  const create = async () => {
    setBusy(true)
    setError(null)
    setProgress(0)
    try {
      const [{ renderQr }, { qrMatrix, qrSheetPdf }] = await Promise.all([import('../infra/qrRender'), import('../core/qrPdf')])
      const bad: number[] = []
      const ok: Array<{ index: number; content: string; label: string }> = []
      // Las líneas que no caben en un QR se saltan y se avisan.
      items.forEach((it, i) => {
        try {
          qrMatrix(it.content, !!design.logo)
          ok.push({ index: i, ...it })
        } catch {
          bad.push(i + 1)
        }
      })
      setSkipped(bad)
      const shown: string[] = []
      if (format === 'zip') {
        const used = new Set<string>()
        const files: File[] = []
        for (const [k, it] of ok.entries()) {
          const url = await renderQr(it.content, { color: design.color, background: design.background, size: QR_SIZES[design.size], logo: design.logo })
          if (shown.length < 6) shown.push(url)
          files.push(resultFile(dataUrlBytes(url), itemFileName(it, it.index, used), 'image/png'))
          setProgress((k + 1) / ok.length)
        }
        setOutput(await bundleFiles(files, 'docusmart-qr.zip'))
      } else {
        const { circleLogoPng } = await import('../infra/qrRender')
        const pdf = await qrSheetPdf(
          ok.map((it) => ({ matrix: qrMatrix(it.content, !!design.logo), label: it.label || it.content })),
          { dark: design.color, background: design.background, cm: QR_SHEET_CM[design.size], logoPng: design.logo ? await circleLogoPng(design.logo) : null, title: 'QR' },
        )
        for (const it of ok.slice(0, 6)) shown.push(await renderQr(it.content, { color: design.color, background: design.background, size: 256, logo: design.logo }))
        setOutput(resultFile(pdf, 'docusmart-qr.pdf', 'application/pdf'))
      }
      setPreviews(shown)
      track('qr_created', { qr_content_type: 'batch', format, count: ok.length })
    } catch {
      setError(tr('qr.batchError'))
    } finally {
      setBusy(false)
      setProgress(null)
    }
  }

  const layout = sheetLayout(QR_SHEET_CM[design.size])
  const perSheet = layout.cols * layout.rows

  return (
    <details className="qr-design qr-batch">
      <summary><Icon name="copy" /> {tr('qr.batchTitle')}</summary>
      <div className="stack">
        <small className="faint">{tr('qr.batchHint')}</small>
        <label className="field">
          <span>{tr('qr.batchList')}</span>
          <textarea className="textarea" style={{ minHeight: 120 }} value={text} placeholder={'https://ejemplo.com/mesa/1;Mesa 1\nhttps://ejemplo.com/mesa/2;Mesa 2'} onChange={(e) => setText(e.target.value)} />
        </label>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <button type="button" className="btn btn-soft btn-sm" onClick={() => fileInput.current?.click()}><Icon name="upload" /> {tr('qr.batchFile')}</button>
          <input ref={fileInput} type="file" accept=".csv,.txt,text/csv,text/plain" hidden onChange={(e) => { void load(e.target.files?.[0]); e.target.value = '' }} />
          {items.length > 0 && <small className="faint">{items.length === 1 ? tr('qr.batchCountOne') : tr('qr.batchCount', { n: items.length })}</small>}
        </div>
        {truncated && <Notice kind="plain">{tr('qr.batchTruncated', { n: MAX_LIST })}</Notice>}
        <div className="field">
          <span aria-hidden="true">{tr('qr.batchFormat')}</span>
          <Segmented label={tr('qr.batchFormat')} value={format} onChange={setFormat} options={[{ value: 'sheet', label: tr('qr.batchSheet') }, { value: 'zip', label: tr('qr.batchZip') }]} />
          <small className="faint">{format === 'sheet' ? tr('qr.batchSheetHint', { cm: QR_SHEET_CM[design.size], n: perSheet }) : tr('qr.batchZipHint', { px: QR_SIZES[design.size] })}</small>
        </div>
        {progress !== null && <Progress value={progress} />}
        {error && <Notice kind="error">{error}</Notice>}
        <div className="row row-end">
          <BusyButton busy={busy} disabled={!items.length || disabled} onClick={create} icon="qr">
            {items.length === 1 ? tr('qr.batchGoOne') : tr('qr.batchGo', { n: items.length })}
          </BusyButton>
        </div>
        {!!skipped.length && <Notice kind="plain">{tr('qr.batchSkipped', { list: skipped.join(', ') })}</Notice>}
        {output && (
          <>
            <Notice kind="success">{tr('qr.batchDone', { n: items.length - skipped.length })}</Notice>
            <div className="qr-batch-previews" aria-hidden="true">
              {previews.map((u, i) => <img key={i} src={u} alt="" />)}
            </div>
            <SaveOptions file={output} toolName="qr" />
          </>
        )}
      </div>
    </details>
  )
}
