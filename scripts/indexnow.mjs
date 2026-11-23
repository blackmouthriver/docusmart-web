/**
 * IndexNow (W-152): después de cada despliegue, avisa a Bing, Yandex, Seznam, Naver y los demás buscadores
 * que usan IndexNow qué páginas son nuevas o cambiaron, para que no tengan que esperar a releer el sitemap.
 * Google no usa IndexNow: para Google siguen el sitemap y Search Console.
 *
 * Compara el sitemap publicado antes del despliegue con el nuevo: avisa las URL nuevas y las que cambiaron de
 * <lastmod>. Si no hay sitemap anterior, avisa todas. Nunca hace fallar el despliegue: si el aviso falla, deja
 * una advertencia en el CI y sale con 0.
 *
 * Uso: node scripts/indexnow.mjs --new dist/sitemap.xml [--old sitemap-anterior.xml] [--dry-run]
 */
import { existsSync, readFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

export const HOST = 'docusmart.online'
/** Clave pública de IndexNow: no es secreta, se publica en /<clave>.txt para probar que el sitio es nuestro. */
export const INDEXNOW_KEY = 'bdb87f2903b3f95cc8b65ab8ae63933a'
export const KEY_LOCATION = `https://${HOST}/${INDEXNOW_KEY}.txt`
export const ENDPOINT = 'https://api.indexnow.org/indexnow'
/** Máximo de URL por envío que admite IndexNow. */
export const MAX_URLS = 10_000

/** De un sitemap, cada <loc> con su <lastmod> (cadena vacía si no tiene). */
export function parseSitemap(xml) {
  const out = new Map()
  for (const m of xml.matchAll(/<url>([\s\S]*?)<\/url>/g)) {
    const loc = m[1].match(/<loc>\s*([^<\s]+)\s*<\/loc>/)?.[1]
    if (!loc) continue
    out.set(loc, m[1].match(/<lastmod>\s*([^<\s]+)\s*<\/lastmod>/)?.[1] ?? '')
  }
  return out
}

/** URL nuevas o con otro <lastmod>; todas si no hay sitemap anterior. Solo las de nuestro dominio. */
export function changedUrls(previous, current) {
  const ours = (url) => {
    try {
      return new URL(url).host === HOST
    } catch {
      return false
    }
  }
  return [...current]
    .filter(([loc, lastmod]) => ours(loc) && (!previous || previous.get(loc) !== lastmod))
    .map(([loc]) => loc)
}

/** Cuerpos de los envíos a IndexNow, de a MAX_URLS. */
export function buildPayloads(urls) {
  const payloads = []
  for (let i = 0; i < urls.length; i += MAX_URLS) {
    payloads.push({ host: HOST, key: INDEXNOW_KEY, keyLocation: KEY_LOCATION, urlList: urls.slice(i, i + MAX_URLS) })
  }
  return payloads
}

/** 200 (recibido) y 202 (recibido, la clave se valida después) son éxito; lo demás, no. */
export const isAccepted = (status) => status === 200 || status === 202

function arg(argv, name) {
  const i = argv.indexOf(name)
  return i >= 0 ? argv[i + 1] : undefined
}

async function main(argv) {
  const newPath = arg(argv, '--new')
  const oldPath = arg(argv, '--old')
  const dryRun = argv.includes('--dry-run')
  if (!newPath) throw new Error('Falta --new <sitemap.xml>')

  const current = parseSitemap(readFileSync(newPath, 'utf-8'))
  const previousXml = oldPath && existsSync(oldPath) ? readFileSync(oldPath, 'utf-8') : ''
  const previous = previousXml.includes('<urlset') ? parseSitemap(previousXml) : null
  const urls = changedUrls(previous, current)

  console.log(`IndexNow: ${urls.length} de ${current.size} URL nuevas o cambiadas${previous ? '' : ' (sin sitemap anterior: se avisan todas)'}.`)
  if (urls.length === 0 || dryRun) {
    if (dryRun) urls.slice(0, 20).forEach((u) => console.log(`  ${u}`))
    return
  }

  for (const payload of buildPayloads(urls)) {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(payload),
    })
    if (!isAccepted(res.status)) {
      console.log(`::warning::IndexNow respondió ${res.status}: ${(await res.text()).slice(0, 200)}`)
      return
    }
    console.log(`IndexNow: ${payload.urlList.length} URL enviadas (HTTP ${res.status}).`)
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main(process.argv.slice(2)).catch((e) => {
    console.log(`::warning::No se pudo avisar a IndexNow: ${e instanceof Error ? e.message : e}`)
  })
}
