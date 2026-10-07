let maxTime = 0;
let useSHud = true;
let locale = {};
let currentPrisoners = [];
let prisonHistory = [];
let activeTab = 'current';

const $ = (id) => document.getElementById(id);
const t = (key, fallback) => locale[key] || fallback;

window.addEventListener('message', (event) => {
    const data = event.data || {};

    switch (data.action) {
        case 'showPrisonHUD':
            showHud(data);
            break;
        case 'updatePrisonTime':
            updateTimer(data.time);
            break;
        case 'openManagementUI':
            locale = data.locale || {};
            currentPrisoners = data.currentPrisoners || [];
            prisonHistory = data.history || [];
            openManagementUI();
            break;
        case 'closeManagementUI':
            closeManagementUI();
            break;
    }
});

// ---------- HUD ----------

function showHud(data) {
    useSHud = data.useSHud !== undefined ? data.useSHud : true;

    const minimal = $('prison-hud-minimal');
    const alt = $('prison-hud-alternative');

    if (!data.show) {
        [minimal, alt].forEach((el) => el.classList.add('hidden'));
        return;
    }

    maxTime = data.maxTime || 0;
    minimal.classList.toggle('hidden', !useSHud);
    alt.classList.toggle('hidden', useSHud);
    updateTimer(data.time || 0);
}

function updateTimer(seconds) {
    seconds = Math.max(0, seconds || 0);

    const text = `${pad(Math.floor(seconds / 60))}:${pad(seconds % 60)}`;
    const served = maxTime > 0 ? ((maxTime - seconds) / maxTime) * 100 : null;
    const hud = useSHud ? $('prison-hud-minimal') : $('prison-hud-alternative');

    if (useSHud) {
        $('time-display-minimal').textContent = text;
        if (served !== null) $('time-bar-minimal').style.width = `${served}%`;
    } else {
        $('time-display-alt').textContent = text;
        if (served !== null) {
            $('time-bar-alt').style.width = `${served}%`;
            $('alt-percent').textContent = `${Math.floor(served)} % ${t('served', 'verbüßt')}`;
        }
    }

    hud.classList.toggle('alert', seconds <= 60);
}

function pad(n) {
    return String(n).padStart(2, '0');
}

// ---------- Verwaltung ----------

function openManagementUI() {
    $('ui-title').textContent = t('management_title', 'Gefängnisverwaltung');
    $('tab-current').textContent = t('tab_current', 'Inhaftiert');
    $('tab-history').textContent = t('tab_history', 'Entlassungen');
    $('search').placeholder = t('search_placeholder', 'Name, Grund oder Beamter …');
    $('count-current').textContent = currentPrisoners.length;
    $('count-history').textContent = prisonHistory.length;

    $('head-current').innerHTML = `
        <div>${t('prisoner', 'Häftling')}</div>
        <div>${t('time_remaining', 'Restzeit')}</div>
        <div>${t('total_time', 'Strafe')}</div>
        <div>${t('jailed_by', 'Eingesperrt von')}</div>
        <div>${t('jailed_at', 'Seit')}</div>
        <div></div>`;

    $('head-history').innerHTML = `
        <div>${t('prisoner', 'Häftling')}</div>
        <div>${t('total_time', 'Strafe')}</div>
        <div>${t('jailed_by', 'Eingesperrt von')}</div>
        <div>${t('released_at', 'Entlassen')}</div>
        <div>${t('release_type', 'Art')}</div>`;

    $('prisoner-management').classList.remove('hidden');
    render();
}

function closeManagementUI() {
    const ui = $('prisoner-management');
    if (ui.classList.contains('hidden')) return;
    ui.classList.add('hidden');

    fetch(`https://${GetParentResourceName()}/closeUI`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
    }).catch(() => {});
}

function switchTab(tab) {
    activeTab = tab;
    document.querySelectorAll('.tab-btn').forEach((b) => b.classList.toggle('active', b.dataset.tab === tab));
    document.querySelectorAll('.tab-content').forEach((c) => c.classList.toggle('active', c.id === `content-${tab}`));
    render();
}

function render() {
    const term = $('search').value.trim().toLowerCase();
    const hit = (...values) => !term || values.some((v) => v && String(v).toLowerCase().includes(term));

    if (activeTab === 'current') {
        const list = currentPrisoners.filter((p) => hit(p.name, p.reason, p.jailedBy));
        fill($('current-prisoners'), list, prisonerRow, term ? t('no_results', 'Keine Treffer') : t('no_current', 'Derzeit sitzt niemand ein'));
    } else {
        const list = prisonHistory.filter((h) => hit(h.playerName, h.reason, h.jailedBy, h.releasedBy));
        fill($('history-list'), list, historyRow, term ? t('no_results', 'Keine Treffer') : t('no_history', 'Noch keine Entlassungen'));
    }
}

function fill(container, items, build, emptyText) {
    container.innerHTML = '';
    if (items.length === 0) {
        container.innerHTML = `<div class="no-data">${emptyText}</div>`;
        return;
    }
    items.forEach((item) => container.appendChild(build(item)));
}

