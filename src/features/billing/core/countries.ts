/**
 * Países para las cuentas de cobro (W-130): moneda, nombre y tarifa general del impuesto, nombre de
 * la retención y los documentos de identidad de personas y empresas. Al elegir el país se llena
 * solo lo que corresponde; la persona puede cambiar cualquier valor (la tarifa general no siempre
 * aplica a su caso).
 */

export type IdKind = 'persona' | 'empresa' | 'ambos'
export type IdType = { code: string; name: string; kind: IdKind }
export type Country = {
  code: string
  currency: string
  tax: { label: string; rate: number | null }
  withholding?: string
  ids: IdType[]
}

const id = (code: string, name: string, kind: IdKind): IdType => ({ code, name, kind })

export const COUNTRIES: readonly Country[] = [
  { code: 'CO', currency: 'COP', tax: { label: 'IVA', rate: 19 }, withholding: 'Retención en la fuente', ids: [id('NIT', 'NIT', 'ambos'), id('C.C.', 'Cédula de ciudadanía', 'persona'), id('C.E.', 'Cédula de extranjería', 'persona'), id('PA', 'Pasaporte', 'persona')] },
  { code: 'MX', currency: 'MXN', tax: { label: 'IVA', rate: 16 }, withholding: 'Retención de ISR', ids: [id('RFC', 'RFC', 'ambos'), id('CURP', 'CURP', 'persona')] },
  { code: 'AR', currency: 'ARS', tax: { label: 'IVA', rate: 21 }, ids: [id('CUIT', 'CUIT', 'ambos'), id('CUIL', 'CUIL', 'persona'), id('DNI', 'DNI', 'persona')] },
  { code: 'CL', currency: 'CLP', tax: { label: 'IVA', rate: 19 }, withholding: 'Retención', ids: [id('RUT', 'RUT', 'ambos')] },
  { code: 'PE', currency: 'PEN', tax: { label: 'IGV', rate: 18 }, withholding: 'Retención de 4.ª categoría', ids: [id('RUC', 'RUC', 'ambos'), id('DNI', 'DNI', 'persona'), id('C.E.', 'Carné de extranjería', 'persona')] },
  { code: 'EC', currency: 'USD', tax: { label: 'IVA', rate: 15 }, withholding: 'Retención en la fuente', ids: [id('RUC', 'RUC', 'ambos'), id('C.I.', 'Cédula de identidad', 'persona')] },
  { code: 'VE', currency: 'VES', tax: { label: 'IVA', rate: 16 }, withholding: 'Retención de ISLR', ids: [id('RIF', 'RIF', 'ambos'), id('C.I.', 'Cédula de identidad', 'persona')] },
  { code: 'BO', currency: 'BOB', tax: { label: 'IVA', rate: 13 }, ids: [id('NIT', 'NIT', 'ambos'), id('C.I.', 'Cédula de identidad', 'persona')] },
  { code: 'PY', currency: 'PYG', tax: { label: 'IVA', rate: 10 }, ids: [id('RUC', 'RUC', 'ambos'), id('C.I.', 'Cédula de identidad', 'persona')] },
  { code: 'UY', currency: 'UYU', tax: { label: 'IVA', rate: 22 }, ids: [id('RUT', 'RUT', 'empresa'), id('C.I.', 'Cédula de identidad', 'persona')] },
  { code: 'CR', currency: 'CRC', tax: { label: 'IVA', rate: 13 }, ids: [id('Céd. jurídica', 'Cédula jurídica', 'empresa'), id('Céd. física', 'Cédula física', 'persona'), id('DIMEX', 'DIMEX', 'persona')] },
  { code: 'PA', currency: 'USD', tax: { label: 'ITBMS', rate: 7 }, ids: [id('RUC', 'RUC', 'ambos'), id('Cédula', 'Cédula', 'persona')] },
  { code: 'GT', currency: 'GTQ', tax: { label: 'IVA', rate: 12 }, withholding: 'Retención de ISR', ids: [id('NIT', 'NIT', 'ambos'), id('DPI', 'DPI', 'persona')] },
  { code: 'HN', currency: 'HNL', tax: { label: 'ISV', rate: 15 }, ids: [id('RTN', 'RTN', 'ambos'), id('DNI', 'DNI', 'persona')] },
  { code: 'SV', currency: 'USD', tax: { label: 'IVA', rate: 13 }, withholding: 'Retención de renta', ids: [id('NIT', 'NIT', 'ambos'), id('DUI', 'DUI', 'persona')] },
  { code: 'NI', currency: 'NIO', tax: { label: 'IVA', rate: 15 }, ids: [id('RUC', 'RUC', 'ambos'), id('Cédula', 'Cédula', 'persona')] },
  { code: 'DO', currency: 'DOP', tax: { label: 'ITBIS', rate: 18 }, withholding: 'Retención de ISR', ids: [id('RNC', 'RNC', 'empresa'), id('Cédula', 'Cédula', 'persona')] },
  { code: 'ES', currency: 'EUR', tax: { label: 'IVA', rate: 21 }, withholding: 'Retención IRPF', ids: [id('NIF', 'NIF', 'ambos'), id('DNI', 'DNI', 'persona'), id('NIE', 'NIE', 'persona')] },
  { code: 'PT', currency: 'EUR', tax: { label: 'IVA', rate: 23 }, withholding: 'Retenção na fonte', ids: [id('NIPC', 'NIPC', 'empresa'), id('NIF', 'NIF', 'persona')] },
  { code: 'BR', currency: 'BRL', tax: { label: 'ISS', rate: null }, withholding: 'Retenção', ids: [id('CNPJ', 'CNPJ', 'empresa'), id('CPF', 'CPF', 'persona')] },
  { code: 'US', currency: 'USD', tax: { label: 'Sales tax', rate: null }, ids: [id('EIN', 'EIN', 'empresa'), id('ITIN', 'ITIN', 'persona')] },
  { code: 'CA', currency: 'CAD', tax: { label: 'GST/HST', rate: 5 }, ids: [id('BN', 'Business Number', 'empresa'), id('GST/HST No.', 'GST/HST number', 'ambos')] },
  { code: 'GB', currency: 'GBP', tax: { label: 'VAT', rate: 20 }, ids: [id('VAT No.', 'VAT number', 'ambos'), id('Company No.', 'Company number', 'empresa'), id('UTR', 'UTR', 'ambos')] },
  { code: 'FR', currency: 'EUR', tax: { label: 'TVA', rate: 20 }, ids: [id('SIRET', 'SIRET', 'empresa'), id('N° TVA', 'N° TVA intracommunautaire', 'empresa'), id('N° fiscal', 'Numéro fiscal', 'persona')] },
  { code: 'IT', currency: 'EUR', tax: { label: 'IVA', rate: 22 }, withholding: "Ritenuta d'acconto", ids: [id('P. IVA', 'Partita IVA', 'ambos'), id('C.F.', 'Codice fiscale', 'persona')] },
  { code: 'DE', currency: 'EUR', tax: { label: 'USt.', rate: 19 }, ids: [id('USt-IdNr.', 'USt-IdNr.', 'empresa'), id('St.-Nr.', 'Steuernummer', 'ambos')] },
]

