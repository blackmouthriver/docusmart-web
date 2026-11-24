// W-147.10: comparar la hoja de vida con una oferta, carta de presentación y valor en letras en
// portugués e inglés.
import { describe, expect, it } from 'vitest'
import { emptyCv, emptyJob, emptyStudy, type CvData } from '../../../../../src/features/cv/core/cv'
import { cvText, fold, matchOffer, offerKeywords, stem, tokens } from '../../../../../src/features/cv/core/cvMatch'
import { coverLetterText, firstSentences, joinList, letterPdfBlocks, letterWordDoc, type LetterTexts } from '../../../../../src/features/cv/core/coverLetter'
import { amountInWords, amountInWordsEn, amountInWordsPt, integerToWordsEn, integerToWordsPt } from '../../../../../src/features/billing/core/numberWords'

const OFFER = `Analista de datos. Buscamos profesional en Ingeniería de Sistemas con 2 años de experiencia en análisis de datos.
Requisitos: manejo avanzado de Excel, SQL y Power BI. Conocimientos en Python. Servicio al cliente y trabajo en equipo.
Funciones: elaborar reportes en Power BI, consultas SQL, análisis de datos de ventas, servicio al cliente interno.`

describe('palabras clave de la oferta', () => {
  it('sin tildes, plurales ni palabras vacías; conserva C++, C#, .NET y las siglas', () => {
    expect(fold('Análisis ÑANDÚ')).toBe('analisis nandu')
    expect(stem('habilidades')).toBe('habilidad')
    expect(stem('skills')).toBe('skill')
    expect(stem('lápices'.normalize('NFD').replace(/[̀-ͯ]/g, ''))).toBe('lapiz')
    const t = tokens('Experiencia en C++, C#, .NET y Node.js; manejo de BI y el TI.')
    expect(t.filter((x) => !x.stop).map((x) => x.raw)).toEqual(['C++', 'C#', 'NET', 'Node.js', 'BI', 'TI'])
  })

  it('las más repetidas primero, con pares como "servicio al cliente" y "Power BI"', () => {
    const k = offerKeywords(OFFER)
    const terms = k.map((x) => x.term)
    expect(terms.slice(0, 4)).toEqual(expect.arrayContaining(['análisis de datos', 'Servicio al cliente', 'Power BI', 'SQL']))
    // "datos" solo aparece una vez fuera de "análisis de datos".
    expect(k.find((x) => x.term === 'datos')?.weight).toBe(1)
    expect(terms).not.toContain('experiencia')
    expect(terms).not.toContain('años')
  })

  it('compara con la hoja de vida: porcentaje, las que están y las que faltan', () => {
    const cv: CvData = { ...emptyCv(), headline: 'Ingeniera de sistemas', skills: 'Excel avanzado, SQL, Power BI, reportes, atención y servicio al cliente', summary: 'Analista de ventas.' }
    const m = matchOffer(cvText(cv), OFFER)
    const found = m.found.map((x) => x.term)
    expect(found).toEqual(expect.arrayContaining(['SQL', 'Power BI', 'Servicio al cliente', 'Excel', 'reportes']))
    expect(m.missing.map((x) => x.term)).toEqual(expect.arrayContaining(['análisis de datos', 'Python']))
    expect(m.score).toBeGreaterThan(30)
    expect(m.score).toBeLessThan(90)
    expect(matchOffer('', '').score).toBe(0)
    expect(matchOffer(cvText(cv), 'SQL, Excel').score).toBe(100)
  })

  it('el texto de la hoja de vida junta todas las secciones', () => {
    const cv: CvData = { ...emptyCv(), experience: [{ ...emptyJob(), role: 'Cajera', details: 'Arqueo de caja' }], custom: [{ title: 'Proyectos', body: 'App de inventario' }] }
    expect(cvText(cv)).toContain('Arqueo de caja')
    expect(cvText(cv)).toContain('App de inventario')
  })
})

const ES: LetterTexts = {
  greetingNamed: 'Estimado(a) {name}:',
  greetingCompany: 'Equipo de {company}:',
  greeting: 'Estimado equipo de selección:',
  intro: 'Me dirijo a ustedes para postularme al cargo de {position} en {company}.',
  introNoCompany: 'Me dirijo a ustedes para postularme al cargo de {position}.',
  current: 'Actualmente me desempeño como {role} en {employer}.',
  past: 'Mi experiencia más reciente fue como {role} en {employer}.',
  strengths: 'Entre mis fortalezas están {list}, que puedo aportar desde el primer día.',
  education: 'Me formé como {degree} en {school}.',
  closing: 'Me encantaría conversar sobre cómo puedo aportar a {company}.',
  closingNoCompany: 'Me encantaría conversar sobre cómo puedo aportar a su equipo.',
  signoff: 'Cordialmente,',
}

