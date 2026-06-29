/* ================================================================
   AssetFlow - Reporting & Analytics (Admin)
   ================================================================ */

function loadReports() {
  const content = document.getElementById('page-content');
  
  content.innerHTML = `
    <div class="page-header">
      <div class="page-header-left">
        <h2>Reports & Analytics</h2>
        <p>Generate insights and export data</p>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-6">
      <!-- Asset Report Generator -->
      <div class="card" style="border-left: 4px solid var(--primary);">
        <div class="card-title mb-4 flex items-center gap-2"><span class="text-xl">💻</span> Asset Inventory Report</div>
        <p class="text-sm text-muted mb-4">Generate a comprehensive report of all assets including value, assignment status, and departmental distribution.</p>
        
        <form onsubmit="generateAssetReport(event)">
          <div class="form-group">
            <label>Filter by Category</label>
            <select id="rpt-ast-cat">
              <option value="">All Categories</option>
            </select>
          </div>
          <div class="form-row mb-4">
            <div class="form-group">
              <label>Purchased After</label>
              <input type="date" id="rpt-ast-from">
            </div>
            <div class="form-group">
              <label>Purchased Before</label>
              <input type="date" id="rpt-ast-to">
            </div>
          </div>
          <button type="submit" class="btn btn-primary w-full" id="btn-gen-ast">Generate Report</button>
        </form>
      </div>

      <!-- Service Requests Report Generator -->
      <div class="card" style="border-left: 4px solid var(--info);">
        <div class="card-title mb-4 flex items-center gap-2"><span class="text-xl">📋</span> Service Requests Report</div>
        <p class="text-sm text-muted mb-4">Analyze support ticket volume, resolution times, and identify common maintenance issues.</p>
        
        <form onsubmit="generateRequestReport(event)">
          <div class="form-row mb-4">
            <div class="form-group">
              <label>Status</label>
              <select id="rpt-req-status">
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div class="form-group">
              <label>Type</label>
              <select id="rpt-req-type">
                <option value="">All Types</option>
                <option value="asset_request">Asset Request</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
          </div>
          <div class="form-row mb-4">
            <div class="form-group">
              <label>From Date</label>
              <input type="date" id="rpt-req-from">
            </div>
            <div class="form-group">
              <label>To Date</label>
              <input type="date" id="rpt-req-to">
            </div>
          </div>
          <button type="submit" class="btn w-full" style="background: var(--info); color: #fff;" id="btn-gen-req">Generate Report</button>
        </form>
      </div>
    </div>
    
    <div id="report-output-container" class="mt-8 hidden">
      <!-- Report HTML injected here -->
    </div>
  `;

  // Populate categories
  if (allCategories && allCategories.length > 0) {
    const catSelect = document.getElementById('rpt-ast-cat');
    catSelect.innerHTML = `<option value="">All Categories</option>` + allCategories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
  } else {
    apiFetch('/assets/categories').then(res => {
      const catSelect = document.getElementById('rpt-ast-cat');
      if (catSelect) catSelect.innerHTML = `<option value="">All Categories</option>` + res.data.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    }).catch(()=>{});
  }
}

async function generateAssetReport(e) {
  e.preventDefault();
  const btn = document.getElementById('btn-gen-ast');
  btn.disabled = true; btn.textContent = 'Generating...';
  
  const categoryId = document.getElementById('rpt-ast-cat').value;
  const from = document.getElementById('rpt-ast-from').value;
  const to = document.getElementById('rpt-ast-to').value;

  const params = new URLSearchParams();
  if (categoryId) params.append('category_id', categoryId);
  if (from) params.append('date_from', from);
  if (to) params.append('date_to', to);

  try {
    const res = await apiFetch(`/reports/assets?${params.toString()}`);
    renderAssetReportOutput(res.data);
  } catch (err) {
    showToast('Report generation failed', 'error');
  } finally {
    btn.disabled = false; btn.textContent = 'Generate Report';
  }
}

