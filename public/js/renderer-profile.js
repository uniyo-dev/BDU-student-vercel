// Profile Renderer
const ProfileRenderer = {
  init() {
    UI.redirectIfNotLoggedIn();
    this.render();
  },

  render() {
    const data = Store.getStudentData();
    const bio = data?.biography;
    
    if (!bio) {
      document.getElementById('profile-content').innerHTML = 
        '<div class="text-center" style="padding:40px;color:#4a637f;">No profile data</div>';
      return;
    }
    
    const html = `
      <div class="semester-block semester-1">
        <div class="semester-title">
          <i class="fas fa-user-graduate"></i>
          ${bio.fullName}
        </div>
        <div style="text-align:center;padding:12px;">
          <div class="status-badge pass">${bio.studentId}</div>
        </div>
      </div>
      
      <div class="gpa-grid">
        <div class="gpa-card sgpa">
          <div class="gpa-value">${bio.gender}</div>
          <div class="gpa-label">Gender</div>
        </div>
        <div class="gpa-card cgpa">
          <div class="gpa-value" style="font-size:14px;">${bio.nationality}</div>
          <div class="gpa-label">Nationality</div>
        </div>
      </div>
      
      <div class="semester-block semester-1">
        <div class="semester-title">
          <i class="fas fa-book-open"></i>
          Academic Biography
        </div>
        ${this.renderDetail('Program', data.program)}
        ${this.renderDetail('Enrollment Date', bio.enrollmentDate)}
        ${this.renderDetail('High School Stream', bio.highSchoolStream)}
      </div>
      
      <div class="semester-block semester-2">
        <div class="semester-title">
          <i class="fas fa-user"></i>
          Personal Biography
        </div>
        ${this.renderDetail('Full Name', bio.fullName)}
        ${this.renderDetail('Student ID', bio.studentId)}
        ${this.renderDetail('Gender', bio.gender)}
        ${this.renderDetail('Birth Date', bio.birthDate)}
        ${this.renderDetail('Nationality', bio.nationality)}
        ${this.renderDetail('Phone', bio.phone)}
        ${this.renderDetail('Email', bio.email || '—')}
      </div>
    `;
    
    document.getElementById('profile-content').innerHTML = html;
  },

  renderDetail(label, value) {
    if (!value) return '';
    return `
      <div class="course-row">
        <div class="course-info">
          <div class="ccode">${label}</div>
        </div>
        <div class="course-grade">
          <span class="score">${value}</span>
        </div>
      </div>
    `;
  }
};

document.addEventListener('DOMContentLoaded', () => ProfileRenderer.init());
