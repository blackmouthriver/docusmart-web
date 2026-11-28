/**
 * Catálogo de acciones del asistente (W-151.3): lo que el asistente puede PROPONER hacer, con sus
 * parámetros y la validación de cada uno. Es la misma lista que usan el analizador de pedidos
 * (W-151.4), la tarjeta «Hacer / Cambiar» (W-151.5), el encadenado de pasos (W-151.8) y la IA del
 * navegador con salida estructurada (W-151.14, con `actionSchema()`).
 *
 * Nada de aquí ejecuta ni guarda: una acción es solo una propuesta validada. La contraseña (`password`)
 * nunca se guarda ni se registra: `redactAction()` la oculta antes de mostrar o enviar cualquier cosa.
 */
import toolSlugs from '../../../shared/files/toolPageSlugs.json'

/** Herramientas que existen (las mismas de las páginas del sitio). */
export const TOOL_SLUGS: ReadonlySet<string> = new Set(Object.keys(toolSlugs))

/** Idiomas del reconocimiento de texto y de la transcripción (los 12 del sitio). */
export const LANGS = ['es', 'en', 'pt', 'fr', 'it', 'de', 'ca', 'eu', 'ru', 'ja', 'ko', 'zh'] as const
/** Posiciones en la página (marca de agua, numeración). */
export const POSITIONS = ['top-left', 'top-center', 'top-right', 'middle-left', 'center', 'middle-right', 'bottom-left', 'bottom-center', 'bottom-right'] as const

/** Tipo de cada opción y sus límites. */
export type OptionSpec =
  | { kind: 'bytes'; min: number; max: number }
  | { kind: 'int'; min: number; max: number }
  | { kind: 'pages' }
  | { kind: 'enum'; values: readonly string[] }
  | { kind: 'text'; maxLength: number }
  | { kind: 'secret'; maxLength: number }
  | { kind: 'bool' }

const MB = 1024 * 1024
/** Todas las opciones que una herramienta puede recibir desde el asistente. */
export const OPTIONS = {
  /** Tamaño máximo del resultado, en bytes («a menos de 2 MB»). */
  targetSize: { kind: 'bytes', min: 10 * 1024, max: 2048 * MB },
  /** Páginas, como las escribe la persona: «1-3, 5». Se validan contra el documento al ejecutar. */
  pages: { kind: 'pages' },
  /** Grados de giro. */
  angle: { kind: 'enum', values: ['90', '180', '270'] },
  /** Formato de salida (cada herramienta acepta los suyos, ver TOOL_OPTIONS). */
  format: { kind: 'enum', values: ['jpg', 'png', 'webp', 'avif', 'gif', 'mp4', 'webm', 'mp3', 'zip', '7z', 'docx', 'xlsx', 'txt'] },
  /** Calidad, de 1 a 100. */
  quality: { kind: 'int', min: 1, max: 100 },
  /** Ancho y alto en píxeles. */
  width: { kind: 'int', min: 1, max: 16384 },
  height: { kind: 'int', min: 1, max: 16384 },
  /** Porcentaje del tamaño original. */
  percent: { kind: 'int', min: 5, max: 200 },
  /** Resolución (puntos por pulgada). */
  dpi: { kind: 'int', min: 72, max: 600 },
  /** Texto de una marca de agua. */
  text: { kind: 'text', maxLength: 200 },
  /** Posición en la página. */
  position: { kind: 'enum', values: POSITIONS },
  /** Blanco y negro / escala de grises. */
  grayscale: { kind: 'bool' },
  /** Idioma del documento o del audio. */
  language: { kind: 'enum', values: LANGS },
  /** Contraseña: nunca se guarda ni se registra. */
  password: { kind: 'secret', maxLength: 128 },
} as const satisfies Record<string, OptionSpec>

export type OptionKey = keyof typeof OPTIONS
export type OptionValue = string | number | boolean
export type Options = Partial<Record<OptionKey, OptionValue>>

/**
 * Qué opciones acepta cada herramienta desde el asistente (y, para `format`, cuáles). Una herramienta
 * que no está aquí se puede abrir, pero sin opciones.
 */
