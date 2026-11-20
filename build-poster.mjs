import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT_DIR = dirname(fileURLToPath(import.meta.url));
const OUT_IMAGE = resolve(ROOT_DIR, 'entry.png');

function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
  ].filter(Boolean);
  for (const path of candidates) {
    if (existsSync(path)) return path;
  }
  throw new Error('Google Chrome executable not found. Set CHROME_PATH.');
}

function buildHtml() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body {
    width: 1024px;
    height: 1024px;
    overflow: hidden;
    background: #F4EFE4;
    color: #0F172A;
    font-family: 'Segoe UI', system-ui, sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  .canvas {
    width: 1024px;
    height: 1024px;
    padding: 12px 14px 10px 14px;
    background:
      radial-gradient(circle at 18% 12%, rgba(217,119,6,0.05), transparent 45%),
      radial-gradient(circle at 82% 88%, rgba(15,118,110,0.05), transparent 45%),
      #F4EFE4;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  /* MASTHEAD */
  .masthead {
    background: linear-gradient(135deg, #09111E 0%, #132136 65%, #1A2B45 100%);
    color: #F8FAFC;
    border-radius: 6px;
    padding: 10px 18px 9px 18px;
    border-bottom: 4px solid #C81E1E;
    box-shadow: 0 3px 10px rgba(15,23,42,0.18);
    display: flex;
    flex-direction: column;
    gap: 3px;
  }
  .masthead-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-family: 'Bahnschrift', 'Segoe UI', sans-serif;
    font-size: 11.5px;
    font-weight: 700;
    letter-spacing: 1.6px;
    text-transform: uppercase;
    color: #FBBF24;
  }
  .masthead-title {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 12px;
  }
  .masthead-title h1 {
    font-family: 'Georgia', serif;
    font-size: 40px;
    font-weight: 700;
    letter-spacing: -0.4px;
    line-height: 1.05;
    color: #FFFFFF;
  }
  .masthead-edition {
    font-family: 'Bahnschrift', 'Segoe UI', sans-serif;
    font-size: 16px;
    font-weight: 700;
    letter-spacing: 0.8px;
    color: #E2E8F0;
    background: rgba(255,255,255,0.10);
    border: 1px solid rgba(251,191,36,0.45);
    padding: 4px 10px;
    border-radius: 4px;
    white-space: nowrap;
  }
  .masthead-sub {
    font-family: 'Bahnschrift', 'Segoe UI', sans-serif;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.55px;
    color: #CBD5E1;
    border-top: 1px solid rgba(255,255,255,0.16);
    padding-top: 4px;
    white-space: nowrap;
  }

  /* GRID ROWS */
  .row-hero {
    display: grid;
    grid-template-columns: 1.16fr 1fr;
    gap: 10px;
    height: 340px;
  }
  .row-mid {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 10px;
    height: 274px;
  }
  .row-bot {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 10px;
    height: 240px;
  }

  /* CARDS */
  .card {
    background: #FFFDF8;
    border: 1.5px solid #CBD5E1;
    border-radius: 6px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    box-shadow: 0 2px 6px rgba(15,23,42,0.08);
    position: relative;
  }
  .card::before {
    content: "";
    height: 4px;
    width: 100%;
    display: block;
    background: var(--accent, #1E3A8A);
    flex-shrink: 0;
  }
  .card-art {
    width: 100%;
    position: relative;
    overflow: hidden;
    flex-shrink: 0;
    border-bottom: 1px solid #E2E8F0;
  }
  .row-hero .card-art { height: 200px; }
  .row-mid .card-art { height: 138px; }
  .row-bot .card-art { height: 114px; }

  .tag {
    position: absolute;
    top: 7px;
    left: 7px;
    background: var(--accent, #1E3A8A);
    color: #FFFFFF;
    font-family: 'Bahnschrift', 'Segoe UI', sans-serif;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.85px;
    text-transform: uppercase;
    padding: 2.5px 7px;
    border-radius: 3px;
    box-shadow: 0 1px 4px rgba(0,0,0,0.4);
    z-index: 2;
  }
  .card-body {
    padding: 9px 11px 8px 11px;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    gap: 4px;
    flex: 1;
  }
  .row-hero .card-body { padding: 10px 13px 9px 13px; gap: 5px; }
  .card h2 {
    font-family: 'Georgia', serif;
    font-weight: 700;
    color: #0F172A;
    line-height: 1.14;
    letter-spacing: -0.2px;
  }
  .row-hero .card h2 { font-size: 22.5px; }
  .row-mid .card h2 { font-size: 18.5px; }
  .row-bot .card h2 { font-size: 17.5px; }

  .card p {
    font-family: 'Segoe UI', sans-serif;
    color: #334155;
    line-height: 1.28;
    font-weight: 500;
  }
  .row-hero .card p { font-size: 13.6px; }
  .row-mid .card p { font-size: 12.2px; }
  .row-bot .card p { font-size: 11.8px; }

  .hl { font-weight: 700; color: #0F172A; }

  /* FOOTER */
  .footer {
    height: 26px;
    background: #1E293B;
    color: #E2E8F0;
    border-radius: 4px;
    padding: 0 12px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-family: 'Bahnschrift', 'Segoe UI', sans-serif;
    font-size: 11.5px;
    font-weight: 600;
    letter-spacing: 0.7px;
    text-transform: uppercase;
  }
  .footer strong { color: #FBBF24; }
  svg { display: block; width: 100%; height: 100%; }
</style>
</head>
<body>
<div class="canvas">

  <!-- MASTHEAD -->
  <header class="masthead">
    <div class="masthead-top">
      <span>THE GLOBAL DISPATCH &middot; ONE DAY IN WORLD NEWS</span>
      <span>6 REGIONS &middot; 8 KEY STORIES &middot; VERIFIED REPORTS</span>
    </div>
    <div class="masthead-title">
      <h1>FRIDAY, 20 NOVEMBER 2026</h1>
      <div class="masthead-edition">WORLD FRONT PAGE</div>
    </div>
    <div class="masthead-sub">
      UKRAINE &amp; POLAND &bull; COP31 ANTALYA &bull; AI ROUT &bull; SHENZHEN SUMMIT &bull; UK-EU RESET &bull; CYCLONE AKVAN &bull; RED SEA &amp; WFP &bull; SPACE &amp; BRAZIL
    </div>
  </header>

  <!-- ROW 1: HERO STORIES -->
  <section class="row-hero">

    <!-- STORY 1: UKRAINE & POLAND -->
    <article class="card" style="--accent: #B91C1C;">
      <div class="card-art">
        <span class="tag">EUROPE &middot; WAR &amp; NATO</span>
        <svg viewBox="0 0 510 200" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="kyivSky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#091120"/>
              <stop offset="65%" stop-color="#1E293B"/>
              <stop offset="100%" stop-color="#3F1A24"/>
            </linearGradient>
            <radialGradient id="blastGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="#FEF08A"/>
              <stop offset="45%" stop-color="#F97316"/>
              <stop offset="100%" stop-color="#DC2626" stop-opacity="0"/>
            </radialGradient>
          </defs>
          <rect width="510" height="200" fill="url(#kyivSky)"/>
          <!-- Left inset: Poland border radar -->
          <rect x="0" y="0" width="154" height="200" fill="#101B2E"/>
          <path d="M154,0 L154,200" stroke="#F59E0B" stroke-width="2" stroke-dasharray="5,4"/>
          <path d="M26,44 L78,38 L122,48 L136,88 L142,136 L112,158 L64,154 L28,136 L18,90 Z" fill="#1E3A5F" stroke="#60A5FA" stroke-width="1.6"/>
          <circle cx="116" cy="122" r="22" fill="none" stroke="#EF4444" stroke-width="1.3" stroke-dasharray="3,2"/>
          <circle cx="116" cy="122" r="37" fill="none" stroke="#EF4444" stroke-width="1" opacity="0.5"/>
          <circle cx="116" cy="122" r="4.5" fill="#EF4444"/>
          <path d="M192,68 Q146,90 119,119" fill="none" stroke="#FCA5A5" stroke-width="2.2" stroke-dasharray="4,3"/>
          <polygon points="114,122 124,114 122,124" fill="#EF4444"/>
          <text x="42" y="76" fill="#93C5FD" font-family="Bahnschrift, sans-serif" font-size="13.5" font-weight="700">POLAND</text>
          <text x="77" y="182" text-anchor="middle" fill="#FCA5A5" font-family="Bahnschrift, sans-serif" font-size="11.5" font-weight="700">2 MISSILES + DRONE</text>
          <text x="162" y="24" fill="#FDE68A" font-family="Bahnschrift, sans-serif" font-size="11" font-weight="700">NATO BORDER</text>

          <!-- Right main scene: Kyiv Dnipro Bridges -->
          <g transform="translate(154,0)">
            <!-- Kyiv Skyline incl. domes & monument silhouette -->
            <path d="M16,136 L16,92 L32,92 L32,74 L48,74 L48,136 M58,136 L58,82 L76,82 L76,62 L94,62 L94,136 M112,136 L112,72 L134,72 L134,136 M198,136 L198,80 L220,80 L220,64 L238,64 L238,136 M258,136 L258,86 L284,86 L284,68 L302,68 L302,136" fill="#0B1322" opacity="0.92"/>
            <path d="M318,136 L323,54 L328,136 Z" fill="#0B1322"/>
            <circle cx="123" cy="68" r="8" fill="#0B1322"/>
            <!-- Dnipro River -->
            <rect x="0" y="142" width="356" height="58" fill="#0B233B"/>
            <path d="M10,160 Q90,154 170,161 T340,159" stroke="#38BDF8" stroke-width="1.2" fill="none" opacity="0.35"/>
            <path d="M25,178 Q110,173 195,180 T345,178" stroke="#38BDF8" stroke-width="1.2" fill="none" opacity="0.25"/>
            <!-- 3 Bridges across Dnipro -->
            <path d="M18,142 Q66,112 114,142" fill="none" stroke="#94A3B8" stroke-width="4"/>
            <rect x="10" y="138" width="112" height="5" fill="#CBD5E1"/>
            <path d="M138,142 L180,92 L222,142" fill="none" stroke="#94A3B8" stroke-width="3.5"/>
            <line x1="180" y1="92" x2="180" y2="140" stroke="#CBD5E1" stroke-width="3"/>
            <rect x="132" y="138" width="100" height="5" fill="#CBD5E1"/>
            <path d="M246,142 Q292,116 338,142" fill="none" stroke="#94A3B8" stroke-width="4"/>
            <rect x="240" y="138" width="106" height="5" fill="#CBD5E1"/>
            <!-- Missile arcs & blasts -->
            <path d="M332,14 Q252,50 182,130" fill="none" stroke="#F87171" stroke-width="2.6"/>
            <path d="M298,8 Q200,47 90,132" fill="none" stroke="#FB923C" stroke-width="2.2" stroke-dasharray="5,3"/>
            <path d="M348,42 Q314,74 286,129" fill="none" stroke="#F87171" stroke-width="2.2"/>
            <circle cx="182" cy="130" r="24" fill="url(#blastGlow)"/>
            <circle cx="90" cy="132" r="18" fill="url(#blastGlow)"/>
            <circle cx="286" cy="129" r="16" fill="url(#blastGlow)"/>
            <!-- Badge -->
            <rect x="206" y="10" width="140" height="24" rx="4" fill="rgba(15,23,42,0.88)" stroke="#EF4444"/>
            <text x="276" y="26" text-anchor="middle" fill="#FCA5A5" font-family="Bahnschrift, sans-serif" font-size="12" font-weight="700">KYIV &middot; 3 BRIDGES HIT</text>
          </g>
        </svg>
      </div>
      <div class="card-body">
        <h2>Kyiv Bridges Struck; Missiles Enter Poland</h2>
        <p><span class="hl">100+ missiles &amp; 400+ drones</span> hit Ukraine energy &amp; 3 Dnipro bridges (3+ dead). Two Russian cruise missiles &amp; drone crash in SE Poland; PM Tusk calls NATO talks.</p>
      </div>
    </article>

    <!-- STORY 2: COP31 ANTALYA -->
    <article class="card" style="--accent: #C2410C;">
      <div class="card-art">
        <span class="tag">CLIMATE &middot; COP31 ANTALYA</span>
        <svg viewBox="0 0 430 200" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="copBg" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#431407"/>
              <stop offset="55%" stop-color="#9A3412"/>
              <stop offset="100%" stop-color="#1E293B"/>
            </linearGradient>
          </defs>
          <rect width="430" height="200" fill="url(#copBg)"/>
          <!-- Sun / Heat ring -->
          <circle cx="215" cy="92" r="66" fill="#F97316" opacity="0.22"/>
          <circle cx="215" cy="92" r="48" fill="#FB923C" opacity="0.34"/>
          <!-- Dome hall & fracture -->
          <path d="M122,166 C122,106 308,106 308,166 Z" fill="#1E293B" stroke="#FDBA74" stroke-width="2"/>
          <rect x="94" y="166" width="242" height="14" rx="2" fill="#0F172A"/>
          <path d="M217,32 L205,80 L224,106 L208,146 L220,180" fill="none" stroke="#FEF08A" stroke-width="3.5"/>
          <!-- Left: Africa continent & finance demand pill -->
          <g transform="translate(22,38)">
            <path d="M30,10 C42,6 56,10 64,18 C72,26 70,34 86,44 C90,50 82,66 72,76 C68,88 60,102 50,104 C42,102 42,88 38,72 C34,62 18,56 12,44 C8,30 16,14 30,10 Z" fill="#FBBF24" stroke="#FFFBEB" stroke-width="1.6"/>
            <rect x="-8" y="108" width="122" height="36" rx="4" fill="rgba(15,23,42,0.88)" stroke="#FBBF24"/>
            <text x="53" y="123" text-anchor="middle" fill="#FDE68A" font-family="Bahnschrift, sans-serif" font-size="11.5" font-weight="700">AFRICA GROUP</text>
            <text x="53" y="138" text-anchor="middle" fill="#FED7AA" font-family="Bahnschrift, sans-serif" font-size="10.5" font-weight="600">FINANCE DEMANDS</text>
          </g>
          <!-- Right: Fossil fuel barrel & phase-out stalled -->
          <g transform="translate(304,48)">
            <rect x="22" y="16" width="44" height="58" rx="4" fill="#0F172A" stroke="#F87171" stroke-width="2"/>
            <line x1="22" y1="34" x2="66" y2="34" stroke="#475569" stroke-width="2"/>
            <line x1="22" y1="56" x2="66" y2="56" stroke="#475569" stroke-width="2"/>
            <line x1="16" y1="10" x2="72" y2="80" stroke="#EF4444" stroke-width="4.5"/>
            <rect x="-4" y="88" width="100" height="36" rx="4" fill="rgba(15,23,42,0.88)" stroke="#EF4444"/>
            <text x="46" y="103" text-anchor="middle" fill="#FCA5A5" font-family="Bahnschrift, sans-serif" font-size="11.5" font-weight="700">PHASE-OUT</text>
            <text x="46" y="118" text-anchor="middle" fill="#F87171" font-family="Bahnschrift, sans-serif" font-size="11.5" font-weight="700">STALLED</text>
          </g>
          <!-- Top badges -->
          <rect x="278" y="10" width="140" height="24" rx="4" fill="rgba(15,23,42,0.88)" stroke="#F97316"/>
          <text x="348" y="26" text-anchor="middle" fill="#FED7AA" font-family="Bahnschrift, sans-serif" font-size="12" font-weight="700">FINAL DAY &middot; US ABSENT</text>
        </svg>
      </div>
      <div class="card-body">
        <h2>COP31 Ends in Bitter Final-Day Deadlock</h2>
        <p>Antalya UN summit stalls as <span class="hl">African negotiators</span> slam rich nations over unpaid climate finance &amp; weak fossil-fuel phase-out text.</p>
      </div>
    </article>

  </section>

  <!-- ROW 2: MARKETS, SHENZHEN, UK-EU -->
  <section class="row-mid">

    <!-- STORY 3: GLOBAL TECH SELL-OFF & ANTHROPIC IPO -->
    <article class="card" style="--accent: #BE123C;">
      <div class="card-art">
        <span class="tag">MARKETS &amp; AI</span>
        <svg viewBox="0 0 320 138" xmlns="http://www.w3.org/2000/svg">
          <rect width="320" height="138" fill="#0F172A"/>
          <!-- Gridlines -->
          <line x1="0" y1="36" x2="320" y2="36" stroke="#1E293B"/>
          <line x1="0" y1="68" x2="320" y2="68" stroke="#1E293B"/>
          <line x1="0" y1="100" x2="320" y2="100" stroke="#1E293B"/>
          <!-- Area drop (upper half clean, ends cleanly above bottom ticker) -->
          <path d="M18,46 L68,52 L115,44 L162,64 L212,78 L256,88 L298,96 L298,105 L18,105 Z" fill="#E11D48" opacity="0.22"/>
          <polyline points="18,46 68,52 115,44 162,64 212,78 256,88 298,96" fill="none" stroke="#FB7185" stroke-width="3.2"/>
          <!-- Candlesticks -->
          <rect x="62" y="45" width="11" height="16" fill="#F43F5E"/>
          <rect x="109" y="39" width="11" height="14" fill="#10B981"/>
          <rect x="156" y="56" width="11" height="18" fill="#F43F5E"/>
          <rect x="206" y="68" width="11" height="20" fill="#F43F5E"/>
          <rect x="250" y="76" width="11" height="22" fill="#E11D48"/>
          <!-- IPO badge top-right -->
          <rect x="158" y="8" width="152" height="36" rx="4" fill="#064E3B" stroke="#34D399" stroke-width="1.5"/>
          <text x="234" y="23" text-anchor="middle" fill="#A7F3D0" font-family="Bahnschrift, sans-serif" font-size="11" font-weight="700">ANTHROPIC IPO (ANT)</text>
          <text x="234" y="38" text-anchor="middle" fill="#FFFFFF" font-family="Bahnschrift, sans-serif" font-size="13" font-weight="700">$81.3B DEBUT</text>
          <!-- Losses full bottom ticker bar (zero overlap!) -->
          <rect x="10" y="106" width="300" height="24" rx="4" fill="#1E1B2E" stroke="#FB7185"/>
          <text x="160" y="122" text-anchor="middle" fill="#FECDD3" font-family="Bahnschrift, sans-serif" font-size="11.5" font-weight="700">TAIWAN -6% &middot; KOSPI -5% &middot; NIKKEI -5%</text>
        </svg>
      </div>
      <div class="card-body">
        <h2>Global Tech Sell-Off Despite Anthropic IPO</h2>
        <p>Asia &amp; Europe equities tumble toward <span class="hl">worst week since 2020</span> on AI capex bubble fears.</p>
      </div>
    </article>

    <!-- STORY 4: SHENZHEN SUMMIT -->
    <article class="card" style="--accent: #1D4ED8;">
      <div class="card-art">
        <span class="tag">ASIA-PACIFIC &middot; SUMMIT</span>
        <svg viewBox="0 0 320 138" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="szBg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#0F172A"/>
              <stop offset="100%" stop-color="#1E3A8A"/>
            </linearGradient>
          </defs>
          <rect width="320" height="138" fill="url(#szBg)"/>
          <!-- Shenzhen skyline -->
          <path d="M12,138 L12,92 L28,92 L28,76 L46,76 L46,138 M60,138 L60,82 L82,82 L82,138 M142,138 L142,74 L160,38 L178,74 L178,138 M194,138 L194,88 L220,88 L220,138 M244,138 L244,72 L270,72 L270,138 M280,138 L280,96 L306,96 L306,138" fill="#09111E" opacity="0.72"/>
          <!-- Three Leader Nodes -->
          <line x1="70" y1="64" x2="160" y2="48" stroke="#93C5FD" stroke-width="2"/>
          <line x1="250" y1="64" x2="160" y2="48" stroke="#93C5FD" stroke-width="2"/>
          <line x1="70" y1="64" x2="250" y2="64" stroke="#60A5FA" stroke-width="1.5" stroke-dasharray="4,3"/>
          <circle cx="70" cy="64" r="23" fill="#1E40AF" stroke="#FFFFFF" stroke-width="2"/>
          <text x="70" y="62" text-anchor="middle" fill="#FFFFFF" font-family="Bahnschrift, sans-serif" font-size="11.5" font-weight="700">USA</text>
          <text x="70" y="75" text-anchor="middle" fill="#BFDBFE" font-family="Bahnschrift, sans-serif" font-size="9.5">TRUMP</text>
          <circle cx="160" cy="48" r="25" fill="#B91C1C" stroke="#FBBF24" stroke-width="2"/>
          <text x="160" y="46" text-anchor="middle" fill="#FEF08A" font-family="Bahnschrift, sans-serif" font-size="11.5" font-weight="700">CHINA</text>
          <text x="160" y="59" text-anchor="middle" fill="#FFFFFF" font-family="Bahnschrift, sans-serif" font-size="9.5">XI</text>
          <circle cx="250" cy="64" r="23" fill="#0F172A" stroke="#93C5FD" stroke-width="2"/>
          <text x="250" y="62" text-anchor="middle" fill="#FFFFFF" font-family="Bahnschrift, sans-serif" font-size="11.5" font-weight="700">RUSSIA</text>
          <text x="250" y="75" text-anchor="middle" fill="#BFDBFE" font-family="Bahnschrift, sans-serif" font-size="9.5">PUTIN</text>
          <!-- Bottom ribbon -->
          <rect x="26" y="106" width="268" height="24" rx="4" fill="rgba(15,23,42,0.9)" stroke="#FBBF24"/>
          <text x="160" y="122" text-anchor="middle" fill="#FDE68A" font-family="Bahnschrift, sans-serif" font-size="11" font-weight="700">SHENZHEN &middot; NUCLEAR RISK &amp; UN REFORM</text>
        </svg>
      </div>
      <div class="card-body">
        <h2>Shenzhen Tri-Summit Joint Statement</h2>
        <p><span class="hl">Trump, Xi &amp; Putin</span> wrap APEC talks with 4-point stability statement; Ukraine omitted.</p>
      </div>
    </article>

    <!-- STORY 5: UK-EU RESET DEAL -->
    <article class="card" style="--accent: #0369A1;">
      <div class="card-art">
        <span class="tag">UK &amp; EU &middot; BRUSSELS</span>
        <svg viewBox="0 0 320 138" xmlns="http://www.w3.org/2000/svg">
          <rect width="320" height="138" fill="#0C2442"/>
          <!-- Channel water -->
          <path d="M0,98 Q80,88 160,98 T320,98 L320,138 L0,138 Z" fill="#0369A1" opacity="0.6"/>
          <!-- Bridge arch -->
          <path d="M58,86 Q160,26 262,86" fill="none" stroke="#FBBF24" stroke-width="4.5"/>
          <line x1="112" y1="62" x2="112" y2="92" stroke="#FDE68A" stroke-width="2"/>
          <line x1="160" y1="56" x2="160" y2="94" stroke="#FDE68A" stroke-width="2"/>
          <line x1="208" y1="62" x2="208" y2="92" stroke="#FDE68A" stroke-width="2"/>
          <!-- UK Flag badge -->
          <g transform="translate(26,48)">
            <rect width="58" height="38" rx="4" fill="#012169" stroke="#FFFFFF" stroke-width="1.5"/>
            <line x1="0" y1="0" x2="58" y2="38" stroke="#FFFFFF" stroke-width="5"/>
            <line x1="58" y1="0" x2="0" y2="38" stroke="#FFFFFF" stroke-width="5"/>
            <line x1="0" y1="0" x2="58" y2="38" stroke="#C8102E" stroke-width="2"/>
            <line x1="58" y1="0" x2="0" y2="38" stroke="#C8102E" stroke-width="2"/>
            <line x1="29" y1="0" x2="29" y2="38" stroke="#FFFFFF" stroke-width="9"/>
            <line x1="0" y1="19" x2="58" y2="19" stroke="#FFFFFF" stroke-width="9"/>
            <line x1="29" y1="0" x2="29" y2="38" stroke="#C8102E" stroke-width="5"/>
            <line x1="0" y1="19" x2="58" y2="19" stroke="#C8102E" stroke-width="5"/>
          </g>
          <!-- EU Flag badge -->
          <g transform="translate(236,48)">
            <rect width="58" height="38" rx="4" fill="#003399" stroke="#FFFFFF" stroke-width="1.5"/>
            <circle cx="29" cy="19" r="11" fill="none" stroke="#FFCC00" stroke-width="3" stroke-dasharray="2.5,3.2"/>
          </g>
          <!-- Pills -->
          <rect x="20" y="106" width="84" height="22" rx="4" fill="#0F172A" stroke="#38BDF8"/>
          <text x="62" y="121" text-anchor="middle" fill="#E0F2FE" font-family="Bahnschrift, sans-serif" font-size="10.5" font-weight="700">FOOD TRADE</text>
          <rect x="112" y="106" width="96" height="22" rx="4" fill="#0F172A" stroke="#38BDF8"/>
          <text x="160" y="121" text-anchor="middle" fill="#E0F2FE" font-family="Bahnschrift, sans-serif" font-size="10.5" font-weight="700">YOUTH 100K</text>
          <rect x="216" y="106" width="84" height="22" rx="4" fill="#0F172A" stroke="#38BDF8"/>
          <text x="258" y="121" text-anchor="middle" fill="#E0F2FE" font-family="Bahnschrift, sans-serif" font-size="10.5" font-weight="700">CO2 LINK</text>
        </svg>
      </div>
      <div class="card-body">
        <h2>UK &amp; EU Strike Post-Brexit Reset Deal</h2>
        <p>PM Burnham &amp; EU leaders agree <span class="hl">agri-food, emissions &amp; youth pacts</span>; EU tuition fees deferred.</p>
      </div>
    </article>

  </section>

  <!-- ROW 3: WEATHER, MIDDLE EAST/UN, SPACE/AMERICAS -->
  <section class="row-bot">

    <!-- STORY 6: CYCLONE AKVAN -->
    <article class="card" style="--accent: #0F766E;">
      <div class="card-art">
        <span class="tag">INDIA &middot; CYCLONE</span>
        <svg viewBox="0 0 320 114" xmlns="http://www.w3.org/2000/svg">
          <rect width="320" height="114" fill="#082A33"/>
          <!-- East India coast (Bengal -> Odisha -> Andhra) -->
          <path d="M0,0 L185,0 L176,22 L152,44 L132,68 L112,92 L98,114 L0,114 Z" fill="#1B3B2F" stroke="#34D399" stroke-width="1.6"/>
          <text x="58" y="54" text-anchor="middle" fill="#A7F3D0" font-family="Bahnschrift, sans-serif" font-size="12" font-weight="700">ODISHA</text>
          <text x="46" y="92" text-anchor="middle" fill="#A7F3D0" font-family="Bahnschrift, sans-serif" font-size="11" font-weight="700">ANDHRA</text>
          <!-- Cyclone spiral -->
          <g transform="translate(152,58)">
            <circle cx="0" cy="0" r="34" fill="#14B8A6" opacity="0.24"/>
            <path d="M0,0 C15,-22 40,-12 32,12 C25,34 -16,34 -26,8 C-34,-14 -12,-36 14,-30" fill="none" stroke="#5EEAD4" stroke-width="3" stroke-linecap="round"/>
            <path d="M0,0 C-10,14 -28,6 -20,-10 C-14,-24 12,-24 19,-6" fill="none" stroke="#FBBF24" stroke-width="2.2" stroke-linecap="round"/>
            <circle cx="0" cy="0" r="5" fill="#FEF08A"/>
          </g>
          <!-- Landfall arrow -->
          <path d="M238,84 L168,62" stroke="#F87171" stroke-width="2.4" stroke-dasharray="4,3"/>
          <text x="252" y="98" text-anchor="middle" fill="#5EEAD4" font-family="Bahnschrift, sans-serif" font-size="10" font-weight="700">BAY OF BENGAL</text>
          <rect x="198" y="10" width="112" height="36" rx="4" fill="rgba(15,23,42,0.88)" stroke="#2DD4BF"/>
          <text x="254" y="25" text-anchor="middle" fill="#99F6E4" font-family="Bahnschrift, sans-serif" font-size="10.5" font-weight="700">GOPALPUR LANDFALL</text>
          <text x="254" y="39" text-anchor="middle" fill="#FFFFFF" font-family="Bahnschrift, sans-serif" font-size="12" font-weight="700">70-90 KM/H</text>
        </svg>
      </div>
      <div class="card-body">
        <h2>Cyclone Akvan Batters Eastern India</h2>
        <p>Storm makes landfall near <span class="hl">Gopalpur</span>, bringing 90 km/h gusts &amp; heavy Odisha/Andhra rains.</p>
      </div>
    </article>

    <!-- STORY 7: MIDEAST & UN HUNGER -->
    <article class="card" style="--accent: #B45309;">
      <div class="card-art">
        <span class="tag">MIDEAST &amp; UN WFP</span>
        <svg viewBox="0 0 320 114" xmlns="http://www.w3.org/2000/svg">
          <rect width="320" height="114" fill="#231408"/>
          <line x1="164" y1="0" x2="164" y2="114" stroke="#F59E0B" stroke-width="1.5" opacity="0.45"/>
          <!-- Left: Red Sea / Yemen coastline + Hodeida alert -->
          <path d="M0,114 L0,36 L44,24 L74,40 L84,82 L112,86 L120,114 Z" fill="#451A03" stroke="#F59E0B" stroke-width="1.3"/>
          <text x="34" y="60" fill="#FEF08A" font-family="Bahnschrift, sans-serif" font-size="10.5" font-weight="700">YEMEN</text>
          <circle cx="84" cy="54" r="16" fill="none" stroke="#EF4444" stroke-width="2" stroke-dasharray="3,2"/>
          <circle cx="84" cy="54" r="4.5" fill="#EF4444"/>
          <path d="M108,16 Q118,34 90,50" fill="none" stroke="#FCA5A5" stroke-width="2" stroke-dasharray="3,2"/>
          <rect x="8" y="80" width="146" height="24" rx="4" fill="rgba(15,23,42,0.88)" stroke="#EF4444"/>
          <text x="81" y="96" text-anchor="middle" fill="#FCA5A5" font-family="Bahnschrift, sans-serif" font-size="10.5" font-weight="700">HODEIDA EVACUATION</text>
          <!-- Right: UN WFP globe + wheat wreath -->
          <circle cx="242" cy="42" r="23" fill="#0369A1" stroke="#E0F2FE" stroke-width="1.5"/>
          <ellipse cx="242" cy="42" rx="10" ry="23" fill="none" stroke="#BAE6FD" stroke-width="1"/>
          <line x1="219" y1="42" x2="265" y2="42" stroke="#BAE6FD" stroke-width="1"/>
          <path d="M214,30 C208,50 222,66 238,68 M270,30 C276,50 262,66 246,68" fill="none" stroke="#FDE68A" stroke-width="2.4" stroke-linecap="round"/>
          <rect x="174" y="80" width="136" height="24" rx="4" fill="rgba(15,23,42,0.88)" stroke="#FBBF24"/>
          <text x="242" y="96" text-anchor="middle" fill="#FEF08A" font-family="Bahnschrift, sans-serif" font-size="11" font-weight="700">WFP CUT TO 91M ($12B)</text>
        </svg>
      </div>
      <div class="card-body">
        <h2>Hodeida Warning; UN Cuts Aid Target</h2>
        <p>Saudi coalition warns <span class="hl">Yemen port</span> civilians; UN WFP cuts 2027 reach to 91M on funding gap.</p>
      </div>
    </article>

    <!-- STORY 8: SPACE & AMERICAS -->
    <article class="card" style="--accent: #047857;">
      <div class="card-art">
        <span class="tag">SPACE &amp; AMERICAS</span>
        <svg viewBox="0 0 320 114" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="spaceBg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#030816"/>
              <stop offset="100%" stop-color="#0F2A4A"/>
            </linearGradient>
          </defs>
          <rect width="320" height="114" fill="url(#spaceBg)"/>
          <circle cx="34" cy="34" r="1.1" fill="#FFF"/>
          <circle cx="145" cy="18" r="1.4" fill="#FFF"/>
          <circle cx="195" cy="24" r="1.1" fill="#FFF"/>
          <circle cx="290" cy="60" r="1.3" fill="#FFF"/>
          <!-- Earth atmospheric limb -->
          <path d="M-20,118 Q160,64 340,118 Z" fill="#0284C7" stroke="#7DD3FC" stroke-width="3"/>
          <!-- ISS solar truss -->
          <g transform="translate(76,46)">
            <rect x="-34" y="-14" width="10" height="28" fill="#1D4ED8" stroke="#93C5FD" stroke-width="1"/>
            <rect x="-21" y="-14" width="10" height="28" fill="#1D4ED8" stroke="#93C5FD" stroke-width="1"/>
            <rect x="11" y="-14" width="10" height="28" fill="#1D4ED8" stroke="#93C5FD" stroke-width="1"/>
            <rect x="24" y="-14" width="10" height="28" fill="#1D4ED8" stroke="#93C5FD" stroke-width="1"/>
            <rect x="-36" y="-2" width="72" height="4" fill="#CBD5E1"/>
            <rect x="-8" y="-7" width="16" height="14" rx="2" fill="#F1F5F9"/>
          </g>
          <!-- Dragon capsule undocking -->
          <path d="M116,46 L154,53" stroke="#34D399" stroke-width="2" stroke-dasharray="3,2"/>
          <g transform="translate(174,56) rotate(12)">
            <path d="M-12,-7 L4,-7 L12,0 L4,7 L-12,7 Z" fill="#F8FAFC" stroke="#38BDF8" stroke-width="1.4"/>
            <rect x="-18" y="-6" width="6" height="12" fill="#334155"/>
          </g>
          <text x="164" y="80" text-anchor="middle" fill="#BAE6FD" font-family="Bahnschrift, sans-serif" font-size="10.5" font-weight="700">CRS-35 DRAGON &middot; 17:05Z</text>
          <!-- Brazil CB badge -->
          <rect x="202" y="10" width="108" height="36" rx="4" fill="#064E3B" stroke="#34D399"/>
          <text x="256" y="25" text-anchor="middle" fill="#A7F3D0" font-family="Bahnschrift, sans-serif" font-size="10" font-weight="700">BRAZIL FX DEFENSE</text>
          <text x="256" y="39" text-anchor="middle" fill="#FFFFFF" font-family="Bahnschrift, sans-serif" font-size="12" font-weight="700">$1B SOLD (5.93)</text>
        </svg>
      </div>
      <div class="card-body">
        <h2>SpaceX CRS-35 Undocks; Brazil Sells $1B</h2>
        <p><span class="hl">Dragon capsule</span> returns ISS research; Brazil's central bank defends real near 5.93/USD.</p>
      </div>
    </article>

  </section>

  <!-- FOOTER -->
  <footer class="footer">
    <span>SIX CONTINENTS &bull; GEOPOLITICS &bull; CLIMATE &bull; MARKETS &bull; WEATHER &bull; SPACE</span>
    <span>EDITION: <strong>20 NOVEMBER 2026</strong></span>
  </footer>

</div>
</body>
</html>`;
}

function main() {
  const chrome = findChrome();
  const workDir = join(tmpdir(), 'news-image-20261120-render');
  mkdirSync(workDir, { recursive: true });

  const htmlPath = join(workDir, 'poster.html');
  writeFileSync(htmlPath, buildHtml(), 'utf8');

  const userDataDir = join(workDir, 'chrome-profile');
  execFileSync(
    chrome,
    [
      '--headless=new',
      '--disable-gpu',
      '--no-sandbox',
      '--hide-scrollbars',
      `--user-data-dir=${userDataDir}`,
      '--window-size=1024,1024',
      '--force-device-scale-factor=1',
      `--screenshot=${OUT_IMAGE}`,
      pathToFileURL(htmlPath).href,
    ],
    { stdio: 'pipe', timeout: 30000 },
  );

  const bytes = statSync(OUT_IMAGE).size;
  const header = readFileSync(OUT_IMAGE).subarray(0, 24);
  const w = header.readUInt32BE(16);
  const h = header.readUInt32BE(20);
  rmSync(workDir, { recursive: true, force: true });
  console.log(`Generated ${OUT_IMAGE}: ${w}x${h}, ${bytes} bytes`);
}

main();