export const findCountry = (code: string | null | undefined) => COUNTRIES.find((c) => c.code === code) ?? null

/** Sin tildes ni mayúsculas, para buscar "peru" y encontrar "Perú". */
export const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

/** Nombre del país en el idioma de la persona (con el código si el navegador no lo conoce). */
export function countryName(code: string, lang: string): string {
  try {
    return new Intl.DisplayNames([lang], { type: 'region' }).of(code) ?? code
  } catch {
    return code
  }
}

/**
 * El país que corresponde a lo escrito: el nombre exacto, el código ("CO") o, si solo hay uno
 * que empieza así, ese. Null mientras siga siendo ambiguo.
 */
export function matchCountry(text: string, names: ReadonlyArray<{ code: string; name: string }>): string | null {
  const q = fold(text)
  if (!q) return null
  const exact = names.find((n) => fold(n.name) === q || n.code.toLowerCase() === q)
  if (exact) return exact.code
  const starts = names.filter((n) => fold(n.name).startsWith(q))
  return starts.length === 1 ? starts[0].code : null
}

/** País por defecto según el idioma del navegador ("es-CO" → Colombia), si está en la lista. */
export function countryFromLocale(locales: readonly string[]): string | null {
  for (const l of locales) {
    const region = l.split(/[-_]/)[1]?.toUpperCase()
    if (region && findCountry(region)) return region
  }
  return null
}

/** Documentos que sirven para una persona o para una empresa, en el orden de la lista. */
export const idsFor = (c: Country | null, who: 'persona' | 'empresa') => (c ? c.ids.filter((i) => i.kind === who || i.kind === 'ambos') : [])

/**
 * Documento sugerido: para quien cobra, el de persona (los independientes cobran con su cédula);
 * para el cliente, el de empresa.
 */
export function defaultIdType(c: Country | null, who: 'persona' | 'empresa'): string {
  const own = c?.ids.find((i) => i.kind === who)
  return own?.code ?? idsFor(c, who)[0]?.code ?? ''
}
