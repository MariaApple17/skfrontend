'use client';

import {
  useEffect,
  useState,
} from 'react';

import {
  Calendar,
  Mail,
  Pencil,
  Plus,
  Trash2,
  User,
} from 'lucide-react';
import {
  useRouter,
  useSearchParams,
} from 'next/navigation';

import api from '@/components/lib/api';
import AuthGuard from '@/components/reusable/guard/AuthGuard';
import AlertModal from '@/components/reusable/modal/AlertModal';
import UpsertSKOfficialModal
  from '@/components/reusable/modal/UpsertSKOfficialModal';
import FlatInput from '@/components/reusable/ui/FlatInput';

/* ================= TYPES ================= */

type Gender = 'MALE' | 'FEMALE' | 'OTHER';

interface FiscalYear {
  id: number;
  year: number;
  isActive: boolean;
}

interface SKOfficial {
  id: number;
  fiscalYearId: number;
  position: string;
  fullName: string;
  responsibility?: string | null;
  birthDate: string;
  email?: string | null;
  gender: Gender;
  profileImageUrl?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/* ================= PAGE ================= */

function SKOfficialsContent() {
  const router = useRouter();
  const params = useSearchParams();

  const q = params.get('q') ?? '';
  const isActiveParam = params.get('isActive');

  const [activeFiscalYear, setActiveFiscalYear] =
    useState<FiscalYear | null>(null);

  const [officials, setOfficials] = useState<SKOfficial[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState<SKOfficial | null>(null);

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [togglingId, setTogglingId] = useState<number | null>(null);

  /* ================= HELPERS ================= */

  const updateParams = (next: Record<string, string | null>) => {
    const p = new URLSearchParams(params.toString());
    Object.entries(next).forEach(([k, v]) =>
      v ? p.set(k, v) : p.delete(k)
    );
    router.push(`?${p.toString()}`);
  };

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString();

  /* ================= DATA ================= */

  const fetchActiveFiscalYear = async () => {
    const res = await api.get('/fiscal-years');
    const years: FiscalYear[] = res.data?.data ?? [];
    const active = years.find(y => y.isActive);
    setActiveFiscalYear(active ?? null);
    return active;
  };

  const fetchOfficials = async (fy?: FiscalYear | null) => {
    const fiscal = fy ?? activeFiscalYear;
    if (!fiscal) return;

    setLoading(true);
    try {
      const query: Record<string, any> = {};
      if (q) query.fullName = q;
      if (isActiveParam === 'true') query.isActive = true;
      if (isActiveParam === 'false') query.isActive = false;

      const res = await api.get(
        `/sk-officials/fiscal/${fiscal.id}`,
        { params: query }
      );

      setOfficials(res.data?.data ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      const fy = await fetchActiveFiscalYear();
      await fetchOfficials(fy);
    })();
  }, []);

  useEffect(() => {
    if (activeFiscalYear) fetchOfficials();
  }, [q, isActiveParam]);

  /* ================= ACTIONS ================= */

  const toggleStatus = async (o: SKOfficial) => {
    if (togglingId) return;
    setTogglingId(o.id);

    setOfficials(prev =>
      prev.map(x =>
        x.id === o.id ? { ...x, isActive: !x.isActive } : x
      )
    );

    try {
      await api.patch(`/sk-officials/${o.id}/status`, {
        isActive: !o.isActive,
      });
    } catch {
      setOfficials(prev =>
        prev.map(x =>
          x.id === o.id ? { ...x, isActive: o.isActive } : x
        )
      );
    } finally {
      setTogglingId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    await api.delete(`/sk-officials/${deleteId}`);
    setConfirmOpen(false);
    setDeleteId(null);
    fetchOfficials();
  };

  /* ================= RENDER ================= */

  return (
    <>
      {/* HEADER */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            SK Officials
          </h1>
          <p className="text-sm text-slate-500">
            Fiscal Year: {activeFiscalYear?.year ?? '—'}
          </p>
        </div>

        <button
          disabled={!activeFiscalYear}
          onClick={() => {
            setEditData(null);
            setModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-900 text-white text-sm shadow"
        >
          <Plus size={16} />
          Create Official
        </button>
      </div>

      {/* FILTERS */}
      <div className="rounded-3xl bg-white p-5 mb-10 shadow">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <FlatInput
            label="Search Name"
            value={q}
            onChange={e => updateParams({ q: e.target.value })}
          />

          <div>
            <label className="text-xs font-medium text-slate-500">
              Status
            </label>
            <select
              value={isActiveParam ?? ''}
              onChange={e =>
                updateParams({ isActive: e.target.value })
              }
              className="mt-1 w-full rounded-xl bg-gray-100 px-4 py-3 text-sm"
            >
              <option value="">All</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      {loading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-7">
  {officials.map(o => {
    const isToggling = togglingId === o.id;

  return (
  <div
    key={o.id}
    className="
      group relative overflow-hidden
      rounded-[2rem]
      bg-white
      border border-slate-100
      shadow-md
      transition-all duration-300
      hover:-translate-y-1
      hover:shadow-2xl
    "
  >
    {/* Top Accent */}
    <div className="h-20 bg-gradient-to-r from-blue-600 to-indigo-600" />

    {/* Card Body */}
    <div className="relative px-6 pb-6 pt-14 space-y-5">
      {/* Avatar */}
      <div className="absolute -top-12 left-6">
        <img
          src={o.profileImageUrl || '/avatar.png'}
          alt={o.fullName}
          className="
            w-35 h-35 rounded-full object-cover
            ring-4 ring-white
            shadow-lg
            bg-white
          "
        />
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mt-20">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            {o.fullName}
          </h3>
          <p className="text-sm text-slate-500">
            {o.position}
          </p>
        </div>

        {/* Status */}
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium
            ${
              o.isActive
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-slate-100 text-slate-500'
            }
          `}
        >
          {o.isActive ? 'ACTIVE' : 'INACTIVE'}
        </span>
      </div>

      {/* Responsibility */}
      {o.responsibility && (
        <p className="text-sm text-slate-600 leading-relaxed line-clamp-3">
          {o.responsibility}
        </p>
      )}

      {/* Meta */}
      <div className="grid grid-cols-2 gap-y-2 text-xs text-slate-500">
        <p className="flex items-center gap-2">
          <Calendar size={14} />
          {fmtDate(o.birthDate)}
        </p>
        <p className="flex items-center gap-2">
          <User size={14} />
          {o.gender}
        </p>

        {o.email && (
          <p className="flex items-center gap-2 col-span-2 truncate">
            <Mail size={14} />
            {o.email}
          </p>
        )}
      </div>
    </div>

    {/* Footer */}
    <div className="flex items-center justify-between px-6 py-4 bg-slate-50">
      {/* Toggle */}
      <button
        disabled={isToggling}
        onClick={() => toggleStatus(o)}
        className={`
          relative inline-flex h-6 w-11 items-center rounded-full
          transition-colors
          ${o.isActive ? 'bg-blue-600' : 'bg-slate-300'}
          ${isToggling ? 'opacity-60 cursor-not-allowed' : ''}
        `}
        aria-label="Toggle status"
      >
        <span
          className={`
            inline-block h-5 w-5 rounded-full bg-white
            shadow transition-transform
            ${o.isActive ? 'translate-x-5' : 'translate-x-0.5'}
          `}
        />
      </button>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => {
            setEditData(o);
            setModalOpen(true);
          }}
          className="
            p-2 rounded-xl
            text-blue-700
            hover:bg-blue-100
            transition
          "
          title="Edit"
        >
          <Pencil size={16} />
        </button>

        <button
          onClick={() => {
            setDeleteId(o.id);
            setConfirmOpen(true);
          }}
          className="
            p-2 rounded-xl
            text-red-600
            hover:bg-red-100
            transition
          "
          title="Delete"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  </div>
);

  })}
</div>

      )}

      {modalOpen && (
        <UpsertSKOfficialModal
          open
          initialData={editData}
          onClose={() => {
            setModalOpen(false);
            setEditData(null);
          }}
          onSuccess={fetchOfficials}
        />
      )}

      <AlertModal
        open={confirmOpen}
        type="warning"
        title="Delete SK Official"
        message="This official will be removed. Continue?"
        confirmText="Delete"
        showCancel
        onConfirm={confirmDelete}
        onClose={() => setConfirmOpen(false)}
      />
    </>
  );
}

export default function SKOfficialsPage() {
  return (
    <AuthGuard>
      <SKOfficialsContent />
    </AuthGuard>
  );
}
