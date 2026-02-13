'use client';

import {
  useEffect,
  useState,
} from 'react';

import {
  Lock,
  Mail,
  Shield,
  User,
} from 'lucide-react';

import api from '@/components/lib/api';
import AlertModal from '@/components/reusable/modal/AlertModal';
import FlatInput from '@/components/reusable/ui/FlatInput';

interface Role {
  id: number;
  name: string;
}

interface UserUpsertModalProps {
  open: boolean;
  userId?: number | null;
  roles: Role[];
  onClose: () => void;
  onSuccess: () => void;
}

const EMPTY_FORM = {
  fullName: '',
  email: '',
  password: '',
  roleId: '',
  status: 'ACTIVE',
};

const UserUpsertModal: React.FC<UserUpsertModalProps> = ({
  open,
  userId,
  roles,
  onClose,
  onSuccess,
}) => {
  const isEdit = !!userId;

  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  /* ================= RESET ON CLOSE / MODE CHANGE ================= */
  useEffect(() => {
    if (!open) {
      setForm(EMPTY_FORM);
      setLoading(false);
      setAlert(null);
    }
  }, [open]);

  /* ================= FETCH USER (EDIT MODE) ================= */
  useEffect(() => {
    if (!open || !isEdit) return;

    const fetchUser = async () => {
      try {
        const res = await api.get(`/users/${userId}`);
        const u = res.data.data;

        setForm({
          fullName: u.fullName,
          email: u.email,
          password: '',
          roleId: String(u.roleId),
          status: u.status,
        });
      } catch {
        setAlert({
          type: 'error',
          message: 'Failed to load user details.',
        });
      }
    };

    fetchUser();
  }, [open, isEdit, userId]);

  /* ================= SUBMIT ================= */
  const handleSubmit = async () => {
    if (loading) return;

    try {
      setLoading(true);

      if (isEdit) {
        await api.put(`/users/${userId}`, {
          fullName: form.fullName,
          roleId: Number(form.roleId),
          status: form.status,
        });
      } else {
        await api.post('/auth/register', {
          fullName: form.fullName,
          email: form.email,
          password: form.password,
          roleId: Number(form.roleId),
        });
      }

      // ✅ SHOW ALERT IMMEDIATELY
      setAlert({
        type: 'success',
        message: isEdit
          ? 'User updated successfully.'
          : 'User registered successfully.',
      });
    } catch (err: any) {
      setAlert({
        type: 'error',
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
        <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-2xl animate-scaleIn">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">
            {isEdit ? 'Update User' : 'Register New User'}
          </h2>

          <div className="space-y-4">
            <FlatInput
              label="Full Name"
              placeholder="Juan Dela Cruz"
              value={form.fullName}
              icon={User}
              onChange={(e) =>
                setForm({ ...form, fullName: e.target.value })
              }
            />

            {!isEdit && (
              <FlatInput
                label="Email Address"
                placeholder="user@email.com"
                type="email"
                value={form.email}
                icon={Mail}
                onChange={(e) =>
                  setForm({ ...form, email: e.target.value })
                }
              />
            )}

            {!isEdit && (
              <FlatInput
                label="Password"
                placeholder="••••••••"
                type="password"
                value={form.password}
                icon={Lock}
                onChange={(e) =>
                  setForm({ ...form, password: e.target.value })
                }
              />
            )}

            {/* ROLE */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500">
                Role
              </label>
              <div className="relative">
                <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <select
                  value={form.roleId}
                  onChange={(e) =>
                    setForm({ ...form, roleId: e.target.value })
                  }
                  className="w-full rounded-xl bg-gray-100 py-3 pl-11 pr-4 text-sm focus:bg-gray-50 focus:shadow-[0_0_0_2px_rgba(37,99,235,0.12)]"
                >
                  <option value="">Select role</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* STATUS (EDIT ONLY) */}
            {isEdit && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-500">
                  Status
                </label>
                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm({ ...form, status: e.target.value })
                  }
                  className="w-full rounded-xl bg-gray-100 py-3 px-4 text-sm focus:shadow-[0_0_0_2px_rgba(37,99,235,0.12)]"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>
            )}
          </div>

          {/* ACTIONS */}
          <div className="mt-8 flex justify-end gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100"
            >
              Cancel
            </button>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-5 py-2 rounded-lg bg-blue-700 text-sm text-white hover:bg-blue-800 shadow-md"
            >
              {loading
                ? 'Please wait...'
                : isEdit
                ? 'Update User'
                : 'Register User'}
            </button>
          </div>
        </div>
      </div>

      {/* ================= ALERT ================= */}
      <AlertModal
        open={!!alert}
        type={alert?.type}
        title={alert?.type === 'success' ? 'Success' : 'Error'}
        message={alert?.message || ''}
        confirmText="OK"
        onConfirm={() => {
          if (alert?.type === 'success') {
            setForm(EMPTY_FORM);   // ✅ reset immediately
            onSuccess();
            onClose();
          }
          setAlert(null);
        }}
        onClose={() => setAlert(null)}
      />
    </>
  );
};

export default UserUpsertModal;
