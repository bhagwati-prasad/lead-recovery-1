const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const iconListPath = path.join(ROOT, 'icon_list.txt');
const spritePath = path.join(ROOT, 'icon-sprite.svg');
const showcasePath = path.join(ROOT, 'icon-showcase.html');

const listText = fs.readFileSync(iconListPath, 'utf8');

function parseIconNames(text) {
  const names = [];
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^\|\s*([a-z0-9-]+)\s*\|/i);
    if (!m) continue;
    const name = m[1].trim();
    if (name.toLowerCase() === 'icon') continue;
    if (/^[-]+$/.test(name)) continue;
    names.push(name);
  }
  return [...new Set(names)];
}

const listedIcons = parseIconNames(listText);

const extraIcons = [
  'call',
  'online-telephony',
  'sip-trunk',
  'ivr',
  'predictive-dialer',
  'softphone',
  'voip-gateway',
  'crm-org',
  'crm-products',
  'finance-product',
  'product-loan',
  'product-credit-card',
  'funnel-sections',
  'contact-center',
  'human-agent',
  'human-agent-headset',
  'human-agent-no-headset',
  'ai-agent-headset',
  'ai-agent-no-headset',
  'agent-human-online',
  'agent-ai-online',
  'agent-human-offline',
  'agent-ai-offline',
  'agent-human-busy',
  'agent-ai-busy'
];

const iconNames = [...new Set([...listedIcons, ...extraIcons])];

const COLORS = {
  navigation: '#007ACC',
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  neutral: '#858585',
  ai: '#C586C0',
  voice: '#4FC1FF',
  crm: '#9CDCFE',
  agents: '#569CD6',
  leads: '#CE9178',
  analytics: '#DCDCAA',
  infra: '#858585',
  logs: '#6A9955',
  nlp: '#B5CEA8',
  calls: '#4EC9B0',
  time: '#4EC9B0'
};

const BADGES = {
  checkTR: '<polyline points="17.5,4 19.5,6.5 22.5,1.5" />',
  crossTR: '<line x1="17.5" y1="1.5" x2="22.5" y2="6.5"/><line x1="22.5" y1="1.5" x2="17.5" y2="6.5"/>',
  slashTR: '<line x1="18" y1="7" x2="22" y2="1"/>',
  plusTR: '<line x1="20" y1="1.5" x2="20" y2="6.5"/><line x1="17.5" y1="4" x2="22.5" y2="4"/>',
  minusTR: '<line x1="17.5" y1="4" x2="22.5" y2="4"/>',
  upTR: '<line x1="20" y1="7" x2="20" y2="1.5"/><polyline points="17.5,4 20,1.5 22.5,4"/>',
  downTR: '<line x1="20" y1="1" x2="20" y2="6.5"/><polyline points="17.5,4 20,6.5 22.5,4"/>',
  rightTR: '<line x1="17.5" y1="4" x2="23" y2="4"/><polyline points="20.5,1.5 23,4 20.5,6.5"/>',
  leftTR: '<line x1="22.5" y1="4" x2="17" y2="4"/><polyline points="19.5,1.5 17,4 19.5,6.5"/>',
  dotTR: '<circle cx="20" cy="4" r="2" fill="currentColor" stroke="none"/>',
  clockBR: '<circle cx="20" cy="20" r="2"/><line x1="20" y1="20" x2="20" y2="18.5"/><line x1="20" y1="20" x2="21.2" y2="20.8"/>',
  infoBR: '<circle cx="20" cy="20" r="2"/><line x1="20" y1="19.2" x2="20" y2="21.3"/><line x1="20" y1="18" x2="20" y2="18"/>',
  recycleBR: '<polyline points="17.5,20 19,17.8 20.2,20"/><polyline points="20,22.5 22.2,21.5 20.8,19.8"/><polyline points="17.8,22 19.8,22.5 20.5,20.5"/>'
};

function baseHome() {
  return '<path d="M3 10.5l9-7 9 7"/><path d="M5 9.5v11h14v-11"/><path d="M10 20.5v-6h4v6"/>';
}

function baseGrid() {
  return '<rect x="3" y="3" width="8" height="8" rx="1"/><rect x="13" y="3" width="8" height="5" rx="1"/><rect x="13" y="10" width="8" height="11" rx="1"/><rect x="3" y="13" width="8" height="8" rx="1"/>';
}

