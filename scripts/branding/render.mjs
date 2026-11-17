#!/usr/bin/env node
/**
 * Renders ScanDoc launcher icons and Google Play store graphics using headless Google Chrome
 * (no npm dependencies).
 *
 * Icon source: assets/launcher.icon/app_icon.png (512×512, opaque: glyph on a cream rounded
 * square with white corners). The glyph is extracted from the cream background and re-composed
 * for each target, so launchers and Play can apply their own masks.
 *
 *   node scripts/branding/render.mjs icons        # launcher + splash + Play icon
 *   node scripts/branding/render.mjs store        # feature graphics + framed screenshots
 *   node scripts/branding/render.mjs              # everything
 *
 * Screenshots: put raw device captures in assets/branding/screenshots/raw/<n>.png first.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { COPY, SCREENSHOTS } from './copy.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const BRANDING = join(ROOT, 'assets/branding');
const IMAGES = join(ROOT, 'assets/images');
const STORE = join(ROOT, 'store/google-play');
const CHROME = process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const ICON_SOURCE = pathToFileURL(join(ROOT, 'assets/launcher.icon/app_icon.png')).href;

/** Measured from the source icon. */
const BRAND = {
  cream: '#F2EFE8',
  ink: '#14171F',
  orange: '#FF6A3D',
  /** Source tile size and the square that safely contains the glyph (cream all around it). */
  tile: 512,
  glyphCrop: { x: 92, y: 92, size: 336 },
};

/**
 * Glyph extraction (runs in the page): every pixel is p = alpha·c + (1−alpha)·cream, so the
 * smallest alpha that explains p is used and c is recovered. Composited back on cream this is
 * pixel-identical to the source. 'mono' instead maps each colour to a themed-icon opacity.
 */
const EXTRACT_SCRIPT = `
const CREAM=[242,239,232];
// Monochrome opacity per source colour (nearest match along the line from cream).
const MONO=[[[20,23,31],1],[[74,80,96],1],[[255,106,61],.55],[[255,173,148],.55],[[153,153,152],0]];
function extract(img,crop,mode){
  const c=document.createElement('canvas');c.width=c.height=crop.size;
  const x=c.getContext('2d');x.drawImage(img,crop.x,crop.y,crop.size,crop.size,0,0,crop.size,crop.size);
  const im=x.getImageData(0,0,crop.size,crop.size),d=im.data;
  for(let k=0;k<d.length;k+=4){
    const p=[d[k],d[k+1],d[k+2]];
    if(mode==='mono'){
      let best=0,err=1e9;
      for(const [col,w] of MONO){
        const v=col.map((n,i)=>n-CREAM[i]),q=p.map((n,i)=>n-CREAM[i]);
        const t=Math.min(1,Math.max(0,(q[0]*v[0]+q[1]*v[1]+q[2]*v[2])/(v[0]*v[0]+v[1]*v[1]+v[2]*v[2])));
        const e=q.reduce((s,n,i)=>s+(n-t*v[i])**2,0);
        if(e<err){err=e;best=t*w}
      }
      d[k]=d[k+1]=d[k+2]=255;d[k+3]=Math.round(best*255);
    }else{
      let a=0;
      for(let i=0;i<3;i++){const diff=p[i]-CREAM[i];a=Math.max(a,diff>0?diff/(255-CREAM[i]):-diff/CREAM[i])}
      if(a<0.02){d[k+3]=0;continue}
      for(let i=0;i<3;i++)d[k+i]=Math.round(CREAM[i]+(p[i]-CREAM[i])/a);
      d[k+3]=Math.round(a*255);
    }
  }
  x.putImageData(im,0,0);return c;
}`;

/**
 * Page that draws the extracted glyph onto a size×size canvas.
 * scale: source-tile pixels → output pixels; background: CSS colour or 'transparent'.
 */
