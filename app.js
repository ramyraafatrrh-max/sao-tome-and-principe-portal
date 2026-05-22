/* Static docs app for GitHub Pages (hash routing).
   - Renders chapters from data/chapterX.json
   - Renders structured tables when node.table exists (table only)
   - Book Your Trip UI (optional)
   - Tabs are centered via CSS (.tabs { justify-content:center; })
*/

const EMBEDDED_CHAPTERS = [
  {"number": 1, "title": "Overview"},
  {"number": 2, "title": "PESTEL"},
  {"number": 3, "title": "Country Segmentation"},
  {"number": 4, "title": "Religious Overview"},
  {"number": 5, "title": "SWOT Analysis"},
  {"number": 6, "title": "Stakeholders Mapping"},
  {"number": 7, "title": "Biblical and Spiritual Mapping"},
  {"number": 8, "title": "Country Entry"},
  {"number": 9, "title": "Problems / Challenges"}
];

const state = {
  index: {
    country: { name: 'São Tomé and Príncipe', flag: 'assets/flag-stp.svg' },
    chapters: EMBEDDED_CHAPTERS,
    generatedAt: ''
  },
  chapter: null
};

const el = {
  countryName: document.getElementById('countryName'),
  flagImg: document.getElementById('flagImg'),
  generatedAt: document.getElementById('generatedAt'),
  viewTitle: document.getElementById('viewTitle'),
  viewSubtitle: document.getElementById('viewSubtitle'),
  breadcrumbs: document.getElementById('breadcrumbs'),
  chapterTabs: document.getElementById('chapterTabs'),
  sectionTabs: document.getElementById('sectionTabs'),
  subsectionTabs: document.getElementById('subsectionTabs'),
  content: document.getElementById('content'),
  refs: document.getElementById('refs'),

  // Book Your Trip (optional IDs in HTML)
  bookTripBtn: document.getElementById('bookTripBtn'),
  bookTripActions: document.getElementById('bookTripActions'),
  bookFlightsBtn: document.getElementById('bookFlightsBtn'),
  bookHotelsBtn: document.getElementById('bookHotelsBtn'),
  tripEmbed: document.getElementById('tripEmbed'),
};

let lastChapterForTripUI = null;

function escapeHtml(str){
  return String(str ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function linkify(text){
  const urlRegex = /(https?:\/\/[^\s)\]]+)/g;
  return escapeHtml(text).replace(urlRegex, (m) => `<a href="${m}" target="_blank" rel="noreferrer">${m}</a>`);
}

function closeTripUI(){
  if (el.bookTripActions) el.bookTripActions.classList.add('hidden');
  if (el.tripEmbed) {
    el.tripEmbed.innerHTML = '';
    el.tripEmbed.classList.add('hidden');
  }
}

function showTripEmbed(html){
  if (!el.tripEmbed) return;
  el.tripEmbed.innerHTML = html;
  el.tripEmbed.classList.remove('hidden');
}

