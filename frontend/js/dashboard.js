/* ================================================================
   AssetFlow - Dashboard Logic
   ================================================================ */

async function loadDashboard() {
  const user = getCurrentUser();
  const content = document.getElementById('page-content');
  
  try {
    const res = await apiFetch('/dashboard/stats');
    const data = res.data;

    if (user.role === 'admin') {
      renderAdminDashboard(content, data);
    } else {
      renderEmployeeDashboard(content, data);
    }
  } catch (err) {
    content.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><h3 class="empty-title">Error Loading Dashboard</h3><p class="empty-desc">${err.message}</p></div>`;
  }
}

function renderAdminDashboard(container, data) {
  const { assets, requests, users } = data;

  let html = `
    <div class="page-header">
      <div class="page-header-left">
        <h2>Admin Dashboard</h2>
        <p>System overview and key performance metrics</p>
      </div>
      <button class="btn btn-primary" onclick="navigate('reports')">Generate Reports</button>
    </div>

    <!-- Stats Grid -->
    <div class="stats-grid">
      <div class="stat-card primary">
        <div class="flex justify-between items-center">
          <div>
            <div class="stat-label">TOTAL ASSETS</div>
            <div class="stat-value">${assets.total}</div>
          </div>
          <div class="stat-icon">💻</div>
        </div>
      </div>
      <div class="stat-card info">
        <div class="flex justify-between items-center">
          <div>
            <div class="stat-label">ACTIVE EMPLOYEES</div>
            <div class="stat-value">${users.active}</div>
          </div>
          <div class="stat-icon">👥</div>
        </div>
      </div>
      <div class="stat-card warning">
        <div class="flex justify-between items-center">
          <div>
            <div class="stat-label">PENDING REQUESTS</div>
            <div class="stat-value">${requests.pending}</div>
          </div>
          <div class="stat-icon">⏳</div>
        </div>
      </div>
      <div class="stat-card success">
        <div class="flex justify-between items-center">
          <div>
            <div class="stat-label">TOTAL VALUE</div>
            <div class="stat-value">${formatCurrency(assets.totalValue)}</div>
          </div>
          <div class="stat-icon">💰</div>
        </div>
      </div>
    </div>

    <div class="two-col">
      <!-- Recent Requests -->
      <div class="card">
        <div class="card-title justify-between">
          <span>Recent Service Requests</span>
          <a href="#requests" class="btn btn-ghost btn-xs" onclick="navigate('requests')">View All</a>
        </div>
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Requester</th>
                <th>Type</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              ${requests.recent.map(r => `
                <tr>
                  <td class="font-medium">${r.requester_name}</td>
                  <td>${capitalize(r.type)}</td>
                  <td><span class="badge status-${r.status}">${capitalize(r.status)}</span></td>
                  <td>${formatDate(r.created_at)}</td>
                </tr>
              `).join('')}
              ${requests.recent.length === 0 ? `<tr><td colspan="4" class="text-center text-muted py-4">No recent requests</td></tr>` : ''}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Asset Status Breakdown -->
      <div class="card">
        <div class="card-title">Asset Status Breakdown</div>
        <div class="chart-bar-container mt-4">
          ${assets.byStatus.map(s => {
            const pct = Math.round((s.count / assets.total) * 100) || 0;
            return `
              <div class="chart-bar-item">
                <div class="chart-bar-label">
                  <span class="capitalize">${s.status}</span>
                  <span>${s.count} (${pct}%)</span>
                </div>
                <div class="chart-bar-track">
                  <div class="chart-bar-fill" style="width: ${pct}%; background: ${getStatusColor(s.status)}"></div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    </div>
  `;

  container.innerHTML = html;
}

function renderEmployeeDashboard(container, data) {
  const { myAssets, myOpenRequests, unreadNotifications, recentActivity } = data;

  let html = `
    <div class="page-header">
      <div class="page-header-left">
        <h2>My Dashboard</h2>
        <p>Welcome back! Here's your current status.</p>
      </div>
      <button class="btn btn-primary" onclick="navigate('requests'); setTimeout(()=>showNewRequestModal(), 100)">Raise Request</button>
    </div>

    <!-- Stats Grid -->
    <div class="stats-grid">
      <div class="stat-card primary" onclick="navigate('assets')" style="cursor:pointer">
        <div class="flex justify-between items-center">
          <div>
            <div class="stat-label">MY ASSETS</div>
            <div class="stat-value">${myAssets}</div>
          </div>
          <div class="stat-icon">💻</div>
        </div>
      </div>
      <div class="stat-card warning" onclick="navigate('requests')" style="cursor:pointer">
        <div class="flex justify-between items-center">
          <div>
            <div class="stat-label">OPEN REQUESTS</div>
            <div class="stat-value">${myOpenRequests.length}</div>
          </div>
          <div class="stat-icon">📋</div>
        </div>
      </div>
      <div class="stat-card info" onclick="navigate('notifications')" style="cursor:pointer">
        <div class="flex justify-between items-center">
          <div>
            <div class="stat-label">UNREAD NOTIFICATIONS</div>
            <div class="stat-value">${unreadNotifications}</div>
          </div>
          <div class="stat-icon">🔔</div>
        </div>
      </div>
    </div>

    <div class="two-col mt-4">
      <!-- Active Requests -->
      <div class="card">
        <div class="card-title justify-between">
          <span>Active Requests</span>
          <a href="#requests" class="btn btn-ghost btn-xs" onclick="navigate('requests')">View All</a>
        </div>
        ${myOpenRequests.length > 0 ? `
          <div class="activity-list">
            ${myOpenRequests.map(r => `
              <div class="activity-item cursor-pointer hover:bg-white/5 rounded p-2" onclick="navigate('requests'); setTimeout(()=>viewRequest(${r.id}), 100)">
                <div class="activity-icon">${getRequestIcon(r.type)}</div>
                <div class="activity-content">
                  <div class="flex justify-between">
                    <div class="font-medium">${r.title}</div>
                    <span class="badge status-${r.status}">${capitalize(r.status)}</span>
                  </div>
                  <div class="activity-time">Submitted: ${formatDate(r.created_at)}</div>
                </div>
              </div>
            `).join('')}
          </div>
        ` : `
          <div class="empty-state py-8">
            <div class="empty-icon text-3xl">🎉</div>
            <div class="empty-title">All Caught Up</div>
            <div class="empty-desc">You have no active service requests.</div>
          </div>
        `}
      </div>

      <!-- Recent Activity -->
      <div class="card">
        <div class="card-title">Recent Activity Log</div>
        ${recentActivity.length > 0 ? `
          <div class="activity-list">
            ${recentActivity.map(r => `
              <div class="activity-item">
                <div class="activity-icon" style="background: rgba(255,255,255,0.05)">🕒</div>
                <div class="activity-content">
                  <div class="activity-text">Request <strong>"${r.title}"</strong> was updated to <span class="text-${getStatusColorClass(r.status)} font-medium">${r.status}</span></div>
                  <div class="activity-time">${formatDateTime(r.updated_at)}</div>
                </div>
              </div>
            `).join('')}
          </div>
        ` : `
          <div class="text-center text-muted py-8">No recent activity</div>
        `}
      </div>
    </div>
  `;

  container.innerHTML = html;
}

function getStatusColor(status) {
  const colors = {
    available: 'var(--success)',
    assigned: 'var(--info)',
    maintenance: 'var(--warning)',
    retired: '#64748b',
    pending: 'var(--warning)',
    approved: 'var(--info)',
    rejected: 'var(--danger)',
    in_progress: '#a78bfa',
    completed: 'var(--success)',
    cancelled: '#64748b'
  };
  return colors[status] || 'var(--primary)';
}

function getStatusColorClass(status) {
  const colors = {
    completed: 'success', approved: 'info', pending: 'warning', rejected: 'danger', in_progress: 'primary'
  };
  return colors[status] || 'muted';
}

function getRequestIcon(type) {
  const icons = { asset_request: '💻', maintenance: '🔧', service: '⚡', other: '📝' };
  return icons[type] || '📋';
}
