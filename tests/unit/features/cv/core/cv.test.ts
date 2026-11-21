import { describe, expect, it } from 'vitest'
import { unzipSync, strFromU8 } from 'fflate'
import { layoutPdf } from '../../../../../src/features/convert/core/officePdf'
import { writeDocx } from '../../../../../src/features/convert/core/pdfWord'
import {
  ENGLISH_CV_LABELS,
  contactLine,
  cvFileBase,
  cvPdfBlocks,
  cvPieces,
  cvWordDoc,
  detailLines,
  draftJson,
  emptyCv,
  emptyJob,
  hasContent,
  parseDraft,
  period,
  skillList,
  type CvData,
} from '../../../../../src/features/cv/core/cv'

const cv = (over: Partial<CvData> = {}): CvData => ({
  ...emptyCv(),
  name: 'Ana María Pérez',
  headline: 'Diseñadora gráfica',
  city: 'Medellín',
  phone: '300 123 4567',
  email: 'ana@correo.com',
  links: 'linkedin.com/in/ana, behance.net/ana',
  summary: 'Diseñadora con 5 años de experiencia en identidad visual.',
  experience: [{ role: 'Diseñadora senior', company: 'Agencia Creativa', place: 'Bogotá', start: '2021', end: '', current: true, details: '- Lideré 30 proyectos\n• Formé a 3 practicantes' }],
  education: [{ degree: 'Diseño Gráfico', school: 'Universidad Nacional', place: '', start: '2014', end: '2019' }],
  skills: 'Illustrator, Figma\nPhotoshop; Branding',
  languages: [{ name: 'Inglés', level: 'B2' }],
  courses: [{ name: 'UX Design', org: 'Google', year: '2023' }],
  references: [{ name: 'Juan Gómez', relation: 'Jefe directo', contact: '310 000 0000' }],
  ...over,
})

describe('textos', () => {
  it('periodo con "Actualidad"', () => {
    expect(period('2021', '2023', false, 'Actualidad')).toBe('2021 – 2023')
    expect(period('2021', '', true, 'Actualidad')).toBe('2021 – Actualidad')
    expect(period('2021', '', false, 'Actualidad')).toBe('2021')
    expect(period('', '', false, 'Actualidad')).toBe('')
  })

  it('contacto, habilidades y logros', () => {
    expect(contactLine(cv())).toBe('Medellín  ·  300 123 4567  ·  ana@correo.com  ·  linkedin.com/in/ana  ·  behance.net/ana')
    expect(skillList(' Illustrator, Figma\nPhotoshop; ;Branding ')).toEqual(['Illustrator', 'Figma', 'Photoshop', 'Branding'])
    expect(detailLines('- Uno\n\n• Dos\n * Tres\nCuatro')).toEqual(['Uno', 'Dos', 'Tres', 'Cuatro'])
  })

  it('hasContent', () => {
    expect(hasContent(emptyCv())).toBe(false)
    expect(hasContent({ ...emptyCv(), experience: [{ ...emptyJob(), company: 'X' }] })).toBe(true)
    expect(hasContent({ ...emptyCv(), name: 'Ana' })).toBe(true)
  })
})

describe('orden del documento', () => {
  it('nombre, cargo y contacto arriba; luego las secciones con contenido, en orden', () => {
    const pieces = cvPieces(cv(), ENGLISH_CV_LABELS)
    expect(pieces.slice(0, 3).map((p) => p.kind)).toEqual(['name', 'headline', 'contact'])
    const sections = pieces.filter((p) => p.kind === 'section').map((p) => ('text' in p ? p.text : ''))
    expect(sections).toEqual(['Profile', 'Experience', 'Education', 'Skills', 'Languages', 'Courses and certifications', 'References'])
    expect(pieces).toContainEqual({ kind: 'entry', title: 'Diseñadora senior', subtitle: 'Agencia Creativa, Bogotá', when: '2021 – Present' })
    expect(pieces).toContainEqual({ kind: 'bullet', text: 'Lideré 30 proyectos' })
    expect(pieces).toContainEqual({ kind: 'text', text: 'Illustrator · Figma · Photoshop · Branding' })
  })

  it('las secciones vacías no salen', () => {
    const pieces = cvPieces({ ...emptyCv(), name: 'Ana' }, ENGLISH_CV_LABELS)
    expect(pieces).toEqual([{ kind: 'name', text: 'Ana' }])
  })
})

const PNG = Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='), (c) => c.charCodeAt(0))

describe('PDF y Word', () => {
  it('PDF real, con la foto solo en la plantilla con foto', async () => {
    const ats = cvPdfBlocks(cv(), ENGLISH_CV_LABELS, { data: PNG, width: 300, height: 400 })
    expect(ats.some((b) => b.kind === 'image')).toBe(false)
    const withPhoto = cvPdfBlocks(cv({ template: 'foto' }), ENGLISH_CV_LABELS, { data: PNG, width: 300, height: 400 })
    expect(withPhoto[0]).toMatchObject({ kind: 'image', width: 85, height: 113, align: 'center' })
    const pdf = await layoutPdf(withPhoto, { title: 'CV' })
    expect(new TextDecoder().decode(pdf.subarray(0, 5))).toBe('%PDF-')
  })

  it('Word real: títulos con estilo, viñetas y la foto', () => {
    const doc = cvWordDoc(cv({ template: 'foto' }), ENGLISH_CV_LABELS, { data: PNG, width: 300, height: 400 })
    const files = unzipSync(writeDocx(doc))
    const xml = strFromU8(files['word/document.xml'])
    expect(xml).toContain('Ana María Pérez')
    expect(xml).toContain('<w:pStyle w:val="Heading1"/>')
    expect(xml).toContain('<w:pStyle w:val="Heading2"/>')
    expect(xml).toContain('<w:numId w:val="1"/>')
    expect(xml).toContain('Lideré 30 proyectos')
    expect(files['word/media/imagen1.png']).toEqual(PNG)
  })
})

describe('borrador', () => {
  it('se guarda y se vuelve a abrir igual', () => {
    const d = cv()
    expect(parseDraft(draftJson(d))).toEqual(d)
  })

  it('rechaza archivos que no son borradores y limpia lo dañado', () => {
    expect(parseDraft('{nada')).toBeNull()
    expect(parseDraft(JSON.stringify({ cv: {} }))).toBeNull()
    const d = parseDraft(JSON.stringify({ app: 'docusmart-cv', version: 1, cv: { name: 5, template: 'raro', experience: [null, { role: 'X', current: 'si' }], languages: 'no' } }))
    expect(d).toMatchObject({ name: '', template: 'ats', languages: [] })
    expect(d?.experience).toEqual([{ ...emptyJob(), role: 'X' }])
  })

  it('nombre del archivo', () => {
    expect(cvFileBase('Ana María Pérez', 'Hoja de vida')).toBe('hoja-de-vida-ana-maria-perez')
    expect(cvFileBase('', 'Résumé')).toBe('resume')
  })
})
