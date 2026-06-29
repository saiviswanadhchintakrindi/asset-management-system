/* ================================================================
   AssetFlow - Employees Management (Admin)
   ================================================================ */

let allEmployees = [];
let empFilters = { page: 1, limit: 15 };

async function loadEmployees() {
  const content = document.getElementById('page-content');
  
  content.innerHTML = `
    <div class="page-header">
      <div class="page-header-left">
        <h2>Employee Directory</h2>
        <p>Manage user accounts, roles, and departments</p>
      </div>
      <div class="flex gap-2">
        <button class="btn btn-secondary" onclick="exportEmployeesCSV()">📥 Export CSV</button>
        <button class="btn btn-primary" onclick="showEmployeeModal()">+ Add Employee</button>
      </div>
    </div>

    <div class="table-container">
      <div class="table-header">
        <div class="table-filters w-full">
          <input type="text" id="emp-search" class="search-input flex-1" placeholder="Search name, email..." oninput="debounceFilterEmp()" />
          <select id="emp-role" onchange="filterEmp()">
            <option value="">All Roles</option>
            <option value="employee">Employee</option>
            <option value="admin">Admin</option>
          </select>
          <select id="emp-status" onchange="filterEmp()">
            <option value="">All Statuses</option>
            <option value="1" selected>Active</option>
            <option value="0">Deactivated</option>
          </select>
        </div>
      </div>
      <div class="overflow-x-auto">
        <table class="data-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Department</th>
              <th>Role</th>
              <th>Status</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="emp-tbody">
            <tr><td colspan="6" class="text-center py-8"><div class="loader-ring mx-auto"></div></td></tr>
          </tbody>
        </table>
      </div>
      <div id="emp-pagination" class="pagination hidden"></div>
    </div>
  `;

  // Set initial filter values to match UI default
  empFilters.is_active = 1;
  await fetchEmployees();
}

let empFilterTimeout;
function debounceFilterEmp() {
  clearTimeout(empFilterTimeout);
  empFilterTimeout = setTimeout(() => { empFilters.page = 1; filterEmp(); }, 400);
}

function filterEmp() {
  empFilters.search = document.getElementById('emp-search').value;
  empFilters.role = document.getElementById('emp-role').value;
  empFilters.is_active = document.getElementById('emp-status').value;
  fetchEmployees();
}

async function fetchEmployees() {
  try {
    const params = new URLSearchParams(Object.entries(empFilters).filter(([_,v]) => v !== ''));
    const res = await apiFetch(`/users?${params.toString()}`);
    allEmployees = res.data.rows;
    renderEmployeesTable(res.data);
  } catch (err) {
    showToast('Failed to load employees', 'error');
  }
}

function renderEmployeesTable(data) {
  const tbody = document.getElementById('emp-tbody');

  if (allEmployees.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state py-8"><div class="empty-icon text-3xl">👥</div><div class="empty-title">No employees found</div></div></td></tr>`;
    document.getElementById('emp-pagination').classList.add('hidden');
    return;
  }

  tbody.innerHTML = allEmployees.map(u => `
    <tr>
      <td>
        <div class="flex items-center gap-4">
          <div class="user-avatar-sm" style="${u.role==='admin' ? 'background: linear-gradient(135deg, var(--danger), var(--warning))' : ''}">${u.name.charAt(0).toUpperCase()}</div>
          <div>
            <div class="font-medium text-sm">${u.name}</div>
            <div class="text-xs text-muted mt-0.5">${u.email}</div>
          </div>
        </div>
      </td>
      <td>${u.department || '—'}</td>
      <td>
        ${u.role === 'admin' 
          ? '<span class="badge badge-danger text-[10px] uppercase">Admin</span>' 
          : '<span class="badge badge-muted text-[10px] uppercase">Employee</span>'}
      </td>
      <td>
        ${u.is_active 
          ? '<span class="badge status-completed px-2">Active</span>' 
          : '<span class="badge status-retired px-2">Inactive</span>'}
      </td>
      <td class="text-xs text-muted">${formatDate(u.created_at)}</td>
      <td>
        <div class="table-actions">
          <button class="btn btn-ghost btn-xs" onclick="viewEmployee(${u.id})" title="View Details">👁</button>
          <button class="btn btn-ghost btn-xs" onclick="showEmployeeModal(${u.id})" title="Edit">✏️</button>
          ${u.is_active && u.id !== getCurrentUser().id ? `<button class="btn btn-ghost btn-xs text-danger" onclick="deactivateEmployee(${u.id}, '${u.name}')" title="Deactivate">🚫</button>` : ''}
        </div>
      </td>
    </tr>
  `).join('');

  if (data.pages > 1) {
    const pContainer = document.getElementById('emp-pagination');
    pContainer.classList.remove('hidden');
    pContainer.innerHTML = `
      <div class="pagination-info">Showing page ${data.page} of ${data.pages}</div>
      <div class="pagination-btns">
        <button class="page-btn" ${data.page === 1 ? 'disabled' : ''} onclick="changeEmpPage(${data.page - 1})">Prev</button>
        <button class="page-btn" ${data.page === data.pages ? 'disabled' : ''} onclick="changeEmpPage(${data.page + 1})">Next</button>
      </div>
    `;
  } else {
    document.getElementById('emp-pagination').classList.add('hidden');
  }
}

