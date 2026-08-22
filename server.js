const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;

// BDU Portal API helper
function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const r = http.request({
      hostname: 'studentportal.bdu.edu.et',
      port: 80,
      path: path,
      method: options.method || 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'application/json, text/plain, */*',
        'Host': 'studentportal.bdu.edu.et',
        ...options.headers,
      },
      timeout: 15000,
    }, (res) => {
      let data = '';
      res.on('data', (c) => data += c);
      res.on('end', () => resolve({ statusCode: res.statusCode, headers: res.headers, body: data }));
    });
    r.on('error', reject);
    r.on('timeout', () => { r.destroy(); reject(new Error('Timeout')); });
    if (options.body) r.write(options.body);
    r.end();
  });
}

// Login handler
async function handleLogin(req, res) {
  let body = '';
  for await (const chunk of req) body += chunk;
  
  try {
    const { username, password } = JSON.parse(body || '{}');
    
    const loginPage = await makeRequest('/Account/Login');
    const token = loginPage.body.match(/__RequestVerificationToken[^>]*value="([^"]+)"/)?.[1] || '';
    const cookies1 = (loginPage.headers['set-cookie'] || []).map(c => c.split(';')[0]);
    
    const fd = new URLSearchParams();
    fd.append('Input.UserName', username);
    fd.append('Input.Password', password);
    fd.append('__RequestVerificationToken', token);
    fd.append('Input.RememberMe', 'false');
    
    const loginRes = await makeRequest('/Account/Login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': cookies1.join('; '),
        'Origin': 'http://studentportal.bdu.edu.et',
        'Referer': 'http://studentportal.bdu.edu.et/Account/Login',
      },
      body: fd.toString(),
    });
    
    if (loginRes.statusCode !== 302 && loginRes.statusCode !== 301) {
      res.writeHead(401, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      return res.end(JSON.stringify({ success: false, error: 'Invalid credentials' }));
    }
    
    const cookies2 = (loginRes.headers['set-cookie'] || []).map(c => c.split(';')[0]);
    const cookieStr = [...cookies1, ...cookies2].join('; ');
    const apiHeaders = { 'Cookie': cookieStr, 'Accept': 'application/json' };
    
    const bioRes = await makeRequest('/Biography/GetBasicBiographySummary', { headers: apiHeaders });
    const rawBio = JSON.parse(bioRes.body).data?.[0] || {};
    
    const currRes = await makeRequest('/RegistrationSummary/GetCurriculumInfo', { headers: apiHeaders });
    const rawCurr = JSON.parse(currRes.body).data?.[0] || {};
    
    let rawStudent = {};
    if (rawCurr.CurriculumTblCode) {
      const stuRes = await makeRequest(`/RegistrationSummary/GetStudentBasicInfo?curriculumCode=${rawCurr.CurriculumTblCode}`, { headers: apiHeaders });
      rawStudent = JSON.parse(stuRes.body).data?.[0] || {};
    }
    
    let rawRegs = [];
    if (rawStudent.StudentCurriculumTblCode) {
      const regRes = await makeRequest(`/RegistrationSummary/GetStudentRegistration?studentCurriculumCode=${rawStudent.StudentCurriculumTblCode}`, { headers: apiHeaders });
      rawRegs = JSON.parse(regRes.body).data || [];
    }
    
    let rawCourses = [];
    for (const reg of rawRegs) {
      const coursesRes = await makeRequest(`/RegistrationSummary/GetRegisteredCourses?registrationCode=${reg.RegistrationCode}`, { headers: apiHeaders });
      const coursesData = JSON.parse(coursesRes.body).data || [];
      if (coursesData.length > 0) {
        rawCourses.push({ semester: reg.Semester, acYear: reg.AcYear, courses: coursesData });
      }
    }
    
    let rawCriteria = [];
    let rawResults = [];
    let rawAllStudents = [];
    let rawSelectionPriority = [];
    try {
      const [criteriaRes, resultRes, allStudentsRes, selectionRes] = await Promise.all([
        makeRequest('/Placement/GetPlacementCriteria', { headers: apiHeaders }),
        makeRequest('/Placement/GetPlacementResultSummary', { headers: apiHeaders }),
        makeRequest('/Placement/GetDepartmentApplicationSummary', { headers: apiHeaders }),
        makeRequest('/Placement/GetSelectionPriority', { headers: apiHeaders }),
      ]);
      rawCriteria = JSON.parse(criteriaRes.body).data || [];
      rawResults = JSON.parse(resultRes.body).data || [];
      rawAllStudents = JSON.parse(allStudentsRes.body).data || [];
      rawSelectionPriority = JSON.parse(selectionRes.body).data || [];
    } catch(e) {}
    
    const biography = {
      fullName: `${rawBio.FirstName || ''} ${rawBio.FatherName || ''} ${rawBio.GFatherName || ''}`.trim(),
      studentId: rawBio.StudentID || '',
      gender: rawBio.Gender === 'M' ? 'Male' : 'Female',
      birthDate: rawBio.BirthDate || '',
      nationality: rawBio.Nationality || '',
      phone: rawBio.PhoneNumber || '',
      email: rawBio.EmailAddress || '',
      enrollmentDate: rawBio.EnrollmentDate || '',
      highSchoolStream: (rawBio.HighSchoolStream || '').replace(/Socieal/gi, 'Social'),
    };
    
    const registrations = rawRegs.map(reg => ({
      semester: reg.Semester,
      acYear: reg.AcYear,
      sgpa: parseFloat(reg.SGPA).toFixed(2),
      cgpa: parseFloat(reg.CGPA).toFixed(2),
      status: reg.FinalStatus || 'Pass',
    }));
    
    const courses = rawCourses.map(sem => ({
      semester: sem.semester,
      acYear: sem.acYear,
      courses: sem.courses.map(c => {
        const pctMatch = (c.GradeRemark || '').match(/(\d+\.?\d*)%/);
        return {
          code: c.CourseCode || '',
          title: c.CourseTitle || '',
          grade: c.LetterGrade || '—',
          credit: c.Credit || 0,
          points: c.GradePoint || 0,
          percentage: pctMatch ? pctMatch[1] + '%' : '',
        };
      }),
    }));
    
    const placementResults = rawResults.map(p => ({
      department: p.DestinationDepartment || '',
      priority: p.Priority || '',
      totalScore: p.TotalResult || '',
      status: p.ApplicationStatus || p.PlacementStatus || '',
      breakdown: {
        highschoolExam: p.HighschoolExam || '',
        gender: p.Gender || '',
        genderEmergingRegion: p.GenderEmergingRegion || '',
        handicapped: p.Handicaped || '',
        handicappedEmergingRegion: p.HandicapedEmergingRegion || '',
        cang: p.CANG || '',
        exam: p.Exam || '',
        otherPrivilege: p.OtherPrevilageResult || '',
      },
    }));
    
    const allStudentsList = rawAllStudents.map(s => ({
      studentId: s.StudentID || s.studentId || '',
      fullName: s.FullName || s.fullName || (s.FirstName + ' ' + s.FatherName).trim(),
      department: s.DestinationDepartment || s.Department || '',
      priority: s.Priority || '',
      totalScore: s.TotalResult || s.TotalScore || '',
      status: s.ApplicationStatus || s.PlacementStatus || '',
    }));

    const placementCriteria = rawCriteria.map(c => ({
      name: c.Criterianame || '',
      percent: c.ValueInPercent || 0,
      scored: c.ScoredRawResult || '—',
      maximum: c.MaximumResult || '',
    }));
    
    const totalCredits = courses.reduce((sum, sem) => sum + sem.courses.reduce((s, c) => s + (c.credit || 0), 0), 0);
    const latestCGPA = registrations.length > 0 ? registrations[registrations.length - 1].cgpa : null;
    
    res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    return res.end(JSON.stringify({
      success: true,
      data: {
        biography,
        program: rawCurr.CurrDetail || '',
        registrations,
        courses,
        placement: { results: placementResults, criteria: placementCriteria, allStudents: allStudentsList },
        summary: { totalSemesters: registrations.length, totalCredits, cumulativeGPA: latestCGPA },
      },
    }));
    
  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    return res.end(JSON.stringify({ success: false, error: error.message }));
  }
}

// Create server
const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    return res.end();
  }
  
  if (req.url === '/api/login') {
    return handleLogin(req, res);
  }
  
  // Serve static files
  let urlPath = req.url.split('?')[0];
  if (urlPath === '/') urlPath = '/index.html';
  
  let filePath = path.join(__dirname, 'public', urlPath);
  
  fs.readFile(filePath, (err, data) => {
    if (err) {
      // SPA fallback
      fs.readFile(path.join(__dirname, 'public', 'index.html'), (err2, htmlData) => {
        if (err2) {
          res.writeHead(404);
          res.end('Not found');
        } else {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(htmlData);
        }
      });
    } else {
      const ext = path.extname(filePath).toLowerCase();
      const types = {
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'text/javascript',
        '.json': 'application/json',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.svg': 'image/svg+xml',
        '.ico': 'image/x-icon',
        '.webp': 'image/webp',
      };
      res.writeHead(200, { 'Content-Type': types[ext] || 'application/octet-stream' });
      res.end(data);
    }
  });
});

server.listen(PORT, () => {
  console.log(`BDU Student Portal running on port ${PORT}`);
});
