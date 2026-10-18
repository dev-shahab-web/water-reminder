"""Generate bundled static instances. Requires fonttools==4.60.1 (build-time only)."""
from io import BytesIO
from pathlib import Path
from urllib.parse import quote
from urllib.request import urlopen
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

REVISION = "47d54ca1ebb14fd864695f1d39dc734f39017c33"
ROOT = Path(__file__).resolve().parents[1] / "assets" / "fonts"
SOURCES = {
    "Sans": ("googlesansflex", "GoogleSansFlex[ROND,opsz,slnt,wdth,wght].ttf"),
    "Rounded": ("nunito", "Nunito[wght].ttf"),
    "Serif": ("lora", "Lora[wght].ttf"),
}
ROOT.mkdir(parents=True, exist_ok=True)
for family, (folder, filename) in SOURCES.items():
    base = f"https://raw.githubusercontent.com/google/fonts/{REVISION}/ofl/{folder}/"
    original = TTFont(BytesIO(urlopen(base + quote(filename), timeout=60).read()))
    (ROOT / f"{folder}-OFL.txt").write_bytes(urlopen(base + "OFL.txt", timeout=60).read())
    for weight, style in [(400, "Regular"), (600, "Semibold"), (700, "Bold")]:
        axes = {axis.axisTag: axis.defaultValue for axis in original["fvar"].axes}
        axes["wght"] = weight
        if family == "Sans":
            axes["ROND"] = 50
        font = instantiateVariableFont(original, axes, inplace=False)
        # Distinct aliases per weight avoid platform synthesis and variable-font differences.
        name = f"WR-{family}-{style}"
        for record in list(font["name"].names):
            if record.nameID in [1, 2, 4, 6, 16, 17]:
                value = "Regular" if record.nameID in [2, 17] else name
                font["name"].setName(value, record.nameID, record.platformID, record.platEncID, record.langID)
        font.save(ROOT / f"{name}.ttf")
        print(name, (ROOT / f"{name}.ttf").stat().st_size)
