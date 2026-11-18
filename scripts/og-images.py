"""
Imagen para compartir (W-12): una de 1200x630 por idioma en public/img/og/<idioma>.jpg, que usan la
portada, /herramientas y las páginas de herramientas de ese idioma (og:image y twitter:card
summary_large_image).

Se genera a mano y se guarda en el repo (no en el CI): necesita Pillow y fuentes del sistema para
ruso, japonés, coreano y chino, que el runner de GitHub no tiene. Volver a correrlo si cambian el
título o la descripción de la portada (los lee de site/<idioma>/index.html, así que antes `npm run pages`):

    python scripts/og-images.py
"""
import html
import os
import re
import sys

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'public', 'img', 'og')
LANGS = ['es', 'en', 'pt', 'fr', 'it', 'de', 'ca', 'eu', 'ru', 'ja', 'ko', 'zh']
W, H = 1200, 630

FS = os.path.join(ROOT, 'node_modules', '@fontsource-variable')
BRICOLAGE = os.path.join(FS, 'bricolage-grotesque', 'files', 'bricolage-grotesque-latin-opsz-normal.woff2')
BRICOLAGE_EXT = os.path.join(FS, 'bricolage-grotesque', 'files', 'bricolage-grotesque-latin-ext-opsz-normal.woff2')
JAKARTA = os.path.join(FS, 'plus-jakarta-sans', 'files', 'plus-jakarta-sans-latin-wght-normal.woff2')
JAKARTA_EXT = os.path.join(FS, 'plus-jakarta-sans', 'files', 'plus-jakarta-sans-latin-ext-wght-normal.woff2')

# Fuentes del sistema para los alfabetos que Bricolage y Plus Jakarta no tienen (Windows, y Noto en Linux).
WIN = os.path.join(os.environ.get('WINDIR', r'C:\Windows'), 'Fonts')
SYSTEM = {
    'ru': ([os.path.join(WIN, 'arialbd.ttf'), '/usr/share/fonts/truetype/noto/NotoSans-Bold.ttf'],
           [os.path.join(WIN, 'arial.ttf'), '/usr/share/fonts/truetype/noto/NotoSans-Regular.ttf']),
    'ja': ([os.path.join(WIN, 'YuGothB.ttc'), '/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc'],
           [os.path.join(WIN, 'YuGothM.ttc'), '/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc']),
    'ko': ([os.path.join(WIN, 'malgunbd.ttf'), '/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc'],
           [os.path.join(WIN, 'malgun.ttf'), '/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc']),
    'zh': ([os.path.join(WIN, 'msyhbd.ttc'), '/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc'],
           [os.path.join(WIN, 'msyh.ttc'), '/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc']),
}
CJK = {'ja', 'ko', 'zh'}
# Sin espacios entre palabras (el coreano sí los usa).
NO_SPACES = {'ja', 'zh'}

NIGHT = (11, 16, 32)
TEXT_SOFT = (184, 194, 221)
BLUE = (37, 99, 255)
BLUE_LIGHT = (96, 165, 250)
CYAN = (126, 224, 255)


def first_existing(paths):
    for p in paths:
        if os.path.exists(p):
            return p
    sys.exit(f'Falta una fuente: {paths}')


def display_font(lang, size, text):
    if lang in SYSTEM:
        return ImageFont.truetype(first_existing(SYSTEM[lang][0]), size)
    # Bricolage latín no trae ő, ş, etc.: en ese caso, su subconjunto latín extendido.
    path = BRICOLAGE_EXT if re.search(r'[\u0100-\u024F]', text) else BRICOLAGE
    f = ImageFont.truetype(path, size)
    f.set_variation_by_axes([96, 800])
    return f


def body_font(lang, size, weight=500, text=''):
    if lang in SYSTEM:
        return ImageFont.truetype(first_existing(SYSTEM[lang][1]), size)
    # Como en Bricolage: el subconjunto latín extendido solo si el texto lo necesita (no trae a-z).
    f = ImageFont.truetype(JAKARTA_EXT if re.search(r'[Ā-ɏ]', text) else JAKARTA, size)
    f.set_variation_by_axes([weight])
    return f


