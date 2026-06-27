/* ================================================================
   AssetFlow - Service Requests Logic
   ================================================================ */

let allRequests = [];
let requestFilters = { page: 1, limit: 15 };

async function loadRequests() {
  const user = getCurrentUser();
  const content = document.getElementById('page-content');
  
  content.innerHTML = `
    <div class="page-header">
      <div class="page-header-left">
        <h2>Service Requests</h2>
        <p>${user.role === 'admin' ? 'Manage employee requests and issues' : 'Track your support tickets and asset requests'}</p>
      </div>
      <button class="btn btn-primary" onclick="showNewRequestModal()">Raise Request</button>
    </div>

    <div class="table-container">
      <div class="table-header">
        <div class="table-filters w-full">
          <input type="text" id="req-search" class="search-input flex-1" placeholder="Search requests..." oninput="debounceFilterReq()" />
          <select id="req-status" onchange="filterReq()">
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
          </select>
          <select id="req-type" onchange="filterReq()">
            <option value="">All Types</option>
            <option value="asset_request">Asset Request</option>
            <option value="maintenance">Maintenance</option>
            <option value="service">Service/Access</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>
      <div class="overflow-x-auto">
        <table class="data-table">
          <thead>
            <tr>
              <th>Request ID & Title</th>
              ${user.role === 'admin' ? '<th>Requester</th>' : ''}
              <th>Type & Priority</th>
              <th>Status</th>
              <th>Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody id="req-tbody">
            <tr><td colspan="6" class="text-center py-8"><div class="loader-ring mx-auto"></div></td></tr>
          </tbody>
        </table>
      </div>
      <div id="req-pagination" class="pagination hidden"></div>
    </div>
  `;

  await fetchRequests();
}

let reqFilterTimeout;
function debounceFilterReq() {
  clearTimeout(reqFilterTimeout);
  reqFilterTimeout = setTimeout(() => { requestFilters.page = 1; filterReq(); }, 400);
}

function filterReq() {
  requestFilters.search = document.getElementById('req-search').value;
  requestFilters.status = document.getElementById('req-status').value;
  requestFilters.type = document.getElementById('req-type').value;
  fetchRequests();
}

async function fetchRequests() {
  try {
    const params = new URLSearchParams(Object.entries(requestFilters).filter(([_,v]) => v !== ''));
    const res = await apiFetch(`/requests?${params.toString()}`);
    allRequests = res.data.rows;
    renderRequestsTable(res.data);
  } catch (err) {
    showToast('Failed to load requests', 'error');
  }
}

function renderRequestsTable(data) {
  const tbody = document.getElementById('req-tbody');
  const user = getCurrentUser();

  if (allRequests.length === 0) {
    tbody.innerHTML = `<tr><td colspan="${user.role==='admin'?6:5}"><div class="empty-state py-8"><div class="empty-icon text-3xl">📋</div><div class="empty-title">No requests found</div></div></td></tr>`;
    document.getElementById('req-pagination').classList.add('hidden');
    return;
  }

  tbody.innerHTML = allRequests.map(r => `
    <tr class="cursor-pointer hover:bg-white/5 transition-colors" onclick="viewRequest(${r.id})">
      <td>
        <div class="font-medium text-sm">REQ-${r.id.toString().padStart(4, '0')}</div>
        <div class="text-xs text-muted truncate max-w-[200px] mt-1" title="${r.title}">${r.title}</div>
      </td>
      ${user.role === 'admin' ? `
      <td>
        <div class="font-medium text-xs">${r.requester_name}</div>
        <div class="text-[10px] text-muted">${r.department}</div>
      </td>` : ''}
      <td>
        <div class="text-xs">${capitalize(r.type)}</div>
        <div class="mt-1"><span class="badge priority-${r.priority} px-2 py-0.5 text-[9px] uppercase tracking-wider">${r.priority}</span></div>
      </td>
      <td><span class="badge status-${r.status}">${capitalize(r.status)}</span></td>
      <td class="text-xs text-muted">${formatDate(r.created_at)}</td>
      <td><button class="btn btn-ghost btn-xs" onclick="event.stopPropagation(); viewRequest(${r.id})">View →</button></td>
    </tr>
  `).join('');

  // Render pagination
  if (data.pages > 1) {
    const pContainer = document.getElementById('req-pagination');
    pContainer.classList.remove('hidden');
    pContainer.innerHTML = `
      <div class="pagination-info">Showing page ${data.page} of ${data.pages} (Total: ${data.total})</div>
      <div class="pagination-btns">
        <button class="page-btn" ${data.page === 1 ? 'disabled' : ''} onclick="changeReqPage(${data.page - 1})">Prev</button>
        <button class="page-btn" ${data.page === data.pages ? 'disabled' : ''} onclick="changeReqPage(${data.page + 1})">Next</button>
      </div>
    `;
  } else {
    document.getElementById('req-pagination').classList.add('hidden');
  }
}

function changeReqPage(p) { requestFilters.page = p; fetchRequests(); }

// ── Create Request ───────────────────────────────────────────────────

