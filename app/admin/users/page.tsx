'use client';

import {
  useEffect,
  useState,
} from 'react';

import {
  ChevronLeft,
  ChevronRight,
  Pencil,
  Plus,
  Power,
  Trash2,
  User,
} from 'lucide-react';

import api from '@/components/lib/api';
import AuthGuard from '@/components/reusable/guard/AuthGuard';
import AlertModal from '@/components/reusable/modal/AlertModal';
import UserUpsertModal from '@/components/reusable/modal/UserUpsertModal';

/* ================= TYPES ================= */

interface Role {
  id: number;
  name: string;
}

interface UserItem {
  id: number;
  email: string;
  fullName: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  role: Role;
}

interface CurrentUser {
  fullName: string;
  email: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  role: { name: string };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/* ================= PAGE ================= */

function UsersContent() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  const [loading, setLoading] = useState(true);

  /* QUERY STATE */
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [roleId, setRoleId] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 9,
    total: 0,
    totalPages: 1,
  });

  /* MODALS */
  const [modalOpen, setModalOpen] = useState(false);
  const [editUserId, setEditUserId] = useState<number | null>(null);
  const [deleteUserId, setDeleteUserId] = useState<number | null>(null);
  const [alertOpen, setAlertOpen] = useState(false);

  /* ================= FETCH ================= */

  const fetchUsers = async () => {
    setLoading(true);

    const res = await api.get('/users', {
      params: {
        search: search || undefined,
        status: status || undefined,
        roleId: roleId || undefined,
        sortBy: 'createdAt',
        sortOrder,
        page: pagination.page,
        limit: pagination.limit,
      },
    });

    setUsers(res.data?.data ?? []);
    setPagination((p) => ({
      ...p,
      ...res.data.pagination,
    }));

    setLoading(false);
  };

  const fetchRoles = async () => {
    const res = await api.get('/roles');
    setRoles(res.data?.data ?? []);
  };

  const fetchCurrentUser = async () => {
    const res = await api.get('/auth/me');
    setCurrentUser(res.data?.data ?? null);
  };

  useEffect(() => {
    fetchUsers();
  }, [search, status, roleId, sortOrder, pagination.page]);

  useEffect(() => {
    fetchRoles();
    fetchCurrentUser();
  }, []);

  /* ================= ACTIONS ================= */

  const confirmDelete = async () => {
    if (!deleteUserId) return;
    await api.delete(`/users/${deleteUserId}`);
    setAlertOpen(false);
    setDeleteUserId(null);
    fetchUsers();
  };

  const toggleStatus = async (id: number) => {
    await api.patch(`/users/${id}/toggle-status`);
    fetchUsers();
  };

  return (
    <>
      

      {/* ================= HEADER ================= */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            User Management
          </h1>
          <p className="text-sm text-slate-500">
            Search, filter, and manage system users
          </p>
        </div>

        <button
          onClick={() => {
            setEditUserId(null);
            setModalOpen(true);
          }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-900 text-white text-sm shadow-md hover:bg-blue-800"
        >
          <Plus size={16} />
          Create User
        </button>
      </div>

    {/* ================= CURRENT USER ================= */}
{currentUser && (
  <div className="mb-8">
    <div
      className="
        rounded-2xl
        bg-[#0A2540]
        p-6
        shadow-md shadow-black/20
        transition
      "
    >
      <div className="flex items-center gap-4">
        {/* AVATAR */}
        <div className="w-14 h-14 rounded-xl bg-white/10 flex items-center justify-center">
          <User className="text-white" size={26} />
        </div>

        {/* USER INFO */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-white truncate">
            {currentUser.fullName}
          </h3>

          <p className="text-sm text-blue-200/70 truncate">
            {currentUser.email}
          </p>

          {/* ROLE */}
          <div className="mt-2">
            <span
              className="
                inline-flex items-center
                px-3 py-1 rounded-full
                text-xs font-semibold
                bg-white/10 text-blue-100
              "
            >
              {currentUser.role.name}
            </span>
          </div>
        </div>

        {/* STATUS */}
        <div className="flex flex-col items-end">
          <span
            className={`
              inline-flex items-center gap-1.5
              px-3 py-1 rounded-full
              text-xs font-semibold
              ${
                currentUser.status === 'ACTIVE'
                  ? 'bg-emerald-400/15 text-emerald-200'
                  : currentUser.status === 'SUSPENDED'
                  ? 'bg-yellow-400/15 text-yellow-200'
                  : 'bg-blue-200/15 text-blue-100'
              }
            `}
          >
            <span
              className={`w-2 h-2 rounded-full
                ${
                  currentUser.status === 'ACTIVE'
                    ? 'bg-emerald-300'
                    : currentUser.status === 'SUSPENDED'
                    ? 'bg-yellow-300'
                    : 'bg-blue-200'
                }`}
            />
            {currentUser.status}
          </span>
        </div>
      </div>
    </div>
  </div>
)}



      {/* ================= FILTER BAR ================= */}
      <div className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-4">
        <input
          placeholder="Search name or email…"
          value={search}
          onChange={(e) => {
            setPagination((p) => ({ ...p, page: 1 }));
            setSearch(e.target.value);
          }}
          className="rounded-xl bg-gray-100 px-4 py-2.5 text-sm"
        />

        <select
          value={status}
          onChange={(e) => {
            setPagination((p) => ({ ...p, page: 1 }));
            setStatus(e.target.value);
          }}
          className="rounded-xl bg-gray-100 px-4 py-2.5 text-sm"
        >
          <option value="">All Status</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="INACTIVE">INACTIVE</option>
          <option value="SUSPENDED">SUSPENDED</option>
        </select>

        <select
          value={roleId}
          onChange={(e) => {
            setPagination((p) => ({ ...p, page: 1 }));
            setRoleId(e.target.value);
          }}
          className="rounded-xl bg-gray-100 px-4 py-2.5 text-sm"
        >
          <option value="">All Roles</option>
          {roles.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>

        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
          className="rounded-xl bg-gray-100 px-4 py-2.5 text-sm"
        >
          <option value="desc">Newest First</option>
          <option value="asc">Oldest First</option>
        </select>
      </div>

   {/* ================= GRID ================= */}
{loading ? (
  <p className="text-sm text-slate-500">Loading users…</p>
) : (
  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-7">
    {users.map((user) => (
      <div
        key={user.id}
        className="
          rounded-2xl bg-white p-6
          shadow-lg shadow-slate-200/60
          hover:shadow-xl transition
        "
      >
        {/* HEADER */}
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold text-slate-900">
              {user.fullName}
            </h3>
            <p className="text-xs text-slate-500">
              {user.email}
            </p>
          </div>

          {/* ACTIONS */}
          <div className="flex gap-1">
            <button
              onClick={() => toggleStatus(user.id)}
              className="p-2 text-green-600 hover:bg-green-600/10 rounded-lg"
              title="Toggle status"
            >
              <Power size={16} />
            </button>

            <button
              onClick={() => {
                setEditUserId(user.id);
                setModalOpen(true);
              }}
              className="p-2 text-blue-900 hover:bg-blue-900/10 rounded-lg"
              title="Edit user"
            >
              <Pencil size={16} />
            </button>

            <button
              onClick={() => {
                setDeleteUserId(user.id);
                setAlertOpen(true);
              }}
              className="p-2 text-red-600 hover:bg-red-600/10 rounded-lg"
              title="Delete user"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {/* META */}
        <div className="mt-4 flex items-center justify-between">
          {/* ROLE */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">
              Role
            </span>
            <span className="text-xs px-3 py-1 rounded-full bg-blue-900/10 text-blue-900 font-medium">
              {user.role.name}
            </span>
          </div>

          {/* STATUS BADGE */}
          <span
            className={`
              inline-flex items-center gap-1.5
              px-3 py-1 rounded-full
              text-xs font-semibold
              ${
                user.status === 'ACTIVE'
                  ? 'bg-green-600/10 text-green-700'
                  : user.status === 'INACTIVE'
                  ? 'bg-slate-400/10 text-slate-600'
                  : 'bg-yellow-500/10 text-yellow-700'
              }
            `}
          >
            <span
              className={`w-2 h-2 rounded-full
                ${
                  user.status === 'ACTIVE'
                    ? 'bg-green-600'
                    : user.status === 'INACTIVE'
                    ? 'bg-slate-400'
                    : 'bg-yellow-500'
                }`}
            />
            {user.status}
          </span>
        </div>
      </div>
    ))}
  </div>
)}


      {/* ================= PAGINATION ================= */}
      <div className="mt-10 flex items-center justify-center gap-4">
        <button
          disabled={pagination.page === 1}
          onClick={() =>
            setPagination((p) => ({ ...p, page: p.page - 1 }))
          }
          className="p-2 rounded-lg bg-gray-100 disabled:opacity-40"
        >
          <ChevronLeft size={16} />
        </button>

        <span className="text-sm text-slate-600">
          Page {pagination.page} of {pagination.totalPages}
        </span>

        <button
          disabled={pagination.page === pagination.totalPages}
          onClick={() =>
            setPagination((p) => ({ ...p, page: p.page + 1 }))
          }
          className="p-2 rounded-lg bg-gray-100 disabled:opacity-40"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* ================= MODALS ================= */}
      <UserUpsertModal
        open={modalOpen}
        userId={editUserId}
        roles={roles}
        onClose={() => setModalOpen(false)}
        onSuccess={fetchUsers}
      />

      <AlertModal
        open={alertOpen}
        type="warning"
        title="Delete User"
        message="This user will be removed from the system. Continue?"
        confirmText="Delete"
        showCancel
        onConfirm={confirmDelete}
        onClose={() => {
          setAlertOpen(false);
          setDeleteUserId(null);
        }}
      />
    </>
  );
}

/* ================= AUTH GUARD ================= */

export default function UsersPage() {
  return (
    <AuthGuard>
      <UsersContent />
    </AuthGuard>
  );
}
