'use client'

import { Calendar, Clock, Image, Layers, Users } from 'lucide-react'

interface ProgramDocument {
  id: number
  imageUrl: string
  title?: string
  uploadedBy?: string
  createdAt: string
}

interface ApprovalRecord {
  id: number
  member: string
  role: string
  decision: 'approved' | 'rejected'
  status: string
  remarks?: string | null
  actedAt: string
}

interface ProgramDetail {
  id: number
  code: string
  name: string
  description?: string | null
  committeeInCharge: string
  beneficiaries: string
  startDate?: string | null
  endDate?: string | null
  isActive?: boolean
  approvalStatus: string
  approvalsCount?: number
  approvalsRequired?: number
  approvalSummary?: {
    pendingLabel?: string
  }
  approvals?: ApprovalRecord[]
  documents?: ProgramDocument[]
  createdAt?: string
  updatedAt?: string | null
}

interface ProgramDetailModalProps {
  open: boolean
  loading: boolean
  program: ProgramDetail | null
  onClose: () => void
}

const formatDate = (value?: string | null) => {
  if (!value) return 'N/A'
  return new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const getStatusLabel = (status?: string) => {
  const normalized = status?.toUpperCase() ?? 'UNKNOWN'
  if (normalized === 'APPROVED') return 'Approved'
  if (normalized === 'REJECTED') return 'Rejected'
  if (normalized === 'DRAFT') return 'Draft'
  if (normalized === 'SUBMITTED') return 'Submitted'
  return normalized
}

export default function ProgramDetailModal({
  open,
  loading,
  program,
  onClose,
}: ProgramDetailModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
      <div className="w-full max-w-5xl overflow-hidden rounded-4xl border border-slate-200 bg-white shadow-2xl ring-1 ring-slate-950/5">
        <div className="relative overflow-hidden bg-slate-900/5 px-6 py-6 sm:px-8 sm:py-8">
          <div className="absolute inset-x-0 top-0 h-44 bg-linear-to-r from-sky-400/10 via-transparent to-emerald-400/10" />
          <div className="relative space-y-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-2xl">
                <span className="inline-flex items-center rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-sky-700">
                  {getStatusLabel(program?.approvalStatus)}
                </span>
                <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
                  {program?.name}
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  {program?.code ?? 'Program code unavailable'}
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                Close
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Program period</p>
                <p className="mt-2 text-sm font-semibold text-slate-900">
                  {formatDate(program?.startDate)} — {formatDate(program?.endDate)}
                </p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Approval progress</p>
                <p className="mt-2 text-sm font-semibold text-slate-900">
                  {program?.approvalsCount ?? 0} / {program?.approvalsRequired ?? 4}
                </p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Active</p>
                <p className="mt-2 text-sm font-semibold text-slate-900">
                  {(program?.isActive || program?.approvalStatus?.toUpperCase() === 'APPROVED') ? 'Yes' : 'No'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-10 text-center text-slate-500">
            Loading details...
          </div>
        ) : (
          <div className="space-y-6 p-6 sm:p-8">
            <div className="grid gap-6 xl:grid-cols-[1.15fr_1fr]">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
                <div className="space-y-5">
                  <div className="space-y-3">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Committee in charge</p>
                    <p className="text-lg font-semibold text-slate-950">{program?.committeeInCharge ?? 'N/A'}</p>
                  </div>

                  <div className="space-y-3">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Beneficiaries</p>
                    <p className="text-lg font-semibold text-slate-950">{program?.beneficiaries ?? 'N/A'}</p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-3xl bg-white p-4 shadow-sm">
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Created</p>
                      <p className="mt-2 text-sm font-semibold text-slate-900">{formatDate(program?.createdAt)}</p>
                    </div>
                    <div className="rounded-3xl bg-white p-4 shadow-sm">
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Updated</p>
                      <p className="mt-2 text-sm font-semibold text-slate-900">{formatDate(program?.updatedAt)}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Description</p>
                <p className="mt-4 text-sm leading-7 text-slate-700">
                  {program?.description ?? 'No description provided.'}
                </p>
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
                <div className="flex items-center gap-3 text-slate-500">
                  <Image size={18} />
                  <span className="text-xs uppercase tracking-[0.24em]">Proof images</span>
                </div>
                <p className="mt-3 text-sm text-slate-900">{program?.documents?.length ?? 0} uploaded</p>
                {program?.documents?.length ? (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {program.documents.slice(0, 4).map((doc) => (
                      <div key={doc.id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                        <img src={doc.imageUrl} alt={doc.title ?? 'Program proof'} className="h-28 w-full object-cover" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-4 rounded-3xl border border-dashed border-slate-200 bg-white/80 p-5 text-center text-sm text-slate-500">
                    No proof images uploaded yet.
                  </div>
                )}
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
                <div className="flex items-center gap-3 text-slate-500">
                  <Layers size={18} />
                  <span className="text-xs uppercase tracking-[0.24em]">Approval decisions</span>
                </div>

                {program?.approvals && program.approvals.length > 0 ? (
                  <div className="mt-4 space-y-3">
                    {program.approvals.map((approval) => (
                      <div key={approval.id} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-slate-950">{approval.member}</p>
                            <p className="text-xs text-slate-500">{approval.role}</p>
                          </div>
                          <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${approval.decision === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                            {approval.decision.toUpperCase()}
                          </span>
                        </div>
                        <p className="mt-3 text-xs text-slate-500">{formatDate(approval.actedAt)}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-4 rounded-3xl border border-dashed border-slate-200 bg-white/80 p-5 text-center text-sm text-slate-500">
                    No approval decisions recorded yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
