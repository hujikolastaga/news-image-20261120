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

const WORLD_BRIEFS = [
  { id: 14, color: '#1E3A8A', city: 'Lviv', text: 'Rail station strike kills two', src: 'BBC' },
  { id: 15, color: '#1E3A8A', city: 'Kharkiv', text: 'Drone hits hospital, 4 hurt', src: 'Ukrinform' },
  { id: 16, color: '#1E3A8A', city: 'Smolensk', text: 'Drones hit Dorogobuzh plant', src: 'ISW' },
  { id: 17, color: '#1E3A8A', city: 'Estonia', text: 'Russia road border shut Dec 1', src: 'Reuters' },
  { id: 18, color: '#1E3A8A', city: 'Germany', text: 'Anti-draft youth walkouts grow', src: 'Guardian' },
  { id: 19, color: '#1E3A8A', city: 'London', text: 'UK confirms cyber ops abroad', src: 'Sky' },
  { id: 20, color: '#1E3A8A', city: 'Barcelona', text: 'Daraxonrasib hits 60.7% response', src: 'ENA' },
  { id: 21, color: '#1E3A8A', city: 'Turin', text: 'ATP prize pool tops $350m', src: 'ATP' },
  { id: 22, color: '#7C3AED', city: 'Washington', text: 'Judge blocks 250-ft Trump arch', src: 'PBS' },
  { id: 23, color: '#7C3AED', city: 'Florida', text: 'Historic rain floods coast', src: 'CBS' },
  { id: 24, color: '#334155', city: 'Markets', text: 'Bitcoin <$60k; gold drops 2.6%', src: 'Reuters' },
  { id: 25, color: '#B91C1C', city: 'Tokyo', text: 'SoftBank -14.5%; Kospi curbed', src: 'CNBC' },
  { id: 26, color: '#B91C1C', city: 'Beijing', text: 'PBOC holds loan rates 18th mo', src: 'Xinhua' },

  { id: 27, color: '#B91C1C', city: 'Seoul', text: 'Move to impeach chief justice', src: 'Dong-A' },
  { id: 28, color: '#B91C1C', city: 'Taipei', text: 'F-16s scramble vs Tu-95s', src: 'CNA' },
  { id: 29, color: '#B91C1C', city: 'Shenzhen', text: 'Xi hails Australia ties thaw', src: 'AA' },
  { id: 30, color: '#B91C1C', city: 'New Delhi', text: 'Pakistan attends SCO talks', src: 'PTI' },
  { id: 31, color: '#B91C1C', city: 'Naypyidaw', text: 'Junta rejects ICJ ruling', src: 'CNN' },
  { id: 32, color: '#B91C1C', city: 'Dhaka', text: '124 held amid fresh arson', src: 'Star' },
  { id: 33, color: '#B45309', city: 'Iraq', text: 'Army enters Jurf al-Sakhar', src: 'Reuters' },
  { id: 34, color: '#B45309', city: 'Yemen', text: 'Warning to quit Hodeida port', src: 'Al Arabiya' },
  { id: 35, color: '#15803D', city: 'S. Africa', text: 'Q3 log counts 581 women slain', src: 'SABC' },
  { id: 36, color: '#15803D', city: 'Malawi', text: 'Forex crisis spurs fuel queues', src: 'Al Jazeera' },
  { id: 37, color: '#15803D', city: 'Uganda', text: 'Ebola alert bans border rallies', src: 'Nile Post' },
  { id: 38, color: '#7C3AED', city: 'El Salvador', text: 'Bukele files 3rd-term bid', src: 'AP' },
  { id: 39, color: '#0F766E', city: 'Tonga', text: '27-day drought state emergency', src: 'PMN' },
];

function buildBriefColumn(items) {
  return items
    .map(
      (b) => `
      <div class="brief-item">
        <span class="brief-num" style="background:${b.color};">${b.id}</span>
        <div class="brief-txt"><strong>${b.city}:</strong> ${b.text} <span class="src">(${b.src})</span></div>
      </div>`,
    )
    .join('');
}

