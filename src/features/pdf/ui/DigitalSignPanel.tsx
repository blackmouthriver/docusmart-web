/**
 * Firma digital con certificado (W-141): elegir el .p12/.pfx, escribir su contraseña y ver a
 * nombre de quién está antes de firmar. El certificado y la contraseña solo viven en memoria.
 */
import { useEffect, useRef, useState } from 'react'
import { useT } from '../../../shared/i18n/I18n'
import { tr } from '../../../shared/i18n/translate'
import { Icon } from '../../../shared/ui/Icon'
import { BusyButton, Notice } from '../../../shared/ui/ui'
import type { Certificate } from '../core/pdfDigitalSign'

export type DigitalSign = { cert: Certificate; reason: string } | null

export function DigitalSignPanel({ file, onChange, disabled }: { file: File; onChange: (v: DigitalSign) => void; disabled?: boolean }) {
  const { lang } = useT()
  const [on, setOn] = useState(false)
  const [p12, setP12] = useState<File | null>(null)
  const [password, setPassword] = useState('')
  const [cert, setCert] = useState<Certificate | null>(null)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [alreadySigned, setAlreadySigned] = useState(false)
  const input = useRef<HTMLInputElement>(null)

  useEffect(() => onChange(on && cert ? { cert, reason: reason.trim() } : null), [on, cert, reason, onChange])

  // ¿El PDF ya trae firmas digitales? (al reescribirlo, dejarían de ser válidas).
  useEffect(() => {
    if (!on) return
    let cancelled = false
    void file.arrayBuffer().then((b) => !cancelled && setAlreadySigned(new TextDecoder('latin1').decode(b).includes('/ByteRange')))
    return () => {
      cancelled = true
    }
  }, [on, file])

  const open = async () => {
    if (!p12) return
    setBusy(true)
    setError(null)
    try {
      const { readCertificate, CertError } = await import('../core/pdfDigitalSign')
      try {
        setCert(readCertificate(new Uint8Array(await p12.arrayBuffer()), password))
        setPassword('')
      } catch (e) {
        const code = e instanceof CertError ? e.code : 'format'
        setError(tr(code === 'password' ? 'sign.cert.badPassword' : code === 'nokey' ? 'sign.cert.noKey' : 'sign.cert.badFile'))
      }
    } finally {
      setBusy(false)
    }
  }

  const date = (d: Date) => d.toLocaleDateString(lang, { year: 'numeric', month: 'long', day: 'numeric' })
  const expired = cert && cert.info.notAfter.getTime() < Date.now()

  return (
    <div className="stack" style={{ gap: 8 }}>
      <label className="check">
        <input type="checkbox" checked={on} disabled={disabled} onChange={(e) => setOn(e.target.checked)} />
        <span>{tr('sign.digital')}</span>
      </label>
      {!on && <Notice kind="plain">{tr('sign.visual')}</Notice>}
      {on && (
        <div className="stack" style={{ gap: 8 }}>
          {cert ? (
            <div className="sign-cert">
              <strong>{tr('sign.cert.holder', { name: cert.info.name || '—' })}</strong>
              <span className="faint">{tr('sign.cert.issuer', { issuer: cert.info.issuer || '—' })}</span>
              <span className="faint">{tr('sign.cert.valid', { date: date(cert.info.notAfter) })}</span>
              <button type="button" className="btn btn-ghost btn-sm" disabled={disabled} onClick={() => (setCert(null), setP12(null))}>
                {tr('common.change')}
              </button>
            </div>
          ) : (
            <>
              <div className="row">
                <button type="button" className="btn btn-soft btn-sm" disabled={disabled} onClick={() => input.current?.click()}>
                  <Icon name="lock" /> {p12 ? p12.name : tr('sign.cert.pick')}
                </button>
                <input ref={input} type="file" accept=".p12,.pfx,application/x-pkcs12" hidden onChange={(e) => (setP12(e.target.files?.[0] ?? null), setError(null), (e.target.value = ''))} />
              </div>
              {p12 && (
                <div className="row">
                  <label className="field" style={{ flex: 1, margin: 0 }}>
                    <span>{tr('sign.cert.password')}</span>
                    <input className="input" type="password" autoComplete="off" value={password} disabled={disabled || busy} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && void open()} />
                  </label>
                  <BusyButton busy={busy} disabled={disabled} onClick={open} icon="check">
                    {tr('sign.cert.open')}
                  </BusyButton>
                </div>
              )}
            </>
          )}
          {cert && (
            <label className="field">
              <span>{tr('sign.cert.reason')}</span>
              <input className="input" value={reason} maxLength={120} disabled={disabled} onChange={(e) => setReason(e.target.value)} />
            </label>
          )}
          {error && <Notice kind="error">{error}</Notice>}
          {expired && <Notice kind="error">{tr('sign.cert.expired', { date: date(cert!.info.notAfter) })}</Notice>}
          {alreadySigned && <Notice kind="info">{tr('sign.cert.resign')}</Notice>}
          <small className="faint">{tr('sign.cert.private')}</small>
        </div>
      )}
    </div>
  )
}
