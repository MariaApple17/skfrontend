'use client';

import {
  useEffect,
  useState,
} from 'react';

import {
  Layers,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';

import api from '@/components/lib/api';
import AuthGuard from '@/components/reusable/guard/AuthGuard';
import AlertModal from '@/components/reusable/modal/AlertModal';
import ClassificationUpsertModal
  from '@/components/reusable/modal/ClassificationUpsertModal';

/* ================= TYPES ================= */
interface Classification {
  id: number;
  code: string;
  name: string;
  description: string | null;
  createdAt: string;
  deletedAt: string | null;
}

function ClassificationContent() {
  const [items, setItems] = useState<Classification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editId, setEditId] = useState<number | null>(null);

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [alertOpen, setAlertOpen] = useState<boolean>(false);

  /* ================= FETCH ================= */
  const fetchClassifications = async () => {
    setLoading(true);
    try {
      const res = await api.get('/classifications');
      setItems(res.data?.data ?? []);
    } catch (err) {
      console.error('Failed to fetch classifications', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClassifications();
  }, []);

  /* ================= DELETE ================= */
  const confirmDelete = async () => {
    if (!deleteId) return;

    try {
      await api.delete(`/classifications/${deleteId}`);
      setAlertOpen(false);
      setDeleteId(null);
      fetchClassifications();
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
            Budget Classifications
          </h1>
          <p className="text-sm text-slate-500">
            Organize budget allocations by classification
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
          New Classification
        </button>
      </div>

      {/* ================= CONTENT ================= */}
      {loading ? (
        <p className="text-sm text-slate-500">
          Loading classifications…
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
            <Layers className="text-blue-900" size={28} />
          </div>

          <h3 className="text-lg font-semibold text-slate-900 mb-1">
            No Classifications Found
          </h3>

          <p className="text-sm text-slate-500 max-w-md mb-6">
            Classifications help structure budget limits and
            expenditure tracking. Create one to begin organizing
            your budget.
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
            Create First Classification
          </button>
        </div>
      ) : (
        /* GRID */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {items.map((cls) => (
            <div
              key={cls.id}
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
                    <Layers
                      className="text-blue-900"
                      size={18}
                    />
                  </div>

                  <div>
                    <h3 className="font-semibold text-slate-900">
                      {cls.name}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Code: {cls.code}
                    </p>
                  </div>
                </div>

                {/* ACTIONS */}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditId(cls.id);
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
                      setDeleteId(cls.id);
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
              {cls.description && (
                <p className="text-sm text-slate-600 mb-3">
                  {cls.description}
                </p>
              )}

              {/* META */}
              <p className="text-xs text-slate-500">
                Created:{' '}
                {new Date(cls.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* ================= UPSERT MODAL ================= */}
      <ClassificationUpsertModal
        open={modalOpen}
        classificationId={editId}
        onClose={() => {
          setModalOpen(false);
          setEditId(null);
        }}
        onSuccess={fetchClassifications}
      />

      {/* ================= DELETE CONFIRM ================= */}
      <AlertModal
        open={alertOpen}
        type="warning"
        title="Delete Classification"
        message="This classification will be archived and removed from active use. Continue?"
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

/* ================= PAGE ================= */
export default function ClassificationPage() {
  return (
    <AuthGuard>
      <ClassificationContent />
    </AuthGuard>
  );
}