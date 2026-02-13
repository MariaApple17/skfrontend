'use client';

import React, {
  ChangeEvent,
  useEffect,
  useState,
} from 'react';

import {
  Upload,
  X,
} from 'lucide-react';

import api from '@/components/lib/api';
import AlertModal from '@/components/reusable/modal/AlertModal';
import FlatInput from '@/components/reusable/ui/FlatInput';
import FlatSelect from '@/components/reusable/ui/FlatSelect';

/* ================= TYPES ================= */

type Gender = 'MALE' | 'FEMALE' | 'OTHER';

interface FiscalYear {
  id: number;
  year: number;
  isActive: boolean;
}

interface SKOfficial {
  id?: number;
  fiscalYearId: number;
  position: string;
  fullName: string;
  responsibility?: string | null;
  birthDate: string;
  email?: string | null;
  gender: Gender;
  isActive?: boolean;
  profileImageUrl?: string | null;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: SKOfficial | null;
}

/* ================= CONSTANTS ================= */

const GENDER_OPTIONS = [
  { id: 'MALE', label: 'Male' },
  { id: 'FEMALE', label: 'Female' },
  { id: 'OTHER', label: 'Other' },
] as const;

const SK_POSITION_OPTIONS = [
  { id: 'SK Chairperson', label: 'SK Chairperson' },
  { id: 'SK Vice Chairperson', label: 'SK Vice Chairperson' },
  { id: 'SK Secretary', label: 'SK Secretary' },
  { id: 'SK Treasurer', label: 'SK Treasurer' },
  { id: 'SK Councilor', label: 'SK Councilor' },
  { id: 'SK Auditor', label: 'SK Auditor' },
  { id: 'SK PRO', label: 'SK PRO (Public Relations Officer)' },
];

/* ================= COMPONENT ================= */

