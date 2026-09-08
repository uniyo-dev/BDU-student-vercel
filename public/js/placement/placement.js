// Placement Logic
document.addEventListener('DOMContentLoaded', function() {
  if (!Auth.isLoggedIn()) {
    window.location.href = '/';
    return;
  }
  
  const data = Auth.getStudentData();
  
  if (!data) {
    window.location.href = '/';
    return;
  }
  
  const container = document.getElementById('depts-content');
  
  if (!container) return;
  
  const placement = data.placement || {};
  const results = placement.results || [];
  const criteria = placement.criteria || [];
  
  let html = '';
  
  // Placement status
  const selected = results.find(function(r) { return r.status === 'Selected'; }) || results[0];
  
  if (selected) {
    html += '<div class="placement-assigned">';
    html += '<div class="placement-assigned-icon">';
    html += '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>';
    html += '</div>';
    html += '<div>';
    html += '<div class="placement-status-label"><span>Assigned</span><span class="placed-badge">PLACED</span></div>';
    html += '<div class="placement-dept">' + selected.department + '</div>';
    html += '<div class="placement-college">Priority: ' + selected.priority + ' | Score: ' + selected.totalScore + '</div>';
    html += '</div>';
    html += '</div>';
  }
  
  // Priorities
  if (results.length > 0) {
    results.forEach(function(r, index) {
      const isAssigned = r.status === 'Selected';
      const rankClass = isAssigned ? 'rank-assigned' : (index === 0 ? 'rank-1' : 'rank-other');
      
      html += '<div class="priority-item' + (isAssigned ? ' is-assigned' : '') + '">';
      html += '<div class="priority-rank ' + rankClass + '">' + (index + 1) + '</div>';
      html += '<div><div class="priority-name">' + r.department + '</div>';
      html += '<div class="priority-college">' + r.priority + ' · ' + r.totalScore + '</div></div>';
      if (isAssigned) {
        html += '<div class="priority-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></div>';
      }
      html += '</div>';
    });
  } else {
    html += '<div style="text-align:center;padding:40px;color:#64748b;">No placement data available</div>';
  }
  
  container.innerHTML = html;
});
