'use client';

import {
  useEffect,
  useState,
} from 'react';

import {
  Calendar,
  CheckCircle,
  ClipboardList,
  DollarSign,
  FileText,
  Package,
  ShoppingCart,
  TrendingUp,
  Upload,
  User,
  XCircle,
} from 'lucide-react';

import api from '@/components/lib/api';
import AuthGuard from '@/components/reusable/guard/AuthGuard';
import AlertModal from '@/components/reusable/modal/AlertModal';
import FlatInput from '@/components/reusable/ui/FlatInput';
import FlatSelect from '@/components/reusable/ui/FlatSelect';

/* ================= STATUS ================= */
type ProcurementStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'PURCHASED'
  | 'COMPLETED';

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
}

interface CreatedBy {
  fullName: string;
  email: string;
}

interface ProcurementRequest {
  id: number;
  title: string;
  description: string;
  amount: string;
  status: ProcurementStatus;
  createdAt: string;
  updatedAt: string;
  items: ProcurementItem[];
  approvals: Approval[];
  proofs: Proof[];
  allocation?: Allocation | null;
  createdBy?: CreatedBy | null;
}

/* ================= CONSTANTS ================= */
const STATUS_OPTIONS = [
  { id: '', label: 'All Status' },
  { id: 'SUBMITTED', label: 'Submitted' },
  { id: 'APPROVED', label: 'Approved' },
  { id: 'REJECTED', label: 'Rejected' },
  { id: 'PURCHASED', label: 'Purchased' },
  { id: 'COMPLETED', label: 'Completed' },
];

const STATUS_BADGE: Record<ProcurementStatus, string> = {
  DRAFT: 'bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 border-slate-300',
  SUBMITTED: 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border-blue-300',
  APPROVED: 'bg-gradient-to-r from-green-100 to-green-200 text-green-800 border-green-300',
  REJECTED: 'bg-gradient-to-r from-red-100 to-red-200 text-red-800 border-red-300',
  PURCHASED: 'bg-gradient-to-r from-indigo-100 to-indigo-200 text-indigo-800 border-indigo-300',
  COMPLETED: 'bg-gradient-to-r from-emerald-100 to-emerald-200 text-emerald-800 border-emerald-300',
};

const STATUS_ICON: Record<ProcurementStatus, React.ReactElement> = {
  DRAFT: <FileText size={12} />,
  SUBMITTED: <Upload size={12} />,
  APPROVED: <CheckCircle size={12} />,
  REJECTED: <XCircle size={12} />,
  PURCHASED: <ShoppingCart size={12} />,
  COMPLETED: <CheckCircle size={12} />,
};

