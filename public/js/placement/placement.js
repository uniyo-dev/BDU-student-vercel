// Placement Logic with SVG icons
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
  
  const selected = results.find(function(r) { return r.status === 'Selected'; }) || results[0];
  
  if (selected) {
    html += '<div class="placement-assigned">' +
      '<div class="placement-assigned-icon">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>' +
      '</div>' +
      '<div>' +
      '<div class="placement-status-label"><span>Assigned</span><span class="placed-badge">PLACED</span></div>' +
      '<div class="placement-dept">' + selected.department + '</div>' +
      '<div class="placement-college">Priority: ' + selected.priority + ' | Score: ' + selected.totalScore + '</div>' +
      '</div>' +
      '</div>';
  }
  
  if (results.length > 0) {
    html += '<div style="font-size:18px;font-weight:700;color:#0f172a;margin-bottom:12px;padding:0 4px;">Your Priorities</div>';
    
    results.forEach(function(r, index) {
      const isAssigned = r.status === 'Selected';
      const rankClass = isAssigned ? 'rank-assigned' : (index === 0 ? 'rank-1' : 'rank-other');
      const checkHtml = isAssigned ? '<div class="priority-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></div>' : '';
      
      html += '<div class="priority-item' + (isAssigned ? ' is-assigned' : '') + '">' +
        '<div class="priority-rank ' + rankClass + '">' + (index + 1) + '</div>' +
        '<div style="flex:1;min-width:0;">' +
        '<div class="priority-name">' + r.department + '</div>' +
        '<div class="priority-college">' + r.priority + ' · ' + r.totalScore + '</div>' +
        '</div>' +
        checkHtml +
        '</div>';
    });
  }
  
  if (criteria.length > 0) {
    html += '<div class="info-box mt-4">' +
      '<div class="info-box-icon">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>' +
      '</div>' +
      '<div>' +
      '<div class="info-box-title">Placement Criteria</div>' +
      '<ul class="info-box-list">';
    
    criteria.forEach(function(c) {
      html += '<li>• ' + c.name + ': ' + c.percent + '%</li>';
    });
    
    html += '</ul></div></div>';
  }
  
  container.innerHTML = html;
});
