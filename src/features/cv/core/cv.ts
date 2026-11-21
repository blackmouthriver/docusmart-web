/**
 * Hoja de vida (W-131): el modelo, el borrador (.json) y el documento en PDF y en Word (.docx).
 * Las dos plantillas son de una sola columna, con títulos estándar y texto real, como piden los
 * sistemas que filtran hojas de vida (ATS). Partes puras, para poder probarlas.
 */
import type { OBlock, OPara, ORun } from '../../convert/core/officePdf'
import type { Block as WBlock, Run as WRun, WordDoc } from '../../convert/core/pdfWord'

export type Job = { role: string; company: string; place: string; start: string; end: string; current: boolean; details: string }
export type Study = { degree: string; school: string; place: string; start: string; end: string }
export type Lang = { name: string; level: string }
export type Course = { name: string; org: string; year: string }
export type Reference = { name: string; relation: string; contact: string }
export type CvTemplate = 'ats' | 'foto'

export type CvData = {
  template: CvTemplate
  name: string
  headline: string
  city: string
  phone: string
  email: string
  links: string
  summary: string
  experience: Job[]
  education: Study[]
  skills: string
  languages: Lang[]
  courses: Course[]
  references: Reference[]
}

export const emptyJob = (): Job => ({ role: '', company: '', place: '', start: '', end: '', current: false, details: '' })
export const emptyStudy = (): Study => ({ degree: '', school: '', place: '', start: '', end: '' })
export const emptyLang = (): Lang => ({ name: '', level: '' })
export const emptyCourse = (): Course => ({ name: '', org: '', year: '' })
export const emptyReference = (): Reference => ({ name: '', relation: '', contact: '' })

export const emptyCv = (): CvData => ({
  template: 'ats',
  name: '',
  headline: '',
  city: '',
  phone: '',
  email: '',
  links: '',
  summary: '',
  experience: [emptyJob()],
  education: [emptyStudy()],
  skills: '',
  languages: [],
  courses: [],
  references: [],
})

const filled = (o: object) => Object.values(o).some((v) => typeof v === 'string' && v.trim())

/** ¿Tiene algo escrito? (para avisar antes de salir y para habilitar los botones). */
export const hasContent = (d: CvData) =>
  [d.name, d.headline, d.city, d.phone, d.email, d.links, d.summary, d.skills].some((v) => v.trim()) ||
  [...d.experience, ...d.education, ...d.languages, ...d.courses, ...d.references].some(filled)

/* ───────────── Borrador (.json) ───────────── */

const str = (v: unknown, max = 4000) => (typeof v === 'string' ? v.slice(0, max) : '')
const list = <T>(v: unknown, make: (x: Record<string, unknown>) => T, max = 30): T[] => (Array.isArray(v) ? v.filter((x) => x && typeof x === 'object').slice(0, max).map((x) => make(x as Record<string, unknown>)) : [])

/** El borrador para guardar en un archivo (la foto no va: se vuelve a elegir). */
export const draftJson = (d: CvData) => JSON.stringify({ app: 'docusmart-cv', version: 1, cv: d }, null, 2)

/** Lee un borrador guardado; null si el archivo no es un borrador de hoja de vida. */
export function parseDraft(text: string): CvData | null {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    return null
  }
  const r = raw as { app?: unknown; cv?: unknown }
  if (!r || r.app !== 'docusmart-cv' || !r.cv || typeof r.cv !== 'object') return null
  const c = r.cv as Record<string, unknown>
  return {
    template: c.template === 'foto' ? 'foto' : 'ats',
    name: str(c.name, 120),
    headline: str(c.headline, 160),
    city: str(c.city, 120),
    phone: str(c.phone, 60),
    email: str(c.email, 160),
    links: str(c.links, 400),
    summary: str(c.summary),
    experience: list(c.experience, (x) => ({ role: str(x.role, 160), company: str(x.company, 160), place: str(x.place, 120), start: str(x.start, 40), end: str(x.end, 40), current: x.current === true, details: str(x.details) })),
    education: list(c.education, (x) => ({ degree: str(x.degree, 200), school: str(x.school, 200), place: str(x.place, 120), start: str(x.start, 40), end: str(x.end, 40) })),
    skills: str(c.skills),
    languages: list(c.languages, (x) => ({ name: str(x.name, 60), level: str(x.level, 60) })),
    courses: list(c.courses, (x) => ({ name: str(x.name, 200), org: str(x.org, 200), year: str(x.year, 20) })),
    references: list(c.references, (x) => ({ name: str(x.name, 120), relation: str(x.relation, 160), contact: str(x.contact, 160) })),
  }
}

/* ───────────── Texto del documento ───────────── */

