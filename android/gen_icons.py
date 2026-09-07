import struct, zlib, os, sys

def inside_drop(x, y, size):
    cx = cy = size / 2
    r = size * 0.26
    h = size * 0.55  # apex height above center
    # circle
    if (x - cx) ** 2 + (y - cy) ** 2 <= r * r:
        return True
    # triangle: apex (cx, cy-h), base corners (cx +/- 0.86r, cy-0.30r)
    ay = cy - h
    by = cy - 0.30 * r
    halfw = 0.86 * r
    if ay <= y <= by:
        t = (y - ay) / (by - ay)
        w = halfw * t
        if abs(x - cx) <= w:
            return True
    return False

def make_icon(size, path):
    bg_top = (33, 150, 243)
    bg_bot = (10, 77, 140)
    white = (255, 255, 255)
    ss = 4  # supersample
    S = size * ss
    out = bytearray()
    for y in range(size):
        out.append(0)  # filter none
        for x in range(size):
            rsum = gsum = bsum = 0
            cnt = 0
            for sy in range(ss):
                for sx in range(ss):
                    px = (x + (sx + 0.5) / ss) / size
                    py = (y + (sy + 0.5) / ss) / size
                    X, Y = px * S, py * S
                    cxx = cyy = S / 2
                    rr = S * 0.18
                    dx = max(abs(X - cxx) - (S / 2 - rr), 0.0)
                    dy = max(abs(Y - cyy) - (S / 2 - rr), 0.0)
                    if dx * dx + dy * dy <= rr * rr:
                        t = py
                        col = (bg_top[0] * (1 - t) + bg_bot[0] * t,
                               bg_top[1] * (1 - t) + bg_bot[1] * t,
                               bg_top[2] * (1 - t) + bg_bot[2] * t)
                        if inside_drop(X, Y, S):
                            col = white
                        rsum += col[0]; gsum += col[1]; bsum += col[2]; cnt += 1
            if cnt:
                out.extend((int(rsum / cnt), int(gsum / cnt), int(bsum / cnt), 255))
            else:
                out.extend((0, 0, 0, 0))

    def chunk(tag, data):
        c = struct.pack('>I', len(data)) + tag + data
        c += struct.pack('>I', zlib.crc32(tag + data) & 0xffffffff)
        return c
    ihdr = struct.pack('>IIBBBBB', size, size, 8, 6, 0, 0, 0)
    png = b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', ihdr) + chunk(b'IDAT', zlib.compress(bytes(out), 9)) + chunk(b'IEND', b'')
    os.makedirs(os.path.dirname(path), exist_ok=True)
    open(path, 'wb').write(png)
    print('wrote', path, os.path.getsize(path), 'bytes')

base = sys.argv[1]
for d, s in {'mdpi': 48, 'hdpi': 72, 'xhdpi': 96, 'xxhdpi': 144, 'xxxhdpi': 192}.items():
    make_icon(s, f"{base}/mipmap-{d}/ic_launcher.png")
