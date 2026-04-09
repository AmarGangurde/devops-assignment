const API_BASE = '';

// UI Elements
const healthGrid = document.getElementById('health-grid');
const incidentsList = document.getElementById('incidents-list');
const incidentBadge = document.getElementById('incident-badge');
const globalStatusDot = document.getElementById('global-status-dot');
const globalStatusText = document.getElementById('global-status-text');
const diagnoseBtn = document.getElementById('diagnose-btn');
const serviceSelect = document.getElementById('service-select');
const diagnosisResult = document.getElementById('diagnosis-result');
const logModal = document.getElementById('log-modal');
const logContent = document.getElementById('log-content');
const modalTitle = document.getElementById('modal-title');
const closeBtn = document.querySelector('.close-btn');

async function fetchData(endpoint, method = 'GET', body = null) {
    try {
        const options = {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: body ? JSON.stringify(body) : null
        };
        const resp = await fetch(`${API_BASE}${endpoint}`, options);
        return await resp.json();
    } catch (err) {
        console.error(`Fetch error ${endpoint}:`, err);
        return null;
    }
}

function updateHealth(services) {
    if (!services) return;
    
    let allHealthy = true;
    healthGrid.innerHTML = '';
    
    Object.entries(services).forEach(([name, data]) => {
        if (data.status !== 'healthy') allHealthy = false;
        
        const card = document.createElement('div');
        card.className = 'service-card';
        card.innerHTML = `
            <div class="card-header">
                <h3>${name}</h3>
                <span class="status-pill ${data.status}">${data.status}</span>
            </div>
            <p class="card-meta">Last check: ${new Date(data.lastChecked).toLocaleTimeString()}</p>
            <div class="card-actions">
                <button class="btn-sm" onclick="viewLogs('${name}')">View Logs</button>
            </div>
        `;
        healthGrid.appendChild(card);
    });

    globalStatusDot.className = `status-dot ${allHealthy ? 'healthy' : 'unhealthy'}`;
    globalStatusText.innerText = allHealthy ? 'System Optimal' : 'Action Required';
}

function updateIncidents(incidents) {
    if (!incidents || incidents.length === 0) {
        incidentsList.innerHTML = '<div class="empty-state">No active incidents detected.</div>';
        incidentBadge.innerText = '0';
        return;
    }

    incidentBadge.innerText = incidents.length;
    incidentsList.innerHTML = '';
    
    incidents.forEach(inc => {
        const item = document.createElement('div');
        item.className = 'incident-item';
        item.innerHTML = `
            <h4>${inc.service} Failure</h4>
            <span class="incident-time">${new Date(inc.timestamp).toLocaleString()}</span>
            <div class="incident-summary">${formatMarkdownLink(inc.analysis)}</div>
        `;
        incidentsList.appendChild(item);
    });
}

function formatMarkdownLink(text) {
    // Simple bold formatter
    return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
               .replace(/\n/g, '<br>');
}

async function viewLogs(service) {
    modalTitle.innerText = `Logs: ${service}`;
    logContent.innerText = 'Loading logs...';
    logModal.style.display = 'block';
    
    const data = await fetchData(`/agent/logs/${service}`);
    if (data && data.logs) {
        logContent.innerText = data.logs;
    } else {
        logContent.innerText = 'No logs found or error fetching.';
    }
}

diagnoseBtn.addEventListener('click', async () => {
    const service = serviceSelect.value;
    diagnoseBtn.disabled = true;
    diagnosisResult.innerHTML = '<p class="placeholder">AI is analyzing logs... please wait.</p>';
    
    const data = await fetchData('/agent/diagnose', 'POST', { service });
    if (data && data.diagnosis) {
        diagnosisResult.innerHTML = `<strong>Diagnosis for ${service}:</strong><br><br>${formatMarkdownLink(data.diagnosis)}`;
    } else {
        diagnosisResult.innerHTML = '<p class="placeholder text-danger">AI analysis failed. Check agent logs.</p>';
    }
    diagnoseBtn.disabled = false;
});

// Modal close
closeBtn.onclick = () => logModal.style.display = 'none';
window.onclick = (e) => { if (e.target == logModal) logModal.style.display = 'none'; };

// Initial Load & Refresh
async function refreshDashboard() {
    const status = await fetchData('/agent/status');
    if (status) updateHealth(status.services);
    
    const incidents = await fetchData('/agent/incidents');
    if (incidents) updateIncidents(incidents.incidents);
}

refreshDashboard();
setInterval(refreshDashboard, 10000);
