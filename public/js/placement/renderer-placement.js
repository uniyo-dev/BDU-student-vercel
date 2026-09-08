// Placement Renderer
const PlacementRenderer = {
  init() {
    UI.redirectIfNotLoggedIn();
    this.render();
  },

  render() {
    const data = Store.getStudentData();
    const container = document.getElementById('placement-content');
    
    if (!data?.placement?.results?.length) {
      container.innerHTML = '<div class="text-center" style="padding:40px;color:#4a637f;">No placement data</div>';
      return;
    }
    
    const results = data.placement.results;
    const selected = results.find(r => r.status === 'Selected') || results[0];
    
    let html = this.renderStatus(selected);
    html += this.renderResults(results);
    if (data.placement.criteria?.length) {
      html += this.renderCriteria(data.placement.criteria);
    }
    
    container.innerHTML = html;
  },

  renderStatus(selected) {
    return `
      <div class="semester-block semester-1">
        <div class="semester-title">
          <i class="fas fa-check-circle"></i>
          Placement Status
        </div>
        <div style="text-align:center;padding:16px;">
          <div style="font-size:20px;font-weight:800;color:#1a5f9c;">${selected.department}</div>
          <div style="font-size:13px;color:#4a637f;margin-top:4px;">Priority: ${selected.priority}</div>
          <div style="font-size:13px;color:#4a637f;">Score: ${selected.totalScore}</div>
          <span class="status-badge ${selected.status === 'Selected' ? 'selected' : 'review'}" style="margin-top:8px;">
            ${selected.status}
          </span>
        </div>
      </div>
    `;
  },

  renderResults(results) {
    let html = '<div class="gpa-grid">';
    
    results.forEach((result) => {
      const isSelected = result.status === 'Selected';
      const cardClass = isSelected ? 'cgpa' : 'sgpa';
      
      html += `
        <div class="gpa-card ${cardClass}">
          <div style="font-size:13px;font-weight:700;">${result.department}</div>
          <div style="font-size:11px;margin-top:4px;">${result.priority}</div>
          <div style="font-size:16px;font-weight:800;margin-top:6px;">${result.totalScore}</div>
          <span class="status-badge ${isSelected ? 'selected' : 'review'}" style="margin-top:6px;font-size:9px;">
            ${isSelected ? 'Selected' : result.status}
          </span>
        </div>
      `;
    });
    
    html += '</div>';
    return html;
  },

  renderCriteria(criteria) {
    let html = `
      <div class="semester-block semester-2">
        <div class="semester-title">
          <i class="fas fa-list"></i>
          Placement Criteria
        </div>
    `;
    
    criteria.forEach(c => {
      html += `
        <div class="course-row">
          <div class="course-info">
            <div class="cname">${c.name}</div>
            <div class="ccode">Weight: ${c.percent}%</div>
          </div>
          <div class="course-grade">
            <span class="score">${c.scored}</span>
          </div>
        </div>
      `;
    });
    
    html += '</div>';
    return html;
  }
};

document.addEventListener('DOMContentLoaded', () => PlacementRenderer.init());
