function renderPlacement() {
  const data = getStudentData();
  
  if (!data?.placement?.results?.length) {
    document.getElementById('status-title').textContent = 'No Placement Data';
    document.getElementById('status-subtitle').textContent = 'Please login first';
    document.getElementById('statusBadge').textContent = '—';
    document.getElementById('preferenceList').innerHTML = '<div style="text-align:center;color:#4a637f;padding:20px;">No placement results</div>';
    return;
  }
  
  const results = data.placement.results;
  const selected = results.find(r => r.status === 'Selected') || results[0];
  
  if (selected) {
    const isSelected = selected.status === 'Selected';
    
    document.getElementById('status-title').textContent = isSelected ? 'Placement Selected' : 'Placement Status';
    document.getElementById('status-subtitle').textContent = isSelected ? `Placed in ${selected.department}` : selected.status;
    document.getElementById('statusBadge').textContent = isSelected ? 'SELECTED' : selected.status.toUpperCase();
    
    document.getElementById('assignedDept').textContent = selected.department;
    document.getElementById('priority').textContent = selected.priority;
    document.getElementById('totalScore').textContent = selected.totalScore;
  }
  
  // Render all results as preference list
  const preferenceList = document.getElementById('preferenceList');
  let html = '';
  
  results.forEach((result, index) => {
    const isSelected = result.status === 'Selected';
    const statusClass = isSelected ? 'confirmed' : result.status.includes('exam') ? 'review' : 'pending';
    const statusText = isSelected ? 'SELECTED' : result.status.toUpperCase();
    
    html += `
      <div class="preference-item">
        <span class="rank">#${index + 1}</span>
        <span class="dept-name">${result.department}</span>
        <span class="dept-code">${result.priority}</span>
        <span class="status-indicator ${statusClass}">${statusText}</span>
      </div>
      <div style="font-size:11px;color:#4f647c;margin:-4px 0 8px 3rem;">Score: ${result.totalScore}</div>
    `;
  });
  
  // Add criteria breakdown
  if (data.placement.criteria?.length > 0) {
    html += '<div style="font-weight:700;font-size:14px;margin:20px 0 12px;color:#0b1e33;">Placement Criteria</div>';
    
    data.placement.criteria.forEach(c => {
      html += `
        <div class="preference-item" style="flex-direction:column;align-items:flex-start;">
          <div style="display:flex;justify-content:space-between;width:100%;">
            <span style="font-weight:600;">${c.name}</span>
            <span style="font-weight:700;color:#1a5f9c;">${c.percent}%</span>
          </div>
          <div style="font-size:11px;color:#4f647c;">${c.scored} / ${c.maximum}</div>
        </div>
      `;
    });
  }
  
  preferenceList.innerHTML = html;
}

if (sessionStorage.getItem('bdu_logged_in') === 'true') {
  renderPlacement();
} else {
  window.location.href = '/';
}