function baseFolder() {
  return '<path d="M3 7.5h6l2 2h10v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M3 9.5h18"/>';
}

function baseBell() {
  return '<path d="M6 17.5h12l-1.5-2v-4a4.5 4.5 0 0 0-9 0v4z"/><path d="M10 19.5a2 2 0 0 0 4 0"/>';
}

function baseMessage() {
  return '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3.5 7l8.5 6 8.5-6"/>';
}

function baseList() {
  return '<line x1="6" y1="7" x2="20" y2="7"/><line x1="6" y1="12" x2="20" y2="12"/><line x1="6" y1="17" x2="20" y2="17"/><circle cx="4" cy="7" r="0.75" fill="currentColor" stroke="none"/><circle cx="4" cy="12" r="0.75" fill="currentColor" stroke="none"/><circle cx="4" cy="17" r="0.75" fill="currentColor" stroke="none"/>';
}

function baseClock() {
  return '<circle cx="12" cy="12" r="8.5"/><line x1="12" y1="12" x2="12" y2="7"/><line x1="12" y1="12" x2="16" y2="14.5"/>';
}

function basePhone() {
  return '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>';
}

function basePhoneRing() {
  return `${basePhone()}<path d="M16.5 4.5a4 4 0 0 1 3 3"/><path d="M14.5 2.5a7 7 0 0 1 5 5"/>`;
}

function basePhoneArrowOut() {
  return `${basePhone()}<polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>`;
}

function basePhoneArrowIn() {
  return `${basePhone()}<polyline points="9 3 3 3 3 9"/><line x1="14" y1="14" x2="3" y2="3"/>`;
}

function baseHeadset() {
  return '<path d="M4 13a8 8 0 0 1 16 0"/><rect x="3" y="12" width="3" height="6" rx="1"/><rect x="18" y="12" width="3" height="6" rx="1"/><path d="M14 18h3a2 2 0 0 1 0 4h-4"/>';
}

function baseUser() {
  return '<circle cx="12" cy="8" r="3.5"/><path d="M5 20a7 7 0 0 1 14 0"/>';
}

function baseUserHeadset() {
  return `${baseUser()}<path d="M7 10.5a5 5 0 0 1 10 0"/><line x1="17" y1="12" x2="19" y2="12"/><line x1="19" y1="12" x2="19" y2="14"/>`;
}

function baseUsers() {
  return '<circle cx="9" cy="8" r="3"/><circle cx="16" cy="9" r="2.5"/><path d="M3.5 20a6 6 0 0 1 11 0"/><path d="M12.5 20a5 5 0 0 1 8 0"/>';
}

function baseRobot() {
  return '<rect x="6" y="6" width="12" height="10" rx="2"/><circle cx="10" cy="11" r="1" fill="currentColor" stroke="none"/><circle cx="14" cy="11" r="1" fill="currentColor" stroke="none"/><line x1="9" y1="14" x2="15" y2="14"/><line x1="12" y1="3" x2="12" y2="6"/><circle cx="12" cy="2.5" r="0.75" fill="currentColor" stroke="none"/>';
}

function baseDocument() {
  return '<path d="M7 2.5h8l4 4v15H7z"/><path d="M15 2.5v4h4"/><line x1="9" y1="12" x2="17" y2="12"/><line x1="9" y1="16" x2="17" y2="16"/>';
}

function baseChartBars() {
  return '<line x1="4" y1="20" x2="20" y2="20"/><rect x="5" y="12" width="3" height="8" rx="0.5"/><rect x="10.5" y="9" width="3" height="11" rx="0.5"/><rect x="16" y="5" width="3" height="15" rx="0.5"/>';
}

function baseChartLine() {
  return '<line x1="4" y1="20" x2="20" y2="20"/><polyline points="4,16 8,12 12,14 16,8 20,10"/><circle cx="8" cy="12" r="0.75" fill="currentColor" stroke="none"/><circle cx="12" cy="14" r="0.75" fill="currentColor" stroke="none"/><circle cx="16" cy="8" r="0.75" fill="currentColor" stroke="none"/>';
}

function basePie() {
  return '<circle cx="12" cy="12" r="8.5"/><path d="M12 3.5v8.5h8.5"/>';
}

function baseFunnel() {
  return '<path d="M3 4h18l-7 8v6l-4 2v-8z"/>';
}

