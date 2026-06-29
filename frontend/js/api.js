/* ================================================================
   AssetFlow - Core API Client & Utilities
   ================================================================ */

const API_BASE = '/api';

let _authToken = null;
let _authUser = null;

function setAuth(token, user) {
  _authToken = token;
  _authUser = user;
}

function getAuthToken() { return _authToken; }
function getAuthUser() { return _authUser; }
function clearAuth() { _authToken = null; _authUser = null; }

/**
 * Fetch wrapper that handles auth headers and unified error handling
 */
async function apiFetch(endpoint, options = {}) {
  const token = _authToken;

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers
  };

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, config);
    const data = await res.json();

    if (!res.ok) {
      if (res.status === 401 && endpoint !== '/auth/login') {
        clearAuth();
        window.location.hash = '';
        window.location.reload();
      }
      throw new Error(data.message || 'An error occurred');
    }

    return data;
  } catch (err) {
    throw err;
  }
}

/**
 * Global Toast Notification System
 */
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };

  toast.innerHTML = `
    <div class="toast-icon">${icons[type]}</div>
    <div class="toast-message">${message}</div>
  `;

  container.appendChild(toast);

  // Auto remove after 4 seconds
  setTimeout(() => {
    toast.classList.add('closing');
    toast.addEventListener('animationend', () => toast.remove());
  }, 4000);
}

/**
 * Modal System
 */
function showModal(title, contentHtml) {
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-body').innerHTML = contentHtml;
  document.getElementById('modal-overlay').classList.remove('hidden');
}

function closeModal(e) {
  if (e && e.target !== document.getElementById('modal-overlay')) return;
  document.getElementById('modal-overlay').classList.add('hidden');
}

/**
 * Utility: Format Date
 */
function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr + 'Z');
  if (isNaN(d.getTime())) return dateStr;
  const opts = { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'Asia/Kolkata' };
  return d.toLocaleDateString('en-IN', opts);
}

function formatDateTime(dateStr) {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr + 'Z');
  if (isNaN(d.getTime())) return dateStr;
  const opts = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' };
  return d.toLocaleString('en-IN', opts);
}

/**
 * Utility: Format Currency
 */
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}

/**
 * Utility: Capitalize First Letter
 */
function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, ' ');
}

/**
 * Export data to CSV file
 */
function exportToCSV(data, filename) {
  if (!data || !data.length) {
    showToast('No data to export', 'warning');
    return;
  }
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(h => {
      const val = (row[h] !== null && row[h] !== undefined) ? String(row[h]).replace(/"/g, '""') : '';
      return `"${val}"`;
    }).join(','))
  ].join('\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  showToast('CSV exported successfully', 'success');
}

/**
 * Export report data to CSV with clear column headers (reads from global report data stores)
 */
function exportReportCSV(type) {
  const data = type === 'asset' ? window._reportAssetData : window._reportRequestData;

  if (!data || !data.length) {
    showToast('No data to export', 'warning');
    return;
  }

  let headers, rows, filename;

  if (type === 'asset') {
    filename = 'asset_inventory';
    headers = ['Asset Name', 'Serial Number', 'Manufacturer', 'Model', 'Category', 'Status', 'Location', 'Purchase Date', 'Purchase Cost (INR)', 'Assigned To', 'Department'];
    rows = data.map(a => [
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
      a.assigned_department || ''
    ]);
  } else {
    filename = 'service_requests';
    headers = ['Request ID', 'Date Submitted', 'Type', 'Priority', 'Title', 'Description', 'Status', 'Requester Name', 'Department', 'Assigned To', 'Resolved At'];
    rows = data.map(r => [
      `REQ-${String(r.id).padStart(4, '0')}`,
      r.created_at ? r.created_at.split(' ')[0] : '',
      capitalize(r.type || ''),
      capitalize(r.priority || ''),
      r.title || '',
      r.description || '',
      capitalize(r.status || ''),
      r.requester_name || '',
      r.department || '',
      r.assigned_to_name || '',
      r.resolved_at ? r.resolved_at.split(' ')[0] : ''
    ]);
  }

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  showToast('CSV exported successfully', 'success');
}

/**
 * Loading State Management
 */
function showLoading() {
  document.getElementById('loading-overlay').classList.remove('hidden');
}

function hideLoading() {
  document.getElementById('loading-overlay').classList.add('hidden');
}
