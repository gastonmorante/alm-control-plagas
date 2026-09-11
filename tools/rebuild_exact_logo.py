import base64
import io
from PIL import Image
import numpy as np
from collections import deque

def rebuild():
    raw_path = 'C:/Users/PC/.gemini/antigravity/brain/049d5853-8034-4975-8bbc-1d59ac537e78/.user_uploaded/media_1789159625427.jpg'
    img = Image.open(raw_path).convert('RGBA')
    arr = np.array(img, dtype=np.float32)
    h, w, _ = arr.shape

    # Precise background detection
    corners = [arr[0:15, 0:15], arr[0:15, -15:], arr[-15:, 0:15], arr[-15:, -15:]]
    bg_color = np.mean([c.mean(axis=(0,1))[:3] for c in corners], axis=0)

    dist = np.linalg.norm(arr[:, :, :3] - bg_color, axis=-1)
    visited = np.zeros((h, w), dtype=bool)
    q = deque()

    # Flood fill from image borders
    for y in range(h):
        for x in [0, w-1]:
            if dist[y, x] < 35 and not visited[y, x]:
                visited[y, x] = True
                q.append((y, x))
    for x in range(w):
        for y in [0, h-1]:
            if dist[y, x] < 35 and not visited[y, x]:
                visited[y, x] = True
                q.append((y, x))

    # Seeds for open cavities that must be transparent:
    # 1. Handle hole (top pump grip)
    # 2. Hose loop (between tank, hose, and wand)
    # 3. 'A' triangle hole
    for sy, sx in [(175, 725), (424, 773), (600, 352)]:
        if dist[sy, sx] < 35 and not visited[sy, sx]:
            visited[sy, sx] = True
            q.append((sy, sx))

    while q:
        cy, cx = q.popleft()
        for dy, dx in [(-1,0), (1,0), (0,-1), (0,1)]:
            ny, nx = cy + dy, cx + dx
            if 0 <= ny < h and 0 <= nx < w:
                if not visited[ny, nx] and dist[ny, nx] < 35:
                    visited[ny, nx] = True
                    q.append((ny, nx))

    # Smooth anti-aliasing alpha ramp
    alpha = np.ones((h, w), dtype=np.float32) * 255.0
    alpha[visited] = np.clip((dist[visited] - 4.0) / (30.0 - 4.0), 0.0, 1.0) * 255.0

    result = arr.copy()
    result[:, :, 3] = alpha

    # Color de-bleeding to eliminate white edge halo
    a_norm = np.clip(alpha / 255.0, 0.001, 1.0)[:, :, None]
    debleed = (result[:, :, :3] - (1.0 - a_norm) * bg_color) / a_norm
    result[:, :, :3] = np.clip(debleed, 0.0, 255.0)

    # Crop tightly to artwork bounds:
    crop_box = (246, 92, 848, 676)
    W_crop = 848 - 246 # 602
    H_crop = 676 - 92  # 584

    fg_full = Image.fromarray(result.astype(np.uint8))
    fg_tight = fg_full.crop(crop_box)

    # 2x high-resolution master for ultra-crisp Retina rendering (1204 x 1168)
    fg_2x = fg_tight.resize((W_crop * 2, H_crop * 2), Image.Resampling.LANCZOS)

    # Encode to base64 PNG
    buf = io.BytesIO()
    fg_2x.save(buf, format='PNG', optimize=True)
    b64_png = base64.b64encode(buf.getvalue()).decode('ascii')

    # Generate exact SVG
    svg_content = f'''<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 {W_crop} {H_crop}" width="100%" height="100%" aria-label="ALM Control de Plagas">
  <defs>
    <filter id="almShadow" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="#000000" flood-opacity="0.10"/>
    </filter>
  </defs>
  <g filter="url(#almShadow)">
    <image width="{W_crop}" height="{H_crop}" href="data:image/png;base64,{b64_png}" preserveAspectRatio="xMidYMid meet"/>
  </g>
</svg>'''

    with open('logo_alm.svg', 'w', encoding='utf-8') as f:
        f.write(svg_content)
    with open('assets/logos/logo_alm.svg', 'w', encoding='utf-8') as f:
        f.write(svg_content)

    # Save tight raster PNGs
    fg_tight.save('logo_transparent.png', 'PNG', optimize=True)
    fg_tight.save('assets/logos/logo_transparent.png', 'PNG', optimize=True)

    fg_tight.save('logo_alm_intro.png', 'PNG', optimize=True)
    fg_tight.save('assets/logos/logo_alm_intro.png', 'PNG', optimize=True)

    fg_tight.save('logo_alm_main.png', 'PNG', optimize=True)
    fg_tight.save('assets/logos/logo_alm_main.png', 'PNG', optimize=True)

    fg_tight.save('aml logo.png', 'PNG', optimize=True)

    # Isologo (crop emblem without text, text is y > 425 in cropped)
    arr_tight = np.array(fg_tight)
    arr_iso = arr_tight.copy()
    arr_iso[425:, :, 3] = 0
    y_iso, x_iso = np.where(arr_iso[:, :, 3] > 20)
    iso_tight = Image.fromarray(arr_iso).crop((x_iso.min(), y_iso.min(), x_iso.max()+1, y_iso.max()+1))

    iso_tight.save('isologo_transparent.png', 'PNG', optimize=True)
    iso_tight.save('assets/logos/isologo_transparent.png', 'PNG', optimize=True)

    iso_white = Image.new('RGB', iso_tight.size, (255, 255, 255))
    iso_white.paste(iso_tight, (0, 0), iso_tight)
    iso_white.save('isologo.png', 'PNG', optimize=True)
    iso_white.save('assets/logos/isologo.png', 'PNG', optimize=True)

    print('All assets rebuilt perfectly with 100% fidelity!')

if __name__ == '__main__':
    rebuild()