export const TOOL_OPTIONS: Readonly<Record<string, Partial<Record<OptionKey, readonly string[] | true>>>> = {
  'comprimir-pdf': { targetSize: true, grayscale: true },
  'comprimir-imagen': { targetSize: true, quality: true, format: ['jpg', 'webp'] },
  'comprimir-video': { targetSize: true },
  'dividir-pdf': { pages: true },
  'rotar-pdf': { angle: true, pages: true },
  'rotar-imagen': { angle: true },
  'pdf-a-jpg': { pages: true, dpi: true, format: ['jpg', 'png'] },
  'ocr-pdf': { language: true },
  'imagen-a-texto': { language: true },
  'audio-a-texto': { language: true },
  'redimensionar-imagen': { width: true, height: true, percent: true },
  'heic-a-jpg': { quality: true, format: ['jpg', 'png'] },
  'imagen-a-webp': { quality: true },
  'convertir-video': { format: ['mp4', 'webm'] },
  'comprimir-archivos': { format: ['zip', '7z'], password: true },
  'proteger-pdf': { password: true },
  'desbloquear-pdf': { password: true },
  'marca-de-agua-pdf': { text: true, position: true },
  'marca-de-agua-imagen': { text: true, position: true },
  // La numeración no va al medio de la página.
  'numerar-paginas-pdf': { position: ['top-left', 'top-center', 'top-right', 'bottom-left', 'bottom-center', 'bottom-right'] },
  'ajustar-imagen': { grayscale: true },
}

/** Abrir una herramienta, con opciones ya puestas y, si se pide, el archivo que la persona tiene abierto. */
export type OpenToolAction = { kind: 'openTool'; tool: string; options?: Options; useCurrentFile?: boolean }
/** Varios pasos seguidos: el resultado de cada uno pasa al siguiente (W-151.8). */
export type ChainAction = { kind: 'chain'; steps: OpenToolAction[] }
/** Mostrar una respuesta de la base de conocimiento. */
export type ExplainAction = { kind: 'explain'; entry: string }
export type AssistantAction = OpenToolAction | ChainAction | ExplainAction

/** Pasos de un encadenado: al menos 2 (si no, es un openTool) y como mucho 5. */
export const CHAIN_MIN = 2
export const CHAIN_MAX = 5

export type Validation = { ok: true; action: AssistantAction } | { ok: false; errors: string[] }

/** Valida (y normaliza) un valor según su opción. Devuelve el valor limpio o un error. */
function checkOption(key: OptionKey, value: unknown, allowed: readonly string[] | true): { value: OptionValue } | { error: string } {
  const spec: OptionSpec = OPTIONS[key]
  switch (spec.kind) {
    case 'bytes':
    case 'int': {
      const n = typeof value === 'string' && value.trim() !== '' ? Number(value) : value
      if (typeof n !== 'number' || !Number.isFinite(n)) return { error: `${key}: no es un número` }
      const v = Math.round(n)
      if (v < spec.min || v > spec.max) return { error: `${key}: fuera de rango (${spec.min}–${spec.max})` }
      return { value: v }
    }
    case 'pages': {
      // Rangos como «1-3, 5» (también «3 a 5» lo traduce el analizador antes de llegar aquí).
      if (typeof value !== 'string' || !/^\s*\d+(\s*-\s*\d+)?(\s*,\s*\d+(\s*-\s*\d+)?)*\s*$/.test(value)) return { error: `${key}: no son páginas válidas` }
      const ranges = value.split(',').map((r) => r.split('-').map((x) => Number(x.trim())))
      if (ranges.some((r) => r.some((x) => x < 1) || (r.length === 2 && r[0] > r[1]))) return { error: `${key}: rango al revés o página 0` }
      return { value: ranges.map((r) => r.join('-')).join(', ') }
    }
    case 'enum': {
      const v = String(value).toLowerCase()
      const values = allowed === true ? spec.values : spec.values.filter((x) => allowed.includes(x))
      if (!values.includes(v)) return { error: `${key}: «${v}» no es válido (${values.join(', ')})` }
      return { value: v }
    }
    case 'text': {
      if (typeof value !== 'string' || !value.trim()) return { error: `${key}: vacío` }
      return value.length > spec.maxLength ? { error: `${key}: más de ${spec.maxLength} caracteres` } : { value: value.trim() }
    }
    case 'secret': {
      if (typeof value !== 'string' || !value) return { error: `${key}: vacía` }
      return value.length > spec.maxLength ? { error: `${key}: más de ${spec.maxLength} caracteres` } : { value }
    }
    case 'bool':
      return typeof value === 'boolean' ? { value } : { error: `${key}: debe ser sí o no` }
  }
}

function validateOpenTool(raw: unknown, errors: string[], where = ''): OpenToolAction | null {
  const a = raw as Partial<OpenToolAction> | null
  if (!a || a.kind !== 'openTool') return errors.push(`${where}no es openTool`), null
  if (typeof a.tool !== 'string' || !TOOL_SLUGS.has(a.tool)) return errors.push(`${where}herramienta desconocida: ${String(a.tool)}`), null
  const accepted = TOOL_OPTIONS[a.tool] ?? {}
  const options: Options = {}
  for (const [key, value] of Object.entries(a.options ?? {})) {
    if (!(key in OPTIONS)) {
      errors.push(`${where}opción desconocida: ${key}`)
      continue
    }
    const allowed = accepted[key as OptionKey]
    if (!allowed) {
      errors.push(`${where}${a.tool} no acepta «${key}»`)
      continue
    }
    const r = checkOption(key as OptionKey, value, allowed)
    if ('error' in r) errors.push(where + r.error)
    else options[key as OptionKey] = r.value
  }
  // Ancho/alto y porcentaje son dos formas excluyentes de redimensionar.
  if (options.percent !== undefined && (options.width !== undefined || options.height !== undefined)) errors.push(`${where}percent no se combina con width/height`)
  return { kind: 'openTool', tool: a.tool, ...(Object.keys(options).length ? { options } : {}), ...(a.useCurrentFile ? { useCurrentFile: true } : {}) }
}

