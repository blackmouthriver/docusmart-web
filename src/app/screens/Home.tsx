import { useRef } from 'react'
import { go, useApp } from '../state'
import { Icon, type IconName } from '../components/Icon'
import { HeroCard } from '../components/ui'
import { track } from '../../shared/analytics'
import { kindOf } from '../lib/files'

const QUICK: Array<{ label: string; hint: string; icon: IconName; cls: string; to: [string, string?] }> = [
  { label: 'Img → PDF', hint: 'Junta fotos en un PDF', icon: 'image', cls: 'ico-violet', to: ['convertir', 'img-pdf'] },
  { label: 'Unir PDFs', hint: 'Varios en uno solo', icon: 'merge', cls: 'ico-red', to: ['pdf', 'unir'] },
  { label: 'Dividir PDF', hint: 'Saca las páginas que quieras', icon: 'split', cls: 'ico-red', to: ['pdf', 'dividir'] },
  { label: 'PDF → Imagen', hint: 'Cada página como PNG o JPG', icon: 'convert', cls: 'ico-blue', to: ['convertir', 'pdf-img'] },
  { label: 'Leer QR', hint: 'Con la cámara o una imagen', icon: 'camera', cls: 'ico-blue', to: ['qr'] },
  { label: 'Crear QR', hint: 'También protegido', icon: 'qr', cls: 'ico-cyan', to: ['qr'] },
  { label: 'Lectura', hint: 'Escucha tus textos', icon: 'volume', cls: 'ico-green', to: ['estudio'] },
  { label: 'Pomodoro', hint: 'Bloques de 25 minutos', icon: 'timer', cls: 'ico-amber', to: ['estudio'] },
]

export function Home() {
  const { setOpenFile, toast } = useApp()
  const input = useRef<HTMLInputElement>(null)

  const open = (file: File | undefined) => {
    if (!file) return
    const kind = kindOf(file)
    if (kind === 'other') {
      toast('La web abre PDF, imágenes y texto. Word, Excel y PowerPoint están en la app.')
      return
    }
    setOpenFile(file)
    track('document_opened', { document_type: kind })
    go('ver')
  }

  return (
    <>
      <HeroCard title="Tus documentos en un solo lugar" subtitle="Abre, convierte y gestiona tus archivos desde el navegador, sin subirlos a ningún lado." />

      <div className="row" style={{ marginTop: 16 }}>
        <button type="button" className="btn btn-primary" style={{ flex: 1 }} onClick={() => input.current?.click()}>
          <Icon name="open" /> Abrir
        </button>
        <a className="btn btn-outline" style={{ flex: 1 }} href="#/convertir">
          <Icon name="convert" /> Convertir
        </a>
        <input
          ref={input}
          type="file"
          hidden
          accept="application/pdf,image/*,text/plain,.txt,.csv,.md"
          onChange={(e) => {
            open(e.target.files?.[0])
            e.target.value = ''
          }}
        />
      </div>

      <h2 className="section-title">Accesos rápidos</h2>
      <div className="quick-grid">
        {QUICK.map((q) => (
          <button key={q.label} type="button" className="quick" onClick={() => go(q.to[0], q.to[1])}>
            <span className={'ico ' + q.cls}>
              <Icon name={q.icon} />
            </span>
            <span>
              <b>{q.label}</b>
              <small>{q.hint}</small>
            </span>
          </button>
        ))}
      </div>

      <h2 className="section-title">Solo en la app</h2>
      <div className="card" style={{ display: 'flex', gap: 18, alignItems: 'center', flexWrap: 'wrap' }}>
        <span className="ico ico-blue">
          <Icon name="phone" />
        </span>
        <div style={{ flex: '1 1 260px' }}>
          <h3>Escáner, carpeta segura y Office</h3>
          <p className="muted" style={{ marginTop: 4 }}>
            El escáner con detección de bordes, la carpeta segura con PIN, Word/Excel/PowerPoint, OCR y PDF a Word están en la app Android.
          </p>
        </div>
        <a className="btn btn-soft" href="/" onClick={() => track('web_app_promo_click', { target: 'landing' })}>
          Conocer la app
        </a>
      </div>
    </>
  )
}
