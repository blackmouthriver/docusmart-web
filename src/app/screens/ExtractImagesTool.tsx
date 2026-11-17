// Extraer imágenes: saca las fotos y gráficos incrustados en un PDF con su calidad original.
import { useEffect, useMemo, useState } from 'react'
import { Icon } from '../components/Icon'
import { BusyButton, DropZone, FileRow, Notice, errorMessage } from '../components/ui'
import { baseName, download, formatBytes } from '../lib/files'
import { BeforeAfter } from '../components/DocPreview'
import { bundleFiles, resultFile } from '../lib/share'
import { tr } from '../i18n/translate'
import type { ExtractResult } from '../lib/pdfImages'
import { track } from '../../shared/analytics'

type Item = ExtractResult['images'][number] & { url: string; name: string }
const MIN_SIZE = 40

export function ExtractImagesTool() {
  const [file, setFile] = useState<File | null>(null)
  const [skipSmall, setSkipSmall] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [items, setItems] = useState<Item[] | null>(null)
  const [info, setInfo] = useState({ skipped: 0, small: 0 })
  const [selected, setSelected] = useState<Set<number>>(new Set())

  // Liberar las miniaturas al cambiar de resultado o salir.
  useEffect(() => () => items?.forEach((i) => URL.revokeObjectURL(i.url)), [items])

  const reset = (f: File | null) => {
    setFile(f)
    setItems(null)
    setError(null)
  }

  const run = async () => {
    if (!file) return
    setBusy(true)
    setError(null)
    setItems(null)
    try {
      const { extractImages } = await import('../lib/pdfImages')
      const r = await extractImages(await file.arrayBuffer(), { minSize: skipSmall ? MIN_SIZE : 0 })
      const base = baseName(file.name)
      const list = r.images.map((img) => ({
        ...img,
        name: `${base}-pagina-${img.page}-imagen-${img.index}.${img.format}`,
        url: URL.createObjectURL(new Blob([img.data as BlobPart], { type: img.format === 'jpg' ? 'image/jpeg' : 'image/png' })),
      }))
      setItems(list)
      setInfo({ skipped: r.skipped, small: r.small })
      setSelected(new Set(list.map((_, i) => i)))
      track('pdf_tool_used', { tool_name: 'extract_images' })
    } catch (e) {
      setError(/encrypt|password/i.test(String(e)) ? tr('err.lockedPdf') : errorMessage(e))
      track('app_error', { error_context: 'pdf_tool_extract_images', error_message: e instanceof Error ? e.name : 'error' })
    } finally {
      setBusy(false)
    }
  }

  const chosen = items?.filter((_, i) => selected.has(i)) ?? []
  /** Las imágenes elegidas como archivos, y lo que se guarda (la imagen o un ZIP). */
  const chosenFiles = useMemo(
    () => (items ?? []).filter((_, i) => selected.has(i)).map((img) => resultFile(img.data, img.name, img.format === 'jpg' ? 'image/jpeg' : 'image/png')),
    [items, selected],
  )
  const [bundle, setBundle] = useState<File | null>(null)
  useEffect(() => {
    let alive = true
    setBundle(null)
    void bundleFiles(chosenFiles, `${file ? baseName(file.name) : 'pdf'}-imagenes.zip`).then((b) => alive && setBundle(b))
    return () => {
      alive = false
    }
  }, [chosenFiles, file])
  const toggle = (i: number) =>
    setSelected((s) => {
      const n = new Set(s)
      if (n.has(i)) n.delete(i)
      else n.add(i)
      return n
    })

  return (
    <div className="stack">
      <div className="card stack">
        {file ? (
          <ul className="file-list" style={{ marginTop: 0 }}>
            <FileRow file={file} actions={<button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={() => reset(null)}>{tr('common.change')}</button>} />
          </ul>
        ) : (
          <DropZone accept="application/pdf" title={tr('common.pickPdf')} hint={tr('common.dragHere')} onFiles={([f]) => reset(f)} />
        )}
        <label className="check">
          <input type="checkbox" checked={skipSmall} onChange={(e) => { setSkipSmall(e.target.checked); setItems(null) }} />
          <span>{tr('img.skipSmall', { n: MIN_SIZE })}</span>
        </label>
        <small className="faint">{tr('img.jpegNote')}</small>
        {file && (
          <BeforeAfter
            original={file}
            result={null}
            results={items ? chosenFiles : undefined}
            saveAs={bundle}
            labels={[tr('img.labelPdf'), tr('img.labelImages')]}
            toolName="extract_images"
            title={tr('img.title')}
            previewTitle={tr('common.previewPdf')}
            placeholder={busy ? tr('img.busy') : items && !items.length ? tr('img.noneFound') : tr('img.press')}
            summary={
              <Notice kind="success">
                {chosenFiles.length === 1 ? tr('img.willSaveOne') : tr('img.willSaveMany', { n: chosenFiles.length })}
              </Notice>
            }
          />
        )}
        {error && <Notice kind="error">{error}</Notice>}
        <div className="row row-end">
          <BusyButton busy={busy} disabled={!file} onClick={run} icon="image">
            {tr('img.go')}
          </BusyButton>
        </div>
      </div>

      {items && (
        <div className="card stack" aria-live="polite">
          {items.length ? (
            <>
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <h3>{items.length === 1 ? tr('img.countOne') : tr('img.countMany', { n: items.length })}</h3>
                <div className="row" style={{ gap: 6 }}>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setSelected(selected.size === items.length ? new Set() : new Set(items.map((_, i) => i)))}>
                    {selected.size === items.length ? tr('img.unselect') : tr('img.selectAll')}
                  </button>
                  <span className="faint">{tr('img.chosen', { n: chosen.length })}</span>
                </div>
              </div>
              <div className="img-grid">
                {items.map((img, i) => (
                  <figure key={img.name} className={'img-card' + (selected.has(i) ? ' is-selected' : '')}>
                    <button type="button" className="img-thumb" aria-pressed={selected.has(i)} aria-label={tr('img.toggle', { n: i + 1 })} onClick={() => toggle(i)}>
                      <img src={img.url} alt={tr('img.alt', { n: img.index, page: img.page })} loading="lazy" />
                      <span className="img-check" aria-hidden="true"><Icon name="check" /></span>
                    </button>
                    <figcaption>
                      <span>
                        <b>Pág. {img.page}</b> · {img.width}×{img.height} · {img.format.toUpperCase()} · {formatBytes(img.data.length)}
                      </span>
                      <button type="button" className="icon-btn" aria-label={tr('img.downloadOne', { name: img.name })} onClick={() => download(img.data, img.name, img.format === 'jpg' ? 'image/jpeg' : 'image/png')}>
                        <Icon name="download" />
                      </button>
                    </figcaption>
                  </figure>
                ))}
              </div>
            </>
          ) : (
            <Notice kind="info">
              {info.small ? tr('img.noBigImages') : tr('img.noImages')}{' '}
              <a href="/pdf-a-jpg">{tr('img.pdfToImage')}</a>.
            </Notice>
          )}
          {info.skipped > 0 && (
            <Notice kind="plain">
              {info.skipped === 1 ? tr('img.skippedOne') : tr('img.skippedMany', { n: info.skipped })}
            </Notice>
          )}
          {info.small > 0 && items.length > 0 && <small className="faint">{info.small === 1 ? tr('img.smallOne') : tr('img.smallMany', { n: info.small })}</small>}
        </div>
      )}
    </div>
  )
}
