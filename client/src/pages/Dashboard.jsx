import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { analyticsService } from '../services/analyticsService';
import DashboardCard from '../components/DashboardCard';
import LoadingSpinner from '../components/LoadingSpinner';
import Toast from '../components/Toast';
import {
  Users,
  Clock,
  Calendar,
  Building2,
  TrendingUp,
  AlertTriangle,
  QrCode,
  ArrowRight,
  ShieldCheck,
  CheckCircle
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';

export default function Dashboard() {
  const { user, isAdmin } = useAuth();
  const [data, setData] = useState(null);
  const [frequentStudents, setFrequentStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [dashRes, frequentRes] = await Promise.all([
        analyticsService.getDashboardAnalytics(),
        analyticsService.getFrequentLateStudents(5)
      ]);
      setData(dashRes);
      setFrequentStudents(frequentRes.students || []);
    } catch (err) {
      setToast({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <LoadingSpinner size="lg" message="Loading dashboard analytics..." />
      </div>
    );
  }

  const kpis = data?.kpis || {};
  const dailyTrend = data?.dailyTrend || [];
  const departmentDistribution = data?.departmentDistribution || [];
  const reasonsDistribution = data?.reasonsDistribution || [];

  const COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

  return (
    <div className="space-y-6">
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      {/* Hero Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold mb-3 border border-indigo-500/30">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>TimeWise Campus Gate System</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Welcome back, {user?.name || 'Administrator'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
            Barcode-based late entry tracking active. Authorized gate staff can scan
            existing student ID barcodes to record punctual arrival metrics securely.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap gap-3">
          <Link
            to="/scan"
            className="inline-flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white text-xs sm:text-sm font-bold px-5 py-3 rounded-2xl shadow-lg shadow-indigo-500/30 transition transform active:scale-95"
          >
            <QrCode className="w-4 h-4" />
            <span>Scan ID</span>
          </Link>
          <Link
            to="/reports"
            className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-semibold px-4 py-3 rounded-2xl border border-white/10 transition"
          >
            <span>View Reports</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Decorative background circle */}
        <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <DashboardCard
          title="Today's Late Entries"
          value={kpis.todayLateCount ?? 0}
          subtitle="Marked today"
          icon={Clock}
          color="rose"
          badge={kpis.todayLateCount > 0 ? 'Active Today' : 'Clean'}
          badgeType={kpis.todayLateCount > 0 ? 'warning' : 'positive'}
        />
        <DashboardCard
          title="This Week"
          value={kpis.weekLateCount ?? 0}
          subtitle="Past 7 calendar days"
          icon={Calendar}
          color="amber"
        />
        <DashboardCard
          title="This Month"
          value={kpis.monthLateCount ?? 0}
          subtitle="Past 30 days total"
          icon={TrendingUp}
          color="sky"
        />
        <DashboardCard
          title="Top Late Student"
          value={kpis.mostFrequentlyLateStudent?.name ? kpis.mostFrequentlyLateStudent.name.split(' ')[0] : 'None'}
          subtitle={
            kpis.mostFrequentlyLateStudent
              ? `${kpis.mostFrequentlyLateStudent.count} late entries`
              : 'Zero repeat records'
          }
          icon={AlertTriangle}
          color="purple"
          badge={kpis.mostFrequentlyLateStudent ? kpis.mostFrequentlyLateStudent.rollNumber : null}
          badgeType="negative"
        />
        <DashboardCard
          title="Highest Late Dept"
          value={kpis.highestLateDepartment?.code || 'None'}
          subtitle={
            kpis.highestLateDepartment
              ? `${kpis.highestLateDepartment.count} late records`
              : 'No department entries'
          }
          icon={Building2}
          color="emerald"
        />
      </div>

      {/* Primary Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Daily Late Entries Bar Chart (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-slate-800">
                Daily Late Entries (Past 7 Days)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Number of student arrivals recorded per day
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
              Last 7 Days
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '12px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                  }}
                  formatter={(val) => [`${val} Students`, 'Late Entries']}
                  labelFormatter={(label, items) => {
                    const item = items?.[0]?.payload;
                    return item ? `${item.day} (${item.date})` : label;
                  }}
                />
                <Bar dataKey="count" fill="#6366f1" radius={[8, 8, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Department Distribution */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-800">
                  By Department
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Proportion across branches
                </p>
              </div>
            </div>

            <div className="h-52 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={departmentDistribution}
                    dataKey="count"
                    nameKey="code"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {departmentDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '12px',
                      border: 'none',
                      color: '#fff',
                      fontSize: '12px'
                    }}
                    formatter={(val, name, entry) => [
                      `${val} entries`,
                      `${entry.payload.name} (${entry.payload.code})`
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Department Legend */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
            {departmentDistribution.slice(0, 6).map((dept, idx) => (
              <div key={dept._id} className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                />
                <span className="text-xs font-semibold text-slate-700 truncate">
                  {dept.code}: <span className="font-bold text-slate-900">{dept.count}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Secondary Row: Top Frequently Late Students & Reasons */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Frequently Late Students Leaderboard */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-800">
                Top Frequently Late Students
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Students requiring punctuality intervention or guardian counseling
              </p>
            </div>
            <Link
              to="/analytics"
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              Full Leaderboard <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4 rounded-l-xl">Student</th>
                  <th className="py-3 px-4">Roll Number</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Frequent Reason</th>
                  <th className="py-3 px-4 text-center rounded-r-xl">Total Late</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {frequentStudents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-400">
                      No late entry records found.
                    </td>
                  </tr>
                ) : (
                  frequentStudents.map((s, idx) => (
                    <tr key={s._id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 flex items-center gap-2.5">
                        <span
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            idx === 0
                              ? 'bg-rose-100 text-rose-700'
                              : idx === 1
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <div>
                          <div className="font-bold text-slate-900">{s.name}</div>
                          <div className="text-[10px] font-mono text-slate-400">
                            {s.barcode}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-700">
                        {s.rollNumber}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-semibold text-[11px] border border-indigo-100">
                          {s.departmentCode} (Yr {s.year})
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 truncate max-w-[140px]">
                        {s.primaryReason}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-block px-2.5 py-1 rounded-full font-bold text-rose-700 bg-rose-50 border border-rose-200">
                          {s.lateCount} times
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Common Late Entry Reasons Breakdown */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-800 mb-1">
              Reported Reasons
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              Reasons cited by students at the gate
            </p>

            <div className="space-y-3">
              {reasonsDistribution.map((item, idx) => {
                const totalReasons = reasonsDistribution.reduce((acc, curr) => acc + curr.count, 0) || 1;
                const percentage = Math.round((item.count / totalReasons) * 100);

                return (
                  <div key={item.reason} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-700 truncate">{item.reason}</span>
                      <span className="text-slate-500 font-mono">
                        {item.count} ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <Link
              to="/late-entries"
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1.5"
            >
              <span>Explore All Late Entries</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
