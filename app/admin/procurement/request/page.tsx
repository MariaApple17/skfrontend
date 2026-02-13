'use client';

import {
  useEffect,
  useState,
} from 'react';

import {
  Calendar,
  ClipboardList,
  DollarSign,
  FileText,
  Package,
  Pencil,
  Plus,
  Send,
  Trash2,
  User,
} from 'lucide-react';

import api from '@/components/lib/api';
import AuthGuard from '@/components/reusable/guard/AuthGuard';
import AlertModal from '@/components/reusable/modal/AlertModal';
import ProcurementRequestUpsertModal
  from '@/components/reusable/modal/ProcurementRequestUpsertModal';
import FlatInput from '@/components/reusable/ui/FlatInput';

/* ================= TYPES ================= */
interface ProcurementItem {
  name: string;
  description?: string | null;
  quantity: number;
  unitCost: string;
  totalPrice: string;
}

interface Approval {
  status: string;
  remarks?: string | null;
}

interface Proof {
  type: string;
  fileUrl: string;
  description?: string | null;
}

interface Allocation {
  allocatedAmount: string;
  usedAmount: string;
  programId: number;
  classificationId: number;
  objectOfExpenditureId: number;
}

interface CreatedBy {
  fullName: string;
  email: string;
  status: string;
}

interface ProcurementRequest {
  id: number;
  title: string;
  description: string;
  amount: string;
  status: 'DRAFT';
  createdAt: string;
  updatedAt: string;
  items: ProcurementItem[];
  approvals: Approval[];
  proofs: Proof[];
  vendor: any | null;
  allocation?: Allocation | null;
  createdBy?: CreatedBy | null;
}

