'use client';

import React, {
  useEffect,
  useState,
} from 'react';

import {
  FileText,
  Hash,
  Layers,
} from 'lucide-react';

import api from '@/components/lib/api';
import AlertModal from '@/components/reusable/modal/AlertModal';
import FlatInput from '@/components/reusable/ui/FlatInput';

/* ================= TYPES ================= */
interface ClassificationUpsertModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  classificationId?: number | null;
}

interface FormState {
  code: string;
  name: string;
  description: string;
}

const EMPTY_FORM: FormState = {
  code: '',
  name: '',
  description: '',
};

const ClassificationUpsertModal: React.FC<ClassificationUpsertModalProps> = ({
  open,
  onClose,
  onSuccess,
  classificationId,
}) => {
  const isEdit = typeof classificationId === 'number';

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);

  const [alert, setAlert] = useState<{
    open: boolean;
    type: 'success' | 'error';
    title: string;
    message: string;
  }>({ open: false, type: 'success', title: '', message: '' });

  /* ================= LOAD FOR EDIT ================= */
  useEffect(() => {
    if (!open) {
      setForm(EMPTY_FORM);
      return;
    }

    if (!isEdit) return;

    api.get(`/classifications/${classificationId}`)
      .then((res) => {
        const d = res.data.data;
        setForm({
          code: d.code,
          name: d.name,
          description: d.description ?? '',
        });
      })
      .catch(() => {
        setAlert({
          open: true,
          type: 'error',
          title: 'Load Failed',
          message: 'Classification not found.',
        });
      });
  }, [open, isEdit, classificationId]);

  /* ================= SUBMIT ================= */
  const handleSubmit = async () => {
    if (!form.name.trim()) {
      return setAlert({
        open: true,
        type: 'error',
        title: 'Invalid Input',
        message: 'Classification name is required.',
      });
    }

    if (!isEdit && !form.code.trim()) {
      return setAlert({
        open: true,
        type: 'error',
        title: 'Invalid Input',
        message: 'Classification code is required.',
      });
    }

    setLoading(true);

    try {
      if (isEdit) {
        await api.put(`/classifications/${classificationId}`, {
          name: form.name.trim(),
          description: form.description.trim(),
        });
      } else {
        await api.post('/classifications', {
          code: form.code.trim(),
          name: form.name.trim(),
          description: form.description.trim(),
        });
      }

      setAlert({
        open: true,
        type: 'success',
        title: 'Success',
        message: 'Classification saved successfully.',
      });
    } catch (err: any) {
      setAlert({
        open: true,
        type: 'error',
        title: 'Operation Failed',
        message:
          err?.response?.data?.message ??
          'Something went wrong.',
      });
    } finally {
      setLoading(false);
    }
  };

  /* ================= CLOSE ================= */
  const closeAlert = () => {
    setAlert((p) => ({ ...p, open: false }));
    if (alert.type === 'success') {
      onSuccess();
      onClose();
      setForm(EMPTY_FORM);
    }
  };

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl">
          {/* HEADER */}
          <div className="flex items-center gap-4 px-6 py-5 border-b">
            <div className="h-11 w-11 rounded-xl bg-blue-100 flex items-center justify-center">
              <Layers className="text-blue-600" />
            </div>
            <div>
              <h2 className="font-semibold">
                {isEdit ? 'Edit Classification' : 'Create Classification'}
              </h2>
              <p className="text-sm text-gray-500">
                Budget classification details
              </p>
            </div>
          </div>

          {/* BODY */}
          <div className="px-6 py-6 space-y-5">
            {!isEdit && (
              <FlatInput
                label="Classification Code"
                icon={Hash}
                value={form.code}
                onChange={(e) =>
                  setForm({ ...form, code: e.target.value })
                }
              />
            )}

            <FlatInput
              label="Classification Name"
              icon={Layers}
              value={form.name}
              onChange={(e) =>
                setForm({ ...form, name: e.target.value })
              }
            />

            <FlatInput
              label="Description"
              icon={FileText}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
          </div>

          {/* FOOTER */}
          <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50">
            <button
              onClick={onClose}
              className="px-4 py-2 border rounded-lg"
            >
              Cancel
            </button>
            <button
              disabled={loading}
              onClick={handleSubmit}
              className="px-5 py-2 rounded-lg bg-blue-600 text-white disabled:opacity-60"
            >
              {loading ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </div>

      <AlertModal
        open={alert.open}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        onConfirm={closeAlert}
        onClose={closeAlert}
      />
    </>
  );
};

export default ClassificationUpsertModal;