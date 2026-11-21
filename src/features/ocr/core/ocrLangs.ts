/** Idiomas del OCR (sin dependencias: lo usan el OCR, Imagen a texto y el Modo Estudio). */
/** Modelos de idioma que trae la web (public/ocr/lang), uno por cada idioma del sitio. */
export const OCR_LANGS = ['spa', 'eng', 'por', 'fra', 'ita', 'deu', 'cat', 'eus', 'rus', 'jpn', 'kor', 'chi_sim'] as const
export type OcrBase = (typeof OCR_LANGS)[number]
/** Un idioma, o uno más inglés para documentos mezclados ("spa+eng"). */
export type OcrLang = OcrBase | `${OcrBase}+eng`

/** Código del idioma (para Intl y para elegir según el idioma de la web). */
export const OCR_ISO: Record<OcrBase, string> = { spa: 'es', eng: 'en', por: 'pt', fra: 'fr', ita: 'it', deu: 'de', cat: 'ca', eus: 'eu', rus: 'ru', jpn: 'ja', kor: 'ko', chi_sim: 'zh' }

/** El modelo para el idioma de la web (o español, si no hay). */
export function ocrBaseFor(uiLang: string): OcrBase {
  return (Object.keys(OCR_ISO) as OcrBase[]).find((k) => OCR_ISO[k] === uiLang) ?? 'spa'
}

/** Arma el idioma del OCR: con inglés además si el documento lo mezcla. */
export const ocrLang = (base: OcrBase, plusEnglish: boolean): OcrLang => (plusEnglish && base !== 'eng' ? `${base}+eng` : base)

/** Nombre del idioma en el idioma de la web ("Portugués", "Japanese"…). */
export function ocrLangName(base: OcrBase, uiLang: string): string {
  try {
    const name = new Intl.DisplayNames([uiLang], { type: 'language' }).of(base === 'chi_sim' ? 'zh-Hans' : OCR_ISO[base])
    if (name) return name.charAt(0).toLocaleUpperCase(uiLang) + name.slice(1)
  } catch {
    /* navegador sin Intl.DisplayNames */
  }
  return OCR_ISO[base]
}
