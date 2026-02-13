'use client';

import {
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Image as ImageIcon,
  Layers,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react';
import {
  useRouter,
  useSearchParams,
} from 'next/navigation';

import api from '@/components/lib/api';
import AuthGuard from '@/components/reusable/guard/AuthGuard';
import AlertModal from '@/components/reusable/modal/AlertModal';
import ProgramUpsertModal from '@/components/reusable/modal/ProgramUpsertModal';
import FlatInput from '@/components/reusable/ui/FlatInput';

/* ================= TYPES ================= */
interface ProgramDocument {
  id: number;
  imageUrl: string;
  title: string;
  uploadedBy: string;
  createdAt: string;
}

interface Program {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  committeeInCharge: string;
  beneficiaries: string;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
  documents: ProgramDocument[];
}

type ProgramStatus = 'upcoming' | 'ongoing' | 'completed' | 'no-dates';

/* ================= DATE STATUS HELPER ================= */
const getProgramStatus = (startDate?: string, endDate?: string): ProgramStatus => {
  if (!startDate && !endDate) return 'no-dates';
  
  const now = new Date();
  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;

  if (start && now < start) return 'upcoming';
  if (end && now > end) return 'completed';
  return 'ongoing';
};

const STATUS_CONFIG = {
  upcoming: {
    label: 'Upcoming',
    icon: Sparkles,
    bg: 'bg-gradient-to-br from-purple-50 to-violet-50',
    text: 'text-purple-700',
    border: 'border-purple-200/60',
    iconBg: 'bg-purple-100',
  },
  ongoing: {
    label: 'Ongoing',
    icon: Clock,
    bg: 'bg-gradient-to-br from-emerald-50 to-teal-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200/60',
    iconBg: 'bg-emerald-100',
  },
  completed: {
    label: 'Completed',
    icon: Calendar,
    bg: 'bg-gradient-to-br from-slate-50 to-gray-50',
    text: 'text-slate-600',
    border: 'border-slate-200/60',
    iconBg: 'bg-slate-100',
  },
  'no-dates': {
    label: 'No Schedule',
    icon: Calendar,
    bg: 'bg-gradient-to-br from-amber-50 to-orange-50',
    text: 'text-amber-700',
    border: 'border-amber-200/60',
    iconBg: 'bg-amber-100',
  },
} as const;

/* ================= IMAGE CAROUSEL COMPONENT ================= */
interface ImageCarouselProps {
  documents: ProgramDocument[];
  programName: string;
}

function ImageCarousel({ documents, programName }: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (documents.length <= 1 || isHovered) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % documents.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [documents.length, isHovered]);

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % documents.length);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + documents.length) % documents.length);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  if (documents.length === 0) {
    return (
      <div className="h-40 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
        <ImageIcon className="text-slate-400" size={32} />
      </div>
    );
  }

  return (
    <div
      className="relative h-40 overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Images */}
      <div
        className="flex transition-transform duration-500 ease-out h-full"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {documents.map((doc) => (
          <img
            key={doc.id}
            src={doc.imageUrl}
            className="w-full h-full object-cover flex-shrink-0"
            alt={doc.title || programName}
          />
        ))}
      </div>

      {/* Navigation Arrows - Only show if more than 1 image */}
      {documents.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="
              absolute left-2 top-1/2 -translate-y-1/2
              w-8 h-8 rounded-full
              bg-black/40 hover:bg-black/60
              backdrop-blur-sm
              text-white
              flex items-center justify-center
              opacity-0 hover:opacity-100 group-hover:opacity-100
              transition-opacity duration-200
            "
            aria-label="Previous image"
          >
            <ChevronLeft size={20} />
          </button>

          <button
            onClick={goToNext}
            className="
              absolute right-2 top-1/2 -translate-y-1/2
              w-8 h-8 rounded-full
              bg-black/40 hover:bg-black/60
              backdrop-blur-sm
              text-white
              flex items-center justify-center
              opacity-0 hover:opacity-100 group-hover:opacity-100
              transition-opacity duration-200
            "
            aria-label="Next image"
          >
            <ChevronRight size={20} />
          </button>
        </>
      )}

      {/* Image Counter Badge */}
      {documents.length > 1 && (
        <div className="
          absolute top-3 right-3
          px-2.5 py-1 rounded-lg
          bg-black/60 backdrop-blur-sm
          text-white text-xs font-medium
          flex items-center gap-1.5
        ">
          <ImageIcon size={12} />
          {currentIndex + 1} / {documents.length}
        </div>
      )}

      {/* Dot Indicators - Only show if more than 1 image */}
      {documents.length > 1 && (
        <div className="
          absolute bottom-3 left-1/2 -translate-x-1/2
          flex gap-1.5
        ">
          {documents.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`
                w-1.5 h-1.5 rounded-full
                transition-all duration-300
                ${index === currentIndex
                  ? 'bg-white w-4'
                  : 'bg-white/50 hover:bg-white/75'}
              `}
              aria-label={`Go to image ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ================= STATUS BADGE COMPONENT ================= */
interface StatusBadgeProps {
  status: ProgramStatus;
}

function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  return (
    <div className={`
      inline-flex items-center gap-1.5 px-3 py-1.5
      rounded-xl border
      ${config.bg} ${config.text} ${config.border}
      transition-all duration-200
    `}>
      <div className={`${config.iconBg} rounded-md p-0.5`}>
        <Icon size={11} strokeWidth={2.5} />
      </div>
      <span className="text-[11px] font-semibold tracking-wide">
        {config.label.toUpperCase()}
      </span>
    </div>
  );
}

function ProgramsContent() {
  const router = useRouter();
  const params = useSearchParams();

  const q = params.get('q') ?? '';
  const isActiveParam = params.get('isActive');
  const startDateFrom = params.get('startDateFrom') ?? '';
  const startDateTo = params.get('startDateTo') ?? '';

  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [uploadingId, setUploadingId] = useState<number | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [alertOpen, setAlertOpen] = useState(false);

  const fileInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});

  /* ================= PARAM HELPER ================= */
  const updateParams = (next: Record<string, any>) => {
    const p = new URLSearchParams(params.toString());
    Object.entries(next).forEach(([k, v]) => {
      if (!v) p.delete(k);
      else p.set(k, String(v));
    });
    router.push(`?${p.toString()}`);
  };

  /* ================= FETCH ================= */
  const fetchPrograms = async () => {
    setLoading(true);
    try {
      const query: any = { q };

      if (isActiveParam === 'true') query.isActive = true;
      if (isActiveParam === 'false') query.isActive = false;
      if (startDateFrom) query.startDateFrom = startDateFrom;
      if (startDateTo) query.startDateTo = startDateTo;

      const res = await api.get('/programs', { params: query });
      setPrograms(res.data?.data ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrograms();
  }, [q, isActiveParam, startDateFrom, startDateTo]);

  /* ================= TOGGLE ================= */
  const toggleStatus = async (id: number) => {
    if (togglingId) return;
    setTogglingId(id);

    setPrograms(prev =>
      prev.map(p =>
        p.id === id ? { ...p, isActive: !p.isActive } : p
      )
    );

    try {
      await api.patch(`/programs/toggle-status/${id}`);
    } catch {
      setPrograms(prev =>
        prev.map(p =>
          p.id === id ? { ...p, isActive: !p.isActive } : p
        )
      );
    } finally {
      setTogglingId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    await api.delete(`/programs/${deleteId}`);
    setAlertOpen(false);
    setDeleteId(null);
    fetchPrograms();
  };

  /* ================= UPLOAD DOCUMENTS ================= */
  const handleUploadDocuments = async (programId: number, files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    setUploadingId(programId);
    
    try {
      const formData = new FormData();
      
      Array.from(files).forEach((file) => {
        formData.append('documents', file);
      });
      
      await api.post(`/programs/${programId}/documents`, formData);

      // Refresh programs to show new documents
      await fetchPrograms();
    } catch (error: any) {
      console.error('Upload failed:', error);
      alert(error.response?.data?.message || 'Failed to upload documents. Please try again.');
    } finally {
      setUploadingId(null);
      // Reset file input
      if (fileInputRefs.current[programId]) {
        fileInputRefs.current[programId]!.value = '';
      }
    }
  };

  return (
    <>
      {/* HEADER */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Programs
          </h1>
          <p className="text-sm text-slate-500">
            Manage programs and beneficiaries
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
            shadow-lg shadow-blue-900/30
            hover:bg-blue-800 hover:shadow-xl
            transition
          "
        >
          <Plus size={16} />
          Create Program
        </button>
      </div>

      {/* FILTERS */}
      <div className="
        rounded-3xl bg-white p-5 mb-10
        shadow-[0_15px_40px_-20px_rgba(0,0,0,0.25)]
      ">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <FlatInput
            label="Search"
            icon={Search}
            value={q}
            onChange={(e) =>
              updateParams({ q: e.target.value })
            }
          />

          <div>
            <label className="text-xs font-medium text-slate-500">
              Status
            </label>
            <select
              value={isActiveParam ?? ''}
              onChange={(e) =>
                updateParams({ isActive: e.target.value })
              }
              className="
                mt-1 w-full rounded-xl bg-gray-100
                px-4 py-3 text-sm
                focus:outline-none
              "
            >
              <option value="">All</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>

          <FlatInput
            label="Start Date From"
            type="date"
            value={startDateFrom}
            onChange={(e) =>
              updateParams({ startDateFrom: e.target.value })
            }
          />

          <FlatInput
            label="Start Date To"
            type="date"
            value={startDateTo}
            onChange={(e) =>
              updateParams({ startDateTo: e.target.value })
            }
          />
        </div>
      </div>

      {/* CONTENT */}
      {loading ? (
        <p className="text-sm text-slate-500">Loading programs…</p>
      ) : programs.length === 0 ? (
        <div className="
          rounded-3xl bg-white p-14 text-center
          shadow-[0_20px_50px_-25px_rgba(0,0,0,0.3)]
        ">
          <div className="
            w-16 h-16 mx-auto mb-5 rounded-2xl
            bg-blue-900/10 flex items-center justify-center
          ">
            <Layers className="text-blue-900" size={28} />
          </div>

          <h3 className="text-lg font-semibold text-slate-900 mb-1">
            No Programs Found
          </h3>

          <p className="text-sm text-slate-500 mb-6 max-w-md mx-auto">
            Programs help organize initiatives and beneficiaries.
            Create your first program to get started.
          </p>

          <button
            onClick={() => {
              setEditId(null);
              setModalOpen(true);
            }}
            className="
              inline-flex items-center gap-2 px-4 py-2 rounded-xl
              bg-blue-900 text-white text-sm font-medium
              shadow-lg shadow-blue-900/30
              hover:bg-blue-800
              transition
            "
          >
            <Plus size={16} />
            Create First Program
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-7">
          {programs.map((p) => {
            const programStatus = getProgramStatus(p.startDate, p.endDate);

            return (
              <div
                key={p.id}
                className="
                  group relative overflow-hidden rounded-3xl bg-white
                  shadow-[0_15px_40px_-20px_rgba(0,0,0,0.25)]
                  hover:shadow-[0_25px_60px_-25px_rgba(0,0,0,0.35)]
                  transition-all duration-300
                "
              >
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-700 via-blue-500 to-indigo-500" />

                <ImageCarousel documents={p.documents} programName={p.name} />

                <div className="p-5 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="
                        w-11 h-11 rounded-2xl bg-blue-900/10
                        flex items-center justify-center flex-shrink-0
                      ">
                        <Layers className="text-blue-900" size={18} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-slate-900 truncate">
                          {p.name}
                        </h3>
                        <p className="text-xs text-slate-500">{p.code}</p>
                      </div>
                    </div>

                    <span
                      className={`
                        text-[11px] px-3 py-1 rounded-full font-semibold flex-shrink-0
                        ${p.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-slate-200 text-slate-600'}
                      `}
                    >
                      {p.isActive ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </div>

                  {/* Program Status Badge */}
                  <div className="flex justify-center">
                    <StatusBadge status={programStatus} />
                  </div>

                  {p.description && (
                    <p className="text-sm text-slate-600 line-clamp-2">
                      {p.description}
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-slate-400 mb-0.5">Committee</p>
                      <p className="font-medium text-slate-700 truncate">
                        {p.committeeInCharge}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-slate-400 mb-0.5">Beneficiaries</p>
                      <p className="font-medium text-slate-700 truncate">
                        {p.beneficiaries}
                      </p>
                    </div>
                  </div>

                  {(p.startDate || p.endDate) && (
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-slate-400 mb-0.5">Start Date</p>
                        <p className="font-medium text-slate-700">
                          {p.startDate
                            ? new Date(p.startDate).toLocaleDateString()
                            : '—'}
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-slate-400 mb-0.5">End Date</p>
                        <p className="font-medium text-slate-700">
                          {p.endDate
                            ? new Date(p.endDate).toLocaleDateString()
                            : '—'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="
                  flex items-center justify-between
                  px-5 py-4 bg-slate-50/70
                ">
                  <div className="flex items-center gap-2">
                    <button
                      disabled={togglingId === p.id}
                      onClick={() => toggleStatus(p.id)}
                      className={`
                        relative h-6 w-11 rounded-full
                        ${p.isActive ? 'bg-blue-600' : 'bg-slate-300'}
                        ${togglingId === p.id ? 'opacity-60' : ''}
                      `}
                    >
                      <span
                        className={`
                          absolute top-0.5 left-0.5
                          h-5 w-5 rounded-full bg-white
                          transition-transform
                          ${p.isActive ? 'translate-x-5' : ''}
                        `}
                      />
                    </button>

                    <button
                      disabled={uploadingId === p.id}
                      onClick={() => fileInputRefs.current[p.id]?.click()}
                      className={`
                        p-2 rounded-lg text-indigo-600
                        hover:bg-indigo-600/10 active:scale-95
                        transition
                        ${uploadingId === p.id ? 'opacity-60 cursor-wait' : ''}
                      `}
                      title="Upload documents"
                    >
                      <Upload size={16} className={uploadingId === p.id ? 'animate-pulse' : ''} />
                    </button>

                    <input
                      ref={(el) => { fileInputRefs.current[p.id] = el; }}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => handleUploadDocuments(p.id, e.target.files)}
                    />
                  </div>

                  <div className="flex gap-1">
                    <button
                      onClick={() => {
                        setEditId(p.id);
                        setModalOpen(true);
                      }}
                      className="
                        p-2 rounded-lg text-blue-900
                        hover:bg-blue-900/10 active:scale-95
                        transition
                      "
                    >
                      <Pencil size={16} />
                    </button>

                    <button
                      onClick={() => {
                        setDeleteId(p.id);
                        setAlertOpen(true);
                      }}
                      className="
                        p-2 rounded-lg text-red-600
                        hover:bg-red-600/10 active:scale-95
                        transition
                      "
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

      {/* MODALS */}
      <ProgramUpsertModal
        open={modalOpen}
        programId={editId}
        onClose={() => setModalOpen(false)}
        onSuccess={fetchPrograms}
      />

      <AlertModal
        open={alertOpen}
        type="warning"
        title="Delete Program"
        message="This program will be permanently removed. Continue?"
        confirmText="Delete"
        showCancel
        onConfirm={confirmDelete}
        onClose={() => setAlertOpen(false)}
      />
    </>
  );
}

export default function ProgramsPage() {
  return (
    <AuthGuard>
      <ProgramsContent />
    </AuthGuard>
  );
}