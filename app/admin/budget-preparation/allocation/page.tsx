'use client';

import {
  useEffect,
  useState,
} from 'react';

import {
  Layers,
  Pencil,
  Plus,
  Trash2,
  Wallet,
} from 'lucide-react';

import api from '@/components/lib/api';
import AuthGuard from '@/components/reusable/guard/AuthGuard';
import AlertModal from '@/components/reusable/modal/AlertModal';
import BudgetAllocationUpsertModal
  from '@/components/reusable/modal/BudgetAllocationUpsertModal';
import FlatSelect from '@/components/reusable/ui/FlatSelect';

/* ================= TYPES ================= */
interface BudgetAllocation {
  id: number;
  allocatedAmount: string;
  createdAt: string;

  program: { id: number; code: string; name: string };
  classification: { id: number; code: string; name: string };
  object: { id: number; code: string; name: string };
}

interface Option {
  id: number;
  label: string;
}

/* ================= CONTENT ================= */
function BudgetAllocationContent() {
  const [items, setItems] = useState<BudgetAllocation[]>([]);
  const [loading, setLoading] = useState(true);

  /* QUERY STATE */
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(9);
  const [totalPages, setTotalPages] = useState(1);

  const [sortBy, setSortBy] = useState<'createdAt' | 'allocatedAmount'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  /* FILTER STATE */
  const [budgetId, setBudgetId] = useState<number | ''>('');
  const [programId, setProgramId] = useState<number | ''>('');
  const [classificationId, setClassificationId] = useState<number | ''>('');
  const [objectId, setObjectId] = useState<number | ''>('');

  /* FILTER OPTIONS */
  const [budgets, setBudgets] = useState<Option[]>([]);
  const [programs, setPrograms] = useState<Option[]>([]);
  const [classifications, setClassifications] = useState<Option[]>([]);
  const [objects, setObjects] = useState<Option[]>([]);

  /* MODALS */
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [alertOpen, setAlertOpen] = useState(false);

  /* ================= LOAD FILTER OPTIONS ================= */
  useEffect(() => {
    Promise.all([
      api.get('/budgets'),
      api.get('/programs?isActive=true&limit=100'),
      api.get('/classifications'),
      api.get('/objects-of-expenditure?limit=100'),
    ]).then(([b, p, c, o]) => {
      setBudgets(
        b.data.data.map((x: any) => ({
          id: x.id,
          label: `FY ${x.fiscalYear?.year}`,
        }))
      );
      setPrograms(
        p.data.data.map((x: any) => ({
          id: x.id,
          label: `${x.code} — ${x.name}`,
        }))
      );
      setClassifications(
        c.data.data.map((x: any) => ({
          id: x.id,
          label: `${x.code} — ${x.name}`,
        }))
      );
      setObjects(
        o.data.data.map((x: any) => ({
          id: x.id,
          label: `${x.code} — ${x.name}`,
        }))
      );
    });
  }, []);

  /* ================= FETCH ================= */
  const fetchAllocations = async () => {
    setLoading(true);
    try {
      const res = await api.get('/budget-allocations', {
        params: {
          search: search || undefined,
          page,
          limit,
          sortBy,
          sortOrder,
          budgetId: budgetId || undefined,
          programId: programId || undefined,
          classificationId: classificationId || undefined,
          objectOfExpenditureId: objectId || undefined,
        },
      });

      setItems(res.data.data);
      setTotalPages(res.data.pagination.totalPages);
    } catch (err) {
      console.error('Failed to fetch budget allocations', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllocations();
  }, [
    search,
    page,
    sortBy,
    sortOrder,
    budgetId,
    programId,
    classificationId,
    objectId,
  ]);

  /* ================= DELETE ================= */
  const confirmDelete = async () => {
    if (!deleteId) return;
    await api.delete(`/budget-allocations/${deleteId}`);
    setAlertOpen(false);
    setDeleteId(null);
    fetchAllocations();
  };

  /* ================= UI ================= */
  return (
    <>
      {/* HEADER */}
      <div className="flex flex-col gap-4 mb-8 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-medium text-slate-700">
            Budget Allocations
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage allocation of budgets to programs and expenditures
          </p>
        </div>

        <button
          onClick={() => {
            setEditId(null);
            setModalOpen(true);
          }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-slate-700 text-white text-sm font-medium hover:bg-slate-600 transition-colors"
        >
          <Plus size={16} />
          New Allocation
        </button>
      </div>

      {/* ================= FILTERS ================= */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-8 items-end">
        {/* SEARCH */}
        <div className="md:col-span-2 space-y-1.5">
          <label className="text-xs font-medium text-transparent select-none">
            Search
          </label>

          <input
            value={search}
            onChange={e => {
              setPage(1);
              setSearch(e.target.value);
            }}
            placeholder="Search program, classification, object…"
            className="
              w-full rounded-xl px-4 py-3 text-sm
              bg-slate-50 text-slate-700
              placeholder-slate-300
              outline-none border border-slate-100
              focus:bg-white focus:border-slate-200
              transition-all
            "
          />
        </div>

        {/* BUDGET */}
        <FlatSelect
          label="Budget"
          value={String(budgetId || '')}
          options={budgets.map(b => ({
            id: b.id,
            label: b.label,
          }))}
          onChange={v => {
            setPage(1);
            setBudgetId(Number(v) || '');
          }}
        />

        {/* PROGRAM */}
        <FlatSelect
          label="Program"
          value={String(programId || '')}
          options={programs.map(p => ({
            id: p.id,
            label: p.label,
          }))}
          onChange={v => {
            setPage(1);
            setProgramId(Number(v) || '');
          }}
        />

        {/* CLASSIFICATION */}
        <FlatSelect
          label="Classification"
          value={String(classificationId || '')}
          options={classifications.map(c => ({
            id: c.id,
            label: c.label,
          }))}
          onChange={v => {
            setPage(1);
            setClassificationId(Number(v) || '');
          }}
        />

        {/* OBJECT */}
        <FlatSelect
          label="Object"
          value={String(objectId || '')}
          options={objects.map(o => ({
            id: o.id,
            label: o.label,
          }))}
          onChange={v => {
            setPage(1);
            setObjectId(Number(v) || '');
          }}
        />
      </div>

      
      {/* ================= CONTENT ================= */}
      {loading ? (
        <p className="text-sm text-slate-400">
          Loading budget allocations…
        </p>
      ) : items.length === 0 ? (
        /* EMPTY STATE */
        <div className="w-full rounded-3xl bg-white border border-slate-100 p-16 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mb-4">
            <Wallet size={24} className="text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-600 mb-1">
            No Budget Allocations
          </h3>
          <p className="text-sm text-slate-400 mb-6 max-w-sm">
            Create a budget allocation to start assigning funds to programs and expenditures.
          </p>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-slate-700 text-white text-sm font-medium hover:bg-slate-600 transition-colors"
          >
            <Plus size={16} />
            Create Allocation
          </button>
        </div>
      ) : (
        <>
          {/* GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {items.map(alloc => (
              <div
                key={alloc.id}
                className="rounded-2xl bg-white border border-slate-100 p-6 hover:border-slate-200 hover:shadow-sm transition-all"
              >
                <div className="flex justify-between items-start mb-5">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Layers size={16} className="text-slate-500" />
                    </div>
                    <div>
                      <h3 className="font-medium text-slate-700 leading-snug">
                        {alloc.program.code}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                        {alloc.program.name}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-1">
                    <button
                      onClick={() => {
                        setEditId(alloc.id);
                        setModalOpen(true);
                      }}
                      className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => {
                        setDeleteId(alloc.id);
                        setAlertOpen(true);
                      }}
                      className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 mb-4 pb-4 border-b border-slate-50">
                  <div className="text-sm text-slate-500">
                    <span className="text-slate-400 text-xs">Classification:</span>{' '}
                    <span className="text-slate-600">
                      {alloc.classification.code} — {alloc.classification.name}
                    </span>
                  </div>
                  <div className="text-sm text-slate-500">
                    <span className="text-slate-400 text-xs">Object:</span>{' '}
                    <span className="text-slate-600">
                      {alloc.object.code} — {alloc.object.name}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-slate-400">Allocated</span>
                  <span className="text-lg font-medium text-slate-700">
                    ₱{Number(alloc.allocatedAmount).toLocaleString()}
                  </span>
                </div>

                <p className="text-xs text-slate-300 mt-3">
                  {new Date(alloc.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>

          {/* PAGINATION */}
          <div className="flex justify-center gap-3 mt-10">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-sm text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
            >
              Prev
            </button>
            <span className="text-sm text-slate-400 flex items-center px-2">
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-sm text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
            >
              Next
            </button>
          </div>
        </>
      )}
      {/* MODALS */}
      <BudgetAllocationUpsertModal
        open={modalOpen}
        allocationId={editId}
        onClose={() => {
          setModalOpen(false);
          setEditId(null);
        }}
        onSuccess={fetchAllocations}
      />

      <AlertModal
        open={alertOpen}
        type="warning"
        title="Delete Budget Allocation"
        message="This allocation will be archived. Continue?"
        confirmText="Delete"
        showCancel
        onConfirm={confirmDelete}
        onClose={() => {
          setAlertOpen(false);
          setDeleteId(null);
        }}
      />
    </>
  );
}

/* ================= PAGE ================= */
export default function BudgetAllocationPage() {
  return (
    <AuthGuard>
      <BudgetAllocationContent />
    </AuthGuard>
  );
}