/* ================= CONTENT ================= */
function ProcurementRequestContent() {
  const [items, setItems] = useState<ProcurementRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [submitId, setSubmitId] = useState<number | null>(null);
  const [alertType, setAlertType] =
    useState<'delete' | 'submit' | null>(null);

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const limit = 9;

  /* ================= FETCH ================= */
  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await api.get('/procurement', {
        params: {
          q: search || undefined,
          status: 'DRAFT',
          page,
          limit,
        },
      });
      setItems(res.data?.data ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [search, page]);

  /* ================= ACTIONS ================= */
  const confirmDelete = async () => {
    if (!deleteId) return;
    await api.delete(`/procurement/${deleteId}`);
    setDeleteId(null);
    setAlertType(null);
    fetchRequests();
  };

  const confirmSubmit = async () => {
    if (!submitId) return;
    await api.patch(`/procurement/${submitId}/submit`);
    setSubmitId(null);
    setAlertType(null);
    fetchRequests();
  };

  return (
    <>
      {/* ================= HEADER ================= */}
      <div className="mb-12">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
              <FileText size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                Draft Procurement Requests
              </h1>
              <p className="text-sm text-slate-600 mt-1">
                Manage and submit your draft procurement entries
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setEditId(null);
              setModalOpen(true);
            }}
            className="
              inline-flex items-center gap-2
              px-6 py-3 rounded-xl
              bg-gradient-to-r from-blue-600 to-indigo-600
              text-white text-sm font-bold
              shadow-lg shadow-blue-200
              hover:shadow-xl hover:from-blue-700 hover:to-indigo-700
              active:scale-95
              transition-all duration-200
            "
          >
            <Plus size={18} />
            New Request
          </button>
        </div>
      </div>

      {/* ================= SEARCH ================= */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8">
        <div className="max-w-md">
          <FlatInput
            label="Search drafts"
            placeholder="Search by title…"
            value={search}
            onChange={e => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      {/* ================= CONTENT ================= */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-sm text-slate-500">Loading drafts…</p>
          </div>
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 rounded-3xl shadow-sm border border-slate-200 p-20 text-center">
          <div className="p-5 bg-white rounded-full shadow-md mb-6">
            <ClipboardList size={48} className="text-blue-500" />
          </div>
          <h3 className="text-lg font-semibold text-slate-700 mb-2">
            No draft requests
          </h3>
          <p className="text-sm text-slate-500 max-w-md mb-6">
            Create your first procurement request to begin
          </p>
          <button
            onClick={() => {
              setEditId(null);
              setModalOpen(true);
            }}
            className="
              inline-flex items-center gap-2
              px-6 py-3 rounded-xl
              bg-gradient-to-r from-blue-600 to-indigo-600
              text-white text-sm font-bold
              shadow-lg shadow-blue-200
              hover:shadow-xl hover:from-blue-700 hover:to-indigo-700
              active:scale-95
              transition-all duration-200
            "
          >
            <Plus size={18} />
            Create New Request
          </button>
        </div>
      ) : (
        <>
          {/* ================= GRID ================= */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {items.map(req => (
              <div
                key={req.id}
                className="
                  group relative
                  rounded-2xl bg-white
                  border border-slate-200
                  shadow-sm
                  hover:shadow-2xl hover:border-slate-300
                  transition-all duration-300
                  flex flex-col
                  overflow-hidden
                "
              >
                {/* ================= GRADIENT ACCENT ================= */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-slate-400 via-slate-500 to-slate-600"></div>

                {/* ================= HEADER ================= */}
                <div className="p-6 pb-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-slate-900 leading-tight mb-2 line-clamp-2">
                        {req.title}
                      </h3>

                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-green-50 rounded-lg">
                          <DollarSign size={14} className="text-green-600" />
                        </div>
                        <span className="text-xl font-bold text-green-600">
                          ₱{Number(req.amount).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <span
                      className="
                        inline-flex items-center gap-1.5
                        text-[11px] font-bold uppercase tracking-wide
                        px-3 py-1.5 rounded-full
                        bg-gradient-to-r from-slate-100 to-slate-200
                        text-slate-700 border border-slate-300
                        shadow-sm
                      "
                    >
                      <FileText size={12} />
                      Draft
                    </span>
                  </div>

                  {/* ================= DESCRIPTION ================= */}
                  <p className="text-sm text-slate-600 leading-relaxed line-clamp-2 bg-slate-50 rounded-lg p-3">
                    {req.description}
                  </p>
                </div>

                {/* ================= METADATA ================= */}
                <div className="px-6 pb-4">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Calendar size={14} className="text-slate-400" />
                      <div>
                        <div className="font-medium text-slate-500">Created</div>
                        <div className="font-semibold">
                          {new Date(req.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    {req.createdBy && (
                      <div className="flex items-center gap-2 text-slate-600">
                        <User size={14} className="text-slate-400" />
                        <div>
                          <div className="font-medium text-slate-500">By</div>
                          <div className="font-semibold truncate">
                            {req.createdBy.fullName}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* ================= ALLOCATION ================= */}
                {req.allocation && (
                  <div className="px-6 mb-4">
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign size={14} className="text-blue-600" />
                        <span className="text-xs font-bold text-blue-900 uppercase tracking-wide">
                          Budget Allocation
                        </span>
                      </div>
                      <p className="text-sm font-bold text-slate-700">
                        ₱{Number(req.allocation.usedAmount).toLocaleString()} / ₱
                        {Number(req.allocation.allocatedAmount).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}

                {/* ================= ITEMS ================= */}
                <div className="px-6 mb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Package size={14} className="text-slate-500" />
                    <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                      Items ({req.items.length})
                    </p>
                  </div>

                  <div className="space-y-2">
                    {req.items.map((i, idx) => (
                      <div
                        key={idx}
                        className="
                          flex justify-between items-center gap-3
                          rounded-xl bg-gradient-to-r from-slate-50 to-slate-100
                          border border-slate-200
                          px-4 py-3
                          text-sm
                          hover:shadow-md transition-shadow
                        "
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-slate-900 truncate">
                            {i.name}
                          </div>
                          <div className="text-xs text-slate-600">
                            {i.quantity} × ₱{Number(i.unitCost).toLocaleString()}
                          </div>
                        </div>

                        <span className="font-bold text-slate-900 whitespace-nowrap">
                          ₱{Number(i.totalPrice).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ================= ACTIONS ================= */}
                <div className="mt-auto px-6 pt-4 pb-6 bg-slate-50 border-t border-slate-100">
                  <div className="flex gap-2">
                    {/* EDIT */}
                    <button
                      onClick={() => {
                        setEditId(req.id);
                        setModalOpen(true);
                      }}
                      className="
                        flex-1 inline-flex items-center justify-center gap-2
                        rounded-xl px-4 py-3 text-sm font-bold
                        bg-slate-100 text-slate-700 border-2 border-slate-300
                        hover:bg-slate-200 hover:border-slate-400
                        active:scale-95
                        transition-all duration-200
                      "
                    >
                      <Pencil size={16} />
                      Edit
                    </button>

                    {/* SUBMIT */}
                    <button
                      onClick={() => {
                        setSubmitId(req.id);
                        setAlertType('submit');
                      }}
                      className="
                        flex-1 inline-flex items-center justify-center gap-2
                        rounded-xl px-4 py-3 text-sm font-bold
                        bg-gradient-to-r from-green-600 to-green-700
                        text-white shadow-lg shadow-green-200
                        hover:shadow-xl hover:from-green-700 hover:to-green-800
                        active:scale-95
                        transition-all duration-200
                      "
                    >
                      <Send size={16} />
                      Submit
                    </button>

                    {/* DELETE */}
                    <button
                      onClick={() => {
                        setDeleteId(req.id);
                        setAlertType('delete');
                      }}
                      className="
                        inline-flex items-center justify-center
                        rounded-xl px-3 py-3
                        text-red-600 bg-red-50 border-2 border-red-200
                        hover:bg-red-100 hover:border-red-300
                        active:scale-95
                        transition-all duration-200
                      "
                      title="Delete draft"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ================= PAGINATION ================= */}
          <div className="mt-12 flex items-center justify-center gap-4">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="
                px-6 py-3 rounded-xl
                bg-white border-2 border-slate-200
                text-sm font-semibold text-slate-700
                shadow-sm hover:shadow-md hover:border-slate-300
                disabled:opacity-40 disabled:cursor-not-allowed
                transition-all duration-200
              "
            >
              Previous
            </button>

            <div className="px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-lg">
              Page {page}
            </div>

            <button
              onClick={() => setPage(p => p + 1)}
              className="
                px-6 py-3 rounded-xl
                bg-white border-2 border-slate-200
                text-sm font-semibold text-slate-700
                shadow-sm hover:shadow-md hover:border-slate-300
                transition-all duration-200
              "
            >
              Next
            </button>
          </div>
        </>
      )}

      {/* ================= MODALS ================= */}
      <ProcurementRequestUpsertModal
        open={modalOpen}
        requestId={editId}
        onClose={() => {
          setModalOpen(false);
          setEditId(null);
        }}
        onSuccess={fetchRequests}
      />

      <AlertModal
        open={alertType === 'delete'}
        type="warning"
        title="Delete Draft Request"
        message="This draft procurement request will be permanently removed."
        confirmText="Delete"
        showCancel
        onConfirm={confirmDelete}
        onClose={() => {
          setAlertType(null);
          setDeleteId(null);
        }}
      />

      <AlertModal
        open={alertType === 'submit'}
        type="info"
        title="Submit Procurement Request"
        message="Submit this draft procurement request for approval?"
        confirmText="Submit"
        showCancel
        onConfirm={confirmSubmit}
        onClose={() => {
          setAlertType(null);
          setSubmitId(null);
        }}
      />
    </>
  );
}

/* ================= PAGE ================= */
export default function ProcurementRequestPage() {
  return (
    <AuthGuard>
      <ProcurementRequestContent />
    </AuthGuard>
  );
}