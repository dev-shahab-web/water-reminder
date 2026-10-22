"""Generate chooser previews from the tile's native layout and bundled fonts."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

root = Path(__file__).resolve().parent.parent
font = root / "assets/fonts/WR-Sans-Regular.ttf"
for rounded in (False, True):
    image = Image.new("RGBA", (384, 384), (0, 0, 0, 0) if rounded else "black")
    draw = ImageDraw.Draw(image)
    if rounded:
        draw.ellipse((0, 0, 383, 383), fill="black")
    def text(value, y, size, color):
        draw.text((192, y), value, font=ImageFont.truetype(str(font), size), fill=color, anchor="mm")
    text("TODAY", 64, 24, "#8DDDD3")
    text("900 mL", 117, 48, "#EAF3EF")
    text("45% of 2,000 mL", 160, 24, "#8FA59B")
    draw.rounded_rectangle((44, 210, 340, 306), radius=48, fill="#8DDDD3")
    text("Log water", 256, 28, "#101816")
    output = root / "wear/src/main/res" / ("drawable-round-nodpi" if rounded else "drawable-nodpi")
    output.mkdir(parents=True, exist_ok=True)
    image.save(output / "tile_preview.png")
