"""Builds the README visuals: iPhone-framed screenshots, the video posters and the video cards.

Regenerate after new screenshots or a new video render (macOS, needs Pillow and the
SF Pro system font). The fourth argument is the folder of video stills, written by
`node scripts/stills.mjs <composition> 480` in video/ for the four compositions:

    python3 scripts/build-readme-art.py docs/screenshots docs/brand/social-preview.png docs/readme video/out/stills

Without it, only the screenshots are rebuilt.
"""
import os
import sys

from PIL import Image, ImageDraw, ImageFilter, ImageFont

SRC, SOCIAL, OUT = sys.argv[1:4]
STILLS = sys.argv[4] if len(sys.argv) > 4 else None
os.makedirs(OUT, exist_ok=True)

GRAPHITE = (23, 23, 23)
IVORY = (245, 243, 237)
GRAY = (161, 161, 166)
# The app's default accent (iOS blue, dark appearance), so the visuals look like what people install.
ACCENT = (10, 132, 255)
SS = 4  # supersampling for smooth curves


def font(size, weight="Semibold"):
    f = ImageFont.truetype("/System/Library/Fonts/SFNS.ttf", size)
    f.set_variation_by_name(weight)
    return f


def rounded_mask(size, radius):
    w, h = size
    big = Image.new("L", (w * SS, h * SS), 0)
    ImageDraw.Draw(big).rounded_rectangle((0, 0, w * SS - 1, h * SS - 1), radius * SS, fill=255)
    return big.resize(size, Image.LANCZOS)


def phone(name, inner_w=440):
    """A screenshot inside an iPhone-like frame, on a transparent canvas with a soft shadow."""
    shot = Image.open(os.path.join(SRC, name)).convert("RGB")
    inner_h = round(inner_w * shot.height / shot.width)
    shot = shot.resize((inner_w, inner_h), Image.LANCZOS)
    bezel, pad = 14, 36
    w, h = inner_w + 2 * bezel, inner_h + 2 * bezel
    outer_r, inner_r = 70, 56

    body = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    frame = Image.new("RGBA", (w, h), (18, 18, 20, 255))
    body.paste(frame, (0, 0), rounded_mask((w, h), outer_r))
    # Thin metallic edge.
    edge = Image.new("L", (w * SS, h * SS), 0)
    ImageDraw.Draw(edge).rounded_rectangle((0, 0, w * SS - 1, h * SS - 1), outer_r * SS, outline=255, width=3 * SS)
    body.paste(Image.new("RGBA", (w, h), (70, 70, 74, 255)), (0, 0), edge.resize((w, h), Image.LANCZOS))
    body.paste(shot, (bezel, bezel), rounded_mask((inner_w, inner_h), inner_r))
    # Dynamic Island.
    island_w, island_h = round(inner_w * 0.27), round(inner_w * 0.075)
    isl = Image.new("L", (island_w * SS, island_h * SS), 0)
    ImageDraw.Draw(isl).rounded_rectangle((0, 0, island_w * SS - 1, island_h * SS - 1), island_h * SS // 2, fill=255)
    body.paste(Image.new("RGBA", (island_w, island_h), (0, 0, 0, 255)), ((w - island_w) // 2, bezel + 12), isl.resize((island_w, island_h), Image.LANCZOS))

    canvas = Image.new("RGBA", (w + 2 * pad, h + 2 * pad), (0, 0, 0, 0))
    shadow = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    shadow_mask = Image.new("L", canvas.size, 0)
    shadow_mask.paste(rounded_mask((w, h), outer_r), (pad, pad + 10))
    shadow.putalpha(shadow_mask.filter(ImageFilter.GaussianBlur(16)).point(lambda a: a * 0.35))
    canvas = Image.alpha_composite(canvas, shadow)
    canvas.alpha_composite(body, (pad, pad))
    return canvas


def still(composition):
    return Image.open(os.path.join(STILLS, composition, "f480.png")).convert("RGBA")


def poster(composition, name, size):
    """A plain frame of the video, the <video> poster on the landing page."""
    still(composition).resize(size, Image.LANCZOS).convert("RGB").save(os.path.join(OUT, f"{name}.webp"), quality=86, method=6)


def play_pill(base, x, y, text, f):
    """A translucent dark pill with a play triangle and light text, bottom-left of the card."""
    d = ImageDraw.Draw(base)
    tw = d.textlength(text, font=f)
    h = 64
    tri_w = 20
    w = 26 + tri_w + 16 + round(tw) + 28
    layer = Image.new("RGBA", base.size, (0, 0, 0, 0))
    ImageDraw.Draw(layer).rounded_rectangle((x, y, x + w, y + h), h // 2, fill=(0, 0, 0, 160), outline=(255, 255, 255, 46), width=2)
    base.alpha_composite(layer)
    tri = Image.new("L", (tri_w * SS, h * SS), 0)
    ImageDraw.Draw(tri).polygon([(0, 20 * SS), (0, 44 * SS), (tri_w * SS, 32 * SS)], fill=255)
    base.paste(Image.new("RGBA", (tri_w, h), IVORY + (255,)), (x + 26, y), tri.resize((tri_w, h), Image.LANCZOS))
    ImageDraw.Draw(base).text((x + 26 + tri_w + 16, y + h // 2), text, font=f, fill=IVORY, anchor="lm")


def video_card(lang, caption):
    """The README's first image: a frame of the video with a play pill. Links to the file."""
    W, H = 1760, 990
    base = still(f"TasklyPromo{lang.upper()}").resize((W, H), Image.LANCZOS)
    play_pill(base, 40, H - 40 - 64, f"{caption}  ·  0:30", font(28, "Semibold"))

    # Rounded corners so the card sits well on light and dark GitHub themes.
    out = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    out.paste(base, (0, 0), rounded_mask((W, H), 36))
    out.save(os.path.join(OUT, f"video-{lang}.webp"), quality=90, method=6)


for name in ["today-dark", "agenda", "review", "rhythm", "onboarding-color", "stats"]:
    phone(f"{name}.jpg").save(os.path.join(OUT, f"{name}.webp"), quality=88, method=6)

if STILLS:
    poster("TasklyPromoEN", "poster-en", (1280, 720))
    poster("TasklyPromoFR", "poster-fr", (1280, 720))
    poster("TasklyPromoEN-Vertical", "poster-en-vertical", (720, 1280))
    poster("TasklyPromoFR-Vertical", "poster-fr-vertical", (720, 1280))
    video_card("en", "Taskly in 30 seconds")
    video_card("fr", "Taskly en 30 secondes")
for f in sorted(os.listdir(OUT)):
    print(f, os.path.getsize(os.path.join(OUT, f)) // 1024, "KB", Image.open(os.path.join(OUT, f)).size)
