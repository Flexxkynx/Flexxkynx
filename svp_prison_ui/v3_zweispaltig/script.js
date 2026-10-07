let maxTime = 0;
let useSHud = true;
let locale = {};
let currentPrisoners = [];
let prisonHistory = [];
let activeTab = 'current';
let selected = { current: 0, history: 0 };
let visible = [];

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

    $('alt-label').textContent = t('time_remaining', 'Restzeit');
    $('hint-nav').textContent = t('hint_select', 'auswählen');
    $('hint-close').textContent = t('hint_close', 'schließen');

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
    const isCurrent = activeTab === 'current';
    const container = isCurrent ? $('current-prisoners') : $('history-list');

    visible = isCurrent
        ? currentPrisoners.filter((p) => hit(p.name, p.reason, p.jailedBy))
        : prisonHistory.filter((h) => hit(h.playerName, h.reason, h.jailedBy, h.releasedBy));

    selected[activeTab] = Math.min(selected[activeTab], Math.max(0, visible.length - 1));
    container.innerHTML = '';

    if (visible.length === 0) {
        const empty = term ? t('no_results', 'Keine Treffer')
            : isCurrent ? t('no_current', 'Derzeit sitzt niemand ein') : t('no_history', 'Noch keine Entlassungen');
        container.innerHTML = `<div class="no-data">${empty}</div>`;
        $('detail').innerHTML = `<div class="detail-empty">${t('nothing_selected', 'Kein Eintrag ausgewählt')}</div>`;
        return;
    }

    visible.forEach((entry, i) => {
        const item = isCurrent ? prisonerItem(entry) : historyItem(entry);
        item.classList.toggle('selected', i === selected[activeTab]);
        item.addEventListener('click', () => select(i));
        container.appendChild(item);
    });

    renderDetail();
}

function select(i) {
    if (i < 0 || i >= visible.length) return;
    selected[activeTab] = i;
    const items = document.querySelectorAll('.tab-content.active .item');
    items.forEach((el, n) => el.classList.toggle('selected', n === i));
    items[i].scrollIntoView({ block: 'nearest' });
    renderDetail();
}

function served(p) {
    return p.totalTime > 0 ? clamp((1 - p.timeRemaining / p.totalTime) * 100) : 0;
}

function prisonerItem(p) {
    const item = document.createElement('button');
    item.className = 'item' + (p.timeRemaining <= 5 ? ' ending' : '');
    item.innerHTML = `
        <div class="item-top">
            <span class="item-name">${esc(p.name)}</span>
            <span class="item-time">${formatTime(p.timeRemaining)}</span>
        </div>
        <div class="item-sub">${esc(p.reason)}</div>
        <div class="item-bar"><span style="width:${served(p)}%"></span></div>`;
    return item;
}

function historyItem(h) {
    const item = document.createElement('button');
    item.className = 'item';
    item.innerHTML = `
        <div class="item-top">
            <span class="item-name">${esc(h.playerName)}</span>
            <span class="item-time">${formatDate(h.releasedAt)}</span>
        </div>
        <div class="item-sub">${esc(h.reason)}</div>
        <div class="item-gap"></div>`;
    return item;
}

function fact(label, value) {
    return `<div class="fact"><dt>${label}</dt><dd>${value}</dd></div>`;
}

function renderDetail() {
    const entry = visible[selected[activeTab]];
    const detail = $('detail');
    if (!entry) return;

    if (activeTab === 'current') {
        const p = entry;
        const done = p.totalTime - p.timeRemaining;
        detail.innerHTML = `
            <span class="status">${t('status_jailed', 'In Haft')}</span>
            <h2 class="detail-name">${esc(p.name)}</h2>
            <div class="big">
                <div class="big-label">${t('time_remaining', 'Restzeit')}</div>
                <div class="big-value${p.timeRemaining <= 5 ? ' ending' : ''}">${formatTime(p.timeRemaining)}</div>
                <div class="big-bar"><span style="width:${served(p)}%"></span></div>
                <div class="big-meta">
                    <span>${formatTime(done)} ${t('served', 'verbüßt')}</span>
                    <span>${t('total_time', 'Strafe')} ${formatTime(p.totalTime)}</span>
                </div>
            </div>
            <dl class="facts">
                ${fact(t('jailed_by', 'Eingesperrt von'), esc(p.jailedBy))}
                ${fact(t('jailed_at', 'Haftbeginn'), `${formatDate(p.jailedAt)} <span class="dim">· ${absDate(p.jailedAt)}</span>`)}
            </dl>
            <div class="reason">
                <h3>${t('reason', 'Grund')}</h3>
                <p>${esc(p.reason)}</p>
            </div>
            <div class="actions"></div>`;

        if (p.canRelease) {
            detail.querySelector('.actions').appendChild(releaseButton(p.identifier));
        }
    } else {
        const h = entry;
        detail.innerHTML = `
            <span class="status released">${t('status_released', 'Entlassen')}</span>
            <h2 class="detail-name">${esc(h.playerName)}</h2>
            <div class="big">
                <div class="big-label">${t('release_type', 'Art der Entlassung')}</div>
                <div class="big-value">${getReleaseTypeLabel(h.releaseType)}</div>
            </div>
            <dl class="facts">
                ${fact(t('total_time', 'Strafe'), formatTime(h.totalTime))}
                ${fact(t('released_by', 'Entlassen von'), h.releasedBy ? esc(h.releasedBy) : '—')}
                ${fact(t('jailed_by', 'Eingesperrt von'), esc(h.jailedBy))}
                ${fact(t('jailed_at', 'Haftbeginn'), absDate(h.jailedAt))}
                ${fact(t('released_at', 'Entlassen am'), absDate(h.releasedAt))}
            </dl>
            <div class="reason">
                <h3>${t('reason', 'Grund')}</h3>
                <p>${esc(h.reason)}</p>
            </div>`;
    }
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

$('search').addEventListener('input', () => {
    selected[activeTab] = 0;
    render();
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !$('prisoner-management').classList.contains('hidden')) {
        e.preventDefault();
        closeManagementUI();
    }
    if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && !$('prisoner-management').classList.contains('hidden')) {
        e.preventDefault();
        select(selected[activeTab] + (e.key === 'ArrowDown' ? 1 : -1));
    }
});
