/* ================================================================
   AssetFlow - Assets Management
   ================================================================ */

let allAssets = [];
let allCategories = [];

async function loadAssets() {
  const user = getCurrentUser();
  const content = document.getElementById('page-content');
  
  if (user.role === 'admin') {
    renderAdminAssets(content);
    await fetchCategories();
    await fetchAssets();
  } else {
    renderEmployeeAssets(content);
    await fetchEmployeeAssets(user.id);
  }
}

// ── Admin Asset Views ────────────────────────────────────────────────

function renderAdminAssets(container) {
  container.innerHTML = `
    <div class="page-header">
      <div class="page-header-left">
        <h2>Asset Inventory</h2>
        <p>Manage office equipment, hardware, and furniture.</p>
      </div>
      <div class="flex gap-2">
        <button class="btn btn-secondary" onclick="exportAssetsCSV()">📥 Export CSV</button>
        <button class="btn btn-primary" onclick="showAssetModal()">+ Add Asset</button>
      </div>
    </div>

    <div class="table-container">
      <div class="table-header">
        <h3>All Assets</h3>
        <div class="table-filters">
          <input type="text" id="asset-search" class="search-input" placeholder="Search name, serial..." oninput="debounceFilterAssets()" />
          <select id="asset-status-filter" onchange="filterAssets()">
            <option value="">All Statuses</option>
            <option value="available">Available</option>
            <option value="assigned">Assigned</option>
            <option value="maintenance">Maintenance</option>
            <option value="retired">Retired</option>
          </select>
          <select id="asset-category-filter" onchange="filterAssets()">
            <option value="">All Categories</option>
          </select>
        </div>
      </div>
      <div class="overflow-x-auto">
        <table class="data-table">
          <thead>
            <tr>
              <th>Asset Info</th>
              <th>Serial Number</th>
              <th>Category</th>
              <th>Status</th>
              <th>Assigned To</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="assets-tbody">
            <tr><td colspan="6" class="text-center py-8"><div class="loader-ring mx-auto"></div></td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `;
}

async function fetchCategories() {
  try {
    const res = await apiFetch('/assets/categories');
    allCategories = res.data;
    
    const filter = document.getElementById('asset-category-filter');
    if (filter) {
      const options = allCategories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
      filter.innerHTML = `<option value="">All Categories</option>${options}`;
    }
  } catch (err) {
    showToast('Failed to load categories', 'error');
  }
}

async function fetchAssets(query = '') {
  try {
    const res = await apiFetch(`/assets${query}`);
    allAssets = res.data.rows || [];
    renderAssetsTable();
  } catch (err) {
    showToast('Failed to load assets', 'error');
  }
}

function renderAssetsTable() {
  const tbody = document.getElementById('assets-tbody');
  if (!tbody) return;

  if (allAssets.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state py-8"><div class="empty-icon text-3xl">📭</div><div class="empty-title">No assets found</div></div></td></tr>`;
    return;
  }

  tbody.innerHTML = allAssets.map(a => `
    <tr>
      <td>
        <div class="font-medium text-sm">${a.name}</div>
        <div class="text-xs text-muted mt-1">${a.model || ''} ${a.manufacturer ? `(${a.manufacturer})` : ''}</div>
      </td>
      <td class="font-mono text-xs">${a.serial_number || 'N/A'}</td>
      <td>${a.category_name}</td>
      <td><span class="badge status-${a.status}">${capitalize(a.status)}</span></td>
      <td>
        ${a.assigned_to_name ? 
          `<div class="flex items-center gap-2"><div class="user-avatar-sm w-6 h-6 text-[10px]">${a.assigned_to_name.charAt(0)}</div><span class="text-xs">${a.assigned_to_name}</span></div>` 
          : '<span class="text-muted text-xs">—</span>'}
      </td>
      <td>
        <div class="table-actions">
          <button class="btn btn-ghost btn-xs" onclick="viewAsset(${a.id})" title="View Details">👁</button>
          <button class="btn btn-ghost btn-xs" onclick="showAssetModal(${a.id})" title="Edit">✏️</button>
          ${a.status === 'available' ? `<button class="btn btn-ghost btn-xs text-info" onclick="showAssignModal(${a.id})" title="Assign">👤</button>` : ''}
          ${a.status === 'assigned' ? `<button class="btn btn-ghost btn-xs text-warning" onclick="returnAsset(${a.id})" title="Return">↩️</button>` : ''}
        </div>
      </td>
    </tr>
  `).join('');
}

