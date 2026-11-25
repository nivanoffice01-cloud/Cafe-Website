import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import QRCode from "qrcode";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, "..");
const artifactsDir = path.join(rootDir, "artifacts");
const logoPath = path.join(
  rootDir,
  "CRM",
  "dist",
  "assets",
  "mangosteen-brand-lockup.png",
);

const reviewUrl =
  "https://search.google.com/local/writereview?placeid=ChIJB_gCKYDjYjkRZrVPCUTqeLw";

fs.mkdirSync(artifactsDir, { recursive: true });

const logoData = fs.readFileSync(logoPath).toString("base64");
const qrSvg = await QRCode.toString(reviewUrl, {
  type: "svg",
  errorCorrectionLevel: "H",
  margin: 2,
  color: {
    dark: "#24150F",
    light: "#FFFFFF",
  },
});
const qrData = Buffer.from(qrSvg).toString("base64");

const cardSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1240" height="1748" viewBox="0 0 1240 1748">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#FBF7F0"/>
      <stop offset="1" stop-color="#F1E5D8"/>
    </linearGradient>
    <linearGradient id="plum" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#4A183B"/>
      <stop offset="1" stop-color="#24101F"/>
    </linearGradient>
    <linearGradient id="copper" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#D58A54"/>
      <stop offset="1" stop-color="#A95835"/>
    </linearGradient>
    <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="22" stdDeviation="28" flood-color="#2A170F" flood-opacity="0.18"/>
    </filter>
    <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="45"/>
    </filter>
  </defs>

  <!-- A6 portrait, 105 × 148 mm at 300 DPI -->
  <rect width="1240" height="1748" fill="url(#bg)"/>
  <circle cx="1135" cy="115" r="260" fill="#D99A69" opacity="0.13"/>
  <circle cx="90" cy="1450" r="330" fill="#4A183B" opacity="0.07"/>
  <path d="M0 0H1240V315C1025 375 835 355 620 305C380 250 205 290 0 385Z" fill="url(#plum)"/>
  <path d="M0 315C230 245 390 270 620 330C845 390 1020 400 1240 340" fill="none" stroke="#D58A54" stroke-width="7" opacity="0.8"/>

  <!-- Brand lockup on a warm-white plate for maximum legibility -->
  <rect x="120" y="92" width="1000" height="208" rx="104" fill="#FFFDF9" opacity="0.98"/>
  <image href="data:image/png;base64,${logoData}" x="205" y="118" width="830" height="156" preserveAspectRatio="xMidYMid meet"/>

  <text x="620" y="500" text-anchor="middle" fill="#291710"
        font-family="Avenir Next, Inter, Helvetica, Arial, sans-serif"
        font-size="63" font-weight="700" letter-spacing="-1.4">How was your visit?</text>
  <text x="620" y="567" text-anchor="middle" fill="#6F5447"
        font-family="Avenir Next, Inter, Helvetica, Arial, sans-serif"
        font-size="30" font-weight="500">Your honest feedback helps us serve you better.</text>

  <!-- Google review cue -->
  <g transform="translate(390 620)">
    <rect width="460" height="76" rx="38" fill="#FFFFFF" stroke="#E5D9CF" stroke-width="2"/>
    <text x="88" y="50" font-family="Arial, Helvetica, sans-serif" font-size="35" font-weight="700">
      <tspan fill="#4285F4">G</tspan><tspan fill="#EA4335">o</tspan><tspan fill="#FBBC05">o</tspan><tspan fill="#4285F4">g</tspan><tspan fill="#34A853">l</tspan><tspan fill="#EA4335">e</tspan>
    </text>
    <text x="238" y="50" fill="#35231B" font-family="Avenir Next, Inter, Arial, sans-serif" font-size="31" font-weight="650">Review</text>
  </g>

  <!-- QR panel -->
  <g filter="url(#shadow)">
    <rect x="178" y="746" width="884" height="776" rx="64" fill="#FFFFFF"/>
  </g>
  <rect x="213" y="781" width="814" height="706" rx="46" fill="none" stroke="#EADFD6" stroke-width="3"/>
  <image href="data:image/svg+xml;base64,${qrData}" x="285" y="825" width="670" height="670"/>

  <!-- Scan label -->
  <g transform="translate(370 1475)">
    <rect width="500" height="96" rx="48" fill="url(#copper)"/>
    <path d="M65 35h27v27H65z M72 42h13v13H72z M99 35h27v27H99z M106 42h13v13h-13z M65 69h27v20H65z M72 76h13v6H72z M101 70h8v8h-8z M116 70h10v19h-10z M101 84h10v5h-10z" fill="#FFF"/>
    <text x="275" y="62" text-anchor="middle" fill="#FFFFFF"
          font-family="Avenir Next, Inter, Helvetica, Arial, sans-serif"
          font-size="32" font-weight="750" letter-spacing="2.6">SCAN TO REVIEW</text>
  </g>

  <text x="620" y="1634" text-anchor="middle" fill="#6F5447"
        font-family="Avenir Next, Inter, Helvetica, Arial, sans-serif"
        font-size="25" font-weight="500">Scan with your phone camera • Opens Google Reviews</text>
  <text x="620" y="1682" text-anchor="middle" fill="#A06B4B"
        font-family="Avenir Next, Inter, Helvetica, Arial, sans-serif"
        font-size="22" font-weight="700" letter-spacing="4">MANGOSTEEN CAFE · INDORE</text>
</svg>`;

fs.writeFileSync(
  path.join(artifactsDir, "mangosteen-google-review-card.svg"),
  cardSvg,
);
fs.writeFileSync(
  path.join(artifactsDir, "mangosteen-google-review-card.html"),
  `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Mangosteen Google Review Card</title>
    <style>
      @page { size: A6 portrait; margin: 0; }
      * { box-sizing: border-box; }
      html, body {
        margin: 0;
        width: 100%;
        height: 100%;
        overflow: hidden;
        background: #fbf7f0;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      img { display: block; width: 100%; height: 100%; }
    </style>
  </head>
  <body>
    <img src="mangosteen-google-review-card.svg" alt="Mangosteen Google review QR card" />
  </body>
</html>`,
);
fs.writeFileSync(
  path.join(artifactsDir, "mangosteen-google-review-link.txt"),
  `${reviewUrl}\n`,
);

console.log(`Created review card for ${reviewUrl}`);