def landing_texts(lang):
    """Las dos líneas del título (cortadas en <br class="h1-break">) y la descripción para compartir."""
    path = os.path.join(ROOT, 'site', *([] if lang == 'es' else [lang]), 'index.html')
    src = open(path, encoding='utf-8').read()
    h1 = re.search(r'<h1[^>]*>(.*?)</h1>', src, re.S).group(1)
    first, second = h1.split('<br class="h1-break">')
    words = lambda part: [html.unescape(re.sub(r'<[^>]+>', '', w)).strip() for w in re.findall(r'<span class="word">(.*?)</span>', part, re.S)]
    sep = '' if lang in NO_SPACES else ' '
    desc = html.unescape(re.search(r'<meta property="og:description" content="([^"]*)"', src).group(1))
    return sep.join(words(first)), sep.join(words(second)), desc


def wrap(draw, text, font, width, cjk):
    units = list(text) if cjk else text.split(' ')
    sep = '' if cjk else ' '
    lines, cur = [], ''
    for u in units:
        trial = cur + (sep if cur else '') + u
        if draw.textlength(trial, font=font) <= width or not cur:
            cur = trial
        else:
            lines.append(cur)
            cur = u
    if cur:
        lines.append(cur)
    return lines


def gradient(size, a, b, horizontal=True):
    w, h = size
    g = Image.new('RGB', size)
    px = g.load()
    for i in range(w if horizontal else h):
        t = i / max(1, (w if horizontal else h) - 1)
        c = tuple(round(a[k] + (b[k] - a[k]) * t) for k in range(3))
        if horizontal:
            for y in range(h):
                px[i, y] = c
        else:
            for x in range(w):
                px[x, i] = c
    return g


def glow(img, center, radius, color, alpha):
    layer = Image.new('RGBA', img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    cx, cy = center
    d.ellipse([cx - radius, cy - radius, cx + radius, cy + radius], fill=color + (alpha,))
    layer = layer.filter(ImageFilter.GaussianBlur(radius * 0.55))
    img.alpha_composite(layer)


def logo(size):
    """El ícono de public/img/icon.svg (viewBox 108) dibujado a `size` px, con esquinas redondeadas."""
    s = size / 108
    big = Image.new('RGBA', (108 * 4, 108 * 4))
    g = gradient((108 * 4, 108 * 4), (30, 155, 255), (59, 31, 224))
    big.paste(g)
    d = ImageDraw.Draw(big)
    k = 4
    d.rounded_rectangle([36 * k, 32 * k, 72 * k, 76 * k], radius=4 * k, fill='white')
    d.rounded_rectangle([42 * k, 44 * k, 66 * k, 47 * k], radius=1.5 * k, fill=(201, 214, 255))
    d.rounded_rectangle([42 * k, 62 * k, 66 * k, 65 * k], radius=1.5 * k, fill=(201, 214, 255))
    d.rounded_rectangle([34 * k, 52.5 * k, 74 * k, 56 * k], radius=1.75 * k, fill=CYAN)
    lw = round(3.2 * k)
    # Las 4 esquinas de la mira (mismos puntos que el SVG; la curva se aproxima con un punto medio).
    for x0, y0, dx, dy in [(28, 36, 1, -1), (80, 36, -1, -1), (28, 72, 1, 1), (80, 72, -1, 1)]:
        pts = [(x0, y0), (x0, y0 + 4 * dy), (x0 + 0.9 * dx, y0 + 6.1 * dy), (x0 + 3 * dx, y0 + 7 * dy), (x0 + 7 * dx, y0 + 7 * dy)]
        d.line([(x * k, y * k) for x, y in pts], fill='white', width=lw, joint='curve')
        for x, y in (pts[0], pts[-1]):  # extremos redondeados
            d.ellipse([x * k - lw / 2, y * k - lw / 2, x * k + lw / 2, y * k + lw / 2], fill='white')
    out = big.resize((size, size), Image.LANCZOS)
    mask = Image.new('L', (size * 4, size * 4), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, size * 4 - 1, size * 4 - 1], radius=size * 4 * 0.24, fill=255)
    out.putalpha(mask.resize((size, size), Image.LANCZOS))
    return out