export type CvLabels = {
  profile: string
  experience: string
  education: string
  skills: string
  languages: string
  courses: string
  references: string
  present: string
}

/** Fallback cuando los títulos del idioma no caben en las fuentes estándar del PDF (cirílico, CJK…). */
export const ENGLISH_CV_LABELS: CvLabels = { profile: 'Profile', experience: 'Experience', education: 'Education', skills: 'Skills', languages: 'Languages', courses: 'Courses and certifications', references: 'References', present: 'Present' }

/** "2021 – 2023", "2021 – Actualidad", "2021" o "". */
export function period(start: string, end: string, current: boolean, present: string): string {
  const a = start.trim()
  const b = current ? present : end.trim()
  if (a && b) return `${a} – ${b}`
  return a || b
}

/** Línea de contacto: ciudad · teléfono · correo · enlaces (solo lo que haya). */
export const contactLine = (d: CvData) => [d.city, d.phone, d.email, ...d.links.split(/[\n,]+/)].map((s) => s.trim()).filter(Boolean).join('  ·  ')

/** Habilidades: separadas por comas o una por línea → lista. */
export const skillList = (skills: string) => skills.split(/[\n,;]+/).map((s) => s.trim()).filter(Boolean)

/** Líneas de logros o funciones (cada línea, sin viñetas escritas a mano). */
export const detailLines = (details: string) => details.split('\n').map((l) => l.replace(/^\s*[-•*·]\s*/, '').trim()).filter(Boolean)

/** Un tipo de bloque neutro que luego se traduce a PDF o a Word. */
type Piece =
  | { kind: 'name'; text: string }
  | { kind: 'headline'; text: string }
  | { kind: 'contact'; text: string }
  | { kind: 'section'; text: string }
  | { kind: 'entry'; title: string; subtitle: string; when: string }
  | { kind: 'text'; text: string }
  | { kind: 'bullet'; text: string }

export function cvPieces(d: CvData, l: CvLabels): Piece[] {
  const out: Piece[] = []
  out.push({ kind: 'name', text: d.name.trim() || '—' })
  if (d.headline.trim()) out.push({ kind: 'headline', text: d.headline.trim() })
  const contact = contactLine(d)
  if (contact) out.push({ kind: 'contact', text: contact })

  if (d.summary.trim()) {
    out.push({ kind: 'section', text: l.profile })
    for (const p of d.summary.trim().split(/\n+/)) out.push({ kind: 'text', text: p.trim() })
  }
  const jobs = d.experience.filter(filled)
  if (jobs.length) {
    out.push({ kind: 'section', text: l.experience })
    for (const j of jobs) {
      out.push({ kind: 'entry', title: j.role.trim(), subtitle: [j.company, j.place].map((s) => s.trim()).filter(Boolean).join(', '), when: period(j.start, j.end, j.current, l.present) })
      for (const line of detailLines(j.details)) out.push({ kind: 'bullet', text: line })
    }
  }
  const studies = d.education.filter(filled)
  if (studies.length) {
    out.push({ kind: 'section', text: l.education })
    for (const s of studies) out.push({ kind: 'entry', title: s.degree.trim(), subtitle: [s.school, s.place].map((x) => x.trim()).filter(Boolean).join(', '), when: period(s.start, s.end, false, l.present) })
  }
  const skills = skillList(d.skills)
  if (skills.length) {
    out.push({ kind: 'section', text: l.skills })
    out.push({ kind: 'text', text: skills.join(' · ') })
  }
  const langs = d.languages.filter(filled)
  if (langs.length) {
    out.push({ kind: 'section', text: l.languages })
    for (const x of langs) out.push({ kind: 'bullet', text: [x.name.trim(), x.level.trim()].filter(Boolean).join(': ') })
  }
  const courses = d.courses.filter(filled)
  if (courses.length) {
    out.push({ kind: 'section', text: l.courses })
    for (const c of courses) out.push({ kind: 'bullet', text: [c.name.trim(), c.org.trim(), c.year.trim()].filter(Boolean).join(' — ') })
  }
  const refs = d.references.filter(filled)
  if (refs.length) {
    out.push({ kind: 'section', text: l.references })
    for (const r of refs) out.push({ kind: 'bullet', text: [r.name.trim(), r.relation.trim(), r.contact.trim()].filter(Boolean).join(' — ') })
  }
  return out
}

export type CvPhoto = { data: Uint8Array; width: number; height: number }

const ACCENT_SIZE = { name: 22, headline: 12, section: 12.5, body: 10.5 }

