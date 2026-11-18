import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { MAX_QUESTION_CHARS, questionMail } from '../../../../src/features/assistant/core/sendQuestion'
import { KB_LANGS } from '../../../../src/features/assistant/core/reply'

const TEXTS = { label: 'Enviar esta pregunta', subject: 'Pregunta para el asistente', intro: 'El asistente no supo responder:' }
const TO = 'soporte@ejemplo.com'

const parts = (href: string) => {
  const [addr, query] = href.replace(/^mailto:/, '').split('?')
  const params = Object.fromEntries(query.split('&').map((kv) => kv.split('=')).map(([k, v]) => [k, decodeURIComponent(v)]))
  return { addr, ...params } as { addr: string; subject: string; body: string }
}

describe('Enviar esta pregunta (W-70g)', () => {
  it('arma un mailto a soporte con el asunto y la pregunta', () => {
    const a = questionMail('¿cómo   uno\n dos pdf?', TEXTS, TO, '/unir-pdf')
    expect(a.kind).toBe('link')
    expect(a.label).toBe('Enviar esta pregunta')
    const m = parts(a.href)
    expect(m.addr).toBe(TO)
    expect(m.subject).toBe(TEXTS.subject)
    expect(m.body).toBe('El asistente no supo responder:\n\n“¿cómo uno dos pdf?”\n\n— /unir-pdf')
  })

  it('codifica con %20 (no "+") y escapa & y = de la pregunta', () => {
    const a = questionMail('a & b = c', TEXTS, TO)
    expect(a.href).not.toContain('+')
    expect(a.href).toContain('%20')
    expect(parts(a.href).body).toContain('“a & b = c”')
  })

  it('de la página solo va el camino, sin parámetros ni #', () => {
    expect(parts(questionMail('x', TEXTS, TO, '/app/?token=1#/pdf/unir').href).body).toMatch(/— \/app\/$/)
    expect(parts(questionMail('x', TEXTS, TO).href).body).not.toContain('—')
  })

  it('recorta las preguntas muy largas', () => {
    const body = parts(questionMail('x'.repeat(2000), TEXTS, TO).href).body
    expect(body).toContain('x'.repeat(MAX_QUESTION_CHARS - 1) + '…')
    expect(body).not.toContain('x'.repeat(MAX_QUESTION_CHARS))
  })

  it('las 12 bases traen los textos del botón y del correo', () => {
    for (const lang of KB_LANGS) {
      const ui = JSON.parse(readFileSync(join(process.cwd(), 'public', 'assistant', `${lang}.json`), 'utf-8')).ui
      for (const k of ['sendQuestion', 'sendSubject', 'sendIntro', 'sendNote']) expect(ui[k], `${lang}: ui.${k}`).toBeTruthy()
    }
  })
})
