import { useRef, useState, type ReactNode } from 'react'
import { Icon, type IconName } from './Icon'
import { formatBytes, kindOf } from '../lib/files'

export function HeroCard({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <header className="hero-card">
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
    </header>
  )
}

export function DropZone({
  accept,
  multiple,
  onFiles,
  title,
  hint,
}: {
  accept: string
  multiple?: boolean
  onFiles: (files: File[]) => void
  title: string
  hint: string
}) {
  const input = useRef<HTMLInputElement>(null)
  const [over, setOver] = useState(false)
  const take = (list: FileList | null) => {
    if (!list?.length) return
    const files = Array.from(list)
    onFiles(multiple ? files : files.slice(0, 1))
  }
  return (
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
  )
}

const kindIcon: Record<string, { icon: IconName; cls: string }> = {
  pdf: { icon: 'pdf', cls: 'ico-red' },
  image: { icon: 'image', cls: 'ico-violet' },
  text: { icon: 'text', cls: 'ico-cyan' },
  other: { icon: 'pdf', cls: 'ico-blue' },
}

export function FileRow({ file, extra, actions }: { file: File; extra?: string; actions?: ReactNode }) {
  const k = kindIcon[kindOf(file)]
  return (
    <li className="file-item">
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
      <Icon name={icon} />
      <div>{children}</div>
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
  return (
    <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(value * 100)}>
      <i style={{ width: `${Math.max(2, value * 100)}%` }} />
    </div>
  )
}

export function errorMessage(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e)
  if (/encrypt/i.test(msg) || /password/i.test(msg))
    return 'Este PDF está protegido con contraseña. Quítala primero en la app de DocuSmart.'
  if (/Invalid PDF|No PDF header|InvalidPDF/i.test(msg)) return 'El archivo no parece un PDF válido.'
  return 'No se pudo procesar el archivo. Intenta con otro.'
}