/* ================= CONTENT ================= */
function ProcurementManagementContent() {
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [proofType, setProofType] = useState('');
  const [proofDescription, setProofDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  type ServerAction = 'approve' | 'reject' | 'purchase' | 'complete';

  const [remarks, setRemarks] = useState('');
  const [items, setItems] = useState<ProcurementRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const limit = 9;

  const [action, setAction] =
    useState<'approve' | 'reject' | 'purchase' | 'complete' | 'upload-proof' | null>(null);

  const [targetId, setTargetId] = useState<number | null>(null);

  /* ================= FETCH ================= */
  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await api.get('/procurement', {
        params: {
          q: search || undefined,
          status: status || undefined,
          page,
          limit,
        },
      });

      setItems(
        (res.data?.data ?? []).filter(
          (r: ProcurementRequest) => r.status !== 'DRAFT'
        )
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [search, status, page]);

  /* ================= ACTION ================= */
  const runAction = async () => {
    if (!action || !targetId) return;

    // 🚫 upload-proof is NOT a server action
    if (action === 'upload-proof') return;

    const serverAction: ServerAction = action;

    // ❌ Reject requires remarks
    if (serverAction === 'reject' && !remarks.trim()) {
      setModalError('Remarks are required when rejecting a request.');
      return;
    }

    const endpoints: Record<ServerAction, string> = {
      approve: `/procurement/${targetId}/approve`,
      reject: `/procurement/${targetId}/reject`,
      purchase: `/procurement/${targetId}/purchase`,
      complete: `/procurement/${targetId}/complete`,
    };

    try {
      setModalError(null);

      const payload =
        serverAction === 'approve' || serverAction === 'reject'
          ? { remarks: remarks.trim() }
          : undefined;

      await api.patch(endpoints[serverAction], payload);

      setAction(null);
      setTargetId(null);
      setRemarks('');
      fetchRequests();
    } catch (err: any) {
      setModalError(
        err?.response?.data?.message ||
          'Something went wrong. Please try again.'
      );
    }
  };

  const isConfirmAction =
    !!targetId &&
    (action === 'approve' ||
      action === 'reject' ||
      action === 'purchase' ||
      action === 'complete');const uploadProof = async () => {
  if (!uploadFile || !targetId) return;

  const formData = new FormData();
  formData.append('file', uploadFile);
  formData.append('requestId', String(targetId));
  formData.append('type', proofType);

  if (proofDescription) {
    formData.append('description', proofDescription);
  }

  try {
    setUploading(true);

    await api.post('/procurement/upload-proof', formData);

    setAction(null);
    setTargetId(null);
    setUploadFile(null);
    setProofType('');
    setProofDescription('');
    fetchRequests();

  } catch (err: any) {
    console.log("SERVER ERROR:", err.response?.data);
    alert(JSON.stringify(err.response?.data));
  } finally {
    setUploading(false);
  }
};


  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

  /* ================= IMAGE FIX ================= */
  const resolveImageUrl = (url?: string | null) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}${url}`;
  };

  const isImage = (url: string) => /\.(jpg|jpeg|png)$/i.test(url);

  return (
    <>
      {/* ================= HEADER ================= */}
      <div className="mb-12">
        <div className="flex items-center gap-4 mb-3">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
            <ClipboardList size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
              Procurement Management
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Review, approve, purchase, and complete procurement requests
            </p>
          </div>
        </div>
      </div>

      {/* ================= FILTERS ================= */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8">
        <div className="flex flex-wrap gap-6">
          <div className="flex-1 min-w-[280px]">
            <FlatInput
              label="Search"
              placeholder="Search by title…"
              value={search}
              onChange={e => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <div className="w-64">
            <FlatSelect
              label="Status"
              value={status}
              options={STATUS_OPTIONS}
              onChange={val => {
                setStatus(val);
                setPage(1);
              }}
            />
          </div>
        </div>
      </div>

      {/* ================= CONTENT ================= */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-sm text-slate-500">Loading requests…</p>
          </div>
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 rounded-3xl shadow-sm border border-slate-200 p-20 text-center">
          <div className="p-5 bg-white rounded-full shadow-md mb-6">
            <ClipboardList size={48} className="text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-700 mb-2">
            No procurement requests found
          </h3>
          <p className="text-sm text-slate-500 max-w-md">
            There are no requests matching your current filters. Try adjusting your search criteria.
          </p>
        </div>
      ) : (
        <>
          {/* ================= GRID ================= */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {items.map(req => {
              const used = Number(req.allocation?.usedAmount ?? 0);
              const total = Number(req.allocation?.allocatedAmount ?? 0);
              const percent =
                total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;

              return (
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
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>

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
                        className={`
                          inline-flex items-center gap-1.5
                          text-[11px] font-bold uppercase tracking-wide
                          px-3 py-1.5 rounded-full
                          border shadow-sm
                          ${STATUS_BADGE[req.status]}
                        `}
                      >
                        {STATUS_ICON[req.status]}
                        {req.status}
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

                  {/* ================= REMARKS ================= */}
                  {req.approvals?.[0]?.remarks && (
                    <div className="mx-6 mb-4">
                      <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText size={14} className="text-amber-600" />
                          <p className="text-xs font-bold text-amber-900 uppercase tracking-wide">
                            Remarks
                          </p>
                        </div>
                        <p className="text-sm text-amber-900 leading-relaxed">
                          {req.approvals[0].remarks}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* ================= PROOFS ================= */}
                  {req.proofs.length > 0 && (
                    <div className="px-6 mb-4">
                      <div className="flex items-center gap-2 mb-3">
                        <FileText size={14} className="text-slate-500" />
                        <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                          Proof of Purchase ({req.proofs.length})
                        </p>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        {req.proofs.map((proof, idx) => {
                          const url = resolveImageUrl(proof.fileUrl);

                          if (!url) return null;

                          return (
                            <div
                              key={idx}
                              className="relative group/proof rounded-xl overflow-hidden border-2 border-slate-200 hover:border-blue-400 transition-all"
                            >
                              {isImage(url) ? (
                                <img
                                  src={url}
                                  alt={proof.type}
                                  className="
                                    h-24 w-full object-cover
                                    transition-transform duration-300
                                    group-hover/proof:scale-110
                                  "
                                />
                              ) : (
                                <a
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="
                                    flex h-24 items-center justify-center
                                    bg-slate-50 hover:bg-blue-50
                                    text-xs text-blue-600 font-semibold
                                    transition-colors
                                  "
                                >
                                  View PDF
                                </a>
                              )}

                              {/* TYPE BADGE */}
                              <span
                                className="
                                  absolute bottom-1.5 right-1.5
                                  rounded-md bg-black/80 px-2 py-1
                                  text-[10px] font-bold text-white uppercase
                                  shadow-lg
                                "
                              >
                                {proof.type}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* ================= ALLOCATION ================= */}
                  {req.allocation && (
                    <div className="px-6 mb-4">
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp size={14} className="text-blue-600" />
                          <span className="text-xs font-bold text-blue-900 uppercase tracking-wide">
                            Budget Usage
                          </span>
                        </div>

                        <div className="flex justify-between text-sm text-slate-700 mb-2">
                          <span className="font-semibold">
                            ₱{used.toLocaleString()}
                          </span>
                          <span className="font-bold text-blue-600">
                            {percent}%
                          </span>
                          <span className="font-semibold text-slate-500">
                            ₱{total.toLocaleString()}
                          </span>
                        </div>

                        <div className="h-3 rounded-full bg-white overflow-hidden shadow-inner">
                          <div
                            className={`
                              h-full rounded-full transition-all duration-500
                              ${
                                percent >= 90
                                  ? 'bg-gradient-to-r from-red-500 to-red-600'
                                  : percent >= 70
                                  ? 'bg-gradient-to-r from-amber-500 to-orange-600'
                                  : 'bg-gradient-to-r from-blue-500 to-indigo-600'
                              }
                            `}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
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
                    <div className="flex flex-wrap gap-2">
                      {req.status === 'SUBMITTED' && (
                        <>
                          <button
                            onClick={() => {
                              setTargetId(req.id);
                              setAction('approve');
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
                            <CheckCircle size={16} />
                            Approve
                          </button>

                          <button
                            onClick={() => {
                              setTargetId(req.id);
                              setAction('reject');
                            }}
                            className="
                              flex-1 inline-flex items-center justify-center gap-2
                              rounded-xl px-4 py-3 text-sm font-bold
                              bg-red-100 text-red-700 border-2 border-red-300
                              hover:bg-red-200 hover:border-red-400
                              active:scale-95
                              transition-all duration-200
                            "
                          >
                            <XCircle size={16} />
                            Reject
                          </button>
                        </>
                      )}

                      {req.status === 'APPROVED' && (
                        <button
                          onClick={() => {
                            setTargetId(req.id);
                            setAction('purchase');
                          }}
                          className="
                            flex-1 inline-flex items-center justify-center gap-2
                            rounded-xl px-4 py-3 text-sm font-bold
                            bg-gradient-to-r from-blue-600 to-indigo-700
                            text-white shadow-lg shadow-blue-200
                            hover:shadow-xl hover:from-blue-700 hover:to-indigo-800
                            active:scale-95
                            transition-all duration-200
                          "
                        >
                          <ShoppingCart size={16} />
                          Mark as Purchased
                        </button>
                      )}

                      {req.status === 'PURCHASED' && (
                        <>
                          {/* UPLOAD PROOF */}
                          <button
                            onClick={() => {
                              setTargetId(req.id);
                              setAction('upload-proof');
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
                            <Upload size={16} />
                            Upload Proof
                          </button>

                          {/* COMPLETE */}
                          <button
                            disabled={req.proofs.length === 0}
                            onClick={() => {
                              setTargetId(req.id);
                              setAction('complete');
                            }}
                            className="
                              flex-1 inline-flex items-center justify-center gap-2
                              rounded-xl px-4 py-3 text-sm font-bold
                              bg-gradient-to-r from-emerald-600 to-green-700
                              text-white shadow-lg shadow-emerald-200
                              hover:shadow-xl hover:from-emerald-700 hover:to-green-800
                              active:scale-95
                              transition-all duration-200
                              disabled:opacity-40 disabled:cursor-not-allowed
                              disabled:hover:shadow-lg disabled:active:scale-100
                            "
                          >
                            <CheckCircle size={16} />
                            Complete
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
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

      {/* ================= UPLOAD PROOF MODAL ================= */}
      <AlertModal
        open={action === 'upload-proof'}
        type="info"
        title="Upload Proof"
        message="Upload a document as proof of purchase."
        confirmText={uploading ? 'Uploading…' : 'Upload'}
        showCancel
        loading={uploading}
        confirmDisabled={!uploadFile || !proofType}
        onConfirm={uploadProof}
        onClose={() => {
          setAction(null);
          setTargetId(null);
          setUploadFile(null);
          setProofType('');
          setProofDescription('');
        }}
      >
        {modalError && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-3">
            {modalError}
          </p>
        )}

        {/* FILE INPUT */}
        <label className="block space-y-1">
          <span className="text-xs font-medium text-slate-500">
            Proof File (PDF / JPG / PNG)
          </span>

          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={e => {
              const file = e.target.files?.[0];
              if (file) setUploadFile(file);
            }}
            className="block w-full text-sm"
          />
        </label>

        <FlatSelect
          label="Proof Type"
          value={proofType}
          options={[
            { id: 'OR', label: 'Official Receipt (OR)' },
            { id: 'DR', label: 'Delivery Receipt (DR)' },
            { id: 'INV', label: 'Invoice' },
          ]}
          onChange={setProofType}
        />

        <FlatInput
          label="Description (optional)"
          placeholder="Additional details…"
          value={proofDescription}
          onChange={e => setProofDescription(e.target.value)}
        />
      </AlertModal>

      {/* ================= CONFIRM ACTION MODAL ================= */}
      <AlertModal
        open={isConfirmAction}
        type={
          action === 'approve'
            ? 'success'
            : action === 'reject'
            ? 'error'
            : 'info'
        }
        title={
          action === 'approve'
            ? 'Approve Request'
            : action === 'reject'
            ? 'Reject Request'
            : action === 'purchase'
            ? 'Mark as Purchased'
            : 'Complete Procurement'
        }
        message={
          action === 'approve'
            ? 'Are you sure you want to approve this procurement request?'
            : action === 'reject'
            ? 'Please provide remarks before rejecting this request.'
            : action === 'purchase'
            ? 'Mark this procurement as purchased?'
            : 'Complete this procurement and deduct the budget?'
        }
        confirmText={
          action === 'approve'
            ? 'Approve'
            : action === 'reject'
            ? 'Reject'
            : action === 'purchase'
            ? 'Mark Purchased'
            : 'Complete'
        }
        showCancel
        onConfirm={runAction}
        onClose={() => {
          setAction(null);
          setTargetId(null);
          setRemarks('');
          setModalError(null);
        }}
        confirmDisabled={action === 'reject' && !remarks.trim()}
      >
        {/* 🔴 ERROR MESSAGE */}
        {modalError && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-3">
            {modalError}
          </p>
        )}

        {/* ✏️ REMARKS INPUT */}
        {(action === 'approve' || action === 'reject') && (
          <FlatInput
            label={action === 'reject' ? 'Remarks (required)' : 'Remarks (optional)'}
            placeholder="Enter remarks…"
            value={remarks}
            onChange={e => {
              setRemarks(e.target.value);
              setModalError(null);
            }}
          />
        )}
      </AlertModal>
    </>
  );
}

/* ================= PAGE ================= */
export default function ProcurementManagementPage() {
  return (
    <AuthGuard>
      <ProcurementManagementContent />
    </AuthGuard>
  );
}