function renderAssetReportOutput(data) {
  const container = document.getElementById('report-output-container');
  container.classList.remove('hidden');

  window._reportAssetData = data.assets;

  const totalCost = data.summary.reduce((sum, s) => sum + (s.total_value || 0), 0);
  const totalAssets = data.assets.length;

  container.innerHTML = `
    <div class="card" style="border-left: 4px solid var(--primary);">
      <div class="flex justify-between items-center mb-4 pb-4 border-b">
        <div>
          <h3 class="text-lg font-bold flex items-center gap-2">📊 Asset Inventory Report</h3>
          <p class="text-sm text-muted mt-1">Generated: ${formatDateTime(data.generated_at)}</p>
        </div>
        <div class="flex gap-2">
          <button class="btn btn-secondary btn-sm" onclick="exportReportCSV('asset')">📥 Export CSV</button>
          <button class="btn btn-secondary btn-sm" onclick="window.print()">🖨️ Print</button>
        </div>
      </div>

      <div class="grid grid-cols-3 gap-4 mb-6">
        <div class="p-4 rounded-lg border" style="background: var(--bg-hover);">
          <div class="text-xs text-muted uppercase mb-1">Total Assets</div>
          <div class="text-2xl font-bold">${totalAssets}</div>
        </div>
        <div class="p-4 rounded-lg border" style="background: var(--bg-hover);">
          <div class="text-xs text-muted uppercase mb-1">Total Value</div>
          <div class="text-2xl font-bold text-success">${formatCurrency(totalCost)}</div>
        </div>
        <div class="p-4 rounded-lg border" style="background: var(--bg-hover);">
          <div class="text-xs text-muted uppercase mb-1">Departments</div>
          <div class="text-2xl font-bold">${data.byDepartment.length}</div>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4 mb-6">
        <div class="p-3 rounded-lg border" style="background: var(--bg-surface);">
          <h4 class="font-semibold mb-2 text-xs text-muted uppercase tracking-wider">Assets by Status</h4>
          <div style="max-width: 280px; margin: 0 auto;">
            <canvas id="chart-asset-status" height="160"></canvas>
          </div>
        </div>
        <div class="p-3 rounded-lg border" style="background: var(--bg-surface);">
          <h4 class="font-semibold mb-2 text-xs text-muted uppercase tracking-wider">Assets by Department</h4>
          <div style="max-width: 260px; margin: 0 auto;">
            <canvas id="chart-asset-dept" height="160"></canvas>
          </div>
        </div>
      </div>

      <h4 class="font-semibold mb-3">Asset List</h4>
      <div class="table-container">
        <table class="data-table text-sm">
          <thead>
            <tr>
              <th>Name</th>
              <th>Serial</th>
              <th>Category</th>
              <th>Status</th>
              <th>Cost</th>
              <th>Assigned To</th>
            </tr>
          </thead>
          <tbody>
            ${data.assets.length === 0 ? '<tr><td colspan="6" class="text-center py-4 text-muted">No assets found</td></tr>' : ''}
            ${data.assets.map(a => `
              <tr>
                <td class="font-medium">${a.name}</td>
                <td class="font-mono text-xs text-muted">${a.serial_number || '-'}</td>
                <td>${a.category_name}</td>
                <td><span class="badge status-${a.status}">${a.status}</span></td>
                <td class="font-mono">${formatCurrency(a.purchase_cost)}</td>
                <td>${a.assigned_to_name || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
  container.scrollIntoView({ behavior: 'smooth', block: 'start' });

  // Render charts
  setTimeout(() => {
    const statusCtx = document.getElementById('chart-asset-status');
    const deptCtx = document.getElementById('chart-asset-dept');
    if (!statusCtx || !deptCtx) return;

    const colors = { available: '#16a34a', assigned: '#2563eb', maintenance: '#d97706', retired: '#94a3b8' };

    new Chart(statusCtx, {
      type: 'bar',
      data: {
        labels: data.summary.map(s => capitalize(s.status)),
        datasets: [{
          label: 'Count',
          data: data.summary.map(s => s.count),
          backgroundColor: data.summary.map(s => colors[s.status] || '#6366f1'),
          borderRadius: 4,
          barThickness: 28,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, ticks: { stepSize: 1, font: { size: 10 } }, grid: { color: '#e2e8f0' } },
          x: { ticks: { font: { size: 10 } }, grid: { display: false } }
        }
      }
    });

    const deptColors = ['#2563eb','#16a34a','#d97706','#dc2626','#6366f1','#0891b2','#059669','#7c3aed','#e11d48','#ca8a04'];
    new Chart(deptCtx, {
      type: 'doughnut',
      data: {
        labels: data.byDepartment.map(d => d.department || 'Unknown'),
        datasets: [{
          data: data.byDepartment.map(d => d.assigned_count),
          backgroundColor: deptColors.slice(0, Math.max(data.byDepartment.length, 1)),
          borderWidth: 2,
          borderColor: '#fff',
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '60%',
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 10, padding: 10, font: { size: 10 }, usePointStyle: true } }
        }
      }
    });
  }, 200);
}

async function generateRequestReport(e) {
  e.preventDefault();
  const btn = document.getElementById('btn-gen-req');
  btn.disabled = true; btn.textContent = 'Generating...';
  
  const status = document.getElementById('rpt-req-status').value;
  const type = document.getElementById('rpt-req-type').value;
  const from = document.getElementById('rpt-req-from').value;
  const to = document.getElementById('rpt-req-to').value;

  const params = new URLSearchParams();
  if (status) params.append('status', status);
  if (type) params.append('type', type);
  if (from) params.append('date_from', from);
  if (to) params.append('date_to', to);

  try {
    const res = await apiFetch(`/reports/requests?${params.toString()}`);
    renderRequestReportOutput(res.data);
  } catch (err) {
    showToast('Report generation failed', 'error');
  } finally {
    btn.disabled = false; btn.textContent = 'Generate Report';
  }
}