function iconPage(size, { scale, background = 'transparent', mode = 'color' }) {
  const { x, y, size: crop } = BRAND.glyphCrop;
  // Keep the glyph where the designer placed it relative to the tile centre.
  const offset = size / 2 - (BRAND.tile / 2 - x) * scale;
  const offsetY = size / 2 - (BRAND.tile / 2 - y) * scale;
  return page(
    size,
    size,
    `<canvas id="out" width="${size}" height="${size}" style="display:block"></canvas>
     <script>${EXTRACT_SCRIPT}
       const img=new Image();img.onload=()=>{
         const o=document.getElementById('out').getContext('2d');
         o.imageSmoothingQuality='high';
         ${background === 'transparent' ? '' : `o.fillStyle='${background}';o.fillRect(0,0,${size},${size});`}
         o.drawImage(extract(img,${JSON.stringify(BRAND.glyphCrop)},'${mode}'),${offset},${offsetY},${crop * scale},${crop * scale});
       };img.src='${ICON_SOURCE}';
     </script>`,
  );
}

const page = (width, height, body, background = 'transparent') => `<!doctype html>
<html><head><meta charset="utf-8"><style>
  html,body{margin:0;width:${width}px;height:${height}px;overflow:hidden;background:${background}}
  *{box-sizing:border-box}
</style></head><body>${body}</body></html>`;

const work = mkdtempSync(join(tmpdir(), 'scandoc-branding-'));
let counter = 0;

function render(html, width, height, output) {
  const file = join(work, `page-${counter++}.html`);
  writeFileSync(file, html);
  mkdirSync(dirname(output), { recursive: true });
  execFileSync(
    CHROME,
    [
      '--headless=new',
      '--disable-gpu',
      '--hide-scrollbars',
      '--force-device-scale-factor=1',
      '--default-background-color=00000000',
      '--allow-file-access-from-files',
      '--virtual-time-budget=3000',
      `--window-size=${width},${height}`,
      `--screenshot=${output}`,
      pathToFileURL(file).href,
    ],
    { stdio: 'ignore' },
  );
  console.log(`✔ ${output.replace(`${ROOT}/`, '')} (${width}×${height})`);
}

/** Play rejects alpha in the feature graphic: convert to JPEG with macOS `sips`. */
function toJpeg(png, jpg) {
  execFileSync('sips', ['-s', 'format', 'jpeg', '-s', 'formatOptions', '92', png, '--out', jpg], { stdio: 'ignore' });
  rmSync(png);
  console.log(`✔ ${jpg.replace(`${ROOT}/`, '')} (JPEG)`);
}

/** Adaptive icons: 108 dp canvas of which 72 dp is visible; match the source tile to that. */
const ADAPTIVE_VISIBLE = 72 / 108;

function renderIcons() {
  const adaptive = (1024 * ADAPTIVE_VISIBLE) / BRAND.tile;

  // Adaptive icon layers (app.json → android.adaptiveIcon)
  render(iconPage(1024, { scale: adaptive }), 1024, 1024, join(IMAGES, 'android-icon-foreground.png'));
  render(page(1024, 1024, '', BRAND.cream), 1024, 1024, join(IMAGES, 'android-icon-background.png'));
  render(iconPage(1024, { scale: adaptive, mode: 'mono' }), 1024, 1024, join(IMAGES, 'android-icon-monochrome.png'));

  // Full-bleed squares: launchers/Play apply their own corner mask, so no pre-rounded corners.
  render(iconPage(1024, { scale: 1024 / BRAND.tile, background: BRAND.cream }), 1024, 1024, join(IMAGES, 'icon.png'));
  render(iconPage(512, { scale: 1, background: BRAND.cream }), 512, 512, join(STORE, 'icon-512.png'));
  render(iconPage(48, { scale: 48 / BRAND.tile, background: BRAND.cream }), 48, 48, join(IMAGES, 'favicon.png'));

  // Splash: glyph only, drawn by expo-splash-screen on the cream backgroundColor.
  render(iconPage(512, { scale: 512 / BRAND.glyphCrop.size }), 512, 512, join(IMAGES, 'splash-icon.png'));
}

// Single quotes only: this string is interpolated into style="…" attributes.
const FONT = `-apple-system, 'SF Pro Display', 'Helvetica Neue', Roboto, Arial, sans-serif`;
/** Uses the rendered Play icon, rounded like a launcher would show it. */
const iconImg = (size) =>
  `<img src="${pathToFileURL(join(STORE, 'icon-512.png')).href}" style="width:${size}px;height:${size}px;
     border-radius:${size * 0.23}px;box-shadow:0 ${size * 0.06}px ${size * 0.16}px rgba(20,23,31,.18)"/>`;

