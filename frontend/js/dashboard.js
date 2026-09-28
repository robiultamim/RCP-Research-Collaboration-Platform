/* ============================================================
   RCP - Dashboard Controller
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  console.log('[Dashboard] Initialized');
  
  // Animate stat counters on dashboard view
  const statValues = document.querySelectorAll('.stat-value');
  statValues.forEach(el => {
    const target = parseInt(el.textContent, 10);
    if (isNaN(target)) return;
    let count = 0;
    const speed = Math.max(20, Math.floor(1000 / target));
    const timer = setInterval(() => {
      count++;
      el.textContent = count;
      if (count >= target) clearInterval(timer);
    }, speed);
  });
});