function renderRequestReportOutput(data) {
  const container = document.getElementById('report-output-container');
  container.classList.remove('hidden');

  window._reportRequestData = data.requests;

  container.innerHTML = `
    <div class="card" style="border-left: 4px solid var(--info);">
      <div class="flex justify-between items-center mb-4 pb-4 border-b">
        <div>
          <h3 class="text-lg font-bold flex items-center gap-2">📈 Service Requests Analytics</h3>
          <p class="text-sm text-muted mt-1">Generated: ${formatDateTime(data.generated_at)}</p>
        </div>
        <div class="flex gap-2">
          <button class="btn btn-secondary btn-sm" onclick="exportReportCSV('request')">📥 Export CSV</button>
          <button class="btn btn-secondary btn-sm" onclick="window.print()">🖨️ Print</button>
        </div>
      </div>

      <div class="grid grid-cols-3 gap-4 mb-6">
        <div class="p-4 rounded-lg border" style="background: var(--bg-hover);">
          <div class="text-xs text-muted uppercase mb-1">Total Requests</div>
          <div class="text-2xl font-bold">${data.requests.length}</div>
        </div>
        <div class="p-4 rounded-lg border" style="background: var(--bg-hover);">
          <div class="text-xs text-muted uppercase mb-1">Avg Resolution</div>
          <div class="text-2xl font-bold text-warning">${data.avgResolutionDays !== 'N/A' ? `${data.avgResolutionDays} days` : 'N/A'}</div>
        </div>
        <div class="p-4 rounded-lg border" style="background: var(--bg-hover);">
          <div class="text-xs text-muted uppercase mb-1">By Priority</div>
          <div class="text-sm mt-1">
            ${data.byPriority.map(p => `<div class="flex justify-between"><span>${capitalize(p.priority)}:</span> <span class="font-bold">${p.count}</span></div>`).join('')}
          </div>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4 mb-6">
        <div class="p-3 rounded-lg border" style="background: var(--bg-surface);">
          <h4 class="font-semibold mb-2 text-xs text-muted uppercase tracking-wider">Requests by Status</h4>
          <div style="max-width: 260px; margin: 0 auto;">
            <canvas id="chart-req-status" height="160"></canvas>
          </div>
        </div>
        <div class="p-3 rounded-lg border" style="background: var(--bg-surface);">
          <h4 class="font-semibold mb-2 text-xs text-muted uppercase tracking-wider">Requests by Type</h4>
          <div style="max-width: 280px; margin: 0 auto;">
            <canvas id="chart-req-type" height="160"></canvas>
          </div>
        </div>
      </div>

      <h4 class="font-semibold mb-3">Request Log</h4>
      <div class="table-container">
        <table class="data-table text-sm">
          <thead>
            <tr>
              <th>ID</th>
              <th>Date</th>
              <th>Type</th>
              <th>Requester</th>
              <th>Title</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${data.requests.length === 0 ? '<tr><td colspan="6" class="text-center py-4 text-muted">No requests found</td></tr>' : ''}
            ${data.requests.map(r => `
              <tr>
                <td class="font-mono text-xs text-muted">REQ-${r.id.toString().padStart(4,'0')}</td>
                <td>${formatDate(r.created_at)}</td>
                <td>${capitalize(r.type)}</td>
                <td>${r.requester_name || '-'}<span class="text-xs text-muted block">${r.department || ''}</span></td>
                <td class="max-w-[200px] truncate" title="${r.title}">${r.title}</td>
                <td><span class="badge status-${r.status}">${r.status}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
  container.scrollIntoView({ behavior: 'smooth', block: 'start' });

  // Render charts
  setTimeout(() => {
    const statusCtx = document.getElementById('chart-req-status');
    const typeCtx = document.getElementById('chart-req-type');
    if (!statusCtx || !typeCtx) return;

    const statusColors = {
      pending: '#d97706', approved: '#2563eb', in_progress: '#7c3aed',
      completed: '#16a34a', rejected: '#dc2626', cancelled: '#94a3b8'
    };

    new Chart(statusCtx, {
      type: 'doughnut',
      data: {
        labels: data.byStatus.map(s => capitalize(s.status)),
        datasets: [{
          data: data.byStatus.map(s => s.count),
          backgroundColor: data.byStatus.map(s => statusColors[s.status] || '#6366f1'),
          borderWidth: 2,
          borderColor: '#fff',
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '60%',
        plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, padding: 10, font: { size: 10 }, usePointStyle: true } } }
      }
    });

    const typeColors = { asset_request: '#2563eb', maintenance: '#d97706', service: '#16a34a', other: '#7c3aed' };
    new Chart(typeCtx, {
      type: 'bar',
      data: {
        labels: data.byType.map(t => capitalize(t.type)),
        datasets: [{
          label: 'Count',
          data: data.byType.map(t => t.count),
          backgroundColor: data.byType.map(t => typeColors[t.type] || '#6366f1'),
          borderRadius: 4,
          barThickness: 28,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, ticks: { stepSize: 1, font: { size: 10 } }, grid: { color: '#e2e8f0' } },
          x: { ticks: { font: { size: 10 } }, grid: { display: false } }
        }
      }
    });
  }, 200);
}
