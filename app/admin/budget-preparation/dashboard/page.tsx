'use client';

import { useEffect, useMemo, useState } from 'react';
import { Activity, BarChart3, CheckCircle, Sparkles, TrendingUp, Wallet } from 'lucide-react';

import api from '@/components/lib/api';
import AuthGuard from '@/components/reusable/guard/AuthGuard';
import { AdminPageShimmer } from '@/components/reusable/ui/PageShimmer';
import FlatSelect from '@/components/reusable/ui/FlatSelect';

interface Budget {
  id: number;
  fiscalYearId: number;
  totalAmount: string;
  administrativeAmount?: string | null;
  youthAmount?: string | null;
  createdAt: string;
  deletedAt: string | null;
  fiscalYear: {
    id: number;
    year: number;
    isActive: boolean;
  };
}

interface BudgetAllocation {
  id: number;
  budgetId: number;
  allocatedAmount: string;
  usedAmount: string;
  category?: string;
  classificationId?: number;
  classification?: {
    id: number;
    code?: string | null;
    name?: string | null;
  } | null;
  objectOfExpenditureId?: number;
  object?: {
    id: number;
    code?: string | null;
    name?: string | null;
  } | null;
  createdAt: string;
}

const formatCurrency = (value: number) =>
  `₱${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const getBudgetStatus = (isActive: boolean) => (isActive ? 'Active' : 'Archived');

const MetricCard = ({
  label,
  value,
  icon: Icon,
  description,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ size?: number }>;
  description?: string;
}) => (
  <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200">
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-slate-400">{label}</p>
        <p className="mt-3 text-3xl font-semibold text-slate-900">{value}</p>
      </div>
      <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-100 text-slate-700">
        <Icon size={24} />
      </div>
    </div>
    {description && <p className="mt-4 text-sm text-slate-500">{description}</p>}
  </div>
);

export default function BudgetDashboardPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [allocations, setAllocations] = useState<BudgetAllocation[]>([]);
  const [fiscalYearFilter, setFiscalYearFilter] = useState<number | ''>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [budgetRes, allocationRes] = await Promise.all([
          api.get('/budgets'),
          api.get('/budget-allocations', { params: { page: 1, limit: 1000 } }),
        ]);

        setBudgets(budgetRes.data?.data ?? []);
        setAllocations(allocationRes.data?.data ?? []);
      } catch (err: any) {
        console.error('Failed to load budget dashboard', err);
        setError(err?.response?.data?.message ?? 'Failed to load budget dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const activeBudgets = useMemo(
    () => budgets.filter(budget => !budget.deletedAt),
    [budgets]
  );

  const fiscalYearOptions = useMemo(() => {
    const years = Array.from(
      new Set(activeBudgets.map((budget) => budget.fiscalYear.year))
    ).sort((a, b) => a - b);

    return [
      { id: '', label: 'All years' },
      ...years.map((year) => ({ id: String(year), label: `FY ${year}` })),
    ];
  }, [activeBudgets]);

  const summary = useMemo(() => {
    const selectedBudgets = fiscalYearFilter
      ? activeBudgets.filter(
          (budget) => budget.fiscalYear.year === fiscalYearFilter
        )
      : activeBudgets;

    const totalBudgets = selectedBudgets.length;
    const totalBudgetValue = selectedBudgets.reduce(
      (sum, budget) => sum + Number(budget.totalAmount || 0),
      0
    );
    const totalAllocated = allocations
      .filter((allocation) =>
        selectedBudgets.some((budget) => budget.id === allocation.budgetId)
      )
      .reduce((sum, allocation) => sum + Number(allocation.allocatedAmount || 0), 0);
    const totalUsed = allocations
      .filter((allocation) =>
        selectedBudgets.some((budget) => budget.id === allocation.budgetId)
      )
      .reduce((sum, allocation) => sum + Number(allocation.usedAmount || 0), 0);

    const remainingInBudget = Math.max(totalBudgetValue - totalAllocated, 0);
    const availableBalance = Math.max(totalBudgetValue - totalUsed, 0);
    const utilization = totalBudgetValue > 0
      ? Number(((totalUsed / totalBudgetValue) * 100).toFixed(1))
      : 0;

    return {
      totalBudgets,
      totalBudgetValue,
      totalAllocated,
      totalUsed,
      remainingInBudget,
      availableBalance,
      utilization,
    };
  }, [activeBudgets, allocations, fiscalYearFilter]);

  const budgetsByYear = useMemo(() => {
    const groups = new Map<number, Array<Budget & {
      allocated: number;
      used: number;
      remaining: number;
      utilization: number;
      classificationSummaries: Array<{
        id?: number;
        code?: string | null;
        name?: string | null;
        allocated: number;
        used: number;
        remaining: number;
        utilization: number;
      }>;
      objectSummaries: Array<{
        id?: number;
        code?: string | null;
        name?: string | null;
        allocated: number;
        used: number;
        remaining: number;
        utilization: number;
      }>;
    }>>() ;

    activeBudgets.forEach((budget) => {
      const budgetAllocations = allocations.filter(
        (allocation) => allocation.budgetId === budget.id
      );
      const allocated = budgetAllocations.reduce(
        (sum, allocation) => sum + Number(allocation.allocatedAmount || 0),
        0
      );
      const used = budgetAllocations.reduce(
        (sum, allocation) => sum + Number(allocation.usedAmount || 0),
        0
      );
      const remaining = Math.max(Number(budget.totalAmount || 0) - allocated, 0);
      const utilization = Number(budget.totalAmount || 0) > 0
        ? Number(((used / Number(budget.totalAmount || 0)) * 100).toFixed(1))
        : 0;

      const classificationSummaries = Object.values(
        budgetAllocations.reduce<Record<string, {
          id?: number;
          code?: string | null;
          name?: string | null;
          allocated: number;
          used: number;
        }>>((groups, allocation) => {
          const key = String(allocation.classificationId ?? 'unknown');
          const existing = groups[key] ?? {
            id: allocation.classificationId,
            code: allocation.classification?.code,
            name: allocation.classification?.name,
            allocated: 0,
            used: 0,
          };
          existing.allocated += Number(allocation.allocatedAmount || 0);
          existing.used += Number(allocation.usedAmount || 0);
          groups[key] = existing;
          return groups;
        }, {})
      ).map((item) => ({
        ...item,
        remaining: Math.max(item.allocated - item.used, 0),
        utilization: item.allocated > 0
          ? Number(((item.used / item.allocated) * 100).toFixed(1))
          : 0,
      }));

      const objectSummaries = Object.values(
        budgetAllocations.reduce<Record<string, {
          id?: number;
          code?: string | null;
          name?: string | null;
          allocated: number;
          used: number;
        }>>((groups, allocation) => {
          const key = String(allocation.objectOfExpenditureId ?? 'unknown');
          const existing = groups[key] ?? {
            id: allocation.objectOfExpenditureId,
            code: allocation.object?.code,
            name: allocation.object?.name,
            allocated: 0,
            used: 0,
          };
          existing.allocated += Number(allocation.allocatedAmount || 0);
          existing.used += Number(allocation.usedAmount || 0);
          groups[key] = existing;
          return groups;
        }, {})
      ).map((item) => ({
        ...item,
        remaining: Math.max(item.allocated - item.used, 0),
        utilization: item.allocated > 0
          ? Number(((item.used / item.allocated) * 100).toFixed(1))
          : 0,
      }));

      const year = budget.fiscalYear.year;
      const groupsForYear = groups.get(year) ?? [];
      groupsForYear.push({
        ...budget,
        allocated,
        used,
        remaining,
        utilization,
        classificationSummaries,
        objectSummaries,
      });
      groups.set(year, groupsForYear);
    });

    return Array.from(groups.entries())
      .sort(([a], [b]) => a - b)
      .map(([year, budgets]) => ({ year, budgets }));
  }, [activeBudgets, allocations]);

  const visibleBudgetGroups = useMemo(
    () => fiscalYearFilter
      ? budgetsByYear.filter((group) => group.year === fiscalYearFilter)
      : budgetsByYear,
    [budgetsByYear, fiscalYearFilter]
  );

  if (loading) {
    return <AdminPageShimmer cards={6} showFilters={false} />;
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-slate-50 py-8">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-10">
          <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Budget Dashboard</p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
                Budget overview and allocation health
              </h1>
              <p className="mt-2 text-sm text-slate-500 max-w-2xl">
                View all created budgets, allocated funds, balances, and remaining capacity in one place.
              </p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3 text-slate-700">
                <Wallet size={20} />
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Budgets created</p>
                  <p className="text-xl font-semibold text-slate-900">{summary.totalBudgets}</p>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-6 rounded-3xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">
              {error}
            </div>
          )}

          <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
            <MetricCard
              label="Total budget value"
              value={formatCurrency(summary.totalBudgetValue)}
              icon={Wallet}
              description="Sum of all created fiscal budgets."
            />
            <MetricCard
              label="Allocated budget"
              value={formatCurrency(summary.totalAllocated)}
              icon={BarChart3}
              description="Amount assigned to program allocations."
            />
            <MetricCard
              label="Used budget"
              value={formatCurrency(summary.totalUsed)}
              icon={TrendingUp}
              description="Actual amount consumed from allocations."
            />
            <MetricCard
              label="Remaining capacity"
              value={formatCurrency(summary.availableBalance)}
              icon={Activity}
              description="Budget remaining after used funds."
            />
          </section>

          <section className="mb-10 rounded-3xl bg-white p-6 shadow-sm border border-slate-200">
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">Budget balance summary</h2>
                <p className="text-sm text-slate-500">
                  Detailed totals for allocated, used, and unallocated funds across all budgets.
                </p>
              </div>
              <div className="rounded-2xl bg-slate-100 px-4 py-2 text-sm text-slate-600">
                Utilization: <span className="font-semibold text-slate-900">{summary.utilization}%</span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Balance remaining</p>
                <p className="mt-3 text-3xl font-semibold text-slate-900">{formatCurrency(summary.remainingInBudget)}</p>
                <p className="mt-2 text-sm text-slate-500">Unallocated funds available for new spending.</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Unallocated budget</p>
                <p className="mt-3 text-3xl font-semibold text-slate-900">{formatCurrency(summary.totalBudgetValue - summary.totalAllocated)}</p>
                <p className="mt-2 text-sm text-slate-500">Remaining capacity for future allocations.</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Budget health</p>
                <p className="mt-3 text-3xl font-semibold text-slate-900">
                  {summary.utilization >= 85 ? 'At Risk' : summary.utilization >= 60 ? 'Caution' : 'Healthy'}
                </p>
                <p className="mt-2 text-sm text-slate-500">Based on total used versus total budget.</p>
              </div>
            </div>
          </section>

          <section className="mb-10">
            <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">Budgets by fiscal year</h2>
                <p className="text-sm text-slate-500">
                  Review each budget and see how much is allocated, used, and left.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                <FlatSelect
                  label="Fiscal Year"
                  value={String(fiscalYearFilter || '')}
                  options={fiscalYearOptions.map((option) => ({
                    id: option.id,
                    label: option.label,
                  }))}
                  onChange={(value) => {
                    setFiscalYearFilter(Number(value) || '');
                  }}
                />
                <div className="rounded-3xl bg-slate-100 px-4 py-3 text-sm text-slate-600">
                  Total budgets: {summary.totalBudgets}
                </div>
              </div>
            </div>

            <div className="space-y-8">
              {visibleBudgetGroups.length === 0 ? (
                <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-slate-500">
                  No budgets found for the selected fiscal year.
                </div>
              ) : visibleBudgetGroups.map((yearGroup) => (
                <div key={yearGroup.year} className="space-y-5">
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                    <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Fiscal year</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900">FY {yearGroup.year}</p>
                  </div>

                  <div className="space-y-4">
                    {yearGroup.budgets.map((budget) => (
                      <div
                        key={budget.id}
                        className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
                      >
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="text-sm font-semibold text-slate-900">FY {budget.fiscalYear.year}</span>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                          {getBudgetStatus(budget.fiscalYear.isActive)}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-slate-500">Created {new Date(budget.createdAt).toLocaleDateString()}</p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 xl:gap-4">
                      <div className="rounded-3xl bg-slate-50 p-4">
                        <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Total budget</p>
                        <p className="mt-2 text-lg font-semibold text-slate-900">{formatCurrency(Number(budget.totalAmount || 0))}</p>
                      </div>
                      <div className="rounded-3xl bg-slate-50 p-4">
                        <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Allocated</p>
                        <p className="mt-2 text-lg font-semibold text-slate-900">{formatCurrency(budget.allocated)}</p>
                      </div>
                      <div className="rounded-3xl bg-slate-50 p-4">
                        <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Used</p>
                        <p className="mt-2 text-lg font-semibold text-slate-900">{formatCurrency(budget.used)}</p>
                      </div>
                      <div className="rounded-3xl bg-slate-50 p-4">
                        <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Remaining</p>
                        <p className="mt-2 text-lg font-semibold text-slate-900">{formatCurrency(budget.remaining)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 h-3 rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className={`h-full ${budget.utilization > 85 ? 'bg-rose-500' : budget.utilization > 60 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                      style={{ width: `${Math.min(budget.utilization, 100)}%` }}
                    />
                  </div>

                  <div className="mt-3 text-sm text-slate-500">Utilization: {budget.utilization}%</div>

                  {budget.classificationSummaries?.length > 0 && (
                    <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5">
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">Classification breakdown</p>
                          <p className="text-sm text-slate-500">Totals by classification for this fiscal year.</p>
                        </div>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-sm text-slate-700">
                          <thead>
                            <tr>
                              <th className="border-b border-slate-200 px-3 py-3 text-xs uppercase tracking-[0.24em] text-slate-500">Classification</th>
                              <th className="border-b border-slate-200 px-3 py-3 text-xs uppercase tracking-[0.24em] text-slate-500">Total amount</th>
                              <th className="border-b border-slate-200 px-3 py-3 text-xs uppercase tracking-[0.24em] text-slate-500">Used</th>
                              <th className="border-b border-slate-200 px-3 py-3 text-xs uppercase tracking-[0.24em] text-slate-500">Remaining</th>
                              <th className="border-b border-slate-200 px-3 py-3 text-xs uppercase tracking-[0.24em] text-slate-500">Utilization</th>
                            </tr>
                          </thead>
                          <tbody>
                            {budget.classificationSummaries.map((cls) => (
                              <tr key={cls.id ?? cls.name} className="border-b border-slate-200 last:border-b-0">
                                <td className="px-3 py-3 font-medium text-slate-900">{cls.code ? `${cls.code} — ` : ''}{cls.name ?? 'Unknown'}</td>
                                <td className="px-3 py-3">{formatCurrency(cls.allocated)}</td>
                                <td className="px-3 py-3">{formatCurrency(cls.used)}</td>
                                <td className="px-3 py-3">{formatCurrency(cls.remaining)}</td>
                                <td className="px-3 py-3">{cls.utilization.toFixed(1)}%</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {budget.objectSummaries?.length > 0 && (
                    <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5">
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">Object of expenditure breakdown</p>
                          <p className="text-sm text-slate-500">Totals by object of expenditure for this fiscal year.</p>
                        </div>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-sm text-slate-700">
                          <thead>
                            <tr>
                              <th className="border-b border-slate-200 px-3 py-3 text-xs uppercase tracking-[0.24em] text-slate-500">Object</th>
                              <th className="border-b border-slate-200 px-3 py-3 text-xs uppercase tracking-[0.24em] text-slate-500">Total amount</th>
                              <th className="border-b border-slate-200 px-3 py-3 text-xs uppercase tracking-[0.24em] text-slate-500">Used</th>
                              <th className="border-b border-slate-200 px-3 py-3 text-xs uppercase tracking-[0.24em] text-slate-500">Remaining</th>
                              <th className="border-b border-slate-200 px-3 py-3 text-xs uppercase tracking-[0.24em] text-slate-500">Utilization</th>
                            </tr>
                          </thead>
                          <tbody>
                            {budget.objectSummaries.map((obj) => (
                              <tr key={obj.id ?? obj.name} className="border-b border-slate-200 last:border-b-0">
                                <td className="px-3 py-3 font-medium text-slate-900">{obj.code ? `${obj.code} — ` : ''}{obj.name ?? 'Unknown'}</td>
                                <td className="px-3 py-3">{formatCurrency(obj.allocated)}</td>
                                <td className="px-3 py-3">{formatCurrency(obj.used)}</td>
                                <td className="px-3 py-3">{formatCurrency(obj.remaining)}</td>
                                <td className="px-3 py-3">{obj.utilization.toFixed(1)}%</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">Details</h2>
            <div className="grid gap-4 xl:grid-cols-2">
              <div className="rounded-3xl bg-slate-50 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Total allocations</p>
                <p className="mt-3 text-3xl font-semibold text-slate-900">{formatCurrency(summary.totalAllocated)}</p>
                <p className="mt-2 text-sm text-slate-500">Amount assigned to all active budgets.</p>
              </div>
              <div className="rounded-3xl bg-slate-50 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Available budget</p>
                <p className="mt-3 text-3xl font-semibold text-slate-900">{formatCurrency(summary.availableBalance)}</p>
                <p className="mt-2 text-sm text-slate-500">Remaining funds after used expenses.</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </AuthGuard>
  );
}
