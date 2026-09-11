import os
from PIL import Image, ImageEnhance
import numpy as np
from collections import deque

def rdp(points, epsilon):
    if len(points) < 3:
        return points
    p1 = np.array(points[0], dtype=float)
    p2 = np.array(points[-1], dtype=float)
    line_vec = p2 - p1
    line_len = np.linalg.norm(line_vec)
    if line_len == 0:
        dists = np.linalg.norm(np.array(points, dtype=float) - p1, axis=1)
    else:
        pts = np.array(points, dtype=float)
        dists = np.abs(line_vec[1] * (pts[:, 0] - p1[0]) - line_vec[0] * (pts[:, 1] - p1[1])) / line_len
    index = dists.argmax()
    dmax = dists[index]
    if dmax > epsilon:
        rec1 = rdp(points[:index+1], epsilon)
        rec2 = rdp(points[index:], epsilon)
        return rec1[:-1] + rec2
    else:
        return [points[0], points[-1]]

def points_to_smooth_path(pts, tension=1.0/6.0):
    if len(pts) < 4:
        return 'M ' + ' L '.join(f'{x:.1f},{y:.1f}' for x, y in pts) + ' Z'
    if pts[0] == pts[-1]:
        pts = pts[:-1]
    n = len(pts)
    if n < 3:
        return ''
    d = [f'M {pts[0][0]:.1f},{pts[0][1]:.1f}']
    for i in range(n):
        p0 = np.array(pts[(i - 1) % n], dtype=float)
        p1 = np.array(pts[i], dtype=float)
        p2 = np.array(pts[(i + 1) % n], dtype=float)
        p3 = np.array(pts[(i + 2) % n], dtype=float)
        c1 = p1 + tension * (p2 - p0)
        c2 = p2 - tension * (p3 - p1)
        d.append(f'C {c1[0]:.1f},{c1[1]:.1f} {c2[0]:.1f},{c2[1]:.1f} {p2[0]:.1f},{p2[1]:.1f}')
    d.append('Z')
    return ' '.join(d)

def trace_cycles(mask, min_len=12):
    h, w = mask.shape
    edges = set()
    for y in range(h):
        for x in range(w):
            if mask[y, x]:
                if y == 0 or not mask[y-1, x]:
                    edges.add(((x, y), (x+1, y)))
                if y == h-1 or not mask[y+1, x]:
                    edges.add(((x+1, y+1), (x, y+1)))
                if x == 0 or not mask[y, x-1]:
                    edges.add(((x, y+1), (x, y)))
                if x == w-1 or not mask[y, x+1]:
                    edges.add(((x+1, y), (x+1, y+1)))
    adj = {}
    for p1, p2 in edges:
        adj[p1] = p2
    visited = set()
    cycles = []
    for start in list(adj.keys()):
        if start not in visited:
            curr = start
            cycle = []
            while curr in adj and curr not in visited:
                visited.add(curr)
                cycle.append(curr)
                curr = adj[curr]
                if curr == start:
                    break
            if len(cycle) >= min_len and curr == start:
                cycles.append(cycle)
    return cycles

