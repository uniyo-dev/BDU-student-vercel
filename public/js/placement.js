function renderPlacement() {
  const data = getStudentData();
  const container = document.getElementById('placement-content');
  
  if (!data?.placement) {
    container.innerHTML = '<div style="text-align:center;color:#5a708b;padding:40px;">No placement data available</div>';
    return;
  }
  
  const placement = data.placement;
  let html = '';
  
  // PLACEMENT RESULTS
  if (placement.results?.length > 0) {
    html += '<div style="font-weight:700;font-size:14px;margin-bottom:12px;color:#0b1e33;">Your Placement Results</div>';
    
    placement.results.forEach(result => {
      const isSelected = result.status === 'Selected';
      const scoreNum = parseFloat(result.totalScore) || 0;
      const priorityClass = result.priority?.toLowerCase().includes('1st') ? '1st' : 
                           result.priority?.toLowerCase().includes('2nd') ? '2nd' : '3rd';
      
      html += `
        <div class="placement-card ${isSelected ? 'selected' : 'not-selected'}">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <div style="font-weight:700;font-size:15px;color:#0b1e33;">
              <i class="fas ${isSelected ? 'fa-check-circle' : 'fa-times-circle'}" style="color:${isSelected ? '#1f8b4c' : '#dc2626'};"></i>
              ${result.department}
            </div>
            <span class="priority-badge priority-${priorityClass}">${result.priority}</span>
          </div>
          <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
            <span style="font-size:12px;color:#4f647c;">Total Score</span>
            <span style="font-weight:700;color:#0b1e33;">${result.totalScore}</span>
          </div>
          <div class="score-bar">
            <div class="score-fill" style="width:${Math.min(scoreNum, 100)}%; background:${isSelected ? '#1f8b4c' : '#dc2626'};"></div>
          </div>
          <div style="font-size:11px;color:#4f647c;margin-top:8px;">
            <i class="fas fa-info-circle"></i> ${result.status}
          </div>
        </div>
      `;
    });
  }
  
  // SCORE BREAKDOWN
  const firstResult = placement.results?.[0];
  if (firstResult?.breakdown) {
    html += '<div style="font-weight:700;font-size:14px;margin:20px 0 12px;color:#0b1e33;">Score Breakdown</div>';
    html += '<div class="placement-card">';
    
    const items = [
      ['High School Exam', firstResult.breakdown.highschoolExam],
      ['Gender', firstResult.breakdown.gender],
      ['Gender (Emerging Region)', firstResult.breakdown.genderEmergingRegion],
      ['Handicapped', firstResult.breakdown.handicapped],
      ['Handicapped (Emerging)', firstResult.breakdown.handicappedEmergingRegion],
      ['CANG', firstResult.breakdown.cang],
      ['Exam', firstResult.breakdown.exam],
      ['Other Privilege', firstResult.breakdown.otherPrivilege],
    ];
    
    items.forEach(([label, value]) => {
      if (value) {
        const pct = parseFloat(value) || 0;
        html += `
          <div class="criteria-item">
            <span style="font-size:12px;color:#4f647c;">${label}</span>
            <span style="font-weight:700;color:#0b1e33;">${value}</span>
          </div>
          <div class="score-bar" style="margin:4px 0 8px;">
            <div class="score-fill" style="width:${Math.min(pct, 100)}%; background:#1a5f9c;"></div>
          </div>
        `;
      }
    });
    html += '</div>';
  }
  
  // PLACEMENT CRITERIA
  if (placement.criteria?.length > 0) {
    html += '<div style="font-weight:700;font-size:14px;margin:20px 0 12px;color:#0b1e33;">Placement Criteria</div>';
    html += '<div class="placement-card">';
    
    placement.criteria.forEach(criteria => {
      html += `
        <div class="criteria-item">
          <div style="flex:1;padding-right:12px;">
            <div style="font-weight:600;font-size:12px;color:#0b1e33;">${criteria.name}</div>
            <div style="font-size:10px;color:#4f647c;margin-top:2px;">${criteria.remark || ''}</div>
          </div>
          <div style="text-align:right;">
            <div style="font-weight:700;color:#1a5f9c;">${criteria.percent}%</div>
            <div style="font-size:10px;color:#4f647c;">${criteria.scored} / ${criteria.maximum}</div>
          </div>
        </div>
      `;
    });
    html += '</div>';
  }
  
  // ALL STUDENTS (when available)
  if (placement.allStudents?.length > 0) {
    html += '<div style="font-weight:700;font-size:14px;margin:20px 0 12px;color:#0b1e33;">All Students Rankings</div>';
    
    placement.allStudents.forEach((student, index) => {
      html += `
        <div class="placement-card" style="display:flex;justify-content:space-between;align-items:center;">
          <div style="display:flex;align-items:center;gap:10px;">
            <div style="font-weight:800;color:#1a5f9c;width:24px;">${index + 1}</div>
            <div>
              <div style="font-weight:600;font-size:13px;">${student.fullName}</div>
              <div style="font-size:10px;color:#4f647c;">${student.studentId}</div>
            </div>
          </div>
          <div style="text-align:right;">
            <div style="font-weight:700;font-size:13px;">${student.department}</div>
            <div style="font-size:10px;color:#4f647c;">${student.priority} · ${student.totalScore}</div>
          </div>
        </div>
      `;
    });
  }
  
  container.innerHTML = html || '<div style="text-align:center;color:#5a708b;padding:40px;">Placement data will appear here once available.</div>';
}

if (sessionStorage.getItem('bdu_logged_in') === 'true') {
  renderPlacement();
} else {
  window.location.href = '/';
}
