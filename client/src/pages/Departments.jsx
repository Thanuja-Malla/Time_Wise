import React, { useState, useEffect, useCallback } from 'react';
import { departmentService } from '../services/departmentService';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  Building2,
  Plus,
  Edit2,
  Trash2,
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  FolderOpen
} from 'lucide-react';

export default function Departments() {
  const { isAdmin } = useAuth();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirmDept, setDeleteConfirmDept] = useState(null);
  const [editingDept, setEditingDept] = useState(null);

  const initialForm = {
    name: '',
    code: '',
    description: '',
    status: 'active'
  };
  const [formData, setFormData] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);

  const fetchDepartments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await departmentService.getDepartments();
      setDepartments(res.departments || []);
    } catch (err) {
      setToast({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  const handleOpenCreate = () => {
    setEditingDept(null);
    setFormData(initialForm);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (dept) => {
    setEditingDept(dept);
    setFormData({
      name: dept.name,
      code: dept.code,
      description: dept.description || '',
      status: dept.status
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim()) {
      setToast({ type: 'warning', message: 'Name and Code are required.' });
      return;
    }

    setSubmitting(true);
    try {
      if (editingDept) {
        await departmentService.updateDepartment(editingDept._id, formData);
        setToast({ type: 'success', message: 'Department updated successfully' });
      } else {
        await departmentService.createDepartment(formData);
        setToast({ type: 'success', message: 'Department created successfully' });
      }
      setIsModalOpen(false);
      fetchDepartments();
    } catch (err) {
      setToast({ type: 'error', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmDept) return;
    try {
      await departmentService.deleteDepartment(deleteConfirmDept._id);
      setToast({ type: 'success', message: 'Department deleted successfully' });
      setDeleteConfirmDept(null);
      fetchDepartments();
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
            Department Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Academic engineering & science branches with student and arrival aggregations
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md shadow-indigo-600/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Department</span>
          </button>
        )}
      </div>

      {/* Department Cards Grid */}
      {loading ? (
        <div className="py-20">
          <LoadingSpinner message="Fetching department stats..." />
        </div>
      ) : departments.length === 0 ? (
        <div className="py-20 text-center text-slate-400 bg-white rounded-3xl border border-slate-100 p-8">
          <FolderOpen className="w-12 h-12 mx-auto text-slate-300 mb-2" />
          <h3 className="text-sm font-bold text-slate-700">No Departments Configured</h3>
          <p className="text-xs text-slate-400 mt-1">
            Click "Add Department" above to add your first academic branch.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {departments.map((dept) => (
            <div
              key={dept._id}
              className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-sm border border-indigo-100 shadow-2xs group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      {dept.code}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 leading-tight">
                        {dept.name}
                      </h3>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1 mt-0.5 ${
                          dept.status === 'active' ? 'text-emerald-600' : 'text-slate-400'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            dept.status === 'active' ? 'bg-emerald-500' : 'bg-slate-300'
                          }`}
                        />
                        {dept.status}
                      </span>
                    </div>
                  </div>

                  {isAdmin && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(dept)}
                        title="Edit Department"
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmDept(dept)}
                        title="Delete Department"
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed">
                  {dept.description || 'No description provided for this department.'}
                </p>
              </div>

              {/* Metrics Counter Pill Bar */}
              <div className="grid grid-cols-2 gap-2 pt-4 border-t border-slate-100 bg-slate-50/60 -mx-6 -mb-6 p-4 rounded-b-3xl">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-white text-indigo-600 flex items-center justify-center shadow-2xs">
                    <Users className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">
                      Students
                    </span>
                    <span className="text-xs font-black text-slate-800">
                      {dept.studentCount ?? 0}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-white text-rose-600 flex items-center justify-center shadow-2xs">
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">
                      Late Entries
                    </span>
                    <span className="text-xs font-black text-rose-600">
                      {dept.lateEntryCount ?? 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Department Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingDept ? 'Edit Department' : 'Create New Department'}
        subtitle="Specify official department code and title"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold uppercase tracking-wider text-slate-600 mb-1">
              Department Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Computer Science and Engineering"
              className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-600 mb-1">
                Department Code *
              </label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="e.g. CSE"
                className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono font-bold uppercase"
              />
            </div>

            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-600 mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold uppercase tracking-wider text-slate-600 mb-1">
              Description
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of department scope..."
              className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-md shadow-indigo-600/20 transition disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Save Department'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Department Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirmDept}
        onClose={() => setDeleteConfirmDept(null)}
        title="Confirm Department Deletion"
        subtitle="Cannot delete if active students are enrolled in this department"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600">
            Are you sure you want to delete department{' '}
            <strong className="text-slate-900">
              {deleteConfirmDept?.name} ({deleteConfirmDept?.code})
            </strong>
            ?
          </p>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setDeleteConfirmDept(null)}
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
