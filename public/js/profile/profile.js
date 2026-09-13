// Profile Logic with SVG icons, badges, and breakdown
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

  const bio = data.biography || {};
  const summary = data.summary || {};
  const container = document.getElementById('profile-content');
  
  if (!container) return;
  
  // Avatar initials
  const initials = (bio.fullName || 'S').split(' ').map(function(n) { return n[0]; }).join('').slice(0, 2).toUpperCase();
  document.getElementById('profile-avatar-initials').textContent = initials;
  document.getElementById('profile-name').textContent = bio.fullName || 'Student';
  document.getElementById('profile-student-id').textContent = bio.studentId || 'ID Unknown';
  
  function profileRow(iconSvg, label, value) {
    return '<div class="profile-row">' +
      '<div class="profile-row-icon">' + iconSvg + '</div>' +
      '<div><div class="profile-row-label">' + label + '</div>' +
      '<div class="profile-row-value">' + (value || 'Not provided') + '</div></div>' +
      '</div>';
  }
  
  const graduationIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>';
  const buildingIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>';
  const calendarIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>';
  const userIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>';
  const phoneIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 9.8 19.79 19.79 0 0 1 1.61 1.18 2 2 0 0 1 3.58 0h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 7.91a16 16 0 0 0 6.08 6.08l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>';
  const mailIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>';
  const globeIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>';
  const starIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>';

  // === Achievement icons (SVG) ===
  const achTrophy      = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/></svg>';
  const achAward       = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>';
  const achStar        = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>';
  const achRocket      = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 16.5c-1.5 1.5-2 5-2 5s3.5-.5 5-2"/><path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>';
  const achTarget      = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>';
  const achCheckCircle = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>';
  const achBookOpen    = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>';
  const achChartLine   = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>';
  const achLockedSvg   = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;vertical-align:-2px;"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>';
  const achCrown       = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 18h18l-2-9-4 4-3-6-3 6-4-4-2 9z"/><circle cx="12" cy="4" r="1"/></svg>';

  
  let html = '';
  
  // Achievement badges
  const gpa = parseFloat(summary.cumulativeGPA) || 0;
  const breakdown = summary.gradeBreakdown || {};
  const rankScore = summary.rankScore || 0;
  
  // === Achievements redesign (M5) ===
  // Classification (official BDU tiers)
  function classifyGpa(g) {
    if (g >= 3.50) return { tier: 'First Class',  icon: achTrophy, desc: 'Graduating with distinction' };
    if (g >= 3.00) return { tier: 'Second Class', icon: achAward, desc: 'Strong academic standing' };
    if (g >= 2.00) return { tier: 'Third Class',  icon: achAward, desc: 'Degree requirements met' };
    return null;
  }

  // Compute all achievements
  function computeAchievements(data, summary) {
    const gpa = parseFloat(summary.cumulativeGPA) || 0;
    const breakdown = summary.gradeBreakdown || {};
    const aPlus = parseInt(breakdown.Aplus || 0, 10);
    const aGrade = parseInt(breakdown.A || 0, 10);
    const fGrade = parseInt(breakdown.F || 0, 10);
    const highGrades = aPlus + aGrade;

    const regs = (data.registrations || []).slice().sort(function(x, y) {
      if (x.acYear !== y.acYear) return String(x.acYear).localeCompare(String(y.acYear));
      return String(x.semester).localeCompare(String(y.semester));
    });

    const sgpas = regs
      .map(function(r) { return parseFloat(r.sgpa); })
      .filter(function(v) { return !isNaN(v) && v > 0; });

    const fastClimber = sgpas.length >= 2 && sgpas.every(function(v, i) {
      return i === 0 || v > sgpas[i - 1];
    });

    const consistent = sgpas.length >= 2 && sgpas.every(function(v) { return v >= 3.00; });

    const unlocked = [];

    // Classification (hero)
    const cls = classifyGpa(gpa);
    if (cls) {
      unlocked.push({
        hero: true,
        tier: 'Classification',
        icon: cls.icon,
        title: cls.tier,
        desc: cls.desc
      });
    }

    // Secondary achievements
    if (aPlus > 0) {
      unlocked.push({
        icon: achCheckCircle,
        title: 'Perfect Grade',
        desc: aPlus + ' A+ grade' + (aPlus === 1 ? '' : 's')
      });
    }

    if (highGrades >= 10) {
      unlocked.push({
        icon: achBookOpen,
        title: 'Scholar',
        desc: highGrades + ' A/A+ grades'
      });
    } else if (highGrades >= 5) {
      unlocked.push({
        icon: achStar,
        title: 'Excellence',
        desc: highGrades + ' A/A+ grades'
      });
    }

    if (sgpas.length >= 1 && fGrade === 0) {
      unlocked.push({
        icon: achTarget,
        title: 'No Failure',
        desc: 'Clean academic record'
      });
    }

    if (fastClimber) {
      unlocked.push({
        icon: achRocket,
        title: 'Fast Climber',
        desc: 'GPA improved every semester'
      });
    }

    if (gpa >= 3.50) {
      unlocked.push({
        icon: achCrown,
        title: 'Hot Streak',
        desc: 'CGPA at or above 3.50'
      });
    }

    if (consistent) {
      unlocked.push({
        icon: achChartLine,
        title: 'Consistent',
        desc: 'Every semester at or above 3.00'
      });
    }

    // Catalog for "N more to unlock" count
    const catalog = [
      gpa >= 2.00,                    // Third Class
      gpa >= 3.00,                    // Second Class
      gpa >= 3.50,                    // First Class
      aPlus > 0,                      // Perfect Grade
      highGrades >= 5,                // Excellence
      highGrades >= 10,               // Scholar
      sgpas.length >= 1 && fGrade === 0, // No Failure
      fastClimber,                    // Fast Climber
      gpa >= 3.50,                    // Hot Streak
      consistent                      // Consistent
    ];
    const lockedCount = catalog.filter(function(x) { return !x; }).length;

    return { unlocked: unlocked, lockedCount: lockedCount };
  }

  const ach = computeAchievements(data, summary);
  const heroes = ach.unlocked.filter(function(a) { return a.hero; });
  const secondaries = ach.unlocked.filter(function(a) { return !a.hero; });

  html += '<div class="profile-section-title achievements-section-title">Achievements</div>';

  if (ach.unlocked.length === 0) {
    html += '<div class="profile-card achievement-empty">Keep studying \u2014 achievements appear as you progress.</div>';
  } else {
    if (heroes.length) {
      html += '<div class="profile-card achievement-hero">';
      html += '<div class="achievement-hero-icon">' + heroes[0].icon + '</div>';
      html += '<div class="achievement-hero-body">';
      html += '<div class="achievement-hero-tier">' + heroes[0].tier + '</div>';
      html += '<div class="achievement-hero-title">' + heroes[0].title + '</div>';
      html += '<div class="achievement-hero-desc">' + heroes[0].desc + '</div>';
      html += '</div></div>';
    }

    if (secondaries.length) {
      html += '<div class="profile-card"><div class="achievement-grid">';
      for (let i = 0; i < secondaries.length; i++) {
        const a = secondaries[i];
        html += '<div class="achievement-tile">';
        html += '<div class="achievement-tile-icon">' + a.icon + '</div>';
        html += '<div class="achievement-tile-title">' + a.title + '</div>';
        html += '<div class="achievement-tile-desc">' + a.desc + '</div>';
        html += '</div>';
      }
      html += '</div></div>';
    }

    if (ach.lockedCount > 0) {
      html += '<div class="achievement-locked">' + achLockedSvg + ' ' + ach.lockedCount + ' more to unlock</div>';
    }
  }

  // Academic Info
  html += '<div class="profile-section-title">Academic Info</div>';
  html += '<div class="profile-card">';
  html += profileRow(graduationIcon, 'Program', data.program);
  html += profileRow(buildingIcon, 'Department', bio.department || 'Freshman (Common Program)');
  html += profileRow(calendarIcon, 'Enrollment', bio.enrollmentDate);
  html += profileRow(starIcon, 'Total Credits', summary.totalCredits);
  html += profileRow(starIcon, 'Semesters', summary.totalSemesters);
  html += '</div>';
  
  // Personal Info
  html += '<div class="profile-section-title">Personal Info</div>';
  html += '<div class="profile-card">';
  html += profileRow(userIcon, 'Gender', bio.gender);
  html += profileRow(phoneIcon, 'Phone Number', bio.phone);
  html += profileRow(mailIcon, 'Email Address', bio.email);
  html += profileRow(globeIcon, 'Nationality', bio.nationality);
  html += profileRow(calendarIcon, 'Birth Date', bio.birthDate);
  html += profileRow(graduationIcon, 'High School Stream', bio.highSchoolStream);
  html += '</div>';
  
  html += '<div class="profile-spacer"></div>';
  
  container.innerHTML = html;
});