async function showNewRequestModal(defaultType = '', defaultAssetId = null) {
  try {
    let assetsHtml = '';
    // If employee wants to report maintenance, let them pick from their assigned assets
    if (getCurrentUser().role === 'employee') {
      const res = await apiFetch(`/users/${getCurrentUser().id}/assets`);
      const myAssets = res.data;
      if (myAssets.length > 0) {
        assetsHtml = `
          <div class="form-group" id="req-asset-group" style="${defaultType === 'maintenance' ? '' : 'display:none'}">
            <label>Related Asset</label>
            <select id="new-req-asset">
              <option value="">-- Select Asset --</option>
              ${myAssets.map(a => `<option value="${a.id}" ${defaultAssetId == a.id ? 'selected' : ''}>${a.name} (${a.serial_number || 'No SN'})</option>`).join('')}
            </select>
          </div>
        `;
      }
    }

    const html = `
      <form id="new-req-form" class="form" onsubmit="submitNewRequest(event)">
        <div class="form-row">
          <div class="form-group">
            <label>Request Type *</label>
            <select id="new-req-type" required onchange="document.getElementById('req-asset-group')?.style.setProperty('display', this.value === 'maintenance' ? 'block' : 'none')">
              <option value="">Select Type</option>
              <option value="asset_request" ${defaultType === 'asset_request' ? 'selected' : ''}>New Asset Request</option>
              <option value="maintenance" ${defaultType === 'maintenance' ? 'selected' : ''}>Maintenance / Repair</option>
              <option value="service" ${defaultType === 'service' ? 'selected' : ''}>Service / Access (VPN, Software)</option>
              <option value="other" ${defaultType === 'other' ? 'selected' : ''}>Other</option>
            </select>
          </div>
          <div class="form-group">
            <label>Priority</label>
            <select id="new-req-priority">
              <option value="low">Low - When possible</option>
              <option value="medium" selected>Medium - Standard</option>
              <option value="high">High - Blocking some work</option>
              <option value="critical">Critical - Completely blocked</option>
            </select>
          </div>
        </div>
        ${assetsHtml}
        <div class="form-group">
          <label>Summary / Title *</label>
          <input type="text" id="new-req-title" required placeholder="Brief summary of request (min 5 chars)" minlength="5">
        </div>
        <div class="form-group">
          <label>Detailed Description *</label>
          <textarea id="new-req-desc" required rows="4" placeholder="Please provide as much detail as possible to help us resolve this quickly... (min 10 chars)" minlength="10"></textarea>
        </div>
        <div class="modal-footer px-0 pb-0 mt-4 border-t-0">
          <button type="button" class="btn btn-ghost" onclick="closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary" id="new-req-btn">Submit Request</button>
        </div>
      </form>
    `;
    showModal('Raise Service Request', html);
  } catch (err) {
    showToast('Error preparing request form', 'error');
  }
}

async function submitNewRequest(e) {
  e.preventDefault();
  const btn = document.getElementById('new-req-btn');
  btn.disabled = true;

  const data = {
    type: document.getElementById('new-req-type').value,
    priority: document.getElementById('new-req-priority').value,
    title: document.getElementById('new-req-title').value,
    description: document.getElementById('new-req-desc').value,
  };

  const assetEl = document.getElementById('new-req-asset');
  if (assetEl && data.type === 'maintenance' && assetEl.value) {
    data.asset_id = parseInt(assetEl.value);
  }

  try {
    await apiFetch('/requests', { method: 'POST', body: data });
    showToast('Request submitted successfully', 'success');
    closeModal();
    if (document.getElementById('req-tbody')) fetchRequests();
    else navigate('requests'); // if coming from dashboard
  } catch (err) {
    showToast(err.message, 'error');
    btn.disabled = false;
  }
}

// ── View Request & Comments ──────────────────────────────────────────