let filterTimeout;
function debounceFilterAssets() {
  clearTimeout(filterTimeout);
  filterTimeout = setTimeout(filterAssets, 400);
}

function filterAssets() {
  const search = document.getElementById('asset-search').value;
  const status = document.getElementById('asset-status-filter').value;
  const categoryId = document.getElementById('asset-category-filter').value;

  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (status) params.append('status', status);
  if (categoryId) params.append('category_id', categoryId);

  fetchAssets(`?${params.toString()}`);
}

// ── Admin Asset Actions ──────────────────────────────────────────────

function showAssetModal(id = null) {
  const asset = id ? allAssets.find(a => a.id === id) : null;
  const title = asset ? 'Edit Asset' : 'Add New Asset';
  
  const html = `
    <form id="asset-form" class="form" onsubmit="saveAsset(event, ${id})">
      <div class="form-row">
        <div class="form-group">
          <label>Asset Name *</label>
          <input type="text" id="ast-name" required value="${asset?.name || ''}" placeholder="e.g. MacBook Pro 14">
        </div>
        <div class="form-group">
          <label>Category *</label>
          <select id="ast-category" required>
            <option value="">Select Category</option>
            ${allCategories.map(c => `<option value="${c.id}" ${asset?.category_id === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Serial Number / Tag</label>
          <input type="text" id="ast-serial" value="${asset?.serial_number || ''}" placeholder="Unique ID">
        </div>
        <div class="form-group">
          <label>Status</label>
          <select id="ast-status" ${!asset ? 'disabled' : ''}>
            <option value="available" ${asset?.status === 'available' ? 'selected' : ''}>Available</option>
            <option value="maintenance" ${asset?.status === 'maintenance' ? 'selected' : ''}>Maintenance</option>
            <option value="retired" ${asset?.status === 'retired' ? 'selected' : ''}>Retired</option>
            ${asset?.status === 'assigned' ? `<option value="assigned" selected disabled>Assigned</option>` : ''}
          </select>
          ${!asset ? '<small class="text-xs text-muted mt-1">New assets are set to Available by default.</small>' : ''}
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Manufacturer</label>
          <input type="text" id="ast-mfg" value="${asset?.manufacturer || ''}" placeholder="e.g. Apple, Dell">
        </div>
        <div class="form-group">
          <label>Model</label>
          <input type="text" id="ast-model" value="${asset?.model || ''}">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Purchase Date</label>
          <input type="date" id="ast-date" value="${asset?.purchase_date ? asset.purchase_date.split(' ')[0] : ''}">
        </div>
        <div class="form-group">
          <label>Purchase Cost ($)</label>
          <input type="number" step="0.01" id="ast-cost" value="${asset?.purchase_cost || ''}">
        </div>
      </div>
      <div class="form-group">
        <label>Location / Notes</label>
        <textarea id="ast-notes" rows="2" placeholder="Storage location or general notes">${asset?.notes || ''}</textarea>
      </div>
      <div class="modal-footer px-0 pb-0 mt-4 border-t-0">
        <button type="button" class="btn btn-ghost" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn btn-primary" id="ast-save-btn">Save Asset</button>
      </div>
    </form>
  `;
  showModal(title, html);
}

async function saveAsset(e, id) {
  e.preventDefault();
  const btn = document.getElementById('ast-save-btn');
  btn.disabled = true;
  btn.textContent = 'Saving...';

  const data = {
    name: document.getElementById('ast-name').value,
    category_id: parseInt(document.getElementById('ast-category').value),
    serial_number: document.getElementById('ast-serial').value || null,
    status: document.getElementById('ast-status').value,
    manufacturer: document.getElementById('ast-mfg').value || null,
    model: document.getElementById('ast-model').value || null,
    purchase_date: document.getElementById('ast-date').value || null,
    purchase_cost: parseFloat(document.getElementById('ast-cost').value) || 0,
    notes: document.getElementById('ast-notes').value || null,
  };

  try {
    if (id) {
      await apiFetch(`/assets/${id}`, { method: 'PUT', body: data });
      showToast('Asset updated successfully', 'success');
    } else {
      await apiFetch('/assets', { method: 'POST', body: data });
      showToast('Asset added successfully', 'success');
    }
    closeModal();
    fetchAssets();
  } catch (err) {
    showToast(err.message, 'error');
    btn.disabled = false;
    btn.textContent = 'Save Asset';
  }
}

async function viewAsset(id) {
  try {
    const res = await apiFetch(`/assets/${id}`);
    const asset = res.data;
    const histRes = await apiFetch(`/assets/${id}/history`);
    const history = histRes.data;

    const html = `
      <div class="detail-grid mb-6">
        <div class="detail-item"><span class="detail-label">Name</span><span class="detail-value font-medium">${asset.name}</span></div>
        <div class="detail-item"><span class="detail-label">Serial Number</span><span class="detail-value font-mono">${asset.serial_number || 'N/A'}</span></div>
        <div class="detail-item"><span class="detail-label">Category</span><span class="detail-value">${asset.category_name}</span></div>
        <div class="detail-item"><span class="detail-label">Status</span><span class="detail-value"><span class="badge status-${asset.status}">${capitalize(asset.status)}</span></span></div>
        <div class="detail-item"><span class="detail-label">Manufacturer / Model</span><span class="detail-value">${asset.manufacturer || 'N/A'} ${asset.model || ''}</span></div>
        <div class="detail-item"><span class="detail-label">Purchase Details</span><span class="detail-value">${formatDate(asset.purchase_date)} (${formatCurrency(asset.purchase_cost)})</span></div>
        ${asset.assigned_to_name ? `<div class="detail-item"><span class="detail-label">Currently Assigned To</span><span class="detail-value font-medium text-primary-light">${asset.assigned_to_name}</span></div>` : ''}
        <div class="detail-item col-span-2"><span class="detail-label">Notes</span><span class="detail-value">${asset.notes || 'No notes.'}</span></div>
      </div>

      <h4 class="text-sm font-semibold mb-3 border-b border-white/10 pb-2">Assignment History</h4>
      ${history.length > 0 ? `
        <div class="activity-list max-h-[200px] overflow-y-auto pr-2">
          ${history.map(h => `
            <div class="activity-item text-xs">
              <div class="activity-icon w-8 h-8 rounded-full bg-white/5">👤</div>
              <div class="activity-content">
                <div>Assigned to <strong>${h.user_name}</strong> by ${h.assigned_by_name}</div>
                <div class="text-muted mt-1">${formatDateTime(h.assigned_at)}</div>
                ${h.returned_at ? `<div class="text-success mt-1">↳ Returned: ${formatDateTime(h.returned_at)}</div>` : `<div class="text-warning mt-1">↳ Currently Active</div>`}
              </div>
            </div>
          `).join('')}
        </div>
      ` : `<div class="text-sm text-muted">No assignment history.</div>`}
    `;
    showModal('Asset Details', html);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function showAssignModal(assetId) {
  try {
    const asset = allAssets.find(a => a.id === assetId);
    // Fetch all active employees
    const res = await apiFetch('/users?is_active=1&limit=1000');
    const users = res.data.rows;

    const html = `
      <form id="assign-form" class="form" onsubmit="submitAssign(event, ${assetId})">
        <div class="mb-4 p-3 bg-info-light/10 border border-info/30 rounded-lg text-sm">
          Assigning: <strong>${asset.name}</strong> (${asset.serial_number || 'No Serial'})
        </div>
        <div class="form-group">
          <label>Select Employee *</label>
          <select id="asg-user" required>
            <option value="">-- Select Employee --</option>
            ${users.map(u => `<option value="${u.id}">${u.name} (${u.department})</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Assignment Notes</label>
          <textarea id="asg-notes" rows="2" placeholder="Optional notes..."></textarea>
        </div>
        <div class="modal-footer px-0 pb-0 mt-4 border-t-0">
          <button type="button" class="btn btn-ghost" onclick="closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary" id="asg-btn">Assign Asset</button>
        </div>
      </form>
    `;
    showModal('Assign Asset', html);
  } catch (err) {
    showToast('Failed to load users for assignment', 'error');
  }
}

async function submitAssign(e, assetId) {
  e.preventDefault();
  const btn = document.getElementById('asg-btn');
  btn.disabled = true;
  
  const userId = document.getElementById('asg-user').value;
  const notes = document.getElementById('asg-notes').value;

  try {
    await apiFetch(`/assets/${assetId}/assign`, {
      method: 'POST',
      body: { user_id: parseInt(userId), notes }
    });
    showToast('Asset assigned successfully', 'success');
    closeModal();
    fetchAssets();
  } catch (err) {
    showToast(err.message, 'error');
    btn.disabled = false;
  }
}

async function returnAsset(assetId) {
  if (!confirm('Confirm return of this asset? It will be marked as Available.')) return;
  try {
    await apiFetch(`/assets/${assetId}/return`, { method: 'POST' });
    showToast('Asset returned successfully', 'success');
    fetchAssets();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ── Employee Asset Views ─────────────────────────────────────────────

function renderEmployeeAssets(container) {
  container.innerHTML = `
    <div class="page-header">
      <div class="page-header-left">
        <h2>My Assets</h2>
        <p>Equipment currently assigned to you</p>
      </div>
      <button class="btn btn-primary" onclick="navigate('requests'); setTimeout(()=>showNewRequestModal('asset_request'), 100)">Request New Asset</button>
    </div>
    <div id="my-assets-grid" class="three-col">
      <div class="col-span-full text-center py-8"><div class="loader-ring mx-auto"></div></div>
    </div>
  `;
}

async function fetchEmployeeAssets(userId) {
  try {
    const res = await apiFetch(`/users/${userId}/assets`);
    const assets = res.data;
    const grid = document.getElementById('my-assets-grid');
    
    if (assets.length === 0) {
      grid.innerHTML = `<div class="col-span-full empty-state bg-card border border-border rounded-lg"><div class="empty-icon text-4xl mb-4">🖥️</div><div class="empty-title">No Assets Assigned</div><div class="empty-desc">You don't have any equipment assigned to you yet.</div></div>`;
      return;
    }

    grid.innerHTML = assets.map(a => `
      <div class="card flex flex-col h-full relative overflow-hidden group">
        <div class="absolute top-0 right-0 p-3 opacity-10 text-4xl pointer-events-none group-hover:scale-110 transition-transform">
          ${getCategoryEmoji(a.category_name)}
        </div>
        <div class="mb-4">
          <span class="badge badge-primary mb-2">${a.category_name}</span>
          <h3 class="text-lg font-bold">${a.name}</h3>
          <p class="text-xs text-muted font-mono mt-1">SN: ${a.serial_number || 'N/A'}</p>
        </div>
        <div class="mt-auto pt-4 border-t border-white/5 text-xs text-secondary flex justify-between items-center">
          <span>Assigned: ${formatDate(a.assigned_at)}</span>
          <button class="btn btn-ghost btn-xs text-warning" onclick="navigate('requests'); setTimeout(()=>showNewRequestModal('maintenance', ${a.id}), 100)" title="Report Issue">Report Issue ⚠️</button>
        </div>
      </div>
    `).join('');
  } catch (err) {
    showToast('Failed to load your assets', 'error');
  }
}

function getCategoryEmoji(cat) {
  const map = {
    'Laptop': '💻', 'Desktop': '🖥️', 'Monitor': '📺', 'Keyboard & Mouse': '⌨️',
    'Printer': '🖨️', 'Network Equipment': '🛜', 'Mobile Device': '📱', 'Projector': '📽️'
  };
  return map[cat] || '📦';
}

async function exportAssetsCSV() {
  try {
    const res = await apiFetch('/assets?limit=10000');
    const assets = res.data.rows;

    if (!assets || !assets.length) {
      showToast('No asset data to export', 'warning');
      return;
    }

    const headers = ['Asset Name', 'Serial Number', 'Manufacturer', 'Model', 'Category', 'Status', 'Location', 'Purchase Date', 'Purchase Cost (INR)', 'Assigned To', 'Notes'];
    const rows = assets.map(a => [
      a.name || '',
      a.serial_number || '',
      a.manufacturer || '',
      a.model || '',
      a.category_name || '',
      capitalize(a.status || ''),
      a.location || '',
      a.purchase_date ? a.purchase_date.split(' ')[0] : '',
      a.purchase_cost || 0,
      a.assigned_to_name || 'Unassigned',
      a.notes || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `asset_inventory_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    showToast('Assets exported successfully', 'success');
  } catch (err) {
    showToast('Failed to export assets', 'error');
  }
}
