const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;

// ============================================================
// Environment loading (development only)
// Reads .env file if present. On Render, env vars come from dashboard.
// ============================================================
try {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split(/\r?\n/).forEach(function (line) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
      if (m && !process.env[m[1]]) {
        process.env[m[1]] = m[2];
      }
    });
  }
} catch (err) {
  // .env is optional
}

// ============================================================
// In-memory BDU session store (for placement refresh)
// Maps sessionId -> { cookies, username, expiresAt }
// Entries expire after 15 minutes. NEVER written to disk.
// ============================================================
const BDU_SESSIONS = new Map();
const SESSION_TTL_MS = 15 * 60 * 1000;

function createBDUSession(cookies, username) {
  const id = crypto.randomBytes(24).toString('hex');
  BDU_SESSIONS.set(id, {
    cookies: cookies,
    username: username,
    expiresAt: Date.now() + SESSION_TTL_MS,
  });
  return id;
}

function getBDUSession(id) {
  if (!id) return null;
  const s = BDU_SESSIONS.get(id);
  if (!s) return null;
  if (Date.now() > s.expiresAt) {
    BDU_SESSIONS.delete(id);
    return null;
  }
  return s;
}

function touchBDUSession(id) {
  const s = BDU_SESSIONS.get(id);
  if (s) s.expiresAt = Date.now() + SESSION_TTL_MS;
}

setInterval(function () {
  const now = Date.now();
  BDU_SESSIONS.forEach(function (s, id) {
    if (now > s.expiresAt) BDU_SESSIONS.delete(id);
  });
}, 5 * 60 * 1000).unref();

// ============================================================
// HMAC-signed serials
// ============================================================
const crypto = require('crypto');
const HMAC_SECRET = process.env.HMAC_SECRET;
const HMAC_SIG_LENGTH = 10;

if (!HMAC_SECRET) {
  console.error('=================================================');
  console.error('  WARNING: HMAC_SECRET not set.');
  console.error('  Serial verification will NOT work.');
  console.error('  Set it via .env (local) or Render env var (prod).');
  console.error('=================================================');
} else {
  console.log('HMAC secret loaded (' + HMAC_SECRET.length + ' chars)');
}

function signSerial(studentId, timestamp, random) {
  if (!HMAC_SECRET) return '';
  const payload = studentId + '|' + timestamp + '|' + random;
  const hmac = crypto.createHmac('sha256', HMAC_SECRET)
                     .update(payload)
                     .digest('hex');
  return hmac.slice(0, HMAC_SIG_LENGTH).toUpperCase();
}

function generateSerial(studentId) {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(3).toString('hex').toUpperCase();
  const sig = signSerial(studentId, timestamp, random);
  return 'BDU-GR-' + studentId + '-' + timestamp + '-' + random + '-' + sig;
}