function changeEmpPage(p) { empFilters.page = p; fetchEmployees(); }

// ── Modals & Actions ────────────────────────────────────────────────

function showEmployeeModal(id = null) {
  const emp = id ? allEmployees.find(e => e.id === id) : null;
  const title = emp ? 'Edit Employee' : 'Add New Employee';
  
  const html = `
    <form id="emp-form" class="form" onsubmit="saveEmployee(event, ${id})">
      <div class="form-row">
        <div class="form-group">
          <label>Full Name *</label>
          <input type="text" id="em-name" required value="${emp?.name || ''}">
        </div>
        <div class="form-group">
          <label>Email Address *</label>
          <input type="email" id="em-email" required value="${emp?.email || ''}">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Department</label>
          <input type="text" id="em-dept" value="${emp?.department || ''}" placeholder="e.g. Engineering">
        </div>
        <div class="form-group">
          <label>Phone Number</label>
          <input type="tel" id="em-phone" value="${emp?.phone || ''}">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>System Role *</label>
          <select id="em-role" required ${emp?.id === getCurrentUser().id ? 'disabled' : ''}>
            <option value="employee" ${emp?.role === 'employee' ? 'selected' : ''}>Employee</option>
            <option value="admin" ${emp?.role === 'admin' ? 'selected' : ''}>Administrator</option>
          </select>
        </div>
        ${!emp ? `
          <div class="form-group">
            <label>Initial Password</label>
            <input type="password" id="em-pass" placeholder="Leave empty for 'Welcome@123'">
          </div>
        ` : `
          <div class="form-group">
            <label>Account Status</label>
            <select id="em-status" ${emp.id === getCurrentUser().id ? 'disabled' : ''}>
              <option value="1" ${emp.is_active ? 'selected' : ''}>Active</option>
              <option value="0" ${!emp.is_active ? 'selected' : ''}>Deactivated</option>
            </select>
          </div>
        `}
      </div>
      <div class="modal-footer px-0 pb-0 mt-4 border-t-0">
        <button type="button" class="btn btn-ghost" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn btn-primary" id="em-save-btn">Save Employee</button>
      </div>
    </form>
  `;
  showModal(title, html);
}