/** Bloques para el generador de PDF (una sola columna; con foto, arriba y centrada). */
export function cvPdfBlocks(d: CvData, l: CvLabels, photo?: CvPhoto): OBlock[] {
  const p = (runs: ORun[], extra: Partial<OPara> = {}): OPara => ({ kind: 'para', runs, ...extra })
  const blocks: OBlock[] = []
  if (photo && d.template === 'foto') {
    // Foto tipo documento: unos 3 × 4 cm.
    const k = Math.min(85 / photo.width, 113 / photo.height)
    blocks.push({ kind: 'image', type: 'png', data: photo.data, width: Math.round(photo.width * k), height: Math.round(photo.height * k), align: 'center' })
  }
  const center = photo && d.template === 'foto' ? { align: 'center' as const } : {}
  for (const piece of cvPieces(d, l)) {
    if (piece.kind === 'name') blocks.push(p([{ text: piece.text, bold: true, size: ACCENT_SIZE.name }], { style: 'title', ...center }))
    else if (piece.kind === 'headline') blocks.push(p([{ text: piece.text, size: ACCENT_SIZE.headline }], center))
    else if (piece.kind === 'contact') blocks.push(p([{ text: piece.text, size: 9.5 }], center))
    else if (piece.kind === 'section') blocks.push(p([{ text: ' ' }]), p([{ text: piece.text.toUpperCase(), bold: true, size: ACCENT_SIZE.section }], { style: 'h2' }))
    else if (piece.kind === 'entry') {
      blocks.push(p([{ text: piece.title || piece.subtitle, bold: true }, ...(piece.when ? [{ text: `   ${piece.when}`, size: 9.5 }] : [])]))
      if (piece.title && piece.subtitle) blocks.push(p([{ text: piece.subtitle, italic: true }]))
    } else if (piece.kind === 'text') blocks.push(p([{ text: piece.text }]))
    else if (piece.kind === 'bullet') blocks.push(p([{ text: piece.text }], { list: { ordered: false, level: 0, index: 0 } }))
  }
  return blocks
}

/** El mismo contenido como documento de Word (títulos con estilo, viñetas reales y la foto en PNG). */
export function cvWordDoc(d: CvData, l: CvLabels, photo?: CvPhoto): WordDoc {
  const run = (text: string, extra: Partial<WRun> = {}): WRun => ({ text, bold: false, italic: false, size: ACCENT_SIZE.body, family: 'sans', ...extra })
  const para = (runs: WRun[], extra: Partial<Extract<WBlock, { kind: 'para' }>> = {}): WBlock => ({ kind: 'para', runs, align: 'left', heading: 0, bullet: false, indent: 0, ...extra })
  const blocks: WBlock[] = []
  const withPhoto = !!photo && d.template === 'foto'
  if (photo && withPhoto) {
    const k = Math.min(85 / photo.width, 113 / photo.height)
    blocks.push({ kind: 'image', img: { page: 1, x: 0, y: 0, w: Math.round(photo.width * k), h: Math.round(photo.height * k), png: photo.data }, align: 'center' })
  }
  const align = withPhoto ? 'center' : 'left'
  for (const piece of cvPieces(d, l)) {
    if (piece.kind === 'name') blocks.push(para([run(piece.text, { bold: true, size: ACCENT_SIZE.name })], { heading: 1, align }))
    else if (piece.kind === 'headline') blocks.push(para([run(piece.text, { size: ACCENT_SIZE.headline })], { align }))
    else if (piece.kind === 'contact') blocks.push(para([run(piece.text, { size: 9.5 })], { align }))
    else if (piece.kind === 'section') blocks.push(para([run(piece.text.toUpperCase(), { bold: true, size: ACCENT_SIZE.section })], { heading: 2 }))
    else if (piece.kind === 'entry') {
      blocks.push(para([run(piece.title || piece.subtitle, { bold: true }), ...(piece.when ? [run(`   ${piece.when}`, { size: 9.5 })] : [])]))
      if (piece.title && piece.subtitle) blocks.push(para([run(piece.subtitle, { italic: true })]))
    } else if (piece.kind === 'text') blocks.push(para([run(piece.text)]))
    else if (piece.kind === 'bullet') blocks.push(para([run(piece.text)], { bullet: true }))
  }
  // Carta (Letter) en América; márgenes de 2 cm.
  return { blocks, page: { width: 612, height: 792 }, margins: { top: 57, right: 57, bottom: 57, left: 57 }, bodySize: ACCENT_SIZE.body, bodyFamily: 'sans', bodyFont: 'Calibri' }
}

/** "hoja-de-vida-ana-maria-perez" (sin tildes ni símbolos). */
export function cvFileBase(name: string, prefix: string): string {
  const slug = (s: string) =>
    s
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  return [slug(prefix) || 'cv', slug(name)].filter(Boolean).join('-').slice(0, 80)
}
