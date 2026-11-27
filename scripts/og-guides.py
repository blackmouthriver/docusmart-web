"""
Imagen para compartir cada guía (W-102): una de 1200x630 por guía y por idioma en
public/img/og/guias/<idioma>/<slug>.jpg, con el título de la guía y su mejor captura (ogShot en
tools/guide-images.mjs). La usan og:image, twitter:card y el `image` del Article de la guía.

Como og-images.py, se genera a mano y se guarda en el repo (necesita Pillow y las fuentes del
sistema para ruso, japonés, coreano y chino). Volver a correrlo al agregar o traducir una guía, al
cambiar su título o al rehacer las capturas (scripts/screenshots.mjs):

    python scripts/og-guides.py              # todas
    python scripts/og-guides.py es en        # solo esos idiomas
"""
import importlib.util
import json
import os
import subprocess
import sys

from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'public', 'img', 'og', 'guias')
SHOTS = os.path.join(ROOT, 'public', 'img', 'guides')

# Las fuentes, el logo y los colores son los de la imagen general (og-images.py).
_spec = importlib.util.spec_from_file_location('og_images', os.path.join(ROOT, 'scripts', 'og-images.py'))
og = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(og)
W, H = og.W, og.H

LIST = """
import { GUIDE_LANGS, guideUi, guidesIn, localizedGuide } from './tools/guides/index.mjs'
import { ogShot } from './tools/guide-images.mjs'
const out = GUIDE_LANGS.flatMap((lang) => guidesIn(lang).map((g) => {
  const ui = guideUi(lang)
  return { slug: g.slug, lang, h1: localizedGuide(g, lang).h1, kicker: ui.guides, minutes: ui.minutes.replace('{n}', g.minutes), shot: ogShot(g.slug) }
}))
console.log(JSON.stringify(out))
"""


def guide_list():
    res = subprocess.run(['node', '--input-type=module', '-e', LIST], cwd=ROOT, capture_output=True, text=True, encoding='utf-8')
    if res.returncode:
        sys.exit(res.stderr)
    return json.loads(res.stdout)


def shot_image(shot, lang):
    """La captura de escritorio del idioma de la guía; si falta, la española (como en las páginas)."""
    for l in (lang, 'es'):
        p = os.path.join(SHOTS, l, *shot.split('/')) + '-1280.webp'
        if os.path.exists(p):
            return Image.open(p).convert('RGB')
    sys.exit(f'Falta la captura {shot} (corre node scripts/screenshots.mjs)')


def card(shot, max_w, max_h):
    """La captura sobre una tarjeta blanca con margen y esquinas redondeadas; si es más alta que el
    espacio, se ve su parte de arriba."""
    pad = 18
    w = max_w - 2 * pad
    h = round(shot.height * w / shot.width)
    shot = shot.resize((w, h), Image.LANCZOS)
    if h > max_h - 2 * pad:
        h = max_h - 2 * pad
        shot = shot.crop((0, 0, w, h))
    out = Image.new('RGBA', (w + 2 * pad, h + 2 * pad), (0, 0, 0, 0))
    ImageDraw.Draw(out).rounded_rectangle([0, 0, out.width - 1, out.height - 1], radius=24, fill=(255, 255, 255, 255))
    out.paste(shot, (pad, pad))
    return out


def render(g):
    lang = g['lang']
    cjk = lang in og.CJK
    img = Image.new('RGBA', (W, H), og.NIGHT + (255,))
    og.glow(img, (160, 110), 340, og.BLUE, 120)
    og.glow(img, (1040, 560), 300, (14, 165, 233), 90)
    d = ImageDraw.Draw(img)

    # Captura a la derecha, centrada en alto
    c = card(shot_image(g['shot'], lang), 600, H - 2 * 56)
    cx, cy = W - c.width - 56, (H - c.height) // 2
    shadow = Image.new('RGBA', img.size, (0, 0, 0, 0))
    ImageDraw.Draw(shadow).rounded_rectangle([cx + 8, cy + 24, cx + c.width + 8, cy + c.height + 16], radius=30, fill=(37, 99, 255, 110))
    img.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(36)))
    img.alpha_composite(c, (cx, cy))

    left = 64
    text_w = cx - left - 48
    # Marca
    img.alpha_composite(og.logo(56), (left, 56))
    d.text((left + 72, 56 + 28), 'DocuSmart', font=og.display_font('es', 34, 'DocuSmart'), fill='white', anchor='lm')

    # «Guías · 4 min de lectura»
    kicker = f"{g['kicker']} · {g['minutes']}"
    kf = og.body_font(lang, 22, 700, kicker)
    d.text((left, 168), kicker.upper() if not cjk and lang != 'ru' else kicker, font=kf, fill=og.CYAN)

    # Título: el tamaño más grande con el que entra en 4 líneas
    title = g['h1']
    size = 58
    while True:
        f = og.display_font(lang, size, title)
        lines = og.wrap(d, title, f, text_w, lang in og.NO_SPACES)
        if (len(lines) <= 4 and all(d.textlength(ln, font=f) <= text_w for ln in lines)) or size <= 30:
            break
        size -= 2
    lh = round(size * (1.22 if cjk else 1.08))
    y = 214
    for ln in lines:
        d.text((left, y), ln, font=f, fill='white')
        y += lh

    # Dominio
    df = og.body_font('es' if lang not in og.SYSTEM else lang, 24, 700)
    d.text((left, H - 56), 'docusmart.online', font=df, fill=og.CYAN, anchor='ls')

    folder = os.path.join(OUT, lang)
    os.makedirs(folder, exist_ok=True)
    out = os.path.join(folder, f"{g['slug']}.jpg")
    img.convert('RGB').save(out, 'JPEG', quality=78, optimize=True, progressive=True)
    return out


if __name__ == '__main__':
    langs = set(sys.argv[1:])
    total = 0
    for g in guide_list():
        if langs and g['lang'] not in langs:
            continue
        p = render(g)
        total += os.path.getsize(p)
        print(p, os.path.getsize(p))
    print(f'Total: {total / 1e6:.1f} MB')
