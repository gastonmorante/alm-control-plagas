import os
import base64
from io import BytesIO
from PIL import Image
import numpy as np
import vtracer

REF_PATH = r'C:\Users\PC\.gemini\antigravity\brain\049d5853-8034-4975-8bbc-1d59ac537e78\.user_uploaded\media_1789160184379.png'

im = Image.open(REF_PATH).convert('RGBA')
arr = np.array(im)

ys, xs = np.where(arr[:,:,3] > 0)
x_min, x_max = int(xs.min()), int(xs.max() + 1)
y_min, y_max = int(ys.min()), int(ys.max() + 1)
print(f'Bounding box: x=({x_min}, {x_max}), y=({y_min}, {y_max}), size=({x_max-x_min}, {y_max-y_min})')

cropped = im.crop((x_min, y_min, x_max, y_max))
w, h = cropped.size

scale = 4
hires_logo = cropped.resize((w * scale, h * scale), Image.Resampling.LANCZOS)

iso_cropped = cropped.crop((0, 0, w, 237))
iso_arr = np.array(iso_cropped)
iso_ys, iso_xs = np.where(iso_arr[:,:,3] > 0)
iso_tight = iso_cropped.crop((int(iso_xs.min()), int(iso_ys.min()), int(iso_xs.max() + 1), int(iso_ys.max() + 1)))
hires_iso = iso_tight.resize((iso_tight.width * scale, iso_tight.height * scale), Image.Resampling.LANCZOS)

os.makedirs('assets/logos', exist_ok=True)

png_logo_paths = [
    'logo_transparent.png',
    'logo_alm_main.png',
    'logo_alm_intro.png',
    'aml logo.png',
    'assets/logos/logo_transparent.png',
    'assets/logos/logo_alm_main.png',
    'assets/logos/logo_alm_intro.png'
]
for p in png_logo_paths:
    hires_logo.save(p, 'PNG', optimize=True)
    print(f'Saved: {p} ({hires_logo.size})')

iso_paths = [
    'isologo.png',
    'isologo_transparent.png',
    'assets/logos/isologo.png',
    'assets/logos/isologo_transparent.png'
]
for p in iso_paths:
    hires_iso.save(p, 'PNG', optimize=True)
    print(f'Saved: {p} ({hires_iso.size})')

buffered = BytesIO()
hires_logo.save(buffered, format='PNG', optimize=True)
b64_logo = base64.b64encode(buffered.getvalue()).decode('ascii')

svg_content = f'''<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 {w} {h}\" width=\"100%\" height=\"100%\">
  <defs>
    <filter id=\"drop-shadow\" x=\"-10%\" y=\"-10%\" width=\"120%\" height=\"120%\">
      <feDropShadow dx=\"0\" dy=\"2\" stdDeviation=\"3\" flood-color=\"#000\" flood-opacity=\"0.12\"/>
    </filter>
  </defs>
  <image href=\"data:image/png;base64,{b64_logo}\" width=\"{w}\" height=\"{h}\" filter=\"url(#drop-shadow)\" preserveAspectRatio=\"xMidYMid meet\" />
</svg>
'''

with open('logo_alm.svg', 'w', encoding='utf-8') as f:
    f.write(svg_content)
with open('assets/logos/logo_alm.svg', 'w', encoding='utf-8') as f:
    f.write(svg_content)
print(f'Saved logo_alm.svg and assets/logos/logo_alm.svg (viewBox: 0 0 {w} {h})')

vtracer.convert_image_to_svg_py(
    'logo_transparent.png',
    'assets/logos/logo_alm_vector_paths.svg',
    colormode='color',
    hierarchical='stacked',
    mode='spline',
    filter_speckle=8,
    color_precision=8,
    layer_difference=12,
    corner_threshold=45,
    length_threshold=4.0,
    max_iterations=10,
    splice_threshold=45,
    path_precision=2
)
print('Saved pure vector paths: assets/logos/logo_alm_vector_paths.svg')
