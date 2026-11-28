import { useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { checkFile, expectFromAccept, problemMessage } from '../files/sniff'
import { Icon, type IconName } from './Icon'
import { formatBytes, kindOf } from '../files/files'
import { AppContext } from '../../app/state'
import { useT } from '../i18n/I18n'
import { tr } from '../i18n/translate'
import { PrivacySeal } from './PrivacySeal'
import { takeChainedFiles } from '../files/handoff'
import { reportError, reportFiles } from '../files/screenContext'
import { signalMood } from '../platform/mood'

/** Smarthy (W-153) se pone a «trabajar» mientras haya un proceso en marcha en la pantalla. */
function useBusySignal(active: boolean) {
  useEffect(() => {
    if (!active) return
    signalMood('busy-start')
    return () => signalMood('busy-end')
  }, [active])
}

/** `privacySeal` (por defecto sí): sello "tu archivo no sale de tu dispositivo"; se apaga en el inicio y el menú de herramientas. */
export function HeroCard({ title, subtitle, privacySeal = true }: { title: string; subtitle: string; privacySeal?: boolean }) {
  const app = useContext(AppContext)
  const { t, lang } = useT()
  return (
    <header className="hero-card">
      <span className="hero-shine" aria-hidden="true" />
      {/* El nombre accesible incluye lo que se ve ("ES"), para quien la usa por voz (W-17). */}
      {app && (
        <button type="button" className="hero-settings" aria-label={`${lang.toUpperCase()} · ${t('settings.open')}`} title={t('settings.open')} onClick={app.openSettings}>
          <Icon name="globe" />
          {lang.toUpperCase()}
        </button>
      )}
      <div className="hero-chip">
        <span>
          <img src="/img/icon.svg" alt="" />
        </span>
        <span>
          <b>Docu</b> Smart
        </span>
      </div>
      <h1>{title}</h1>
      <p>{subtitle}</p>
      {privacySeal && <PrivacySeal />}
    </header>
  )
}

export function DropZone({
  accept,
  multiple,
  onFiles,
  title,
  hint,
  check = true,
}: {
  accept: string
  multiple?: boolean
  onFiles: (files: File[]) => void
  title: string
  hint: string
  /**
   * Revisar la firma de los archivos antes de entregarlos (si el selector es solo de PDF o solo de
   * imágenes): los vacíos o dañados se rechazan con un mensaje claro en vez de fallar después.
   * Reparar PDF lo apaga, porque justamente recibe archivos dañados.
   */
  check?: boolean
}) {
  const input = useRef<HTMLInputElement>(null)
  const [over, setOver] = useState(false)
  const [rejected, setRejected] = useState<string[]>([])
  const expect = check ? expectFromAccept(accept) : null
  /** Entrega los archivos que sirven y anota los que no. */
  const deliver = async (files: File[]) => {
    if (!expect) return (reportFiles(files), onFiles(files))
    const problems = await Promise.all(files.map((f) => checkFile(f, expect)))
    const bad = files.flatMap((f, i) => (problems[i] ? [`${f.name}: ${problemMessage(problems[i])}`] : []))
    setRejected(bad)
    const ok = files.filter((_, i) => !problems[i])
    reportFiles(ok)
    // Un archivo rechazado (vacío o dañado): si es un PDF, el asistente sugiere repararlo (W-151.6).
    if (bad.length) reportError(expect === 'pdf' ? 'pdf-danado' : null, bad[0])
    if (ok.length) onFiles(ok)
  }
  // W-110: si la herramienta anterior dejó un archivo para esta, se recibe como si el usuario lo hubiera elegido.
  useEffect(() => {
    const handed = takeChainedFiles(accept, !!multiple)
    if (handed) void deliver(handed)
    // solo al abrir la pantalla: el traspaso es de un solo uso
  }, [])
  const take = (list: FileList | null) => {
    if (!list?.length) return
    const files = Array.from(list)
    void deliver(multiple ? files : files.slice(0, 1))
  }
  return (
    <>
    <div
      className={'drop' + (over ? ' is-over' : '')}
      role="button"
      tabIndex={0}
      onClick={() => input.current?.click()}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          input.current?.click()
        }
      }}
      onDragOver={(e) => {
        e.preventDefault()
        setOver(true)
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setOver(false)
        take(e.dataTransfer.files)
      }}
    >
      <Icon name="upload" />
      <b>{title}</b>
      <small>{hint}</small>
      <input
        ref={input}
        type="file"
        accept={accept}
        multiple={multiple}
        hidden
        onChange={(e) => {
          take(e.target.files)
          e.target.value = ''
        }}
      />
    </div>
    {rejected.length > 0 && (
      <Notice kind="error">
        {rejected.length === 1 ? rejected[0] : (
          <ul className="drop-rejected">
            {rejected.map((r) => <li key={r}>{r}</li>)}
          </ul>
        )}
      </Notice>
    )}
    </>
  )
}