/**
 * Valida una acción venga de donde venga (analizador por reglas, modelo entrenado o la IA del
 * navegador): todo lo que no cumpla se rechaza con la lista de errores, nunca se ejecuta «a medias».
 */
export function validateAction(raw: unknown, knownEntries?: ReadonlySet<string>): Validation {
  const errors: string[] = []
  const a = raw as { kind?: unknown } | null
  if (!a || typeof a !== 'object') return { ok: false, errors: ['no es una acción'] }
  if (a.kind === 'openTool') {
    const action = validateOpenTool(a, errors)
    return errors.length || !action ? { ok: false, errors } : { ok: true, action }
  }
  if (a.kind === 'chain') {
    const steps = (a as Partial<ChainAction>).steps
    if (!Array.isArray(steps) || steps.length < CHAIN_MIN || steps.length > CHAIN_MAX) return { ok: false, errors: [`chain: entre ${CHAIN_MIN} y ${CHAIN_MAX} pasos`] }
    const valid = steps.map((s, i) => validateOpenTool(s, errors, `paso ${i + 1}: `))
    // Solo el primer paso puede usar el archivo abierto: los demás reciben el resultado del anterior.
    if (valid.slice(1).some((s) => s?.useCurrentFile)) errors.push('chain: solo el primer paso usa el archivo abierto')
    return errors.length ? { ok: false, errors } : { ok: true, action: { kind: 'chain', steps: valid as OpenToolAction[] } }
  }
  if (a.kind === 'explain') {
    const entry = (a as Partial<ExplainAction>).entry
    if (typeof entry !== 'string' || !entry || (knownEntries && !knownEntries.has(entry))) return { ok: false, errors: [`explain: entrada desconocida: ${String(entry)}`] }
    return { ok: true, action: { kind: 'explain', entry } }
  }
  return { ok: false, errors: [`tipo de acción desconocido: ${String(a.kind)}`] }
}

/** Copia de la acción sin la contraseña (para mostrar, registrar o enviar a analítica). */
export function redactAction<T extends AssistantAction>(action: T): T {
  const hide = (s: OpenToolAction): OpenToolAction => (s.options?.password === undefined ? s : { ...s, options: { ...s.options, password: '•••' } })
  if (action.kind === 'openTool') return hide(action) as T
  if (action.kind === 'chain') return { ...action, steps: action.steps.map(hide) }
  return action
}

/**
 * Esquema JSON de una acción (W-151.14: `responseConstraint` de la Prompt API). Describe la forma;
 * los límites finos (qué opciones acepta cada herramienta) los sigue aplicando `validateAction`.
 */
export function actionSchema(): Record<string, unknown> {
  const optionProps = Object.fromEntries(
    Object.entries(OPTIONS)
      // La IA no propone contraseñas: la persona la escribe en la herramienta.
      .filter(([, s]) => s.kind !== 'secret')
      .map(([k, s]) => {
        const spec = s as OptionSpec
        if (spec.kind === 'enum') return [k, { type: 'string', enum: [...spec.values] }]
        if (spec.kind === 'bool') return [k, { type: 'boolean' }]
        if (spec.kind === 'bytes' || spec.kind === 'int') return [k, { type: 'integer', minimum: spec.min, maximum: spec.max }]
        if (spec.kind === 'text') return [k, { type: 'string', maxLength: spec.maxLength }]
        return [k, { type: 'string' }]
      }),
  )
  const openTool = {
    type: 'object',
    properties: {
      kind: { const: 'openTool' },
      tool: { type: 'string', enum: [...TOOL_SLUGS] },
      options: { type: 'object', properties: optionProps, additionalProperties: false },
      useCurrentFile: { type: 'boolean' },
    },
    required: ['kind', 'tool'],
    additionalProperties: false,
  }
  return {
    oneOf: [
      openTool,
      { type: 'object', properties: { kind: { const: 'chain' }, steps: { type: 'array', items: openTool, minItems: CHAIN_MIN, maxItems: CHAIN_MAX } }, required: ['kind', 'steps'], additionalProperties: false },
      { type: 'object', properties: { kind: { const: 'explain' }, entry: { type: 'string' } }, required: ['kind', 'entry'], additionalProperties: false },
    ],
  }
}
