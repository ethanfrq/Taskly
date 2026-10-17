"""Builds the README visuals: iPhone-framed screenshots and the hero banners.

Regenerate after new screenshots (macOS, needs Pillow and the SF Pro system font):

    python3 scripts/build-readme-art.py docs/screenshots docs/brand/social-preview.png docs/readme
"""
import os
import sys

from PIL import Image, ImageDraw, ImageFilter, ImageFont

SRC, SOCIAL, OUT = sys.argv[1:4]
os.makedirs(OUT, exist_ok=True)

GRAPHITE = (23, 23, 23)
IVORY = (245, 243, 237)
GRAY = (161, 161, 166)
ACCENT = (245, 166, 35)
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


def logo_from_social():
    """The ivory logo, cut out of the brand social preview (graphite background)."""
    im = Image.open(SOCIAL).convert("RGB")
    band = im.crop((0, 140, im.width, 410))
    lum = band.convert("L").point(lambda v: 255 if v > 120 else 0)
    box = lum.getbbox()
    crop = band.crop(box)
    alpha = crop.convert("L").point(lambda v: max(0, min(255, round((v - 23) * 255 / (245 - 23)))))
    out = Image.new("RGBA", crop.size, IVORY + (255,))
    out.putalpha(alpha)
    return out


def pill(draw, x, y, text, f):
    tw = draw.textlength(text, font=f)
    h = 52
    draw.rounded_rectangle((x, y, x + tw + 44, y + h), h // 2, fill=(38, 38, 40), outline=(60, 60, 64), width=2)
    draw.text((x + 22, y + h // 2), text, font=f, fill=IVORY, anchor="lm")
    return x + tw + 44 + 14


def hero(lang, headline, sub, chips):
    W, H = 1760, 880
    base = Image.new("RGBA", (W, H), GRAPHITE + (255,))
    # Warm glow behind the phones.
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(glow).ellipse((880, 180, 1640, 940), fill=ACCENT + (70,))
    base = Image.alpha_composite(base, glow.filter(ImageFilter.GaussianBlur(140)))

    # Phones: agenda and review behind, today in front.
    def place(name, width, cx, top):
        p = phone(name)
        p = p.resize((width, round(width * p.height / p.width)), Image.LANCZOS)
        base.alpha_composite(p, (cx - width // 2, top))

    place("agenda.jpg", 360, 1010, 230)
    place("review.jpg", 360, 1500, 230)
    place("today-dark.jpg", 420, 1255, 120)

    d = ImageDraw.Draw(base)
    logo = logo_from_social()
    lw = 330
    logo = logo.resize((lw, round(lw * logo.height / logo.width)), Image.LANCZOS)
    base.alpha_composite(logo, (110, 190))
    y = 190 + logo.height + 64
    for line in headline:
        d.text((110, y), line, font=font(60, "Bold"), fill=IVORY)
        y += 74
    y += 22
    for line in sub:
        d.text((110, y), line, font=font(30, "Regular"), fill=GRAY)
        y += 42
    y += 40
    x = 110
    for chip in chips:
        x = pill(d, x, y, chip, font(24, "Medium"))

    # Rounded corners so the banner sits well on light and dark GitHub themes.
    out = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    out.paste(base, (0, 0), rounded_mask((W, H), 36))
    out.save(os.path.join(OUT, f"hero-{lang}.webp"), quality=90, method=6)


for name in ["today-dark", "agenda", "review", "rhythm", "onboarding-color", "stats"]:
    phone(f"{name}.jpg").save(os.path.join(OUT, f"{name}.webp"), quality=88, method=6)

hero(
    "en",
    ["Your day,", "sorted by Claude."],
    ["Mail, calendar and messages become", "one checklist, with reminders", "that actually ring."],
    ["iPhone · Android · Desktop", "Open source · MIT"],
)
hero(
    "fr",
    ["Ta journée,", "triée par Claude."],
    ["Tes mails, ton agenda et tes messages", "deviennent une checklist, avec des", "rappels qui sonnent vraiment."],
    ["iPhone · Android · Ordinateur", "Open source · MIT"],
)
for f in sorted(os.listdir(OUT)):
    print(f, os.path.getsize(os.path.join(OUT, f)) // 1024, "KB", Image.open(os.path.join(OUT, f)).size)
