/* ============================================================
   RCP - Role-Based Guard & Route Protection
   Ensures unauthorized roles are redirected to their own workspace.
   ============================================================ */

(function checkRoleGuard() {
  const path = window.location.pathname.replace(/\\/g, '/');
  const user = JSON.parse(localStorage.getItem('rcp_user') || 'null');

  // Allow unauthenticated access only on root landing, login, and register
  const isPublicPage = path.endsWith('/index.html') || 
                       path.endsWith('/login.html') || 
                       path.endsWith('/register.html') || 
                       path.endsWith('/frontend/') ||
                       path.endsWith('/AOOP/');

  if (!user && !isPublicPage) {
    console.warn('[Guard] Unauthenticated access. Redirecting to login.');
    // Determine relative path back to login
    if (path.includes('/student/') || path.includes('/supervisor/') || path.includes('/admin/')) {
      window.location.href = '../login.html';
    } else {
      window.location.href = 'login.html';
    }
    return;
  }

  if (user && user.role) {
    const role = user.role.toUpperCase();

    // Check directory mismatch
    if (path.includes('/student/') && role !== 'STUDENT') {
      console.warn(`[Guard] Role ${role} cannot access student route. Redirecting.`);
      redirectToRoleDashboard(role);
    } else if (path.includes('/supervisor/') && role !== 'SUPERVISOR') {
      console.warn(`[Guard] Role ${role} cannot access supervisor route. Redirecting.`);
      redirectToRoleDashboard(role);
    } else if (path.includes('/admin/') && role !== 'ADMIN') {
      console.warn(`[Guard] Role ${role} cannot access admin route. Redirecting.`);
      redirectToRoleDashboard(role);
    }
  }
})();

function redirectToRoleDashboard(role) {
  if (role === 'SUPERVISOR') {
    window.location.href = '../supervisor/dashboard.html';
  } else if (role === 'ADMIN') {
    window.location.href = '../admin/dashboard.html';
  } else {
    window.location.href = '../student/dashboard.html';
  }
}
