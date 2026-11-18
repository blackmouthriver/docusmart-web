"""
Íconos de la app instalable (W-16) en public/img/pwa/, a partir del mismo logo que dibuja
scripts/og-images.py (public/img/icon.svg):

  icon-192.png, icon-512.png   esquinas redondeadas, fondo transparente ("any")
  maskable-512.png             cuadrado completo: el sistema recorta la forma ("maskable")
  apple-touch-icon.png         180 px, cuadrado sin transparencia (iOS redondea solo)

    python scripts/pwa-icons.py
"""
import importlib.util
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
spec = importlib.util.spec_from_file_location('og', os.path.join(ROOT, 'scripts', 'og-images.py'))
og = importlib.util.module_from_spec(spec)
spec.loader.exec_module(og)

OUT = os.path.join(ROOT, 'public', 'img', 'pwa')
os.makedirs(OUT, exist_ok=True)


def square(size):
    """El logo sin redondear: el degradado llega a los bordes y el dibujo queda en la zona segura."""
    img = og.logo(size)
    img.putalpha(255)
    return img


for size in (192, 512):
    og.logo(size).save(os.path.join(OUT, f'icon-{size}.png'), optimize=True)
square(512).save(os.path.join(OUT, 'maskable-512.png'), optimize=True)
square(180).convert('RGB').save(os.path.join(OUT, 'apple-touch-icon.png'), optimize=True)

for f in sorted(os.listdir(OUT)):
    print(f, os.path.getsize(os.path.join(OUT, f)))
