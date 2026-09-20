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

async function registerTanuja() {
  try {
    // 1. Login as Admin
    const loginRes = await request('POST', '/api/auth/login', {
      email: 'admin@timewise.edu',
      password: 'Admin@123'
    });
    const token = loginRes.body?.token;
    if (!token) throw new Error('Could not login as admin');

    // 2. Fetch departments
    const deptsRes = await request('GET', '/api/departments', null, token);
    const cse = deptsRes.body?.departments?.find((d) => d.code === 'CSE') || deptsRes.body?.departments?.[0];
    if (!cse) throw new Error('No department found');

    // 3. Check if already exists
    const checkRes = await request('GET', '/api/students/barcode/ABCDEF', null, token);
    if (checkRes.status === 200 && checkRes.body?.student) {
      console.log('Student Tanuja already registered:', checkRes.body.student.name, 'Barcode:', checkRes.body.student.barcode);
      return;
    }

    // 4. Create student Tanuja
    const createRes = await request('POST', '/api/students', {
      studentId: 'STU-ABCDEF',
      barcode: 'ABCDEF',
      name: 'Tanuja',
      rollNumber: 'ABCDEF',
      department: cse._id,
      year: 3,
      section: 'A',
      email: 'tanuja@student.edu',
      phone: '+91 98765 43299',
      guardianPhone: '+91 98765 00099',
      status: 'active'
    }, token);

    console.log('Registration result status:', createRes.status);
    console.log('Created student:', createRes.body?.student?.name, 'Barcode:', createRes.body?.student?.barcode);
  } catch (err) {
    console.error('Error registering student:', err.message);
  }
}

registerTanuja();
