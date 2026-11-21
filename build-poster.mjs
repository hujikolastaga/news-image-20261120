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
  { id: 14, color: '#1E3A8A', city: 'Lviv', text: 'Overnight strike on rail station kills two', src: 'BBC' },
  { id: 15, color: '#1E3A8A', city: 'Kharkiv', text: 'Drone strike hits hospital, injuring four', src: 'Ukrinform' },
  { id: 16, color: '#1E3A8A', city: 'Smolensk', text: 'Ukraine drones hit Dorogobuzh chemical plant', src: 'ISW' },
  { id: 17, color: '#1E3A8A', city: 'Estonia', text: 'Approves 6-mo Russia road border shut Dec 1', src: 'Reuters' },
  { id: 18, color: '#1E3A8A', city: 'Berlin', text: 'Youth in 25+ states walk out over draft', src: 'Guardian' },
  { id: 19, color: '#1E3A8A', city: 'London', text: 'Cyber chief confirms ops vs Russia & China', src: 'Sky' },
  { id: 20, color: '#1E3A8A', city: 'Paris', text: 'Strict consumer-credit rules cover BNPL loans', src: 'France 24' },
  { id: 21, color: '#1E3A8A', city: 'Barcelona', text: 'Daraxonrasib combo hits 60.7% cancer response', src: 'ENA' },
  { id: 22, color: '#1E3A8A', city: 'Turin', text: 'ATP pay tops $350m; Alcaraz into semis', src: 'ATP' },
  { id: 23, color: '#7C3AED', city: 'Washington', text: 'Judge blocks Trump 250-ft Arlington arch', src: 'PBS' },
  { id: 24, color: '#7C3AED', city: 'Washington', text: 'Order tells firms alert WH on Hill queries', src: 'WH' },
  { id: 25, color: '#7C3AED', city: 'Florida', text: 'Historic downpours flood coast; rescues run', src: 'CBS' },

  { id: 26, color: '#334155', city: 'Markets', text: 'Bitcoin dips under $60k; gold falls to $3,526', src: 'Reuters' },
  { id: 27, color: '#334155', city: 'Geneva', text: 'WFP cuts 2027 reach to 91M amid $12B gap', src: 'UN' },
  { id: 28, color: '#B91C1C', city: 'Tokyo', text: 'SoftBank tumbles 14.5% as chip rout widens', src: 'CNBC' },
  { id: 29, color: '#B91C1C', city: 'Beijing', text: 'PBOC holds loan prime rates for 18th month', src: 'Xinhua' },
  { id: 30, color: '#B91C1C', city: 'Seoul', text: 'Ruling party moves to impeach top judge', src: 'Dong-A' },
  { id: 31, color: '#B91C1C', city: 'Seoul', text: 'High Court upholds Kakao founder acquittal', src: 'Times' },
  { id: 32, color: '#B91C1C', city: 'Taipei', text: 'F-16s scramble vs Tu-95s; 2.7k bots flagged', src: 'CNA' },
  { id: 33, color: '#B91C1C', city: 'Shenzhen', text: 'Xi hails Australia thaw; 3 nations urge truce', src: 'AA' },
  { id: 34, color: '#B91C1C', city: 'New Delhi', text: 'Pakistan minister visits India for SCO talks', src: 'PTI' },
  { id: 35, color: '#B91C1C', city: 'Naypyidaw', text: 'Myanmar junta calls World Court ruling unfair', src: 'CNN' },
  { id: 36, color: '#B91C1C', city: 'Dhaka', text: '124 held amid fresh political arson attacks', src: 'Star' },
  { id: 37, color: '#B91C1C', city: 'Hong Kong', text: 'Hang Seng drops 20% off peak; Tech adds CATL', src: 'AP' },

  { id: 38, color: '#B45309', city: 'Iraq', text: 'Army enters Kataib Hezbollah base Jurf al-Sakhar', src: 'Reuters' },
  { id: 39, color: '#B45309', city: 'Yemen', text: 'Coalition warns civilians to quit Hodeida port', src: 'Al Arabiya' },
  { id: 40, color: '#B45309', city: 'Gaza', text: 'Strikes kill 6+ despite truce; Lebanon hit', src: 'Anadolu' },
  { id: 41, color: '#15803D', city: 'S. Africa', text: 'Q3 police toll logs 581 women killed in 3 mo', src: 'SABC' },
  { id: 42, color: '#15803D', city: 'Malawi', text: 'Forex crunch triggers multi-day fuel queues', src: 'Al Jazeera' },
  { id: 43, color: '#15803D', city: 'Uganda', text: 'Bans rallies across 34 districts over Ebola', src: 'Nile Post' },
  { id: 44, color: '#15803D', city: 'Nigeria', text: 'Court rejects bid to bar Tinubu in 2027 poll', src: 'Punch' },
  { id: 45, color: '#7C3AED', city: 'Brazil', text: 'CB sells $1B; Lula signs Kapot Nhinore pact', src: 'AP' },
  { id: 46, color: '#7C3AED', city: 'El Salvador', text: 'Bukele registers 3rd-term bid ahead of vote', src: 'AP' },
  { id: 47, color: '#7C3AED', city: 'Argentina', text: 'Country risk jumps 15% to 1,070 bps', src: 'JPM' },
  { id: 48, color: '#0F766E', city: 'Australia', text: 'Adelaide tests digital arrival at airport', src: 'ABF' },
  { id: 49, color: '#0F766E', city: 'Tonga', text: 'Declares 27-day El Nino drought emergency', src: 'PMN' },
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
  const col1 = buildBriefColumn(WORLD_BRIEFS.slice(0, 12));
  const col2 = buildBriefColumn(WORLD_BRIEFS.slice(12, 24));
  const col3 = buildBriefColumn(WORLD_BRIEFS.slice(24, 36));

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
    font-size: 9.5px;
    font-weight: 700;
    letter-spacing: 1px;
    text-transform: uppercase;
  }
  .mast-top .left { color: #991B1B; }
  .mast-top .right { color: #334155; }
  .mast-title-wrap {
    border-top: 2px solid #0F172A;
    border-bottom: 1px solid #0F172A;
    padding: 1.5px 0 2.5px 0;
    text-align: center;
  }
  .mast-title-wrap h1 {
    font-family: 'Georgia', serif;
    font-size: 41px;
    font-weight: 700;
    line-height: 1.01;
    letter-spacing: -0.5px;
    color: #090D16;
  }
  .mast-deck {
    font-family: 'Georgia', serif;
    font-style: italic;
    font-size: 11px;
    color: #1E293B;
    margin-top: 1px;
  }

  /* NUMBERS & REGIONS STRIP */
  .stats-row {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    border-bottom: 1.5px solid #0F172A;
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
    font-size: 15.5px;
    font-weight: 700;
    color: #0F172A;
    line-height: 1.06;
  }
  .stat-lbl {
    font-size: 9.1px;
    line-height: 1.14;
    color: #334155;
    font-weight: 500;
  }

  .regions-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #EAE2D2;
    border-radius: 3px;
    padding: 2px 8px;
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
    font-size: 9.2px;
    font-weight: 700;
    padding: 1.5px 7px;
    border-radius: 2px;
    letter-spacing: 0.4px;
    text-transform: uppercase;
  }
  .reg-note {
    font-family: 'Bahnschrift', 'Segoe UI', sans-serif;
    font-size: 9.2px;
    font-weight: 700;
    color: #334155;
    letter-spacing: 0.5px;
  }

  /* ROW 1: LEAD CARDS */
  .row-lead {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    height: 192px;
  }
  .lead-card {
    background: #FFFDF8;
    border: 1px solid #C8BFA8;
    border-top: 3px solid var(--c, #1E3A8A);
    border-radius: 3px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
  .lead-art {
    height: 86px;
    width: 100%;
    position: relative;
    overflow: hidden;
    flex-shrink: 0;
  }
  .lead-body {
    padding: 4.5px 8px;
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
  }
  .kicker {
    display: flex;
    align-items: center;
    gap: 5px;
    font-family: 'Bahnschrift', 'Segoe UI', sans-serif;
    font-size: 9.2px;
    font-weight: 700;
    letter-spacing: 0.45px;
    text-transform: uppercase;
    color: var(--c, #1E3A8A);
  }
  .num-dot {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: var(--c, #1E3A8A);
    color: #FFFFFF;
    font-size: 9px;
    font-weight: 700;
    flex-shrink: 0;
  }
  .lead-body h2 {
    font-family: 'Georgia', serif;
    font-size: 14.6px;
    font-weight: 700;
    line-height: 1.12;
    color: #090D16;
  }
  .lead-body p {
    font-size: 10.1px;
    line-height: 1.22;
    color: #1E293B;
  }
  .src { color: #475569; font-style: italic; font-weight: 500; }

  /* ROWS 2 & 3: FEATURE CARDS (5 COLS) */
  .row-feat {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 7px;
    height: 129px;
  }
  .feat-card {
    background: #FFFDF8;
    border: 1px solid #C8BFA8;
    border-top: 2.5px solid var(--c, #1E3A8A);
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
    padding: 3.5px 6px;
    display: flex;
    flex-direction: column;
    gap: 1.5px;
    flex: 1;
  }
  .feat-body .kicker { font-size: 8.5px; gap: 4px; }
  .feat-body .num-dot { width: 13px; height: 13px; font-size: 8.3px; }
  .feat-body h3 {
    font-family: 'Georgia', serif;
    font-size: 11.8px;
    font-weight: 700;
    line-height: 1.11;
    color: #090D16;
  }
  .feat-body p {
    font-size: 9.2px;
    line-height: 1.17;
    color: #1E293B;
  }

  /* BOTTOM SECTION: MAP + TIMELINE & 3-COL WIRE */
  .bottom-sec {
    display: grid;
    grid-template-columns: 244px 1fr;
    gap: 10px;
    height: 356px;
    border-top: 1.5px solid #0F172A;
    padding-top: 4px;
  }
  .left-col {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }
  .sec-hdr {
    font-family: 'Bahnschrift', 'Segoe UI', sans-serif;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.7px;
    text-transform: uppercase;
    color: #0F172A;
    border-bottom: 1px solid #CBD5E1;
    padding-bottom: 2px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .sec-hdr span.sub { font-size: 8.8px; color: #64748B; font-weight: 600; }
  .map-wrap {
    height: 126px;
    background: #DCE8F2;
    border: 1px solid #B8C7D6;
    border-radius: 3px;
    overflow: hidden;
  }
  .map-cap {
    font-size: 8.8px;
    color: #475569;
    margin-top: -2px;
  }

  /* UTC TIMELINE */
  .utc-box {
    background: #FFFDF8;
    border: 1px solid #C8BFA8;
    border-radius: 3px;
    padding: 5px 7px;
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  .utc-title {
    font-family: 'Bahnschrift', 'Segoe UI', sans-serif;
    font-size: 9.5px;
    font-weight: 700;
    color: #991B1B;
    letter-spacing: 0.6px;
    border-bottom: 1px solid #E2D9C8;
    padding-bottom: 2px;
  }
  .utc-row {
    display: flex;
    gap: 6px;
    align-items: baseline;
    font-size: 9.5px;
    line-height: 1.22;
    color: #1E293B;
  }
  .utc-t {
    font-family: 'Bahnschrift', 'Segoe UI', sans-serif;
    font-weight: 700;
    color: #0F172A;
    background: #EAE2D2;
    padding: 0.5px 4px;
    border-radius: 2px;
    font-size: 8.8px;
    flex-shrink: 0;
  }

  /* RIGHT: 3-COL WIRE (36 ITEMS) */
  .wire-wrap {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }
  .wire-cols {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    flex: 1;
  }
  .wire-col {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    border-right: 1px solid #E2D9C8;
    padding-right: 7px;
  }
  .wire-col:last-child { border-right: none; padding-right: 0; }
  .brief-item {
    display: flex;
    align-items: flex-start;
    gap: 4.5px;
    border-bottom: 1px solid #ECE5D5;
    padding-bottom: 1.5px;
  }
  .brief-item:last-child { border-bottom: none; padding-bottom: 0; }
  .brief-num {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 15px;
    height: 13.5px;
    border-radius: 2px;
    color: #FFFFFF;
    font-family: 'Bahnschrift', 'Segoe UI', sans-serif;
    font-size: 8.4px;
    font-weight: 700;
    flex-shrink: 0;
    margin-top: 1px;
  }
  .brief-txt {
    font-size: 9.35px;
    line-height: 1.17;
    color: #0F172A;
  }

  /* DATE CHECK + FOOTER */
  .date-check {
    background: #FBF7EE;
    border: 1px solid #C8BFA8;
    border-left: 3.5px solid #B91C1C;
    border-radius: 2px;
    padding: 3.5px 8px;
    font-size: 8.9px;
    line-height: 1.24;
    color: #1E293B;
  }
  .date-check strong { color: #991B1B; letter-spacing: 0.4px; }
  .foot-line {
    display: flex;
    justify-content: space-between;
    font-size: 8.4px;
    color: #475569;
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
      <span class="right">49 VERIFIED STORIES &middot; 7 REGIONS &middot; EVERY ONE FRIDAY 20 NOV 2026</span>
    </div>
    <div class="mast-title-wrap">
      <h1>Friday 20 November 2026</h1>
      <div class="mast-deck">Russian missiles hit Kyiv &amp; enter Poland &middot; AI rout sinks Wall St &amp; Asia &middot; Cyclone Akvan strikes Odisha &middot; COP31 runs overtime</div>
    </div>
  </header>

  <!-- DAY IN NUMBERS & REGION COUNTS -->
  <section>
    <div class="stats-row">
      <div class="stat-cell"><div class="stat-val">111+</div><div class="stat-lbl">missiles fired at Ukraine overnight</div></div>
      <div class="stat-cell"><div class="stat-val">372k</div><div class="stat-lbl">sheltered in Odisha ahead of Akvan</div></div>
      <div class="stat-cell"><div class="stat-val">-5.3%</div><div class="stat-lbl">Nasdaq plunge, wiping 2026 gains</div></div>
      <div class="stat-cell"><div class="stat-val">100k</div><div class="stat-lbl">youth visas/yr in UK-EU reset deal</div></div>
      <div class="stat-cell"><div class="stat-val">2.3%</div><div class="stat-lbl">Japan Oct CPI; Dec BoJ hike eyed</div></div>
      <div class="stat-cell"><div class="stat-val">118</div><div class="stat-lbl">Glenn Phillips historic runs vs India</div></div>
    </div>
    <div class="regions-bar">
      <div class="reg-pills">
        <span class="reg-pill" style="background:#1E3A8A;">Europe 13</span>
        <span class="reg-pill" style="background:#B91C1C;">Asia 12</span>
        <span class="reg-pill" style="background:#7C3AED;">Americas 8</span>
        <span class="reg-pill" style="background:#15803D;">Africa 5</span>
        <span class="reg-pill" style="background:#B45309;">Mideast 5</span>
        <span class="reg-pill" style="background:#0F766E;">Oceania 3</span>
        <span class="reg-pill" style="background:#334155;">Global 3</span>
      </div>
      <span class="reg-note">49 ATOMIC STORIES &middot; ALL FRI 20 NOV 2026</span>
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
        <p>Overnight strike fires 111 missiles &amp; 404 drones, cutting power and water; Austrian &amp; Dutch embassies damaged. <span class="src">(Kyiv Indep., Reuters)</span></p>
      </div>
    </article>

    <article class="lead-card" style="--c:#334155;">
      <div class="lead-art">
        <svg viewBox="0 0 326 92" xmlns="http://www.w3.org/2000/svg">
          <rect width="326" height="92" fill="#0F172A"/>
          <line x1="0" y1="30" x2="326" y2="30" stroke="#1E293B"/>
          <line x1="0" y1="60" x2="326" y2="60" stroke="#1E293B"/>
          <polyline points="14,34 52,38 88,48 124,52 158,68 188,78" fill="none" stroke="#FB7185" stroke-width="3"/>
          <polygon points="14,34 52,38 88,48 124,52 158,68 188,78 188,92 14,92" fill="#E11D48" opacity="0.22"/>
          <rect x="7" y="6" width="144" height="17" rx="2" fill="#B91C1C"/><text x="79" y="18" text-anchor="middle" fill="#FFF" font-family="Bahnschrift, sans-serif" font-size="10.5" font-weight="700">GLOBAL AI MARKET ROUT</text>
          <rect x="196" y="7" width="122" height="78" rx="3" fill="#1E293B" stroke="#475569"/>
          <text x="204" y="23" fill="#E2E8F0" font-family="Bahnschrift, sans-serif" font-size="10" font-weight="700">S&amp;P 500</text><text x="311" y="23" text-anchor="end" fill="#FCA5A5" font-family="Bahnschrift, sans-serif" font-size="10" font-weight="700">-3.7%</text>
          <text x="204" y="40" fill="#E2E8F0" font-family="Bahnschrift, sans-serif" font-size="10" font-weight="700">NASDAQ</text><text x="311" y="40" text-anchor="end" fill="#FCA5A5" font-family="Bahnschrift, sans-serif" font-size="10" font-weight="700">-5.3%</text>
          <text x="204" y="57" fill="#E2E8F0" font-family="Bahnschrift, sans-serif" font-size="10" font-weight="700">TAIWAN</text><text x="311" y="57" text-anchor="end" fill="#FCA5A5" font-family="Bahnschrift, sans-serif" font-size="10" font-weight="700">-6.2%</text>
          <text x="204" y="74" fill="#E2E8F0" font-family="Bahnschrift, sans-serif" font-size="10" font-weight="700">NIKKEI</text><text x="311" y="74" text-anchor="end" fill="#FCA5A5" font-family="Bahnschrift, sans-serif" font-size="10" font-weight="700">-5.1%</text>
        </svg>
      </div>
      <div class="lead-body">
        <div class="kicker"><span class="num-dot">2</span> WALL ST &amp; ASIA &middot; MARKETS</div>
        <h2>AI sell-off sinks Wall St &amp; Asian stocks</h2>
        <p>S&amp;P 500 drops 3.7% into correction; Nasdaq (-5.3%) erases 2026 gains; Taiwan &amp; Nikkei log worst week since 2020. <span class="src">(Reuters, AP)</span></p>
      </div>
    </article>

    <article class="lead-card" style="--c:#B91C1C;">
      <div class="lead-art">
        <svg viewBox="0 0 326 92" xmlns="http://www.w3.org/2000/svg">
          <rect width="326" height="92" fill="#0B2E36"/>
          <path d="M0,0 L152,0 L142,24 L118,52 L96,92 L0,92 Z" fill="#1B3B2F" stroke="#34D399" stroke-width="1.4"/>
          <text x="48" y="48" text-anchor="middle" fill="#A7F3D0" font-family="Bahnschrift, sans-serif" font-size="11" font-weight="700">ODISHA</text>
          <text x="38" y="76" text-anchor="middle" fill="#A7F3D0" font-family="Bahnschrift, sans-serif" font-size="10" font-weight="700">GOPALPUR</text>
          <g transform="translate(144,48)">
            <circle cx="0" cy="0" r="28" fill="#14B8A6" opacity="0.22"/>
            <path d="M0,0 C12,-18 34,-10 26,10 C18,28 -14,28 -22,6 C-28,-12 -10,-30 12,-24" fill="none" stroke="#5EEAD4" stroke-width="2.6" stroke-linecap="round"/>
            <circle cx="0" cy="0" r="4" fill="#FEF08A"/>
          </g>
          <path d="M220,70 L160,52" stroke="#F87171" stroke-width="2" stroke-dasharray="3,2"/>
          <rect x="7" y="6" width="122" height="17" rx="2" fill="#0F766E"/><text x="68" y="18" text-anchor="middle" fill="#FFF" font-family="Bahnschrift, sans-serif" font-size="10.5" font-weight="700">CYCLONE AKVAN</text>
          <rect x="192" y="8" width="126" height="32" rx="3" fill="rgba(15,23,42,0.88)" stroke="#2DD4BF"/>
          <text x="255" y="21" text-anchor="middle" fill="#99F6E4" font-family="Bahnschrift, sans-serif" font-size="9.5" font-weight="700">LANDFALL ~8 AM IST</text>
          <text x="255" y="34" text-anchor="middle" fill="#FFF" font-family="Bahnschrift, sans-serif" font-size="10" font-weight="700">372,000 EVACUATED</text>
        </svg>
      </div>
      <div class="lead-body">
        <div class="kicker"><span class="num-dot">3</span> ODISHA, INDIA &middot; CYCLONE</div>
        <h2>Cyclone Akvan strikes India's east coast</h2>
        <p>Storm makes landfall near Gopalpur with 70–90 km/h gusts &amp; 209 mm rain; 372,000 sheltered, zero deaths reported. <span class="src">(IMD, PTI)</span></p>
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
          <rect x="92" y="34" width="92" height="12" rx="2" fill="rgba(153,27,27,0.92)"/>
          <text x="138" y="42.5" text-anchor="middle" fill="#FFF" font-family="Bahnschrift, sans-serif" font-size="7.8" font-weight="700">2 KH-101 + DRONE</text>
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
          <rect x="122" y="6" width="62" height="14" rx="2" fill="#B91C1C"/><text x="153" y="16" text-anchor="middle" fill="#FFF" font-family="Bahnschrift, sans-serif" font-size="8.5" font-weight="700">HORMUZ HIT</text>
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
          <g font-family="Bahnschrift, sans-serif" font-size="7.5" font-weight="700" text-anchor="middle" fill="#FFF">
            <!-- 10 US -->
            <circle cx="39" cy="39" r="6" fill="#7C3AED"/><text x="39" y="41.5">10</text>
            <!-- 2 Wall St / Global -->
            <circle cx="60" cy="35" r="6" fill="#334155"/><text x="60" y="37.5">2</text>
            <!-- 12 Peru -->
            <circle cx="58" cy="76" r="6" fill="#7C3AED"/><text x="58" y="78.5">12</text>
            <!-- 6 Brussels -->
            <circle cx="108" cy="24" r="6" fill="#1E3A8A"/><text x="108" y="26.5">6</text>
            <!-- 8 Italy -->
            <circle cx="118" cy="37" r="6" fill="#1E3A8A"/><text x="118" y="39.5">8</text>
            <!-- 4 Poland -->
            <circle cx="126" cy="14" r="6" fill="#1E3A8A"/><text x="126" y="16.5">4</text>
            <!-- 1 Kyiv -->
            <circle cx="144" cy="24" r="6" fill="#1E3A8A"/><text x="144" y="26.5">1</text>
            <!-- 5 COP31 -->
            <circle cx="136" cy="40" r="6" fill="#B45309"/><text x="136" y="42.5">5</text>
            <!-- 7 Hormuz -->
            <circle cx="156" cy="50" r="6" fill="#B45309"/><text x="156" y="52.5">7</text>
            <!-- 11 Kenya -->
            <circle cx="140" cy="72" r="6" fill="#15803D"/><text x="140" y="74.5">11</text>
            <!-- 3 India -->
            <circle cx="176" cy="56" r="6" fill="#B91C1C"/><text x="176" y="58.5">3</text>
            <!-- 9 Tokyo -->
            <circle cx="216" cy="36" r="6" fill="#B91C1C"/><text x="216" y="38.5">9</text>
            <!-- 13 NZ -->
            <circle cx="231" cy="100" r="6" fill="#0F766E"/><text x="231" y="102.5">13</text>
          </g>
        </svg>
      </div>
      <div class="map-cap">Pins 1&ndash;13 link directly to lead &amp; feature stories above.</div>

      <div class="utc-box">
        <div class="utc-title">FRIDAY 20 NOV IN UTC</div>
        <div class="utc-row"><span class="utc-t">00:00</span><span>Kyiv Dnipro bridges hit in barrage</span></div>
        <div class="utc-row"><span class="utc-t">02:30</span><span>Cyclone Akvan lands near Gopalpur</span></div>
        <div class="utc-row"><span class="utc-t">05:30</span><span>Taiwan -6.2%; Kospi curb triggered</span></div>
        <div class="utc-row"><span class="utc-t">05:50</span><span>Russian missiles fall in SE Poland</span></div>
        <div class="utc-row"><span class="utc-t">11:30</span><span>UK &amp; EU seal post-Brexit reset deal</span></div>
        <div class="utc-row"><span class="utc-t">15:00</span><span>COP31 in Antalya runs past close</span></div>
        <div class="utc-row"><span class="utc-t">19:10</span><span>Nvidia -14% on SEC probe; S&amp;P -3.7%</span></div>
      </div>
    </div>

    <div class="wire-wrap">
      <div class="sec-hdr">
        <span>ALSO ON FRIDAY 20 NOVEMBER &mdash; 36 MORE STORIES (14&ndash;49)</span>
        <span class="sub">WORLD WIRE &middot; ALL CONTINENTS</span>
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
    <strong>DATE CHECK</strong> Excluded as Thu 19 Nov news: ICJ Myanmar genocide ruling, Anthropic IPO day-one surge, US Senate 51&ndash;48 Iran vote, Denmark&ndash;Greenland pact, Haiti Martissant raid, WTO fishery deal. Excluded as Sat 21 Nov+ (not yet finalized Fri 20 Nov): final COP31 closing agreement, BepiColombo CET orbit confirmation.
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