function parseHash(){
  const h = (location.hash || '').replace(/^#\/?/, '');
  const parts = h.split('/').filter(Boolean);
  const route = { chapter: null, section: null, sub: null };
  for (let i=0;i<parts.length;i++){
    if (parts[i]==='chapter' && parts[i+1]) route.chapter = Number(parts[i+1]);
    if (parts[i]==='section' && parts[i+1]) route.section = parts[i+1];
    if (parts[i]==='sub' && parts[i+1]) route.sub = parts[i+1];
  }
  return route;
}

async function loadGeneratedAt(){
  try{
    const res = await fetch('data/index.json', { cache: 'no-store' });
    if (res.ok){
      const v = await res.json();
      if (v?.generatedAt){
        state.index.generatedAt = v.generatedAt;
        if (el.generatedAt) el.generatedAt.textContent = `Generated: ${v.generatedAt}`;
      }
    }
  } catch(e) {}
}

async function loadChapter(chapterNumber){
  if (!chapterNumber){ state.chapter = null; return; }
  try{
    const res = await fetch(`data/chapter${chapterNumber}.json`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Could not load chapter ${chapterNumber}`);
    state.chapter = await res.json();
  } catch(e){
    console.error(e);
    state.chapter = { number: chapterNumber, title: '', sections: [] };
    if (el.content) {
      el.content.innerHTML = `<p class="muted">Chapter data could not be loaded. Make sure the <code>data/</code> folder exists in GitHub Pages.</p>`;
    }
    if (el.refs) el.refs.innerHTML = '';
  }
}

function crumbs(items){
  if (!el.breadcrumbs) return;
  el.breadcrumbs.innerHTML = items.map((it, idx) => {
    const last = idx === items.length - 1;
    if (last) return `<span>${escapeHtml(it.label)}</span>`;
    return `<a href="${it.href}">${escapeHtml(it.label)}</a> <span style="opacity:.5">/</span> `;
  }).join('');
}

function renderTabs(container, tabs, activeHref){
  if (!container) return;
  container.innerHTML = '';
  if (!tabs || !tabs.length){
    container.style.display = 'none';
    return;
  }
  container.style.display = 'flex';
  for (const t of tabs){
    const btn = document.createElement('button');
    btn.className = 'tab' + (t.href === activeHref ? ' tab--active' : '');
    btn.type = 'button';
    btn.innerHTML = `<div class="tab__top">${escapeHtml(t.top)}</div>${t.sub ? `<div class="tab__sub">${escapeHtml(t.sub)}</div>` : ''}`;

    btn.addEventListener('click', () => {
      // Auto-close trip UI when user switches chapters
      if (container === el.chapterTabs) closeTripUI();
      location.hash = t.href;
    });

    container.appendChild(btn);
  }
}

function renderTextToHtml(text){
  if (!text) return '';
  const lines = String(text).split('\n');
  return lines.map((ln) => {
    if (ln.startsWith('### ')) return `<h3>${escapeHtml(ln.replace(/^###\s+/, ''))}</h3>`;
    if (ln.startsWith('- ')) return `<div>• ${linkify(ln.slice(2))}</div>`;
    if (ln.startsWith('• ')) return `<div>• ${linkify(ln.slice(2))}</div>`;
    return ln.trim() ? `<p>${linkify(ln)}</p>` : '';
  }).join('');
}

function renderContent(text){
  if (!el.content) return;
  if (!text){ el.content.innerHTML = ''; return; }
  el.content.innerHTML = renderTextToHtml(text);
}

function renderRefs(links){
  if (!el.refs) return;
  if (!links || !links.length){ el.refs.innerHTML = ''; return; }
  const rows = links.map((l,i) => `<tr><td>${i+1}</td><td><a href="${l}" target="_blank" rel="noreferrer">${l}</a></td></tr>`).join('');
  el.refs.innerHTML = `<h3>References</h3><table class="table"><thead><tr><th style="width:70px">#</th><th>Link</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function renderHtmlTable(table){
  if (!table || !Array.isArray(table.columns) || !Array.isArray(table.rows)) return '';
  const thead = `<thead><tr>${table.columns.map(c => `<th>${escapeHtml(c)}</th>`).join('')}</tr></thead>`;
  const tbody = `<tbody>${table.rows.map(row => {
    const tds = (row || []).map(cell => `<td>${linkify(String(cell ?? ''))}</td>`).join('');
    return `<tr>${tds}</tr>`;
  }).join('')}</tbody>`;
  return `<table class="dataTable">${thead}${tbody}</table>`;
}

function renderNode(node){
  if (!node){
    if (el.content) el.content.innerHTML = '';
    if (el.refs) el.refs.innerHTML = '';
    return;
  }
  if (node.table){
    if (el.content) el.content.innerHTML = renderHtmlTable(node.table);
  } else {
    renderContent(node.content);
  }
  renderRefs(node.references || []);
}

function findSection(chapter, sectionSlug){
  return (chapter?.sections || []).find(s => s.slug === sectionSlug);
}

function findSub(section, subSlug){
  return (section?.subsections || []).find(s => s.slug === subSlug);
}

// --- Book Your Trip actions (open new tabs) ---
function openSkyscannerFlights(){
  window.open('https://www.skyscanner.com/routes/cai/tms/cairo-to-sao-tome-is.html', '_blank', 'noopener,noreferrer');
}

function showHotelsMenu(){
  showTripEmbed(`
    <div class="widgetBox">
      <h3 style="margin-top:0">Hotels & Reviews</h3>
      <div class="tripActions" style="margin-top:10px">
        <button class="btnPrimary" id="openBookingHotels" type="button">Open Booking.com</button>
        <button class="btnSecondary" id="openTripadvisor" type="button">Open Tripadvisor</button>
      </div>
      <p class="muted" style="margin:10px 0 0">Opens in new tabs so the portal stays open.</p>
    </div>
  `);

  document.getElementById('openBookingHotels')?.addEventListener('click', () => {
    window.open('https://www.booking.com/searchresults.en-gb.html?ss=Sao%20Tome&group_adults=2&no_rooms=1', '_blank', 'noopener,noreferrer');
  });

  document.getElementById('openTripadvisor')?.addEventListener('click', () => {
    window.open('https://www.tripadvisor.com/Tourism-g294442-Sao_Tome_Sao_Tome_Island-Vacations.html', '_blank', 'noopener,noreferrer');
  });
}

async function render(){
  const r = parseHash();

  // Close Book Trip UI automatically when chapter changes via back/forward
  if (r.chapter !== lastChapterForTripUI){
    closeTripUI();
    lastChapterForTripUI = r.chapter;
  }

  const chapterTabs = (state.index.chapters || []).map(c => ({
    top: `Chapter ${c.number}`,
    sub: c.title,
    href: `#/chapter/${c.number}`
  }));

  renderTabs(el.chapterTabs, chapterTabs, r.chapter ? `#/chapter/${r.chapter}` : null);

  if (!r.chapter){
    if (el.viewTitle) el.viewTitle.textContent = 'Chapters';
    if (el.viewSubtitle) el.viewSubtitle.textContent = '';
    crumbs([{label:'Home', href:'#/'}]);
    if (el.sectionTabs) el.sectionTabs.style.display = 'none';
    if (el.subsectionTabs) el.subsectionTabs.style.display = 'none';
    if (el.content) el.content.innerHTML = '';
    if (el.refs) el.refs.innerHTML = '';
    return;
  }

  await loadChapter(r.chapter);

  const chMeta = (state.index.chapters || []).find(c => c.number === r.chapter);
  const secTabs = (state.chapter.sections || []).map(s => ({
    top: s.number,
    sub: s.title,
    href: `#/chapter/${r.chapter}/section/${s.slug}`
  }));

  if (!r.section){
    if (el.viewTitle) el.viewTitle.textContent = `Chapter ${r.chapter}: ${chMeta?.title || ''}`;
    if (el.viewSubtitle) el.viewSubtitle.textContent = '';
    crumbs([{label:'Home', href:'#/'},{label:`Chapter ${r.chapter}`, href:`#/chapter/${r.chapter}`}]);
    renderTabs(el.sectionTabs, secTabs, null);
    if (el.subsectionTabs) el.subsectionTabs.style.display = 'none';

    const sum = state.chapter.sections?.[0];
    if (sum && String(sum.number).endsWith('.0')) renderNode(sum);
    else renderNode(null);
    return;
  }

  const sec = findSection(state.chapter, r.section);
  if (!sec){
    location.hash = `#/chapter/${r.chapter}`;
    return;
  }

  if ((sec.subsections || []).length && !r.sub){
    location.hash = `#/chapter/${r.chapter}/section/${sec.slug}/sub/${sec.subsections[0].slug}`;
    return;
  }

  if (el.viewTitle) el.viewTitle.textContent = `${sec.number} — ${sec.title}`;
  if (el.viewSubtitle) el.viewSubtitle.textContent = '';
  crumbs([{label:'Home', href:'#/'},{label:`Chapter ${r.chapter}`, href:`#/chapter/${r.chapter}`},{label:sec.number, href:`#/chapter/${r.chapter}/section/${sec.slug}` }]);

  renderTabs(el.sectionTabs, secTabs, `#/chapter/${r.chapter}/section/${sec.slug}`);

  const subTabs = (sec.subsections || []).map(s => ({
    top: s.number,
    sub: s.title,
    href: `#/chapter/${r.chapter}/section/${sec.slug}/sub/${s.slug}`
  }));

  if (!subTabs.length){
    if (el.subsectionTabs) el.subsectionTabs.style.display = 'none';
    renderNode(sec);
    return;
  }

  renderTabs(el.subsectionTabs, subTabs, `#/chapter/${r.chapter}/section/${sec.slug}/sub/${r.sub}`);

  const sub = findSub(sec, r.sub);
  if (!sub){
    location.hash = `#/chapter/${r.chapter}/section/${sec.slug}/sub/${sec.subsections[0].slug}`;
    return;
  }

  if (el.viewTitle) el.viewTitle.textContent = `${sub.number} — ${sub.title}`;
  crumbs([
    {label:'Home', href:'#/'},
    {label:`Chapter ${r.chapter}`, href:`#/chapter/${r.chapter}`},
    {label:sec.number, href:`#/chapter/${r.chapter}/section/${sec.slug}`},
    {label:sub.number, href:`#/chapter/${r.chapter}/section/${sec.slug}/sub/${sub.slug}`}
  ]);

  renderNode(sub);
}

async function start(){
  if (el.countryName) el.countryName.textContent = state.index.country.name;
  if (el.flagImg) el.flagImg.src = state.index.country.flag;

  await loadGeneratedAt();

  // Book Your Trip handlers
  if (el.bookTripBtn && el.bookTripActions){
    el.bookTripBtn.addEventListener('click', () => {
      el.bookTripActions.classList.toggle('hidden');
      if (el.bookTripActions.classList.contains('hidden')) closeTripUI();
    });
  }

  if (el.bookFlightsBtn){
    el.bookFlightsBtn.addEventListener('click', () => {
      openSkyscannerFlights();
    });
  }

  if (el.bookHotelsBtn){
    el.bookHotelsBtn.addEventListener('click', () => {
      showHotelsMenu();
    });
  }

  window.addEventListener('hashchange', () => {
    render();
  });

  if (!location.hash) location.hash = '#/';
  await render();
}

start();
