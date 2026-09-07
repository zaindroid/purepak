'use strict';
// Generate a realistic-looking paper receipt image (for seeding demo data)
const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const py = `
import sys
from PIL import Image, ImageDraw, ImageFont
try:
    font = ImageFont.truetype('C:/Windows/Fonts/consola.ttf', 20)
    font_s = ImageFont.truetype('C:/Windows/Fonts/consola.ttf', 15)
except Exception:
    font = ImageFont.load_default(); font_s = font
W,H = 640, 860
im = Image.new('RGB',(W,H),(250,250,248))
d = ImageDraw.Draw(im)
d.text((40,30),'SADDAR GENERAL STORE',fill=(20,20,30),font=font)
d.text((40,62),'Main Bazar, Saddar, Rawalpindi',fill=(90,90,100),font=font_s)
d.text((40,88),'Phone: 051-4451234',fill=(90,90,100),font=font_s)
d.line([(30,120),(610,120)],fill=(120,120,130),width=2)
d.text((40,135),'Receipt #A-1042',fill=(20,20,30),font=font_s)
d.text((380,135),'Date: 12/08/2026',fill=(20,20,30),font=font_s)
items=[('Mineral Water 500ml x 20',200.0),('Delivery charge',80.0),('Bottle deposit x 20',100.0)]
y=170
for name,amt in items:
    d.text((40,y),name,fill=(30,30,40),font=font_s)
    d.text((460,y),f'{amt:.2f}',fill=(30,30,40),font=font_s)
    y+=34
d.line([(30,y),(610,y)],fill=(120,120,130),width=2)
d.text((40,y+10),'TOTAL',fill=(10,10,20),font=font)
d.text((500,y+10),'380.00',fill=(10,10,20),font=font)
d.line([(30,y+55),(610,y+55)],fill=(120,120,130),width=2)
d.text((160,y+75),'Thank you for your purchase',fill=(90,90,100),font=font_s)
out = sys.argv[1]
im.save(out)
print('saved',out)
`;

const outFile = process.argv[2] || path.join(__dirname, 'data', 'sample_receipt.png');
fs.mkdirSync(path.dirname(outFile), { recursive: true });
execSync('python -c ' + JSON.stringify(py) + ' ' + JSON.stringify(outFile), { stdio: 'inherit' });
