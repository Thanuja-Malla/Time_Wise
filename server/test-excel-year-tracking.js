const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const {
  UNIFIED_EXCEL_FILENAME,
  UNIFIED_EXCEL_PATH,
  ORDERED_SHEETS,
  EXCEL_HEADERS,
  initUnifiedExcelFile,
  determineYearFromRoll,
  appendLateEntryToExcel,
  readSheetRows
} = require('./src/services/excelService');

async function runExcelYearTrackingTests() {
  console.log('=== RUNNING UNIFIED EXCEL 3-SHEET TRACKING TEST SUITE ===\n');

  let passed = 0;
  let totalTests = 0;

  function assert(name, condition) {
    totalTests++;
    if (condition) {
      passed++;
      console.log(`[PASS] ${name}`);
    } else {
      console.error(`[FAIL] ${name}`);
    }
  }

  // 1. Test Roll Number Pattern Detection
  console.log('\n--- 1. Testing Updated Roll Number Pattern Matching ---');
  // A23 series -> 4th year
  assert('A23 series maps to 4th Year', determineYearFromRoll('A23126511001') === 4);
  assert('a23 lowercase series maps to 4th Year', determineYearFromRoll('a23126511092') === 4);
  assert('23 without prefix A maps to 4th Year', determineYearFromRoll('23126511001') === 4);

  // A24 series -> 3rd year
  assert('A24 series maps to 3rd Year', determineYearFromRoll('A24126511045') === 3);
  assert('a24 lowercase series maps to 3rd Year', determineYearFromRoll('a24126511045') === 3);
  assert('24 without prefix A maps to 3rd Year', determineYearFromRoll('24126511045') === 3);

  // A25 series -> 2nd year
  assert('A25 series maps to 2nd Year', determineYearFromRoll('A25126511012') === 2);
  assert('a25 lowercase series maps to 2nd Year', determineYearFromRoll('a25126511012') === 2);
  assert('25 without prefix A maps to 2nd Year', determineYearFromRoll('25126511012') === 2);

  // Fallback tests
  assert('Fallback: studentYear=4 when roll has no year prefix', determineYearFromRoll('CUSTOM_ROLL', 4) === 4);
  assert('Fallback: studentYear=3 when roll has no year prefix', determineYearFromRoll('CUSTOM_ROLL', 3) === 3);
  assert('Fallback: studentYear=2 when roll has no year prefix', determineYearFromRoll('CUSTOM_ROLL', 2) === 2);
  assert('Unmatched year (e.g. 1st year A26) returns null', determineYearFromRoll('A26126511001', 1) === null);

  // 2. Test Single Unified File and 3 Sheets Creation
  console.log('\n--- 2. Testing Single Excel File & 3 Sheets Creation ---');
  // Reset for clean test
  if (fs.existsSync(UNIFIED_EXCEL_PATH)) {
    fs.unlinkSync(UNIFIED_EXCEL_PATH);
  }

  initUnifiedExcelFile();
  assert('TimeWise_Late_Entries.xlsx exists', fs.existsSync(UNIFIED_EXCEL_PATH));

  const wb = xlsx.readFile(UNIFIED_EXCEL_PATH);
  assert('Contains exactly 3 sheets', wb.SheetNames.length === 3);
  assert('Contains "2nd Year" sheet', wb.SheetNames.includes('2nd Year'));
  assert('Contains "3rd Year" sheet', wb.SheetNames.includes('3rd Year'));
  assert('Contains "4th Year" sheet', wb.SheetNames.includes('4th Year'));

  // 3. Test Routing Records into Respective Sheets
  console.log('\n--- 3. Testing Automated Sheet Routing on Late Entry ---');

  // Test 4th Year student (A23 series)
  const res4 = await appendLateEntryToExcel({
    rollNumber: 'A23126511092',
    name: 'M. Tanuja',
    branch: 'Information Technology',
    date: '2026-09-20',
    time: '08:45:00'
  });
  assert('A23 student routes to "4th Year" sheet', res4.success && res4.sheetName === '4th Year');

  // Test 3rd Year student (A24 series)
  const res3 = await appendLateEntryToExcel({
    rollNumber: 'A24126511045',
    name: 'R. Keshava',
    branch: 'Computer Science & Engineering',
    date: '2026-09-20',
    time: '08:47:00'
  });
  assert('A24 student routes to "3rd Year" sheet', res3.success && res3.sheetName === '3rd Year');

  // Test 2nd Year student (A25 series)
  const res2 = await appendLateEntryToExcel({
    rollNumber: 'A25126511012',
    name: 'K. Sai Priya',
    branch: 'Electronics & Communication',
    date: '2026-09-20',
    time: '08:50:00'
  });
  assert('A25 student routes to "2nd Year" sheet', res2.success && res2.sheetName === '2nd Year');

  // 4. Verify Content Isolation across the 3 sheets inside the single file
  console.log('\n--- 4. Verifying Cross-Sheet Isolation Inside Single Excel File ---');
  const rows4th = readSheetRows('4th Year');
  const rows3rd = readSheetRows('3rd Year');
  const rows2nd = readSheetRows('2nd Year');

  // 4th Year sheet checks
  assert('"4th Year" sheet contains A23126511092', rows4th.some((r) => r['Roll Number'] === 'A23126511092'));
  assert('"4th Year" sheet does NOT contain A24126511045', !rows4th.some((r) => r['Roll Number'] === 'A24126511045'));
  assert('"4th Year" sheet does NOT contain A25126511012', !rows4th.some((r) => r['Roll Number'] === 'A25126511012'));

  // 3rd Year sheet checks
  assert('"3rd Year" sheet contains A24126511045', rows3rd.some((r) => r['Roll Number'] === 'A24126511045'));
  assert('"3rd Year" sheet does NOT contain A23126511092', !rows3rd.some((r) => r['Roll Number'] === 'A23126511092'));
  assert('"3rd Year" sheet does NOT contain A25126511012', !rows3rd.some((r) => r['Roll Number'] === 'A25126511012'));

  // 2nd Year sheet checks
  assert('"2nd Year" sheet contains A25126511012', rows2nd.some((r) => r['Roll Number'] === 'A25126511012'));
  assert('"2nd Year" sheet does NOT contain A23126511092', !rows2nd.some((r) => r['Roll Number'] === 'A23126511092'));
  assert('"2nd Year" sheet does NOT contain A24126511045', !rows2nd.some((r) => r['Roll Number'] === 'A24126511045'));

  // 5. Verify Exact Required Columns
  console.log('\n--- 5. Verifying Required Columns: Roll Number | Student Name | Branch | Year | Date | Time ---');
  const sampleRow = rows4th[0];
  const requiredKeys = ['Roll Number', 'Student Name', 'Branch', 'Year', 'Date', 'Time'];
  const allKeysPresent = requiredKeys.every((k) => Object.prototype.hasOwnProperty.call(sampleRow, k));
  assert('All 6 columns exist: Roll Number, Student Name, Branch, Year, Date, Time', allKeysPresent);
  assert('Year column value is formatted correctly ("4th Year")', sampleRow['Year'] === '4th Year');

  // 6. Test Duplicate Skipping
  console.log('\n--- 6. Testing Duplicate Entry Skipping ---');
  const dupRes = await appendLateEntryToExcel({
    rollNumber: 'A23126511092',
    name: 'M. Tanuja',
    branch: 'Information Technology',
    date: '2026-09-20',
    time: '08:45:00'
  });
  assert('Duplicate late entry is skipped in sheet', dupRes.skippedDuplicate === true);

  // Summary
  console.log(`\n=== RESULTS: ${passed}/${totalTests} TESTS PASSED ===`);
  if (passed === totalTests) {
    console.log('All Unified Excel (1 file, 3 sheets) tests passed successfully!');
    process.exit(0);
  } else {
    console.error('Some tests failed!');
    process.exit(1);
  }
}

runExcelYearTrackingTests();
