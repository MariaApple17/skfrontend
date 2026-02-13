'use client';

import {
  useEffect,
  useState,
} from 'react';

import {
  Pencil,
  Plus,
  Shield,
  Trash2,
} from 'lucide-react';

import api from '@/components/lib/api';
import AuthGuard from '@/components/reusable/guard/AuthGuard';
import AlertModal from '@/components/reusable/modal/AlertModal';
import RoleUpsertModal from '@/components/reusable/modal/RoleUpsertModal';

interface Role {
  id: number;
  name: string;
  description: string | null;
  permissions: {
    permission: {
      key: string;
      module: string;
    };
  }[];
}

function RolesContent() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editRoleId, setEditRoleId] = useState<number | null>(null);

  const [deleteRoleId, setDeleteRoleId] = useState<number | null>(null);
  const [alertOpen, setAlertOpen] = useState(false);

  /* ================= FETCH ================= */
  const fetchRoles = async () => {
    setLoading(true);
    try {
      const res = await api.get('/roles');
      setRoles(res.data?.data ?? []);
    } catch (err) {
      console.error('Failed to fetch roles', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  /* ================= DELETE ================= */
  const confirmDelete = async () => {
    if (!deleteRoleId) return;

    try {
      await api.delete(`/roles/${deleteRoleId}`);
      setAlertOpen(false);
      setDeleteRoleId(null);
      fetchRoles();
    } catch (err) {
      console.error('Delete failed', err);
    }
  };

  return (
    <>
      {/* HEADER */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Roles & Permissions
          </h1>
          <p className="text-sm text-slate-500">
            Manage system roles and access control
          </p>
        </div>

        <button
          onClick={() => {
            setEditRoleId(null);
            setModalOpen(true);
          }}
          className="
            flex items-center gap-2 px-4 py-2 rounded-xl
            bg-blue-900 text-white text-sm font-medium
            hover:bg-blue-800 transition
          "
        >
          <Plus size={16} />
          Create Role
        </button>
      </div>

      {/* CONTENT */}
      {loading ? (
        <p className="text-sm text-slate-500">Loading roles…</p>
      ) : roles.length === 0 ? (
        /* EMPTY STATE — FULL WIDTH */
        <div
          className="
            w-full
            rounded-2xl bg-white p-12
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
            <Shield className="text-blue-900" size={28} />
          </div>

          <h3 className="text-lg font-semibold text-slate-900 mb-1">
            No Roles Found
          </h3>

          <p className="text-sm text-slate-500 max-w-md mb-6">
            Roles control what users can see and do in the system.
            Create your first role to start assigning permissions.
          </p>

          <button
            onClick={() => {
              setEditRoleId(null);
              setModalOpen(true);
            }}
            className="
              flex items-center gap-2 px-4 py-2 rounded-xl
              bg-blue-900 text-white text-sm font-medium
              hover:bg-blue-800 transition
            "
          >
            <Plus size={16} />
            Create First Role
          </button>
        </div>
      ) : (
        /* GRID */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {roles.map((role) => {
            const permissionsByModule = role.permissions.reduce(
              (acc: Record<string, string[]>, p) => {
                const module = p.permission.module || 'General';
                if (!acc[module]) acc[module] = [];
                acc[module].push(p.permission.key);
                return acc;
              },
              {}
            );

            return (
              <div
                key={role.id}
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
                      <Shield className="text-blue-900" size={18} />
                    </div>

                    <div>
                      <h3 className="font-semibold text-slate-900">
                        {role.name}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {role.permissions.length} permission
                        {role.permissions.length !== 1 && 's'}
                      </p>
                    </div>
                  </div>

                  {/* ACTIONS */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditRoleId(role.id);
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
                        setDeleteRoleId(role.id);
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

                {/* DESCRIPTION */}
                {role.description && (
                  <p className="text-sm text-slate-600 mb-4">
                    {role.description}
                  </p>
                )}

                {/* PERMISSIONS */}
                <div className="mt-4">
                  <p className="text-xs font-semibold text-slate-500 mb-2">
                    Permissions
                  </p>

                  <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                    {Object.entries(permissionsByModule).map(
                      ([module, perms]) => (
                        <div
                          key={module}
                          className="rounded-xl bg-slate-50 p-3"
                        >
                          <p className="text-xs font-semibold text-blue-900 mb-2 uppercase">
                            {module}
                          </p>

                          <div className="flex flex-wrap gap-2">
                            {perms.map((key) => (
                              <span
                                key={key}
                                className="
                                  text-[11px] px-2.5 py-1 rounded-full
                                  bg-blue-900/10 text-blue-900
                                  font-medium
                                "
                              >
                                {key}
                              </span>
                            ))}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* UPSERT MODAL */}
      <RoleUpsertModal
        open={modalOpen}
        roleId={editRoleId}
        onClose={() => setModalOpen(false)}
        onSuccess={fetchRoles}
      />

      {/* DELETE CONFIRMATION */}
      <AlertModal
        open={alertOpen}
        type="warning"
        title="Delete Role"
        message="This role will be permanently removed and its permissions revoked. Continue?"
        confirmText="Delete"
        showCancel
        onConfirm={confirmDelete}
        onClose={() => {
          setAlertOpen(false);
          setDeleteRoleId(null);
        }}
      />
    </>
  );
}

/* ================= AUTH GUARD ================= */
export default function RolesPage() {
  return (
    <AuthGuard>
      <RolesContent />
    </AuthGuard>
  );
}
