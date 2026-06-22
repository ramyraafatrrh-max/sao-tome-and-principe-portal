/* São Tomé and Príncipe Research Portal
   Flow:
   1) Landing screen with two buttons: St.Paul Member / Visitor
   2) St.Paul Member -> login screen with username/password + Login + Skip Login
   3) Skip Login/Login -> documentation portal
   4) Visitor -> visitor page with Past Events / Upcoming Events

   Notes:
   - This is frontend-only. Real username/password validation requires a backend/auth service.
   - Documentation content is still loaded from data/chapterX.json.
*/

const EMBEDDED_CHAPTERS = [
  { number: 1, title: "Overview" },
  { number: 2, title: "PESTEL" },
  { number: 3, title: "Country Segmentation" },
  { number: 4, title: "Religious Overview" },
  { number: 5, title: "SWOT Analysis" },
  { number: 6, title: "Stakeholders Mapping" },
  { number: 7, title: "Biblical and Spiritual Mapping" },
  { number: 8, title: "Country Entry" },
  { number: 9, title: "Problems / Challenges" }
];

const appRoot = document.getElementById('app');

const state = {
  country: { name: 'São Tomé and Príncipe', flag: 'assets/flag-stp.svg' },
  generatedAt: '',
  chapter: null,
  el: {}
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

function routeTo(hash){
  location.hash = hash;
}

function currentRoute(){
  const h = (location.hash || '#/').replace(/^#\/?/, '');
  const parts = h.split('/').filter(Boolean);
  return {
    raw: h,
    page: parts[0] || 'home',
    chapter: parts[0] === 'docs' && parts[1] === 'chapter' ? Number(parts[2]) : null,
    section: parts[0] === 'docs' ? getAfter(parts, 'section') : null,
    sub: parts[0] === 'docs' ? getAfter(parts, 'sub') : null,
    eventType: parts[0] === 'visitor' && parts[1] ? parts[1] : null
  };
}

function getAfter(parts, key){
  const i = parts.indexOf(key);
  return i >= 0 && parts[i+1] ? parts[i+1] : null;
}

function setApp(html){
  appRoot.innerHTML = html;
}

function heroHtml(subtitle = 'Research Portal'){
  return `
    <header class="banner">
      <div class="banner__glow banner__glow--a"></div>
      <div class="banner__glow banner__glow--b"></div>
      <div class="banner__inner">
        <div class="flag"><img src="${state.country.flag}" alt="Flag of São Tomé and Príncipe"></div>
        <div>
          <div class="eyebrow">${escapeHtml(subtitle)}</div>
          <h1>${escapeHtml(state.country.name)}</h1>
          ${state.generatedAt ? `<p class="muted">Generated: ${escapeHtml(state.generatedAt)}</p>` : ''}
        </div>
      </div>
    </header>`;
}

async function loadGeneratedAt(){
  try{
    const res = await fetch('data/index.json', { cache: 'no-store' });
    if (res.ok){
      const v = await res.json();
      if (v?.generatedAt) state.generatedAt = v.generatedAt;
    }
  } catch(e) {}
}

async function loadChapter(n){
  if (!n){ state.chapter = null; return; }
  try{
    const res = await fetch(`data/chapter${n}.json`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Could not load chapter ${n}`);
    state.chapter = await res.json();
  } catch(e){
    console.error(e);
    state.chapter = { number:n, title:'', sections:[] };
  }
}

function renderLanding(){
  setApp(`
    ${heroHtml('Welcome')}
    <main class="container landingWrap">
      <section class="panel choicePanel">
        <h2 class="centerTitle">Choose Portal Access</h2>
        <p class="muted centerText">Select how you would like to enter the São Tomé and Príncipe portal.</p>
        <div class="mainChoiceGrid">
          <button id="memberBtn" class="choiceCard" type="button">
            <span class="choiceTitle">St.Paul Member</span>
            <span class="choiceSub">Login or continue to documentation</span>
          </button>
          <button id="visitorBtn" class="choiceCard" type="button">
            <span class="choiceTitle">Visitor</span>
            <span class="choiceSub">View past and upcoming events</span>
          </button>
        </div>
      </section>
    </main>
  `);

  document.getElementById('memberBtn')?.addEventListener('click', () => routeTo('#/member-login'));
  document.getElementById('visitorBtn')?.addEventListener('click', () => routeTo('#/visitor'));
}

function renderMemberLogin(){
  setApp(`
    ${heroHtml('St.Paul Member Login')}
    <main class="container loginWrap">
      <section class="panel loginPanel">
        <button class="backBtn" type="button" id="backHome">← Back</button>
        <h2>Member Login</h2>
        <p class="muted">Enter your username and password to continue, or skip login to open the documentation portal.</p>
        <form id="loginForm" class="loginForm">
          <label>
            <span>Username</span>
            <input id="username" name="username" type="text" autocomplete="username" placeholder="Enter username" />
          </label>
          <label>
            <span>Password</span>
            <input id="password" name="password" type="password" autocomplete="current-password" placeholder="Enter password" />
          </label>
          <button class="btnPrimary" type="submit">Login</button>
          <button class="btnGhost" id="skipLogin" type="button">Skip Login</button>
          <p class="muted smallNote">Note: this is a front-end login screen only. Real authentication requires backend setup.</p>
        </form>
      </section>
    </main>
  `);

  document.getElementById('backHome')?.addEventListener('click', () => routeTo('#/'));
  document.getElementById('skipLogin')?.addEventListener('click', () => routeTo('#/docs'));
  document.getElementById('loginForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    routeTo('#/docs');
  });
}

function renderVisitorHome(){
  setApp(`
    ${heroHtml('Visitor Portal')}
    <main class="container landingWrap">
      <section class="panel choicePanel">
        <button class="backBtn" type="button" id="backHome">← Back</button>
        <h2 class="centerTitle">Visitor Events</h2>
        <p class="muted centerText">Explore St.Paul related events for São Tomé and Príncipe.</p>
        <div class="mainChoiceGrid twoButtons">
          <button id="pastEventsBtn" class="choiceCard" type="button">
            <span class="choiceTitle">Past Events</span>
            <span class="choiceSub">View completed activities</span>
          </button>
          <button id="upcomingEventsBtn" class="choiceCard" type="button">
            <span class="choiceTitle">Upcoming Events</span>
            <span class="choiceSub">View future activities</span>
          </button>
        </div>
      </section>
    </main>
  `);

  document.getElementById('backHome')?.addEventListener('click', () => routeTo('#/'));
  document.getElementById('pastEventsBtn')?.addEventListener('click', () => routeTo('#/visitor/past'));
  document.getElementById('upcomingEventsBtn')?.addEventListener('click', () => routeTo('#/visitor/upcoming'));
}

function renderEventsPage(type){
  const title = type === 'past' ? 'Past Events' : 'Upcoming Events';
  const message = type === 'past'
    ? 'Past events will be listed here once event data is added.'
    : 'Upcoming events will be listed here once event data is added.';

  setApp(`
    ${heroHtml('Visitor Portal')}
    <main class="container">
      <section class="panel">
        <button class="backBtn" type="button" id="backVisitor">← Back to Visitor</button>
        <h2>${escapeHtml(title)}</h2>
        <div class="eventEmpty">
          <h3>${escapeHtml(title)}</h3>
          <p class="muted">${escapeHtml(message)}</p>
        </div>
      </section>
    </main>
  `);

  document.getElementById('backVisitor')?.addEventListener('click', () => routeTo('#/visitor'));
}

function docsShell(){
  setApp(`
    ${heroHtml('Documentation')}
    <main class="container">
      <section class="panel">
        <div class="panel__head">
          <div>
            <h2 id="viewTitle">Chapters</h2>
            <p id="viewSubtitle" class="muted"></p>
          </div>
          <div id="breadcrumbs" class="crumbs"></div>
        </div>

        <div class="tripBar">
          <button id="bookTripBtn" class="btnPrimary" type="button">Book Your Trip</button>
          <div id="bookTripActions" class="tripActions hidden">
            <button id="bookFlightsBtn" class="btnSecondary" type="button">Book Flights</button>
            <button id="bookHotelsBtn" class="btnSecondary" type="button">Book Hotels</button>
          </div>
          <div id="tripEmbed" class="tripEmbed hidden"></div>
        </div>

        <div id="chapterTabs" class="tabs"></div>
        <div id="sectionTabs" class="tabs tabs--secondary"></div>
        <div id="subsectionTabs" class="tabs tabs--secondary"></div>
        <article id="content" class="content"></article>
        <section id="refs" class="refs"></section>
      </section>
      <footer class="footer">São Tomé and Príncipe Research Portal</footer>
    </main>
  `);

  state.el = {
    viewTitle: document.getElementById('viewTitle'),
    viewSubtitle: document.getElementById('viewSubtitle'),
    breadcrumbs: document.getElementById('breadcrumbs'),
    chapterTabs: document.getElementById('chapterTabs'),
    sectionTabs: document.getElementById('sectionTabs'),
    subsectionTabs: document.getElementById('subsectionTabs'),
    content: document.getElementById('content'),
    refs: document.getElementById('refs'),
    bookTripBtn: document.getElementById('bookTripBtn'),
    bookTripActions: document.getElementById('bookTripActions'),
    bookFlightsBtn: document.getElementById('bookFlightsBtn'),
    bookHotelsBtn: document.getElementById('bookHotelsBtn'),
    tripEmbed: document.getElementById('tripEmbed')
  };

  state.el.bookTripBtn?.addEventListener('click', () => {
    state.el.bookTripActions.classList.toggle('hidden');
    if (state.el.bookTripActions.classList.contains('hidden')) closeDocsTripUI();
  });

  state.el.bookFlightsBtn?.addEventListener('click', () => {
    window.open('https://www.skyscanner.com/routes/cai/tms/cairo-to-sao-tome-is.html', '_blank', 'noopener,noreferrer');
  });

  state.el.bookHotelsBtn?.addEventListener('click', showDocsHotelsMenu);
}

function closeDocsTripUI(){
  const e = state.el;
  if (e.bookTripActions) e.bookTripActions.classList.add('hidden');
  if (e.tripEmbed){
    e.tripEmbed.innerHTML = '';
    e.tripEmbed.classList.add('hidden');
  }
}

function showDocsHotelsMenu(){
  const e = state.el;
  if (!e.tripEmbed) return;
  e.tripEmbed.innerHTML = `
    <div class="widgetBox">
      <h3 style="margin-top:0">Hotels & Reviews</h3>
      <div class="tripActions" style="margin-top:10px">
        <button class="btnPrimary" id="openBookingHotels" type="button">Open Booking.com</button>
        <button class="btnSecondary" id="openTripadvisor" type="button">Open Tripadvisor</button>
      </div>
      <p class="muted" style="margin:10px 0 0">Opens in new tabs so the portal stays open.</p>
    </div>
  `;
  e.tripEmbed.classList.remove('hidden');

  document.getElementById('openBookingHotels')?.addEventListener('click', () => {
    window.open('https://www.booking.com/searchresults.en-gb.html?ss=Sao%20Tome&group_adults=2&no_rooms=1', '_blank', 'noopener,noreferrer');
  });

  document.getElementById('openTripadvisor')?.addEventListener('click', () => {
    window.open('https://www.tripadvisor.com/Tourism-g294442-Sao_Tome_Sao_Tome_Island-Vacations.html', '_blank', 'noopener,noreferrer');
  });
}

function docsCrumbs(items){
  const e = state.el;
  e.breadcrumbs.innerHTML = items.map((it, idx) => {
    const last = idx === items.length - 1;
    if (last) return `<span>${escapeHtml(it.label)}</span>`;
    return `<a href="${it.href}">${escapeHtml(it.label)}</a> <span style="opacity:.5">/</span> `;
  }).join('');
}

function docsRenderTabs(container, tabs, activeHref){
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
      if (container === state.el.chapterTabs) closeDocsTripUI();
      routeTo(t.href);
    });
    container.appendChild(btn);
  }
}

function textToHtml(text){
  if (!text) return '';
  return String(text).split('\n').map((ln) => {
    if (ln.startsWith('### ')) return `<h3>${escapeHtml(ln.replace(/^###\s+/, ''))}</h3>`;
    if (ln.startsWith('- ')) return `<div>• ${linkify(ln.slice(2))}</div>`;
    if (ln.startsWith('• ')) return `<div>• ${linkify(ln.slice(2))}</div>`;
    return ln.trim() ? `<p>${linkify(ln)}</p>` : '';
  }).join('');
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

function docsRenderRefs(links){
  const e = state.el;
  if (!links || !links.length){ e.refs.innerHTML = ''; return; }
  const rows = links.map((l,i) => `<tr><td>${i+1}</td><td><a href="${l}" target="_blank" rel="noreferrer">${l}</a></td></tr>`).join('');
  e.refs.innerHTML = `<h3>References</h3><table class="table"><thead><tr><th style="width:70px">#</th><th>Link</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function docsRenderNode(node){
  const e = state.el;
  if (!node){
    e.content.innerHTML = '';
    e.refs.innerHTML = '';
    return;
  }
  e.content.innerHTML = node.table ? renderHtmlTable(node.table) : textToHtml(node.content);
  docsRenderRefs(node.references || []);
}

function findSection(chapter, sectionSlug){
  return (chapter?.sections || []).find(s => s.slug === sectionSlug);
}

function findSub(section, subSlug){
  return (section?.subsections || []).find(s => s.slug === subSlug);
}

async function renderDocs(route){
  docsShell();
  const e = state.el;

  const chapterTabs = EMBEDDED_CHAPTERS.map(c => ({
    top: `Chapter ${c.number}`,
    sub: c.title,
    href: `#/docs/chapter/${c.number}`
  }));

  docsRenderTabs(e.chapterTabs, chapterTabs, route.chapter ? `#/docs/chapter/${route.chapter}` : null);

  if (!route.chapter){
    e.viewTitle.textContent = 'Chapters';
    e.viewSubtitle.textContent = '';
    docsCrumbs([{label:'Home', href:'#/'}, {label:'Documentation', href:'#/docs'}]);
    e.sectionTabs.style.display = 'none';
    e.subsectionTabs.style.display = 'none';
    docsRenderNode(null);
    return;
  }

  await loadChapter(route.chapter);

  const chMeta = EMBEDDED_CHAPTERS.find(c => c.number === route.chapter);
  const secTabs = (state.chapter.sections || []).map(s => ({
    top: s.number,
    sub: s.title,
    href: `#/docs/chapter/${route.chapter}/section/${s.slug}`
  }));

  if (!route.section){
    e.viewTitle.textContent = `Chapter ${route.chapter}: ${chMeta?.title || ''}`;
    e.viewSubtitle.textContent = '';
    docsCrumbs([{label:'Home', href:'#/'}, {label:'Documentation', href:'#/docs'}, {label:`Chapter ${route.chapter}`, href:`#/docs/chapter/${route.chapter}`}]);
    docsRenderTabs(e.sectionTabs, secTabs, null);
    e.subsectionTabs.style.display = 'none';
    const sum = state.chapter.sections?.[0];
    if (sum && String(sum.number).endsWith('.0')) docsRenderNode(sum);
    else docsRenderNode(null);
    return;
  }

  const sec = findSection(state.chapter, route.section);
  if (!sec){ routeTo(`#/docs/chapter/${route.chapter}`); return; }

  if ((sec.subsections || []).length && !route.sub){
    routeTo(`#/docs/chapter/${route.chapter}/section/${sec.slug}/sub/${sec.subsections[0].slug}`);
    return;
  }

  e.viewTitle.textContent = `${sec.number} — ${sec.title}`;
  e.viewSubtitle.textContent = '';
  docsCrumbs([{label:'Home', href:'#/'}, {label:'Documentation', href:'#/docs'}, {label:`Chapter ${route.chapter}`, href:`#/docs/chapter/${route.chapter}`}, {label:sec.number, href:`#/docs/chapter/${route.chapter}/section/${sec.slug}`}]);
  docsRenderTabs(e.sectionTabs, secTabs, `#/docs/chapter/${route.chapter}/section/${sec.slug}`);

  const subTabs = (sec.subsections || []).map(s => ({
    top: s.number,
    sub: s.title,
    href: `#/docs/chapter/${route.chapter}/section/${sec.slug}/sub/${s.slug}`
  }));

  if (!subTabs.length){
    e.subsectionTabs.style.display = 'none';
    docsRenderNode(sec);
    return;
  }

  docsRenderTabs(e.subsectionTabs, subTabs, `#/docs/chapter/${route.chapter}/section/${sec.slug}/sub/${route.sub}`);

  const sub = findSub(sec, route.sub);
  if (!sub){
    routeTo(`#/docs/chapter/${route.chapter}/section/${sec.slug}/sub/${sec.subsections[0].slug}`);
    return;
  }

  e.viewTitle.textContent = `${sub.number} — ${sub.title}`;
  docsCrumbs([{label:'Home', href:'#/'}, {label:'Documentation', href:'#/docs'}, {label:`Chapter ${route.chapter}`, href:`#/docs/chapter/${route.chapter}`}, {label:sec.number, href:`#/docs/chapter/${route.chapter}/section/${sec.slug}`}, {label:sub.number, href:`#/docs/chapter/${route.chapter}/section/${sec.slug}/sub/${sub.slug}`}]);

  docsRenderNode(sub);
}

async function render(){
  const route = currentRoute();
  await loadGeneratedAt();

  if (route.page === 'home') return renderLanding();
  if (route.page === 'member-login') return renderMemberLogin();
  if (route.page === 'docs') return renderDocs(route);
  if (route.page === 'visitor' && !route.eventType) return renderVisitorHome();
  if (route.page === 'visitor' && ['past','upcoming'].includes(route.eventType)) return renderEventsPage(route.eventType);

  renderLanding();
}

window.addEventListener('hashchange', render);
if (!location.hash) location.hash = '#/';
render();