def build_vector_and_raster():
    raw_path = 'C:/Users/PC/.gemini/antigravity/brain/049d5853-8034-4975-8bbc-1d59ac537e78/.user_uploaded/media_1789156329718.jpg'
    img = Image.open(raw_path).convert('RGBA')
    arr = np.array(img, dtype=np.float32)
    h, w, _ = arr.shape

    # Contrast & Color Optimization
    rgb_pil = img.convert('RGB')
    enh_color = ImageEnhance.Color(rgb_pil).enhance(1.18)
    enh_contrast = ImageEnhance.Contrast(enh_color).enhance(1.10)
    enh_sharp = ImageEnhance.Sharpness(enh_contrast).enhance(1.20)
    arr_enh = np.array(enh_sharp, dtype=np.float32)

    # Intelligent background removal with flood fill & hole seeding
    dist_white = np.linalg.norm(254.0 - arr[:, :, :3], axis=-1)
    visited = np.zeros((h, w), dtype=bool)
    q = deque()

    # Borders
    for y in range(h):
        for x in [0, w-1]:
            if dist_white[y, x] < 32 and not visited[y, x]:
                visited[y, x] = True
                q.append((y, x))
    for x in range(w):
        for y in [0, h-1]:
            if dist_white[y, x] < 32 and not visited[y, x]:
                visited[y, x] = True
                q.append((y, x))

    # Seeds for interior open spaces: handle loop, hose loop, 'A' hole
    for sy, sx in [(175, 725), (424, 773), (600, 352)]:
        if dist_white[sy, sx] < 32 and not visited[sy, sx]:
            visited[sy, sx] = True
            q.append((sy, sx))

    while q:
        cy, cx = q.popleft()
        for dy, dx in [(-1,0), (1,0), (0,-1), (0,1)]:
            ny, nx = cy + dy, cx + dx
            if 0 <= ny < h and 0 <= nx < w:
                if not visited[ny, nx] and dist_white[ny, nx] < 32:
                    visited[ny, nx] = True
                    q.append((ny, nx))

    # Sub-pixel smooth alpha ramp
    alpha = np.ones((h, w), dtype=np.float32) * 255.0
    alpha[visited] = np.clip((dist_white[visited] - 6.0) / (30.0 - 6.0), 0.0, 1.0) * 255.0

    result = arr_enh.copy()
    result = np.dstack([result, alpha])

    # De-bleed edge halo pixels
    a_norm = np.clip(alpha / 255.0, 0.001, 1.0)[:, :, None]
    debleed = (result[:, :, :3] - (1.0 - a_norm) * 254.0) / a_norm
    result[:, :, :3] = np.clip(debleed, 0.0, 255.0)

    # Master 1024x1024 canvas
    master = Image.new('RGBA', (1024, 1024), (0, 0, 0, 0))
    y_off = (1024 - h) // 2
    x_off = (1024 - w) // 2
    fg = Image.fromarray(result.astype(np.uint8))
    master.paste(fg, (x_off, y_off), fg)

    # Isologo (emblem only, text erased)
    arr_master = np.array(master)
    isologo_arr = arr_master.copy()
    isologo_arr[520 + y_off:, :, 3] = 0
    isologo = Image.fromarray(isologo_arr)

    m_alpha = arr_master[:, :, 3]
    H, W = 1024, 1024

    # 1. Leaf Body (x < 525, y 250..600)
    is_leaf = (m_alpha > 140) & (np.arange(W)[None, :] < 525) & (np.arange(H)[:, None] >= 250) & (np.arange(H)[:, None] <= 600) & (arr_master[:, :, 1] > arr_master[:, :, 0] + 5) & (arr_master[:, :, 1] > arr_master[:, :, 2] + 5)
    leaf_cycles = trace_cycles(is_leaf, min_len=20)
    leaf_paths = [points_to_smooth_path(rdp(c + [c[0]], 1.8), tension=0.15) for c in leaf_cycles]

    # 2. Leaf Veins (within leaf area, brightness > 200)
    is_leaf_area = (m_alpha > 140) & (np.arange(W)[None, :] < 525) & (np.arange(H)[:, None] >= 250) & (np.arange(H)[:, None] <= 600)
    is_vein = is_leaf_area & (arr_master[:, :, :3].mean(axis=-1) > 200)
    vein_cycles = trace_cycles(is_vein, min_len=8)
    vein_paths = [points_to_smooth_path(rdp(c + [c[0]], 1.0), tension=0.12) for c in vein_cycles]

    # 3. Sprayer (x > 520, y 250..665)
    is_sprayer = (m_alpha > 140) & (np.arange(W)[None, :] > 520) & (np.arange(H)[:, None] >= 250) & (np.arange(H)[:, None] <= 665) & (arr_master[:, :, 0] > 175) & (arr_master[:, :, 1] < 160) & (arr_master[:, :, 2] < 80)
    sprayer_cycles = trace_cycles(is_sprayer, min_len=15)
    sprayer_paths = [points_to_smooth_path(rdp(c + [c[0]], 1.5), tension=0.14) for c in sprayer_cycles]

    # 4. Pressure Gauge Face (within sprayer upper shoulder)
    is_gauge = (m_alpha > 140) & (np.arange(W)[None, :] >= 660) & (np.arange(W)[None, :] <= 720) & (np.arange(H)[:, None] >= 340) & (np.arange(H)[:, None] <= 410) & (arr_master[:, :, :3].mean(axis=-1) > 200)
    gauge_cycles = trace_cycles(is_gauge, min_len=8)
    gauge_paths = [points_to_smooth_path(rdp(c + [c[0]], 1.0), tension=0.15) for c in gauge_cycles]

    # 5. Droplet (x 445..570, y 270..460)
    is_droplet = (m_alpha > 140) & (np.arange(W)[None, :] >= 445) & (np.arange(W)[None, :] <= 570) & (np.arange(H)[:, None] >= 270) & (np.arange(H)[:, None] <= 460) & ((arr_master[:, :, 0] >= 40) | (arr_master[:, :, 1] >= 75)) & (arr_master[:, :, 2] >= 120)
    drop_cycles = trace_cycles(is_droplet, min_len=20)
    drop_paths = [points_to_smooth_path(rdp(c + [c[0]], 1.5), tension=0.15) for c in drop_cycles]

    # Droplet Specular Highlight
    is_drop_area = (m_alpha > 140) & (np.arange(W)[None, :] >= 445) & (np.arange(W)[None, :] <= 570) & (np.arange(H)[:, None] >= 270) & (np.arange(H)[:, None] <= 460)
    is_hl = is_drop_area & (arr_master[:, :, :3].mean(axis=-1) > 200)
    hl_cycles = trace_cycles(is_hl, min_len=8)
    hl_paths = [points_to_smooth_path(rdp(c + [c[0]], 1.0), tension=0.12) for c in hl_cycles]

    # 6. Shield (x 350..665, y 220..660, navy, excluding leaf and droplet)
    is_shield = (m_alpha > 140) & (np.arange(W)[None, :] >= 350) & (np.arange(W)[None, :] <= 665) & (np.arange(H)[:, None] >= 220) & (np.arange(H)[:, None] < 660) & (arr_master[:, :, :3].mean(axis=-1) < 115) & (arr_master[:, :, 2] >= arr_master[:, :, 0] - 5) & (~is_leaf)
    shield_cycles = trace_cycles(is_shield, min_len=25)
    shield_paths = [points_to_smooth_path(rdp(c + [c[0]], 2.0), tension=0.15) for c in shield_cycles]

    # 7. Typography ALM (y >= 660)
    is_text = (m_alpha > 140) & (np.arange(H)[:, None] >= 660) & (arr_master[:, :, :3].mean(axis=-1) < 90)
    text_cycles = trace_cycles(is_text, min_len=20)
    text_paths = [points_to_smooth_path(rdp(c + [c[0]], 1.4), tension=0.10) for c in text_cycles]

    shield_svg = "\n    ".join(f'<path d="{p}" fill-rule="evenodd"/>' for p in shield_paths)
    drop_svg = "\n    ".join(f'<path d="{p}" fill-rule="evenodd"/>' for p in drop_paths)
    hl_svg = "\n    ".join(f'<path d="{p}" fill="#FFFFFF" opacity="0.92"/>' for p in hl_paths)
    leaf_svg = "\n    ".join(f'<path d="{p}" fill-rule="evenodd"/>' for p in leaf_paths)
    vein_svg = "\n    ".join(f'<path d="{p}"/>' for p in vein_paths)
    sprayer_svg = "\n    ".join(f'<path d="{p}" fill-rule="evenodd"/>' for p in sprayer_paths)
    gauge_svg = "\n    ".join(f'<path d="{p}"/>' for p in gauge_paths)
    text_svg = "\n    ".join(f'<path d="{p}" fill-rule="evenodd"/>' for p in text_paths)

    svg_content = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="100%" height="100%" aria-label="ALM Manejo de Plagas y Fumigaciones Fitosanitarias">
  <defs>
    <!-- Deep Navy Shield Gradient -->
    <linearGradient id="almShieldGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#28305E"/>
      <stop offset="50%" stop-color="#1E234A"/>
      <stop offset="100%" stop-color="#121633"/>
    </linearGradient>

    <!-- Eco Botanical Leaf Gradient -->
    <linearGradient id="almLeafGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#8DAF74"/>
      <stop offset="40%" stop-color="#6E9059"/>
      <stop offset="100%" stop-color="#4B6A3E"/>
    </linearGradient>

    <!-- Industrial Sprayer Safety Orange Gradient -->
    <linearGradient id="almSprayerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FF7A1A"/>
      <stop offset="50%" stop-color="#EE6012"/>
      <stop offset="100%" stop-color="#D44900"/>
    </linearGradient>

    <!-- 3D Purity Droplet Radial Gradient -->
    <radialGradient id="almDropGrad" cx="35%" cy="35%" r="70%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.95"/>
      <stop offset="25%" stop-color="#C2E2FA" stop-opacity="0.9"/>
      <stop offset="60%" stop-color="#6DA8DB" stop-opacity="0.85"/>
      <stop offset="100%" stop-color="#2B598C" stop-opacity="0.95"/>
    </radialGradient>

    <!-- Soft Ambient Elevation Filter -->
    <filter id="almShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000000" flood-opacity="0.12"/>
    </filter>
  </defs>

  <g filter="url(#almShadow)">
    <!-- 1. Central Protective Shield -->
    <g id="shield-base" fill="url(#almShieldGrad)">
      {shield_svg}
    </g>

    <!-- 2. Water / Purity Droplet -->
    <g id="water-droplet" fill="url(#almDropGrad)">
      {drop_svg}
      {hl_svg}
    </g>

    <!-- 3. Left Botanical Leaf -->
    <g id="leaf-element">
      <g fill="url(#almLeafGrad)">
        {leaf_svg}
      </g>
      <g fill="#FFFFFF" opacity="0.96">
        {vein_svg}
      </g>
    </g>

    <!-- 4. Right Fumigation Sprayer -->
    <g id="sprayer-element">
      <g fill="url(#almSprayerGrad)">
        {sprayer_svg}
      </g>
      <g fill="#FFFFFF">
        {gauge_svg}
      </g>
    </g>

    <!-- 5. ALM Bold Typography -->
    <g id="typography-alm" fill="#1E234A">
      {text_svg}
    </g>
  </g>
