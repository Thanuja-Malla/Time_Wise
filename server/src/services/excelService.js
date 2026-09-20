const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

// File and Directory paths
const RECORDS_DIR = path.join(__dirname, '../../records');
const UNIFIED_EXCEL_FILENAME = 'TimeWise_Late_Entries.xlsx';
const UNIFIED_EXCEL_PATH = path.join(RECORDS_DIR, UNIFIED_EXCEL_FILENAME);

// 3 Year-wise sheet names
const SHEET_NAMES = {
  2: '2nd Year',
  3: '3rd Year',
  4: '4th Year'
};

const ORDERED_SHEETS = ['2nd Year', '3rd Year', '4th Year'];

// Required columns: Roll Number | Student Name | Branch | Year | Date | Time
const EXCEL_HEADERS = ['Roll Number', 'Student Name', 'Branch', 'Year', 'Date', 'Time'];

const COLUMN_WIDTHS = [
  { wch: 20 }, // Roll Number
  { wch: 28 }, // Student Name
  { wch: 32 }, // Branch
  { wch: 14 }, // Year
  { wch: 14 }, // Date
  { wch: 12 }  // Time
];

/**
 * Ensures the records directory exists
 */
const ensureRecordsDir = () => {
  if (!fs.existsSync(RECORDS_DIR)) {
    fs.mkdirSync(RECORDS_DIR, { recursive: true });
  }
};

/**
 * Returns the absolute path of the single TimeWise_Late_Entries.xlsx file
 */
const getUnifiedExcelPath = () => {
  ensureRecordsDir();
  return UNIFIED_EXCEL_PATH;
};

/**
 * Identifies the student's academic year based on the roll number series pattern.
 * Pattern Rules:
 *   - A23 series (e.g. A23126511001) -> 4th Year (4th Year sheet)
 *   - A24 series (e.g. A24126511001) -> 3rd Year (3rd Year sheet)
 *   - A25 series (e.g. A25126511001) -> 2nd Year (2nd Year sheet)
 * Fallback:
 *   - Uses student.year if roll number doesn't match A23/A24/A25
 *   - Returns null if year is not 2, 3, or 4 (prevents adding to wrong sheet)
 */
const determineYearFromRoll = (rollNumber, studentYear = null) => {
  const cleanRoll = String(rollNumber || '').trim().toUpperCase();

  // 1. Primary rule: Identify from roll number pattern
  if (/^A?23/i.test(cleanRoll)) return 4;
  if (/^A?24/i.test(cleanRoll)) return 3;
  if (/^A?25/i.test(cleanRoll)) return 2;

  // 2. Secondary fallback: Check student database year
  const numYear = Number(studentYear);
  if (numYear === 4) return 4;
  if (numYear === 3) return 3;
  if (numYear === 2) return 2;

  return null;
};

/**
 * Formats a sheet with headers and column widths
 */
const createEmptyYearSheet = () => {
  const ws = xlsx.utils.aoa_to_sheet([EXCEL_HEADERS]);
  ws['!cols'] = COLUMN_WIDTHS;
  return ws;
};

/**
 * Initializes the single TimeWise_Late_Entries.xlsx file with the 3 separate sheets
 */
const initUnifiedExcelFile = () => {
  ensureRecordsDir();

  if (!fs.existsSync(UNIFIED_EXCEL_PATH)) {
    const wb = xlsx.utils.book_new();

    ORDERED_SHEETS.forEach((sheetName) => {
      const ws = createEmptyYearSheet();
      xlsx.utils.book_append_sheet(wb, ws, sheetName);
    });

    xlsx.writeFile(wb, UNIFIED_EXCEL_PATH);
    console.log(`[ExcelService] Initialized unified Excel file with 3 sheets: ${UNIFIED_EXCEL_FILENAME}`);
  } else {
    // Ensure all 3 sheets exist inside existing file
    try {
      const wb = xlsx.readFile(UNIFIED_EXCEL_PATH);
      let updated = false;

      ORDERED_SHEETS.forEach((sheetName) => {
        if (!wb.Sheets[sheetName]) {
          const ws = createEmptyYearSheet();
          xlsx.utils.book_append_sheet(wb, ws, sheetName);
          updated = true;
        }
      });

      if (updated) {
        xlsx.writeFile(wb, UNIFIED_EXCEL_PATH);
        console.log(`[ExcelService] Updated missing sheets in: ${UNIFIED_EXCEL_FILENAME}`);
      }
    } catch (err) {
      console.error('[ExcelService] Error checking existing unified Excel file:', err.message);
    }
  }
};

/**
 * Reads existing rows from a specific sheet in TimeWise_Late_Entries.xlsx
 */
const readSheetRows = (sheetName) => {
  if (!fs.existsSync(UNIFIED_EXCEL_PATH)) return [];
  try {
    const wb = xlsx.readFile(UNIFIED_EXCEL_PATH);
    const ws = wb.Sheets[sheetName];
    if (!ws) return [];
    return xlsx.utils.sheet_to_json(ws, { defval: '' });
  } catch (err) {
    console.error(`[ExcelService] Error reading sheet "${sheetName}":`, err.message);
    return [];
  }
};

