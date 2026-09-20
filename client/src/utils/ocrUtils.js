/**
 * Utility functions for ID Card Optical Character Recognition (OCR)
 * and Registration Number extraction.
 */

/**
 * Normalizes common OCR character confusions in the numeric portion of a registration number.
 * e.g., 'A23I26511O92' -> 'A23126511092'
 */
/**
 * Normalizes common OCR character confusions in the registration number.
 * e.g., 'A23I26511O92' -> 'A23126511092'
 *       '423126511092' -> 'A23126511092' (where 'A' was misread as '4')
 */
export function cleanRegNoCandidate(raw) {
  if (!raw) return '';
  let code = raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');

  // If OCR misread initial 'A' as '4' for standard 11-13 char ID (e.g. '423126511092')
  if (/^4\d{10,12}$/.test(code)) {
    code = 'A' + code.slice(1);
  }

  // If format is 1 letter followed by 10-12 alphanumeric characters
  if (/^[A-Z][A-Z0-9]{10,12}$/.test(code)) {
    const prefix = code[0];
    let numPart = code.slice(1);
    numPart = numPart
      .replace(/[OQD]/g, '0')
      .replace(/[IL|!]/g, '1')
      .replace(/[Z]/g, '2')
      .replace(/[S$]/g, '5')
      .replace(/[Gb]/g, '6')
      .replace(/[T/]/g, '7')
      .replace(/[B]/g, '8');
    if (/^\d{10,12}$/.test(numPart)) {
      return prefix + numPart;
    }
  }

  // If format is 2 letters followed by 9-11 digits (e.g. 'ST2312651109')
  if (/^[A-Z]{2}[A-Z0-9]{9,11}$/.test(code)) {
    const prefix = code.slice(0, 2);
    let numPart = code.slice(2);
    numPart = numPart
      .replace(/[OQD]/g, '0')
      .replace(/[IL|!]/g, '1')
      .replace(/[Z]/g, '2')
      .replace(/[S$]/g, '5')
      .replace(/[Gb]/g, '6')
      .replace(/[T/]/g, '7')
      .replace(/[B]/g, '8');
    if (/^\d{9,11}$/.test(numPart)) {
      return prefix + numPart;
    }
  }

  return code;
}

/**
 * Validates whether the extracted string matches a valid Registration Number format.
 * Strictly rejects pure 10-digit mobile numbers or 12-digit Aadhaar numbers.
 */
export function isValidRegNo(code) {
  if (!code || code.length < 6 || code.length > 16) return false;
  // Strictly reject pure 10-digit mobile or 12-digit Aadhaar numbers
  if (/^\d{10,12}$/.test(code)) return false;
  // Must be alphanumeric
  return /^[A-Z0-9]+$/.test(code);
}

/**
 * Extracts student Registration Number from OCR text.
 * Targets "Regd. No : A23126511092" or standard college registration formats.
 * Strictly ignores Aadhaar, phone numbers, and arbitrary labels.
 */
export function parseRegdNumber(text) {
  if (!text) return null;

  // Normalize multi-spaces and clean lines
  const normalizedText = text.replace(/\r/g, '\n');

  // 1. First Priority: Look for explicitly labeled Registration Number
  // Handles: Regd. No : A23126511092, Regd No: A2312 6511 092, H.T. No, PIN No, Roll No, etc.
  // Note: [ \t] prevents matching across newlines into "Name" or "DOB" lines
  const labelRegex = /(?:Regd?\.?\s*No\.?|Registration\s*No\.?|Reg\s*No\.?|Roll\s*No\.?|H\.?T\.?\s*No\.?|Hall\s*Ticket\s*No\.?|PIN\s*No\.?|Student\s*ID|ID\s*No\.?)[ \t]*[:\-\.][ \t]*([A-Za-z0-9][A-Za-z0-9 \t]{7,14})/i;
  const labelMatch = normalizedText.match(labelRegex);
  if (labelMatch && labelMatch[1]) {
    const candidate = labelMatch[1].trim().split(/[\r\n\t ]{2,}|\n|\r/)[0];
    const cleaned = cleanRegNoCandidate(candidate);
    if (isValidRegNo(cleaned)) return cleaned;
  }

  // 2. Second Priority: College ID standard pattern allowing internal optical spaces
  // e.g., A23126511092, A2312 6511092, A25126511174
  const formatMatches = normalizedText.match(/\b([A-Za-z]\s*[A-Za-z0-9\s]{10,15})\b/g);
  if (formatMatches && formatMatches.length > 0) {
    for (const cand of formatMatches) {
      const cleaned = cleanRegNoCandidate(cand);
      if (/^[A-Z]\d{10,12}$/.test(cleaned) && isValidRegNo(cleaned)) {
        return cleaned;
      }
    }
  }

  // 3. Third Priority: Standalone token matching registration format
  const words = normalizedText.split(/[\s,;|:]+/);
  for (const word of words) {
    const trimmed = word.trim();
    if (!trimmed || /^\d{10,12}$/.test(trimmed)) continue; // skip pure phone / Aadhaar
    const cleaned = cleanRegNoCandidate(trimmed);
    if (/^[A-Z]\d{10,12}$/.test(cleaned) && isValidRegNo(cleaned)) {
      return cleaned;
    }
  }

  return null;
}
