"""Cut openly licensed photographs into registered, transparent food layers.
usage: extract_layers.py <source-dir> <out-dir> <src/layers.json>"""
import sys, json, os, subprocess
import cv2, numpy as np
SRC, OUT, META = sys.argv[1:4]
N = 2048
rd = lambda n: cv2.imread(f'{SRC}/{n}.jpg')
g = lambda a, s: cv2.GaussianBlur(a, (0, 0), s)
EL = lambda k: cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (k, k))

def largest(m):
    n, l, st, _ = cv2.connectedComponentsWithStats(m)
    return np.uint8(l == 1 + np.argmax(st[1:, 4])) * 255 if n > 1 else m

def fill(m):
    c, _ = cv2.findContours(m, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    o = np.zeros_like(m); cv2.drawContours(o, c, -1, 255, -1); return o

def bleed(img, solid):
    """Extend trustworthy interior colour past the matte edge (no background halo)."""
    _, lab = cv2.distanceTransformWithLabels(np.uint8(solid == 0), cv2.DIST_L2, 5, labelType=cv2.DIST_LABEL_PIXEL)
    ys, xs = np.nonzero(solid); lut = np.zeros((lab.max() + 1, 2), int); lut[lab[ys, xs]] = np.c_[ys, xs]
    q = lut[lab]; return img[q[..., 0], q[..., 1]]

# ---------- pizza, every layer shares this crop ----------
A = rd('pizzaA'); k = A.shape[0] / 1300
x0, y0, size = 63 * k, 37 * k, 1230 * k
M = np.array([[N / size, 0, -x0 * N / size], [0, N / size, -y0 * N / size]])
P = cv2.warpAffine(A, M, (N, N), flags=cv2.INTER_AREA)
to = lambda x, y: ((x - 63) * N / 1230, (y - 37) * N / 1230)
hsv = cv2.cvtColor(P, cv2.COLOR_BGR2HSV)
poly = [(640,58),(700,55),(780,52),(860,56),(930,85),(1010,130),(1075,180),(1115,205),(1160,235),(1185,290),(1205,350),(1235,440),(1250,540),(1258,640),(1262,760),(1250,830),(1225,900),(1200,965),(1150,1025),(1080,1090),(1000,1150),(900,1205),(800,1235),(740,1250),(700,1250),(620,1230),(540,1200),(450,1150),(370,1100),(290,1040),(215,985),(180,930),(150,870),(125,800),(115,710),(98,620),(98,530),(112,470),(132,410),(180,370),(215,320),(260,265),(320,215),(400,165),(480,110),(560,80)]
pts = np.int32([to(*p) for p in poly])
gc = np.full((N, N), cv2.GC_BGD, np.uint8)
t = np.zeros((N, N), np.uint8); cv2.fillPoly(t, [pts], 255)
gc[cv2.dilate(t, EL(47)) > 0] = cv2.GC_PR_BGD; gc[t > 0] = cv2.GC_PR_FGD; gc[cv2.erode(t, EL(61)) > 0] = cv2.GC_FGD
s = 2; gs = cv2.resize(gc, None, fx=1/s, fy=1/s, interpolation=cv2.INTER_NEAREST)
cv2.grabCut(cv2.resize(P, None, fx=1/s, fy=1/s, interpolation=cv2.INTER_AREA), gs, None, np.zeros((1, 65)), np.zeros((1, 65)), 6, cv2.GC_INIT_WITH_MASK)
m = np.uint8((gs == 1) | (gs == 3)) * 255
m = cv2.resize(m, (N, N), interpolation=cv2.INTER_CUBIC); m = np.uint8(m > 127) * 255
m = fill(largest(cv2.morphologyEx(cv2.morphologyEx(m, cv2.MORPH_OPEN, EL(31)), cv2.MORPH_CLOSE, EL(31))))
m = np.uint8(g(m.astype(np.float32), 5) > 135) * 255
solid = cv2.erode(m, EL(9)); alpha = np.clip((g(m.astype(np.float32), 2.2) - 110) / 80, 0, 1)
P = np.where(solid[..., None] > 0, P, bleed(P, solid))

# ---------- mozzarella ----------
boxes = [(500,190,640,335),(660,222,782,352),(808,310,988,430),(275,340,447,482),(390,450,554,572),(598,422,738,545),(820,442,947,570),(940,525,1090,664),(252,605,420,722),(460,612,600,830),(678,638,840,780),(702,760,834,932),(462,900,712,1037),(832,862,987,1034)]
f = P.astype(np.float32) / 255; B_, G_, R_ = f[..., 0], f[..., 1], f[..., 2]
score = np.clip((G_ / np.maximum(R_, .05) - .56) / .16, 0, 1) * np.clip((R_ - .6) / .18, 0, 1) * np.clip((B_ / np.maximum(R_, .05) - .40) / .12, 0, 1)
score = g(score, 2.5); cheese = np.zeros((N, N), np.float32); pieces = []
for i, b in enumerate(boxes):
    (a0, b0), (a1, b1) = to(b[0] - 4, b[1] - 4), to(b[2] + 4, b[3] + 4); a0, b0, a1, b1 = map(int, (a0, b0, a1, b1))
    r = score[b0:b1, a0:a1]; mm = np.uint8(r > .5) * 255
    mm = fill(cv2.morphologyEx(cv2.morphologyEx(mm, cv2.MORPH_OPEN, EL(11)), cv2.MORPH_CLOSE, EL(25)))
    n, l, st, _ = cv2.connectedComponentsWithStats(mm); keep = np.zeros_like(mm)
    for j in range(1, n):
        if st[j, 4] > .12 * st[1:, 4].max(): keep[l == j] = 255
    keep = largest(cv2.morphologyEx(keep, cv2.MORPH_OPEN, EL(27)))
    e = np.zeros_like(keep); cv2.ellipse(e, (e.shape[1] // 2, e.shape[0] // 2), (int(e.shape[1] * .54), int(e.shape[0] * .54)), 0, 0, 360, 255, -1)
    if i != 9: keep = cv2.bitwise_and(keep, e)
    keep = largest(keep); keep = np.uint8(g(keep.astype(np.float32), 9) > 120) * 255
    full = np.zeros((N, N), np.uint8); full[b0:b1, a0:a1] = keep
    cheese = np.maximum(cheese, full / 255.); pieces.append(full)
hole = cv2.dilate(np.uint8(cheese > 0) * 255, EL(35))
green = np.uint8((hsv[..., 0] > 32) & (hsv[..., 0] < 88) & (hsv[..., 1] > 70) & (hsv[..., 2] < 170)) * 255
green = cv2.dilate(cv2.morphologyEx(green, cv2.MORPH_OPEN, EL(7)), EL(31))
inner = np.zeros((N, N), np.uint8); cv2.circle(inner, (N // 2, N // 2), int(N * .40), 255, -1)
hole = cv2.bitwise_or(hole, cv2.bitwise_and(cv2.dilate(green, EL(25)), inner))

# bare-sauce plate: colour diffused from surrounding sauce, grain splatted from clean sauce in the SAME photo
sr = ((hsv[..., 1] > 190) & ((hsv[..., 0] < 8) | (hsv[..., 0] > 172)) & (hsv[..., 2] > 110) & (hsv[..., 2] < 235) & (hole == 0) & (inner > 0)).astype(np.float32)
Pf = P.astype(np.float32); lo = np.zeros_like(Pf); ww = np.zeros((N, N), np.float32)
for sg, wt in ((28, 1), (90, .05), (220, .002)):
    lo += g(Pf * sr[..., None], sg) * wt; ww += g(sr, sg) * wt
lo /= np.maximum(ww, 1e-7)[..., None]
hp = Pf - g(Pf, 24); R = 46; yy, xx = np.mgrid[-R:R+1, -R:R+1]; disc = np.clip(1.15 - np.hypot(xx, yy) / R, 0, 1) ** 1.5
clean = np.argwhere(cv2.erode(np.uint8(cv2.morphologyEx(np.uint8(sr), cv2.MORPH_CLOSE, EL(15))), EL(61)) > 0); rng = np.random.default_rng(7)
acc, w2 = np.zeros_like(Pf), np.full((N, N), 1e-4, np.float32)
targets = np.argwhere(hole > 0); targets = targets[rng.integers(0, len(targets), 5200)]
for (ty, tx_) in targets:
    cy, cx = clean[rng.integers(len(clean))]; patch = np.rot90(hp[cy-R:cy+R+1, cx-R:cx+R+1], rng.integers(4))
    if patch.shape[:2] != disc.shape or not (R < ty < N - R - 1 and R < tx_ < N - R - 1): continue
    dd = disc ** 3; acc[ty-R:ty+R+1, tx_-R:tx_+R+1] += patch * dd[..., None]; w2[ty-R:ty+R+1, tx_-R:tx_+R+1] += dd ** 2
fillp = np.clip(lo + acc / np.sqrt(w2)[..., None] * .55, 0, 255)
w = g(hole.astype(np.float32) / 255, 7)[..., None]
BASE = np.uint8(P * (1 - w) + fillp * w)

# sauce coverage
bf = BASE.astype(np.float32) / 255
red = np.clip((bf[..., 2] - bf[..., 1] - .20) / .28, 0, 1)
core = fill(largest(cv2.morphologyEx(np.uint8(g(red, 9) > .42) * 255, cv2.MORPH_CLOSE, EL(121))))
core = cv2.bitwise_and(core, cv2.erode(m, EL(101)))
core = np.uint8(g(core.astype(np.float32), 14) > 127) * 255
sauce = np.clip(g(core.astype(np.float32) / 255, 16) * 1.15, 0, 1)

# height: blistered rim + interior relief from luminance
dO = cv2.distanceTransform(m, cv2.DIST_L2, 5); dI = cv2.distanceTransform(255 - core, cv2.DIST_L2, 5)
tt = np.clip(dO / np.maximum(dO + dI, 1), 0, 1); rim = np.sin(np.pi * np.clip(tt ** .8 * .86 + .05, 0, 1)) ** .62
L = cv2.cvtColor(BASE, cv2.COLOR_BGR2GRAY).astype(np.float32) / 255
b1 = g(L, 22) - g(L, 90); b2 = g(L, 5) - g(L, 22)
H = np.where(core > 0, 0.20, 0) + (core == 0) * (.20 + .72 * rim) * (m > 0)
H = g(H.astype(np.float32), 10) * np.sqrt(1 - (1 - np.clip(dO / 92, 0, 1)) ** 2) + (b1 * .42 + b2 * .12) * (m > 0)
H = np.clip(g(H, 2.5), 0, 1)
def normals(h, st):
    gx, gy = cv2.Sobel(h, cv2.CV_32F, 1, 0, ksize=3) * st, cv2.Sobel(h, cv2.CV_32F, 0, 1, ksize=3) * st
    nn = np.dstack([np.ones_like(h), gy, -gx]); nn /= np.linalg.norm(nn, axis=2, keepdims=True); return np.uint8((nn * .5 + .5) * 255)
NR = normals(H * (m > 0) + (L - g(L, 14)) * .20 * (solid > 0), 11)

# raw dough plate
rng = np.random.default_rng(3)
def cloud(n, sg=0): return cv2.resize(rng.normal(0, 1, (n, n)).astype(np.float32), (N, N), interpolation=cv2.INTER_CUBIC)
pores = np.clip(g(rng.normal(0, 1, (N, N)).astype(np.float32), 3.2) * 9 - 1.5, 0, 1)
dust = np.clip(cloud(22) * .5 + cloud(90) * .35 + .1, 0, 1) * np.clip(g(rng.normal(0, 1, (N, N)).astype(np.float32), 1.1) * 3 + .35, 0, 1)
soft = g(H, 16); sh = np.clip((cv2.Sobel(soft, cv2.CV_32F, 1, 0) + cv2.Sobel(soft, cv2.CV_32F, 0, 1)) * -7, -.09, .07)
shade = sh + cloud(14) * .012 + cloud(60) * .010 + np.clip(b1, -.1, .1) * .12 - pores * .035
warm = np.clip(cloud(9) * .5 + .4, 0, 1)[..., None]
rawc = np.array([.56, .72, .845], np.float32) * (1 - warm) + np.array([.63, .765, .86], np.float32) * warm
ao = 1 - .30 * np.exp(-dO / 34)
RAW = np.clip((rawc + shade[..., None] * np.array([1.15, 1, .85])) * ao[..., None], 0, 1)
RAW = RAW * (1 - dust[..., None] * .22) + np.array([.86, .91, .94]) * dust[..., None] * .22
RAW = np.uint8(np.clip(RAW, 0, 1) * 255)

W = [cv2.IMWRITE_WEBP_QUALITY, 88]
for nm, sz in (('d', 2048), ('m', 1024)):
    z = lambda a: cv2.resize(a, (sz, sz), interpolation=cv2.INTER_AREA)
    cv2.imwrite(f'{OUT}/pizza-baked-{nm}.webp', z(BASE), W); cv2.imwrite(f'{OUT}/pizza-raw-{nm}.webp', z(RAW), W)
    cv2.imwrite(f'{OUT}/pizza-normal-{nm}.webp', z(NR), [cv2.IMWRITE_WEBP_QUALITY, 78])
    cv2.imwrite(f'{OUT}/pizza-masks-{nm}.webp', z(np.dstack([np.uint8(H * 255), np.uint8(sauce * 255), np.uint8(alpha * 255)])), [cv2.IMWRITE_WEBP_QUALITY, 95])  # stored BGR: R=matte G=sauce B=height

# ---------- cutout sprites ----------
sprites = {}
def add(name, img, mask, kind, extra=None, hmode='round', maxd=420):
    ys, xs = np.nonzero(mask); pad = 26
    Y0, Y1, X0, X1 = ys.min() - pad, ys.max() + pad, xs.min() - pad, xs.max() + pad
    img = cv2.copyMakeBorder(img, 30, 30, 30, 30, cv2.BORDER_REPLICATE)[Y0+30:Y1+30, X0+30:X1+30]
    mask = cv2.copyMakeBorder(mask, 30, 30, 30, 30, cv2.BORDER_CONSTANT)[Y0+30:Y1+30, X0+30:X1+30]
    src_w, src_h = X1 - X0, Y1 - Y0; sc = min(1, maxd / max(src_w, src_h))
    er = cv2.erode(mask, EL(7 if kind != 'mozz' else 3)); img = bleed(img, er)
    # a photographed matte, not a hard die-cut
    a = np.clip((g(mask.astype(np.float32), 2.0) - 120) / 80, 0, 1) if kind != 'mozz' else np.clip((g(mask.astype(np.float32), 5) - 70) / 150, 0, 1)
    d = cv2.distanceTransform(mask, cv2.DIST_L2, 5); r = d.max()
    if kind == 'tomato': h = np.sqrt(np.clip(1 - (1 - np.clip(d / r, 0, 1)) ** 2, 0, 1))
    elif kind == 'mozz': h = np.sqrt(np.clip(1 - (1 - np.clip(d / (r * .9), 0, 1)) ** 2, 0, 1)) * .8 + np.clip(g(cv2.cvtColor(img, cv2.COLOR_BGR2GRAY).astype(np.float32) / 255, 6) - .7, -.2, .3)
    else: h = np.clip(g(cv2.cvtColor(img, cv2.COLOR_BGR2GRAY).astype(np.float32) / 255, 3) * 1.6, 0, 1)
    h = np.clip(g(h.astype(np.float32), 3), 0, 1) * (np.clip((d - 8) / 26, 0, 1) if kind == 'mozz' else 1)
    dim = (max(2, int(src_w * sc)), max(2, int(src_h * sc))); rs = lambda q: cv2.resize(q, dim, interpolation=cv2.INTER_AREA)
    sprites[name] = dict(img=rs(img), a=rs(np.float32(a)), h=rs(h), kind=kind, **(extra or {}))

for i, p in enumerate(pieces):
    ys, xs = np.nonzero(p); pad = 26
    add(f'mozz{i}', P, p, 'mozz', dict(u=float((xs.min() + xs.max()) / 2 / N), v=float((ys.min() + ys.max()) / 2 / N), w=float((xs.max() - xs.min() + 2 * pad) / N)))
BZ = rd('basilpizza'); S0 = BZ.shape[1] / 975
for nm, bx in dict(basil0=(140,245,402,562), basil1=(438,155,762,300), basil2=(350,468,545,708), basil3=(520,412,802,674)).items():
    X0, Y0, X1, Y1 = [int(v * S0) for v in bx]; c = BZ[Y0:Y1, X0:X1].copy(); hh = cv2.cvtColor(c, cv2.COLOR_BGR2HSV); cf = c.astype(np.float32)
    gr = np.uint8((cf[..., 1] - cf[..., 2] > 6) & (cf[..., 1] - cf[..., 0] > 12) & (hh[..., 2] < 200) & (hh[..., 1] > 45)) * 255
    mk = largest(cv2.morphologyEx(cv2.morphologyEx(gr, cv2.MORPH_OPEN, EL(9)), cv2.MORPH_CLOSE, EL(25)))
    gcm = np.where(cv2.erode(mk, EL(17)) > 0, 1, np.where(cv2.dilate(mk, EL(17)) > 0, np.where(mk > 0, 3, 2), 0)).astype(np.uint8)
    cv2.grabCut(c, gcm, None, np.zeros((1, 65)), np.zeros((1, 65)), 4, cv2.GC_INIT_WITH_MASK)
    mk = fill(largest(cv2.morphologyEx(np.uint8((gcm == 1) | (gcm == 3)) * 255, cv2.MORPH_OPEN, EL(9)))); mk = cv2.morphologyEx(cv2.morphologyEx(cv2.copyMakeBorder(mk, 80, 80, 80, 80, cv2.BORDER_CONSTANT), cv2.MORPH_CLOSE, EL(61)), cv2.MORPH_OPEN, EL(21))[80:-80, 80:-80]; mk = np.uint8(g(mk.astype(np.float32), 5) > 130) * 255
    # lift the phone-flat leaf exposure to a fresher green
    cc = np.float32(c) / 255; cc = np.clip(cc * np.array([.80, 1.18, .98]), 0, 1) ** .92
    add(nm, np.uint8(cc * 255), mk, 'basil', maxd=500)
def blobs(n, names):
    im = rd(n); hv = cv2.cvtColor(im, cv2.COLOR_BGR2HSV); rr = im.astype(np.float32)
    mk = np.uint8((rr[..., 2] - rr[..., 1] > 70) & (hv[..., 1] > 125)) * 255
    mk = fill(cv2.morphologyEx(cv2.morphologyEx(mk, cv2.MORPH_CLOSE, EL(15)), cv2.MORPH_OPEN, EL(41)))
    c, _ = cv2.findContours(mk, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE); c = sorted([q for q in c if cv2.contourArea(q) > 2e4], key=lambda q: cv2.boundingRect(q)[0])
    for q, nm in zip(c, names):
        if not nm: continue
        x_, y_, w_, h_ = cv2.boundingRect(q); hull = cv2.convexHull(q)
        top = np.float32([pt for pt in q if pt[0][1] < y_ + h_ * .80]); el = cv2.fitEllipse(top)
        o = np.zeros_like(mk); cv2.ellipse(o, (el[0], (el[1][0] * .985, el[1][1] * .985), el[2]), 255, -1); o = cv2.bitwise_and(o, cv2.dilate(mk, EL(5)))
        o = np.uint8(g(o.astype(np.float32), 4) > 140) * 255
        add(nm, im, o, 'tomato', maxd=500)
blobs('tomC', ['cut0', 'cut1']); blobs('tomW3', ['tom0', 'tom1', 'tom2'])

# shelf-pack atlas
def pack(scale, D):
    col, hgt = np.full((D, D, 4), (90, 110, 120, 0), np.uint8), np.zeros((D, D), np.uint8); x = y = row = 0; meta = {}
    for nm, sp in sorted(sprites.items(), key=lambda q: -q[1]['img'].shape[0]):
        hh, ww = [max(2, int(v * scale)) for v in sp['img'].shape[:2]]
        if x + ww > D: x, y, row = 0, y + row, 0
        assert y + hh <= D, f'atlas overflow at {nm} {y} {hh}'
        r = lambda q: cv2.resize(q, (ww, hh), interpolation=cv2.INTER_AREA)
        col[y:y+hh, x:x+ww, :3] = r(sp['img']); col[y:y+hh, x:x+ww, 3] = np.uint8(r(sp['a']) * 255); hgt[y:y+hh, x:x+ww] = np.uint8(r(sp['h']) * 255)
        meta[nm] = dict(kind=sp['kind'], rect=[x / D, y / D, ww / D, hh / D], aspect=ww / hh, **{q: sp[q] for q in ('u', 'v', 'w') if q in sp})
        x += ww; row = max(row, hh)
    return col, hgt, meta
c, h, meta = pack(1, 2048)
for nm, sz in (('d', 2048), ('m', 1024)):
    z = lambda a: cv2.resize(a, (sz, sz), interpolation=cv2.INTER_AREA)
    # -exact keeps bled colour under alpha 0; without it mipmaps draw black outlines
    cv2.imwrite(f'{OUT}/_t.png', z(c)); subprocess.run(['cwebp', '-quiet', '-exact', '-q', '90', '-alpha_q', '100', f'{OUT}/_t.png', '-o', f'{OUT}/ingredients-{nm}.webp'], check=True); os.remove(f'{OUT}/_t.png')
    cv2.imwrite(f'{OUT}/ingredients-height-{nm}.webp', z(h), [cv2.IMWRITE_WEBP_QUALITY, 92])
json.dump(meta, open(META, 'w'), indent=1)
