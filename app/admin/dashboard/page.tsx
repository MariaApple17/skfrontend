'use client';

import {
  useEffect,
  useState,
} from 'react';

import {
  Activity,
  BarChart3,
  CheckCircle,
  Clock,
  TrendingUp,
  Users,
  Wallet,
  XCircle,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import api from '@/components/lib/api';
import AlertModal from '@/components/reusable/modal/AlertModal';

/* ================= PAGE ================= */

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [data, setData] = useState<any>(null);
  const [fiscalYears, setFiscalYears] = useState<any[]>([]);
  const [selectedFy, setSelectedFy] = useState<'ACTIVE' | 'ALL' | number>('ACTIVE');
  const [error, setError] = useState<string | null>(null);

  /* ================= FETCH CURRENT USER ================= */
  useEffect(() => {
    api.get('/auth/me')
      .then(res => res.data?.success && setUser(res.data.data))
      .catch(() => setError('Failed to load user'));
  }, []);

  /* ================= FETCH FISCAL YEARS ================= */
  useEffect(() => {
    api.get('/fiscal-years')
      .then(res => {
        if (res.data?.success) setFiscalYears(res.data.data);
      })
      .catch(() => setError('Failed to load fiscal years'));
  }, []);

  /* ================= FETCH DASHBOARD ================= */
  useEffect(() => {
    const params: any = {};

    if (selectedFy === 'ALL') params.mode = 'ALL';
    else if (selectedFy !== 'ACTIVE') params.fiscalYearId = selectedFy;

    api.get('/dashboard/overview', { params })
      .then(res => {
        if (res.data?.success) setData(res.data.data);
        else throw new Error();
      })
      .catch(err =>
        setError(err?.response?.data?.message || 'Failed to load dashboard')
      );
  }, [selectedFy]);

  if (!user || !data) return null;

  /* ================= NORMALIZE ================= */
  const isAllMode = data.mode === 'ALL';

  const fiscalYear = data.fiscalYear;

  const users = data.users ?? { total: 0 };

  const budget = isAllMode
    ? data.totals
    : data.budget ?? { total: 0, allocated: 0, used: 0 };
  const byCategory = !isAllMode
    ? data.budget?.byCategory ?? {}
    : {};

  const unallocatedBudget = Math.max(
    budget.total - budget.allocated,
    0
  );

  const approvals = data.approvals ?? [];
  const procurement = data.procurement ?? [];
  const logs = data.logs ?? { recent: [] };

  const approvalMap = approvals.reduce(
    
    (acc: any, a: any) => {
      acc[a.status] = a._count?.id || 0;
      return acc;
    },
    { PENDING: 0, APPROVED: 0, REJECTED: 0 }
  ); 
  /* ================= PROCUREMENT EFFICIENCY ================= */

const totalProcessed =
  approvalMap.APPROVED +
  approvalMap.REJECTED;

const totalRequests =
  approvalMap.APPROVED +
  approvalMap.REJECTED +
  approvalMap.PENDING;

const procurementEfficiency =
  totalRequests > 0
    ? ((totalProcessed / totalRequests) * 100).toFixed(1)
    : '0.0';

  const utilizationRate = budget.total > 0 
    ? ((budget.used / budget.total) * 100).toFixed(1)
    : '0.0';

    /* ================= BUDGET HEALTH ================= */

const numericUtilization = Number(utilizationRate);

let budgetHealth: 'HEALTHY' | 'WARNING' | 'RISK' = 'HEALTHY';

if (numericUtilization > 85) {
  budgetHealth = 'RISK';
} else if (numericUtilization > 60) {
  budgetHealth = 'WARNING';
}

/* ================= RISK DETECTION ================= */

const riskyCategories = Object.entries(byCategory ?? {}).filter(
  ([_, c]: any) => Number(c?.utilizationRate ?? 0) > 90
);

const currentMonth = new Date().getMonth();
const lateYear = currentMonth >= 9; // October+

const lowUtilizationRisk =
  lateYear && numericUtilization < 50;
  /* ================= TOP SPENDING CATEGORY ================= */

let topCategory: any = null;

if (!isAllMode && byCategory) {
  const entries = Object.entries(byCategory);

  if (entries.length > 0) {
    topCategory = entries.sort(
      (a: any, b: any) =>
        Number(b[1]?.used ?? 0) -
        Number(a[1]?.used ?? 0)
    )[0];
  }
}

  /* ================= RENDER ================= */
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
        
        .font-display {
          font-family: 'Poppins', sans-serif;
        }
        
        .font-body {
          font-family: 'Poppins', sans-serif;
        }

        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .animate-slide-in-up {
          animation: slideInUp 0.6s ease-out forwards;
        }

        .animate-fade-in {
          animation: fadeIn 0.8s ease-out forwards;
        }

        .stagger-1 { animation-delay: 0.1s; }
        .stagger-2 { animation-delay: 0.2s; }
        .stagger-3 { animation-delay: 0.3s; }
        .stagger-4 { animation-delay: 0.4s; }
        .stagger-5 { animation-delay: 0.5s; }

        .glass-effect {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }

        .shadow-luxury {
          box-shadow: 0 20px 60px -15px rgba(15, 23, 42, 0.08), 
                      0 8px 16px -8px rgba(15, 23, 42, 0.04);
        }

        .shadow-soft {
          box-shadow: 0 4px 24px -6px rgba(15, 23, 42, 0.06);
        }
      `}</style>

      <div className="mx-auto max-w-[1600px] px-6 py-8 lg:px-12 lg:py-12 font-body">
        {/* ================= HEADER ================= */}
        <header className="mb-12 animate-slide-in-up opacity-0">
          <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 lg:p-12">
            {/* Decorative background elements */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-72 h-72 bg-violet-500/10 rounded-full blur-3xl"></div>
            
            <div className="relative z-10">
              <div className="flex items-start justify-between gap-8 flex-wrap">
                <div className="flex-1 min-w-[280px]">
                  <p className="text-xs font-medium tracking-[0.2em] uppercase text-slate-400 mb-3">
                    {getGreeting()}
                  </p>

                  <h1 className="font-display text-4xl lg:text-5xl font-normal text-white mb-4 tracking-tight">
                    Welcome back, <span className="italic">{user.fullName}</span>
                  </h1>

                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-white border border-white/10">
                      <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                      {user.role?.name}
                    </span>
                    <span className="text-sm font-medium text-emerald-400">
                      {user.status}
                    </span>
                  </div>
                </div>

                {/* Fiscal Year Selector */}
                <div className=" rounded-2xl p-5 border border-white/20 min-w-[220px]">
                  <label className="block text-xs font-semibold tracking-wide uppercase text-slate-300 mb-2">
                    Fiscal Year
                  </label>
                  <select
                    value={selectedFy}
                    onChange={e =>
                      setSelectedFy(
                        e.target.value === 'ALL'
                          ? 'ALL'
                          : e.target.value === 'ACTIVE'
                          ? 'ACTIVE'
                          : Number(e.target.value)
                      )
                    }
                    className="w-full rounded-xl bg-white/10 px-4 py-2.5 text-sm font-medium text-white outline-none border border-white/20 focus:border-white/40 transition-colors cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27white%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3e%3cpolyline points=%276 9 12 15 18 9%27%3e%3c/polyline%3e%3c/svg%3e')] bg-[length:20px] bg-[position:right_0.75rem_center] bg-no-repeat pr-10"
                    style={{
                      colorScheme: 'dark'
                    }}
                  >
                    <option value="ACTIVE" className="bg-slate-800 text-white">Active Year</option>
                    <option value="ALL" className="bg-slate-800 text-white">All Years</option>
                    {fiscalYears.map(fy => (
                      <option key={fy.id} value={fy.id} className="bg-slate-800 text-white">
                        {fy.year} {fy.isActive ? '(Active)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* ================= KPI METRICS ================= */}
        <section className="mb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
            <MetricCard 
              label="Total Users" 
              value={users.total.toLocaleString()} 
              icon={Users}
              trend="+12%"
              trendPositive={true}
              delay="stagger-1"
            />
            <MetricCard 
              label="Total Budget" 
              value={`₱${budget.total.toLocaleString()}`} 
              icon={Wallet}
              delay="stagger-2"
            />
            <MetricCard 
              label="Allocated budget" 
              value={`₱${budget.allocated.toLocaleString()}`} 
              icon={BarChart3}
              delay="stagger-3"
            />
            <MetricCard 
              label="Unimplemented Budget" 
              value={`₱${unallocatedBudget.toLocaleString()}`} 
              icon={Activity}
              delay="stagger-4"
            />
            <MetricCard 
              label="Budget Used" 
              value={`₱${budget.used.toLocaleString()}`} 
              icon={TrendingUp}
              highlight
              subtitle={`${utilizationRate}% utilized • ${budgetHealth}`}
              delay="stagger-5"
            />
          </div>
        </section>

        {!isAllMode && (
  <section className="mb-12 animate-fade-in opacity-0">
    <div className="mb-6">
      <h2 className="font-display text-2xl text-slate-900 mb-1">
        Budget By Category
      </h2>
      <p className="text-sm text-slate-500">
        Category caps and utilization for current fiscal year
      </p>
    </div>
<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
  {(['GENERAL ADMINISTRATIVE PROGRAM', 'SK YOUTH DEVELOPMENT AND EMPOWERMENT PROGRAM'] as const).map((category) => {

    const c =
      Array.isArray(byCategory)
        ? byCategory[category === 'GENERAL ADMINISTRATIVE PROGRAM' ? 0 : 1] ?? {}
        : byCategory?.[category] ?? {};

    const cap = Number(c.cap ?? 0);
    const allocated = Number(c.allocated ?? 0);
    const used = Number(c.used ?? 0);
    const remaining = Number(c.remaining ?? 0);
    const utilization = Number(c.utilizationRate ?? 0);

    return (
      <div
        key={category}
        className="glass-effect border border-slate-200/60 shadow-soft rounded-[24px] p-6"
      >
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
          {category}
        </p>

        <p className="text-2xl font-display text-slate-900 mb-4">
          ₱{cap.toLocaleString()}
        </p>

        <div className="space-y-1 text-sm text-slate-600">
          <p className="font-semibold text-blue-600">
            Allocated: ₱{allocated.toLocaleString()}
          </p>
          <p>Used: ₱{used.toLocaleString()}</p>
          <p>Remaining: ₱{remaining.toLocaleString()}</p>
          <p>Utilization: {utilization.toFixed(1)}%</p>
        </div>

        <div className="mt-4 h-2 w-full bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600"
            style={{ width: `${Math.min(utilization, 100)}%` }}
          />
        </div>
      </div>
    );
  })}
</div>
{(riskyCategories.length > 0 || lowUtilizationRisk) && (
  <div className="mt-8 rounded-[24px] p-6 bg-rose-50 border border-rose-200 shadow-soft">
    <h3 className="font-display text-lg text-rose-800 mb-4">
      🚨 Financial Risk Alerts
    </h3>

    <div className="space-y-2 text-sm text-rose-700">
      {riskyCategories.map(([name]: any) => (
        <p key={name}>
          ⚠ {name} exceeded 90% utilization.
        </p>
      ))}

      {lowUtilizationRisk && (
        <p>
          ⚠ Budget utilization is below 50% near fiscal year end.
        </p>
      )}
    </div>
  </div>
)}

{topCategory && (
  <div className="mt-6 text-sm text-slate-600">
    <span className="font-semibold text-slate-800">
      🏆 Highest Spending Area:
    </span>{' '}
    {topCategory[0]} (
    ₱{Number(topCategory[1]?.used ?? 0).toLocaleString()})
  </div>
)}
  </section>
)}
{!isAllMode && (
  <div className="mb-10 text-sm text-slate-600">
    <span className="font-semibold text-slate-800">
      📊 Procurement Efficiency:
    </span>{' '}
    {procurementEfficiency}% processed
  </div>
)}
        {/* ================= CHARTS (ALL MODE) ================= */}
        {isAllMode && (
          <section className="mb-12 animate-fade-in opacity-0">
            <div className="mb-6">
              <h2 className="font-display text-2xl text-slate-900 mb-1">
                Budget Analytics
              </h2>
              <p className="text-sm text-slate-500">
                Comprehensive overview across all fiscal years
              </p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <ChartCard title="Budget by Fiscal Year">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.yearly}>
                    <XAxis 
                      dataKey="fiscalYear" 
                      stroke="#94a3b8"
                      style={{ fontSize: '12px' }}
                    />
                    <YAxis 
                      stroke="#94a3b8"
                      style={{ fontSize: '12px' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(15, 23, 42, 0.95)',
                        border: 'none',
                        borderRadius: '12px',
                        color: '#fff',
                        fontSize: '12px'
                      }}
                    />
                    <Bar dataKey="total" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="allocated" fill="#10b981" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="administrativeAmount" fill="#f59e0b" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="youthAmount" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Utilization Trend">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data.yearly}>
                    <XAxis 
                      dataKey="fiscalYear" 
                      stroke="#94a3b8"
                      style={{ fontSize: '12px' }}
                    />
                    <YAxis 
                      stroke="#94a3b8"
                      style={{ fontSize: '12px' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(15, 23, 42, 0.95)',
                        border: 'none',
                        borderRadius: '12px',
                        color: '#fff',
                        fontSize: '12px'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="utilizationRate" 
                      stroke="#f59e0b" 
                      strokeWidth={3}
                      dot={{ fill: '#f59e0b', r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
          </section>
        )}

        {/* ================= APPROVAL STATUS ================= */}
        {!isAllMode && (
          <section className="mb-12 animate-fade-in opacity-0">
            <div className="mb-6">
              <h2 className="font-display text-2xl text-slate-900 mb-1">
                Approval Pipeline
              </h2>
              <p className="text-sm text-slate-500">
                Current status of approval requests
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <StatusCard 
                label="Pending Review" 
                value={approvalMap.PENDING} 
                icon={Clock} 
                theme="amber" 
              />
              <StatusCard 
                label="Approved" 
                value={approvalMap.APPROVED} 
                icon={CheckCircle} 
                theme="emerald" 
              />
              <StatusCard 
                label="Rejected" 
                value={approvalMap.REJECTED} 
                icon={XCircle} 
                theme="rose" 
              />
            </div>
          </section>
        )}

        {/* ================= ACTIVITY ================= */}
        {!isAllMode && (
          <section className="grid grid-cols-1 xl:grid-cols-2 gap-6 animate-fade-in opacity-0">
            <ActivityCard title="Procurement Overview">
              {procurement.length === 0 ? (
                <EmptyState message="No procurement records found" />
              ) : (
                <div className="space-y-2">
                  {procurement.map((p: any) => (
                    <ActivityRow
                      key={p.status}
                      title={p.status}
                      subtitle="Active Requests"
                      value={`₱${Number(p._sum?.amount || 0).toLocaleString()}`}
                      count={p._count?.id || 0}
                    />
                  ))}
                </div>
              )}
            </ActivityCard>

            <ActivityCard title="Recent Activity">
              {logs.recent.length === 0 ? (
                <EmptyState message="No recent activity" />
              ) : (
                <div className="space-y-2">
                  {logs.recent.slice(0, 8).map((l: any) => (
                    <ActivityRow
                      key={l.id}
                      title={l.message}
                      subtitle={`${l.context ?? 'System'} • ${l.user?.fullName ?? 'System'}`}
                      value={new Date(l.createdAt).toLocaleTimeString('en-US', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    />
                  ))}
                </div>
              )}
            </ActivityCard>
          </section>
        )}

        {/* ================= ERROR MODAL ================= */}
        <AlertModal
          open={!!error}
          type="error"
          title="Dashboard Error"
          message={error ?? ''}
          onClose={() => setError(null)}
        />
      </div>
    </div>
  );
}

/* ================= UI COMPONENTS ================= */

function MetricCard({ label, value, icon: Icon, highlight, trend, trendPositive, subtitle, delay }: any) {
  return (
    <div className={`animate-slide-in-up opacity-0 ${delay}`}>
      <div className={`
        relative overflow-hidden rounded-[24px] p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-luxury
        ${highlight 
          ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-luxury' 
          : 'glass-effect border border-slate-200/60 shadow-soft'
        }
      `}>
        {/* Background decoration */}
        {highlight && (
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
        )}
        
        <div className="relative">
          <div className="flex items-start justify-between mb-6">
            <div className={`
              rounded-2xl p-3 transition-all
              ${highlight 
                ? 'bg-white/20' 
                : 'bg-gradient-to-br from-slate-100 to-slate-50'
              }
            `}>
              <Icon className={`${highlight ? 'text-white' : 'text-slate-700'}`} size={20} strokeWidth={2} />
            </div>
            {trend && (
              <span className={`
                text-xs font-semibold px-2 py-1 rounded-lg
                ${trendPositive 
                  ? 'bg-emerald-500/20 text-emerald-700' 
                  : 'bg-rose-500/20 text-rose-700'
                }
              `}>
                {trend}
              </span>
            )}
          </div>
          
          <div>
            <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${
              highlight ? 'text-white/80' : 'text-slate-500'
            }`}>
              {label}
            </p>
            <p className={`font-display text-3xl font-normal tracking-tight ${
              highlight ? 'text-white' : 'text-slate-900'
            }`}>
              {value}
            </p>
            {subtitle && (
              <p className={`text-xs mt-2 font-medium ${
                highlight ? 'text-white/70' : 'text-slate-400'
              }`}>
                {subtitle}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusCard({ label, value, icon: Icon, theme }: any) {
  const themes: any = {
    amber: {
      bg: 'from-amber-50 to-orange-50',
      icon: 'bg-gradient-to-br from-amber-500 to-orange-600',
      text: 'text-amber-900',
      border: 'border-amber-100',
    },
    emerald: {
      bg: 'from-emerald-50 to-teal-50',
      icon: 'bg-gradient-to-br from-emerald-500 to-teal-600',
      text: 'text-emerald-900',
      border: 'border-emerald-100',
    },
    rose: {
      bg: 'from-rose-50 to-pink-50',
      icon: 'bg-gradient-to-br from-rose-500 to-pink-600',
      text: 'text-rose-900',
      border: 'border-rose-100',
    },
  };

  const t = themes[theme];

  return (
    <div className={`
      relative overflow-hidden rounded-[24px] p-6 border transition-all duration-300 hover:scale-[1.02] hover:shadow-luxury
      bg-gradient-to-br ${t.bg} ${t.border}
    `}>
      <div className="flex items-center gap-5">
        <div className={`rounded-2xl p-4 ${t.icon} shadow-lg`}>
          <Icon size={24} className="text-white" strokeWidth={2} />
        </div>
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
            {label}
          </p>
          <p className={`font-display text-3xl font-normal ${t.text}`}>
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

function ChartCard({ title, children }: any) {
  return (
    <div className="glass-effect rounded-[24px] p-8 border border-slate-200/60 shadow-soft">
      <h3 className="font-display text-xl text-slate-900 mb-6">
        {title}
      </h3>
      {children}
    </div>
  );
}

function ActivityCard({ title, children }: any) {
  return (
    <div className="glass-effect rounded-[24px] p-8 border border-slate-200/60 shadow-soft">
      <h3 className="font-display text-xl text-slate-900 mb-6">
        {title}
      </h3>
      {children}
    </div>
  );
}

function ActivityRow({ title, subtitle, value, count }: any) {
  return (
    <div className="group flex items-center justify-between rounded-2xl bg-white/80 border border-slate-100 px-5 py-4 transition-all duration-200 hover:bg-white hover:shadow-soft hover:border-slate-200">
      <div className="flex-1">
        <p className="text-sm font-semibold text-slate-800 mb-0.5">
          {title}
        </p>
        <p className="text-xs text-slate-500">
          {subtitle}
        </p>
      </div>
      <div className="text-right">
        <p className="text-sm font-bold text-slate-900">
          {value}
        </p>
        {count !== undefined && (
          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">
            {count} {count === 1 ? 'item' : 'items'}
          </p>
        )}
      </div>
    </div>
  );
}

function EmptyState({ message }: any) {
  return (
    <div className="flex items-center justify-center rounded-2xl bg-slate-50/50 border border-dashed border-slate-200 px-6 py-12">
      <p className="text-sm font-medium text-slate-400">
        {message}
      </p>
    </div>
  );
}

/* ================= HELPERS ================= */

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}