const kindIcon: Record<string, { icon: IconName; cls: string }> = {
  pdf: { icon: 'pdf', cls: 'ico-red' },
  image: { icon: 'image', cls: 'ico-violet' },
  text: { icon: 'text', cls: 'ico-cyan' },
  other: { icon: 'pdf', cls: 'ico-blue' },
}

export function FileRow({ file, extra, actions, lead, rowProps }: { file: File; extra?: string; actions?: ReactNode; lead?: ReactNode; rowProps?: Record<string, unknown> }) {
  const k = kindIcon[kindOf(file)]
  return (
    <li className="file-item" {...rowProps}>
      {lead}
      <span className={'ico ' + k.cls}>
        <Icon name={k.icon} />
      </span>
      <div className="file-meta">
        <b title={file.name}>{file.name}</b>
        <small>
          {formatBytes(file.size)}
          {extra ? ` · ${extra}` : ''}
        </small>
      </div>
      {actions}
    </li>
  )
}

export function Notice({ kind = 'info', children }: { kind?: 'info' | 'error' | 'success' | 'plain'; children: ReactNode }) {
  const icon: IconName = kind === 'error' ? 'alert' : kind === 'success' ? 'check' : 'info'
  return (
    <div className={'notice' + (kind === 'plain' ? '' : ' notice-' + kind)} role={kind === 'error' ? 'alert' : 'status'}>
      <span className="notice-ico">
        <Icon name={icon} />
      </span>
      <div>{children}</div>
    </div>
  )
}

/** Esqueleto mientras carga una pantalla (W-74): encabezado y tarjetas con un brillo que pasa. */
export function ScreenSkeleton({ label }: { label: string }) {
  return (
    <div className="skel" role="status" aria-label={label}>
      <i className="skel-hero" />
      <div className="skel-grid">
        {[0, 1, 2, 3, 4, 5].map((k) => (
          <i key={k} className="skel-card" />
        ))}
      </div>
    </div>
  )
}

export function BusyButton({
  busy,
  disabled,
  onClick,
  children,
  icon,
  variant = 'primary',
}: {
  busy: boolean
  disabled?: boolean
  onClick: () => void
  children: ReactNode
  icon?: IconName
  variant?: 'primary' | 'outline' | 'soft'
}) {
  useBusySignal(busy)
  return (
    <button type="button" className={'btn btn-' + variant} disabled={busy || disabled} onClick={onClick} aria-busy={busy}>
      {busy ? <span className="spinner" aria-hidden="true" /> : icon ? <Icon name={icon} /> : null}
      {children}
    </button>
  )
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T
  options: Array<{ value: T; label: string }>
  onChange: (v: T) => void
  label: string
}) {
  return (
    <div className="segmented" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" aria-pressed={o.value === value} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function BackButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button type="button" className="back" onClick={onClick}>
      <Icon name="back" />
      {label}
    </button>
  )
}

export function Progress({ value }: { value: number }) {
  useBusySignal(value < 1)
  return (
    <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(value * 100)}>
      <i style={{ width: `${Math.max(2, value * 100)}%` }} />
    </div>
  )
}

export function errorMessage(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e)
  // El asistente lo recuerda para explicar el error y su solución (W-151.6): solo el tipo y el texto mostrado.
  const shown = (entry: string | null, text: string) => (reportError(entry, text), text)
  // pdf.js: "The PDF file is empty, i.e. its size is zero bytes."
  if (/file is empty|zero bytes/i.test(msg)) return shown('pdf-danado', tr('err.emptyFile'))
  if (/encrypt/i.test(msg) || /password/i.test(msg)) return shown('pdf-protegido', tr('err.lockedPdf'))
  if (/Invalid PDF|No PDF header|InvalidPDF/i.test(msg)) return shown('pdf-danado', tr('err.invalidPdf'))
  return shown(null, tr('err.generic'))
}
