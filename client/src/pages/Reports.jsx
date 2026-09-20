import React, { useState, useEffect, useCallback } from 'react';
import { reportService } from '../services/reportService';
import { departmentService } from '../services/departmentService';
import { useAuth } from '../context/AuthContext';
import Toast from '../components/Toast';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  FileText,
  FileDown,
  Calendar,
  Building2,
  Filter,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  Users,
  Clock,
  Printer
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export default function Reports() {
  const { user } = useAuth();
  const [departments, setDepartments] = useState([]);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [isExportingExcel, setIsExportingExcel] = useState(false);

  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedYear, setSelectedYear] = useState('');

  // Date range presets helper
  const applyPreset = (preset) => {
    const today = new Date();
    const formatDate = (d) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    if (preset === 'today') {
      const t = formatDate(today);
      setStartDate(t);
      setEndDate(t);
    } else if (preset === 'week') {
      const w = new Date(today);
      w.setDate(today.getDate() - 6);
      setStartDate(formatDate(w));
      setEndDate(formatDate(today));
    } else if (preset === 'month') {
      const m = new Date(today);
      m.setDate(today.getDate() - 29);
      setStartDate(formatDate(m));
      setEndDate(formatDate(today));
    } else if (preset === 'all') {
      setStartDate('');
      setEndDate('');
    }
  };

  const fetchDepartments = useCallback(async () => {
    try {
      const res = await departmentService.getDepartments();
      setDepartments(res.departments || []);
    } catch {
      // ignore
    }
  }, []);

  const generateReport = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        department: selectedDept || undefined,
        year: selectedYear || undefined
      };
      const res = await reportService.getReportData(params);
      setReportData(res);
      setToast({
        type: 'success',
        message: `Report generated: ${res.count} records loaded`
      });
    } catch (err) {
      setToast({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, selectedDept, selectedYear]);

  useEffect(() => {
    fetchDepartments();
    // Default to last 7 days on initial load
    applyPreset('week');
  }, [fetchDepartments]);

  useEffect(() => {
    generateReport();
  }, [startDate, endDate, selectedDept, selectedYear, generateReport]);

  // Export PDF Handler
  const exportPDF = () => {
    if (!reportData || reportData.rows.length === 0) {
      setToast({ type: 'warning', message: 'No records available to export as PDF.' });
      return;
    }

    try {
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const meta = reportData.metadata;

      // Header Banner
      doc.setFillColor(30, 41, 59); // slate-800
      doc.rect(0, 0, 297, 28, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(meta.institutionName.toUpperCase(), 14, 12);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(199, 210, 254);
      doc.text('TimeWise Smart Gate Barcode Attendance & Punctuality Audit Report', 14, 18);

      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(`Generated: ${new Date().toLocaleString()} by ${meta.generatedBy}`, 14, 24);

      // Summary Stats Box
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(14, 32, 269, 14, 2, 2, 'F');
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(`Total Late Records: ${meta.summary.totalLateEntries}`, 18, 41);
      doc.text(`Unique Students: ${meta.summary.uniqueStudentsCount}`, 80, 41);
      doc.text(`Department: ${meta.filters.department}`, 140, 41);
      doc.text(`Date Range: ${meta.filters.startDate} to ${meta.filters.endDate}`, 200, 41);

      // Table columns & rows
      const tableHeaders = [
        ['#', 'Student Name', 'Roll No', 'Barcode', 'Dept', 'Year', 'Date', 'Time', 'Session', 'Reason', 'Recorded By']
      ];

      const tableRows = reportData.rows.map((r, i) => [
        i + 1,
        r.studentName,
        r.rollNumber,
        r.studentId,
        r.department,
        r.year,
        r.date,
        r.time,
        r.session,
        r.reason,
        r.recordedBy
      ]);

      autoTable(doc, {
        head: tableHeaders,
        body: tableRows,
        startY: 50,
        theme: 'grid',
        styles: {
          fontSize: 8,
          cellPadding: 2,
          overflow: 'linebreak',
          font: 'helvetica'
        },
        headStyles: {
          fillColor: [79, 70, 229], // indigo-600
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252]
        },
        margin: { left: 14, right: 14 }
      });

      doc.save(`TimeWise_Late_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
      setToast({ type: 'success', message: 'PDF report downloaded successfully!' });
    } catch (err) {
      console.error(err);
      setToast({ type: 'error', message: `Failed to export PDF: ${err.message}` });
    }
  };

  // Export Excel Handler
  // Single Excel Export: downloads TimeWise_Late_Entries.xlsx with 3 separate sheets (2nd Year, 3rd Year, 4th Year)
  const exportExcel = async () => {
    setIsExportingExcel(true);
    try {
      // 1. Download live unified Excel file with 3 sheets from server
      await reportService.downloadUnifiedExcel();
      setToast({
        type: 'success',
        message: 'TimeWise_Late_Entries.xlsx (3 Year Sheets) downloaded successfully!'
      });
    } catch (err) {
      console.warn('Server Excel download failed, generating client-side workbook with 3 sheets:', err);

      try {
        const rowsToProcess = reportData?.rows || [];
        const wb = XLSX.utils.book_new();

        // 3 Separate Sheets: 2nd Year (A25), 3rd Year (A24), 4th Year (A23)
        const yearConfig = [
          {
            sheet: '2nd Year',
            test: (r) => /^A?25/i.test(r.rollNumber || '') || r.year === 'Year 2' || r.year === 2,
            label: '2nd Year'
          },
          {
            sheet: '3rd Year',
            test: (r) => /^A?24/i.test(r.rollNumber || '') || r.year === 'Year 3' || r.year === 3,
            label: '3rd Year'
          },
          {
            sheet: '4th Year',
            test: (r) => /^A?23/i.test(r.rollNumber || '') || r.year === 'Year 4' || r.year === 4,
            label: '4th Year'
          }
        ];

        yearConfig.forEach(({ sheet, test, label }) => {
          const sheetRows = rowsToProcess
            .filter(test)
            .map((r) => ({
              'Roll Number': r.rollNumber || r.studentId || '',
              'Student Name': r.studentName || '',
              'Branch': r.departmentFull || r.department || 'General',
              'Year': label,
              'Date': r.date || '',
              'Time': r.time || ''
            }));

          const ws = XLSX.utils.json_to_sheet(sheetRows, {
            header: ['Roll Number', 'Student Name', 'Branch', 'Year', 'Date', 'Time']
          });
          ws['!cols'] = [
            { wch: 20 },
            { wch: 28 },
            { wch: 32 },
            { wch: 14 },
            { wch: 14 },
            { wch: 12 }
          ];
          XLSX.utils.book_append_sheet(wb, ws, sheet);
        });

        XLSX.writeFile(wb, 'TimeWise_Late_Entries.xlsx');
        setToast({
          type: 'success',
          message: 'TimeWise_Late_Entries.xlsx downloaded successfully!'
        });
      } catch (clientErr) {
        setToast({ type: 'error', message: `Failed to export Excel: ${clientErr.message}` });
      }
    } finally {
      setIsExportingExcel(false);
    }
  };

  const rows = reportData?.rows || [];
  const meta = reportData?.metadata || {};

  return (
    <div className="space-y-6">
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Punctuality Reports & Export
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit-grade reporting with institutional header, filters, and PDF & Excel exports
          </p>
        </div>

        {/* Action Export Buttons - Single Excel Export */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={exportPDF}
            disabled={rows.length === 0}
            className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md shadow-rose-600/20 transition disabled:opacity-50 active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>Download PDF</span>
          </button>
          <button
            onClick={exportExcel}
            disabled={isExportingExcel}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md shadow-emerald-600/20 transition disabled:opacity-50 active:scale-95"
            title="Download TimeWise_Late_Entries.xlsx with 3 year-wise sheets"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>{isExportingExcel ? 'Exporting...' : 'Export Excel'}</span>
          </button>
        </div>
      </div>

      {/* Report Filter Controls */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
        {/* Quick Presets */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <Calendar className="w-4 h-4 text-indigo-500" />
            <span>Date Range Presets:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[
              { label: 'Today', key: 'today' },
              { label: 'Last 7 Days', key: 'week' },
              { label: 'Last 30 Days', key: 'month' },
              { label: 'All Time', key: 'all' }
            ].map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => applyPreset(p.key)}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 border border-slate-200 transition"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Detailed Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Department
            </label>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.code} - {d.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Study Year
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Years</option>
              <option value="1">Year 1</option>
              <option value="2">Year 2</option>
              <option value="3">Year 3</option>
              <option value="4">Year 4</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary KPI Strip */}
      {meta.summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-2xs">
            <span className="text-[11px] text-slate-400 font-semibold block uppercase">
              Total Filtered Records
            </span>
            <span className="text-xl font-black text-slate-900">
              {meta.summary.totalLateEntries}
            </span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-2xs">
            <span className="text-[11px] text-slate-400 font-semibold block uppercase">
              Unique Students
            </span>
            <span className="text-xl font-black text-indigo-600">
              {meta.summary.uniqueStudentsCount}
            </span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-2xs">
            <span className="text-[11px] text-slate-400 font-semibold block uppercase">
              Selected Branch
            </span>
            <span className="text-xs font-bold text-slate-800 truncate block">
              {meta.filters?.department}
            </span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-2xs">
            <span className="text-[11px] text-slate-400 font-semibold block uppercase">
              Audit Date Scope
            </span>
            <span className="text-xs font-mono font-semibold text-slate-700 truncate block">
              {meta.filters?.startDate} → {meta.filters?.endDate}
            </span>
          </div>
        </div>
      )}

      {/* Report Preview Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Live Audit Report Preview
            </h3>
            <p className="text-[11px] text-slate-400">
              Institutional late entry data structured for official printouts and review
            </p>
          </div>

          <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
            {rows.length} Entries
          </span>
        </div>

        {loading ? (
          <div className="py-16">
            <LoadingSpinner message="Generating report data..." />
          </div>
        ) : rows.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <FileText className="w-12 h-12 mx-auto text-slate-300 mb-2" />
            <h3 className="text-sm font-bold text-slate-700">No Late Records Found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Try adjusting the date range or department filter to include broader dates.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4 w-12">#</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Roll Number</th>
                  <th className="py-3 px-4">Dept</th>
                  <th className="py-3 px-4">Class</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Time</th>
                  <th className="py-3 px-4">Session</th>
                  <th className="py-3 px-4">Reason Cited</th>
                  <th className="py-3 px-4">Gate Staff</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {rows.map((row) => (
                  <tr key={row.slNo} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 text-slate-400">{row.slNo}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {row.studentName}
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-slate-700">
                      {row.rollNumber}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold text-[11px] border border-indigo-100">
                        {row.department}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{row.year}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{row.date}</td>
                    <td className="py-3 px-4 font-mono text-indigo-600 font-bold">
                      {row.time}
                    </td>
                    <td className="py-3 px-4 uppercase text-[10px] font-bold text-slate-500">
                      {row.session}
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-[150px] truncate">
                      {row.reason}
                    </td>
                    <td className="py-3 px-4 text-slate-500">{row.recordedBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
