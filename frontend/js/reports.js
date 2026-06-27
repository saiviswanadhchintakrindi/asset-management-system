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
      <div class="card relative overflow-hidden group">
        <div class="absolute -right-4 -top-4 w-32 h-32 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-colors pointer-events-none"></div>
        <div class="card-title text-primary-light mb-4 flex items-center gap-2"><span class="text-xl">💻</span> Asset Inventory Report</div>
        <p class="text-sm text-secondary mb-6 leading-relaxed">Generate a comprehensive report of all assets including value, assignment status, and departmental distribution.</p>
        
        <form onsubmit="generateAssetReport(event)" class="space-y-4 relative z-10">
          <div class="form-group">
            <label>Filter by Category</label>
            <select id="rpt-ast-cat">
              <option value="">All Categories</option>
            </select>
          </div>
          <div class="grid grid-cols-2 gap-4">
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
      <div class="card relative overflow-hidden group">
        <div class="absolute -right-4 -top-4 w-32 h-32 bg-info/10 rounded-full blur-2xl group-hover:bg-info/20 transition-colors pointer-events-none"></div>
        <div class="card-title text-info-light mb-4 flex items-center gap-2"><span class="text-xl">📋</span> Service Requests Report</div>
        <p class="text-sm text-secondary mb-6 leading-relaxed">Analyze support ticket volume, resolution times, and identify common maintenance issues.</p>
        
        <form onsubmit="generateRequestReport(event)" class="space-y-4 relative z-10">
          <div class="grid grid-cols-2 gap-4">
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
          <div class="grid grid-cols-2 gap-4">
            <div class="form-group">
              <label>From Date</label>
              <input type="date" id="rpt-req-from">
            </div>
            <div class="form-group">
              <label>To Date</label>
              <input type="date" id="rpt-req-to">
            </div>
          </div>
          <button type="submit" class="btn btn-info w-full" id="btn-gen-req" style="background:var(--info); color:#fff">Generate Report</button>
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

  const totalCost = data.summary.reduce((sum, s) => sum + (s.total_value || 0), 0);
  const totalAssets = data.assets.length;

  container.innerHTML = `
    <div class="card bg-bg-light border-primary/30 shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
      <div class="flex justify-between items-center mb-6 pb-4 border-b border-border">
        <div>
          <h3 class="text-xl font-bold text-primary-light flex items-center gap-2"><span>📊</span> Asset Inventory Report</h3>
          <p class="text-sm text-secondary mt-1">Generated: ${formatDateTime(data.generated_at)}</p>
        </div>
        <div class="flex gap-2">
          <button class="btn btn-secondary btn-sm" onclick="exportToCSV(reportAssetData, 'asset_inventory')">📥 Export CSV</button>
          <button class="btn btn-secondary btn-sm" onclick="window.print()">🖨️ Print</button>
        </div>
      </div>

      <div class="grid grid-cols-3 gap-4 mb-8">
        <div class="bg-bg-input p-4 rounded-lg border border-border">
          <div class="text-xs text-muted uppercase mb-1">Total Assets matching criteria</div>
          <div class="text-2xl font-bold">${totalAssets}</div>
        </div>
        <div class="bg-bg-input p-4 rounded-lg border border-border">
          <div class="text-xs text-muted uppercase mb-1">Total Purchase Value</div>
          <div class="text-2xl font-bold text-success">${formatCurrency(totalCost)}</div>
        </div>
        <div class="bg-bg-input p-4 rounded-lg border border-border">
          <div class="text-xs text-muted uppercase mb-1">Assigned vs Available</div>
          <div class="text-sm mt-1">
            ${data.summary.map(s => `<div class="flex justify-between"><span>${capitalize(s.status)}:</span> <span class="font-bold">${s.count}</span></div>`).join('')}
          </div>
        </div>
      </div>

      <script>window.reportAssetData = ${JSON.stringify(data.assets)};</script>

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
            ${data.assets.length === 0 ? '<tr><td colspan="6" class="text-center py-4">No assets found for given criteria</td></tr>' : ''}
            ${data.assets.map(a => `
              <tr>
                <td class="font-medium">${a.name}</td>
                <td class="font-mono text-xs text-muted">${a.serial_number || '-'}</td>
                <td>${a.category_name}</td>
                <td><span class="badge status-${a.status} px-2 py-0.5 text-[10px]">${a.status}</span></td>
                <td class="font-mono">${formatCurrency(a.purchase_cost)}</td>
                <td>${a.assigned_to_name ? `${a.assigned_to_name} <span class="text-[10px] text-muted block">${a.assigned_department}</span>` : '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
  container.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

  container.innerHTML = `
    <div class="card bg-bg-light border-info/30 shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
      <div class="flex justify-between items-center mb-6 pb-4 border-b border-border">
        <div>
          <h3 class="text-xl font-bold text-info-light flex items-center gap-2"><span>📈</span> Service Requests Analytics</h3>
          <p class="text-sm text-secondary mt-1">Generated: ${formatDateTime(data.generated_at)}</p>
        </div>
        <div class="flex gap-2">
          <button class="btn btn-secondary btn-sm" onclick="exportToCSV(reportRequestData, 'service_requests')">📥 Export CSV</button>
          <button class="btn btn-secondary btn-sm" onclick="window.print()">🖨️ Print</button>
        </div>
      </div>

      <script>window.reportRequestData = ${JSON.stringify(data.requests)};</script>

      <div class="grid grid-cols-4 gap-4 mb-8">
        <div class="bg-bg-input p-4 rounded-lg border border-border">
          <div class="text-xs text-muted uppercase mb-1">Total Requests</div>
          <div class="text-2xl font-bold">${data.requests.length}</div>
        </div>
        <div class="bg-bg-input p-4 rounded-lg border border-border col-span-2">
          <div class="text-xs text-muted uppercase mb-1">By Type</div>
          <div class="flex gap-4 mt-2">
            ${data.byType.map(t => `<div class="flex items-center gap-1"><span class="badge badge-primary px-1.5 py-0.5 text-[10px]">${capitalize(t.type)}</span> <span class="font-bold text-sm">${t.count}</span></div>`).join('')}
          </div>
        </div>
        <div class="bg-bg-input p-4 rounded-lg border border-border">
          <div class="text-xs text-muted uppercase mb-1">Avg Resolution</div>
          <div class="text-2xl font-bold text-warning">${data.avgResolutionDays !== 'N/A' ? `${data.avgResolutionDays} <span class="text-sm font-normal text-muted">days</span>` : 'N/A'}</div>
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
            ${data.requests.length === 0 ? '<tr><td colspan="6" class="text-center py-4">No requests found for given criteria</td></tr>' : ''}
            ${data.requests.map(r => `
              <tr>
                <td class="font-mono text-xs text-muted">REQ-${r.id.toString().padStart(4,'0')}</td>
                <td>${formatDate(r.created_at)}</td>
                <td>${capitalize(r.type)}</td>
                <td>${r.requester_name} <span class="text-[10px] text-muted block">${r.department}</span></td>
                <td class="max-w-[200px] truncate" title="${r.title}">${r.title}</td>
                <td><span class="badge status-${r.status} px-2 py-0.5 text-[10px]">${r.status}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
  container.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
