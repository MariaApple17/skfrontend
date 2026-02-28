'use client';

import React, {
  useEffect,
  useState,
} from 'react';

import {
  FileText,
  Hash,
} from 'lucide-react';

import api from '@/components/lib/api';
import AlertModal from '@/components/reusable/modal/AlertModal';
import FlatInput from '@/components/reusable/ui/FlatInput';

/* ================= TYPES ================= */
interface ObjectOfExpenditure {
  id: number;
  code: string;
  name: string;
  description?: string;
  classificationId: number; // ✅ ADDED
}

interface BudgetClassification {
  id: number;
  name: string;
}

interface ObjectOfExpenditureUpsertModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  objectId?: number | null;
}

interface FormState {
  code: string;
  name: string;
  description: string;
}

interface FormErrors {
  code?: string;
  name?: string;
  classificationId?: string; // ✅ ADDED
}

/* ================= COMPONENT ================= */
const ObjectOfExpenditureUpsertModal: React.FC<
  ObjectOfExpenditureUpsertModalProps
> = ({ open, onClose, onSuccess, objectId }) => {
  const isEdit = Boolean(objectId);

  const [form, setForm] = useState<FormState>({
    code: '',
    name: '',
    description: '',
  });

  const [classificationId, setClassificationId] = useState<string>(''); // ✅ ADDED
  const [classifications, setClassifications] = useState<BudgetClassification[]>([]); // ✅ ADDED

  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  const [alert, setAlert] = useState<{
    open: boolean;
    type: 'success' | 'error';
    message: string;
  }>({
    open: false,
    type: 'success',
    message: '',
  });

  /* ================= LOAD CLASSIFICATIONS ================= */
  useEffect(() => {
    if (!open) return;

    api.get('/classifications')
      .then((res) => {
        setClassifications(res.data.data || res.data);
      })
      .catch(() => {
        setAlert({
          open: true,
          type: 'error',
          message: 'Failed to load classifications.',
        });
      });
  }, [open]);

  /* ================= LOAD DATA (EDIT) ================= */
  useEffect(() => {
    if (!open) return;

    if (!isEdit) {
      setForm({ code: '', name: '', description: '' });
      setClassificationId('');
      setErrors({});
      return;
    }

    const fetchObject = async () => {
      try {
        const res = await api.get(
          `/objects-of-expenditure/${objectId}`
        );

        const data: ObjectOfExpenditure = res.data.data;

        setForm({
          code: data.code,
          name: data.name,
          description: data.description ?? '',
        });

        setClassificationId(String(data.classificationId)); // ✅ ADDED
      } catch (err) {
        setAlert({
          open: true,
          type: 'error',
          message: 'Failed to load object of expenditure.',
        });
      }
    };

    fetchObject();
  }, [open, isEdit, objectId]);

  /* ================= VALIDATION ================= */
  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!isEdit && !form.code.trim()) {
      newErrors.code = 'Code is required';
    }

    if (!form.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!classificationId) {
      newErrors.classificationId = 'Classification is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /* ================= SUBMIT ================= */
  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);

    try {
      if (isEdit) {
        await api.put(
          `/objects-of-expenditure/${objectId}`,
          {
            name: form.name,
            description: form.description,
            classificationId, // ✅ ADDED
          }
        );
      } else {
        await api.post('/objects-of-expenditure', {
          code: form.code,
          name: form.name,
          description: form.description,
          classificationId, // ✅ ADDED
        });
      }

      setAlert({
        open: true,
        type: 'success',
        message: `Object of expenditure ${
          isEdit ? 'updated' : 'created'
        } successfully.`,
      });
    } catch (err: any) {
      setAlert({
        open: true,
        type: 'error',
        message:
          err?.response?.data?.message ||
          'Something went wrong. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  /* ================= RENDER ================= */
  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl animate-scaleIn">
          {/* HEADER */}
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">
              {isEdit
                ? 'Update Object of Expenditure'
                : 'Create Object of Expenditure'}
            </h2>
            <p className="text-sm text-gray-500">
              Define and manage expenditure classification details
            </p>
          </div>

          {/* BODY */}
          <div className="px-6 py-5 space-y-4">
            {!isEdit && (
              <FlatInput
                label="Code"
                placeholder="e.g. OOE-001"
                value={form.code}
                onChange={(e) =>
                  setForm({ ...form, code: e.target.value })
                }
                error={errors.code}
                icon={Hash}
              />
            )}

            <FlatInput
              label="Name"
              placeholder="Office Supplies"
              value={form.name}
              onChange={(e) =>
                setForm({ ...form, name: e.target.value })
              }
              error={errors.name}
              icon={FileText}
            />

            {/* ✅ CLASSIFICATION DROPDOWN */}
            <div className="w-full space-y-1.5">
              <label className="text-xs font-medium text-gray-500">
                Classification
              </label>

              <select
                value={classificationId}
                onChange={(e) => setClassificationId(e.target.value)}
                className="w-full rounded-xl px-4 py-3 text-sm bg-gray-100"
              >
                <option value="">Select Classification</option>
                {classifications.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              {errors.classificationId && (
                <p className="text-xs text-red-500">
                  {errors.classificationId}
                </p>
              )}
            </div>

            <div className="w-full space-y-1.5">
              <label className="text-xs font-medium text-gray-500">
                Description
              </label>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Optional description"
                className="
                  w-full rounded-xl px-4 py-3 text-sm
                  bg-gray-100 text-gray-800
                  placeholder-gray-400
                  transition
                  focus:bg-gray-50
                  focus:shadow-[0_0_0_2px_rgba(37,99,235,0.12)]
                "
              />
            </div>
          </div>

          {/* FOOTER */}
          <div className="flex justify-end gap-3 px-6 py-4 border-t">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-lg text-sm border text-gray-700 hover:bg-gray-100 transition"
            >
              Cancel
            </button>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-5 py-2 rounded-lg text-sm text-white bg-blue-600 hover:bg-blue-700 transition"
            >
              {loading
                ? 'Saving...'
                : isEdit
                ? 'Update'
                : 'Create'}
            </button>
          </div>
        </div>
      </div>

      <AlertModal
        open={alert.open}
        type={alert.type}
        title={
          alert.type === 'success' ? 'Success' : 'Error'
        }
        message={alert.message}
        confirmText="OK"
        onConfirm={() => {
          setAlert({ ...alert, open: false });
          if (alert.type === 'success') {
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
};

export default ObjectOfExpenditureUpsertModal;