'use client';

import { CheckCircle2, Clock3, XCircle } from 'lucide-react';

import {
  getProgramApprovalLabel,
  normalizeProgramApprovalStatus,
  type ProgramWorkflowRecord,
} from '@/lib/programs';

interface Props {
  program: Pick<
    ProgramWorkflowRecord,
    'approvalStatus' | 'status' | 'approvalsCount' | 'approvalsRequired'
  >;
}

const STATUS_STYLES = {
  UPCOMING: {
    icon: Clock3,
    wrapper:
      'border-orange-200 bg-orange-50 text-orange-700',
    iconBox: 'bg-orange-100 text-orange-700',
  },
  APPROVED: {
    icon: CheckCircle2,
    wrapper:
      'border-emerald-200 bg-emerald-50 text-emerald-700',
    iconBox: 'bg-emerald-100 text-emerald-700',
  },
  REJECTED: {
    icon: XCircle,
    wrapper: 'border-rose-200 bg-rose-50 text-rose-700',
    iconBox: 'bg-rose-100 text-rose-700',
  },
} as const;

export default function ProgramApprovalStatusBadge({
  program,
}: Props) {
  const status = normalizeProgramApprovalStatus(
    program.approvalStatus ?? program.status
  );
  const config = STATUS_STYLES[status];
  const Icon = config.icon;

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-semibold ${config.wrapper}`}
    >
      <div
        className={`rounded-lg p-1 ${config.iconBox}`}
      >
        <Icon size={12} />
      </div>

      <span>{getProgramApprovalLabel(program)}</span>
    </div>
  );
}