function baseTag() {
  return '<path d="M3 11l8-8h8v8l-8 8z"/><circle cx="15.5" cy="8.5" r="1" fill="currentColor" stroke="none"/>';
}

function baseGear() {
  return '<circle cx="12" cy="12" r="3.5"/><path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5 5l1.8 1.8M17.2 17.2 19 19M5 19l1.8-1.8M17.2 6.8 19 5"/>';
}

function baseServer() {
  return '<rect x="4" y="4" width="16" height="6" rx="1"/><rect x="4" y="14" width="16" height="6" rx="1"/><circle cx="7" cy="7" r="0.8" fill="currentColor" stroke="none"/><circle cx="7" cy="17" r="0.8" fill="currentColor" stroke="none"/>';
}

function baseDatabase() {
  return '<ellipse cx="12" cy="5" rx="7" ry="2.5"/><path d="M5 5v10c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5V5"/><path d="M5 10c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5"/>';
}

function baseSearch() {
  return '<circle cx="10.5" cy="10.5" r="5.5"/><line x1="14.5" y1="14.5" x2="20" y2="20"/>';
}

function baseCalendar() {
  return '<rect x="3" y="5" width="18" height="16" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="8" y1="3" x2="8" y2="7"/><line x1="16" y1="3" x2="16" y2="7"/><rect x="8" y="12" width="3" height="3" rx="0.5"/><rect x="13" y="12" width="3" height="3" rx="0.5"/>';
}

function baseCreditCard() {
  return '<rect x="3" y="6" width="18" height="12" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="7" y1="15" x2="11" y2="15"/>';
}

function baseBuilding() {
  return '<rect x="5" y="3" width="14" height="18" rx="1"/><line x1="9" y1="7" x2="9" y2="17"/><line x1="15" y1="7" x2="15" y2="17"/><line x1="5" y1="12" x2="19" y2="12"/><line x1="11" y1="21" x2="13" y2="21"/>';
}

function baseNetwork() {
  return '<circle cx="12" cy="4" r="2"/><circle cx="5" cy="18" r="2"/><circle cx="19" cy="18" r="2"/><line x1="12" y1="6" x2="6" y2="16"/><line x1="12" y1="6" x2="18" y2="16"/><line x1="7" y1="18" x2="17" y2="18"/>';
}

function colorFor(name) {
  if (/^agent|human-agent|agent-/.test(name)) return COLORS.agents;
  if (/^ai|^llm|^nlp/.test(name)) return COLORS.ai;
  if (/voice|audio|speech|bot/.test(name)) return COLORS.voice;
  if (/customer|crm|organization|org/.test(name)) return COLORS.crm;
  if (/lead|sales|funnel|opportunity|revenue/.test(name)) return COLORS.leads;
  if (/analytics|report|chart|forecast|trend|heatmap|comparison/.test(name)) return COLORS.analytics;
  if (/server|database|network|api|cpu|memory|disk|uptime|downtime|system|infrastructure/.test(name)) return COLORS.infra;
  if (/log/.test(name)) return COLORS.logs;
  if (/call|phone|telephony|voip|dialer|ivr|sip/.test(name)) return COLORS.calls;
  if (/time|clock|schedule|calendar|watch|stopclock|sandglass|alarm/.test(name)) return COLORS.time;
  return COLORS.navigation;
}

