let maxTime = 0;
let currentTime = 0;
let useSHud = true; // Default
let locale = {}; // Store locale strings
let currentPrisoners = [];
let prisonHistory = [];

window.addEventListener('message', (event) => {
    const data = event.data;

    if (data.action === 'showPrisonHUD') {
        useSHud = data.useSHud !== undefined ? data.useSHud : true;
        
        const hudMinimal = document.getElementById('prison-hud-minimal');
        const hudAlt = document.getElementById('prison-hud-alternative');
        
        if (data.show) {
            maxTime = data.maxTime || 0;
            currentTime = data.time || 0;
            
            if (useSHud) {
                hudMinimal.classList.remove('hidden');
                hudAlt.classList.add('hidden');
            } else {
                hudAlt.classList.remove('hidden');
                hudMinimal.classList.add('hidden');
            }
            
            updateTimer(data.time);
            
            // Alert styling for last minute
            const activeHud = useSHud ? hudMinimal : hudAlt;
            if (data.time <= 60) {
                activeHud.classList.add('alert');
            } else {
                activeHud.classList.remove('alert');
            }
        } else {
            hudMinimal.classList.add('hidden');
            hudAlt.classList.add('hidden');
            hudMinimal.classList.remove('alert');
            hudAlt.classList.remove('alert');
        }
    }

    if (data.action === 'updatePrisonTime') {
        currentTime = data.time;
        updateTimer(data.time);
        
        // Alert styling for last minute
        const hudMinimal = document.getElementById('prison-hud-minimal');
        const hudAlt = document.getElementById('prison-hud-alternative');
        const activeHud = useSHud ? hudMinimal : hudAlt;
        
        if (data.time <= 60) {
            activeHud.classList.add('alert');
        } else {
            activeHud.classList.remove('alert');
        }
    }

    if (data.action === 'openManagementUI') {
        locale = data.locale || {};
        currentPrisoners = data.currentPrisoners || [];
        prisonHistory = data.history || [];
        openManagementUI();
    }

    if (data.action === 'closeManagementUI') {
        closeManagementUI();
    }
});

function updateTimer(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const timeText = `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    
    if (useSHud) {
        // Update minimal style
        const timeDisplay = document.getElementById('time-display-minimal');
        timeDisplay.textContent = timeText;
        
        const progressBar = document.getElementById('time-bar-minimal');
        if (maxTime > 0) {
            const percentage = ((maxTime - seconds) / maxTime) * 100;
            progressBar.style.width = `${percentage}%`;
        }
    } else {
        // Update alternative style
        const timeDisplay = document.getElementById('time-display-alt');
        timeDisplay.textContent = timeText;
        
        const progressBar = document.getElementById('time-bar-alt');
        if (maxTime > 0) {
            const percentage = ((maxTime - seconds) / maxTime) * 100;
            progressBar.style.width = `${percentage}%`;
        }
    }
}

// === PRISONER MANAGEMENT UI FUNCTIONS ===

function openManagementUI() {
    const ui = document.getElementById('prisoner-management');
    ui.classList.remove('hidden');
    
    // Set title
    document.getElementById('ui-title').textContent = locale.management_title || 'Prison Management';
    document.getElementById('tab-current').textContent = locale.tab_current || 'Current Prisoners';
    document.getElementById('tab-history').textContent = locale.tab_history || 'Release History';
    
    // Populate data
    renderCurrentPrisoners();
    renderHistory();
    
    // Setup tab switching
    setupTabs();
    
    // Setup search
    setupSearch();
}

function closeManagementUI() {
    const ui = document.getElementById('prisoner-management');
    if (ui.classList.contains('hidden')) return;
    ui.classList.add('hidden');
    
    // Notify Lua to release NUI focus
    fetch(`https://${GetParentResourceName()}/closeUI`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
    }).catch(() => {});
}

function setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    // Remove old listeners by cloning
    tabButtons.forEach(btn => {
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
    });
    
    // Re-query after clone
    const freshButtons = document.querySelectorAll('.tab-btn');
    freshButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.getAttribute('data-tab');
            
            // Remove active from all
            freshButtons.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            // Add active to selected
            btn.classList.add('active');
            document.getElementById(`content-${tab}`).classList.add('active');
        });
    });
}

function setupSearch() {
    const searchCurrent = document.getElementById('search-current');
    const searchHistory = document.getElementById('search-history');
    
    searchCurrent.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const filtered = currentPrisoners.filter(p => 
            p.name.toLowerCase().includes(term) || 
            p.reason.toLowerCase().includes(term) ||
            p.jailedBy.toLowerCase().includes(term)
        );
        renderCurrentPrisoners(filtered);
    });
    
    searchHistory.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const filtered = prisonHistory.filter(h => 
            h.playerName.toLowerCase().includes(term) || 
            h.reason.toLowerCase().includes(term) ||
            h.jailedBy.toLowerCase().includes(term) ||
            (h.releasedBy && h.releasedBy.toLowerCase().includes(term))
        );
        renderHistory(filtered);
    });
}

function renderCurrentPrisoners(data = null) {
    const container = document.getElementById('current-prisoners');
    const prisoners = data || currentPrisoners;
    
    if (prisoners.length === 0) {
        container.innerHTML = `<div class="no-data">${locale.no_current || 'No prisoners currently jailed'}</div>`;
        return;
    }
    
    container.innerHTML = '';
    
    prisoners.forEach(prisoner => {
        const card = createPrisonerCard(prisoner, true);
        container.appendChild(card);
    });
}