describe('carta de presentación', () => {
  const cv: CvData = {
    ...emptyCv(),
    name: 'Ana Pérez',
    city: 'Bogotá',
    phone: '300 123 4567',
    email: 'ana@example.com',
    headline: 'Analista de datos',
    summary: 'Analista con 3 años en datos de ventas. Me gusta automatizar reportes. Tercera frase que sobra.',
    skills: 'SQL, Excel, Power BI, Python, Tableau',
    experience: [{ ...emptyJob(), role: 'Analista junior', company: 'Tiendas Sol', current: true }],
    education: [{ ...emptyStudy(), degree: 'Ingeniera de sistemas', school: 'Universidad Nacional' }],
  }

  it('arma la carta con el cargo, la empresa, la experiencia, las fortalezas y los estudios', () => {
    const text = coverLetterText(cv, { company: 'Datos SAS', position: 'Analista de BI', recipient: 'Laura Gómez', reason: 'Admiro sus proyectos de datos abiertos.', strengths: ['SQL', 'Power BI'] }, ES, 'es', '24 de noviembre de 2026')
    const parts = text.split('\n\n')
    expect(parts[0]).toBe('Bogotá, 24 de noviembre de 2026')
    expect(parts[1]).toBe('Estimado(a) Laura Gómez:')
    expect(parts[2]).toBe('Me dirijo a ustedes para postularme al cargo de Analista de BI en Datos SAS. Actualmente me desempeño como Analista junior en Tiendas Sol.')
    expect(parts[3]).toBe('Analista con 3 años en datos de ventas. Me gusta automatizar reportes.')
    expect(parts[4]).toBe('Entre mis fortalezas están SQL y Power BI, que puedo aportar desde el primer día. Me formé como Ingeniera de sistemas en Universidad Nacional.')
    expect(parts[5]).toBe('Admiro sus proyectos de datos abiertos.')
    expect(parts[6]).toBe('Me encantaría conversar sobre cómo puedo aportar a Datos SAS.')
    expect(parts.slice(7).join('\n\n')).toBe('Cordialmente,\n\nAna Pérez\n300 123 4567\nana@example.com')
  })

  it('sin empresa, destinatario ni oferta: saludo general, el titular como cargo y las primeras habilidades', () => {
    const past = { ...cv, experience: [{ ...emptyJob(), role: 'Analista', company: 'X', current: false }], city: '' }
    const text = coverLetterText(past, { company: '', position: '', recipient: '', reason: '', strengths: [] }, ES, 'es', '1 de enero')
    expect(text.startsWith('1 de enero\n\nEstimado equipo de selección:')).toBe(true)
    expect(text).toContain('al cargo de Analista de datos. Mi experiencia más reciente fue como Analista en X.')
    expect(text).toContain('SQL, Excel, Power BI y Python')
    expect(text).toContain('a su equipo.')
    // Un trabajo sin empresa o estudios sin institución no se nombran (la frase quedaría coja).
    const bare = coverLetterText({ ...cv, experience: [{ ...emptyJob(), role: 'Solo cargo' }], education: [{ ...emptyStudy(), degree: 'Solo título' }] }, { company: 'Y', position: 'Z', recipient: '', reason: '', strengths: [] }, ES, 'es', 'hoy')
    expect(bare).not.toContain('Solo cargo')
    expect(bare).not.toContain('Solo título')
    expect(bare).toContain('Equipo de Y:')
  })

  it('piezas: primeras frases, lista en el idioma y documentos', () => {
    expect(firstSentences('Uno. Dos! Tres?', 2)).toBe('Uno. Dos!')
    expect(joinList(['a', 'b', 'c'], 'en')).toBe('a, b, and c')
    expect(joinList(['a', 'b'], 'pt')).toBe('a e b')
    const pdf = letterPdfBlocks('Hola\n\nChao', cv)
    expect(pdf[0]).toMatchObject({ kind: 'para', runs: [{ text: 'Ana Pérez', bold: true }] })
    expect(pdf.length).toBe(7)
    const word = letterWordDoc('Hola', { ...cv, paper: 'letter' })
    expect(word.page).toEqual({ width: 612, height: 792 })
    expect(word.blocks.length).toBe(5)
  })
})

describe('valor en letras', () => {
  it('portugués (Brasil)', () => {
    expect(integerToWordsPt(0)).toBe('zero')
    expect(integerToWordsPt(100)).toBe('cem')
    expect(integerToWordsPt(101)).toBe('cento e um')
    expect(integerToWordsPt(1234)).toBe('mil duzentos e trinta e quatro')
    expect(integerToWordsPt(1100)).toBe('mil e cem')
    expect(integerToWordsPt(2030)).toBe('dois mil e trinta')
    expect(integerToWordsPt(16)).toBe('dezesseis')
    expect(integerToWordsPt(2_500_000)).toBe('dois milhões quinhentos mil')
    expect(integerToWordsPt(1_000_000_000)).toBe('um bilhão')
    expect(amountInWordsPt(1250.3, 'BRL')).toBe('Mil duzentos e cinquenta reais e trinta centavos')
    expect(amountInWordsPt(1, 'BRL')).toBe('Um real')
    expect(amountInWordsPt(0.01, 'BRL')).toBe('Um centavo')
    expect(amountInWordsPt(2_000_000, 'BRL')).toBe('Dois milhões de reais')
  })

  it('inglés', () => {
    expect(integerToWordsEn(0)).toBe('zero')
    expect(integerToWordsEn(15)).toBe('fifteen')
    expect(integerToWordsEn(42)).toBe('forty-two')
    expect(integerToWordsEn(1250)).toBe('one thousand two hundred fifty')
    expect(integerToWordsEn(3_000_017)).toBe('three million seventeen')
    expect(amountInWordsEn(1250.3, 'USD')).toBe('One thousand two hundred fifty dollars and 30/100')
    expect(amountInWordsEn(1, 'GBP')).toBe('One pound')
    expect(amountInWordsEn(500, 'COP')).toBe('Five hundred pesos')
  })

  it('según el idioma de la pantalla', () => {
    expect(amountInWords('es', 1000, 'COP')).toBe('Mil pesos')
    expect(amountInWords('pt-BR', 1000, 'BRL')).toBe('Mil reais')
    expect(amountInWords('en', 1000, 'USD')).toBe('One thousand dollars')
    expect(amountInWords('fr', 1000, 'EUR')).toBeUndefined()
  })
})
