const http = require('http');

const request = (method, path, body = null, token = null) => {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const headers = { 'Content-Type': 'application/json' };
    if (data) headers['Content-Length'] = Buffer.byteLength(data);
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const req = http.request(
      { host: 'localhost', port: 5000, path, method, headers },
      (res) => {
        let resBody = '';
        res.on('data', (c) => (resBody += c));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(resBody) });
          } catch {
            resolve({ status: res.statusCode, body: resBody });
          }
        });
      }
    );
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
};

async function syncCleanDB() {
  try {
    console.log('--- Cleaning and Resetting Database Records ---');

    // 1. Admin login
    const loginRes = await request('POST', '/api/auth/login', {
      email: 'admin@timewise.edu',
      password: 'Admin@123'
    });
    const token = loginRes.body?.token;
    if (!token) throw new Error('Admin authentication failed');

    // 2. Fetch all late entries and delete every single one
    let lateRes = await request('GET', '/api/late-entries?limit=500', null, token);
    const lateEntries = lateRes.body?.lateEntries || [];
    console.log(`Found ${lateEntries.length} late entries to clear.`);

    for (const entry of lateEntries) {
      await request('DELETE', `/api/late-entries/${entry._id}`, null, token);
    }
    console.log('✓ All late entries cleared (0 records).');

    // 3. Fetch all current students
    const studentsRes = await request('GET', '/api/students?limit=500', null, token);
    const existingStudents = studentsRes.body?.students || [];
    console.log(`Found ${existingStudents.length} registered students.`);

    // 4. Delete all students EXCEPT M.Tanuja and D.Sneha
    for (const s of existingStudents) {
      if (s.barcode !== 'ABCDEF' && s.barcode !== 'A23126511076') {
        await request('DELETE', `/api/students/${s._id}`, null, token);
        console.log(`Removed dummy student: ${s.name} (${s.rollNumber})`);
      }
    }

    // 5. Get IT department ID
    const deptsRes = await request('GET', '/api/departments', null, token);
    const itDept = deptsRes.body?.departments?.find((d) => d.code === 'IT') || deptsRes.body?.departments?.[0];

    // 6. Ensure M.Tanuja is registered and updated with proper details
    const tanujaCheck = await request('GET', '/api/students/barcode/ABCDEF', null, token);
    if (tanujaCheck.status === 200 && tanujaCheck.body?.student) {
      await request('PUT', `/api/students/${tanujaCheck.body.student._id}`, {
        studentId: 'A23126511092',
        name: 'M.Tanuja',
        rollNumber: 'ABCDEF',
        department: itDept._id,
        year: 4,
        section: 'B'
      }, token);
      console.log('✓ Updated M.Tanuja (Roll/Barcode: ABCDEF, Dept: IT, Year: 4, Sec: B)');
    } else {
      await request('POST', '/api/students', {
        studentId: 'A23126511092',
        barcode: 'ABCDEF',
        name: 'M.Tanuja',
        rollNumber: 'ABCDEF',
        department: itDept._id,
        year: 4,
        section: 'B',
        email: 'tanuja@student.edu',
        phone: '+91 98765 43299',
        status: 'active'
      }, token);
      console.log('✓ Registered M.Tanuja (Roll/Barcode: ABCDEF, Dept: IT, Year: 4, Sec: B)');
    }

    // 7. Ensure D.Sneha is registered
    const snehaCheck = await request('GET', '/api/students/barcode/A23126511076', null, token);
    if (snehaCheck.status === 200 && snehaCheck.body?.student) {
      await request('PUT', `/api/students/${snehaCheck.body.student._id}`, {
        studentId: 'A23126511076',
        name: 'D.Sneha',
        rollNumber: 'A23126511076',
        department: itDept._id,
        year: 4,
        section: 'A'
      }, token);
      console.log('✓ Updated D.Sneha (Roll/Barcode: A23126511076, Dept: IT, Year: 4, Sec: A)');
    } else {
      await request('POST', '/api/students', {
        studentId: 'A23126511076',
        barcode: 'A23126511076',
        name: 'D.Sneha',
        rollNumber: 'A23126511076',
        department: itDept._id,
        year: 4,
        section: 'A',
        email: 'sneha@student.edu',
        phone: '+91 98765 43210',
        status: 'active'
      }, token);
      console.log('✓ Registered D.Sneha (Roll/Barcode: A23126511076, Dept: IT, Year: 4, Sec: A)');
    }

    // 8. Verification summary
    const finalStudents = await request('GET', '/api/students', null, token);
    const finalLate = await request('GET', '/api/late-entries', null, token);
    console.log('\n--- FINAL STATUS ---');
    console.log(`Total Registered Students: ${finalStudents.body?.total}`);
    finalStudents.body?.students?.forEach((st) => {
      console.log(` - ${st.name} | Roll: ${st.rollNumber} | Barcode: ${st.barcode} | Dept: ${st.department?.code} | Yr: ${st.year}`);
    });
    console.log(`Total Late Entries: ${finalLate.body?.total}`);
    console.log('--- DATABASE CLEANUP COMPLETE ---');
  } catch (err) {
    console.error('Error during cleanup:', err.message);
  }
}

syncCleanDB();
