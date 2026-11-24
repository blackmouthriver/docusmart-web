/**
 * Carta de presentación con los datos de la hoja de vida (W-147.10), como Zety o Novorésumé pero
 * sin cuenta: el cargo y la empresa a los que se aplica, la experiencia más reciente, el perfil,
 * las fortalezas (las que coinciden con la oferta, si se pegó una) y los estudios. El texto queda
 * para editarlo y se guarda en PDF o Word con el mismo diseño de la hoja de vida.
 */
import type { OBlock } from '../../convert/core/officePdf'
import type { Block as WBlock, WordDoc } from '../../convert/core/pdfWord'
import { CV_ACCENTS, cvMargin, cvSizes, paperSize, skillList, type CvData } from './cv'

export type LetterInput = {
  company: string
  position: string
  /** A quién va dirigida (opcional). */
  recipient: string
  /** Por qué le interesa el cargo, con sus palabras (opcional). */
  reason: string
  /** Fortalezas para nombrar: las que coinciden con la oferta, o las primeras habilidades. */
  strengths: string[]
}

/** Las frases en el idioma de la pantalla, con {marcadores}. */
export type LetterTexts = {
  greetingNamed: string
  greetingCompany: string
  greeting: string
  intro: string
  introNoCompany: string
  current: string
  past: string
  strengths: string
  education: string
  closing: string
  closingNoCompany: string
  signoff: string
}

const fill = (t: string, v: Record<string, string>) => t.replace(/\{(\w+)\}/g, (_, k: string) => v[k] ?? '')

/** "a, b y c" en el idioma dado. */
export const joinList = (items: string[], lang: string) => {
  try {
    return new Intl.ListFormat(lang, { style: 'long', type: 'conjunction' }).format(items)
  } catch {
    return items.join(', ')
  }
}

/** Las primeras dos frases del perfil (una carta corta se lee mejor). */
export function firstSentences(text: string, n = 2): string {
  const parts = text.replace(/\s+/g, ' ').trim().match(/[^.!?]+[.!?]*/g) ?? []
  return parts.slice(0, n).map((x) => x.trim()).join(' ')
}

/** El texto de la carta: encabezado, saludo, párrafos, despedida y firma. */
export function coverLetterText(d: CvData, o: LetterInput, t: LetterTexts, lang: string, dateText: string): string {
  const company = o.company.trim()
  const position = o.position.trim() || d.headline.trim()
  const head = [d.city.trim() ? `${d.city.trim()}, ${dateText}` : dateText]
  const greeting = o.recipient.trim() ? fill(t.greetingNamed, { name: o.recipient.trim() }) : company ? fill(t.greetingCompany, { company }) : t.greeting

  const paragraphs: string[] = []
  const intro = company ? fill(t.intro, { position, company }) : fill(t.introNoCompany, { position })
  // El trabajo más reciente con cargo y empresa (sin uno de los dos, la frase quedaría coja).
  const job = d.experience.find((j) => j.role.trim() && j.company.trim())
  const background = job ? fill(job.current ? t.current : t.past, { role: job.role.trim(), employer: job.company.trim() }) : ''
  paragraphs.push([intro, background].filter(Boolean).join(' '))
  const profile = firstSentences(d.summary)
  if (profile) paragraphs.push(profile)
  const strengths = (o.strengths.length ? o.strengths : skillList(d.skills)).slice(0, 4)
  const study = d.education.find((s) => s.degree.trim() && s.school.trim())
  const middle = [strengths.length ? fill(t.strengths, { list: joinList(strengths, lang) }) : '', study ? fill(t.education, { degree: study.degree.trim(), school: study.school.trim() }) : '']
  if (middle.some(Boolean)) paragraphs.push(middle.filter(Boolean).join(' '))
  if (o.reason.trim()) paragraphs.push(o.reason.trim())
  paragraphs.push(company ? fill(t.closing, { company }) : t.closingNoCompany)

  const signature = [d.name.trim(), d.phone.trim(), d.email.trim()].filter(Boolean)
  return [head.join('\n'), greeting, ...paragraphs, [t.signoff, '', ...signature].join('\n')].join('\n\n')
}

/** La carta para el generador de PDF: mismo tamaño de hoja, márgenes, letra y color que la hoja de vida. */
export function letterPdfBlocks(text: string, d: CvData): OBlock[] {
  const accent = d.accent || CV_ACCENTS[0]
  const blocks: OBlock[] = []
  if (d.name.trim()) blocks.push({ kind: 'para', runs: [{ text: d.name.trim(), bold: true, size: cvSizes(d.template).headline + 4, color: accent }] })
  const contact = [d.phone, d.email].map((s) => s.trim()).filter(Boolean).join('  ·  ')
  if (contact) blocks.push({ kind: 'para', runs: [{ text: contact, size: cvSizes(d.template).small }] })
  blocks.push({ kind: 'para', runs: [{ text: ' ' }] })
  for (const para of text.split(/\n{2,}/)) {
    for (const line of para.split('\n')) blocks.push({ kind: 'para', runs: [{ text: line || ' ' }] })
    blocks.push({ kind: 'para', runs: [{ text: ' ' }] })
  }
  return blocks
}

/** La carta en Word, con el mismo diseño. */
export function letterWordDoc(text: string, d: CvData): WordDoc {
  const sizes = cvSizes(d.template)
  const family = d.font
  const accent = d.accent || CV_ACCENTS[0]
  const para = (runText: string, extra: { bold?: boolean; size?: number; color?: string } = {}): WBlock => ({
    kind: 'para',
    runs: [{ text: runText, bold: !!extra.bold, italic: false, size: extra.size ?? sizes.body, family, ...(extra.color && { color: extra.color }) }],
    align: 'left',
    heading: 0,
    bullet: false,
    indent: 0,
  })
  const blocks: WBlock[] = []
  if (d.name.trim()) blocks.push(para(d.name.trim(), { bold: true, size: sizes.headline + 4, color: accent }))
  const contact = [d.phone, d.email].map((s) => s.trim()).filter(Boolean).join('  ·  ')
  if (contact) blocks.push(para(contact, { size: sizes.small }))
  blocks.push(para(''))
  for (const p of text.split(/\n{2,}/)) {
    for (const line of p.split('\n')) blocks.push(para(line))
    blocks.push(para(''))
  }
  const [width, height] = paperSize(d.paper)
  const m = cvMargin(d.template)
  return { blocks, page: { width, height }, margins: { top: m, right: m, bottom: m, left: m }, bodySize: sizes.body, bodyFamily: family, bodyFont: family === 'serif' ? 'Georgia' : 'Calibri' }
}