/**
 * Appends a late-entry record to the corresponding sheet inside TimeWise_Late_Entries.xlsx.
 * Automatically routes to "2nd Year", "3rd Year", or "4th Year" sheet based on roll number.
 *
 * @param {Object} data
 * @param {string} data.rollNumber - Student's roll number / registration number
 * @param {string} data.name - Student full name
 * @param {string} data.branch - Department / Branch name
 * @param {string} data.date - Entry date YYYY-MM-DD
 * @param {string} data.time - Entry time HH:mm:ss
 * @param {number} [data.year] - Fallback student year
 */
const appendLateEntryToExcel = async ({ rollNumber, name, branch, date, time, year = null }) => {
  ensureRecordsDir();

  // Identify academic year from roll number pattern
  const targetYear = determineYearFromRoll(rollNumber, year);

  if (!targetYear || !SHEET_NAMES[targetYear]) {
    console.warn(`[ExcelService] Skip: Roll ${rollNumber} does not match 2nd (A25), 3rd (A24), or 4th (A23) year series`);
    return {
      success: false,
      reason: 'unmatched_year',
      message: `Roll ${rollNumber} does not match 2nd, 3rd, or 4th year series`
    };
  }

  const targetSheetName = SHEET_NAMES[targetYear];

  try {
    initUnifiedExcelFile();

    const wb = xlsx.readFile(UNIFIED_EXCEL_PATH);

    // Ensure all 3 sheets exist
    ORDERED_SHEETS.forEach((sName) => {
      if (!wb.Sheets[sName]) {
        xlsx.utils.book_append_sheet(wb, createEmptyYearSheet(), sName);
      }
    });

    const currentWs = wb.Sheets[targetSheetName];
    let rows = currentWs ? xlsx.utils.sheet_to_json(currentWs, { defval: '' }) : [];

    // Duplicate check: avoid adding same roll number on same date and time
    const isDuplicate = rows.some((r) => {
      const existingRoll = String(r['Roll Number'] || '').trim().toUpperCase();
      const newRoll = String(rollNumber || '').trim().toUpperCase();
      return (
        existingRoll === newRoll &&
        String(r['Date']).trim() === String(date).trim() &&
        String(r['Time']).trim() === String(time).trim()
      );
    });

    if (isDuplicate) {
      return {
        success: true,
        year: targetYear,
        sheetName: targetSheetName,
        skippedDuplicate: true,
        message: `Record already exists in sheet "${targetSheetName}"`
      };
    }

    // Format Year label (e.g., "4th Year", "3rd Year", "2nd Year")
    const yearLabel = `${targetYear === 2 ? '2nd' : targetYear === 3 ? '3rd' : '4th'} Year`;

    // Append new record
    rows.push({
      'Roll Number': String(rollNumber || '').trim().toUpperCase(),
      'Student Name': String(name || '').trim(),
      'Branch': String(branch || '').trim(),
      'Year': yearLabel,
      'Date': String(date || '').trim(),
      'Time': String(time || '').trim()
    });

    // Update target worksheet
    const updatedWs = xlsx.utils.json_to_sheet(rows, { header: EXCEL_HEADERS });
    updatedWs['!cols'] = COLUMN_WIDTHS;
    wb.Sheets[targetSheetName] = updatedWs;

    // Save updated workbook
    xlsx.writeFile(wb, UNIFIED_EXCEL_PATH);

    console.log(`[ExcelService] ✓ Added late entry for ${rollNumber} (${name}) into sheet "${targetSheetName}" of ${UNIFIED_EXCEL_FILENAME}`);

    return {
      success: true,
      year: targetYear,
      sheetName: targetSheetName,
      filename: UNIFIED_EXCEL_FILENAME,
      filePath: UNIFIED_EXCEL_PATH
    };
  } catch (err) {
    console.error(`[ExcelService] Failed to append late entry to ${UNIFIED_EXCEL_FILENAME}:`, err.message);
    return {
      success: false,
      error: err.message
    };
  }
};

/**
 * Synchronizes all existing late entries from MongoDB into TimeWise_Late_Entries.xlsx across the 3 sheets
 */
const syncAllExistingLateEntries = async (LateEntryModel) => {
  if (!LateEntryModel) return 0;

  try {
    initUnifiedExcelFile();
    const allEntries = await LateEntryModel.find({})
      .populate('student', 'name rollNumber studentId year')
      .populate('department', 'name code')
      .sort({ timestamp: 1 });

    let count = 0;
    for (const entry of allEntries) {
      const student = entry.student;
      if (!student) continue;

      const roll = student.rollNumber || student.studentId || entry.barcode;
      const branch = entry.department?.name || entry.department?.code || 'General';

      const res = await appendLateEntryToExcel({
        rollNumber: roll,
        name: student.name,
        branch,
        date: entry.date,
        time: entry.time,
        year: student.year
      });

      if (res.success && !res.skippedDuplicate) count++;
    }

    console.log(`[ExcelService] Synced ${count} historical late entries into ${UNIFIED_EXCEL_FILENAME} (3 sheets)`);
    return count;
  } catch (err) {
    console.error('[ExcelService] Error syncing historical late entries:', err.message);
    return 0;
  }
};

module.exports = {
  UNIFIED_EXCEL_FILENAME,
  UNIFIED_EXCEL_PATH,
  SHEET_NAMES,
  ORDERED_SHEETS,
  EXCEL_HEADERS,
  RECORDS_DIR,
  getUnifiedExcelPath,
  determineYearFromRoll,
  initUnifiedExcelFile,
  appendLateEntryToExcel,
  syncAllExistingLateEntries,
  readSheetRows
};