function selectCore(name) {
  if (name === 'home') return baseHome();
  if (name === 'dashboard' || name === 'overview' || name === 'workspace') return baseGrid();
  if (/notifications|announcements/.test(name)) return baseBell();
  if (/messages|email|sms|chat|whatsapp|telegram/.test(name)) return baseMessage();
  if (/task|timeline|activity|recent|favorites|shortcuts|quick-actions|command-palette/.test(name)) return baseList();
  if (/call|phone|telephony|voip|dialer|ivr|sip/.test(name)) {
    if (/incoming/.test(name)) return basePhoneArrowIn();
    if (/outgoing|forward|transfer|make-call/.test(name)) return basePhoneArrowOut();
    if (/ringing|connecting/.test(name)) return basePhoneRing();
    return basePhone();
  }
  if (/^agent|human-agent/.test(name)) {
    if (/-headset$/.test(name) || /^agent-/.test(name) || name === 'agent' || name === 'agents') return baseUserHeadset();
    return baseUser();
  }
  if (/ai-agent/.test(name)) return `${baseRobot()}${baseHeadset()}`;
  if (/^ai|^llm|^nlp/.test(name)) return baseRobot();
  if (/customer/.test(name)) return /customers/.test(name) ? baseUsers() : baseUser();
  if (/lead|sales|funnel/.test(name)) {
    if (/funnel/.test(name)) return baseFunnel();
    return `${baseTag()}<line x1="8" y1="17" x2="16" y2="17"/>`;
  }
  if (/report|summary|notes|document|profile|history/.test(name)) return baseDocument();
  if (/bar-chart|charts|analytics/.test(name)) return baseChartBars();
  if (/line-chart|trend|forecast|comparison/.test(name)) return baseChartLine();
  if (/pie-chart/.test(name)) return basePie();
  if (/heatmap/.test(name)) return baseGrid();
  if (/settings|preferences|theme|security|permissions|roles|api-keys/.test(name)) return baseGear();
  if (/server|cpu|memory|disk/.test(name)) return baseServer();
  if (/database/.test(name)) return baseDatabase();
  if (/network|load-balancer|webhook|integration/.test(name)) return baseNetwork();
  if (/search|filter|sort|bookmark|tag/.test(name)) return baseSearch();
  if (/calendar|schedule|scheduler|appointment|meeting|reminder|holiday/.test(name)) return baseCalendar();
  if (/credit-card|billing|subscription|payment|finance|product/.test(name)) return baseCreditCard();
  if (/organization|org|workspace-switch/.test(name)) return baseBuilding();
  if (/watch|stopclock|alarmclock|sandglass/.test(name)) return baseClock();
  return baseGrid();
}

function selectBadges(name) {
  const badges = [];

  if (/online|connected|success|complete|completed|converted|qualified|answered|achieved|online/.test(name)) {
    badges.push({ color: COLORS.success, shape: BADGES.checkTR, corner: 'status' });
  }
  if (/failed|missed|declined|delete|lost|blacklist|error|downtime|cancelled|offline|unqualified/.test(name)) {
    badges.push({ color: COLORS.error, shape: BADGES.crossTR, corner: 'status' });
  }
  if (/pending|overdue|dropped|warning|unanswered|paused|processing/.test(name)) {
    badges.push({ color: COLORS.warning, shape: BADGES.slashTR, corner: 'status' });
  }
  if (/add|new/.test(name)) {
    badges.push({ color: COLORS.success, shape: BADGES.plusTR, corner: 'status' });
  }
  if (/remove|delete|unlink/.test(name)) {
    badges.push({ color: COLORS.error, shape: BADGES.minusTR, corner: 'status' });
  }
  if (/escalated|trend-up|growth/.test(name)) {
    badges.push({ color: COLORS.success, shape: BADGES.upTR, corner: 'status' });
  }
  if (/trend-down/.test(name)) {
    badges.push({ color: COLORS.warning, shape: BADGES.downTR, corner: 'status' });
  }
  if (/forward|converted|next/.test(name)) {
    badges.push({ color: COLORS.success, shape: BADGES.rightTR, corner: 'status' });
  }
  if (/abandoned|return/.test(name)) {
    badges.push({ color: COLORS.warning, shape: BADGES.leftTR, corner: 'status' });
  }

  if (/retry|refresh|sync/.test(name)) {
    badges.push({ color: COLORS.voice, shape: BADGES.recycleBR, corner: 'enhancement' });
  }
  if (/duration|wait-time|peak-call-time|time|schedule|scheduled|watch|stopclock|alarmclock/.test(name)) {
    badges.push({ color: COLORS.warning, shape: BADGES.clockBR, corner: 'enhancement' });
  }
  if (/info|summary|details|context|notes/.test(name)) {
    badges.push({ color: COLORS.navigation, shape: BADGES.infoBR, corner: 'enhancement' });
  }

  if (/active|live|on-call/.test(name) && badges.length === 0) {
    badges.push({ color: COLORS.success, shape: BADGES.dotTR, corner: 'status', isDot: true });
  }

  const status = badges.find((b) => b.corner === 'status');
  const enhancement = badges.find((b) => b.corner === 'enhancement');
  return [status, enhancement].filter(Boolean);
}

