import React, { useState, useEffect, useCallback } from 'react';
import { lateEntryService } from '../services/lateEntryService';
import { departmentService } from '../services/departmentService';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import LoadingSpinner from '../components/LoadingSpinner';
import BarcodeBadge from '../components/BarcodeBadge';
import {
  Clock,
  Search,
  Filter,
  Calendar,
  Building2,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  FileDown,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function LateEntries() {
  const { isAdmin } = useAuth();
  const [entries, setEntries] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [toast, setToast] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modals
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const fetchDepartments = useCallback(async () => {
    try {
      const res = await departmentService.getDepartments();
      setDepartments(res.departments || []);
    } catch {
      // ignore
    }
  }, []);

  const fetchEntries = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 15,
        search: search.trim() || undefined,
        department: selectedDept || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined
      };

      const res = await lateEntryService.getLateEntries(params);
      setEntries(res.lateEntries || []);
      setTotal(res.total || 0);
      setTotalPages(res.totalPages || 1);
    } catch (err) {
      setToast({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  }, [page, search, selectedDept, startDate, endDate]);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchEntries();
  };

  const resetFilters = () => {
    setSearch('');
    setSelectedDept('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await lateEntryService.deleteLateEntry(deleteConfirmId);
      setToast({ type: 'success', message: 'Late entry record removed successfully' });
      setDeleteConfirmId(null);
      fetchEntries();
    } catch (err) {
      setToast({ type: 'error', message: err.message });
    }
  };

  return (
    <div className="space-y-6">
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Late Entry Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit logs and records of all student late arrivals ({total} total records)
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/reports"
            className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold px-4 py-2.5 rounded-xl border border-slate-200 shadow-2xs transition"
          >
            <FileDown className="w-4 h-4 text-slate-500" />
            <span>Reports & Exports</span>
          </Link>
          <Link
            to="/scan"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md shadow-indigo-600/20 transition"
          >
            <Clock className="w-4 h-4" />
            <span>Scan New Arrival</span>
          </Link>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-3">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Query */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search student, roll no, barcode..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>

          {/* Department Filter */}
          <div>
            <select
              value={selectedDept}
              onChange={(e) => {
                setSelectedDept(e.target.value);
                setPage(1);
              }}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.code} - {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              title="Start Date"
            />
          </div>

          {/* End Date & Reset */}
          <div className="flex gap-2">
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              className="flex-1 py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              title="End Date"
            />

            {(search || selectedDept || startDate || endDate) && (
              <button
                type="button"
                onClick={resetFilters}
                title="Reset Filters"
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Late Entries Data Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16">
            <LoadingSpinner message="Fetching late entries..." />
          </div>
        ) : entries.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <Clock className="w-12 h-12 mx-auto text-slate-300 mb-2" />
            <h3 className="text-sm font-bold text-slate-700">No Late Entries Found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              No arrival records match your selected search criteria or date filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-4">Student</th>
                  <th className="py-3.5 px-4">Roll Number</th>
                  <th className="py-3.5 px-4">Department</th>
                  <th className="py-3.5 px-4">Date & Time</th>
                  <th className="py-3.5 px-4">Session</th>
                  <th className="py-3.5 px-4">Reason</th>
                  <th className="py-3.5 px-4">Recorded By</th>
                  <th className="py-3.5 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {entries.map((entry) => (
                  <tr key={entry._id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{entry.student?.name || 'Unknown'}</div>
                      <div className="text-[10px] font-mono text-slate-400">
                        {entry.barcode}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-700">
                      {entry.student?.rollNumber || 'N/A'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold text-[11px] border border-indigo-100">
                        {entry.department?.code || 'N/A'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-800">{entry.date}</div>
                      <div className="font-mono text-[11px] text-indigo-600 font-bold">
                        {entry.time}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                        Morning
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-[150px] truncate">
                      {entry.reason}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {entry.recordedBy?.name || 'Staff'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setSelectedEntry(entry)}
                          title="View Record Details"
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => setDeleteConfirmId(entry._id)}
                            title="Delete Record (Admin)"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing Page <span className="font-bold text-slate-800">{page}</span> of{' '}
              <span className="font-bold text-slate-800">{totalPages}</span>
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Record Details Modal */}
      <Modal
        isOpen={!!selectedEntry}
        onClose={() => setSelectedEntry(null)}
        title="Late Entry Record Details"
        subtitle={`Audit ID: ${selectedEntry?._id}`}
      >
        {selectedEntry && (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  {selectedEntry.student?.name}
                </h4>
                <p className="text-slate-500 font-mono">
                  Roll: {selectedEntry.student?.rollNumber} • ID: {selectedEntry.student?.studentId}
                </p>
              </div>
              <BarcodeBadge value={selectedEntry.barcode} height={28} width={1.2} fontSize={9} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-white border border-slate-200 rounded-xl">
                <span className="text-slate-400 block text-[11px]">Department</span>
                <span className="font-bold text-slate-800">
                  {selectedEntry.department?.name} ({selectedEntry.department?.code})
                </span>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-xl">
                <span className="text-slate-400 block text-[11px]">Class Year</span>
                <span className="font-bold text-slate-800">
                  Year {selectedEntry.student?.year} - Section {selectedEntry.student?.section || 'A'}
                </span>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-xl">
                <span className="text-slate-400 block text-[11px]">Server Date & Time</span>
                <span className="font-mono font-bold text-indigo-600">
                  {selectedEntry.date} at {selectedEntry.time}
                </span>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-xl">
                <span className="text-slate-400 block text-[11px]">Gate Session</span>
                <span className="font-bold text-slate-800">
                  Morning Session
                </span>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-xl">
                <span className="text-slate-400 block text-[11px]">Reason</span>
                <span className="font-bold text-slate-800">{selectedEntry.reason}</span>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-xl">
                <span className="text-slate-400 block text-[11px]">Recorded By Staff</span>
                <span className="font-bold text-slate-800">
                  {selectedEntry.recordedBy?.name || 'Staff User'}
                </span>
              </div>
            </div>

            {selectedEntry.remarks && (
              <div className="p-3 bg-amber-50/70 border border-amber-200/60 rounded-xl">
                <span className="text-amber-800 font-bold block text-[11px] mb-0.5">
                  Remarks / Notes:
                </span>
                <p className="text-slate-700">{selectedEntry.remarks}</p>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedEntry(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        title="Confirm Record Deletion"
        subtitle="This action is restricted to Administrators"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600">
            Are you sure you want to permanently delete this late-entry record from the audit log?
            This will update the analytics and student statistics immediately.
          </p>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setDeleteConfirmId(null)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition"
            >
              Confirm Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
