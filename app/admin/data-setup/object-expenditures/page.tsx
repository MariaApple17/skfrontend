'use client';

import {
  useEffect,
  useState,
} from 'react';

import {
  FileText,
  Layers,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';

import api from '@/components/lib/api';
import AuthGuard from '@/components/reusable/guard/AuthGuard';
import AlertModal from '@/components/reusable/modal/AlertModal';
import ObjectOfExpenditureUpsertModal
  from '@/components/reusable/modal/ObjectOfExpenditureUpsertModal';

/* ================= TYPES ================= */
interface ObjectOfExpenditure {
  id: number;
  code: string;
  name: string;
  description: string | null;
  createdAt: string;
  deletedAt: string | null;
  classificationId: number;
  classification?: {
    id: number;
    name: string;
  };
}

/* ================= CONTENT ================= */
function ObjectOfExpenditureContent() {
  const [items, setItems] = useState<ObjectOfExpenditure[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editId, setEditId] = useState<number | null>(null);

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [alertOpen, setAlertOpen] = useState<boolean>(false);

  /* ================= FETCH ================= */
  const fetchObjects = async () => {
    setLoading(true);
    try {
      const res = await api.get('/objects-of-expenditure');
      setItems(res.data?.data ?? []);
    } catch (err) {
      console.error('Failed to fetch objects of expenditure', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchObjects();
  }, []);

  /* ================= DELETE ================= */
  const confirmDelete = async () => {
    if (!deleteId) return;

    try {
      await api.delete(`/objects-of-expenditure/${deleteId}`);
      setAlertOpen(false);
      setDeleteId(null);
      fetchObjects();
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
            Objects of Expenditure
          </h1>
          <p className="text-sm text-slate-500">
            Define and manage expenditure categories
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
          New Object
        </button>
      </div>

      {/* ================= CONTENT ================= */}
      {loading ? (
        <p className="text-sm text-slate-500">
          Loading objects of expenditure…
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
            No Objects Found
          </h3>

          <p className="text-sm text-slate-500 max-w-md mb-6">
            Objects of expenditure define how spending is categorized
            across the system. Create one to get started.
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
            Create First Object
          </button>
        </div>
      ) : (
        /* GRID */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {items.map((obj) => (
            <div
              key={obj.id}
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
                    <FileText
                      className="text-blue-900"
                      size={18}
                    />
                  </div>

                  <div>
                    <h3 className="font-semibold text-slate-900">
                      {obj.name}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Code: {obj.code}
                    </p>
                    <p className="text-xs text-blue-700 font-medium">
  {obj.classification?.name}
</p>
                  </div>
                </div>

                {/* ACTIONS */}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditId(obj.id);
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
                      setDeleteId(obj.id);
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
              {obj.description && (
                <p className="text-sm text-slate-600 mb-3">
                  {obj.description}
                </p>
              )}

              {/* META */}
              <p className="text-xs text-slate-500">
                Created:{' '}
                {new Date(obj.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* ================= UPSERT MODAL ================= */}
      <ObjectOfExpenditureUpsertModal
        open={modalOpen}
        objectId={editId}
        onClose={() => {
          setModalOpen(false);
          setEditId(null);
        }}
        onSuccess={fetchObjects}
      />

      {/* ================= DELETE CONFIRM ================= */}
      <AlertModal
        open={alertOpen}
        type="warning"
        title="Delete Object of Expenditure"
        message="This object of expenditure will be archived and removed from active use. Continue?"
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
export default function ObjectOfExpenditurePage() {
  return (
    <AuthGuard>
      <ObjectOfExpenditureContent />
    </AuthGuard>
  );
}
