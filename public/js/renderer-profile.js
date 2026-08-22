// Profile Renderer - Production Quality
class ProfileRenderer {
  constructor() {
    this.container = document.getElementById('profile-content');
    this.data = null;
    this.bio = null;
  }

  init() {
    this.loadData();
    this.render();
  }

  loadData() {
    const saved = sessionStorage.getItem('bdu_student_data');
    if (saved) {
      try {
        this.data = JSON.parse(saved);
        this.bio = this.data?.biography || null;
      } catch(e) {
        console.error('Failed to parse student data:', e);
      }
    }
  }

  render() {
    if (!this.container) return;
    
    if (!this.bio) {
      this.renderEmpty();
      return;
    }
    
    const html = `
      ${this.renderHeader()}
      ${this.renderQuickInfo()}
      ${this.renderAcademicBio()}
      ${this.renderPersonalBio()}
    `;
    
    this.container.innerHTML = html;
  }

  renderHeader() {
    return `
      <div class="semester-block semester-1">
        <div class="semester-title">
          <i class="fas fa-user-graduate"></i>
          ${this.bio.fullName || 'Student'}
        </div>
        <div style="text-align:center;padding:12px;">
          <span class="status-badge pass">${this.bio.studentId || ''}</span>
        </div>
      </div>
    `;
  }

  renderQuickInfo() {
    return `
      <div class="gpa-grid" style="margin:0 20px 16px;">
        <div class="gpa-card sgpa">
          <div class="gpa-value">${this.bio.gender || '—'}</div>
          <div class="gpa-label">Gender</div>
        </div>
        <div class="gpa-card cgpa">
          <div class="gpa-value" style="font-size:14px;">${this.bio.nationality || '—'}</div>
          <div class="gpa-label">Nationality</div>
        </div>
      </div>
    `;
  }

  renderAcademicBio() {
    return `
      <div class="semester-block semester-1">
        <div class="semester-title">
          <i class="fas fa-book-open"></i>
          Academic Biography
        </div>
        ${this.renderRow('Program', this.data?.program)}
        ${this.renderRow('Enrollment Date', this.bio.enrollmentDate)}
        ${this.renderRow('High School Stream', this.bio.highSchoolStream)}
      </div>
    `;
  }

  renderPersonalBio() {
    return `
      <div class="semester-block semester-2">
        <div class="semester-title">
          <i class="fas fa-user"></i>
          Personal Biography
        </div>
        ${this.renderRow('Full Name', this.bio.fullName)}
        ${this.renderRow('Student ID', this.bio.studentId)}
        ${this.renderRow('Gender', this.bio.gender)}
        ${this.renderRow('Birth Date', this.bio.birthDate)}
        ${this.renderRow('Nationality', this.bio.nationality)}
        ${this.renderRow('Phone', this.bio.phone)}
        ${this.renderRow('Email', this.bio.email || '—')}
      </div>
    `;
  }

  renderRow(label, value) {
    if (!value || value === 'null' || value === 'undefined' || value === '') return '';
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

  renderEmpty() {
    this.container.innerHTML = `
      <div class="semester-block semester-1">
        <div class="semester-title">
          <i class="fas fa-exclamation-circle"></i>
          No Profile Data
        </div>
        <div style="text-align:center;padding:20px;color:#4a637f;">
          Please login first to view your profile.
        </div>
      </div>
    `;
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  const renderer = new ProfileRenderer();
  renderer.init();
});
