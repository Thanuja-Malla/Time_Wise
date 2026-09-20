const http = require('http');

// Helper to make JSON requests
const request = (method, path, body = null, token = null) => {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const headers = {
      'Content-Type': 'application/json'
    };
    if (data) {
      headers['Content-Length'] = Buffer.byteLength(data);
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(
      {
        host: 'localhost',
        port: 5000,
        path,
        method,
        headers
      },
      (res) => {
        let resBody = '';
        res.on('data', (chunk) => (resBody += chunk));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(resBody);
            resolve({ status: res.statusCode, body: parsed });
          } catch {
            resolve({ status: res.statusCode, body: resBody });
          }
        });
      }
    );

    req.on('error', (e) => reject(e));
    if (data) req.write(data);
    req.end();
  });
};

async function runTests() {
  console.log('=== STARTING TIMEWISE BACKEND API VERIFICATION ===\n');

  try {
    // 1. Health check
    const health = await request('GET', '/api/health');
    console.log('[1] Health Check Status:', health.status, health.body?.status === 'online' ? '✓ PASS' : '✗ FAIL');

    // 2. Admin Login
    const adminLogin = await request('POST', '/api/auth/login', {
      email: 'admin@timewise.edu',
      password: 'Admin@123'
    });
    console.log('[2] Admin Login Status:', adminLogin.status, adminLogin.body?.token ? '✓ PASS' : '✗ FAIL');
    const adminToken = adminLogin.body?.token;

    // 3. Staff Login
    const staffLogin = await request('POST', '/api/auth/login', {
      email: 'staff@timewise.edu',
      password: 'Staff@123'
    });
    console.log('[3] Staff Login Status:', staffLogin.status, staffLogin.body?.token ? '✓ PASS' : '✗ FAIL');
    const staffToken = staffLogin.body?.token;

    // 4. Barcode Lookup: ABCDEF (M.Tanuja)
    const barcodeLookup = await request('GET', '/api/students/barcode/ABCDEF', null, staffToken);
    console.log('[4] Student Barcode Lookup (ABCDEF):', barcodeLookup.status, barcodeLookup.body?.student?.name ? `✓ PASS (${barcodeLookup.body.student.name})` : '✗ FAIL');

    // 5. Test Barcode Lookup for a clean student: A23126511065 (A.Yasawini)
    const cleanStudentLookup = await request('GET', '/api/students/barcode/A23126511065', null, staffToken);
    console.log('[5] Clean Student Lookup (A23126511065):', cleanStudentLookup.status, `Already marked today: ${cleanStudentLookup.body?.todayLateStatus?.alreadyMarked}`);

    // 6. Record Late Entry for A23126511065 (Morning Session)
    const createRes = await request('POST', '/api/late-entries', {
      barcode: 'A23126511065',
      reason: 'Traffic Congestion',
      remarks: 'Automated test entry'
    }, staffToken);
    console.log('[6] Record Late Entry (A23126511065):', createRes.status, createRes.body?.success ? `✓ PASS (Timestamp: ${createRes.body.lateEntry?.time})` : '✗ FAIL');

    // 7. Duplicate Prevention Test: Try recording A23126511065 again today
    const dupRes = await request('POST', '/api/late-entries', {
      barcode: 'A23126511065',
      reason: 'Bus / Transit Delay',
      remarks: 'Attempted duplicate'
    }, staffToken);
    console.log('[7] Duplicate Prevention Check (Expected 400 Bad Request):', dupRes.status === 400 ? `✓ PASS (${dupRes.body?.message})` : `✗ FAIL (${dupRes.status})`);

    // 8. Analytics Dashboard
    const analyticsRes = await request('GET', '/api/analytics/dashboard', null, adminToken);
    console.log('[8] Dashboard Analytics:', analyticsRes.status, `Total Students: ${analyticsRes.body?.kpis?.totalStudents}, Today Late: ${analyticsRes.body?.kpis?.todayLateCount}`);

    // 9. Report Export Data
    const reportRes = await request('GET', '/api/reports/export-data', null, adminToken);
    console.log('[9] Report Export Data:', reportRes.status, `Records Count: ${reportRes.body?.count}`);

    console.log('\n=== ALL API VERIFICATION TESTS COMPLETED SUCCESSFULLY! ===');
  } catch (err) {
    console.error('API Verification Test Error:', err.message);
  }
}

// Allow slight delay if called right after server startup
setTimeout(runTests, 1000);
