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
  
  // Common BDU departments to always show
  const commonDepartments = [
    'Economics',
    'Accounting and Finance',
    'Logistics and Supply Chain Management',
    'Information Technology',
    'Software Engineering',
    'Computer Science',
    'Management',
    'Marketing Management',
    'Other Social Sciences',
    'Other Natural Sciences',
    'Law',
    'Electrical Engineering',
    'Mechanical Engineering',
    'Civil Engineering',
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
      html = '<div style="text-align:center;padding:40px;color:#64748b;">No students in this department yet.<br>Results will appear when placement is released.</div>';
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
      let criteriaHtml = '<div style="margin-top:20px;padding:16px;background:white;border-radius:14px;border:2px solid #e3eaf2;">';
      criteriaHtml += '<div style="font-weight:800;font-size:15px;color:#d97706;margin-bottom:12px;">📊 Placement Criteria (Official)</div>';
      
      criteria.forEach(function(c) {
        criteriaHtml += '<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f1f5f9;">';
        criteriaHtml += '<span style="font-size:12px;color:#4a637f;">' + c.name + '</span>';
        criteriaHtml += '<span style="font-weight:800;font-size:13px;color:#d97706;">' + c.percent + '%</span>';
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
