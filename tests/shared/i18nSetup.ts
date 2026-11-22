/**
 * En las pruebas, los textos en español quedan cargados desde el inicio (en la web cada
 * página carga el diccionario de su idioma antes de dibujar).
 */
import { setCurrentDict } from '../../src/shared/i18n/translate'
import { es } from '../../src/shared/i18n/messages/es'

setCurrentDict(es)
