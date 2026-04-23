'use client';

interface AllocationRequest {
  id: number;
  title: string;
  amount: string;
  status: string;
  createdAt: string;
}

interface AllocationDetail {
  id: number;
  allocatedAmount: string;
  usedAmount?: string;
  createdAt: string;
  updatedAt: string | null;
  category?: 'ADMINISTRATIVE' | 'YOUTH';
  budget?: {
    fiscalYear?: {
      year: number;
    } | null;
  } | null;
  program?: {
    code?: string;
    name?: string;
  } | null;
  classification?: {
    code?: string;
    name?: string;
  } | null;
  object?: {
    code?: string;
    name?: string;
  } | null;
  requests?: AllocationRequest[];
}

interface BudgetAllocationDetailModalProps {
  open: boolean;
  loading: boolean;
  allocation: AllocationDetail | null;
  onClose: () => void;
}

const formatDate = (value?: string | null) => {
  if (!value) return 'N/A';
  return new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const formatCurrency = (value: string | number | undefined) => {
  const amount = Number(value ?? 0);
  if (Number.isNaN(amount)) return '₱0.00';
  return `₱${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const getUsageVariant = (percent: number) => {
  if (percent > 100) return { label: 'Exceeded budget', ring: 'ring-red-100', bg: 'bg-red-50', text: 'text-red-700' };
  if (percent >= 90) return { label: 'Nearing limit', ring: 'ring-amber-100', bg: 'bg-amber-50', text: 'text-amber-700' };
  return { label: 'Within budget', ring: 'ring-emerald-100', bg: 'bg-emerald-50', text: 'text-emerald-700' };
};

const getCategoryLabel = (category?: string) => {
  if (category === 'ADMINISTRATIVE') return 'GAP';
  if (category === 'YOUTH') return 'SKYDEP';
  return 'N/A';
};

export default function BudgetAllocationDetailModal({
  open,
  loading,
  allocation,
  onClose,
}: BudgetAllocationDetailModalProps) {
  if (!open) return null;

  const allocated = Number(allocation?.allocatedAmount ?? 0);
  const used = Number(allocation?.usedAmount ?? 0);
  const remaining = allocated - used;
  const percentUsed = allocated > 0 ? Number(((used / allocated) * 100).toFixed(0)) : 0;
  const safePercent = percentUsed > 100 ? 100 : percentUsed;
  const variant = getUsageVariant(percentUsed);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 p-4">
      <div className="mx-auto w-full max-w-5xl rounded-4xl border border-slate-200 bg-white shadow-2xl ring-1 ring-slate-950/10">
        <div className="flex flex-col gap-4 border-b border-slate-200 bg-slate-900/5 px-6 py-5 sm:flex-row sm:items-start sm:justify-between sm:px-8">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Allocation details</p>
            <h2 className="text-3xl font-semibold text-slate-950">
              {allocation?.program?.name ?? getCategoryLabel(allocation?.category)}
            </h2>
            <p className="text-sm text-slate-500">
              {allocation?.program?.code ?? 'No program code'} • {getCategoryLabel(allocation?.category)}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            Close
          </button>
        </div>

        {loading ? (
          <div className="p-10 text-center text-slate-500">Loading allocation details…</div>
        ) : (
          <div className="space-y-6 p-6 sm:p-8">
            <div className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
                <div className="flex flex-wrap items-center gap-3">
                  <span className={`rounded-2xl px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] ${variant.bg} ${variant.text}`}>{variant.label}</span>
                  <span className="text-xs uppercase tracking-[0.24em] text-slate-400">Fiscal Year</span>
                  <span className="text-sm font-semibold text-slate-700">FY {allocation?.budget?.fiscalYear?.year ?? 'N/A'}</span>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                  <div className="rounded-3xl bg-white p-5 shadow-sm">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Total Allocated</p>
                    <p className="mt-2 text-xl font-semibold text-slate-950">{formatCurrency(allocated)}</p>
                  </div>
                  <div className="rounded-3xl bg-white p-5 shadow-sm">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Amount Used</p>
                    <p className="mt-2 text-xl font-semibold text-slate-950">{formatCurrency(used)}</p>
                  </div>
                  <div className="rounded-3xl bg-white p-5 shadow-sm">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Remaining</p>
                    <p className="mt-2 text-xl font-semibold text-slate-950">{formatCurrency(remaining)}</p>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  <div className="flex items-center justify-between text-sm text-slate-500">
                    <span>Budget usage</span>
                    <span className="font-semibold text-slate-900">{percentUsed}%</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-slate-200">
                    <div className={`h-full ${variant.label === 'Within budget' ? 'bg-emerald-500' : variant.label === 'Nearing limit' ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${safePercent}%` }} />
                  </div>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-3xl bg-white p-4 shadow-sm">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Classification</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">{allocation?.classification?.code ?? '-'} — {allocation?.classification?.name ?? '-'}</p>
                  </div>
                  <div className="rounded-3xl bg-white p-4 shadow-sm">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Object</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">{allocation?.object?.code ?? '-'} — {allocation?.object?.name ?? '-'}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="space-y-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Record details</p>
                    <div className="mt-3 grid gap-3">
                      <div className="rounded-3xl bg-slate-50 p-4">
                        <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400">Created</p>
                        <p className="mt-2 text-sm font-semibold text-slate-900">{formatDate(allocation?.createdAt)}</p>
                      </div>
                      <div className="rounded-3xl bg-slate-50 p-4">
                        <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400">Updated</p>
                        <p className="mt-2 text-sm font-semibold text-slate-900">{formatDate(allocation?.updatedAt)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-3xl bg-slate-50 p-4">
                    <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400">Allocation info</p>
                    <p className="mt-3 text-sm text-slate-700">
                      Program: <span className="font-semibold text-slate-900">{allocation?.program?.name ?? 'N/A'}</span>
                    </p>
                    <p className="mt-2 text-sm text-slate-700">
                      Category: <span className="font-semibold text-slate-900">{getCategoryLabel(allocation?.category)}</span>
                    </p>
                    <p className="mt-2 text-sm text-slate-700">
                      Fiscal Year: <span className="font-semibold text-slate-900">FY {allocation?.budget?.fiscalYear?.year ?? 'N/A'}</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-950">Recent expenses</p>
                  <p className="text-sm text-slate-500">Transactions and procurement requests linked to this allocation.</p>
                </div>
              </div>

              {allocation?.requests && allocation.requests.length > 0 ? (
                <div className="mt-5 space-y-3">
                  {allocation.requests.map((request) => (
                    <div key={request.id} className="rounded-3xl bg-white p-4 shadow-sm border border-slate-200">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-900">{request.title || `Request #${request.id}`}</p>
                          <p className="text-sm text-slate-500">{formatDate(request.createdAt)}</p>
                        </div>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{request.status}</span>
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-3">
                        <p className="text-sm text-slate-600">Amount</p>
                        <p className="text-sm font-semibold text-slate-900">{formatCurrency(request.amount)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-5 rounded-3xl border border-dashed border-slate-200 bg-white/80 p-6 text-center text-sm text-slate-500">
                  No expenses or procurement requests have been recorded for this allocation yet.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
