/* ================================================================
   AssetFlow - Main Application SPA Logic
   ================================================================ */

document.addEventListener('DOMContentLoaded', () => {
  const user = getCurrentUser();

  if (!user) {
    // Show login page
    const authView = document.getElementById('auth-page') || document.getElementById('auth-view');
    if (authView) authView.classList.remove('hidden');
    const appView = document.getElementById('app-view') || document.getElementById('app');
    if (appView) appView.classList.add('hidden');
    if (typeof hideLoading === 'function') hideLoading();
    return;
  }

  // User is logged in
  const authView = document.getElementById('auth-page') || document.getElementById('auth-view');
  if (authView) authView.classList.add('hidden');
  const appView = document.getElementById('app-view') || document.getElementById('app');
  if (appView) appView.classList.remove('hidden');

  // Set user info in sidebar
  const nameEl = document.getElementById('nav-user-name') || document.getElementById('sidebar-user-name');
  if (nameEl) nameEl.textContent = user.name;
  
  const roleEl = document.getElementById('nav-user-role') || document.getElementById('sidebar-user-role');
  if (roleEl) roleEl.textContent = capitalize(user.role);
  
  const avatar = document.getElementById('nav-avatar') || document.getElementById('sidebar-user-avatar');
  if (avatar) {
    avatar.textContent = user.name.charAt(0).toUpperCase();
    if (user.role === 'admin') {
      avatar.style.background = 'linear-gradient(135deg, var(--danger), var(--warning))';
    }
  }

  const topbarName = document.getElementById('topbar-name');
  if (topbarName) topbarName.textContent = user.name.split(' ')[0]; // first name

  const topbarAvatar = document.getElementById('topbar-avatar');
  if (topbarAvatar) {
    topbarAvatar.textContent = user.name.charAt(0).toUpperCase();
    if (user.role === 'admin') {
      topbarAvatar.style.background = 'linear-gradient(135deg, var(--danger), var(--warning))';
    }
  }

  // Build navigation based on role
  buildNavigation(user.role);

  // Initialize routing
  window.addEventListener('hashchange', handleRoute);
  
  // Initial route
  if (!window.location.hash) {
    window.location.hash = '#dashboard';
  } else {
    handleRoute();
  }

  // Start checking notifications periodically
  if (typeof checkUnreadNotifications === 'function') {
    checkUnreadNotifications();
    setInterval(checkUnreadNotifications, 60000); // Check every minute
  }

  // Hide initial loading overlay
  if (typeof hideLoading === 'function') hideLoading();
});

function buildNavigation(role) {
  const adminElements = document.querySelectorAll('.admin-only');
  adminElements.forEach(el => {
    if (role === 'admin') {
      el.style.display = 'flex'; // or whatever its default is
      if (el.classList.contains('nav-section-label')) {
        el.style.display = 'block';
      }
    } else {
      el.style.display = 'none';
    }
  });

  // Adjust label for assets based on role
  const assetsText = document.querySelector('#nav-assets .nav-text');
  if (assetsText) {
    assetsText.textContent = role === 'admin' ? 'Inventory' : 'My Assets';
  }
}

function handleRoute() {
  const hash = window.location.hash.slice(1) || 'dashboard';
  
  // Update active nav state
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  const activeLink = document.getElementById(`nav-${hash}`);
  if (activeLink) activeLink.classList.add('active');

  // Load content
  const content = document.getElementById('page-content');
  content.innerHTML = `<div class="flex items-center justify-center h-full"><div class="loader-ring"></div></div>`;

  switch(hash) {
    case 'dashboard':
      if(typeof loadDashboard === 'function') loadDashboard();
      break;
    case 'assets':
      if(typeof loadAssets === 'function') loadAssets();
      break;
    case 'requests':
      if(typeof loadRequests === 'function') loadRequests();
      break;
    case 'notifications':
      if(typeof loadNotifications === 'function') loadNotifications();
      break;
    case 'employees':
      if(typeof loadEmployees === 'function') loadEmployees();
      break;
    case 'reports':
      if(typeof loadReports === 'function') loadReports();
      break;
    case 'audit':
      if(typeof loadAudit === 'function') loadAudit();
      break;
    case 'profile':
      if(typeof loadProfile === 'function') loadProfile();
      break;
    default:
      content.innerHTML = `<div class="empty-state"><div class="empty-title text-2xl">404</div><div class="empty-desc">Page not found</div></div>`;
  }
}

// Utility to programmatically navigate
function navigate(route) {
  window.location.hash = `#${route}`;
}
