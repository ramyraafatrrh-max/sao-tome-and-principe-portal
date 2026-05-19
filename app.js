/* Static docs app for GitHub Pages (hash routing).
   Supports optional structured tables via node.table = { columns:[], rows:[[]] }.
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
};

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
        el.generatedAt.textContent = `Generated: ${v.generatedAt}`;
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
    el.content.innerHTML = `<p class="muted">Chapter data could not be loaded. Make sure the <code>data/</code> folder exists in GitHub Pages.</p>`;
    el.refs.innerHTML = '';
  }
}

function crumbs(items){
  el.breadcrumbs.innerHTML = items.map((it, idx) => {
    const last = idx === items.length - 1;
    if (last) return `<span>${escapeHtml(it.label)}</span>`;
    return `<a href="${it.href}">${escapeHtml(it.label)}</a> <span style="opacity:.5">/</span> `;
  }).join('');
}

function renderTabs(container, tabs, activeHref){
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
    btn.addEventListener('click', () => { location.hash = t.href; });
    container.appendChild(btn);
  }
}

function renderContent(text){
  if (!text){ el.content.innerHTML = ''; return; }
  el.content.innerHTML = renderTextToHtml(text);
}

function renderTextToHtml(text){
  if (!text) return '';
  const lines = String(text).split('\n');
  return lines.map((ln) => {
    if (ln.startsWith('### ')) return `<h3>${escapeHtml(ln.replace(/^###\s+/, ''))}</h3>`;
    if (ln.startsWith('- ')) return `<div>• ${linkify(ln.slice(2))}</div>`;
    // allow inline lists formatted as "• "
    if (ln.startsWith('• ')) return `<div>• ${linkify(ln.slice(2))}</div>`;
    return ln.trim() ? `<p>${linkify(ln)}</p>` : '';
  }).join('');
}

function renderRefs(links){
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
    el.content.innerHTML = '';
    el.refs.innerHTML = '';
    return;
  }

  if (node.table){
    // If a structured table exists, render it as a true HTML table.
    // node.content can be used as an intro paragraph (optional).
    const intro = node.content ? `<div class="tableIntro">${renderTextToHtml(node.content)}</div>` : '';
    el.content.innerHTML = `${intro}${renderHtmlTable(node.table)}`;
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

async function render(){
  const r = parseHash();

  // Chapter tab bar
  const chapterTabs = (state.index.chapters || []).map(c => ({
    top: `Chapter ${c.number}`,
    sub: c.title,
    href: `#/chapter/${c.number}`
  }));

  renderTabs(el.chapterTabs, chapterTabs, r.chapter ? `#/chapter/${r.chapter}` : null);

  if (!r.chapter){
    el.viewTitle.textContent = 'Chapters';
    el.viewSubtitle.textContent = '';
    crumbs([{label:'Home', href:'#/'}]);
    el.sectionTabs.style.display = 'none';
    el.subsectionTabs.style.display = 'none';
    el.content.innerHTML = '';
    el.refs.innerHTML = '';
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
    el.viewTitle.textContent = `Chapter ${r.chapter}: ${chMeta?.title || ''}`;
    el.viewSubtitle.textContent = '';
    crumbs([{label:'Home', href:'#/'},{label:`Chapter ${r.chapter}`, href:`#/chapter/${r.chapter}` }]);
    renderTabs(el.sectionTabs, secTabs, null);
    el.subsectionTabs.style.display = 'none';

    // show summary if first section is .0
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

  // If section has subsections but no subsection selected yet, redirect to first
  if ((sec.subsections || []).length && !r.sub){
    location.hash = `#/chapter/${r.chapter}/section/${sec.slug}/sub/${sec.subsections[0].slug}`;
    return;
  }

  el.viewTitle.textContent = `${sec.number} — ${sec.title}`;
  el.viewSubtitle.textContent = '';
  crumbs([{label:'Home', href:'#/'},{label:`Chapter ${r.chapter}`, href:`#/chapter/${r.chapter}`},{label:sec.number, href:`#/chapter/${r.chapter}/section/${sec.slug}` }]);

  renderTabs(el.sectionTabs, secTabs, `#/chapter/${r.chapter}/section/${sec.slug}`);

  const subTabs = (sec.subsections || []).map(s => ({
    top: s.number,
    sub: s.title,
    href: `#/chapter/${r.chapter}/section/${sec.slug}/sub/${s.slug}`
  }));

  if (!subTabs.length){
    el.subsectionTabs.style.display = 'none';
    renderNode(sec);
    return;
  }

  renderTabs(el.subsectionTabs, subTabs, `#/chapter/${r.chapter}/section/${sec.slug}/sub/${r.sub}`);

  const sub = findSub(sec, r.sub);
  if (!sub){
    location.hash = `#/chapter/${r.chapter}/section/${sec.slug}/sub/${sec.subsections[0].slug}`;
    return;
  }

  el.viewTitle.textContent = `${sub.number} — ${sub.title}`;
  crumbs([
    {label:'Home', href:'#/'},
    {label:`Chapter ${r.chapter}`, href:`#/chapter/${r.chapter}`},
    {label:sec.number, href:`#/chapter/${r.chapter}/section/${sec.slug}`},
    {label:sub.number, href:`#/chapter/${r.chapter}/section/${sec.slug}/sub/${sub.slug}`}
  ]);

  renderNode(sub);
}

async function start(){
  el.countryName.textContent = state.index.country.name;
  el.flagImg.src = state.index.country.flag;
  await loadGeneratedAt();

  window.addEventListener('hashchange', () => render());
  if (!location.hash) location.hash = '#/';
  await render();
}

start();
