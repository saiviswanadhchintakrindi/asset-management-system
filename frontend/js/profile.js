/* ================================================================
   AssetFlow - Profile & Settings Logic
   ================================================================ */

function loadProfile() {
  const content = document.getElementById('page-content');
  const user = getCurrentUser();
  
  content.innerHTML = `
    <div class="page-header">
      <div class="page-header-left">
        <h2>Profile & Settings</h2>
        <p>Manage your account preferences</p>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="card">
        <h3 class="card-title mb-4">Personal Information</h3>
        <div class="flex items-center gap-4 mb-6">
          <div class="user-avatar w-16 h-16 text-2xl">${user.name.charAt(0).toUpperCase()}</div>
          <div>
            <div class="font-bold text-lg">${user.name}</div>
            <div class="text-sm text-secondary">${user.email}</div>
          </div>
        </div>
        <div class="space-y-3">
          <div class="bg-bg-input p-3 rounded border border-border">
            <span class="text-xs text-muted uppercase block">Role</span>
            <span class="font-medium">${capitalize(user.role)}</span>
          </div>
        </div>
      </div>

      <div class="card">
        <h3 class="card-title mb-4">Change Password</h3>
        <form id="profile-password-form" onsubmit="changePassword(event)">
          <div class="form-group">
            <label>Current Password</label>
            <input type="password" id="prof-curr-pass" required />
          </div>
          <div class="form-group">
            <label>New Password</label>
            <input type="password" id="prof-new-pass" required minlength="6" />
          </div>
          <div class="form-group">
            <label>Confirm New Password</label>
            <input type="password" id="prof-conf-pass" required minlength="6" />
          </div>
          <button type="submit" class="btn btn-primary" id="prof-pass-btn">Update Password</button>
        </form>
      </div>
    </div>
  `;
}

async function changePassword(e) {
  e.preventDefault();
  const btn = document.getElementById('prof-pass-btn');
  const curr = document.getElementById('prof-curr-pass').value;
  const newp = document.getElementById('prof-new-pass').value;
  const conf = document.getElementById('prof-conf-pass').value;

  if (newp !== conf) {
    showToast('New passwords do not match', 'error');
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Updating...';

  try {
    await apiFetch('/auth/change-password', {
      method: 'POST',
      body: { current_password: curr, new_password: newp }
    });
    showToast('Password updated successfully', 'success');
    document.getElementById('profile-password-form').reset();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Update Password';
  }
}