async function viewRequest(id) {
  try {
    const [resReq, resCom] = await Promise.all([
      apiFetch(`/requests/${id}`),
      apiFetch(`/requests/${id}/comments`)
    ]);
    const req = resReq.data;
    const comments = resCom.data;
    const user = getCurrentUser();
    const isAdmin = user.role === 'admin';

    let adminControls = '';
    if (isAdmin) {
      const statuses = ['pending', 'approved', 'in_progress', 'completed', 'rejected', 'cancelled'];
      adminControls = `
        <div class="bg-card-hover p-4 rounded-lg border border-border mt-6">
          <h4 class="text-sm font-semibold mb-3">Admin Controls</h4>
          <div class="flex gap-4 items-end">
            <div class="form-group flex-1">
              <label class="text-xs">Update Status</label>
              <select id="update-req-status" class="w-full">
                ${statuses.map(s => `<option value="${s}" ${req.status === s ? 'selected' : ''}>${capitalize(s)}</option>`).join('')}
              </select>
            </div>
            <button class="btn btn-primary" onclick="updateRequestStatus(${req.id})">Update Status</button>
          </div>
          ${req.status === 'pending' && req.type === 'asset_request' ? `
            <div class="mt-4 p-3 bg-info/10 border border-info/30 rounded text-sm text-info-light">
              💡 <strong>Tip:</strong> If approving this asset request, you can go to Assets > Assign to assign the requested equipment.
            </div>
          ` : ''}
        </div>
      `;
    }

    const html = `
      <div class="flex justify-between items-start mb-6">
        <div>
          <h3 class="text-lg font-bold">REQ-${req.id.toString().padStart(4,'0')}: ${req.title}</h3>
          <div class="text-xs text-muted mt-1">Submitted by ${req.requester_name} (${req.department}) on ${formatDateTime(req.created_at)}</div>
        </div>
        <span class="badge status-${req.status} px-3 py-1 text-xs">${capitalize(req.status)}</span>
      </div>

      <div class="grid grid-cols-3 gap-4 mb-6 text-sm">
        <div class="bg-bg-input p-3 rounded border border-border">
          <div class="text-muted text-xs uppercase mb-1">Type</div>
          <div class="font-medium">${capitalize(req.type)}</div>
        </div>
        <div class="bg-bg-input p-3 rounded border border-border">
          <div class="text-muted text-xs uppercase mb-1">Priority</div>
          <div><span class="badge priority-${req.priority}">${req.priority.toUpperCase()}</span></div>
        </div>
        <div class="bg-bg-input p-3 rounded border border-border">
          <div class="text-muted text-xs uppercase mb-1">Related Asset</div>
          <div class="font-medium truncate">${req.asset_name ? `${req.asset_name} (${req.asset_serial})` : 'None'}</div>
        </div>
      </div>

      <div class="mb-6">
        <h4 class="text-sm font-semibold text-muted uppercase mb-2">Description</h4>
        <div class="bg-bg-input p-4 rounded-lg border border-border whitespace-pre-wrap text-sm leading-relaxed">${req.description}</div>
      </div>

      ${adminControls}

      <div class="mt-8 border-t border-border pt-6">
        <h4 class="font-semibold mb-4 flex items-center gap-2">
          <span>Discussion Thread</span>
          <span class="badge badge-muted">${comments.length}</span>
        </h4>
        
        <div class="comment-thread max-h-[300px] overflow-y-auto pr-2" id="req-comments-list">
          ${comments.map(c => renderCommentNode(c)).join('')}
          ${comments.length === 0 ? '<div class="text-center text-muted py-4 text-sm">No comments yet.</div>' : ''}
        </div>

        <form class="comment-form" onsubmit="addComment(event, ${req.id})">
          <textarea id="req-new-comment" required placeholder="Type a message or update..."></textarea>
          <button type="submit" class="btn btn-primary btn-icon" id="req-comment-btn" title="Send" style="height:auto">➤</button>
        </form>
      </div>
    `;
    showModal('Request Details', html);
    
    // Auto-scroll comments to bottom
    setTimeout(() => {
      const cList = document.getElementById('req-comments-list');
      if(cList) cList.scrollTop = cList.scrollHeight;
    }, 10);

  } catch (err) {
    showToast('Failed to load request details', 'error');
  }
}

function renderCommentNode(c) {
  const isMe = c.user_id === getCurrentUser().id;
  const initial = c.user_name.charAt(0).toUpperCase();
  return `
    <div class="comment-item ${isMe ? 'flex-row-reverse' : ''}">
      <div class="comment-avatar" style="${c.role==='admin' ? 'background: linear-gradient(135deg, var(--danger), var(--warning))' : ''}">${initial}</div>
      <div class="comment-content ${isMe ? 'text-right' : ''}">
        <div class="comment-header ${isMe ? 'flex-row-reverse' : ''}">
          <span class="comment-author">${c.user_name}</span>
          ${c.role === 'admin' ? '<span class="comment-role badge badge-danger py-0 px-1.5 text-[9px] leading-tight">Admin</span>' : ''}
          <span class="comment-time">${formatDateTime(c.created_at)}</span>
        </div>
        <div class="comment-body ${isMe ? 'bg-primary/10 border-primary/20 text-left rounded-tr-none' : 'rounded-tl-none'} inline-block max-w-[85%] text-left whitespace-pre-wrap">
          ${c.comment}
        </div>
      </div>
    </div>
  `;
}

async function addComment(e, reqId) {
  e.preventDefault();
  const input = document.getElementById('req-new-comment');
  const btn = document.getElementById('req-comment-btn');
  const text = input.value.trim();
  if (!text) return;

  btn.disabled = true;
  try {
    const res = await apiFetch(`/requests/${reqId}/comments`, { method: 'POST', body: { comment: text } });
    input.value = '';
    
    const list = document.getElementById('req-comments-list');
    if (list.innerHTML.includes('No comments yet')) list.innerHTML = '';
    list.insertAdjacentHTML('beforeend', renderCommentNode(res.data));
    list.scrollTop = list.scrollHeight;
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btn.disabled = false;
  }
}

async function updateRequestStatus(reqId) {
  const status = document.getElementById('update-req-status').value;
  try {
    await apiFetch(`/requests/${reqId}/status`, { method: 'PUT', body: { status } });
    showToast('Status updated successfully', 'success');
    viewRequest(reqId); // Reload modal
    fetchRequests(); // Refresh background table
  } catch (err) {
    showToast(err.message, 'error');
  }
}
