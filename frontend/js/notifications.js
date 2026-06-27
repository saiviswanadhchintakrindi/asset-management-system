/* ================================================================
   AssetFlow - Notifications Logic
   ================================================================ */

let allNotifications = [];
let notifFilters = { page: 1, limit: 20 };

async function loadNotifications() {
  const content = document.getElementById('page-content');
  
  content.innerHTML = `
    <div class="page-header">
      <div class="page-header-left">
        <h2>Notifications</h2>
        <p>Your recent alerts and system messages</p>
      </div>
      <button class="btn btn-secondary" onclick="markAllNotificationsRead()">Mark All as Read</button>
    </div>

    <div class="card p-0">
      <div id="notif-list-container">
        <div class="text-center py-8"><div class="loader-ring mx-auto"></div></div>
      </div>
      <div id="notif-pagination" class="pagination hidden border-t border-border"></div>
    </div>
  `;

  await fetchNotifications();
}

async function fetchNotifications() {
  try {
    const params = new URLSearchParams(Object.entries(notifFilters));
    const res = await apiFetch(`/notifications?${params.toString()}`);
    allNotifications = res.data.rows;
    renderNotificationsList(res.data);
    updateNotificationBadges(res.data.unread);
  } catch (err) {
    showToast('Failed to load notifications', 'error');
  }
}

function renderNotificationsList(data) {
  const container = document.getElementById('notif-list-container');
  if (!container) return;

  if (allNotifications.length === 0) {
    container.innerHTML = `<div class="empty-state py-12"><div class="empty-icon text-4xl">🔕</div><div class="empty-title">All Caught Up</div><div class="empty-desc">You don't have any notifications at the moment.</div></div>`;
    document.getElementById('notif-pagination').classList.add('hidden');
    return;
  }

  container.innerHTML = `
    <div class="notif-list">
      ${allNotifications.map(n => `
        <div class="notif-item ${n.is_read ? '' : 'unread'}" onclick="handleNotifClick(${n.id}, ${n.is_read}, '${n.reference_type}', ${n.reference_id})">
          <div class="notif-icon-wrap notif-icon-${n.type}">
            ${getNotifIcon(n.type)}
          </div>
          <div class="notif-content">
            <div class="notif-title text-${n.type === 'error' ? 'danger' : n.type === 'success' ? 'success' : 'primary'}">${n.title}</div>
            <div class="notif-message">${n.message}</div>
            <div class="notif-time">${formatDateTime(n.created_at)}</div>
          </div>
          ${!n.is_read ? `<div class="notif-dot-indicator"></div>` : ''}
        </div>
      `).join('')}
    </div>
  `;

  if (data.pages > 1) {
    const pContainer = document.getElementById('notif-pagination');
    pContainer.classList.remove('hidden');
    pContainer.innerHTML = `
      <div class="pagination-info">Showing page ${data.page} of ${data.pages}</div>
      <div class="pagination-btns">
        <button class="page-btn" ${data.page === 1 ? 'disabled' : ''} onclick="changeNotifPage(${data.page - 1})">Prev</button>
        <button class="page-btn" ${data.page === data.pages ? 'disabled' : ''} onclick="changeNotifPage(${data.page + 1})">Next</button>
      </div>
    `;
  } else {
    document.getElementById('notif-pagination').classList.add('hidden');
  }
}

function changeNotifPage(p) { notifFilters.page = p; fetchNotifications(); }

function getNotifIcon(type) {
  const icons = { info: 'ℹ️', success: '✅', warning: '⚠️', error: '❌' };
  return icons[type] || '🔔';
}

async function handleNotifClick(id, isRead, refType, refId) {
  if (!isRead) {
    try {
      await apiFetch(`/notifications/${id}/read`, { method: 'PUT' });
      // Update local state to avoid refetching everything immediately
      const n = allNotifications.find(x => x.id === id);
      if (n) n.is_read = 1;
      
      // Update badges manually or refetch slightly delayed
      setTimeout(() => checkUnreadNotifications(), 500);
      
      // Visual update
      renderNotificationsList({ rows: allNotifications, pages: document.getElementById('notif-pagination').classList.contains('hidden') ? 1 : 2, page: notifFilters.page });
    } catch (err) {
      console.error(err);
    }
  }

  if (refType === 'request' && refId) {
    navigate('requests');
    setTimeout(() => viewRequest(refId), 200);
  } else if (refType === 'asset') {
    navigate('assets');
  }
}

async function markAllNotificationsRead() {
  try {
    await apiFetch('/notifications/read-all', { method: 'PUT' });
    showToast('All notifications marked as read', 'success');
    fetchNotifications();
    updateNotificationBadges(0);
  } catch (err) {
    showToast('Failed to update notifications', 'error');
  }
}

async function checkUnreadNotifications() {
  try {
    const res = await apiFetch('/notifications?limit=1');
    updateNotificationBadges(res.data.unread);
  } catch (e) {
    // silently fail
  }
}

function updateNotificationBadges(count) {
  const dot = document.getElementById('notif-dot');
  const badge = document.getElementById('notif-badge');
  
  if (count > 0) {
    if (dot) dot.style.display = 'block';
    if (badge) {
      badge.textContent = count > 9 ? '9+' : count;
      badge.style.display = 'inline-block';
    }
  } else {
    if (dot) dot.style.display = 'none';
    if (badge) badge.style.display = 'none';
  }
}
