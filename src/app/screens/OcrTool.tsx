// OCR: reconocer el texto de imágenes y PDF escaneados (Tesseract en el navegador).
import { useState } from 'react'
import { useApp } from '../state'
import { Icon } from '../components/Icon'
import { BusyButton, DropZone, FileRow, Notice, Progress, Segmented } from '../components/ui'
import { baseName, download } from '../lib/files'
import type { OcrLang, OcrProgress, OcrResult } from '../lib/ocr'
import { track } from '../../shared/analytics'

export function OcrTool() {
  const { toast } = useApp()
  const [file, setFile] = useState<File | null>(null)
  const [lang, setLang] = useState<OcrLang>('spa')
  const [wantPdf, setWantPdf] = useState(true)
  const [progress, setProgress] = useState<OcrProgress | null>(null)
  const [result, setResult] = useState<OcrResult | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const run = async () => {
    if (!file) return
    setBusy(true)
    setError(null)
    setResult(null)
    setProgress({ page: 1, pages: 1, fraction: 0, stage: 'preparando' })
    const [{ runOcr }, { sourceFromFile }] = await Promise.all([import('../lib/ocr'), import('../lib/ocrSources')])
    let source: Awaited<ReturnType<typeof sourceFromFile>> | null = null
    try {
      source = await sourceFromFile(file)
      const r = await runOcr(source.pages, { lang, wantPdf, onProgress: setProgress })
      setResult(r)
      track('ocr_done', { lang, pages: r.pages, pdf: wantPdf, confidence: r.confidence })
      if (!r.text.trim()) setError('No se encontró texto. Prueba con una imagen más nítida o con más resolución.')
      else toast('Texto reconocido.')
    } catch (e) {
      const msg = e instanceof Error ? e.message : ''
      setError(/password|encrypt/i.test(msg) ? 'Este PDF tiene contraseña. Quítala primero con "Desbloquear PDF".' : 'No se pudo reconocer el archivo. Revisa que sea una imagen o un PDF válido.')
      track('app_error', { error_context: 'ocr', error_message: e instanceof Error ? e.name : 'error' })
    } finally {
      await source?.close()
      setBusy(false)
      setProgress(null)
    }
  }

  const status = progress
    ? progress.stage === 'preparando'
      ? 'Preparando el motor de OCR (la primera vez descarga el idioma, unos segundos)…'
      : progress.pages > 1
        ? `Reconociendo página ${progress.page} de ${progress.pages}…`
        : 'Reconociendo el texto…'
    : ''

  return (
    <div className="stack">
      <div className="card stack">
        {!file ? (
          <DropZone accept="application/pdf,image/*" title="Toca para elegir un PDF escaneado o una imagen" hint="JPG, PNG, WebP o PDF" onFiles={([f]) => { setFile(f); setResult(null); setError(null) }} />
        ) : (
          <ul className="file-list" style={{ marginTop: 0 }}>
            <FileRow file={file} actions={<button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={() => { setFile(null); setResult(null); setError(null) }}>Cambiar</button>} />
          </ul>
        )}
        <div className="field">
          <span>Idioma del documento</span>
          <Segmented
            label="Idioma"
            value={lang}
            onChange={setLang}
            options={[
              { value: 'spa', label: 'Español' },
              { value: 'eng', label: 'Inglés' },
              { value: 'spa+eng', label: 'Ambos' },
            ]}
          />
        </div>
        <label className="check">
          <input type="checkbox" checked={wantPdf} onChange={(e) => setWantPdf(e.target.checked)} />
          <span>Generar también un PDF buscable (texto seleccionable sobre la imagen)</span>
        </label>
        <small className="faint">El reconocimiento ocurre en tu navegador: el archivo no se sube a ningún servidor.</small>
        {progress && (
          <>
            <Progress value={progress.fraction} />
            <small className="faint">{status}</small>
          </>
        )}
        {error && <Notice kind="error">{error}</Notice>}
        <div className="row row-end">
          <BusyButton busy={busy} disabled={!file} onClick={run} icon="text">
            Reconocer texto
          </BusyButton>
        </div>
      </div>

      {result && result.text.trim() && (
        <div className="card stack">
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <h3>Texto reconocido</h3>
            <div className="row" style={{ gap: 6 }}>
              <button type="button" className="btn btn-soft btn-sm" onClick={() => navigator.clipboard.writeText(result.text).then(() => toast('Texto copiado'))}>
                <Icon name="copy" /> Copiar
              </button>
              <button type="button" className="btn btn-soft btn-sm" onClick={() => download(new Blob([result.text], { type: 'text/plain;charset=utf-8' }), `${baseName(file!.name)}-ocr.txt`)}>
                <Icon name="download" /> .txt
              </button>
              {result.pdf && (
                <button type="button" className="btn btn-primary btn-sm" onClick={() => download(result.pdf!, `${baseName(file!.name)}-buscable.pdf`, 'application/pdf')}>
                  <Icon name="download" /> PDF buscable
                </button>
              )}
            </div>
          </div>
          {result.confidence < 60 && (
            <Notice kind="info">La calidad del reconocimiento es baja ({result.confidence}%). Revisa el texto: una imagen más nítida o derecha da mejores resultados.</Notice>
          )}
          <pre className="text-view">{result.text}</pre>
        </div>
      )}
    </div>
  )
}