function symbolFor(name) {
  const core = selectCore(name);
  const coreColor = colorFor(name);
  const badges = selectBadges(name);

  const badgeMarkup = badges
    .map((badge) => {
      const fillAndStroke = badge.isDot
        ? `fill="${badge.color}" stroke="none"`
        : `stroke="${badge.color}" stroke-width="1.5"`;
      return `<g class="icon-badge" ${fillAndStroke}>${badge.shape}</g>`;
    })
    .join('');

  return `<symbol id="${name}" viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round">\n<g class="icon-core" stroke="${coreColor}" stroke-width="1.5">${core}</g>${badgeMarkup}\n</symbol>`;
}

function aliasSymbol(name, target) {
  return `<symbol id="${name}" viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round">\n<use href="#${target}"/>\n</symbol>`;
}

const symbols = iconNames.map(symbolFor);

const aliases = [
  aliasSymbol('icon-call', 'call'),
  aliasSymbol('icon-calls', 'calls'),
  aliasSymbol('agent-no-headset', 'human-agent-no-headset'),
  aliasSymbol('agent-headset', 'human-agent-headset')
];

const sprite = `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" style="display:none">\n${symbols.join('\n')}\n${aliases.join('\n')}\n</svg>\n`;
fs.writeFileSync(spritePath, sprite, 'utf8');

const css = `.icon{display:inline-flex;width:20px;height:20px;vertical-align:middle}.icon>svg{width:100%;height:100%;display:block}`;

const showcase = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Lead Recovery Icon Sprite Showcase</title>
<style>
:root{--bg:#101419;--card:#182028;--line:#2a3642;--text:#dbe7f3;--muted:#89a0b8;--accent:#4ec9b0}
*{box-sizing:border-box} body{margin:0;background:linear-gradient(160deg,#0f141a,#17222d);color:var(--text);font:14px/1.4 "Segoe UI",sans-serif}
.wrap{max-width:1280px;margin:0 auto;padding:24px}
h1{font-size:24px;margin:0 0 8px} p{color:var(--muted);margin:0 0 20px}
.toolbar{display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin-bottom:16px}
input{background:#0f1821;border:1px solid var(--line);border-radius:8px;padding:10px 12px;color:var(--text);min-width:260px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px}
.card{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:10px}
.demo{display:flex;align-items:center;gap:8px;margin-bottom:6px}
.name{font-size:12px;color:var(--muted);word-break:break-word}
.code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;color:#9bd3ff}
</style>
</head>
<body>
<div class="wrap">
<h1>SVG Sprite Showcase</h1>
<p>Use spans directly: <span class="code">&lt;span class="icon icon-call"&gt;&lt;/span&gt;</span></p>
<div class="toolbar"><input id="q" placeholder="Filter icons by name..."/></div>
<div id="grid" class="grid"></div>
</div>
<script>
const iconNames = ${JSON.stringify(iconNames, null, 2)};

function makeSvg(iconName){
  const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.setAttribute('viewBox','0 0 24 24');
  svg.setAttribute('aria-hidden','true');
  const use = document.createElementNS('http://www.w3.org/2000/svg','use');
  use.setAttribute('href', 'icon-sprite.svg#' + iconName);
  svg.appendChild(use);
  return svg;
}

function mountSpanIcons(root=document){
  root.querySelectorAll('span.icon').forEach((el)=>{
    if (el.querySelector('svg')) return;
    const cls = [...el.classList].find((c)=>c.startsWith('icon-') && c !== 'icon');
    if (!cls) return;
    const iconName = cls.replace(/^icon-/, '');
    el.appendChild(makeSvg(iconName));
  });
}

function renderGrid(filter=''){
  const grid = document.getElementById('grid');
  grid.innerHTML = '';
  const names = iconNames.filter((n)=>n.includes(filter.toLowerCase()));
  for (const name of names){
    const card = document.createElement('div');
    card.className='card';
    card.innerHTML = '<div class="demo"><span class="icon icon-' + name + '"></span><strong>' + name + '</strong></div><div class="name">&lt;span class="icon icon-' + name + '"&gt;&lt;/span&gt;</div>';
    grid.appendChild(card);
  }
  mountSpanIcons(grid);
}

document.getElementById('q').addEventListener('input', (e)=>renderGrid(e.target.value.trim()));
renderGrid();
mountSpanIcons();
</script>
</body>
</html>`;

fs.writeFileSync(showcasePath, showcase, 'utf8');

console.log(`Generated ${iconNames.length} symbols to ${spritePath}`);
console.log(`Generated showcase: ${showcasePath}`);
