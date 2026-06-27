/* ================================================================
   AssetFlow - Audit Logs Logic (Admin)
   ================================================================ */

let allLogs = [];
let logFilters = { page: 1, limit: 50 };

async function loadAudit() {
  const content = document.getElementById('page-content');
  
  content.innerHTML = `
    <div class="page-header">
      <div class="page-header-left">
        <h2>Audit Logs</h2>
        <p>System activity and security events</p>
      </div>
      <button class="btn btn-secondary" onclick="fetchLogs()"><span class="text-lg">↻</span> Refresh</button>
    </div>

    <div class="table-container">
      <div class="table-header">
        <div class="table-filters w-full">
          <select id="log-entity" onchange="filterLogs()">
            <option value="">All Entities</option>
            <option value="user">User</option>
            <option value="asset">Asset</option>
            <option value="request">Request</option>
          </select>
          <select id="log-action" onchange="filterLogs()">
            <option value="">All Actions</option>
            <option value="LOGIN">LOGIN</option>
            <option value="CREATE">CREATE</option>
            <option value="UPDATE">UPDATE</option>
            <option value="DELETE">DELETE</option>
            <option value="ASSIGN">ASSIGN</option>
            <option value="RETURN">RETURN</option>
          </select>
          <input type="date" id="log-from" title="From Date" onchange="filterLogs()" />
          <input type="date" id="log-to" title="To Date" onchange="filterLogs()" />
        </div>
      </div>
      <div class="overflow-x-auto">
        <table class="data-table text-xs">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Action</th>
              <th>User</th>
              <th>Entity</th>
              <th>Entity ID</th>
              <th>IP Address</th>
            </tr>
          </thead>
          <tbody id="log-tbody">
            <tr><td colspan="6" class="text-center py-8"><div class="loader-ring mx-auto"></div></td></tr>
          </tbody>
        </table>
      </div>
      <div id="log-pagination" class="pagination hidden"></div>
    </div>
  `;

  await fetchLogs();
}

function filterLogs() {
  logFilters.entity_type = document.getElementById('log-entity').value;
  logFilters.action = document.getElementById('log-action').value;
  logFilters.date_from = document.getElementById('log-from').value;
  logFilters.date_to = document.getElementById('log-to').value;
  logFilters.page = 1;
  fetchLogs();
}

async function fetchLogs() {
  try {
    const params = new URLSearchParams(Object.entries(logFilters).filter(([_,v]) => v !== ''));
    const res = await apiFetch(`/audit-logs?${params.toString()}`);
    allLogs = res.data.rows;
    renderLogsTable(res.data);
  } catch (err) {
    showToast('Failed to load audit logs', 'error');
  }
}

function renderLogsTable(data) {
  const tbody = document.getElementById('log-tbody');

  if (allLogs.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state py-8"><div class="empty-title">No audit logs found</div></div></td></tr>`;
    document.getElementById('log-pagination').classList.add('hidden');
    return;
  }

  tbody.innerHTML = allLogs.map(l => `
    <tr class="hover:bg-white/5 cursor-help" title="${l.user_agent || 'Unknown Device'}">
      <td class="text-muted font-mono whitespace-nowrap">${formatDateTime(l.created_at)}</td>
      <td><span class="badge ${getActionBadgeColor(l.action)} px-1.5 py-0.5 text-[9px] uppercase">${l.action}</span></td>
      <td>
        ${l.user_name ? `<div class="font-medium">${l.user_name}</div><div class="text-[9px] text-muted">${l.user_email}</div>` : '<span class="text-muted italic">System / Unknown</span>'}
      </td>
      <td class="uppercase text-[10px] tracking-wider text-muted">${l.entity_type}</td>
      <td class="font-mono">${l.entity_id || '-'}</td>
      <td class="font-mono text-muted">${l.ip_address || '-'}</td>
    </tr>
  `).join('');

  if (data.pages > 1) {
    const pContainer = document.getElementById('log-pagination');
    pContainer.classList.remove('hidden');
    pContainer.innerHTML = `
      <div class="pagination-info">Showing page ${data.page} of ${data.pages}</div>
      <div class="pagination-btns">
        <button class="page-btn" ${data.page === 1 ? 'disabled' : ''} onclick="changeLogPage(${data.page - 1})">Prev</button>
        <button class="page-btn" ${data.page === data.pages ? 'disabled' : ''} onclick="changeLogPage(${data.page + 1})">Next</button>
      </div>
    `;
  } else {
    document.getElementById('log-pagination').classList.add('hidden');
  }
}

function changeLogPage(p) { logFilters.page = p; fetchLogs(); }

function getActionBadgeColor(action) {
  const map = {
    'LOGIN': 'badge-primary',
    'CREATE': 'badge-success',
    'UPDATE': 'badge-info',
    'DELETE': 'badge-danger',
    'ASSIGN': 'badge-warning',
    'RETURN': 'badge-success'
  };
  return map[action] || 'badge-muted';
}
