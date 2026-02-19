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
  const [administrativeAmount, setAdministrativeAmount] = useState('');
  const [youthAmount, setYouthAmount] = useState('');
  const [isTotalManuallySet, setIsTotalManuallySet] = useState(false);
  const [lastEditedSplit, setLastEditedSplit] = useState<
    'administrative' | 'youth' | null
  >(null);
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
    setAdministrativeAmount('');
    setYouthAmount('');
    setIsTotalManuallySet(false);
    setLastEditedSplit(null);
    setLoading(false);
  };

  const toNonNegativeNumber = (value: string) => {
    const parsed = Number(value);
    if (Number.isNaN(parsed) || parsed < 0) return null;
    return parsed;
  };

  const handleTotalAmountChange = (value: string) => {
    setTotalAmount(value);
    setIsTotalManuallySet(value !== '');

    const total = toNonNegativeNumber(value);
    if (total === null) {
      if (value === '') setIsTotalManuallySet(false);
      return;
    }

    const administrative = toNonNegativeNumber(administrativeAmount) ?? 0;
    const youth = toNonNegativeNumber(youthAmount) ?? 0;

    if (lastEditedSplit === 'administrative') {
      const nextAdmin = Math.min(administrative, total);
      setAdministrativeAmount(String(nextAdmin));
      setYouthAmount(String(Math.max(total - nextAdmin, 0)));
      return;
    }

    if (lastEditedSplit === 'youth') {
      const nextYouth = Math.min(youth, total);
      setYouthAmount(String(nextYouth));
      setAdministrativeAmount(String(Math.max(total - nextYouth, 0)));
      return;
    }

    if (administrativeAmount !== '' && youthAmount === '') {
      const nextAdmin = Math.min(administrative, total);
      setAdministrativeAmount(String(nextAdmin));
      setYouthAmount(String(Math.max(total - nextAdmin, 0)));
      return;
    }

    if (youthAmount !== '' && administrativeAmount === '') {
      const nextYouth = Math.min(youth, total);
      setYouthAmount(String(nextYouth));
      setAdministrativeAmount(String(Math.max(total - nextYouth, 0)));
    }
  };

  const handleAdministrativeAmountChange = (value: string) => {
    setLastEditedSplit('administrative');

    if (value === '') {
      setAdministrativeAmount('');

      if (!isTotalManuallySet) {
        const youth = toNonNegativeNumber(youthAmount) ?? 0;
        setTotalAmount(youth ? String(youth) : '');
      }
      return;
    }

    const administrative = toNonNegativeNumber(value);
    if (administrative === null) return;

    if (isTotalManuallySet && totalAmount !== '') {
      const total = toNonNegativeNumber(totalAmount) ?? 0;
      const cappedAdministrative = Math.min(administrative, total);
      setAdministrativeAmount(String(cappedAdministrative));
      setYouthAmount(String(Math.max(total - cappedAdministrative, 0)));
      return;
    }

    setAdministrativeAmount(String(administrative));
    const youth = toNonNegativeNumber(youthAmount) ?? 0;
    setTotalAmount(String(administrative + youth));
  };

  const handleYouthAmountChange = (value: string) => {
    setLastEditedSplit('youth');

    if (value === '') {
      setYouthAmount('');

      if (!isTotalManuallySet) {
        const administrative = toNonNegativeNumber(administrativeAmount) ?? 0;
        setTotalAmount(administrative ? String(administrative) : '');
      }
      return;
    }

    const youth = toNonNegativeNumber(value);
    if (youth === null) return;

    if (isTotalManuallySet && totalAmount !== '') {
      const total = toNonNegativeNumber(totalAmount) ?? 0;
      const cappedYouth = Math.min(youth, total);
      setYouthAmount(String(cappedYouth));
      setAdministrativeAmount(String(Math.max(total - cappedYouth, 0)));
      return;
    }

    setYouthAmount(String(youth));
    const administrative = toNonNegativeNumber(administrativeAmount) ?? 0;
    setTotalAmount(String(administrative + youth));
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
          setTotalAmount(String(b.totalAmount ?? ''));
          setAdministrativeAmount(String(b.administrativeAmount ?? ''));
          setYouthAmount(String(b.youthAmount ?? ''));
          setIsTotalManuallySet(true);
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
    if (
      !fiscalYearId ||
      totalAmount === '' ||
      administrativeAmount === '' ||
      youthAmount === ''
    ) {
      setAlert({
        open: true,
        type: 'error',
        title: 'Validation Error',
        message:
          'Fiscal year, total amount, administrative amount, and youth amount are required.',
      });
      return;
    }

    const total = Number(totalAmount);
    const administrative = Number(administrativeAmount);
    const youth = Number(youthAmount);

    if ([total, administrative, youth].some((x) => Number.isNaN(x) || x < 0)) {
      setAlert({
        open: true,
        type: 'error',
        title: 'Validation Error',
        message: 'Budget amounts must be valid non-negative numbers.',
      });
      return;
    }

    if (administrative + youth !== total) {
      setAlert({
        open: true,
        type: 'error',
        title: 'Validation Error',
        message:
          'Administrative amount plus youth amount must exactly equal total amount.',
      });
      return;
    }

    setLoading(true);

    try {
      if (isEdit && budgetId) {
        await api.put(`/budgets/${budgetId}`, {
          totalAmount: total,
          administrativeAmount: administrative,
          youthAmount: youth,
        });
      } else {
        await api.post('/budgets', {
          fiscalYearId,
          totalAmount: total,
          administrativeAmount: administrative,
          youthAmount: youth,
        });
      }

      setAlert({
        open: true,
        type: 'success',
        title: isEdit ? 'Budget Updated' : 'Budget Created',
        message: isEdit
          ? 'Budget split updated successfully.'
          : 'Budget split created successfully.',
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
            Set the total budget and category split for a fiscal year.
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
              onChange={(e) => handleTotalAmountChange(e.target.value)}
            />

            <FlatInput
              label="Administrative Amount"
              placeholder="e.g. 2,000,000"
              type="number"
              icon={Wallet}
              value={administrativeAmount}
              onChange={(e) =>
                handleAdministrativeAmountChange(e.target.value)
              }
            />

            <FlatInput
              label="Youth Amount"
              placeholder="e.g. 3,000,000"
              type="number"
              icon={Wallet}
              value={youthAmount}
              onChange={(e) => handleYouthAmountChange(e.target.value)}
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
