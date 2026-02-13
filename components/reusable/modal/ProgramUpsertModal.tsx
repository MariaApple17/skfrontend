'use client';

import {
  useEffect,
  useState,
} from 'react';

import {
  Calendar,
  Layers,
  Users,
} from 'lucide-react';

import api from '@/components/lib/api';
import AlertModal from '@/components/reusable/modal/AlertModal';
import FlatInput from '@/components/reusable/ui/FlatInput';

/* ================= TYPES ================= */
interface Program {
  code?: string;
  name?: string;
  description?: string;
  committeeInCharge?: string;
  beneficiaries?: string;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
}

interface ProgramUpsertModalProps {
  open: boolean;
  programId?: number | null;
  onClose: () => void;
  onSuccess: () => void;
}

/* ================= CONSTANTS ================= */
const EMPTY_FORM = {
  code: '',
  name: '',
  description: '',
  committeeInCharge: '',
  beneficiaries: '',
  startDate: '',
  endDate: '',
  isActive: false, // default inactive
};

export default function ProgramUpsertModal({
  open,
  programId,
  onClose,
  onSuccess,
}: ProgramUpsertModalProps) {
  const isEdit = Boolean(programId);

  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);

  const [alert, setAlert] = useState<{
    open: boolean;
    type: 'success' | 'error';
    message: string;
  }>({ open: false, type: 'success', message: '' });

  /* ================= RESET ================= */
  const resetAll = () => {
    setForm(EMPTY_FORM);
    setLoading(false);
  };

  /* ================= LOAD EDIT ================= */
  useEffect(() => {
    if (!open) return;

    resetAll();

    if (!programId) return;

    (async () => {
      try {
        const res = await api.get(`/programs/${programId}`);
        const d: Program = res.data.data;

        setForm({
          code: d.code ?? '',
          name: d.name ?? '',
          description: d.description ?? '',
          committeeInCharge: d.committeeInCharge ?? '',
          beneficiaries: d.beneficiaries ?? '',
          startDate: d.startDate?.slice(0, 10) ?? '',
          endDate: d.endDate?.slice(0, 10) ?? '',
          isActive: d.isActive ?? false,
        });
      } catch {
        setAlert({
          open: true,
          type: 'error',
          message: 'Failed to load program data.',
        });
      }
    })();
  }, [open, programId]);

  /* ================= VALIDATION ================= */
  const isInvalid =
    !form.name ||
    !form.committeeInCharge ||
    !form.beneficiaries ||
    !form.startDate ||
    !form.endDate ||
    (!isEdit && !form.code) ||
    form.endDate < form.startDate;

  /* ================= SUBMIT ================= */
  const handleSubmit = async () => {
    if (loading || isInvalid) return;

    setLoading(true);

    try {
      const payload: any = {
        name: form.name,
        description: form.description,
        committeeInCharge: form.committeeInCharge,
        beneficiaries: form.beneficiaries,
        startDate: form.startDate,
        endDate: form.endDate,
        isActive: form.isActive,
      };

      if (!isEdit) {
        payload.code = form.code;
      }

      isEdit
        ? await api.put(`/programs/${programId}`, payload)
        : await api.post('/programs', payload);

      setAlert({
        open: true,
        type: 'success',
        message: isEdit
          ? 'Program updated successfully.'
          : 'Program created successfully.',
      });

      onSuccess();
    } catch (err: any) {
      setAlert({
        open: true,
        type: 'error',
        message:
          err?.response?.data?.message ?? 'Unable to save program.',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <>
      {/* BACKDROP */}
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <div className="w-full max-w-3xl rounded-2xl bg-white shadow-xl animate-scaleIn">
          {/* HEADER */}
          <div className="px-6 pt-6 pb-4 border-b border-slate-100">
            <h2 className="text-xl font-semibold text-slate-900">
              {isEdit ? 'Update Program' : 'Create Program'}
            </h2>
            <p className="text-sm text-slate-500">
              Program images are managed separately as documentation
            </p>
          </div>

          {/* BODY */}
          <div className="px-6 py-5 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {!isEdit && (
                <FlatInput
                  label="Program Code"
                  value={form.code}
                  onChange={(e) =>
                    setForm({ ...form, code: e.target.value })
                  }
                />
              )}

              <FlatInput
                label="Program Name"
                value={form.name}
                onChange={(e) =>
                  setForm({ ...form, name: e.target.value })
                }
              />

              <FlatInput
                label="Committee In Charge"
                icon={Layers}
                value={form.committeeInCharge}
                onChange={(e) =>
                  setForm({
                    ...form,
                    committeeInCharge: e.target.value,
                  })
                }
              />

              <FlatInput
                label="Beneficiaries"
                icon={Users}
                value={form.beneficiaries}
                onChange={(e) =>
                  setForm({
                    ...form,
                    beneficiaries: e.target.value,
                  })
                }
              />

              <FlatInput
                type="date"
                label="Start Date"
                icon={Calendar}
                value={form.startDate}
                onChange={(e) =>
                  setForm({
                    ...form,
                    startDate: e.target.value,
                  })
                }
              />

              <FlatInput
                type="date"
                label="End Date"
                icon={Calendar}
                value={form.endDate}
                onChange={(e) =>
                  setForm({
                    ...form,
                    endDate: e.target.value,
                  })
                }
              />
            </div>

            {/* DESCRIPTION */}
            <textarea
              rows={3}
              value={form.description}
              placeholder="Program description (optional)"
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              className="w-full rounded-xl bg-gray-100 px-4 py-3 text-sm"
            />

            {/* STATUS TOGGLE */}
            <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-slate-900">
                  Program Status
                </p>
                <p className="text-xs text-slate-500">
                  {form.isActive ? 'Active' : 'Inactive'}
                </p>
              </div>

              <button
                type="button"
                aria-pressed={form.isActive}
                onClick={() =>
                  setForm({ ...form, isActive: !form.isActive })
                }
                className={`
                  relative inline-flex h-6 w-11 items-center rounded-full
                  transition-colors duration-200
                  focus:outline-none focus:ring-2 focus:ring-blue-500/40
                  ${form.isActive ? 'bg-blue-600' : 'bg-slate-300'}
                `}
              >
                <span
                  className={`
                    absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white
                    shadow transition-transform duration-200
                    ${form.isActive ? 'translate-x-5' : 'translate-x-0'}
                  `}
                />
              </button>
            </div>

            {/* INFO */}
            <p className="text-xs text-slate-500">
              📌 Program images are uploaded separately under program
              documentation.
            </p>
          </div>

          {/* FOOTER */}
          <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100">
            <button
              onClick={() => {
                resetAll();
                onClose();
              }}
              className="px-4 py-2 rounded-lg text-sm text-slate-600"
            >
              Cancel
            </button>

            <button
              onClick={handleSubmit}
              disabled={loading || isInvalid}
              className={`px-5 py-2 rounded-lg text-sm text-white ${
                loading || isInvalid
                  ? 'bg-slate-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {loading ? 'Saving…' : 'Save Program'}
            </button>
          </div>
        </div>
      </div>

      {/* ALERT */}
      <AlertModal
        open={alert.open}
        type={alert.type}
        message={alert.message}
        confirmText="OK"
        onConfirm={() => {
          setAlert({ ...alert, open: false });
          resetAll();
          onClose();
        }}
        onClose={() => {
          setAlert({ ...alert, open: false });
          resetAll();
          onClose();
        }}
      />

      <style jsx>{`
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.97);
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
