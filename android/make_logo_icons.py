import os, sys
from PIL import Image, ImageDraw

SRC = sys.argv[1]   # assets/pure-pak-logo.jpeg
RES = sys.argv[2]  # .../res

def rounded_mask(size, radius):
    m = Image.new('L', (size, size), 0)
    ImageDraw.Draw(m).rounded_rectangle([0, 0, size, size], radius=radius, fill=255)
    return m

def logo_tile(size, path, pad_ratio=0.16, radius_ratio=0.22):
    """White rounded tile with the logo centered — works on any screen bg."""
    tile = Image.new('RGBA', (size, size), (255, 255, 255, 255))
    logo = Image.open(SRC).convert('RGBA')
    pad = int(size * pad_ratio)
    box = size - 2 * pad
    logo.thumbnail((box, box), Image.LANCZOS)
    tile.paste(logo, ((size - logo.width)//2, (size - logo.height)//2), logo)
    out = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    out.paste(tile, (0, 0), rounded_mask(size, int(size * radius_ratio)))
    out.save(path, 'PNG')
    print('wrote', os.path.relpath(path, os.path.dirname(RES)), out.size)

sizes = {'mdpi': 48, 'hdpi': 72, 'xhdpi': 96, 'xxhdpi': 144, 'xxxhdpi': 192}
for d, s in sizes.items():
    logo_tile(s, os.path.join(RES, f'mipmap-{d}', 'ic_launcher.png'))

# top-bar / setup-screen logo (used as ImageView, sized by layout)
os.makedirs(os.path.join(RES, 'drawable'), exist_ok=True)
logo_tile(112, os.path.join(RES, 'drawable', 'purepak_logo.png'))
