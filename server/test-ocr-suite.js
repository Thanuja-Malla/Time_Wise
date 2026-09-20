(async () => {
  const { parseRegdNumber, cleanRegNoCandidate, isValidRegNo } = await import('../client/src/utils/ocrUtils.js');

  const tests = [
    { name: 'User Example Card (M.Tanuja)', input: 'COLLEGE ID CARD\nRegd. No : A23126511092\nName: M. Tanuja\nBranch: IT', expected: 'A23126511092' },
    { name: 'Colon no space (A.Yasawini)', input: 'Regd. No: A23126511071', expected: 'A23126511071' },
    { name: 'OCR optical confusion I -> 1', input: 'Regd. No: A23I265II092', expected: 'A23126511092' },
    { name: 'OCR optical confusion O -> 0', input: 'Regd. No : A23126511O92', expected: 'A23126511092' },
    { name: 'Regd No variant (Vasundhara)', input: 'Front Side\nRegd No : A25126511174\nDOB: 12/04/2003', expected: 'A25126511174' },
    { name: 'Registration No variant (D.Sneha)', input: 'STUDENT CARD\nRegistration No. : A23126511076', expected: 'A23126511076' },
    { name: 'OCR optical confusion D -> 0', input: 'Regd. No : A23126511D92', expected: 'A23126511092' },
    { name: 'OCR optical confusion Q -> 0', input: 'Regd. No : A23126511Q92', expected: 'A23126511092' },
    { name: 'OCR prefix 4 -> A (optical confusion)', input: 'Regd. No: 423126511092', expected: 'A23126511092' },
    { name: 'Regd No with internal spaces', input: 'Regd. No : A2312 6511 092', expected: 'A23126511092' },
    { name: 'H.T. No variant', input: 'H.T. No : A23126511092', expected: 'A23126511092' },
    { name: 'Privacy filter - Aadhaar and Mobile numbers ignored', input: 'Mobile: 9876543210 Aadhaar: 1234 5678 9012', expected: null },
    { name: 'Empty / Garbled input', input: 'RANDOM TEXT NO NUMBERS', expected: null }
  ];

  console.log('=== RUNNING TIMEWISE OCR EXTRACTION TEST SUITE ===\n');

  let passed = 0;
  tests.forEach((t, i) => {
    const result = parseRegdNumber(t.input);
    const ok = result === t.expected;
    if (ok) passed++;
    console.log(`[${i + 1}] ${t.name}:`);
    console.log(`    Expected: ${t.expected} | Got: ${result} -> ${ok ? '✓ PASS' : '✗ FAIL'}`);
  });

  console.log(`\n=== RESULT: ${passed}/${tests.length} TESTS PASSED ===`);

  if (passed === tests.length) {
    console.log('All OCR validation and extraction tests passed successfully!');
    process.exit(0);
  } else {
    console.error('Some tests failed!');
    process.exit(1);
  }
})();
