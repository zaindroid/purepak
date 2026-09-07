"""Generate PurePak full icon set: adaptive launcher (API26+), legacy mipmaps,
round icons. Brand: blue #0A4D8C bg, white rounded tile, official double-P logo."""
import os
from PIL import Image, ImageDraw

RES = "app/src/main/res"
LOGO = "app/src/main/res/drawable/purepak_logo.png"
BLUE = (10, 77, 140, 255)

def rounded_mask(size, radius):
    m = Image.new("L", (size, size), 0)
    ImageDraw.Draw(m).rounded_rectangle([0, 0, size - 1, size - 1], radius, fill=255)
    return m

LOGO_C = None
def get_logo(target):
    global LOGO_C
    if LOGO_C is None:
        logo = Image.open(LOGO).convert("RGBA")
        bbox = logo.getchannel("A").getbbox()
        LOGO_C = logo.crop(bbox) if bbox else logo
    ratio = target / max(LOGO_C.width, LOGO_C.height)
    return LOGO_C.resize((int(LOGO_C.width * ratio), int(LOGO_C.height * ratio)), Image.LANCZOS)

def make_icon(size, legacy):
    S = size
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    if legacy:
        bg = Image.new("RGBA", (S, S), BLUE)
        bg.putalpha(rounded_mask(S, int(S * 0.2237)))
        img = Image.alpha_composite(img, bg)
    else:
        img = Image.new("RGBA", (S, S), BLUE)
    tw = int(S * 0.62)
    pad = (S - tw) // 2
    tile = Image.new("RGBA", (tw, tw), (255, 255, 255, 255))
    tile.putalpha(rounded_mask(tw, int(tw * 0.24)))
    img.alpha_composite(tile, (pad, pad))
    logo = get_logo(int(tw * 0.72))
    off = ((tw - logo.width) // 2, (tw - logo.height) // 2)
    img.alpha_composite(logo, (pad + off[0], pad + off[1]))
    return img

SPECS = {"mdpi": 48, "hdpi": 72, "xhdpi": 96, "xxhdpi": 144, "xxxhdpi": 192}
for d, s in SPECS.items():
    make_icon(s, legacy=True).save(os.path.join(RES, f"mipmap-{d}", "ic_launcher.png"))
    print("mipmap", d)
for d, s in SPECS.items():
    img = make_icon(s, legacy=True)
    circ = Image.new("L", (s, s), 0)
    ImageDraw.Draw(circ).ellipse([0, 0, s - 1, s - 1], fill=255)
    img.putalpha(circ)
    os.makedirs(os.path.join(RES, f"mipmap-round-{d}"), exist_ok=True)
    img.save(os.path.join(RES, f"mipmap-round-{d}", "ic_launcher.png"))
    print("round", d)
os.makedirs(os.path.join(RES, "mipmap-anydpi-v26"), exist_ok=True)
make_icon(432, legacy=False).save(os.path.join(RES, "drawable", "ic_launcher_foreground.png"))
print("foreground")
print("DONE")
