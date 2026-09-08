const http = require('http');

function req(path, options = {}) {
  return new Promise((resolve, reject) => {
    const r = http.request({
      hostname: 'studentportal.bdu.edu.et',
      port: 80,
      path: path,
      method: options.method || 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.5',
        'Host': 'studentportal.bdu.edu.et',
        ...options.headers,
      },
      timeout: 20000,
    }, (res) => {
      let data = '';
      res.on('data', (c) => data += c);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers || {}, body: data }));
    });
    r.on('error', reject);
    if (options.body) r.write(options.body);
    r.end();
  });
}

async function deepStudy() {
  console.log('🔬 DEEP STUDY: BDU PLACEMENT MECHANISMS');
  console.log('='.repeat(60));
  
  // Login
  const loginPage = await req('/Account/Login');
  const token = loginPage.body.match(/__RequestVerificationToken[^>]*value="([^"]+)"/)?.[1];
  const cookies1 = (loginPage.headers['set-cookie'] || []).map(c => c.split(';')[0]);
  
  const fd = new URLSearchParams();
  fd.append('Input.UserName', 'bdu10460670');
  fd.append('Input.Password', '@Chalie/2026');
  fd.append('__RequestVerificationToken', token);
  
  const loginRes = await req('/Account/Login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': cookies1.join('; '),
      'Origin': 'http://studentportal.bdu.edu.et',
      'Referer': 'http://studentportal.bdu.edu.et/Account/Login',
    },
    body: fd.toString(),
  });
  
  const cookies2 = (loginRes.headers['set-cookie'] || []).map(c => c.split(';')[0]);
  const cookieStr = [...cookies1, ...cookies2].join('; ');
  
  console.log('\n✅ Login successful\n');
  
  // 1. STUDENT BASIC INFO
  console.log('1. STUDENT BASIC INFO');
  console.log('-'.repeat(40));
  
  const currRes = await req('/RegistrationSummary/GetCurriculumInfo', {
    headers: { 'Cookie': cookieStr, 'Accept': 'application/json' },
  });
  const currData = JSON.parse(currRes.body);
  const curriculumCode = currData.data?.[0]?.CurriculumTblCode;
  console.log('Curriculum Code:', curriculumCode);
  
  const stuRes = await req('/RegistrationSummary/GetStudentBasicInfo?curriculumCode=' + curriculumCode, {
    headers: { 'Cookie': cookieStr, 'Accept': 'application/json' },
  });
  const stuData = JSON.parse(stuRes.body);
  const student = stuData.data?.[0] || {};
  console.log('Student:', student.FirstName, student.FatherName);
  console.log('StudentCurriculumTblCode:', student.StudentCurriculumTblCode);
  console.log('All student fields:', Object.keys(student).join(', '));
  
  // 2. PLACEMENT CRITERIA
  console.log('\n2. PLACEMENT CRITERIA');
  console.log('-'.repeat(40));
  
  const criteriaRes = await req('/Placement/GetPlacementCriteria', {
    headers: { 'Cookie': cookieStr, 'Accept': 'application/json' },
  });
  const criteriaData = JSON.parse(criteriaRes.body);
  
  criteriaData.data?.forEach(function(c) {
    console.log('  ' + c.Criterianame + ': ' + c.ValueInPercent + '%');
  });
  
  // 3. PLACEMENT RESULT
  console.log('\n3. PLACEMENT RESULT');
  console.log('-'.repeat(40));
  
  const resultRes = await req('/Placement/GetPlacementResultSummary', {
    headers: { 'Cookie': cookieStr, 'Accept': 'application/json' },
  });
  const resultData = JSON.parse(resultRes.body);
  
  resultData.data?.forEach(function(r) {
    console.log('  Department: ' + r.DestinationDepartment);
    console.log('  Priority: ' + r.Priority);
    console.log('  Total Score: ' + r.TotalResult);
    console.log('  Application Status: ' + r.ApplicationStatus);
    console.log('  Placement Status: ' + r.PlacementStatus);
    console.log('  ---');
  });
  
  // 4. SCORE BREAKDOWN
  console.log('\n4. SCORE BREAKDOWN (first result)');
  console.log('-'.repeat(40));
  
  const firstResult = resultData.data?.[0] || {};
  console.log('  Highschool Exam: ' + firstResult.HighschoolExam);
  console.log('  Gender: ' + firstResult.Gender);
  console.log('  Gender Emerging: ' + firstResult.GenderEmergingRegion);
  console.log('  Handicapped: ' + firstResult.Handicaped);
  console.log('  Handicapped Emerging: ' + firstResult.HandicapedEmergingRegion);
  console.log('  CANG: ' + firstResult.CANG);
  console.log('  Exam: ' + firstResult.Exam);
  console.log('  Other Privilege: ' + firstResult.OtherPrevilageResult);
  
  // 5. CHECK SELECTION MECHANISM
  console.log('\n5. SELECTION MECHANISM');
  console.log('-'.repeat(40));
  
  const endpoints = [
    '/Placement/GetPlacementSelectionOption',
    '/Placement/GetDestinationDepartment',
    '/Placement/GetSelectionPriority',
    '/Placement/GetDepartmentApplicationSummary',
    '/Placement/GetPlacementPriority',
  ];
  
  for (const endpoint of endpoints) {
    try {
      const res = await req(endpoint, {
        headers: { 'Cookie': cookieStr, 'Accept': 'application/json' },
      });
      const data = JSON.parse(res.body);
      console.log('  ' + endpoint + ': ' + (data.data?.length || 0) + ' items');
    } catch(e) {
      console.log('  ' + endpoint + ': Error');
    }
  }
  
  // 6. HOW SCORE IS CALCULATED
  console.log('\n6. SCORE CALCULATION MECHANISM');
  console.log('-'.repeat(40));
  
  const totalScore = parseFloat(firstResult.TotalResult) || 0;
  console.log('  Total Score: ' + totalScore + '%');
  console.log('');
  console.log('  Components:');
  console.log('    CGPA (50%): ' + firstResult.CANG);
  console.log('    Program Entrance Exam (30%): ' + firstResult.Exam);
  console.log('    University Entrance Exam (20%): ' + firstResult.HighschoolExam);
  console.log('    Gender Bonus: ' + firstResult.Gender);
  console.log('    Gender Emerging: ' + firstResult.GenderEmergingRegion);
  console.log('    Handicapped: ' + firstResult.Handicaped);
  console.log('    Handicapped Emerging: ' + firstResult.HandicapedEmergingRegion);
  console.log('    Other: ' + firstResult.OtherPrevilageResult);
  
  // 7. PRIORITY MECHANISM
  console.log('\n7. PRIORITY ASSIGNMENT MECHANISM');
  console.log('-'.repeat(40));
  
  const priorities = resultData.data || [];
  priorities.forEach(function(p) {
    console.log('  ' + p.Priority + ' choice: ' + p.DestinationDepartment);
    console.log('    Status: ' + p.ApplicationStatus);
    console.log('    Placement: ' + p.PlacementStatus);
  });
  
  console.log('\n✅ DEEP STUDY COMPLETE');
}

deepStudy();