const UpsertSKOfficialModal: React.FC<Props> = ({
  open,
  onClose,
  onSuccess,
  initialData,
}) => {
  const isEdit = Boolean(initialData?.id);

  const [activeFiscalYear, setActiveFiscalYear] =
    useState<FiscalYear | null>(null);

  const [form, setForm] = useState({
    fiscalYearId: 0,
    position: '',
    fullName: '',
    responsibility: '',
    birthDate: '',
    email: '',
    gender: 'MALE' as Gender,
    isActive: true,
  });

  const [image, setImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const [alert, setAlert] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  /* ================= RESET ================= */

  const resetState = () => {
    setImage(null);
    setAlert(null);
    setForm({
      fiscalYearId: activeFiscalYear?.id ?? 0,
      position: '',
      fullName: '',
      responsibility: '',
      birthDate: '',
      email: '',
      gender: 'MALE',
      isActive: true,
    });
  };

  /* ================= FETCH ACTIVE FISCAL YEAR ================= */

  useEffect(() => {
    if (!open) return;

    const fetchActiveFiscalYear = async () => {
      try {
        const res = await api.get('/fiscal-years');
        const years: FiscalYear[] = res.data?.data ?? [];
        const active = years.find(y => y.isActive) ?? null;

        setActiveFiscalYear(active);

        if (active && !isEdit) {
          setForm(prev => ({
            ...prev,
            fiscalYearId: active.id,
          }));
        }
      } catch (err: any) {
        setAlert({
          type: 'error',
          message:
            err?.response?.data?.message ??
            'Unable to load fiscal year',
        });
      }
    };

    fetchActiveFiscalYear();
  }, [open, isEdit]);

  /* ================= LOAD EDIT DATA ================= */

  useEffect(() => {
    if (!initialData) return;

    setForm({
      fiscalYearId: initialData.fiscalYearId,
      position: initialData.position,
      fullName: initialData.fullName,
      responsibility: initialData.responsibility ?? '',
      birthDate: initialData.birthDate
        ? initialData.birthDate.slice(0, 10)
        : '',
      email: initialData.email ?? '',
      gender: initialData.gender,
      isActive: initialData.isActive ?? true,
    });
  }, [initialData]);

  if (!open) return null;

  /* ================= HANDLERS ================= */

  const handleInputChange =
    (key: keyof typeof form) =>
    (e: ChangeEvent<HTMLInputElement>) => {
      setForm(prev => ({
        ...prev,
        [key]: e.target.value,
      }));
    };

  const handleImageChange = (
    e: ChangeEvent<HTMLInputElement>
  ) => {
    setImage(e.target.files?.[0] ?? null);
  };

  /* ================= PAYLOAD ================= */

  const buildPayload = () => {
    const payload = new FormData();

    payload.append('fiscalYearId', String(form.fiscalYearId));
    payload.append('position', form.position);
    payload.append('fullName', form.fullName);
    payload.append('gender', form.gender);

    if (form.responsibility) {
      payload.append('responsibility', form.responsibility);
    }

    if (form.email) {
      payload.append('email', form.email);
    }

    if (form.birthDate) {
      payload.append(
        'birthDate',
        new Date(form.birthDate).toISOString()
      );
    }

    if (image) {
      payload.append('profileImage', image);
    }

    return payload;
  };

  /* ================= SUBMIT ================= */

  const submit = async () => {
    if (!form.fiscalYearId || !form.position) {
      setAlert({
        type: 'error',
        message: 'Fiscal year and position are required.',
      });
      return;
    }

    setLoading(true);

    try {
      const payload = buildPayload();

      isEdit && initialData?.id
        ? await api.put(
            `/sk-officials/${initialData.id}`,
            payload
          )
        : await api.post('/sk-officials', payload);

      setAlert({
        type: 'success',
        message: 'Saved successfully',
      });

      setTimeout(() => {
        resetState();
        setAlert(null);
        onSuccess();
        onClose();
      }, 700);
    } catch (err: any) {
      setAlert({
        type: 'error',
        message:
          err?.response?.data?.message ??
          'Request failed',
      });
    } finally {
      setLoading(false);
    }
  };

  /* ================= RENDER ================= */

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <div>
              <h2 className="text-lg font-semibold text-blue-700">
                {isEdit ? 'Update SK Official' : 'Add SK Official'}
              </h2>
              <p className="text-xs text-slate-500">
                Fiscal Year: {activeFiscalYear?.year ?? '—'}
              </p>
            </div>

            <button
              onClick={() => {
                resetState();
                onClose();
              }}
            >
              <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <FlatInput
              label="Full Name"
              value={form.fullName}
              onChange={handleInputChange('fullName')}
              required
            />

            {/* ✅ POSITION AS DROPDOWN */}
            <FlatSelect
              label="Position"
              value={form.position}
              options={SK_POSITION_OPTIONS}
              placeholder="Select position"
              onChange={(value: string) =>
                setForm(prev => ({
                  ...prev,
                  position: value,
                }))
              }
            />

            <FlatInput
              label="Birth Date"
              type="date"
              value={form.birthDate}
              onChange={handleInputChange('birthDate')}
              required
            />

            <FlatSelect
              label="Gender"
              value={form.gender}
              options={GENDER_OPTIONS as any}
              onChange={(value: string) =>
                setForm(prev => ({
                  ...prev,
                  gender: value as Gender,
                }))
              }
            />

            <FlatInput
              label="Email (optional)"
              type="email"
              value={form.email}
              onChange={handleInputChange('email')}
            />

            <FlatInput
              label="Responsibility"
              value={form.responsibility}
              onChange={handleInputChange('responsibility')}
            />

            <div className="col-span-full">
              <label className="text-xs font-medium text-gray-500">
                Profile Image (optional)
              </label>

              <label className="mt-1 flex items-center gap-2 px-4 py-3 rounded-xl bg-gray-100 cursor-pointer hover:bg-gray-50 transition">
                <Upload className="w-4 h-4 text-blue-700" />
                <span className="text-sm text-gray-600">
                  {image ? image.name : 'Upload image'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handleImageChange}
                />
              </label>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 px-6 py-4 border-t">
            <button
              onClick={() => {
                resetState();
                onClose();
              }}
              className="px-4 py-2 rounded-lg text-sm border hover:bg-gray-100"
            >
              Cancel
            </button>

            <button
              onClick={submit}
              disabled={loading || !activeFiscalYear}
              className="px-5 py-2 rounded-lg text-sm text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>

      <AlertModal
        open={!!alert}
        type={alert?.type}
        title={alert?.type === 'success' ? 'Success' : 'Error'}
        message={alert?.message ?? ''}
        confirmText="OK"
        onConfirm={() => setAlert(null)}
        onClose={() => setAlert(null)}
      />
    </>
  );
};

export default UpsertSKOfficialModal;
