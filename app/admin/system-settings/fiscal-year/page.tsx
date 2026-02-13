'use client';

import {
  useEffect,
  useState,
} from 'react';

import {
  Calendar,
  CheckCircle,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';

import api from '@/components/lib/api';
import AuthGuard from '@/components/reusable/guard/AuthGuard';
import AlertModal from '@/components/reusable/modal/AlertModal';
import FiscalYearUpsertModal
  from '@/components/reusable/modal/FiscalYearUpsertModal';

interface FiscalYear {
  id: number;
  year: number;
  isActive: boolean;
  createdAt: string;
  deletedAt: string | null;
}

function FiscalYearContent() {
  const [items, setItems] = useState<FiscalYear[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [alertOpen, setAlertOpen] = useState(false);

  /* ================= FETCH ================= */
  const fetchFiscalYears = async () => {
    setLoading(true);
    try {
      const res = await api.get('/fiscal-years');
      setItems(res.data?.data ?? []);
    } catch (err) {
      console.error('Failed to fetch fiscal years', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiscalYears();
  }, []);

  /* ================= DELETE ================= */
  const confirmDelete = async () => {
    if (!deleteId) return;

    try {
      await api.delete(`/fiscal-years/${deleteId}`);
      setAlertOpen(false);
      setDeleteId(null);
      fetchFiscalYears();
    } catch (err) {
      console.error('Delete failed', err);
    }
  };

  return (
    <>
      {/* ================= HEADER ================= */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Fiscal Years
          </h1>
          <p className="text-sm text-slate-500">
            Manage fiscal year periods and active cycle
          </p>
        </div>

        <button
          onClick={() => {
            setEditId(null);
            setModalOpen(true);
          }}
          className="
            flex items-center gap-2 px-4 py-2 rounded-xl
            bg-blue-900 text-white text-sm font-medium
            hover:bg-blue-800 transition
          "
        >
          <Plus size={16} />
          Create Fiscal Year
        </button>
      </div>

      {/* ================= CONTENT ================= */}
      {loading ? (
        <p className="text-sm text-slate-500">
          Loading fiscal years…
        </p>
      ) : items.length === 0 ? (
        /* EMPTY STATE */
        <div
          className="
            w-full rounded-2xl bg-white p-12
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
            <Calendar className="text-blue-900" size={28} />
          </div>

          <h3 className="text-lg font-semibold text-slate-900 mb-1">
            No Fiscal Years Found
          </h3>

          <p className="text-sm text-slate-500 max-w-md mb-6">
            Fiscal years define the active budgeting and reporting
            cycle of the system. Create one to get started.
          </p>

          <button
            onClick={() => {
              setEditId(null);
              setModalOpen(true);
            }}
            className="
              flex items-center gap-2 px-4 py-2 rounded-xl
              bg-blue-900 text-white text-sm font-medium
              hover:bg-blue-800 transition
            "
          >
            <Plus size={16} />
            Create First Fiscal Year
          </button>
        </div>
      ) : (
        /* GRID */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {items.map((fy) => (
            <div
              key={fy.id}
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
                    <Calendar
                      className="text-blue-900"
                      size={18}
                    />
                  </div>

                  <div>
                    <h3 className="font-semibold text-slate-900">
                      Fiscal Year {fy.year}
                    </h3>

                    {fy.isActive && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <CheckCircle
                          size={14}
                          className="text-green-600"
                        />
                        <span className="text-xs font-medium text-green-700">
                          Active
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* ACTIONS */}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditId(fy.id);
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
                      setDeleteId(fy.id);
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

              {/* META */}
              <p className="text-xs text-slate-500">
                Created:{' '}
                {new Date(fy.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* ================= UPSERT MODAL ================= */}
      <FiscalYearUpsertModal
        open={modalOpen}
        fiscalYearId={editId}
        onClose={() => {
          setModalOpen(false);
          setEditId(null);
        }}
        onSuccess={fetchFiscalYears}
      />

      {/* ================= DELETE CONFIRM ================= */}
      <AlertModal
        open={alertOpen}
        type="warning"
        title="Delete Fiscal Year"
        message="This fiscal year will be archived and cannot be used. Continue?"
        confirmText="Delete"
        showCancel
        onConfirm={confirmDelete}
        onClose={() => {
          setAlertOpen(false);
          setDeleteId(null);
        }}
      />
    </>
  );
}

/* ================= AUTH GUARD ================= */
export default function FiscalYearPage() {
  return (
    <AuthGuard>
      <FiscalYearContent />
    </AuthGuard>
  );
}
