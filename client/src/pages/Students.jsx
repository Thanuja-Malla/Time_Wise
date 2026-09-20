import React, { useState, useEffect, useCallback } from 'react';
import { studentService } from '../services/studentService';
import { departmentService } from '../services/departmentService';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import LoadingSpinner from '../components/LoadingSpinner';
import BarcodeBadge from '../components/BarcodeBadge';
import {
  Users,
  Search,
  Plus,
  Edit2,
  Trash2,
  Eye,
  Building2,
  GraduationCap,
  Mail,
  Phone,
  QrCode,
  Printer,
  ChevronLeft,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';

export default function Students() {
  const { isAdmin } = useAuth();
  const [students, setStudents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [toast, setToast] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedYear, setSelectedYear] = useState('');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [profileStudent, setProfileStudent] = useState(null);
  const [deleteConfirmStudent, setDeleteConfirmStudent] = useState(null);

  // Form State
  const initialForm = {
    studentId: '',
    barcode: '',
    name: '',
    rollNumber: '',
    department: '',
    year: 1,
    section: 'A',
    email: '',
    phone: '',
    guardianPhone: '',
    status: 'active'
  };
  const [formData, setFormData] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  const fetchDepartments = useCallback(async () => {
    try {
      const res = await departmentService.getDepartments();
      setDepartments(res.departments || []);
    } catch {
      // ignore
    }
  }, []);

  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 15,
        search: search.trim() || undefined,
        department: selectedDept || undefined,
        year: selectedYear || undefined
      };
      const res = await studentService.getStudents(params);
      setStudents(res.students || []);
      setTotal(res.total || 0);
      setTotalPages(res.totalPages || 1);
    } catch (err) {
      setToast({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  }, [page, search, selectedDept, selectedYear]);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const handleOpenCreate = () => {
    // Generate suggested barcode and student ID
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    setFormData({
      ...initialForm,
      studentId: `STU-2024-${randomSuffix}`,
      barcode: `BC-GEN-${randomSuffix}`,
      department: departments[0]?._id || ''
    });
    setIsCreateModalOpen(true);
  };

  const handleOpenEdit = (student) => {
    setEditingId(student._id);
    setFormData({
      studentId: student.studentId,
      barcode: student.barcode,
      name: student.name,
      rollNumber: student.rollNumber,
      department: student.department?._id || student.department,
      year: student.year,
      section: student.section,
      email: student.email || '',
      phone: student.phone || '',
      guardianPhone: student.guardianPhone || '',
      status: student.status
    });
    setIsEditModalOpen(true);
  };

  const handleViewProfile = async (id) => {
    try {
      const res = await studentService.getStudentById(id);
      setProfileStudent(res);
    } catch (err) {
      setToast({ type: 'error', message: err.message });
    }
  };

  const handleSaveStudent = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.barcode || !formData.rollNumber || !formData.studentId) {
      setToast({ type: 'warning', message: 'Please fill all mandatory fields.' });
      return;
    }

    setFormSubmitting(true);
    try {
      if (editingId) {
        await studentService.updateStudent(editingId, formData);
        setToast({ type: 'success', message: 'Student updated successfully' });
        setIsEditModalOpen(false);
      } else {
        await studentService.createStudent(formData);
        setToast({ type: 'success', message: 'Student registered successfully' });
        setIsCreateModalOpen(false);
      }
      fetchStudents();
    } catch (err) {
      setToast({ type: 'error', message: err.message });
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmStudent) return;
    try {
      await studentService.deleteStudent(deleteConfirmStudent._id);
      setToast({ type: 'success', message: 'Student removed from database' });
      setDeleteConfirmStudent(null);
      fetchStudents();
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Student Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Registered students directory and ID barcode records ({total} total students)
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md shadow-indigo-600/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Register New Student</span>
          </button>
        )}
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="sm:col-span-2 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by name, roll no, barcode, ID..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
          />
        </div>

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

        <div>
          <select
            value={selectedYear}
            onChange={(e) => {
              setSelectedYear(e.target.value);
              setPage(1);
            }}
            className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
          >
            <option value="">All Study Years</option>
            <option value="1">Year 1</option>
            <option value="2">Year 2</option>
            <option value="3">Year 3</option>
            <option value="4">Year 4</option>
          </select>
        </div>
      </div>

      {/* Students Data Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16">
            <LoadingSpinner message="Loading student records..." />
          </div>
        ) : students.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <Users className="w-12 h-12 mx-auto text-slate-300 mb-2" />
            <h3 className="text-sm font-bold text-slate-700">No Students Found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              No students match the selected department or search terms.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-4">Student</th>
                  <th className="py-3.5 px-4">Roll Number</th>
                  <th className="py-3.5 px-4">Barcode ID</th>
                  <th className="py-3.5 px-4">Department</th>
                  <th className="py-3.5 px-4">Year & Sec</th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {students.map((student) => (
                  <tr key={student._id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{student.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {student.studentId}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-700">
                      {student.rollNumber}
                    </td>
                    <td className="py-3 px-4">
                      <div className="inline-block">
                        <BarcodeBadge
                          value={student.barcode}
                          height={20}
                          width={1.0}
                          fontSize={9}
                        />
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold text-[11px] border border-indigo-100">
                        {student.department?.code}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      Year {student.year} ({student.section || 'A'})
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                      <div>{student.email || '—'}</div>
                      <div className="text-slate-400">{student.phone || '—'}</div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          student.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {student.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleViewProfile(student._id)}
                          title="View Profile & Barcode ID Card"
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {isAdmin && (
                          <>
                            <button
                              onClick={() => handleOpenEdit(student)}
                              title="Edit Student"
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirmStudent(student)}
                              title="Delete Student"
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
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
              Page <span className="font-bold text-slate-800">{page}</span> of{' '}
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

      {/* Add / Edit Student Modal */}
      <Modal
        isOpen={isCreateModalOpen || isEditModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setIsEditModalOpen(false);
        }}
        title={isEditModalOpen ? 'Edit Student Details' : 'Register New Student'}
        subtitle="Barcode must be unique and match physical ID card"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSaveStudent} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-600 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Aarav Sharma"
                className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-600 mb-1">
                Roll Number *
              </label>
              <input
                type="text"
                required
                value={formData.rollNumber}
                onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value.toUpperCase() })}
                placeholder="e.g. 21CS045"
                className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>

            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-600 mb-1">
                Barcode Value *
              </label>
              <input
                type="text"
                required
                value={formData.barcode}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value.toUpperCase() })}
                placeholder="e.g. BC-CSE-101"
                className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>

            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-600 mb-1">
                Student ID *
              </label>
              <input
                type="text"
                required
                value={formData.studentId}
                onChange={(e) => setFormData({ ...formData, studentId: e.target.value.toUpperCase() })}
                placeholder="e.g. STU-2024-045"
                className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>

            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-600 mb-1">
                Department *
              </label>
              <select
                required
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select Department</option>
                {departments.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.code} - {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Year
                </label>
                <select
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value={1}>1st Year</option>
                  <option value={2}>2nd Year</option>
                  <option value={3}>3rd Year</option>
                  <option value={4}>4th Year</option>
                </select>
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Section
                </label>
                <input
                  type="text"
                  value={formData.section}
                  onChange={(e) => setFormData({ ...formData, section: e.target.value.toUpperCase() })}
                  placeholder="A"
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-600 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="student@college.edu"
                className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-600 mb-1">
                Phone Number
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 98765 43210"
                className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setIsCreateModalOpen(false);
                setIsEditModalOpen(false);
              }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={formSubmitting}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-md shadow-indigo-600/20 transition disabled:opacity-50"
            >
              {formSubmitting ? 'Saving...' : 'Save Student'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Student Profile & Printable Barcode Modal */}
      <Modal
        isOpen={!!profileStudent}
        onClose={() => setProfileStudent(null)}
        title="Student Profile & ID Barcode"
        subtitle="Test scanning this barcode directly from your screen with a phone!"
        maxWidth="max-w-2xl"
      >
        {profileStudent && (
          <div className="space-y-6 text-xs">
            {/* Student ID Card Visual */}
            <div className="p-6 bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl shadow-xl border border-indigo-500/20 relative overflow-hidden">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono tracking-widest text-indigo-300 uppercase">
                    Anil Neerukonda Institute of Technology & Sciences
                  </span>
                  <h3 className="text-lg font-black mt-1 text-white">
                    {profileStudent.student.name}
                  </h3>
                  <p className="text-xs text-indigo-200 font-mono">
                    Roll: {profileStudent.student.rollNumber} • ID: {profileStudent.student.studentId}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center font-bold text-lg text-white border border-white/20">
                  {profileStudent.student.name.charAt(0)}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 my-4 pt-3 border-t border-white/10 text-[11px]">
                <div>
                  <span className="text-slate-400 block text-[10px]">Department</span>
                  <span className="font-bold">{profileStudent.student.department?.code}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Class</span>
                  <span className="font-bold">Year {profileStudent.student.year} - Sec {profileStudent.student.section}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Late Total</span>
                  <span className="font-bold text-rose-300">
                    {profileStudent.stats?.totalLateEntries ?? 0} times
                  </span>
                </div>
              </div>

              {/* Scannable Barcode */}
              <div className="bg-white p-3 rounded-xl flex flex-col items-center justify-center shadow-inner">
                <BarcodeBadge
                  value={profileStudent.student.barcode}
                  height={45}
                  width={1.6}
                  fontSize={11}
                />
                <span className="text-[10px] text-slate-400 font-medium mt-1">
                  Point phone camera at this barcode to test scanning
                </span>
              </div>
            </div>

            {/* Late Entry History for this student */}
            <div>
              <h4 className="font-bold text-slate-800 uppercase tracking-wider mb-2">
                Recent Late Entries History ({profileStudent.recentLateEntries?.length || 0})
              </h4>
              {profileStudent.recentLateEntries?.length === 0 ? (
                <p className="text-slate-400 py-3 text-center bg-slate-50 rounded-xl">
                  Excellent punctuality! Zero late entries recorded.
                </p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {profileStudent.recentLateEntries.map((e) => (
                    <div
                      key={e._id}
                      className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100"
                    >
                      <div>
                        <div className="font-bold text-slate-800">
                          {e.date} at {e.time}
                        </div>
                        <div className="text-slate-500 text-[11px]">
                          Reason: {e.reason} {e.remarks && `• "${e.remarks}"`}
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">
                        {e.session}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setProfileStudent(null)}
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
        isOpen={!!deleteConfirmStudent}
        onClose={() => setDeleteConfirmStudent(null)}
        title="Delete Student Record"
        subtitle="This action will delete the student and all linked late-entry records."
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600">
            Are you sure you want to remove{' '}
            <strong className="text-slate-900">{deleteConfirmStudent?.name}</strong> (Roll:{' '}
            {deleteConfirmStudent?.rollNumber}) from the institution registry?
          </p>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setDeleteConfirmStudent(null)}
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