async function saveEmployee(e, id) {
  e.preventDefault();
  const btn = document.getElementById('em-save-btn');
  btn.disabled = true;

  const data = {
    name: document.getElementById('em-name').value,
    email: document.getElementById('em-email').value,
    department: document.getElementById('em-dept').value || null,
    phone: document.getElementById('em-phone').value || null,
    role: document.getElementById('em-role')?.value,
  };

  if (!id) {
    const pass = document.getElementById('em-pass').value;
    if (pass) data.password = pass;
  } else {
    data.is_active = document.getElementById('em-status')?.value === '1';
  }

  try {
    if (id) {
      await apiFetch(`/users/${id}`, { method: 'PUT', body: data });
      showToast('Employee updated', 'success');
    } else {
      await apiFetch('/users', { method: 'POST', body: data });
      showToast('Employee created', 'success');
    }
    closeModal();
    fetchEmployees();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function exportEmployeesCSV() {
  try {
    // Fetch all employees without pagination
    const res = await apiFetch('/users?limit=10000');
    const employees = res.data.rows;

    if (!employees || !employees.length) {
      showToast('No employee data to export', 'warning');
      return;
    }

    const headers = ['Name', 'Email', 'Department', 'Role', 'Phone', 'Status', 'Joined Date'];
    const rows = employees.map(e => [
      e.name || '',
      e.email || '',
      e.department || '',
      capitalize(e.role || ''),
      e.phone || '',
      e.is_active ? 'Active' : 'Inactive',
      e.created_at ? e.created_at.split(' ')[0] : ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `employees_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    showToast('Employees exported successfully', 'success');
  } catch (err) {
    showToast('Failed to export employees', 'error');
  }
}

async function viewEmployee(id) {
  try {
    const emp = allEmployees.find(e => e.id === id) || (await apiFetch(`/users/${id}`)).data;
    const resAssets = await apiFetch(`/users/${id}/assets`);
    const assets = resAssets.data;

    const html = `
      <div class="flex items-center gap-6 mb-6 pb-6 border-b border-white/10">
        <div class="user-avatar w-16 h-16 text-xl shadow-lg" style="${emp.role==='admin' ? 'background: linear-gradient(135deg, var(--danger), var(--warning))' : ''}">${emp.name.charAt(0).toUpperCase()}</div>
        <div>
          <h3 class="text-xl font-bold flex items-center gap-2">
            ${emp.name}
            ${!emp.is_active ? '<span class="badge status-retired text-[10px]">Inactive</span>' : ''}
          </h3>
          <div class="text-sm text-secondary mt-1">${emp.email} • ${emp.phone || 'No phone'}</div>
          <div class="flex gap-2 mt-2">
            <span class="badge badge-primary">${emp.department || 'No Dept'}</span>
            <span class="badge ${emp.role==='admin'?'badge-danger':'badge-muted'}">${capitalize(emp.role)}</span>
          </div>
        </div>
      </div>

      <h4 class="text-sm font-semibold mb-3 border-b border-white/10 pb-2 flex justify-between">
        <span>Assigned Assets</span>
        <span class="badge badge-muted">${assets.length}</span>
      </h4>
      
      ${assets.length > 0 ? `
        <div class="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2">
          ${assets.map(a => `
            <div class="bg-bg-input border border-border p-3 rounded-lg flex flex-col cursor-pointer hover:border-primary/50 transition-colors" onclick="closeModal(); setTimeout(()=> {navigate('assets'); viewAsset(${a.id})}, 100)">
              <div class="flex justify-between items-start mb-2">
                <span class="badge badge-primary text-[9px] py-0 px-1.5">${a.category_name}</span>
                <span class="text-[10px] text-muted">${formatDate(a.assigned_at)}</span>
              </div>
              <div class="font-medium text-sm truncate">${a.name}</div>
              <div class="text-xs text-muted font-mono mt-0.5 truncate">${a.serial_number || 'No SN'}</div>
            </div>
          `).join('')}
        </div>
      ` : `<div class="text-center text-muted py-4 text-sm bg-bg-input rounded border border-border">No assets currently assigned to this employee.</div>`}
    `;
    showModal('Employee Profile', html);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function deactivateEmployee(id, name) {
  if (!confirm(`Are you sure you want to deactivate ${name}? They will no longer be able to log in.`)) return;
  try {
    await apiFetch(`/users/${id}`, { method: 'DELETE' });
    showToast(`${name} deactivated successfully`, 'success');
    fetchEmployees();
  } catch (err) {
    showToast(err.message, 'error');
  }
}
