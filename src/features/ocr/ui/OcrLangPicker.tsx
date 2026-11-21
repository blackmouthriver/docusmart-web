/** Idioma del documento para el OCR: una lista con los 12 idiomas y la opción de sumar inglés. */
import { useT } from '../../../shared/i18n/I18n'
import { tr } from '../../../shared/i18n/translate'
import { OCR_LANGS, ocrBaseFor, ocrLang, ocrLangName, type OcrBase, type OcrLang } from '../core/ocrLangs'

/** El idioma inicial: el de la web (sin sumar inglés). */
export function useDefaultOcrLang(): OcrLang {
  const { lang } = useT()
  return ocrLang(ocrBaseFor(lang), false)
}

export function OcrLangPicker({ value, onChange, disabled }: { value: OcrLang; onChange: (v: OcrLang) => void; disabled?: boolean }) {
  const { lang } = useT()
  const base = value.replace(/\+eng$/, '') as OcrBase
  const plusEnglish = value.endsWith('+eng')
  // El idioma de la web primero; el resto en orden alfabético.
  const first = ocrBaseFor(lang)
  const others = OCR_LANGS.filter((l) => l !== first).sort((a, b) => ocrLangName(a, lang).localeCompare(ocrLangName(b, lang), lang))
  return (
    <div className="field">
      <span>{tr('ocr.docLang')}</span>
      <select className="input" aria-label={tr('ocr.lang')} value={base} disabled={disabled} onChange={(e) => onChange(ocrLang(e.target.value as OcrBase, plusEnglish))}>
        {[first, ...others].map((l) => (
          <option key={l} value={l}>
            {ocrLangName(l, lang)}
          </option>
        ))}
      </select>
      {base !== 'eng' && (
        <label className="check">
          <input type="checkbox" checked={plusEnglish} disabled={disabled} onChange={(e) => onChange(ocrLang(base, e.target.checked))} />
          <span>{tr('ocr.plusEnglish')}</span>
        </label>
      )}
    </div>
  )
}
