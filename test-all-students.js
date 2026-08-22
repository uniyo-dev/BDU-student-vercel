const http = require('http');

function req(path, options = {}) {
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
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers || {}, body: data }));
    });
    r.on('error', reject);
    r.on('timeout', () => { r.destroy(); reject(new Error('Timeout')); });
    if (options.body) r.write(options.body);
    r.end();
  });
}

async function test() {
  console.log('TESTING ALL STUDENTS DATA\n');
  
  try {
    // Login
    const loginPage = await req('/Account/Login');
    console.log('Login page status:', loginPage.status);
    
    const token = loginPage.body.match(/__RequestVerificationToken[^>]*value="([^"]+)"/)?.[1] || '';
    const setCookies = loginPage.headers['set-cookie'] || [];
    const cookies1 = setCookies.map(c => c.split(';')[0]);
    
    console.log('Cookies from login page:', cookies1.length);
    
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
    
    console.log('Login status:', loginRes.status);
    
    const cookies2 = (loginRes.headers['set-cookie'] || []).map(c => c.split(';')[0]);
    const cookieStr = [...cookies1, ...cookies2].join('; ');
    
    // Test endpoints
    const endpoints = [
      '/Placement/GetDepartmentApplicationSummary',
      '/Placement/GetPlacementResultSummary',
      '/Placement/GetSelectionPriority',
      '/Placement/GetPlacementSelectionOption',
    ];
    
    console.log('\nTesting endpoints:');
    
    for (const endpoint of endpoints) {
      try {
        const res = await req(endpoint, {
          headers: { 'Cookie': cookieStr, 'Accept': 'application/json' },
        });
        
        try {
          const data = JSON.parse(res.body);
          console.log('  ' + endpoint + ': ' + (data.data?.length || 0) + ' items');
          if (data.data?.length > 0) {
            console.log('    First item keys:', Object.keys(data.data[0]).slice(0, 10).join(', '));
          }
        } catch(e) {
          console.log('  ' + endpoint + ': Not JSON (status ' + res.status + ')');
        }
      } catch(e) {
        console.log('  ' + endpoint + ': Error - ' + e.message);
      }
    }
    
    console.log('\nDONE');
    
  } catch(e) {
    console.log('Error:', e.message);
  }
}

test();
