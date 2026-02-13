'use client';

import {
  useEffect,
  useState,
} from 'react';

import { ShieldCheck } from 'lucide-react';

import api from '@/components/lib/api';
import AlertModal from '@/components/reusable/modal/AlertModal';
import FlatInput from '@/components/reusable/ui/FlatInput';

interface Permission {
  id: number;
  key: string;
  module: string;
}

interface RoleUpsertModalProps {
  open: boolean;
  roleId?: number | null;
  onClose: () => void;
  onSuccess?: () => void;
}

const RoleUpsertModal: React.FC<RoleUpsertModalProps> = ({
  open,
  roleId,
  onClose,
  onSuccess,
}) => {
  const isEdit = !!roleId;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const [alert, setAlert] = useState({
    open: false,
    type: 'success' as 'success' | 'error',
    title: '',
    message: '',
  });

  /* ================= LOAD DATA ================= */
  useEffect(() => {
    if (!open) return;

    setName('');
    setDescription('');
    setSelected([]);

    const load = async () => {
      try {
        // ✅ FETCH ALL AVAILABLE PERMISSIONS
        const permsRes = await api.get('/permissions');
        setPermissions(permsRes.data.data);

        // ✅ LOAD ROLE DATA (EDIT MODE)
        if (isEdit && roleId) {
          const roleRes = await api.get(`/roles/${roleId}`);

          setName(roleRes.data.data.name);
          setDescription(roleRes.data.data.description ?? '');

          setSelected(
            roleRes.data.data.permissions.map(
              (p: any) => p.permission.key
            )
          );
        }
      } catch {
        setAlert({
          open: true,
          type: 'error',
          title: 'Load Failed',
          message: 'Unable to load role or permissions.',
        });
      }
    };

    load();
  }, [open, roleId, isEdit]);

  /* ================= TOGGLE ================= */
  const togglePermission = (key: string) => {
    setSelected((prev) =>
      prev.includes(key)
        ? prev.filter((k) => k !== key)
        : [...prev, key]
    );
  };

  /* ================= SUBMIT ================= */
  const handleSubmit = async () => {
    if (!name.trim()) {
      setAlert({
        open: true,
        type: 'error',
        title: 'Validation Error',
        message: 'Role name is required.',
      });
      return;
    }

    setLoading(true);

    try {
      // ✅ IMPORTANT:
      // Empty array = ALL permissions (backend behavior)
      const payload: any = {
        name,
        description,
      };

      if (selected.length > 0) {
        payload.permissions = selected;
      } else {
        payload.permissions = []; // explicit ALL
      }

      if (isEdit && roleId) {
        await api.put(`/roles/${roleId}`, payload);
      } else {
        await api.post('/roles', payload);
      }

      setAlert({
        open: true,
        type: 'success',
        title: isEdit ? 'Role Updated' : 'Role Created',
        message: 'Changes have been saved successfully.',
      });

      onSuccess?.();
    } catch (err: any) {
      setAlert({
        open: true,
        type: 'error',
        title: 'Save Failed',
        message:
          err?.response?.data?.message ??
          'Something went wrong while saving.',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  /* ================= GROUP BY MODULE ================= */
  const grouped = permissions.reduce<Record<string, Permission[]>>(
    (acc, p) => {
      acc[p.module] ||= [];
      acc[p.module].push(p);
      return acc;
    },
    {}
  );

  return (
    <>
      {/* MODAL */}
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl">
          {/* HEADER */}
          <div className="flex items-center gap-3 px-6 py-4">
            <div className="w-10 h-10 rounded-xl bg-blue-900/10 flex items-center justify-center">
              <ShieldCheck className="text-blue-900" />
            </div>

            <div>
              <h2 className="text-lg font-semibold">
                {isEdit ? 'Update Role' : 'Create Role'}
              </h2>
              <p className="text-xs text-slate-500">
                Define role details and permissions
              </p>
            </div>
          </div>

          {/* BODY */}
          <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <FlatInput
                label="Role Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />

              <FlatInput
                label="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* PERMISSIONS */}
            <div className="space-y-4">
              {Object.entries(grouped).map(([module, perms]) => (
                <div key={module} className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold text-blue-900 mb-3 uppercase">
                    {module.replaceAll('_', ' ')}
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    {perms.map((p) => {
                      const active = selected.includes(p.key);

                      return (
                        <button
                          key={p.key}
                          onClick={() => togglePermission(p.key)}
                          className={`px-3 py-2 rounded-lg text-sm transition ${
                            active
                              ? 'bg-blue-900 text-white'
                              : 'bg-white text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {p.key}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              <p className="text-xs text-slate-500">
                Leaving permissions empty assigns{' '}
                <span className="font-semibold">ALL permissions</span>.
              </p>
            </div>
          </div>

          {/* FOOTER */}
          <div className="flex justify-end gap-3 px-6 py-4">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-lg bg-slate-100"
            >
              Cancel
            </button>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-5 py-2 text-sm rounded-lg bg-blue-900 text-white"
            >
              {loading ? 'Saving…' : 'Save Role'}
            </button>
          </div>
        </div>
      </div>

      {/* ALERT */}
      <AlertModal
        open={alert.open}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        confirmText="OK"
        onConfirm={() => {
          setAlert({ ...alert, open: false });
          if (alert.type === 'success') onClose();
        }}
        onClose={() => setAlert({ ...alert, open: false })}
      />
    </>
  );
};

export default RoleUpsertModal;