function buildHtml() {
  const col1 = buildBriefColumn(WORLD_BRIEFS.slice(0, 13));
  const col2 = buildBriefColumn(WORLD_BRIEFS.slice(13, 26));

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
    background: #F6F1E6;
    color: #0F172A;
    font-family: 'Segoe UI', system-ui, sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  .page {
    width: 1024px;
    height: 1024px;
    padding: 8px 14px 5px 14px;
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  /* MASTHEAD */
  .mast-top {
    display: flex;
    justify-content: space-between;
    font-family: 'Bahnschrift', 'Segoe UI', sans-serif;
    font-size: 10.5px;
    font-weight: 700;
    letter-spacing: 0.9px;
    text-transform: uppercase;
  }
  .mast-top .left { color: #991B1B; }
  .mast-top .right { color: #0F172A; }
  .mast-title-wrap {
    border-top: 3px solid #020617;
    border-bottom: 1.5px solid #020617;
    padding: 1.5px 0 3px 0;
    text-align: center;
  }
  .mast-title-wrap h1 {
    font-family: 'Georgia', serif;
    font-size: 46px;
    font-weight: 700;
    line-height: 1.01;
    letter-spacing: -0.6px;
    color: #020617;
  }
  .mast-deck {
    font-family: 'Segoe UI', system-ui, sans-serif;
    font-weight: 700;
    font-size: 11.8px;
    color: #0F172A;
    margin-top: 2px;
  }

  /* NUMBERS, REGIONS & SLIM UTC STRIP */
  .stats-row {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    border-bottom: 1.5px solid #020617;
    padding-bottom: 3px;
  }
  .stat-cell {
    padding: 0 7px;
    border-right: 1px solid #CBD5E1;
  }
  .stat-cell:first-child { padding-left: 0; }
  .stat-cell:last-child { border-right: none; padding-right: 0; }
  .stat-val {
    font-family: 'Georgia', serif;
    font-size: 18px;
    font-weight: 700;
    color: #020617;
    line-height: 1.05;
  }
  .stat-lbl {
    font-size: 9.6px;
    line-height: 1.15;
    color: #020617;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.25px;
  }

  .regions-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #EAE2D2;
    border-radius: 3px;
    padding: 2.5px 8px;
    margin-top: 3px;
  }
  .reg-pills {
    display: flex;
    gap: 6px;
    align-items: center;
  }
  .reg-pill {
    color: #FFFFFF;
    font-family: 'Bahnschrift', 'Segoe UI', sans-serif;
    font-size: 10px;
    font-weight: 700;
    padding: 1.5px 7.5px;
    border-radius: 2px;
    letter-spacing: 0.4px;
    text-transform: uppercase;
  }
  .reg-note {
    font-family: 'Bahnschrift', 'Segoe UI', sans-serif;
    font-size: 10px;
    font-weight: 700;
    color: #0F172A;
    letter-spacing: 0.5px;
  }
  .utc-strip {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: #FFFFFF;
    border: 1px solid #BDB39B;
    border-radius: 3px;
    padding: 3px 8px;
    margin-top: 3px;
  }
  .utc-tag {
    background: #991B1B;
    color: #FFFFFF;
    font-family: 'Bahnschrift', 'Segoe UI', sans-serif;
    font-size: 9.4px;
    font-weight: 700;
    padding: 1.5px 6px;
    border-radius: 2px;
    letter-spacing: 0.5px;
    flex-shrink: 0;
  }
  .utc-slot {
    font-size: 9.8px;
    font-weight: 600;
    color: #020617;
    white-space: nowrap;
  }
  .utc-slot strong {
    font-family: 'Bahnschrift', 'Segoe UI', sans-serif;
    color: #991B1B;
    margin-right: 2px;
  }

  /* ROW 1: LEAD CARDS */
  .row-lead {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    height: 204px;
  }
  .lead-card {
    background: #FFFFFF;
    border: 1px solid #BDB39B;
    border-top: 3.5px solid var(--c, #1E3A8A);
    border-radius: 3px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
  .lead-art {
    height: 92px;
    width: 100%;
    position: relative;
    overflow: hidden;
    flex-shrink: 0;
  }
  .lead-body {
    padding: 5px 8px;
    display: flex;
    flex-direction: column;
    gap: 3px;
    flex: 1;
  }
  .kicker {
    display: flex;
    align-items: center;
    gap: 5px;
    font-family: 'Bahnschrift', 'Segoe UI', sans-serif;
    font-size: 9.8px;
    font-weight: 700;
    letter-spacing: 0.4px;
    text-transform: uppercase;
    color: var(--c, #1E3A8A);
  }
  .num-dot {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: var(--c, #1E3A8A);
    color: #FFFFFF;
    font-size: 9.6px;
    font-weight: 700;
    flex-shrink: 0;
  }
  .lead-body h2 {
    font-family: 'Georgia', serif;
    font-size: 17px;
    font-weight: 700;
    line-height: 1.09;
    color: #020617;
  }
  .lead-body p {
    font-size: 11px;
    line-height: 1.22;
    color: #0F172A;
    font-weight: 500;
  }
  .src { color: #334155; font-style: italic; font-weight: 600; }

  /* ROWS 2 & 3: FEATURE CARDS (5 COLS) */
  .row-feat {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 7px;
    height: 138px;
  }
  .feat-card {
    background: #FFFFFF;
    border: 1px solid #BDB39B;
    border-top: 3px solid var(--c, #1E3A8A);
    border-radius: 3px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
  .feat-art {
    height: 54px;
    width: 100%;
    position: relative;
    overflow: hidden;
    flex-shrink: 0;
  }
  .feat-body {
    padding: 4px 6.5px;
    display: flex;
    flex-direction: column;
    gap: 2.5px;
    flex: 1;
  }
  .feat-body .kicker { font-size: 9.1px; gap: 4px; }
  .feat-body .num-dot { width: 14px; height: 14px; font-size: 8.8px; }
  .feat-body h3 {
    font-family: 'Bahnschrift', 'Segoe UI', sans-serif;
    font-size: 13.6px;
    font-weight: 700;
    line-height: 1.08;
    color: #020617;
    letter-spacing: -0.1px;
  }
  .feat-body p {
    font-size: 10.2px;
    line-height: 1.16;
    color: #0F172A;
    font-weight: 500;
  }

  /* BOTTOM SECTION: LARGE WORLD MAP (LEFT) & WIDE 2-COL SINGLE-LINE WIRE (RIGHT) */
  .bottom-sec {
    display: grid;
    grid-template-columns: 282px 1fr;
    gap: 12px;
    height: 274px;
    border-top: 2px solid #020617;
    padding-top: 5px;
  }
  .left-col {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }
  .sec-hdr {
    font-family: 'Bahnschrift', 'Segoe UI', sans-serif;
    font-size: 10.8px;
    font-weight: 700;
    letter-spacing: 0.65px;
    text-transform: uppercase;
    color: #020617;
    border-bottom: 1.5px solid #94A3B8;
    padding-bottom: 2px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .sec-hdr span.sub { font-size: 9.5px; color: #334155; font-weight: 700; }
  .map-wrap {
    flex: 1;
    background: #CFE2F1;
    border: 1px solid #94A3B8;
    border-radius: 3px;
    overflow: hidden;
  }
  .map-cap {
    font-size: 9.6px;
    color: #0F172A;
    font-weight: 600;
  }

  /* RIGHT: 2 WIDE SINGLE-LINE COLUMNS (26 ITEMS) */
  .wire-wrap {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .wire-cols {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    flex: 1;
  }
  .wire-col {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    border-right: 1px solid #D5CCB8;
    padding-right: 10px;
  }
  .wire-col:last-child { border-right: none; padding-right: 0; }
  .brief-item {
    display: flex;
    align-items: center;
    gap: 5.5px;
    border-bottom: 1px solid #E5DEC9;
    padding-bottom: 1.5px;
  }
  .brief-item:last-child { border-bottom: none; padding-bottom: 0; }
  .brief-num {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 17px;
    height: 14.5px;
    border-radius: 2px;
    color: #FFFFFF;
    font-family: 'Bahnschrift', 'Segoe UI', sans-serif;
    font-size: 9.3px;
    font-weight: 700;
    flex-shrink: 0;
  }
  .brief-txt {
    font-size: 10.75px;
    line-height: 1.15;
    color: #020617;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .brief-txt strong { font-weight: 700; color: #020617; }

  /* DATE CHECK + FOOTER */
  .date-check {
    background: #FFFFFF;
    border: 1px solid #BDB39B;
    border-left: 4px solid #B91C1C;
    border-radius: 2px;
    padding: 3.5px 8px;
    font-size: 9.6px;
    line-height: 1.22;
    color: #0F172A;
    font-weight: 600;
  }
  .date-check strong { color: #991B1B; letter-spacing: 0.4px; }
  .foot-line {
    display: flex;
    justify-content: space-between;
    font-size: 9.1px;
    color: #1E293B;
    font-weight: 600;
  }
  svg { display: block; width: 100%; height: 100%; }
</style>
</head>
<body>
<div class="page">

  <!-- MASTHEAD -->
  <header>
    <div class="mast-top">
      <span class="left">THE WORLD IN ONE DAY</span>
      <span class="right">39 VERIFIED STORIES &middot; 7 REGIONS &middot; EVERY ONE FRIDAY 20 NOV 2026</span>
    </div>
    <div class="mast-title-wrap">
      <h1>Friday 20 November 2026</h1>
      <div class="mast-deck">Kyiv &amp; Poland missile strikes &middot; Global AI sell-off &middot; Cyclone Akvan hits Odisha &middot; COP31 runs overtime</div>
    </div>
  </header>

  <!-- DAY IN NUMBERS, REGION COUNTS & UTC RIBBON -->
  <section>
    <div class="stats-row">
      <div class="stat-cell"><div class="stat-val">111+</div><div class="stat-lbl">Ukraine missiles</div></div>
      <div class="stat-cell"><div class="stat-val">372k</div><div class="stat-lbl">Odisha sheltered</div></div>
      <div class="stat-cell"><div class="stat-val">-5.3%</div><div class="stat-lbl">Nasdaq plunge</div></div>
      <div class="stat-cell"><div class="stat-val">100k</div><div class="stat-lbl">UK&ndash;EU visas/yr</div></div>
      <div class="stat-cell"><div class="stat-val">2.3%</div><div class="stat-lbl">Japan Oct CPI</div></div>
      <div class="stat-cell"><div class="stat-val">118</div><div class="stat-lbl">Phillips record</div></div>
    </div>
    <div class="regions-bar">
      <div class="reg-pills">
        <span class="reg-pill" style="background:#1E3A8A;">Europe 12</span>
        <span class="reg-pill" style="background:#B91C1C;">Asia 10</span>
        <span class="reg-pill" style="background:#7C3AED;">Americas 5</span>
        <span class="reg-pill" style="background:#15803D;">Africa 4</span>
        <span class="reg-pill" style="background:#B45309;">Mideast 4</span>
        <span class="reg-pill" style="background:#0F766E;">Oceania 2</span>
        <span class="reg-pill" style="background:#334155;">Global 2</span>
      </div>
      <span class="reg-note">39 ATOMIC STORIES &middot; ALL FRI 20 NOV 2026</span>
    </div>
    <div class="utc-strip">
      <span class="utc-tag">UTC TIMELINE</span>
      <span class="utc-slot"><strong>00:00</strong>Kyiv bridges hit</span>
      <span class="utc-slot"><strong>02:30</strong>Akvan Odisha landfall</span>
      <span class="utc-slot"><strong>05:30</strong>Taiwan -6.2%; Kospi curb</span>
      <span class="utc-slot"><strong>05:50</strong>Poland missiles</span>
      <span class="utc-slot"><strong>11:30</strong>UK&ndash;EU deal</span>
      <span class="utc-slot"><strong>15:00</strong>COP31 overtime</span>
      <span class="utc-slot"><strong>19:10</strong>Nvidia -14%; S&amp;P -3.7%</span>
    </div>
  </section>

  <!-- ROW 1: 3 LEAD ILLUSTRATED STORIES -->
  <section class="row-lead">
    <article class="lead-card" style="--c:#1E3A8A;">
      <div class="lead-art">
        <svg viewBox="0 0 326 92" xmlns="http://www.w3.org/2000/svg">
          <rect width="326" height="92" fill="#0B1324"/>
          <path d="M12,62 L12,38 L26,38 L26,28 L42,28 L42,62 M54,62 L54,34 L72,34 L72,22 L88,22 L88,62 M236,62 L236,36 L254,36 L254,24 L274,24 L274,62 M288,62 L288,42 L310,42 L310,62" fill="#162238"/>
          <rect x="0" y="64" width="326" height="28" fill="#0D2744"/>
          <path d="M22,64 Q60,44 98,64 M124,64 L160,36 L196,64 M222,64 Q262,46 302,64" fill="none" stroke="#94A3B8" stroke-width="2.6"/>
          <rect x="16" y="61" width="292" height="3.5" fill="#CBD5E1"/>
          <path d="M286,4 L162,56 M246,2 L62,58 M318,16 L262,58" stroke="#FB923C" stroke-width="1.8" stroke-dasharray="4,2"/>
          <circle cx="162" cy="56" r="10" fill="#F97316" opacity="0.85"/><circle cx="162" cy="56" r="4.5" fill="#FEF08A"/>
          <circle cx="62" cy="58" r="8" fill="#F97316" opacity="0.85"/><circle cx="62" cy="58" r="3.5" fill="#FEF08A"/>
          <circle cx="262" cy="58" r="8" fill="#F97316" opacity="0.85"/><circle cx="262" cy="58" r="3.5" fill="#FEF08A"/>
          <rect x="7" y="6" width="166" height="22" rx="2" fill="#DC2626"/><text x="90" y="21" text-anchor="middle" fill="#FFF" font-family="Bahnschrift, sans-serif" font-size="13.5" font-weight="700">KYIV: 3 BRIDGES HIT</text>
          <rect x="184" y="6" width="135" height="20" rx="2" fill="rgba(15,23,42,0.9)" stroke="#F59E0B"/><text x="251" y="19.5" text-anchor="middle" fill="#FDE68A" font-family="Bahnschrift, sans-serif" font-size="10.2" font-weight="700">111 MISSILES &middot; 404 DRONES</text>
        </svg>
      </div>
      <div class="lead-body">
        <div class="kicker"><span class="num-dot">1</span> KYIV, UKRAINE &middot; WAR</div>
        <h2>Russian barrage hits 3 Kyiv bridges, killing 9</h2>
        <p>111 missiles &amp; 404 drones cut power and water; 2 embassies damaged. <span class="src">(Kyiv Indep.)</span></p>
      </div>
    </article>

    <article class="lead-card" style="--c:#334155;">
      <div class="lead-art">
        <svg viewBox="0 0 326 92" xmlns="http://www.w3.org/2000/svg">
          <rect width="326" height="92" fill="#0F172A"/>
          <line x1="0" y1="30" x2="326" y2="30" stroke="#1E293B"/>
          <line x1="0" y1="60" x2="326" y2="60" stroke="#1E293B"/>
          <polyline points="14,34 52,38 88,48 124,52 158,68 188,78" fill="none" stroke="#FB7185" stroke-width="3.5"/>
          <polygon points="14,34 52,38 88,48 124,52 158,68 188,78 188,92 14,92" fill="#E11D48" opacity="0.25"/>
          <rect x="7" y="6" width="168" height="22" rx="2" fill="#DC2626"/><text x="91" y="21" text-anchor="middle" fill="#FFF" font-family="Bahnschrift, sans-serif" font-size="13.5" font-weight="700">AI SELL-OFF: -5.3%</text>
          <rect x="196" y="7" width="122" height="78" rx="3" fill="#1E293B" stroke="#64748B"/>
          <text x="204" y="23" fill="#F8FAFC" font-family="Bahnschrift, sans-serif" font-size="10.5" font-weight="700">S&amp;P 500</text><text x="311" y="23" text-anchor="end" fill="#FCA5A5" font-family="Bahnschrift, sans-serif" font-size="10.5" font-weight="700">-3.7%</text>
          <text x="204" y="40" fill="#F8FAFC" font-family="Bahnschrift, sans-serif" font-size="10.5" font-weight="700">NASDAQ</text><text x="311" y="40" text-anchor="end" fill="#FCA5A5" font-family="Bahnschrift, sans-serif" font-size="10.5" font-weight="700">-5.3%</text>
          <text x="204" y="57" fill="#F8FAFC" font-family="Bahnschrift, sans-serif" font-size="10.5" font-weight="700">TAIWAN</text><text x="311" y="57" text-anchor="end" fill="#FCA5A5" font-family="Bahnschrift, sans-serif" font-size="10.5" font-weight="700">-6.2%</text>
          <text x="204" y="74" fill="#F8FAFC" font-family="Bahnschrift, sans-serif" font-size="10.5" font-weight="700">NIKKEI</text><text x="311" y="74" text-anchor="end" fill="#FCA5A5" font-family="Bahnschrift, sans-serif" font-size="10.5" font-weight="700">-5.1%</text>
        </svg>
      </div>
      <div class="lead-body">
        <div class="kicker"><span class="num-dot">2</span> WALL ST &amp; ASIA &middot; MARKETS</div>
        <h2>AI sell-off sinks Wall St &amp; Asian stocks</h2>
        <p>S&amp;P 500 enters correction; Nasdaq erases 2026 gains in brutal rout. <span class="src">(Reuters, AP)</span></p>
      </div>
    </article>

    <article class="lead-card" style="--c:#B91C1C;">
      <div class="lead-art">
        <svg viewBox="0 0 326 92" xmlns="http://www.w3.org/2000/svg">
          <rect width="326" height="92" fill="#0B2E36"/>
          <path d="M0,0 L152,0 L142,24 L118,52 L96,92 L0,92 Z" fill="#1B3B2F" stroke="#34D399" stroke-width="1.4"/>
          <text x="48" y="48" text-anchor="middle" fill="#A7F3D0" font-family="Bahnschrift, sans-serif" font-size="11.5" font-weight="700">ODISHA</text>
          <text x="38" y="76" text-anchor="middle" fill="#A7F3D0" font-family="Bahnschrift, sans-serif" font-size="10.5" font-weight="700">GOPALPUR</text>
          <g transform="translate(144,48)">
            <circle cx="0" cy="0" r="28" fill="#14B8A6" opacity="0.22"/>
            <path d="M0,0 C12,-18 34,-10 26,10 C18,28 -14,28 -22,6 C-28,-12 -10,-30 12,-24" fill="none" stroke="#5EEAD4" stroke-width="2.8" stroke-linecap="round"/>
            <circle cx="0" cy="0" r="4.5" fill="#FEF08A"/>
          </g>
          <path d="M220,70 L160,52" stroke="#F87171" stroke-width="2" stroke-dasharray="3,2"/>
          <rect x="7" y="6" width="152" height="22" rx="2" fill="#DC2626"/><text x="83" y="21" text-anchor="middle" fill="#FFF" font-family="Bahnschrift, sans-serif" font-size="13.5" font-weight="700">CYCLONE AKVAN</text>
          <rect x="184" y="7" width="134" height="38" rx="3" fill="rgba(15,23,42,0.92)" stroke="#2DD4BF"/>
          <text x="251" y="22" text-anchor="middle" fill="#99F6E4" font-family="Bahnschrift, sans-serif" font-size="10.5" font-weight="700">LANDFALL ~8 AM IST</text>
          <text x="251" y="38" text-anchor="middle" fill="#FFF" font-family="Bahnschrift, sans-serif" font-size="12" font-weight="700">372K SHELTERED</text>
        </svg>
      </div>
      <div class="lead-body">
        <div class="kicker"><span class="num-dot">3</span> ODISHA, INDIA &middot; CYCLONE</div>
        <h2>Cyclone Akvan strikes India's east coast</h2>
        <p>Gopalpur landfall brings 209 mm rain; 372,000 sheltered, zero dead. <span class="src">(IMD, PTI)</span></p>
      </div>
    </article>
  </section>

  <!-- ROW 2: 5 FEATURE CARDS (4-8) -->
  <section class="row-feat">
    <article class="feat-card" style="--c:#1E3A8A;">
      <div class="feat-art">
        <svg viewBox="0 0 192 54" xmlns="http://www.w3.org/2000/svg">
          <rect width="192" height="54" fill="#E2E8F0"/>
          <rect x="0" y="0" width="102" height="54" fill="#CBD5E1"/>
          <line x1="102" y1="0" x2="102" y2="54" stroke="#991B1B" stroke-width="2.2" stroke-dasharray="3,2"/>
          <circle cx="52" cy="40" r="8" fill="none" stroke="#DC2626" stroke-width="1.6" stroke-dasharray="2,2"/>
          <circle cx="52" cy="40" r="3.5" fill="#DC2626"/>
          <path d="M168,32 L56,40" stroke="#B91C1C" stroke-width="2.2"/>
          <rect x="8" y="5" width="136" height="19" rx="2" fill="#B91C1C"/><text x="76" y="18.5" text-anchor="middle" fill="#FFF" font-family="Bahnschrift, sans-serif" font-size="12" font-weight="700">POLAND: MISSILES</text>
          <text x="150" y="47" text-anchor="middle" fill="#1E293B" font-family="Bahnschrift, sans-serif" font-size="9" font-weight="700">2 KH-101</text>
        </svg>
      </div>
      <div class="feat-body">
        <div class="kicker"><span class="num-dot">4</span> POLAND &middot; NATO</div>
        <h3>Russian missiles land in SE Poland</h3>
        <p>Two missiles &amp; jet drone hit border fields; Tusk calls talks. <span class="src">(AP)</span></p>
      </div>
    </article>

    <article class="feat-card" style="--c:#B45309;">
      <div class="feat-art">
        <svg viewBox="0 0 192 54" xmlns="http://www.w3.org/2000/svg">
          <rect width="192" height="54" fill="#7C2D12"/>
          <circle cx="32" cy="35" r="14" fill="#0284C7" stroke="#E0F2FE" stroke-width="1.4"/>
          <path d="M24,31 Q32,26 40,32 M26,39 Q32,43 38,38" fill="none" stroke="#A7F3D0" stroke-width="1.6"/>
          <rect x="10" y="5" width="136" height="19" rx="2" fill="#DC2626"/><text x="78" y="18.5" text-anchor="middle" fill="#FFF" font-family="Bahnschrift, sans-serif" font-size="12" font-weight="700">COP31: NO DEAL</text>
          <text x="122" y="42" text-anchor="middle" fill="#FED7AA" font-family="Bahnschrift, sans-serif" font-size="10.5" font-weight="700">OVERTIME &middot; TALKS</text>
        </svg>
      </div>
      <div class="feat-body">
        <div class="kicker"><span class="num-dot">5</span> ANTALYA &middot; CLIMATE</div>
        <h3>COP31 runs overtime with no deal</h3>
        <p>Draft omits fossil phase-out; Africa &amp; Panama slam gap. <span class="src">(Guardian)</span></p>
      </div>
    </article>

    <article class="feat-card" style="--c:#1E3A8A;">
      <div class="feat-art">
        <svg viewBox="0 0 192 54" xmlns="http://www.w3.org/2000/svg">
          <rect width="192" height="54" fill="#0C2442"/>
          <rect x="14" y="27" width="38" height="22" rx="2" fill="#012169" stroke="#FFF"/>
          <line x1="14" y1="27" x2="52" y2="49" stroke="#FFF" stroke-width="3"/><line x1="52" y1="27" x2="14" y2="49" stroke="#FFF" stroke-width="3"/>
          <line x1="33" y1="27" x2="33" y2="49" stroke="#C8102E" stroke-width="3"/><line x1="14" y1="38" x2="52" y2="38" stroke="#C8102E" stroke-width="3"/>
          <path d="M64,38 L128,38" stroke="#FBBF24" stroke-width="2.5" stroke-dasharray="3,2"/>
          <rect x="140" y="27" width="38" height="22" rx="2" fill="#003399" stroke="#FFF"/>
          <circle cx="159" cy="38" r="6.5" fill="none" stroke="#FFCC00" stroke-width="2.2" stroke-dasharray="2,2"/>
          <rect x="10" y="4" width="122" height="19" rx="2" fill="#B91C1C"/><text x="71" y="17.5" text-anchor="middle" fill="#FFF" font-family="Bahnschrift, sans-serif" font-size="12" font-weight="700">UK&ndash;EU RESET DEAL</text>
        </svg>
      </div>
      <div class="feat-body">
        <div class="kicker"><span class="num-dot">6</span> BRUSSELS &middot; DIPLOMACY</div>
        <h3>UK &amp; EU seal post-Brexit reset</h3>
        <p>Food checks eased, CO2 link &amp; 100k youth visas agreed. <span class="src">(Reuters)</span></p>
      </div>
    </article>

    <article class="feat-card" style="--c:#B45309;">
      <div class="feat-art">
        <svg viewBox="0 0 192 54" xmlns="http://www.w3.org/2000/svg">
          <rect width="192" height="54" fill="#1E293B"/>
          <rect x="0" y="38" width="192" height="16" fill="#0369A1"/>
          <path d="M36,38 L146,38 L156,28 L120,28 L116,22 L98,22 L95,28 L34,28 Z" fill="#64748B"/>
          <circle cx="58" cy="28" r="8" fill="#F97316"/><circle cx="58" cy="28" r="4" fill="#FEF08A"/>
          <rect x="10" y="4" width="134" height="19" rx="2" fill="#DC2626"/><text x="77" y="17.5" text-anchor="middle" fill="#FFF" font-family="Bahnschrift, sans-serif" font-size="12" font-weight="700">HORMUZ: TANKER HIT</text>
        </svg>
      </div>
      <div class="feat-body">
        <div class="kicker"><span class="num-dot">7</span> OMAN &middot; MARITIME</div>
        <h3>Tanker ablaze off Oman near Hormuz</h3>
        <p>Projectiles strike vessels off Khasab; 46 ships wait. <span class="src">(UKMTO)</span></p>
      </div>
    </article>

    <article class="feat-card" style="--c:#1E3A8A;">
      <div class="feat-art">
        <svg viewBox="0 0 192 54" xmlns="http://www.w3.org/2000/svg">
          <rect width="192" height="54" fill="#F1F5F9"/>
          <rect x="10" y="4" width="128" height="19" rx="2" fill="#B91C1C"/>
          <text x="74" y="17.5" text-anchor="middle" fill="#FFF" font-family="Bahnschrift, sans-serif" font-size="12" font-weight="700">ITALY: GEN STRIKE</text>
          <g fill="#334155">
            <circle cx="28" cy="36" r="4"/><rect x="23" y="41" width="10" height="11" rx="2"/>
            <circle cx="54" cy="36" r="4"/><rect x="49" y="41" width="10" height="11" rx="2"/>
            <circle cx="80" cy="36" r="4"/><rect x="75" y="41" width="10" height="11" rx="2"/>
            <circle cx="106" cy="36" r="4"/><rect x="101" y="41" width="10" height="11" rx="2"/>
            <circle cx="132" cy="36" r="4"/><rect x="127" y="41" width="10" height="11" rx="2"/>
            <circle cx="158" cy="36" r="4"/><rect x="153" y="41" width="10" height="11" rx="2"/>
          </g>
        </svg>
      </div>
      <div class="feat-body">
        <div class="kicker"><span class="num-dot">8</span> ITALY &middot; LABOUR</div>
        <h3>General strike hits 100+ Italian cities</h3>
        <p>CGIL union &amp; students rally against Meloni budget. <span class="src">(AFP)</span></p>
      </div>
    </article>
  </section>

  <!-- ROW 3: 5 FEATURE CARDS (9-13) -->
  <section class="row-feat">
    <article class="feat-card" style="--c:#B91C1C;">
      <div class="feat-art">
        <svg viewBox="0 0 192 54" xmlns="http://www.w3.org/2000/svg">
          <rect width="192" height="54" fill="#F8FAFC"/>
          <rect x="10" y="4" width="118" height="19" rx="2" fill="#B91C1C"/><text x="69" y="17.5" text-anchor="middle" fill="#FFF" font-family="Bahnschrift, sans-serif" font-size="12" font-weight="700">JAPAN: +2.3% CPI</text>
          <circle cx="34" cy="39" r="10" fill="#BC002D"/>
          <rect x="76" y="39" width="14" height="11" fill="#94A3B8"/>
          <rect x="96" y="34" width="14" height="16" fill="#64748B"/>
          <rect x="116" y="29" width="14" height="21" fill="#B91C1C"/>
          <rect x="136" y="24" width="14" height="26" fill="#991B1B"/>
          <text x="169" y="43" text-anchor="middle" fill="#991B1B" font-family="Bahnschrift, sans-serif" font-size="12" font-weight="700">+2.3%</text>
        </svg>
      </div>
      <div class="feat-body">
        <div class="kicker"><span class="num-dot">9</span> TOKYO &middot; ECONOMY</div>
        <h3>Japan inflation ticks up to 2.3%</h3>
        <p>Core CPI at 2.2% keeps Dec BoJ rate-hike bet alive. <span class="src">(Reuters)</span></p>
      </div>
    </article>

    <article class="feat-card" style="--c:#7C3AED;">
      <div class="feat-art">
        <svg viewBox="0 0 192 54" xmlns="http://www.w3.org/2000/svg">
          <rect width="192" height="54" fill="#0F172A"/>
          <rect x="10" y="4" width="112" height="19" rx="2" fill="#DC2626"/><text x="66" y="17.5" text-anchor="middle" fill="#FFF" font-family="Bahnschrift, sans-serif" font-size="12" font-weight="700">NVIDIA: -14% SEC</text>
          <rect x="18" y="28" width="22" height="20" rx="2" fill="#16A34A" stroke="#86EFAC" stroke-width="1.3"/>
          <polyline points="58,31 94,37 132,47" fill="none" stroke="#EF4444" stroke-width="3.2"/>
          <text x="162" y="44" text-anchor="middle" fill="#FCA5A5" font-family="Bahnschrift, sans-serif" font-size="14.5" font-weight="700">-14%</text>
        </svg>
      </div>
      <div class="feat-body">
        <div class="kicker"><span class="num-dot">10</span> US &middot; TECH</div>
        <h3>Nvidia tumbles 14% on SEC probe</h3>
        <p>Accounting review hits chip leader; Anthropic -8.6%. <span class="src">(Reuters)</span></p>
      </div>
    </article>

    <article class="feat-card" style="--c:#15803D;">
      <div class="feat-art">
        <svg viewBox="0 0 192 54" xmlns="http://www.w3.org/2000/svg">
          <rect width="192" height="54" fill="#FDE68A"/>
          <rect x="0" y="42" width="192" height="12" fill="#92400E"/>
          <polygon points="142,42 151,14 159,14 168,42" fill="none" stroke="#0F172A" stroke-width="2.2"/>
          <line x1="146" y1="29" x2="164" y2="29" stroke="#0F172A" stroke-width="1.8"/>
          <rect x="10" y="4" width="114" height="19" rx="2" fill="#15803D"/>
          <text x="67" y="17.5" text-anchor="middle" fill="#FFF" font-family="Bahnschrift, sans-serif" font-size="12" font-weight="700">KENYA: 1ST OIL</text>
        </svg>
      </div>
      <div class="feat-body">
        <div class="kicker"><span class="num-dot">11</span> KENYA &middot; ENERGY</div>
        <h3>Kenya begins drilling first oil well</h3>
        <p>Amosing field starts production run; crude due Dec 1. <span class="src">(The Star)</span></p>
      </div>
    </article>

    <article class="feat-card" style="--c:#7C3AED;">
      <div class="feat-art">
        <svg viewBox="0 0 192 54" xmlns="http://www.w3.org/2000/svg">
          <rect width="192" height="54" fill="#1E1B4B"/>
          <polygon points="0,54 38,30 72,42 112,26 156,42 192,32 192,54" fill="#312E81"/>
          <circle cx="144" cy="36" r="14" fill="none" stroke="#F87171" stroke-width="1.4" stroke-dasharray="3,2"/>
          <circle cx="144" cy="36" r="7" fill="none" stroke="#FCA5A5" stroke-width="1.5"/>
          <circle cx="144" cy="36" r="3" fill="#EF4444"/>
          <rect x="10" y="4" width="122" height="19" rx="2" fill="#DC2626"/><text x="71" y="17.5" text-anchor="middle" fill="#FFF" font-family="Bahnschrift, sans-serif" font-size="12" font-weight="700">PERU: M6.8 QUAKE</text>
        </svg>
      </div>
      <div class="feat-body">
        <div class="kicker"><span class="num-dot">12</span> PERU &middot; DISASTER</div>
        <h3>Strong M6.8 quake shakes Peru</h3>
        <p>Evening Andes tremor north of Junín jolts Lima streets. <span class="src">(IGP)</span></p>
      </div>
    </article>

    <article class="feat-card" style="--c:#0F766E;">
      <div class="feat-art">
        <svg viewBox="0 0 192 54" xmlns="http://www.w3.org/2000/svg">
          <rect width="192" height="54" fill="#166534"/>
          <rect x="148" y="10" width="18" height="44" fill="#D9F99D" opacity="0.35"/>
          <line x1="152" y1="28" x2="152" y2="44" stroke="#FDE047" stroke-width="2"/><line x1="157" y1="28" x2="157" y2="44" stroke="#FDE047" stroke-width="2"/><line x1="162" y1="28" x2="162" y2="44" stroke="#FDE047" stroke-width="2"/>
          <circle cx="130" cy="36" r="5" fill="#DC2626" stroke="#FFF" stroke-width="1"/>
          <rect x="10" y="4" width="114" height="19" rx="2" fill="#B91C1C"/>
          <text x="67" y="17.5" text-anchor="middle" fill="#FFF" font-family="Bahnschrift, sans-serif" font-size="12" font-weight="700">PHILLIPS: 118</text>
          <text x="58" y="41" text-anchor="middle" fill="#DCFCE7" font-family="Bahnschrift, sans-serif" font-size="10" font-weight="700">3-FORMAT RECORD</text>
        </svg>
      </div>
      <div class="feat-body">
        <div class="kicker"><span class="num-dot">13</span> WELLINGTON &middot; CRICKET</div>
        <h3>Phillips hits historic 118 vs India</h3>
        <p>First NZ batter with 2026 tons in all 3 formats. <span class="src">(ICC, AP)</span></p>
      </div>
    </article>
  </section>

  <!-- BOTTOM: LARGE WORLD MAP (LEFT) & 26 SINGLE-LINE BRIEFS (RIGHT) -->
  <section class="bottom-sec">

    <div class="left-col">
      <div class="sec-hdr"><span>WHERE IT HAPPENED</span><span class="sub">PINS 1&ndash;13</span></div>
      <div class="map-wrap">
        <svg viewBox="0 0 282 220" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
          <rect width="282" height="220" fill="#CEE1F0"/>
          <!-- Clean crisp continents -->
          <g fill="#BD9E74" stroke="#7A6242" stroke-width="0.7">
            <!-- N America -->
            <path d="M12,34 L70,26 L90,48 L74,84 L58,104 L46,98 L28,70 Z"/>
            <!-- S America -->
            <path d="M62,110 L88,118 L98,150 L80,196 L66,196 L60,152 Z"/>
            <!-- Europe -->
            <path d="M122,26 L168,24 L170,62 L130,72 L116,54 Z"/>
            <!-- Africa -->
            <path d="M124,78 L162,78 L174,106 L162,164 L142,178 L132,132 L118,106 Z"/>
            <!-- Asia -->
            <path d="M170,24 L252,32 L262,74 L228,112 L194,116 L172,76 Z"/>
            <!-- Australia / NZ -->
            <path d="M222,140 L252,140 L254,170 L224,170 Z"/>
            <path d="M262,170 L272,164 L268,186 Z"/>
          </g>
          <!-- Pins 1-13 with zero overlaps -->
          <g font-family="Bahnschrift, sans-serif" font-size="9.5" font-weight="700" text-anchor="middle" fill="#FFF">
            <!-- 10 US -->
            <circle cx="44" cy="68" r="8" fill="#7C3AED"/><text x="44" y="71.5">10</text>
            <!-- 2 Wall St / Global -->
            <circle cx="70" cy="60" r="8" fill="#334155"/><text x="70" y="63.5">2</text>
            <!-- 12 Peru -->
            <circle cx="68" cy="134" r="8" fill="#7C3AED"/><text x="68" y="137.5">12</text>
            <!-- 6 Brussels -->
            <circle cx="126" cy="40" r="8" fill="#1E3A8A"/><text x="126" y="43.5">6</text>
            <!-- 8 Italy -->
            <circle cx="136" cy="64" r="8" fill="#1E3A8A"/><text x="136" y="67.5">8</text>
            <!-- 4 Poland -->
            <circle cx="146" cy="24" r="8" fill="#1E3A8A"/><text x="146" y="27.5">4</text>
            <!-- 1 Kyiv -->
            <circle cx="166" cy="42" r="8" fill="#1E3A8A"/><text x="166" y="45.5">1</text>
            <!-- 5 COP31 -->
            <circle cx="158" cy="68" r="8" fill="#B45309"/><text x="158" y="71.5">5</text>
            <!-- 7 Hormuz -->
            <circle cx="180" cy="88" r="8" fill="#B45309"/><text x="180" y="91.5">7</text>
            <!-- 11 Kenya -->
            <circle cx="162" cy="126" r="8" fill="#15803D"/><text x="162" y="129.5">11</text>
            <!-- 3 India -->
            <circle cx="204" cy="96" r="8" fill="#B91C1C"/><text x="204" y="99.5">3</text>
            <!-- 9 Tokyo -->
            <circle cx="248" cy="64" r="8" fill="#B91C1C"/><text x="248" y="67.5">9</text>
            <!-- 13 NZ -->
            <circle cx="266" cy="176" r="8" fill="#0F766E"/><text x="266" y="179.5">13</text>
          </g>
        </svg>
      </div>
      <div class="map-cap">Pins 1&ndash;13 link directly to numbered cards above.</div>
    </div>

    <div class="wire-wrap">
      <div class="sec-hdr">
        <span>ALSO ON FRIDAY 20 NOVEMBER &mdash; 26 MORE STORIES (14&ndash;39)</span>
        <span class="sub">WORLD WIRE &middot; ALL 7 REGIONS</span>
      </div>
      <div class="wire-cols">
        <div class="wire-col">${col1}</div>
        <div class="wire-col">${col2}</div>
      </div>
    </div>

  </section>

  <!-- DATE CHECK + FOOTER -->
  <div class="date-check">
    <strong>DATE CHECK</strong> Excluded as Thu 19 Nov: ICJ Myanmar ruling, Anthropic IPO debut, US Senate 51&ndash;48 Iran vote, Denmark&ndash;Greenland pact, Haiti Martissant raid. Excluded as Sat 21 Nov+: final COP31 text.
  </div>
  <footer class="foot-line">
    <span>Every story happened or was first reported on Friday 20 Nov 2026 (any timezone) &middot; Claims attributed.</span>
    <span>Sources named beside each item &middot; Original vector graphics</span>
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
