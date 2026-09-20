import React, { useState } from 'react';
import { studentService } from '../services/studentService';
import { lateEntryService } from '../services/lateEntryService';
import BarcodeScanner from '../components/BarcodeScanner';
import BarcodeBadge from '../components/BarcodeBadge';
import Toast from '../components/Toast';
import {
  ScanLine,
  CheckCircle2,
  AlertTriangle,
  Clock,
  User,
  Building2,
  GraduationCap,
  Calendar,
  RotateCcw,
  Send,
  AlertCircle,
  FileCheck,
  ShieldCheck,
  CreditCard
} from 'lucide-react';

export default function ScanBarcode() {
  const [scannedRegNo, setScannedRegNo] = useState('');
  const [studentData, setStudentData] = useState(null);
  const [todayLateStatus, setTodayLateStatus] = useState(null);
  const [historySummary, setHistorySummary] = useState(null);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Late entry form fields (Standardized to Morning Session)
  const [reason, setReason] = useState('Traffic Congestion');
  const session = 'morning';
  const [remarks, setRemarks] = useState('');

  // Recorded success state
  const [recordedSuccess, setRecordedSuccess] = useState(null);
  const [toast, setToast] = useState(null);

  // Reason options
  const reasonOptions = [
    'Traffic Congestion',
    'Bus / Transit Delay',
    'Weather Conditions',
    'Medical / Health',
    'Overslept',
    'Personal / Family',
    'Other'
  ];

  // Lookup student upon ID card OCR detection
  const handleRegNoScanned = async (regNo) => {
    if (!regNo) return;
    const cleanCode = regNo.trim().toUpperCase();
    setScannedRegNo(cleanCode);
    setRecordedSuccess(null);
    setIsLookingUp(true);
    setToast(null);

    try {
      // Searches student by Registration Number / Student ID / Roll Number
      const res = await studentService.getStudentByBarcode(cleanCode);
      setStudentData(res.student);
      setTodayLateStatus(res.todayLateStatus);
      setHistorySummary(res.historySummary);

      if (res.todayLateStatus?.alreadyMarked) {
        setToast({
          type: 'warning',
          message: `Notice: ${res.student.name} is already marked late for today.`
        });
      } else {
        setToast({
          type: 'success',
          message: `Identified: ${res.student.name} (Regd: ${res.student.studentId || res.student.rollNumber})`
        });
      }
    } catch (err) {
      setStudentData(null);
      setTodayLateStatus(null);
      setToast({
        type: 'error',
        message: err.message || `No registered student found matching Regd. No: ${cleanCode}`
      });
    } finally {
      setIsLookingUp(false);
    }
  };

  // Submit and confirm late entry
  const handleRecordLateEntry = async (e) => {
    e.preventDefault();
    if (!studentData) return;

    setIsSubmitting(true);
    setToast(null);

    try {
      const res = await lateEntryService.createLateEntry({
        barcode: studentData.barcode,
        studentId: studentData._id,
        reason,
        session,
        remarks
      });

      setRecordedSuccess(res);
      setToast({
        type: 'success',
        message: `Late entry recorded successfully at ${res.lateEntry.time}`
      });
    } catch (err) {
      setToast({
        type: 'error',
        message: err.message || 'Failed to record late entry'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset and prepare for next student (camera remains continuously streaming in background)
  const handleScanNext = () => {
    setScannedRegNo('');
    setStudentData(null);
    setTodayLateStatus(null);
    setHistorySummary(null);
    setRecordedSuccess(null);
    setRemarks('');
    setReason('Traffic Congestion');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-100 mb-1">
            <ScanLine className="w-3.5 h-3.5" />
            <span>ID Card OCR Scanner Terminal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Scan Student ID Card
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Align the front side of the student ID card to read the Registration Number (Regd. No) via OCR.
          </p>
        </div>

        {studentData && (
          <button
            onClick={handleScanNext}
            className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-2.5 rounded-xl transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Scan Next Student</span>
          </button>
        )}
      </div>

      {/* Main Scanner Section - Kept permanently mounted so camera stream stays continuously active */}
      <div className={`space-y-4 ${studentData || recordedSuccess ? 'hidden' : 'block'}`}>
        <BarcodeScanner
          onScanSuccess={handleRegNoScanned}
          isProcessing={isLookingUp || !!studentData}
        />
      </div>

      {/* Student Details & Late Entry Confirmation */}
      {studentData && !recordedSuccess && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md overflow-hidden animate-in fade-in-50 duration-200">
          {/* Top Status Strip */}
          <div
            className={`px-6 py-3 flex items-center justify-between text-xs font-bold border-b ${
              todayLateStatus?.alreadyMarked
                ? 'bg-amber-50 text-amber-800 border-amber-200'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {todayLateStatus?.alreadyMarked ? (
                <>
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>
                    Duplicate Notice: Marked late today at{' '}
                    {todayLateStatus.entries?.[0]?.time || 'earlier today'}
                  </span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Student Verified via OCR • Ready to Record Late Entry</span>
                </>
              )}
            </div>

            <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-800">
              Regd: {studentData.studentId || studentData.rollNumber}
            </span>
          </div>

          <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Left Col: Student Profile Card */}
            <div className="md:col-span-5 flex flex-col items-center text-center p-6 bg-slate-50/80 rounded-2xl border border-slate-100">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center font-black text-2xl shadow-lg shadow-indigo-600/20 mb-3">
                {studentData.name.charAt(0)}
              </div>

              <h2 className="text-lg font-black text-slate-900">{studentData.name}</h2>
              <p className="text-xs font-mono font-bold text-indigo-600 mt-0.5">
                Regd. No: {studentData.studentId || studentData.rollNumber}
              </p>

              {/* Details table */}
              <div className="w-full text-xs space-y-2 mt-4 pt-3 border-t border-slate-200/80 text-left">
                <div className="flex justify-between">
                  <span className="text-slate-400">Department:</span>
                  <span className="font-bold text-slate-800">
                    {studentData.department?.code} ({studentData.department?.name})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Class & Section:</span>
                  <span className="font-bold text-slate-800">
                    Year {studentData.year} - Sec {studentData.section}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Roll Number:</span>
                  <span className="font-mono font-semibold text-slate-700">
                    {studentData.rollNumber}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Past Late:</span>
                  <span className="font-bold text-rose-600">
                    {historySummary?.totalLateCount ?? 0} entries
                  </span>
                </div>
              </div>
            </div>

            {/* Right Col: Late Entry Submission Form */}
            <div className="md:col-span-7 flex flex-col justify-between">
              <form onSubmit={handleRecordLateEntry} className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 mb-1">
                    Record Late Entry Information
                  </h3>
                  <p className="text-xs text-slate-400">
                    Server will automatically capture the official gate timestamp.
                  </p>
                </div>


                {/* Late Reason */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Reason Cited by Student
                  </label>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  >
                    {reasonOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Remarks */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Staff Remarks / Note (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="e.g. Bus No. 12 arrived late; 1st warning issued"
                    className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Action Buttons */}
                <div className="pt-2 flex flex-col sm:flex-row gap-3">
                  <button
                    type="submit"
                    disabled={isSubmitting || todayLateStatus?.alreadyMarked}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2 text-sm disabled:opacity-50 active:scale-[0.98]"
                  >
                    {isSubmitting ? (
                      <span>Recording timestamp...</span>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Confirm & Record Late Entry</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleScanNext}
                    className="py-3 px-4 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                  >
                    Cancel
                  </button>
                </div>

                {todayLateStatus?.alreadyMarked && (
                  <p className="text-[11px] text-amber-700 text-center font-medium">
                    Duplicate entry prevented: This student already has a recorded entry for today.
                  </p>
                )}
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Success Confirmation Card */}
      {recordedSuccess && (
        <div className="bg-white rounded-3xl border border-emerald-200 shadow-xl overflow-hidden p-6 sm:p-8 text-center animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4 border-2 border-emerald-300">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
            Late Entry Confirmed
          </span>
          <h2 className="text-2xl font-black text-slate-900 mt-1">
            {recordedSuccess.lateEntry?.student?.name}
          </h2>
          <p className="text-xs text-slate-500 font-mono mt-0.5">
            Regd. No: {recordedSuccess.lateEntry?.student?.studentId || recordedSuccess.lateEntry?.student?.rollNumber}
          </p>

          {/* Authoritative Server Timestamp Banner */}
          <div className="my-6 p-4 bg-slate-50 rounded-2xl border border-slate-200/80 inline-block max-w-md w-full">
            <div className="grid grid-cols-2 gap-4 text-left text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Server Date:</span>
                <span className="font-bold text-slate-800 text-sm">
                  {recordedSuccess.lateEntry?.date}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Server Timestamp:</span>
                <span className="font-mono font-bold text-indigo-600 text-sm">
                  {recordedSuccess.lateEntry?.time}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Session:</span>
                <span className="font-bold text-slate-800">
                  Morning Session
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Reason:</span>
                <span className="font-bold text-slate-800 truncate">
                  {recordedSuccess.lateEntry?.reason}
                </span>
              </div>
            </div>
          </div>

          <div>
            <button
              onClick={handleScanNext}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-indigo-600/30 transition text-sm inline-flex items-center gap-2 active:scale-95"
            >
              <ScanLine className="w-4 h-4" />
              <span>Scan Next Student ID Card</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