def phone(height):
    """La captura de la app en un marco de teléfono (como el hero de la portada)."""
    shot = Image.open(os.path.join(ROOT, 'public', 'img', 'screen-home.webp')).convert('RGB')
    pad = round(height * 0.03)
    inner_h = height - 2 * pad
    inner_w = round(inner_h * shot.width / shot.height)
    shot = shot.resize((inner_w, inner_h), Image.LANCZOS)
    w = inner_w + 2 * pad
    frame = Image.new('RGBA', (w, height), (0, 0, 0, 0))
    ImageDraw.Draw(frame).rounded_rectangle([0, 0, w - 1, height - 1], radius=round(w * 0.15), fill=(26, 32, 54, 255))
    m = Image.new('L', (inner_w, inner_h), 0)
    ImageDraw.Draw(m).rounded_rectangle([0, 0, inner_w - 1, inner_h - 1], radius=round(inner_w * 0.12), fill=255)
    frame.paste(shot, (pad, pad), m)
    return frame


def render(lang):
    line1, line2, desc = landing_texts(lang)
    img = Image.new('RGBA', (W, H), NIGHT + (255,))
    glow(img, (180, 120), 360, BLUE, 120)
    glow(img, (1020, 560), 300, (14, 165, 233), 90)
    d = ImageDraw.Draw(img)

    # Teléfono a la derecha, levemente cortado abajo
    ph = phone(600)
    shadow = Image.new('RGBA', img.size, (0, 0, 0, 0))
    px, py = W - ph.width - 92, 64
    ImageDraw.Draw(shadow).rounded_rectangle([px + 10, py + 30, px + ph.width + 10, py + ph.height], radius=60, fill=(37, 99, 255, 110))
    img.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(40)))
    img.alpha_composite(ph, (px, py))

    left, text_w = 72, px - 72 - 56
    # Marca
    lg = logo(64)
    img.alpha_composite(lg, (left, 64))
    brand = display_font('es', 38, 'DocuSmart')
    d.text((left + 82, 64 + 32), 'DocuSmart', font=brand, fill='white', anchor='lm')

    # Título en dos líneas, del tamaño más grande que entre
    size = 76
    while size > 40:
        f = display_font(lang, size, line1 + line2)
        if max(d.textlength(line1, font=f), d.textlength(line2, font=f)) <= text_w:
            break
        size -= 2
    y = 200
    lh = round(size * (1.18 if lang in CJK else 1.04))
    d.text((left, y), line1, font=f, fill='white')
    # Segunda línea con degradado azul → celeste, como en la portada
    mask = Image.new('L', (W, H), 0)
    ImageDraw.Draw(mask).text((left, y + lh), line2, font=f, fill=255)
    tw = round(d.textlength(line2, font=f))
    grad = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    grad.paste(gradient((max(tw, 1), lh + 20), BLUE_LIGHT, CYAN), (left, y + lh))
    img.paste(grad, (0, 0), Image.composite(mask, Image.new('L', (W, H), 0), mask))

    # Descripción
    bf = body_font(lang, 25, text=desc)
    yy = y + 2 * lh + 28
    for ln in wrap(d, desc, bf, text_w, lang in NO_SPACES)[:3]:
        d.text((left, yy), ln, font=bf, fill=TEXT_SOFT)
        yy += 36

    # Dominio
    df = body_font('es' if lang not in SYSTEM else lang, 24, 700)
    d.text((left, H - 64), 'docusmart.online', font=df, fill=CYAN, anchor='ls')

    os.makedirs(OUT, exist_ok=True)
    out = os.path.join(OUT, f'{lang}.jpg')
    img.convert('RGB').save(out, 'JPEG', quality=86, optimize=True, progressive=True)
    return out


if __name__ == '__main__':
    for lang in (sys.argv[1:] or LANGS):
        p = render(lang)
        print(p, os.path.getsize(p))