function prisonerRow(p) {
    const row = document.createElement('div');
    const served = p.totalTime > 0 ? clamp((1 - p.timeRemaining / p.totalTime) * 100) : 0;

    row.className = 'row grid-current' + (p.timeRemaining <= 5 ? ' ending' : '');
    row.innerHTML = `
        <div class="cell">
            <span class="name">${esc(p.name)}</span>
            <span class="reason" title="${esc(p.reason)}">${esc(p.reason)}</span>
        </div>
        <div class="cell cell-time">
            <span class="num">${formatTime(p.timeRemaining)}</span>
            <div class="bar"><span style="width:${served}%"></span></div>
        </div>
        <div class="cell num muted">${formatTime(p.totalTime)}</div>
        <div class="cell">${esc(p.jailedBy)}</div>
        <div class="cell muted" title="${absDate(p.jailedAt)}">${formatDate(p.jailedAt)}</div>
        <div class="cell cell-action"></div>`;

    if (p.canRelease) {
        row.querySelector('.cell-action').appendChild(releaseButton(p.identifier));
    }
    return row;
}

function historyRow(h) {
    const row = document.createElement('div');
    row.className = 'row grid-history';
    row.innerHTML = `
        <div class="cell">
            <span class="name">${esc(h.playerName)}</span>
            <span class="reason" title="${esc(h.reason)}">${esc(h.reason)}</span>
        </div>
        <div class="cell num muted">${formatTime(h.totalTime)}</div>
        <div class="cell">
            ${esc(h.jailedBy)}
            <span class="sub" title="${absDate(h.jailedAt)}">${formatDate(h.jailedAt)}</span>
        </div>
        <div class="cell muted" title="${absDate(h.releasedAt)}">${formatDate(h.releasedAt)}</div>
        <div class="cell">
            <span class="tag ${esc(h.releaseType)}">${getReleaseTypeLabel(h.releaseType)}</span>
            ${h.releasedBy ? `<span class="sub">${esc(h.releasedBy)}</span>` : ''}
        </div>`;
    return row;
}

// Erster Klick fragt nach, zweiter Klick entlässt.
function releaseButton(identifier) {
    const btn = document.createElement('button');
    const label = t('release', 'Entlassen');
    let timer = null;

    btn.className = 'release-btn';
    btn.textContent = label;
    btn.addEventListener('click', () => {
        if (!btn.classList.contains('armed')) {
            btn.classList.add('armed');
            btn.textContent = t('release_confirm', 'Wirklich?');
            timer = setTimeout(() => {
                btn.classList.remove('armed');
                btn.textContent = label;
            }, 3000);
            return;
        }
        clearTimeout(timer);
        btn.disabled = true;
        btn.textContent = '…';
        releasePrisoner(identifier);
    });
    return btn;
}

function releasePrisoner(identifier) {
    fetch(`https://${GetParentResourceName()}/releasePrisoner`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier })
    }).catch(() => {});
}

// ---------- Formatierung ----------

function formatTime(minutes) {
    minutes = Math.max(0, Math.round(minutes || 0));
    const min = t('minutes', 'min');
    const h = t('hours', 'h');

    if (minutes < 60) return `${minutes} ${min}`;
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    return rest === 0 ? `${hours} ${h}` : `${hours} ${h} ${rest} ${min}`;
}

function formatDate(timestamp) {
    const date = new Date(timestamp);
    const minutes = Math.floor((Date.now() - date) / 60000);

    if (minutes < 1) return t('just_now', 'gerade eben');
    if (minutes < 60) return ago(minutes, 'minutes_ago', 'Min.');
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return ago(hours, 'hours_ago', 'Std.');
    const days = Math.floor(hours / 24);
    if (days < 7) return ago(days, 'days_ago', days === 1 ? 'Tag' : 'Tagen');
    return absDate(timestamp);
}

function ago(n, key, unit) {
    return locale[key] ? `${n} ${locale[key]}` : `vor ${n} ${unit}`;
}

function absDate(timestamp) {
    const d = new Date(timestamp);
    if (isNaN(d)) return '';
    return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}, ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function getReleaseTypeLabel(type) {
    switch (type) {
        case 'auto': return t('release_auto', 'Zeit abgesessen');
        case 'officer': return t('release_officer', 'Durch Beamten');
        case 'manual': return t('release_manual', 'Manuell');
        default: return esc(type);
    }
}

function clamp(v) {
    return Math.min(100, Math.max(0, v));
}

function esc(text) {
    return String(text ?? '').replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m]));
}

function GetParentResourceName() {
    const host = window.location && window.location.hostname;
    if (host) return host.startsWith('cfx-nui-') ? host.substring(8) : host;
    return 'ss-prison';
}

// ---------- Eingaben ----------

document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

$('search').addEventListener('input', render);

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !$('prisoner-management').classList.contains('hidden')) {
        e.preventDefault();
        closeManagementUI();
    }
});
