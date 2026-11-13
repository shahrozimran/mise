"""Generate the typographic Mise launcher PNGs; no SVG artwork is used.

Requires Pillow. Windows uses Segoe UI Semibold; other hosts can pass a font path.
Usage: python tools/render-icon.py [path/to/font.ttf]
"""
from pathlib import Path
import sys
from PIL import Image, ImageDraw, ImageFont

root = Path(__file__).resolve().parent.parent / 'apps/mobile/assets'
font_path = sys.argv[1] if len(sys.argv) > 1 else 'C:/Windows/Fonts/seguisb.ttf'
font = ImageFont.truetype(font_path, 470)
for filename, background in [('mise-icon.png', '#252422'), ('mise-foreground.png', (0, 0, 0, 0))]:
    image = Image.new('RGBA', (1024, 1024), background)
    draw = ImageDraw.Draw(image)
    box = draw.textbbox((0, 0), 'm.', font=font)
    draw.text(((1024-box[2]+box[0])/2-box[0], (1024-box[3]+box[1])/2-box[1]), 'm.', font=font, fill='#F8F6F1')
    image.save(root / filename)
