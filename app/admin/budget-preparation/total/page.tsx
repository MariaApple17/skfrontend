'use client';

import {
  useEffect,
  useState,
} from 'react';

import {
  CheckCircle,
  Pencil,
  Plus,
  Trash2,
  Wallet,
} from 'lucide-react';

import api from '@/components/lib/api';
import AuthGuard from '@/components/reusable/guard/AuthGuard';
import AlertModal from '@/components/reusable/modal/AlertModal';
import BudgetUpsertModal from '@/components/reusable/modal/BudgetUpsertModal';

interface Budget {
  id: number;
  fiscalYearId: number;
  totalAmount: string;
  createdAt: string;
  deletedAt: string | null;
  fiscalYear: {
    id: number;
    year: number;
    isActive: boolean;
  };
}

function BudgetContent() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [alertOpen, setAlertOpen] = useState(false);

  /* ================= FETCH ================= */
  const fetchBudgets = async () => {
    setLoading(true);
    try {
      const res = await api.get('/budgets');
      setBudgets(res.data?.data ?? []);
    } catch (err) {
      console.error('Failed to fetch budgets', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, []);

  /* ================= DELETE ================= */
  const confirmDelete = async () => {
    if (!deleteId) return;

    try {
      await api.delete(`/budgets/${deleteId}`);
      setAlertOpen(false);
      setDeleteId(null);
      fetchBudgets();
    } catch (err) {
      console.error('Delete failed', err);
    }
  };

  /* ================= FORMAT ================= */
  const formatAmount = (value: string) => {
    return Number(value).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <>
      {/* ================= HEADER ================= */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Budgets
          </h1>
          <p className="text-sm text-slate-500">
            Manage total budgets per fiscal year
          </p>
        </div>

        <button
          onClick={() => {
            setEditId(null);
            setModalOpen(true);
          }}
          className="
            flex items-center gap-2 px-4 py-2 rounded-xl
            bg-blue-900 text-white text-sm font-medium
            hover:bg-blue-800 transition
          "
        >
          <Plus size={16} />
          Create Budget
        </button>
      </div>

      {/* ================= CONTENT ================= */}
      {loading ? (
        <p className="text-sm text-slate-500">
          Loading budgets…
        </p>
      ) : budgets.length === 0 ? (
        /* EMPTY STATE */
        <div
          className="
            w-full rounded-2xl bg-white p-12
            shadow-lg shadow-slate-200/60
            flex flex-col items-center justify-center
            text-center
          "
        >
          <div
            className="
              w-16 h-16 rounded-2xl
              bg-blue-900/10
              flex items-center justify-center
              mb-5
            "
          >
            <Wallet className="text-blue-900" size={28} />
          </div>

          <h3 className="text-lg font-semibold text-slate-900 mb-1">
            No Budgets Found
          </h3>

          <p className="text-sm text-slate-500 max-w-md mb-6">
            Budgets define the total funds allocated per fiscal year.
            Create one to begin allocations.
          </p>

          <button
            onClick={() => {
              setEditId(null);
              setModalOpen(true);
            }}
            className="
              flex items-center gap-2 px-4 py-2 rounded-xl
              bg-blue-900 text-white text-sm font-medium
              hover:bg-blue-800 transition
            "
          >
            <Plus size={16} />
            Create First Budget
          </button>
        </div>
      ) : (
        /* GRID */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {budgets.map((budget) => (
            <div
              key={budget.id}
              className="
                rounded-2xl bg-white p-5
                shadow-lg shadow-slate-200/60
                hover:shadow-xl hover:-translate-y-0.5
                transition-all duration-200
              "
            >
              {/* CARD HEADER */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="
                      w-10 h-10 rounded-xl
                      bg-blue-900/10
                      flex items-center justify-center
                    "
                  >
                    <Wallet className="text-blue-900" size={18} />
                  </div>

                  <div>
                    <h3 className="font-semibold text-slate-900">
                      PHP {formatAmount(budget.totalAmount)}
                    </h3>

                    <p className="text-xs text-slate-500">
                      Fiscal Year {budget.fiscalYear.year}
                    </p>

                    {budget.fiscalYear.isActive && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <CheckCircle
                          size={14}
                          className="text-green-600"
                        />
                        <span className="text-xs font-medium text-green-700">
                          Active Fiscal Year
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* ACTIONS */}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditId(budget.id);
                      setModalOpen(true);
                    }}
                    className="
                      p-2 rounded-lg
                      text-blue-900
                      hover:bg-blue-900/10
                      transition
                    "
                  >
                    <Pencil size={16} />
                  </button>

                  <button
                    onClick={() => {
                      setDeleteId(budget.id);
                      setAlertOpen(true);
                    }}
                    className="
                      p-2 rounded-lg
                      text-red-600
                      hover:bg-red-600/10
                      transition
                    "
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* META */}
              <p className="text-xs text-slate-500">
                Created:{' '}
                {new Date(budget.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* ================= UPSERT MODAL ================= */}
      <BudgetUpsertModal
        open={modalOpen}
        budgetId={editId}
        onClose={() => {
          setModalOpen(false);
          setEditId(null);
        }}
        onSuccess={fetchBudgets}
      />

      {/* ================= DELETE CONFIRM ================= */}
      <AlertModal
        open={alertOpen}
        type="warning"
        title="Delete Budget"
        message="This budget will be archived and cannot be used for allocations. Continue?"
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

/* ================= AUTH GUARD ================= */
export default function BudgetPage() {
  return (
    <AuthGuard>
      <BudgetContent />
    </AuthGuard>
  );
}
