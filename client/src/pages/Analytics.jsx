import React, { useState, useEffect } from 'react';
import { analyticsService } from '../services/analyticsService';
import LoadingSpinner from '../components/LoadingSpinner';
import Toast from '../components/Toast';
import DashboardCard from '../components/DashboardCard';
import {
  BarChart3,
  TrendingUp,
  Clock,
  Users,
  AlertTriangle,
  Building2,
  Calendar,
  CheckCircle,
  Activity
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';

export default function Analytics() {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [frequentStudents, setFrequentStudents] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const [dashRes, freqRes, monthRes] = await Promise.all([
          analyticsService.getDashboardAnalytics(),
          analyticsService.getFrequentLateStudents(10),
          analyticsService.getMonthlyAnalytics()
        ]);
        setDashboardData(dashRes);
        setFrequentStudents(freqRes.students || []);
        setMonthlyData(monthRes.monthlyTrend || []);
      } catch (err) {
        setToast({ type: 'error', message: err.message });
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <LoadingSpinner size="lg" message="Crunching punctuality analytics..." />
      </div>
    );
  }

  const kpis = dashboardData?.kpis || {};
  const dailyTrend = dashboardData?.dailyTrend || [];
  const deptDist = dashboardData?.departmentDistribution || [];
  const reasonsDist = dashboardData?.reasonsDistribution || [];

  const totalLateEntries = kpis.monthLateCount || 0;
  const dailyAverage = (totalLateEntries / 30).toFixed(1);

  const COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#3b82f6'];

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
      <div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-100 mb-1">
          <Activity className="w-3.5 h-3.5" />
          <span>Institutional Insights & Trends</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Punctuality & Habitual Late Analytics
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Identify root causes, recurrent late patterns, and branch compliance to enhance institutional discipline.
        </p>
      </div>

      {/* Analytics KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard
          title="Past 30 Days Total"
          value={totalLateEntries}
          subtitle="Late entry arrivals recorded"
          icon={Clock}
          color="indigo"
        />
        <DashboardCard
          title="Daily Average"
          value={`${dailyAverage}/day`}
          subtitle="Estimated campus daily pace"
          icon={TrendingUp}
          color="amber"
        />
        <DashboardCard
          title="Top Recurrent Cases"
          value={frequentStudents.length}
          subtitle="Students with repeated late habits"
          icon={AlertTriangle}
          color="rose"
        />
        <DashboardCard
          title="Branch Coverage"
          value={`${deptDist.length} Depts`}
          subtitle="Actively monitored departments"
          icon={Building2}
          color="emerald"
        />
      </div>

      {/* Charts Row: Monthly Trend & Department Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trend Area Chart */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Monthly Late-Entry Volume Trend
              </h2>
              <p className="text-xs text-slate-400">
                Evolution of late arrivals over the academic term
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
              Academic Trend
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={monthlyData.length > 0 ? monthlyData : [{ month: 'Current Term', count: totalLateEntries }]}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="monthGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '12px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px'
                  }}
                  formatter={(val) => [`${val} Late Entries`, 'Volume']}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#6366f1"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#monthGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Department Comparison Bar Chart */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Department Punctuality Comparison
              </h2>
              <p className="text-xs text-slate-400">
                Late arrival incidence breakdown by engineering branch
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
              Departmental
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={deptDist}
                layout="vertical"
                margin={{ top: 10, right: 20, left: 10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis dataKey="code" type="category" tick={{ fill: '#0f172a', fontSize: 12, fontWeight: 700 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '12px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px'
                  }}
                  formatter={(val, name, item) => [
                    `${val} late entries`,
                    item.payload.name
                  ]}
                />
                <Bar dataKey="count" fill="#4f46e5" radius={[0, 8, 8, 0]} maxBarSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recurrent Latecomers Leaderboard */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Top 10 Frequently Late Students
            </h2>
            <p className="text-xs text-slate-400">
              High recurrence index indicating persistent gate delay patterns
            </p>
          </div>
          <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
            Counseling Priority
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Rank</th>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Roll Number</th>
                <th className="py-3 px-4">Department & Year</th>
                <th className="py-3 px-4">Most Common Reason</th>
                <th className="py-3 px-4">Latest Arrival</th>
                <th className="py-3 px-4 text-center">Late Frequency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {frequentStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No repeat latecomer records found.
                  </td>
                </tr>
              ) : (
                frequentStudents.map((s, idx) => (
                  <tr key={s._id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                          idx === 0
                            ? 'bg-rose-600 text-white'
                            : idx === 1
                            ? 'bg-rose-100 text-rose-800'
                            : idx === 2
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {idx + 1}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{s.name}</div>
                      <div className="text-[10px] font-mono text-slate-400">
                        {s.barcode}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-700">
                      {s.rollNumber}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold text-[11px] border border-indigo-100">
                        {s.departmentCode} (Yr {s.year})
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {s.primaryReason}
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                      {s.lastLateDate ? new Date(s.lastLateDate).toLocaleDateString() : '—'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-3 py-1 rounded-full font-black text-xs ${
                          s.lateCount >= 4
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {s.lateCount} Late Entries
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
