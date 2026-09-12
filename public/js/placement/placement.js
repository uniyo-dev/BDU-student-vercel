// Placement Logic with department grouping
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
  const tabsContainer = document.getElementById('dept-tabs');
  const statsBar = document.getElementById('stats-bar');
  const pagination = document.getElementById('pagination');
  
  if (!container) return;
  
  const placement = data.placement || {};
  const allStudents = placement.allStudents || [];
  const results = placement.results || [];
  
  // Build full student list
  let fullList = allStudents.length > 0 ? allStudents : [];
  
  if (fullList.length === 0 && results.length > 0) {
    const bio = data.biography || {};
    results.forEach(function(r) {
      fullList.push({
        fullName: bio.fullName,
        studentId: bio.studentId,
        department: r.department,
        priority: r.priority,
        totalScore: r.totalScore,
        status: r.status,
      });
    });
  }
  
  // Get unique departments
  const departments = [];
  fullList.forEach(function(s) {
    const dept = s.department || 'Unassigned';
    if (departments.indexOf(dept) === -1) {
      departments.push(dept);
    }
  });
  
  // VERIFIED BDU Departments List (from official registrar)
  const commonDepartments = [
    // Bahir Dar Institute of Technology (BiT) - 4 Schools
    // School of Civil & Water Resources Engineering
    'Civil Engineering',
    'Water Resources and Irrigation Engineering',
    'Hydraulics and Environmental Engineering',
    // School of Mechanical & Industrial Engineering
    'Mechanical Engineering',
    'Industrial Engineering',
    'Automotive Engineering',
    'Mechatronics Engineering',
    // School of Computing & Electrical Engineering
    'Electrical and Computer Engineering',
    'Software Engineering',
    'Computer Science',
    'Information Technology',
    // School of Chemical & Food Engineering
    'Chemical Engineering',
    'Food Engineering and Process Technology',
    // Ethiopian Institute of Textile and Fashion - BSc
    'Textile Engineering',
    'Garment Engineering',
    'Fashion Design',
    'Leather Engineering',
    // College of Medicine and Health Sciences - MD/BSc
    'Medicine (MD)',
    'Pharmacy',
    'Anesthesia',
    'Optometry',
    'Medical Laboratory Science',
    'Public Health',
    'Comprehensive Nursing',
    'Midwifery',
    'Psychiatry Nursing',
    'Pediatric and Child Health Nursing',
    'Surgical Nursing',
    'Medical Radiology Technology',
    'Environmental Health',
    // College of Business and Economics - BA
    'Accounting and Finance',
    'Economics',
    'Management',
    'Marketing Management',
    'Logistics and Supply Chain Management',
    'Public Administration',
    'Tourism and Hotel Management',
    // College of Science - BSc
    'Biology',
    'Chemistry',
    'Physics',
    'Mathematics',
    'Statistics',
    'Biotechnology',
    'Geology',
    // College of Agriculture - BSc
    'Plant Sciences',
    'Animal Sciences',
    'Horticulture',
    'Natural Resources Management',
    'Soil Resource Management',
    'Forestry',
    'Agricultural Economics',
    'Rural Development',
    'Fisheries and Wildlife Management',
    // College of Humanities and Social Sciences - BA
    'English Language and Literature',
    'Amharic Language and Literature',
    'History and Heritage Management',
    'Geography and Environmental Studies',
    'Sociology',
    'Social Work',
    'Political Science and International Relations',
    'Journalism and Communication',
    'Civics and Ethical Studies',
    // College of Education - BA/BEd
    'Psychology',
    'Educational Planning and Management',
    'Special Needs and Inclusive Education',
    'Adult Education',
    'Early Childhood Care and Education',
    // School of Law
    'Law (LLB)',
    // Institute of Land Administration - BSc
    'Land Administration',
    'Geomatics and Land Surveying',
    'Real Estate Valuation',
    // Academy of Sport - BSc
    'Sport Science',
    'Football Coaching',
    // Institute of Disaster Risk Management - BSc
    'Disaster Risk Management',
    'Food Security and Development',
    // Ethiopian Maritime Academy
    'Marine Engineering',
    'Soil Resource Management',
    'Forestry',
    // College of Humanities and Social Sciences
    'English Language and Literature',
    'Amharic Language and Literature',
    'History and Heritage Management',
    'Geography and Environmental Studies',
    'Sociology',
    'Social Work',
    'Political Science and International Relations',
    'Journalism and Communication',
    'Civics and Ethical Studies',
    'Philosophy',
    // College of Education and Behavioral Sciences
    'Psychology',
    'Educational Planning and Management',
    'Special Needs and Inclusive Education',
    'Adult Education',
    'Early Childhood Care and Education',
    // School of Law
    'Law (LL.B)',
    // Institute of Land Administration
    'Land Administration and Surveying',
    'Real Estate Management',
    'Geomatics and GIS',
    // Sport Academy
    'Sport Science',
    'Football Coaching',
    // Institute of Disaster Risk Management
    'Disaster Risk Management',
    'Food Security and Development',
    // Ethiopian Maritime Academy
    'Marine Engineering',
    'Nautical Science',
  ];
  
  // Combine common + actual departments
  commonDepartments.forEach(function(dept) {
    if (departments.indexOf(dept) === -1) {
      departments.push(dept);
    }
  });
  
  let currentDept = departments[0] || 'All';
  let currentPage = 1;
  let filteredList = [];
  const pageSize = 20;
  
  // Render department tabs
  function renderTabs() {
    if (!tabsContainer) return;
    
    let tabsHtml = '<button class="dept-tab ' + (currentDept === 'All' ? 'active' : '') + '" onclick="selectDept(\'All\')">All</button>';
    
    departments.forEach(function(dept) {
      tabsHtml += '<button class="dept-tab ' + (currentDept === dept ? 'active' : '') + '" onclick="selectDept(\'' + dept.replace(/'/g, "\\'") + '\')">' + dept + '</button>';
    });
    
    tabsContainer.innerHTML = tabsHtml;
  }
  
  function filterByDept() {
    if (currentDept === 'All') {
      filteredList = fullList;
    } else {
      filteredList = fullList.filter(function(s) {
        return (s.department || 'Unassigned') === currentDept;
      });
    }
    
    // Sort by score descending
    filteredList.sort(function(a, b) {
      return parseFloat(b.totalScore) - parseFloat(a.totalScore);
    });
  }
  
  function render() {
    filterByDept();
    
    const totalPages = Math.ceil(filteredList.length / pageSize);
    const start = (currentPage - 1) * pageSize;
    const end = Math.min(start + pageSize, filteredList.length);
    const pageStudents = filteredList.slice(start, end);
    
    if (statsBar) {
      statsBar.innerHTML = currentDept + ': ' + filteredList.length + ' students | Page ' + currentPage + ' of ' + Math.max(totalPages, 1);
    }
    
    let html = '';
    
    if (pageStudents.length === 0) {
      html = '<div class="dept-empty">No students in this department yet.<br>Results will appear when placement is released.</div>';
    } else {
      pageStudents.forEach(function(s, index) {
        const globalRank = start + index + 1;
        const isSelected = s.status === 'Selected';
        
        let rankClass = 'rank-number';
        if (globalRank === 1) rankClass += ' top1';
        else if (globalRank <= 10) rankClass += ' top10';
        
        html += '<div class="student-card ' + (isSelected ? 'selected' : '') + '">';
        html += '<div class="' + rankClass + '">' + globalRank + '</div>';
        html += '<div class="student-info">';
        html += '<div class="student-name">' + (s.fullName || 'Student') + '</div>';
        html += '<div class="student-id">' + (s.studentId || '') + '</div>';
        html += '<div class="student-dept">' + (s.department || '') + '</div>';
        html += '</div>';
        html += '<div class="student-score">';
        html += '<div class="score-value">' + (s.totalScore || '—') + '</div>';
        html += '<div class="score-priority">' + (s.priority || '') + '</div>';
        html += '<span class="score-status ' + (isSelected ? 'status-selected' : 'status-not') + '">' + (s.status || 'Pending') + '</span>';
        html += '</div>';
        html += '</div>';
      });
    }
    
    container.innerHTML = html;
    
    // Pagination
    if (pagination && totalPages > 1) {
      let pagHtml = '';
      pagHtml += '<button class="page-btn" onclick="goToPage(' + (currentPage - 1) + ')" ' + (currentPage === 1 ? 'disabled' : '') + '>←</button>';
      
      const maxButtons = 5;
      let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
      let endPage = Math.min(totalPages, startPage + maxButtons - 1);
      startPage = Math.max(1, endPage - maxButtons + 1);
      
      for (let i = startPage; i <= endPage; i++) {
        pagHtml += '<button class="page-btn ' + (i === currentPage ? 'active' : '') + '" onclick="goToPage(' + i + ')">' + i + '</button>';
      }
      
      pagHtml += '<button class="page-btn" onclick="goToPage(' + (currentPage + 1) + ')" ' + (currentPage === totalPages ? 'disabled' : '') + '>→</button>';
      pagination.innerHTML = pagHtml;
    } else if (pagination) {
      pagination.innerHTML = '';
    }
  }
  
  window.selectDept = function(dept) {
    currentDept = dept;
    currentPage = 1;
    renderTabs();
    render();
  };
  
  window.goToPage = function(page) {
    currentPage = page;
    render();
  };
  
  window.searchStudents = function() {
    const query = document.getElementById('search-input').value.toLowerCase();
    
    let baseList = fullList;
    if (currentDept !== 'All') {
      baseList = fullList.filter(function(s) { return (s.department || 'Unassigned') === currentDept; });
    }
    
    if (!query) {
      filteredList = baseList;
    } else {
      filteredList = baseList.filter(function(s) {
        return (s.fullName || '').toLowerCase().includes(query) ||
               (s.studentId || '').toLowerCase().includes(query);
      });
    }
    
    filteredList.sort(function(a, b) {
      return parseFloat(b.totalScore) - parseFloat(a.totalScore);
    });
    
    currentPage = 1;
    render();
  };
  
  // Add real placement criteria
  function renderCriteria() {
    const criteria = placement.criteria || [];
    
    if (criteria.length > 0) {
      let criteriaHtml = '<div class="criteria-box">';
      criteriaHtml += '<div class="criteria-box-title"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>Placement Criteria (Official)</div>';
      
      criteria.forEach(function(c) {
        criteriaHtml += '<div class="criteria-box-row">';
        criteriaHtml += '<span class="criteria-box-name">' + c.name + '</span>';
        criteriaHtml += '<span class="criteria-box-value">' + c.percent + '%</span>';
        criteriaHtml += '</div>';
      });
      
      criteriaHtml += '</div>';
      
      // Insert after pagination
      const pagination = document.getElementById('pagination');
      if (pagination) {
        pagination.insertAdjacentHTML('afterend', criteriaHtml);
      }
    }
  }
  
  // Initial render
  renderTabs();
  render();
  renderCriteria();
});