function renderHistory(data = null) {
    const container = document.getElementById('history-list');
    const history = data || prisonHistory;
    
    if (history.length === 0) {
        container.innerHTML = `<div class="no-data">${locale.no_history || 'No release history'}</div>`;
        return;
    }
    
    container.innerHTML = '';
    
    history.forEach(record => {
        const card = createHistoryCard(record);
        container.appendChild(card);
    });
}

function createPrisonerCard(prisoner, showRelease = false) {
    const card = document.createElement('div');
    card.className = 'prisoner-card';
    
    const timeRemaining = formatTime(prisoner.timeRemaining);
    const totalTime = formatTime(prisoner.totalTime);
    const jailedAt = formatDate(prisoner.jailedAt);
    
    card.innerHTML = `
        <div class="prisoner-card-header">
            <div class="prisoner-name">${escapeHtml(prisoner.name)}</div>
            <div class="prisoner-status active">${locale.status_jailed || 'JAILED'}</div>
        </div>
        <div class="prisoner-details">
            <div class="detail-item">
                <div class="detail-label">${locale.time_remaining || 'Time Remaining'}</div>
                <div class="detail-value highlight">${timeRemaining}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">${locale.total_time || 'Total Sentence'}</div>
                <div class="detail-value">${totalTime}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">${locale.jailed_by || 'Imprisoned By'}</div>
                <div class="detail-value">${escapeHtml(prisoner.jailedBy)}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">${locale.jailed_at || 'Imprisoned At'}</div>
                <div class="detail-value">${jailedAt}</div>
            </div>
        </div>
        <div class="prisoner-reason">
            <div class="detail-label">${locale.reason || 'Reason'}</div>
            <div class="detail-value">${escapeHtml(prisoner.reason)}</div>
        </div>
        ${showRelease && prisoner.canRelease ? `<button class="release-btn" onclick="releasePrisoner('${prisoner.identifier}')">${locale.release || 'Release'}</button>` : ''}
    `;
    
    return card;
}

function createHistoryCard(record) {
    const card = document.createElement('div');
    card.className = 'prisoner-card';
    
    const totalTime = formatTime(record.totalTime);
    const jailedAt = formatDate(record.jailedAt);
    const releasedAt = formatDate(record.releasedAt);
    const releaseType = getReleaseTypeLabel(record.releaseType);
    
    card.innerHTML = `
        <div class="prisoner-card-header">
            <div class="prisoner-name">${escapeHtml(record.playerName)}</div>
            <div class="prisoner-status released">${locale.status_released || 'RELEASED'}</div>
        </div>
        <div class="prisoner-details">
            <div class="detail-item">
                <div class="detail-label">${locale.total_time || 'Sentence Duration'}</div>
                <div class="detail-value">${totalTime}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">${locale.jailed_by || 'Imprisoned By'}</div>
                <div class="detail-value">${escapeHtml(record.jailedBy)}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">${locale.jailed_at || 'Imprisoned At'}</div>
                <div class="detail-value">${jailedAt}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">${locale.released_at || 'Released At'}</div>
                <div class="detail-value">${releasedAt}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">${locale.release_type || 'Release Type'}</div>
                <div class="detail-value highlight">${releaseType}</div>
            </div>
            ${record.releasedBy ? `
                <div class="detail-item">
                    <div class="detail-label">${locale.released_by || 'Released By'}</div>
                    <div class="detail-value">${escapeHtml(record.releasedBy)}</div>
                </div>
            ` : ''}
        </div>
        <div class="prisoner-reason">
            <div class="detail-label">${locale.reason || 'Reason'}</div>
            <div class="detail-value">${escapeHtml(record.reason)}</div>
        </div>
    `;
    
    return card;
}

function releasePrisoner(identifier) {
    fetch(`https://${GetParentResourceName()}/releasePrisoner`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ identifier: identifier })
    });
}

function formatTime(minutes) {
    if (minutes < 60) {
        return `${minutes} ${locale.minutes || 'min'}`;
    }
    
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (mins === 0) {
        return `${hours} ${locale.hours || 'h'}`;
    }
    
    return `${hours} ${locale.hours || 'h'} ${mins} ${locale.minutes || 'min'}`;
}

function formatDate(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return locale.just_now || 'Just now';
    if (minutes < 60) return `${minutes} ${locale.minutes_ago || 'min ago'}`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} ${locale.hours_ago || 'h ago'}`;
    
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} ${locale.days_ago || 'd ago'}`;
    
    // Format as date
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

function getReleaseTypeLabel(type) {
    switch(type) {
        case 'auto':
            return locale.release_auto || 'Automatic';
        case 'officer':
            return locale.release_officer || 'Released by Officer';
        case 'manual':
            return locale.release_manual || 'Manual Release';
        default:
            return type;
    }
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

function GetParentResourceName() {
    if (window.location && window.location.hostname) {
        let hostname = window.location.hostname;
        // FiveM NUI uses 'cfx-nui-{resourcename}' as hostname
        if (hostname.startsWith('cfx-nui-')) {
            return hostname.substring(8);
        }
        return hostname;
    }
    return 'ss-prison';
}

// ESC key to close
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        e.preventDefault();
        const ui = document.getElementById('prisoner-management');
        if (!ui.classList.contains('hidden')) {
            closeManagementUI();
        }
    }
});