</svg>'''

    with open('logo_alm.svg', 'w', encoding='utf-8') as f:
        f.write(svg_content)
    with open('assets/logos/logo_alm.svg', 'w', encoding='utf-8') as f:
        f.write(svg_content)
    print('Vector SVG generated successfully!')

    # 1. logo_transparent.png
    master.save('logo_transparent.png', 'PNG', optimize=True)
    master.save('assets/logos/logo_transparent.png', 'PNG', optimize=True)

    # 2. logo_alm_intro.png (500x500 version for splash screen)
    intro_img = master.resize((500, 500), Image.Resampling.LANCZOS)
    intro_img.save('logo_alm_intro.png', 'PNG', optimize=True)
    intro_img.save('assets/logos/logo_alm_intro.png', 'PNG', optimize=True)

    # 3. logo_alm_main.png
    master.save('logo_alm_main.png', 'PNG', optimize=True)
    master.save('assets/logos/logo_alm_main.png', 'PNG', optimize=True)

    # 4. isologo_transparent.png
    isologo.save('isologo_transparent.png', 'PNG', optimize=True)
    isologo.save('assets/logos/isologo_transparent.png', 'PNG', optimize=True)

    # 5. isologo.png (with white background for compatibility)
    isologo_white = Image.new('RGB', (1024, 1024), (255, 255, 255))
    isologo_white.paste(isologo, (0, 0), isologo)
    isologo_white.save('isologo.png', 'PNG', optimize=True)
    isologo_white.save('assets/logos/isologo.png', 'PNG', optimize=True)

    # 6. aml logo.png
    master.save('aml logo.png', 'PNG', optimize=True)
    print('All raster and vector files updated!')

if __name__ == '__main__':
    build_vector_and_raster()
