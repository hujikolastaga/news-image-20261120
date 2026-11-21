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
  { id: 14, color: '#1E3A8A', city: 'Lviv', text: 'Overnight rail station strike kills 2', src: 'BBC' },
  { id: 15, color: '#1E3A8A', city: 'Kharkiv', text: 'Drone strike hits city hospital, injuring 4', src: 'Ukrinform' },
  { id: 16, color: '#1E3A8A', city: 'Smolensk', text: 'Ukraine drones hit Dorogobuzh chemical plant', src: 'ISW' },
  { id: 17, color: '#1E3A8A', city: 'Estonia', text: 'Shutting all Russia road borders Dec 1', src: 'Reuters' },
  { id: 18, color: '#1E3A8A', city: 'Germany', text: 'Youth stage anti-conscription walkouts', src: 'Guardian' },
  { id: 19, color: '#1E3A8A', city: 'Barcelona', text: 'Daraxonrasib hits 60.7% cancer response', src: 'ENA' },
  { id: 20, color: '#1E3A8A', city: 'Turin', text: 'ATP pay tops $350m; Alcaraz reaches semis', src: 'ATP' },
  { id: 21, color: '#7C3AED', city: 'Washington', text: 'Judge blocks Trump 250-ft Arlington arch', src: 'PBS' },
  { id: 22, color: '#7C3AED', city: 'Florida', text: 'Historic coastal downpours flood homes', src: 'CBS' },

  { id: 23, color: '#334155', city: 'Markets', text: 'Bitcoin <$60k; gold drops 2.6% to $3,526', src: 'Reuters' },
  { id: 24, color: '#B91C1C', city: 'Tokyo', text: 'SoftBank sinks 14.5%; Kospi trips curb', src: 'CNBC' },
  { id: 25, color: '#B91C1C', city: 'Beijing', text: 'PBOC holds loan prime rates 18th month', src: 'Xinhua' },
  { id: 26, color: '#B91C1C', city: 'Seoul', text: 'Ruling DPK moves to impeach top judge', src: 'Dong-A' },
  { id: 27, color: '#B91C1C', city: 'Taipei', text: 'F-16s scramble vs Russian Tu-95 bombers', src: 'CNA' },
  { id: 28, color: '#B91C1C', city: 'Shenzhen', text: 'Xi hails full turnaround in Australia ties', src: 'AA' },
  { id: 29, color: '#B91C1C', city: 'New Delhi', text: 'Pakistani minister visits India for SCO', src: 'PTI' },
  { id: 30, color: '#B91C1C', city: 'Naypyidaw', text: 'Myanmar junta rejects World Court verdict', src: 'CNN' },
  { id: 31, color: '#B91C1C', city: 'Dhaka', text: '124 arrested amid fresh arson attacks', src: 'Star' },

  { id: 32, color: '#B45309', city: 'Iraq', text: 'Federal army enters Jurf al-Sakhar base', src: 'Reuters' },
  { id: 33, color: '#B45309', city: 'Yemen', text: 'Coalition warns civilians to leave Hodeida', src: 'Al Arabiya' },
  { id: 34, color: '#15803D', city: 'S. Africa', text: 'Q3 police toll logs 581 women killed', src: 'SABC' },
  { id: 35, color: '#15803D', city: 'Malawi', text: 'Forex crunch triggers long fuel queues', src: 'Al Jazeera' },
  { id: 36, color: '#15803D', city: 'Uganda', text: 'Ebola alert bans rallies in 34 districts', src: 'Nile Post' },
  { id: 37, color: '#7C3AED', city: 'Brazil', text: 'CB sells $1B; Lula signs Kapot Nhinore', src: 'AP' },
  { id: 38, color: '#7C3AED', city: 'El Salvador', text: 'Bukele registers 3rd-term presidential bid', src: 'AP' },
  { id: 39, color: '#7C3AED', city: 'Argentina', text: 'Country risk spikes 15% to 1,070 bps', src: 'JPM' },
  { id: 40, color: '#0F766E', city: 'Tonga', text: 'Declares 27-day drought state emergency', src: 'PMN' },
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
  const col1 = buildBriefColumn(WORLD_BRIEFS.slice(0, 9));
  const col2 = buildBriefColumn(WORLD_BRIEFS.slice(9, 18));
  const col3 = buildBriefColumn(WORLD_BRIEFS.slice(18, 27));

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
    padding: 7px 14px 5px 14px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  /* MASTHEAD */
  .mast-top {
    display: flex;
    justify-content: space-between;
    font-family: 'Bahnschrift', 'Segoe UI', sans-serif;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.9px;
    text-transform: uppercase;
  }
  .mast-top .left { color: #991B1B; }
  .mast-top .right { color: #0F172A; }
  .mast-title-wrap {
    border-top: 2.5px solid #020617;
    border-bottom: 1.5px solid #020617;
    padding: 1.5px 0 2.5px 0;
    text-align: center;
  }
  .mast-title-wrap h1 {
    font-family: 'Georgia', serif;
    font-size: 42px;
    font-weight: 700;
    line-height: 1.01;
    letter-spacing: -0.5px;
    color: #020617;
  }
  .mast-deck {
    font-family: 'Segoe UI', system-ui, sans-serif;
    font-weight: 600;
    font-size: 11.4px;
    color: #0F172A;
    margin-top: 1px;
  }

  /* NUMBERS & REGIONS STRIP */
  .stats-row {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    border-bottom: 1.5px solid #020617;
    padding-bottom: 2.5px;
  }
  .stat-cell {
    padding: 0 7px;
    border-right: 1px solid #CBD5E1;
  }
  .stat-cell:first-child { padding-left: 0; }
  .stat-cell:last-child { border-right: none; padding-right: 0; }
  .stat-val {
    font-family: 'Georgia', serif;
    font-size: 16.5px;
    font-weight: 700;
    color: #020617;
    line-height: 1.06;
  }
  .stat-lbl {
    font-size: 9.4px;
    line-height: 1.15;
    color: #020617;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.2px;
  }

  .regions-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #EAE2D2;
    border-radius: 3px;
    padding: 2.5px 8px;
    margin-bottom: 1px;
  }
  .reg-pills {
    display: flex;
    gap: 6px;
    align-items: center;
  }
  .reg-pill {
    color: #FFFFFF;
    font-family: 'Bahnschrift', 'Segoe UI', sans-serif;
    font-size: 9.8px;
    font-weight: 700;
    padding: 1.5px 7px;
    border-radius: 2px;
    letter-spacing: 0.4px;
    text-transform: uppercase;
  }
  .reg-note {
    font-family: 'Bahnschrift', 'Segoe UI', sans-serif;
    font-size: 9.8px;
    font-weight: 700;
    color: #0F172A;
    letter-spacing: 0.5px;
  }

  /* ROW 1: LEAD CARDS */
  .row-lead {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    height: 186px;
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
    height: 88px;
    width: 100%;
    position: relative;
    overflow: hidden;
    flex-shrink: 0;
  }
  .lead-body {
    padding: 4.5px 8px;
    display: flex;
    flex-direction: column;
    gap: 2.5px;
    flex: 1;
  }
  .kicker {
    display: flex;
    align-items: center;
    gap: 5px;
    font-family: 'Bahnschrift', 'Segoe UI', sans-serif;
    font-size: 9.6px;
    font-weight: 700;
    letter-spacing: 0.4px;
    text-transform: uppercase;
    color: var(--c, #1E3A8A);
  }
  .num-dot {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 15px;
    height: 15px;
    border-radius: 50%;
    background: var(--c, #1E3A8A);
    color: #FFFFFF;
    font-size: 9.4px;
    font-weight: 700;
    flex-shrink: 0;
  }
  .lead-body h2 {
    font-family: 'Georgia', serif;
    font-size: 16px;
    font-weight: 700;
    line-height: 1.1;
    color: #020617;
  }
  .lead-body p {
    font-size: 10.6px;
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
    height: 128px;
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
    height: 46px;
    width: 100%;
    position: relative;
    overflow: hidden;
    flex-shrink: 0;
  }
  .feat-body {
    padding: 3.5px 6.5px;
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
  }
  .feat-body .kicker { font-size: 9px; gap: 4px; }
  .feat-body .num-dot { width: 14px; height: 14px; font-size: 8.8px; }
  .feat-body h3 {
    font-family: 'Bahnschrift', 'Segoe UI', sans-serif;
    font-size: 13.4px;
    font-weight: 700;
    line-height: 1.07;
    color: #020617;
    letter-spacing: -0.1px;
  }
  .feat-body p {
    font-size: 10.1px;
    line-height: 1.16;
    color: #0F172A;
    font-weight: 500;
  }

  /* BOTTOM SECTION: MAP + TIMELINE & 3-COL WIRE */
  .bottom-sec {
    display: grid;
    grid-template-columns: 222px 1fr;
    gap: 10px;
    height: 372px;
    border-top: 2px solid #020617;
    padding-top: 4px;
  }
  .left-col {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }
  .sec-hdr {
    font-family: 'Bahnschrift', 'Segoe UI', sans-serif;
    font-size: 10.6px;
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
  .sec-hdr span.sub { font-size: 9.4px; color: #334155; font-weight: 700; }
  .map-wrap {
    height: 118px;
    background: #CFE2F1;
    border: 1px solid #94A3B8;
    border-radius: 3px;
    overflow: hidden;
  }
  .map-cap {
    font-size: 9.2px;
    color: #1E293B;
    font-weight: 600;
    margin-top: -2px;
  }

  /* UTC TIMELINE */
  .utc-box {
    background: #FFFFFF;
    border: 1px solid #BDB39B;
    border-radius: 3px;
    padding: 5px 7px;
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  .utc-title {
    font-family: 'Bahnschrift', 'Segoe UI', sans-serif;
    font-size: 10.2px;
    font-weight: 700;
    color: #991B1B;
    letter-spacing: 0.5px;
    border-bottom: 1.5px solid #E2D9C8;
    padding-bottom: 2px;
  }
  .utc-row {
    display: flex;
    gap: 5px;
    align-items: baseline;
    font-size: 10.1px;
    line-height: 1.18;
    color: #020617;
    font-weight: 600;
  }
  .utc-t {
    font-family: 'Bahnschrift', 'Segoe UI', sans-serif;
    font-weight: 700;
    color: #020617;
    background: #E2D8C4;
    padding: 0.5px 4px;
    border-radius: 2px;
    font-size: 9.4px;
    flex-shrink: 0;
  }

  /* RIGHT: 3-COL WIRE (27 ITEMS) */
  .wire-wrap {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .wire-cols {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 9px;
    flex: 1;
  }
  .wire-col {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    border-right: 1px solid #D5CCB8;
    padding-right: 8px;
  }
  .wire-col:last-child { border-right: none; padding-right: 0; }
  .brief-item {
    display: flex;
    align-items: flex-start;
    gap: 5px;
    border-bottom: 1px solid #E2D9C8;
    padding-bottom: 2.5px;
  }
  .brief-item:last-child { border-bottom: none; padding-bottom: 0; }
  .brief-num {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 16px;
    border-radius: 2px;
    color: #FFFFFF;
    font-family: 'Bahnschrift', 'Segoe UI', sans-serif;
    font-size: 9.8px;
    font-weight: 700;
    flex-shrink: 0;
    margin-top: 1px;
  }
  .brief-txt {
    font-size: 10.9px;
    line-height: 1.18;
    color: #020617;
    font-weight: 600;
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
      <span class="right">40 VERIFIED STORIES &middot; 7 REGIONS &middot; EVERY ONE FRIDAY 20 NOV 2026</span>
    </div>
    <div class="mast-title-wrap">
      <h1>Friday 20 November 2026</h1>
      <div class="mast-deck">Kyiv &amp; Poland missile strikes &middot; Global AI sell-off &middot; Cyclone Akvan hits Odisha &middot; COP31 runs overtime</div>
    </div>
  </header>

  <!-- DAY IN NUMBERS & REGION COUNTS -->
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
        <span class="reg-pill" style="background:#1E3A8A;">Europe 11</span>
        <span class="reg-pill" style="background:#B91C1C;">Asia 10</span>
        <span class="reg-pill" style="background:#7C3AED;">Americas 7</span>
        <span class="reg-pill" style="background:#15803D;">Africa 4</span>
        <span class="reg-pill" style="background:#B45309;">Mideast 4</span>
        <span class="reg-pill" style="background:#0F766E;">Oceania 2</span>
        <span class="reg-pill" style="background:#334155;">Global 2</span>
      </div>
      <span class="reg-note">40 ATOMIC STORIES &middot; ALL FRI 20 NOV 2026</span>
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
          <rect x="7" y="6" width="144" height="17" rx="2" fill="#B91C1C"/><text x="79" y="18" text-anchor="middle" fill="#FFF" font-family="Bahnschrift, sans-serif" font-size="10.5" font-weight="700">KYIV: 3 BRIDGES HIT</text>
          <rect x="184" y="6" width="135" height="17" rx="2" fill="rgba(15,23,42,0.85)" stroke="#F59E0B"/><text x="251" y="18" text-anchor="middle" fill="#FDE68A" font-family="Bahnschrift, sans-serif" font-size="9.5" font-weight="700">111 MISSILES &middot; 404 DRONES</text>
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
          <rect x="7" y="6" width="154" height="19" rx="2" fill="#DC2626"/><text x="84" y="19" text-anchor="middle" fill="#FFF" font-family="Bahnschrift, sans-serif" font-size="11.5" font-weight="700">GLOBAL AI ROUT -5.3%</text>
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
          <rect x="7" y="6" width="128" height="19" rx="2" fill="#0F766E"/><text x="71" y="19" text-anchor="middle" fill="#FFF" font-family="Bahnschrift, sans-serif" font-size="11.5" font-weight="700">CYCLONE AKVAN</text>
          <rect x="188" y="7" width="130" height="35" rx="3" fill="rgba(15,23,42,0.9)" stroke="#2DD4BF"/>
          <text x="253" y="21" text-anchor="middle" fill="#99F6E4" font-family="Bahnschrift, sans-serif" font-size="10" font-weight="700">LANDFALL ~8 AM IST</text>
          <text x="253" y="36" text-anchor="middle" fill="#FFF" font-family="Bahnschrift, sans-serif" font-size="11" font-weight="700">372,000 SHELTERED</text>
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
        <svg viewBox="0 0 192 50" xmlns="http://www.w3.org/2000/svg">
          <rect width="192" height="50" fill="#E2E8F0"/>
          <rect x="0" y="0" width="102" height="50" fill="#CBD5E1"/>
          <line x1="102" y1="0" x2="102" y2="50" stroke="#991B1B" stroke-width="2" stroke-dasharray="3,2"/>
          <text x="28" y="16" fill="#1E293B" font-family="Bahnschrift, sans-serif" font-size="9.5" font-weight="700">POLAND</text>
          <text x="148" y="16" fill="#475569" font-family="Bahnschrift, sans-serif" font-size="9.5" font-weight="700">UKRAINE</text>
          <circle cx="72" cy="34" r="9" fill="none" stroke="#DC2626" stroke-width="1.5" stroke-dasharray="2,2"/>
          <circle cx="72" cy="34" r="3" fill="#DC2626"/>
          <path d="M168,26 L75,34" stroke="#B91C1C" stroke-width="2"/>
          <rect x="82" y="31" width="104" height="15" rx="2" fill="rgba(153,27,27,0.95)"/>
          <text x="134" y="41.5" text-anchor="middle" fill="#FFF" font-family="Bahnschrift, sans-serif" font-size="9" font-weight="700">2 KH-101 + DRONE</text>
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
        <svg viewBox="0 0 192 50" xmlns="http://www.w3.org/2000/svg">
          <rect width="192" height="50" fill="#7C2D12"/>
          <circle cx="44" cy="25" r="16" fill="#0284C7" stroke="#E0F2FE" stroke-width="1.3"/>
          <path d="M34,20 Q44,14 54,22 M36,30 Q44,35 52,29" fill="none" stroke="#A7F3D0" stroke-width="1.5"/>
          <rect x="74" y="11" width="108" height="28" rx="3" fill="#0F172A" stroke="#FDBA74"/>
          <text x="128" y="23" text-anchor="middle" fill="#FEF08A" font-family="Bahnschrift, sans-serif" font-size="9.5" font-weight="700">COP31: NO DEAL</text>
          <text x="128" y="34" text-anchor="middle" fill="#FED7AA" font-family="Bahnschrift, sans-serif" font-size="8">OVERTIME &middot; US ABSENT</text>
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
        <svg viewBox="0 0 192 50" xmlns="http://www.w3.org/2000/svg">
          <rect width="192" height="50" fill="#0C2442"/>
          <rect x="16" y="11" width="42" height="28" rx="2" fill="#012169" stroke="#FFF"/>
          <line x1="16" y1="11" x2="58" y2="39" stroke="#FFF" stroke-width="3.5"/><line x1="58" y1="11" x2="16" y2="39" stroke="#FFF" stroke-width="3.5"/>
          <line x1="16" y1="11" x2="58" y2="39" stroke="#C8102E" stroke-width="1.5"/><line x1="58" y1="11" x2="16" y2="39" stroke="#C8102E" stroke-width="1.5"/>
          <line x1="37" y1="11" x2="37" y2="39" stroke="#FFF" stroke-width="6"/><line x1="16" y1="25" x2="58" y2="25" stroke="#FFF" stroke-width="6"/>
          <line x1="37" y1="11" x2="37" y2="39" stroke="#C8102E" stroke-width="3.2"/><line x1="16" y1="25" x2="58" y2="25" stroke="#C8102E" stroke-width="3.2"/>
          <path d="M68,25 L124,25" stroke="#FBBF24" stroke-width="2.5" stroke-dasharray="3,2"/>
          <rect x="134" y="11" width="42" height="28" rx="2" fill="#003399" stroke="#FFF"/>
          <circle cx="155" cy="25" r="8" fill="none" stroke="#FFCC00" stroke-width="2.5" stroke-dasharray="2,2.5"/>
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
        <svg viewBox="0 0 192 50" xmlns="http://www.w3.org/2000/svg">
          <rect width="192" height="50" fill="#1E293B"/>
          <rect x="0" y="34" width="192" height="16" fill="#0369A1"/>
          <path d="M44,34 L138,34 L148,24 L118,24 L114,16 L98,16 L96,24 L40,24 Z" fill="#475569"/>
          <circle cx="62" cy="20" r="9" fill="#F97316"/><circle cx="62" cy="20" r="4.5" fill="#FEF08A"/>
          <rect x="114" y="5" width="72" height="16" rx="2" fill="#B91C1C"/><text x="150" y="16" text-anchor="middle" fill="#FFF" font-family="Bahnschrift, sans-serif" font-size="9.5" font-weight="700">HORMUZ HIT</text>
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
        <svg viewBox="0 0 192 50" xmlns="http://www.w3.org/2000/svg">
          <rect width="192" height="50" fill="#F1F5F9"/>
          <rect x="34" y="6" width="124" height="18" rx="2" fill="#991B1B"/>
          <text x="96" y="18" text-anchor="middle" fill="#FFF" font-family="Bahnschrift, sans-serif" font-size="10.5" font-weight="700">SCIOPERO GENERALE</text>
          <g fill="#334155">
            <circle cx="28" cy="34" r="4"/><rect x="23" y="39" width="10" height="11" rx="2"/>
            <circle cx="54" cy="34" r="4"/><rect x="49" y="39" width="10" height="11" rx="2"/>
            <circle cx="80" cy="34" r="4"/><rect x="75" y="39" width="10" height="11" rx="2"/>
            <circle cx="106" cy="34" r="4"/><rect x="101" y="39" width="10" height="11" rx="2"/>
            <circle cx="132" cy="34" r="4"/><rect x="127" y="39" width="10" height="11" rx="2"/>
            <circle cx="158" cy="34" r="4"/><rect x="153" y="39" width="10" height="11" rx="2"/>
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
        <svg viewBox="0 0 192 50" xmlns="http://www.w3.org/2000/svg">
          <rect width="192" height="50" fill="#FFF"/>
          <circle cx="38" cy="25" r="14" fill="#BC002D"/>
          <rect x="76" y="30" width="14" height="14" fill="#94A3B8"/>
          <rect x="96" y="24" width="14" height="20" fill="#64748B"/>
          <rect x="116" y="18" width="14" height="26" fill="#B91C1C"/>
          <rect x="136" y="12" width="14" height="32" fill="#991B1B"/>
          <text x="168" y="24" text-anchor="middle" fill="#991B1B" font-family="Bahnschrift, sans-serif" font-size="11" font-weight="700">+2.3%</text>
          <text x="168" y="36" text-anchor="middle" fill="#475569" font-family="Bahnschrift, sans-serif" font-size="8.5" font-weight="700">OCT CPI</text>
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
        <svg viewBox="0 0 192 50" xmlns="http://www.w3.org/2000/svg">
          <rect width="192" height="50" fill="#0F172A"/>
          <rect x="18" y="12" width="26" height="26" rx="3" fill="#16A34A" stroke="#86EFAC" stroke-width="1.5"/>
          <line x1="12" y1="20" x2="18" y2="20" stroke="#86EFAC" stroke-width="2"/><line x1="12" y1="30" x2="18" y2="30" stroke="#86EFAC" stroke-width="2"/>
          <line x1="44" y1="20" x2="50" y2="20" stroke="#86EFAC" stroke-width="2"/><line x1="44" y1="30" x2="50" y2="30" stroke="#86EFAC" stroke-width="2"/>
          <polyline points="62,15 96,24 128,36" fill="none" stroke="#EF4444" stroke-width="3"/>
          <text x="158" y="24" text-anchor="middle" fill="#FCA5A5" font-family="Bahnschrift, sans-serif" font-size="13" font-weight="700">-14%</text>
          <text x="158" y="36" text-anchor="middle" fill="#CBD5E1" font-family="Bahnschrift, sans-serif" font-size="8" font-weight="700">SEC REVIEW</text>
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
        <svg viewBox="0 0 192 50" xmlns="http://www.w3.org/2000/svg">
          <rect width="192" height="50" fill="#FDE68A"/>
          <rect x="0" y="38" width="192" height="12" fill="#92400E"/>
          <polygon points="36,38 46,10 54,10 64,38" fill="none" stroke="#0F172A" stroke-width="2.2"/>
          <line x1="41" y1="25" x2="59" y2="25" stroke="#0F172A" stroke-width="1.8"/>
          <rect x="86" y="10" width="90" height="22" rx="2" fill="#15803D"/>
          <text x="131" y="24" text-anchor="middle" fill="#FFF" font-family="Bahnschrift, sans-serif" font-size="9.5" font-weight="700">TURKANA OIL WELL</text>
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
        <svg viewBox="0 0 192 50" xmlns="http://www.w3.org/2000/svg">
          <rect width="192" height="50" fill="#1E1B4B"/>
          <polygon points="0,50 38,24 72,38 112,20 156,40 192,28 192,50" fill="#312E81"/>
          <circle cx="96" cy="24" r="17" fill="none" stroke="#F87171" stroke-width="1.3" stroke-dasharray="3,2"/>
          <circle cx="96" cy="24" r="9" fill="none" stroke="#FCA5A5" stroke-width="1.5"/>
          <circle cx="96" cy="24" r="3.5" fill="#EF4444"/>
          <rect x="130" y="7" width="54" height="16" rx="2" fill="#DC2626"/><text x="157" y="18" text-anchor="middle" fill="#FFF" font-family="Bahnschrift, sans-serif" font-size="9.5" font-weight="700">M6.8 QUAKE</text>
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
        <svg viewBox="0 0 192 50" xmlns="http://www.w3.org/2000/svg">
          <rect width="192" height="50" fill="#166534"/>
          <rect x="60" y="8" width="16" height="42" fill="#D9F99D" opacity="0.35"/>
          <line x1="64" y1="20" x2="64" y2="38" stroke="#FDE047" stroke-width="2"/><line x1="68" y1="20" x2="68" y2="38" stroke="#FDE047" stroke-width="2"/><line x1="72" y1="20" x2="72" y2="38" stroke="#FDE047" stroke-width="2"/>
          <circle cx="42" cy="24" r="5" fill="#DC2626" stroke="#FFF" stroke-width="1"/>
          <rect x="92" y="10" width="88" height="28" rx="3" fill="#0F172A"/>
          <text x="136" y="23" text-anchor="middle" fill="#FEF08A" font-family="Bahnschrift, sans-serif" font-size="11" font-weight="700">PHILLIPS 118</text>
          <text x="136" y="34" text-anchor="middle" fill="#BBF7D0" font-family="Bahnschrift, sans-serif" font-size="8">3-FORMAT RECORD</text>
        </svg>
      </div>
      <div class="feat-body">
        <div class="kicker"><span class="num-dot">13</span> WELLINGTON &middot; CRICKET</div>
        <h3>Phillips hits historic 118 vs India</h3>
        <p>First NZ batter with 2026 tons in all 3 formats. <span class="src">(ICC, AP)</span></p>
      </div>
    </article>
  </section>

  <!-- BOTTOM: MAP + TIMELINE (LEFT) & 30 BRIEFS (RIGHT) -->
  <section class="bottom-sec">

    <div class="left-col">
      <div class="sec-hdr"><span>WHERE IT HAPPENED</span><span class="sub">PINS 1&ndash;13</span></div>
      <div class="map-wrap">
        <svg viewBox="0 0 244 126" xmlns="http://www.w3.org/2000/svg">
          <rect width="244" height="126" fill="#D7E5F0"/>
          <!-- Simplified clean continents -->
          <g fill="#BFA882" stroke="#8C7654" stroke-width="0.6">
            <!-- N America -->
            <path d="M12,18 L58,14 L74,26 L62,48 L48,60 L40,56 L26,40 Z"/>
            <!-- S America -->
            <path d="M52,64 L74,68 L82,86 L68,112 L56,112 L52,88 Z"/>
            <!-- Europe -->
            <path d="M104,16 L142,14 L144,36 L112,42 L100,32 Z"/>
            <!-- Africa -->
            <path d="M106,46 L138,46 L148,62 L138,94 L122,102 L114,76 L102,62 Z"/>
            <!-- Asia -->
            <path d="M144,14 L216,18 L224,42 L196,64 L168,66 L146,44 Z"/>
            <!-- Australia / NZ -->
            <path d="M192,80 L218,80 L220,98 L194,98 Z"/>
            <path d="M228,98 L234,94 L232,106 Z"/>
          </g>
          <!-- Leader lines for tight Europe cluster -->
          <line x1="126" y1="24" x2="112" y2="12" stroke="#1E3A8A" stroke-width="0.8"/>
          <line x1="138" y1="26" x2="152" y2="12" stroke="#1E3A8A" stroke-width="0.8"/>
          <!-- Pins 1-13 with zero overlaps -->
          <g font-family="Bahnschrift, sans-serif" font-size="8.5" font-weight="700" text-anchor="middle" fill="#FFF">
            <!-- 10 US -->
            <circle cx="38" cy="39" r="7" fill="#7C3AED"/><text x="38" y="42">10</text>
            <!-- 2 Wall St / Global -->
            <circle cx="60" cy="35" r="7" fill="#334155"/><text x="60" y="38">2</text>
            <!-- 12 Peru -->
            <circle cx="58" cy="76" r="7" fill="#7C3AED"/><text x="58" y="79">12</text>
            <!-- 6 Brussels -->
            <circle cx="108" cy="24" r="7" fill="#1E3A8A"/><text x="108" y="27">6</text>
            <!-- 8 Italy -->
            <circle cx="118" cy="37" r="7" fill="#1E3A8A"/><text x="118" y="40">8</text>
            <!-- 4 Poland -->
            <circle cx="126" cy="14" r="7" fill="#1E3A8A"/><text x="126" y="17">4</text>
            <!-- 1 Kyiv -->
            <circle cx="144" cy="24" r="7" fill="#1E3A8A"/><text x="144" y="27">1</text>
            <!-- 5 COP31 -->
            <circle cx="136" cy="40" r="7" fill="#B45309"/><text x="136" y="43">5</text>
            <!-- 7 Hormuz -->
            <circle cx="156" cy="50" r="7" fill="#B45309"/><text x="156" y="53">7</text>
            <!-- 11 Kenya -->
            <circle cx="140" cy="72" r="7" fill="#15803D"/><text x="140" y="75">11</text>
            <!-- 3 India -->
            <circle cx="176" cy="56" r="7" fill="#B91C1C"/><text x="176" y="59">3</text>
            <!-- 9 Tokyo -->
            <circle cx="216" cy="36" r="7" fill="#B91C1C"/><text x="216" y="39">9</text>
            <!-- 13 NZ -->
            <circle cx="231" cy="100" r="7" fill="#0F766E"/><text x="231" y="103">13</text>
          </g>
        </svg>
      </div>
      <div class="map-cap">Pins 1&ndash;13 map directly to cards above.</div>

      <div class="utc-box">
        <div class="utc-title">FRIDAY 20 NOV IN UTC</div>
        <div class="utc-row"><span class="utc-t">00:00</span><span>Kyiv bridges hit in barrage</span></div>
        <div class="utc-row"><span class="utc-t">02:30</span><span>Cyclone Akvan hits Odisha</span></div>
        <div class="utc-row"><span class="utc-t">05:30</span><span>Taiwan -6.2%; Kospi curbed</span></div>
        <div class="utc-row"><span class="utc-t">05:50</span><span>Russian missiles in Poland</span></div>
        <div class="utc-row"><span class="utc-t">11:30</span><span>UK&ndash;EU reset deal sealed</span></div>
        <div class="utc-row"><span class="utc-t">15:00</span><span>COP31 runs past close</span></div>
        <div class="utc-row"><span class="utc-t">19:10</span><span>Nvidia -14%; S&amp;P -3.7%</span></div>
      </div>
    </div>

    <div class="wire-wrap">
      <div class="sec-hdr">
        <span>ALSO ON FRIDAY 20 NOVEMBER &mdash; 27 MORE STORIES (14&ndash;40)</span>
        <span class="sub">WORLD WIRE &middot; ALL 7 REGIONS</span>
      </div>
      <div class="wire-cols">
        <div class="wire-col">${col1}</div>
        <div class="wire-col">${col2}</div>
        <div class="wire-col">${col3}</div>
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
