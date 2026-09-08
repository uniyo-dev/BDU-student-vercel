// Dashboard Renderer
const DashboardRenderer = {
  init() {
    UI.redirectIfNotLoggedIn();
    this.render();
  },

  render() {
    const data = Store.getStudentData();
    if (!data) return;
    
    const bio = data.biography || {};
    const summary = data.summary || {};
    
    document.getElementById('dash-name').textContent = bio.fullName || 'Student';
    document.getElementById('dash-program').textContent = data.program || '';
    document.getElementById('dash-id').textContent = bio.studentId || '';
    document.getElementById('dash-gpa').textContent = UI.formatGPA(summary.cumulativeGPA);
    document.getElementById('dash-credits').textContent = summary.totalCredits || '0';
    document.getElementById('dash-semesters').textContent = summary.totalSemesters || '0';
  }
};

document.addEventListener('DOMContentLoaded', () => DashboardRenderer.init());