function verifySerial(serial) {
  if (!HMAC_SECRET) {
    return { valid: false, reason: 'Verification unavailable: server secret not configured' };
  }
  if (!serial || typeof serial !== 'string') {
    return { valid: false, reason: 'No serial provided' };
  }

  const parts = serial.split('-');
  // Expected: BDU-GR-<studentId>-<timestamp>-<random>-<signature>
  if (parts.length !== 6) {
    return { valid: false, reason: 'Malformed serial' };
  }
  if (parts[0] !== 'BDU' || parts[1] !== 'GR') {
    return { valid: false, reason: 'Invalid serial prefix' };
  }

  const studentId = parts[2];
  const timestamp = parts[3];
  const random = parts[4];
  const providedSig = parts[5];

  const expectedSig = signSerial(studentId, timestamp, random);

  // Constant-time comparison to prevent timing attacks
  if (providedSig.length !== expectedSig.length) {
    return { valid: false, reason: 'Invalid signature length' };
  }
  let mismatch = 0;
  for (let i = 0; i < expectedSig.length; i++) {
    mismatch |= providedSig.charCodeAt(i) ^ expectedSig.charCodeAt(i);
  }
  if (mismatch !== 0) {
    return { valid: false, reason: 'Signature mismatch' };
  }

  const generatedAt = parseInt(timestamp, 36);
  return {
    valid: true,
    studentId: studentId,
    generatedAt: isNaN(generatedAt) ? null : generatedAt,
  };
}

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
    let { username, password } = JSON.parse(body || '{}');
    
    // Normalize username
    username = (username || '').trim();
    
    // Accept formats: "1046595", "bdu1046595", "BDU1046595"
    if (!username.toLowerCase().startsWith('bdu')) {
      username = 'bdu' + username;
    }
    username = username.toLowerCase();
    
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
      const [criteriaRes, resultRes, allStudentsRes, selectionRes, deptSelectionRes] = await Promise.all([
        makeRequest('/Placement/GetPlacementCriteria', { headers: apiHeaders }),
        makeRequest('/Placement/GetPlacementResultSummary', { headers: apiHeaders }),
        makeRequest('/Placement/GetDepartmentApplicationSummary', { headers: apiHeaders }),
        makeRequest('/Placement/GetSelectionPriority', { headers: apiHeaders }),
        makeRequest('/DepartmentPlacment/DepartmentSelection', { headers: apiHeaders }),
      ]);
      rawCriteria = JSON.parse(criteriaRes.body).data || [];
      rawResults = JSON.parse(resultRes.body).data || [];
      rawAllStudents = JSON.parse(allStudentsRes.body).data || [];
      rawSelectionPriority = JSON.parse(selectionRes.body).data || [];
    } catch(e) {}

    // ─── Real department list + priorities from BDU ───
    // Declared OUTSIDE the try above so they're in scope for the response.
    let rawSelectionOptions = [];
    let rawPriorities = [];
    try {
      const [selOptRes, prioRes] = await Promise.all([
        makeRequest('/Placement/GetPlacementSelectionOption', { headers: apiHeaders }),
        makeRequest('/Placement/GetPlacementPriority', { headers: apiHeaders }),
      ]);
      try { rawSelectionOptions = JSON.parse(selOptRes.body).data || []; } catch(e){}
      try { rawPriorities = JSON.parse(prioRes.body).data || []; } catch(e){}
    } catch (e) {
      console.error('[BDU] selection fetch error:', e.message);
    }
    
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
      // Extended columns to mirror BDU's PlacementPrioritySummary table
      highschoolExam: s.HighschoolExam || s.NonExamTotalResult || s.NoneExamTotalResult || '',
      programExam: s.Exam || s.ExamResult || '',
      gender: s.Gender || '',
      academicStatus: s.AcademicStatus || s.AcademicStanding || s.AcademicResult || '',
      applicationStatus: s.ApplicationStatus || '',
      placementStatus: s.PlacementStatus || '',
      // Filter fields (matching BDU's PlacementPrioritySummary filter panel)
      academicYear: s.AcYear || s.AcademicYear || '',
      semester: s.Semester || '',
      year: s.Year || s.AcademicYearShort || '',
      term: s.AcademicTerm || s.Term || '',
    }));

    const placementCriteria = rawCriteria.map(c => ({
      name: c.Criterianame || '',
      percent: c.ValueInPercent || 0,
      scored: c.ScoredRawResult || '—',
      maximum: c.MaximumResult || '',
    }));
    
    const totalCredits = courses.reduce((sum, sem) => sum + (sem.courses || []).reduce((s, c) => s + (c.credit || 0), 0), 0);
    const latestCGPA = registrations.length > 0 ? registrations[registrations.length - 1].cgpa : null;
    
    // Create a short-lived session for placement refresh
    const sessionId = createBDUSession(cookieStr, username);

    res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    return res.end(JSON.stringify({
      success: true,
      sessionId: sessionId,
      data: {
        biography,
        program: rawCurr.CurrDetail || '',
        registrations,
        courses,
        placement: {
          results: placementResults,
          criteria: placementCriteria,
          allStudents: allStudentsList,
          selectionOptions: (Array.isArray(rawSelectionOptions) ? rawSelectionOptions : []).map(o => ({
            department: o.DestinationDepartment || o.DepartmentName || o.Name || o.Department || '',
            code: o.DepartmentCode || o.Code || '',
            capacity: o.IntakeCapacity || o.Capacity || null,
            applyStart: o.ApplicationStartDate || o.StartDate || '',
            applyEnd: o.ApplicationEndDate || o.EndDate || '',
            applied: o.StudentAppliedStatus || o.AppliedStatus || '',
          })).filter(o => o.department),
          priorities: (Array.isArray(rawPriorities) ? rawPriorities : []).map(p => ({
            name: p.PriorityName,
            label: p.PriorityDescription || p.PriorityName + 'th' || '',
          }))
        },
        summary: { 
          totalSemesters: registrations.length, 
          totalCredits, 
          cumulativeGPA: latestCGPA,
          gradeBreakdown: (function() {
            var breakdown = { Aplus: 0, A: 0, Bplus: 0, B: 0, Cplus: 0, C: 0, D: 0, F: 0, P: 0 };
            courses.forEach(function(sem) {
              (sem.courses || []).forEach(function(c) {
                var g = c.grade || '';
                if (g === 'A+') breakdown.Aplus++;
                else if (g === 'A') breakdown.A++;
                else if (g === 'B+') breakdown.Bplus++;
                else if (g === 'B') breakdown.B++;
                else if (g === 'C+') breakdown.Cplus++;
                else if (g === 'C') breakdown.C++;
                else if (g === 'D') breakdown.D++;
                else if (g === 'F') breakdown.F++;
                else if (g === 'P') breakdown.P++;
              });
            });
            return breakdown;
          })(),
          rankScore: (function() {
            var score = 0;
            courses.forEach(function(sem) {
              (sem.courses || []).forEach(function(c) {
                var g = c.grade || '';
                if (g === 'A+') score += 5;
                else if (g === 'A') score += 4;
                else if (g === 'B+') score += 3.5;
                else if (g === 'B') score += 3;
                else if (g === 'C+') score += 2.5;
                else if (g === 'C') score += 2;
                else if (g === 'D') score += 1;
                else if (g === 'P') score += 0.5;
              });
            });
            return score;
          })(),
        },
      },
    }));
    
  } catch (error) {
    console.error('[LOGIN-ERROR]', error.stack || error.message);
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      return res.end(JSON.stringify({ success: false, error: error.message }));
    }
    console.error('[LOGIN-ERROR] headers already sent, cannot respond');
    return;
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

  // Verification route: /verify/<token>
  if (req.url.startsWith('/verify/')) {
    const verifyPath = path.join(__dirname, 'public', 'pages', 'verify.html');
    fs.readFile(verifyPath, (err, data) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        return res.end('Verify page not found');
      }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    });
    return;
  }

  // Password verification: POST /api/verify-password
  if (req.url === '/api/verify-password' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const { username, password } = JSON.parse(body || '{}');
        
        if (!username || !password) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ valid: false, error: 'Missing credentials' }));
        }

        // Normalize username (same as login)
        let normalizedUser = String(username).trim();
        if (!normalizedUser.toLowerCase().startsWith('bdu')) {
          normalizedUser = 'bdu' + normalizedUser;
        }
        normalizedUser = normalizedUser.toLowerCase();

        // Get the login page + antiforgery token
        const loginPage = await makeRequest('/Account/Login');
        const token = loginPage.body.match(/__RequestVerificationToken[^>]*value="([^"]+)"/)?.[1] || '';
        const cookies1 = (loginPage.headers['set-cookie'] || []).map(c => c.split(';')[0]);

        // POST credentials
        const fd = new URLSearchParams();
        fd.append('Input.UserName', normalizedUser);
        fd.append('Input.Password', password);
        fd.append('__RequestVerificationToken', token);
        fd.append('Input.RememberMe', 'false');

        const verifyRes = await makeRequest('/Account/Login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Cookie': cookies1.join('; '),
            'Origin': 'http://studentportal.bdu.edu.et',
            'Referer': 'http://studentportal.bdu.edu.et/Account/Login',
          },
          body: fd.toString(),
        });

        // Success = 302 redirect
        const valid = (verifyRes.statusCode === 302 || verifyRes.statusCode === 301);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ valid: valid }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ valid: false, error: err.message }));
      }
    });
    return;
  }

  // Rankings refresh: POST /api/rankings/refresh — uses stored session cookies
  if (req.url === '/api/rankings/refresh' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const { sessionId } = JSON.parse(body || '{}');
        const session = getBDUSession(sessionId);
        if (!session) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: false, error: 'Session expired. Please log out and log back in.' }));
        }

        const apiHeaders = {
          'Cookie': session.cookies,
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        };

        const [resultRes, criteriaRes, allStudentsRes, selOptRes] = await Promise.all([
          makeRequest('/Placement/GetPlacementResultSummary', { headers: apiHeaders }),
          makeRequest('/Placement/GetPlacementCriteria', { headers: apiHeaders }),
          makeRequest('/Placement/GetDepartmentApplicationSummary', { headers: apiHeaders }),
          makeRequest('/Placement/GetPlacementSelectionOption', { headers: apiHeaders }),
        ]);

        const results = JSON.parse(resultRes.body || '{}').data || [];
        const criteria = JSON.parse(criteriaRes.body || '{}').data || [];
        const allStudentsRaw = JSON.parse(allStudentsRes.body || '{}').data || [];
        const selectionOptionsRaw = JSON.parse(selOptRes.body || '{}').data || [];

        const allStudents = allStudentsRaw.map(s => ({
          studentId: s.StudentID || s.studentId || '',
          fullName: s.FullName || s.fullName || ((s.FirstName || '') + ' ' + (s.FatherName || '')).trim(),
          department: s.DestinationDepartment || s.Department || '',
          priority: s.Priority || '',
          totalScore: s.TotalResult || s.TotalScore || '',
          status: s.ApplicationStatus || s.PlacementStatus || '',
          highschoolExam: s.HighschoolExam || s.NonExamTotalResult || s.NoneExamTotalResult || '',
          programExam: s.Exam || s.ExamResult || '',
          gender: s.Gender || '',
          academicStatus: s.AcademicStatus || s.AcademicStanding || s.AcademicResult || '',
          applicationStatus: s.ApplicationStatus || '',
          placementStatus: s.PlacementStatus || '',
          academicYear: s.AcYear || s.AcademicYear || '',
          semester: s.Semester || '',
          year: s.Year || s.AcademicYearShort || '',
          term: s.AcademicTerm || s.Term || '',
        }));

        const selectionOptions = selectionOptionsRaw.map(o => ({
          department: o.DestinationDepartment || o.DepartmentName || o.Name || o.Department || '',
          code: o.DepartmentCode || o.Code || '',
          capacity: o.IntakeCapacity || o.Capacity || null,
          applyStart: o.ApplicationStartDate || o.StartDate || '',
          applyEnd: o.ApplicationEndDate || o.EndDate || '',
          applied: o.StudentAppliedStatus || o.AppliedStatus || '',
        })).filter(o => o.department);

        touchBDUSession(sessionId);

        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({
          success: true,
          data: { results, criteria, allStudents, selectionOptions },
        }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // Rankings: POST /api/rankings — fresh re-login + fetch placement data
  if (req.url === '/api/rankings' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const { username, password } = JSON.parse(body || '{}');
        if (!username || !password) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: false, error: 'Missing credentials' }));
        }

        // Normalize username (same pattern as login)
        let normalizedUser = String(username).trim();
        if (!normalizedUser.toLowerCase().startsWith('bdu')) {
          normalizedUser = 'bdu' + normalizedUser;
        }
        normalizedUser = normalizedUser.toLowerCase();

        // Get login page + antiforgery token
        const loginPage = await makeRequest('/Account/Login');
        const token = loginPage.body.match(/__RequestVerificationToken[^>]*value="([^"]+)"/)?.[1] || '';
        const cookies1 = (loginPage.headers['set-cookie'] || []).map(c => c.split(';')[0]);

        // POST credentials
        const fd = new URLSearchParams();
        fd.append('Input.UserName', normalizedUser);
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
          res.writeHead(401, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: false, error: 'Invalid credentials' }));
        }

        const cookies2 = (loginRes.headers['set-cookie'] || []).map(c => c.split(';')[0]);
        const apiHeaders = { 'Cookie': [...cookies1, ...cookies2].join('; '), 'Accept': 'application/json' };

        // Fetch live placement data
        const [resultRes, criteriaRes, allStudentsRes] = await Promise.all([
          makeRequest('/Placement/GetPlacementResultSummary', { headers: apiHeaders }),
          makeRequest('/Placement/GetPlacementCriteria', { headers: apiHeaders }),
          makeRequest('/Placement/GetDepartmentApplicationSummary', { headers: apiHeaders }),
        ]);

        const results = JSON.parse(resultRes.body).data || [];
        const criteria = JSON.parse(criteriaRes.body).data || [];
        const allStudents = JSON.parse(allStudentsRes.body).data || [];

        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({
          success: true,
          data: { results, criteria, allStudents },
        }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // DEBUG: /api/debug-endpoints — POST { username, password }
  // REMOVE AFTER DIAGNOSIS. Probes the placement endpoints.
  if (req.url === '/api/debug-endpoints' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const { username, password } = JSON.parse(body);
        if (!username || !password) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: false, error: 'username and password required' }));
        }

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

        // ─── DEBUG: dump everything about the login attempt ───
        const loginDebug = {
          loginStatus: loginRes.statusCode,
          loginHeaders: loginRes.headers,
          loginBodyLength: (loginRes.body || '').length,
          loginBodyPreview: (loginRes.body || '').slice(0, 1500),
          tokenExtracted: token ? 'yes (len ' + token.length + ')' : 'NO',
          tokenPreview: token ? token.slice(0, 60) : '',
          loginPageStatus: loginPage.statusCode,
          loginPageLength: (loginPage.body || '').length,
          loginPageFirstForm: (loginPage.body || '').match(/<form[\s\S]{0,800}/) ? 'present' : 'not found',
          loginPageInputNames: ((loginPage.body || '').match(/name="[^"]+"/g) || []).slice(0, 20),
          cookies1Count: cookies1.length,
          cookies2Count: (loginRes.headers['set-cookie'] || []).length,
        };

        const cookies2 = (loginRes.headers['set-cookie'] || []).map(c => c.split(';')[0]);
        const cookieHeader = [...cookies1, ...cookies2].join('; ');
        const apiHeaders = { 'Cookie': cookieHeader, 'Accept': 'application/json, text/plain, */*', 'X-Requested-With': 'XMLHttpRequest' };

        const endpoints = [
          '/Placement/GetPlacementSelectionOption',
          '/Placement/GetPlacementPriority',
          '/DepartmentPlacment/DepartmentSelection',
          '/Placement/GetPlacementResultSummary',
          '/Placement/GetPlacementCriteria',
          '/Placement/GetDepartmentApplicationSummary',
        ];

        const results = [];
        for (const ep of endpoints) {
          try {
            const r = await makeRequest(ep, { headers: apiHeaders });
            const bodyText = r.body || '';
            results.push({
              path: ep,
              status: r.statusCode,
              length: bodyText.length,
              contentType: (r.headers && r.headers['content-type']) || '',
              preview: bodyText.slice(0, 600),
            });
          } catch (e) {
            results.push({ path: ep, error: e.message });
          }
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          loginDebug: loginDebug,
          endpoints: results
        }, null, 2));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // DEBUG: /api/probe-rankings — find the URL that returns BDU's student ranking
  // POST { username, password, department, priority }
  // Tries many candidate URLs and returns status + length + preview of each.
  if (req.url === '/api/probe-rankings' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const { username, password, department, priority } = JSON.parse(body || '{}');
        if (!username || !password) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: false, error: 'username and password required' }));
        }

        // Log in
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

        const cookies2 = (loginRes.headers['set-cookie'] || []).map(c => c.split('; ')[0]);
        const cookieHeader = [...cookies1, ...cookies2].join('; ');
        const apiHeaders = {
          'Cookie': cookieHeader,
          'Accept': 'application/json, text/plain, */*',
          'X-Requested-With': 'XMLHttpRequest'
        };

        const d = department || 'Economics';
        const p = priority || '1';

        // Candidate URLs — probe them all
        const candidates = [
          // Direct URL patterns
          '/Placement/GetDepartmentApplicationSummary',
          '/Placement/GetDepartmentApplicationDetail',
          '/Placement/GetPlacementPrioritySummary',
          '/Placement/GetPlacementResultByDepartment',
          '/Placement/GetSelectionPriorityResult',
          '/Placement/GetStudentByPriority',
          '/Placement/GetPriorityStudents',
          '/Placement/GetRankByPriority',
          '/Placement/GetPlacementPriorityDetail',
          // With query params
          '/Placement/GetDepartmentApplicationSummary?department=' + encodeURIComponent(d) + '&priority=' + p,
          '/Placement/GetPlacementPrioritySummary?department=' + encodeURIComponent(d) + '&priority=' + p,
          '/Placement/GetSelectionPriorityResult?department=' + encodeURIComponent(d) + '&priority=' + p,
          '/Placement/GetStudentByPriority?department=' + encodeURIComponent(d) + '&priority=' + p,
          '/Placement/GetRankByPriority?department=' + encodeURIComponent(d) + '&priority=' + p,
          // HTML pages that may render
          '/DepartmentPlacment/PlacementPrioritySummary',
        ];

        // Probe the lookup endpoints
        const lookups = [
          '/Placement/GetDestinationDepartment',
          '/Placement/GetSelectionPriority',
          '/Placement/GetAcYear',
          '/Placement/GetSemester',
          '/Placement/GetYear',
          '/Placement/GetTerm',
        ];
        const lookupData = [];
        for (const url of lookups) {
          try {
            const r = await makeRequest(url, { headers: apiHeaders });
            const b = r.body || '';
            lookupData.push({
              url: url,
              status: r.statusCode,
              length: b.length,
              preview: b.slice(0, 800),
            });
          } catch (e) {
            lookupData.push({ url: url, error: e.message });
          }
        }

        // Special case: fetch the HTML page and dump its structure
        let htmlDump = null;
        try {
          const htmlR = await makeRequest(
            '/DepartmentPlacment/PlacementPrioritySummary?department=' + encodeURIComponent(d) + '&priority=' + p + '&academicYear=2025/2026&semester=2&year=1&term=II',
            { headers: { 'Cookie': cookieHeader, 'Accept': 'text/html' } }
          );
          const html = htmlR.body || '';
          htmlDump = {
            status: htmlR.statusCode,
            length: html.length,
            // Extract any URLs in the HTML (loadUrl, ajax, callback)
            urls: (html.match(/["'](?:loadUrl|url|Url|action|Action|ajaxUrl|callback)["']\s*[:=]\s*["']([^"']+)["']/g) || []).slice(0, 30),
            // Find the first <table> block (first 1500 chars)
            tablePreview: (function () {
              const idx = html.indexOf('<table');
              if (idx === -1) return 'NO TABLE FOUND';
              return html.slice(idx, idx + 1500);
            })(),
            // Find the createStore block for GetDepartmentApplicationSummary
            storeConfig: (function () {
              const idx = html.indexOf('/Placement/GetDepartmentApplicationSummary');
              if (idx === -1) return 'NOT FOUND';
              return html.slice(Math.max(0, idx - 200), idx + 2500);
            })(),
            // Find any 'DataGrid' or grid definitions
            gridConfig: (function () {
              const idx = html.indexOf('dxDataGrid');
              if (idx === -1) return 'NO GRID';
              return html.slice(idx, idx + 2500);
            })(),
            // Find any "GetPlacement" or "Placement/" URLs in the HTML
            placementUrls: (html.match(/\/Placement\/[A-Za-z]+/g) || []).filter((v, i, a) => a.indexOf(v) === i).slice(0, 30),
            // Find any URLs with GetXXX / GetYYY pattern
            getUrls: (html.match(/\/Get[A-Z][A-Za-z]+/g) || []).filter((v, i, a) => a.indexOf(v) === i).slice(0, 30),
          };
        } catch (e) {
          htmlDump = { error: e.message };
        }

        const results = [];
        for (const url of candidates) {
          try {
            const r = await makeRequest(url, { headers: apiHeaders });
            const b = r.body || '';
            results.push({
              url: url,
              status: r.statusCode,
              length: b.length,
              contentType: (r.headers && r.headers['content-type']) || '',
              preview: b.slice(0, 300),
            });
          } catch (e) {
            results.push({ url: url, error: e.message });
          }
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          loginStatus: loginRes.statusCode,
          department: d,
          priority: p,
          lookups: lookupData,
          htmlDump: htmlDump,
          results: results,
        }, null, 2));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // PDF generation: POST /api/generate-grade-pdf
  if (req.url === '/api/generate-grade-pdf' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      // Parse payload, generate a signed serial, and re-serialize.
      // Backend now owns serial generation so it can sign with HMAC.
      let modifiedBody = body;
      try {
        const payload = JSON.parse(body);
        if (payload && payload.biography && payload.biography.studentId) {
          payload.serial = generateSerial(payload.biography.studentId);
          modifiedBody = JSON.stringify(payload);
        } else {
          console.error('PDF payload missing studentId; cannot generate serial');
        }
      } catch (err) {
        console.error('Failed to parse PDF payload:', err.message);
      }

      const { spawn } = require('child_process');
      const py = spawn('python3', [path.join(__dirname, 'scripts', 'grade_report.py')]);
      
      let pdfChunks = [];
      let errChunks = [];
      
      py.stdout.on('data', c => pdfChunks.push(c));
      py.stderr.on('data', c => errChunks.push(c));
      
      py.on('close', code => {
        const pdf = Buffer.concat(pdfChunks);
        const stderr = Buffer.concat(errChunks).toString();

        // ─── Diagnostic logging ────────────────────────────────
        console.log('[PDF] exit code:', code);
        console.log('[PDF] stdout bytes:', pdf.length);
        console.log('[PDF] stderr bytes:', stderr.length);
        if (stderr) {
          console.log('[PDF] stderr (first 2000 chars):');
          console.log(stderr.slice(0, 2000));
        }
        if (pdf.length > 0) {
          console.log('[PDF] stdout first 8 bytes:', pdf.slice(0, 8).toString());
        }

        if (code !== 0) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({
            success: false,
            error: 'Python exited with code ' + code + ': ' + stderr.slice(0, 800)
          }));
        }

        // ─── Validate PDF output ───────────────────────────────
        const header = pdf.slice(0, 4).toString('ascii');
        if (pdf.length === 0 || header !== '%PDF') {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({
            success: false,
            error: 'Python produced invalid output (length=' + pdf.length +
                   ', header="' + header + '"). ' +
                   'stderr: ' + stderr.slice(0, 600)
          }));
        }

        res.writeHead(200, {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'attachment; filename="BDU-Grade-Report.pdf"',
          'Content-Length': pdf.length,
        });
        res.end(pdf);
      });
      
      py.on('error', err => {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('PDF spawn failed: ' + err.message);
      });
      
      py.stdin.write(modifiedBody);
      py.stdin.end();
    });
    return;
  }

  
  // ============================================================
  // Serial generation endpoint
  // GET /api/serial/new?studentId=<id>
  // Returns a fresh signed serial for the current session.
  // ============================================================
  if (req.url.startsWith('/api/serial/new') && req.method === 'GET') {
    const query = req.url.split('?')[1] || '';
    const params = new URLSearchParams(query);
    const studentId = params.get('studentId') || '';

    if (!studentId) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: false, error: 'Missing studentId' }));
    }

    const serial = generateSerial(studentId);
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    });
    return res.end(JSON.stringify({ success: true, serial: serial }));
  }

  // ============================================================
  // Serial verification endpoint
  // GET /api/verify/:serial
  // ============================================================
  if (req.url.startsWith('/api/verify/') && req.method === 'GET') {
    const serial = decodeURIComponent(req.url.slice('/api/verify/'.length));
    const result = verifySerial(serial);

    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-store',
    });

    if (result.valid) {
      return res.end(JSON.stringify({
        valid: true,
        serial: serial,
        studentId: result.studentId,
        generatedAt: result.generatedAt,
      }));
    } else {
      return res.end(JSON.stringify({
        valid: false,
        serial: serial,
        error: result.reason || 'Serial could not be verified',
      }));
    }
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
  console.log(`🎓 BD Buddy running on port ${PORT}`);
});
