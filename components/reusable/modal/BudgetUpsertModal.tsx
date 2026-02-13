'use client';

import {
  useEffect,
  useState,
} from 'react';

import { Wallet } from 'lucide-react';

import api from '@/components/lib/api';
import AlertModal from '@/components/reusable/modal/AlertModal';
import FlatInput from '@/components/reusable/ui/FlatInput';

interface FiscalYear {
  id: number;
  year: number;
  isActive: boolean;
}

interface BudgetUpsertModalProps {
  open: boolean;
  budgetId?: number | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function BudgetUpsertModal({
  open,
  budgetId,
  onClose,
  onSuccess,
}: BudgetUpsertModalProps) {
  const isEdit = Boolean(budgetId);

  const [fiscalYears, setFiscalYears] = useState<FiscalYear[]>([]);
  const [fiscalYearId, setFiscalYearId] = useState<number | null>(null);
  const [totalAmount, setTotalAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const [alert, setAlert] = useState<{
    open: boolean;
    type: 'success' | 'error';
    title: string;
    message: string;
  }>({
    open: false,
    type: 'success',
    title: '',
    message: '',
  });

  /* ================= RESET ================= */
  const resetState = () => {
    setFiscalYearId(null);
    setTotalAmount('');
    setLoading(false);
  };

  /* ================= LOAD FISCAL YEARS ================= */
  const loadFiscalYears = async () => {
    const res = await api.get('/fiscal-years');
    setFiscalYears(res.data?.data ?? []);
  };

  /* ================= LOAD BUDGET (EDIT) ================= */
  useEffect(() => {
    if (!open) {
      resetState();
      return;
    }

    loadFiscalYears();

    if (isEdit && budgetId) {
      api
        .get(`/budgets/${budgetId}`)
        .then((res) => {
          const b = res.data.data;
          setFiscalYearId(b.fiscalYearId);
          setTotalAmount(b.totalAmount);
        })
        .catch(() => {
          setAlert({
            open: true,
            type: 'error',
            title: 'Load Failed',
            message: 'Unable to load budget details.',
          });
        });
    }
  }, [open, isEdit, budgetId]);

  /* ================= SUBMIT ================= */
  const handleSubmit = async () => {
    if (!fiscalYearId || !totalAmount) {
      setAlert({
        open: true,
        type: 'error',
        title: 'Validation Error',
        message: 'Fiscal year and total amount are required.',
      });
      return;
    }

    setLoading(true);

    try {
      if (isEdit && budgetId) {
        await api.put(`/budgets/${budgetId}`, {
          totalAmount: Number(totalAmount),
        });
      } else {
        await api.post('/budgets', {
          fiscalYearId,
          totalAmount: Number(totalAmount),
        });
      }

      setAlert({
        open: true,
        type: 'success',
        title: isEdit ? 'Budget Updated' : 'Budget Created',
        message: isEdit
          ? 'Total budget updated successfully.'
          : 'Total budget created successfully.',
      });
    } catch (err: any) {
      setAlert({
        open: true,
        type: 'error',
        title: 'Operation Failed',
        message:
          err?.response?.data?.message ||
          'Something went wrong. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <>
      {/* ================= MODAL ================= */}
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl animate-scaleIn">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            {isEdit ? 'Update Budget' : 'Create Total Budget'}
          </h2>

          <p className="text-sm text-gray-500 mb-6">
            Set the total budget amount for a fiscal year.
          </p>

          <div className="space-y-5">
            {/* Fiscal Year */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500">
                Fiscal Year
              </label>

              <select
                value={fiscalYearId ?? ''}
                disabled={isEdit}
                onChange={(e) =>
                  setFiscalYearId(Number(e.target.value))
                }
                className="
                  w-full rounded-xl px-4 py-3 text-sm
                  bg-gray-100 text-gray-800
                  focus:bg-gray-50
                  focus:shadow-[0_0_0_2px_rgba(37,99,235,0.12)]
                  transition
                "
              >
                <option value="">Select fiscal year</option>
                {fiscalYears.map((fy) => (
                  <option key={fy.id} value={fy.id}>
                    {fy.year}
                    {fy.isActive ? ' (Active)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Total Amount */}
            <FlatInput
              label="Total Budget Amount"
              placeholder="e.g. 5,000,000"
              type="number"
              icon={Wallet}
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
            />
          </div>

          <div className="mt-8 flex justify-end gap-3">
            <button
              onClick={() => {
                resetState();
                onClose();
              }}
              disabled={loading}
              className="px-4 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition"
            >
              Cancel
            </button>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-5 py-2 rounded-lg text-sm text-white bg-blue-600 hover:bg-blue-700 transition"
            >
              {loading ? 'Saving...' : isEdit ? 'Update' : 'Create'}
            </button>
          </div>
        </div>
      </div>

      {/* ================= ALERT ================= */}
      <AlertModal
        open={alert.open}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        confirmText="OK"
        onConfirm={() => {
          setAlert({ ...alert, open: false });
          if (alert.type === 'success') {
            resetState();
            onClose();
            onSuccess();
          }
        }}
        onClose={() =>
          setAlert({ ...alert, open: false })
        }
      />
    </>
  );
}