const STORE_BACKGROUND = `linear-gradient(160deg,${BRAND.cream} 0%,#E4DED2 100%)`;
const PHONE_FRAME = `border-radius:56px;border:14px solid ${BRAND.ink};box-shadow:0 40px 90px rgba(20,23,31,.28)`;
const accentBar = (width) =>
  `<div style="width:${width}px;height:8px;border-radius:4px;background:${BRAND.orange}"></div>`;

function featureGraphic(lang) {
  const t = COPY[lang];
  const shots = [1, 3].map((n) => join(BRANDING, 'screenshots/raw', `${n}.png`)).filter(existsSync);
  const phones = shots
    .map(
      (file, i) => `<img src="${pathToFileURL(file).href}" style="position:absolute;height:${i ? 430 : 470}px;
        right:${i ? 40 : 230}px;top:${i ? 90 : 60}px;border-radius:30px;border:8px solid ${BRAND.ink};
        box-shadow:0 24px 60px rgba(20,23,31,.28)"/>`,
    )
    .join('');

  return page(
    1024,
    500,
    `<div style="position:relative;width:1024px;height:500px;overflow:hidden;font-family:${FONT};
       background:${STORE_BACKGROUND}">
      <div style="position:absolute;left:64px;top:84px;width:470px;color:${BRAND.ink}">
        <div style="display:flex;align-items:center;gap:22px">${iconImg(96)}
          <div style="font-size:58px;font-weight:800;letter-spacing:-1px">ScanDoc</div></div>
        <div style="margin-top:30px">${accentBar(64)}</div>
        <div style="margin-top:18px;font-size:38px;font-weight:700;line-height:1.18">${t.featureTitle}</div>
        <div style="margin-top:18px;font-size:23px;line-height:1.4;color:#4A5060">${t.featureSubtitle}</div>
      </div>
      ${phones}
    </div>`,
  );
}

function framedScreenshot(lang, shot) {
  const t = COPY[lang].screenshots[shot.key];
  const raw = pathToFileURL(join(BRANDING, 'screenshots/raw', shot.file)).href;
  return page(
    1080,
    1920,
    `<div style="width:1080px;height:1920px;overflow:hidden;font-family:${FONT};text-align:center;
       background:${STORE_BACKGROUND};color:${BRAND.ink};position:relative">
      <div style="position:relative;padding:100px 80px 0;display:flex;flex-direction:column;align-items:center">
        ${accentBar(80)}
        <div style="margin-top:30px;font-size:72px;font-weight:800;line-height:1.1;letter-spacing:-1px">${t.title}</div>
        <div style="margin-top:26px;font-size:38px;line-height:1.35;color:#4A5060">${t.subtitle}</div>
      </div>
      <img src="${raw}" style="position:absolute;left:50%;top:540px;transform:translateX(-50%);
        width:700px;${PHONE_FRAME}"/>
    </div>`,
  );
}

function renderStore() {
  for (const lang of Object.keys(COPY)) {
    const fgPng = join(STORE, lang, 'feature-graphic.png');
    render(featureGraphic(lang), 1024, 500, fgPng);
    toJpeg(fgPng, join(STORE, lang, 'feature-graphic.jpg'));

    const rawDir = join(BRANDING, 'screenshots/raw');
    const available = existsSync(rawDir) ? new Set(readdirSync(rawDir)) : new Set();
    SCREENSHOTS.filter((shot) => available.has(shot.file)).forEach((shot, index) => {
      const png = join(STORE, lang, 'phone', `${String(index + 1).padStart(2, '0')}-${shot.key}.png`);
      render(framedScreenshot(lang, shot), 1080, 1920, png);
      toJpeg(png, png.replace(/\.png$/, '.jpg'));
    });
  }
}

const target = process.argv[2] ?? 'all';
try {
  if (target === 'icons' || target === 'all') renderIcons();
  if (target === 'store' || target === 'all') renderStore();
} finally {
  rmSync(work, { recursive: true, force: true });
}
