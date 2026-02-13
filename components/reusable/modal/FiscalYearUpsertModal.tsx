'use client';

import {
  useEffect,
  useState,
} from 'react';

import { Calendar } from 'lucide-react';

import api from '@/components/lib/api';
import AlertModal from '@/components/reusable/modal/AlertModal';
import FlatInput from '@/components/reusable/ui/FlatInput';

interface FiscalYearUpsertModalProps {
  open: boolean;
  fiscalYearId?: number | null; // null = create, number = edit
  onClose: () => void;
  onSuccess: () => void;
}

export default function FiscalYearUpsertModal({
  open,
  fiscalYearId,
  onClose,
  onSuccess,
}: FiscalYearUpsertModalProps) {
  const isEdit = !!fiscalYearId;

  const [year, setYear] = useState('');
  const [isActive, setIsActive] = useState(true);
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

  /* ---------------------------------------------
   * Reset modal state
   * -------------------------------------------*/
  const resetState = () => {
    setYear('');
    setIsActive(true);
    setLoading(false);
  };

  /* ---------------------------------------------
   * Load fiscal year (EDIT)
   * -------------------------------------------*/
  useEffect(() => {
    if (!open) {
      resetState();
      return;
    }

    if (isEdit) {
      api
        .get(`/fiscal-years/${fiscalYearId}`)
        .then((res) => {
          const fy = res.data.data;
          setYear(String(fy.year));
          setIsActive(fy.isActive);
        })
        .catch(() => {
          setAlert({
            open: true,
            type: 'error',
            title: 'Load Failed',
            message: 'Unable to load fiscal year details.',
          });
        });
    }
  }, [open, isEdit, fiscalYearId]);

  /* ---------------------------------------------
   * Submit handler (CREATE / UPDATE)
   * -------------------------------------------*/
  const handleSubmit = async () => {
    if (!year) {
      setAlert({
        open: true,
        type: 'error',
        title: 'Validation Error',
        message: 'Fiscal year is required.',
      });
      return;
    }

    setLoading(true);

    try {
      if (isEdit) {
        await api.put(`/fiscal-years/${fiscalYearId}`, {
          isActive,
        });
      } else {
        await api.post('/fiscal-years', {
          year: Number(year),
          isActive,
        });
      }

      setAlert({
        open: true,
        type: 'success',
        title: isEdit ? 'Fiscal Year Updated' : 'Fiscal Year Created',
        message: isEdit
          ? 'Fiscal year has been updated successfully.'
          : 'Fiscal year has been created successfully.',
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
            {isEdit ? 'Update Fiscal Year' : 'Create Fiscal Year'}
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Define the fiscal year and set its active status.
          </p>

          <div className="space-y-5">
            <FlatInput
              label="Fiscal Year"
              placeholder="e.g. 2026"
              type="number"
              icon={Calendar}
              value={year}
              onChange={(e) => setYear(e.target.value)}
              disabled={isEdit} // year cannot be changed on edit
            />

            <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-gray-800">
                  Active Fiscal Year
                </p>
                <p className="text-xs text-gray-500">
                  Only one fiscal year can be active
                </p>
              </div>

              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-5 w-5 accent-blue-600 cursor-pointer"
              />
            </div>
          </div>

          <div className="mt-8 flex justify-end gap-3">
            <button
              onClick={() => {
                resetState();
                onClose();
              }}
              className="px-4 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition"
              disabled={loading}
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

      {/* ================= ALERT MODAL ================= */}
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
        onClose={() => setAlert({ ...alert, open: false })}
      />

      <style jsx>{`
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-scaleIn {
          animation: scaleIn 0.18s ease-out;
        }
      `}</style>
    </>
  );
}
