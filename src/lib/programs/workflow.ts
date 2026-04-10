export const PROGRAM_PROOF_ACCEPT = '.jpg,.jpeg,.png,.pdf';

export const PROGRAM_PROOF_ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'application/pdf',
]);

export const PROGRAM_PROOF_MAX_SIZE_BYTES = 5 * 1024 * 1024;

export interface ProgramDocument {
  id: number;
  imageUrl: string;
  mimeType?: string | null;
  title?: string | null;
  description?: string | null;
  uploadedBy?: string | null;
  createdAt: string;
}

export interface ProgramApprovalUser {
  id: number;
  email?: string;
  fullName: string;
  role?: {
    id?: number;
    name: string;
  } | null;
}

export interface ProgramApprovalRecord {
  id: number;
  approverId: number;
  role: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  remarks?: string | null;
  actedAt?: string | null;
  createdAt: string;
  approver?: ProgramApprovalUser | null;
}

export interface ProgramApprovalSummary {
  approvalsRequired: number;
  approvedCount: number;
  rejectedCount: number;
  pendingCount: number;
  isComplete: boolean;
  isRejected: boolean;
  pendingLabel: string;
}

export interface ProgramWorkflowRecord {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  committeeInCharge: string;
  beneficiaries: string;
  startDate?: string | null;
  endDate?: string | null;
  status?: string;
  approvalStatus?: string;
  approvalsRequired: number;
  approvalsCount: number;
  approvals?: ProgramApprovalRecord[];
  approvalSummary?: ProgramApprovalSummary;
  documents?: ProgramDocument[];
}

export interface SessionUser {
  id: number;
  email?: string;
  fullName?: string;
  role?: {
    id?: number;
    name?: string;
  } | null;
}

export const normalizeProgramApprovalStatus = (
  status?: string | null
) => {
  const normalized = status?.toUpperCase();

  if (
    normalized === 'UPCOMING' ||
    normalized === 'DRAFT' ||
    normalized === 'SUBMITTED'
  ) {
    return 'UPCOMING';
  }

  if (normalized === 'APPROVED') {
    return 'APPROVED';
  }

  if (normalized === 'REJECTED') {
    return 'REJECTED';
  }

  return 'UPCOMING';
};

export const getProgramApprovalProgress = (
  program: Pick<
    ProgramWorkflowRecord,
    'approvalsCount' | 'approvalsRequired'
  >
) =>
  `${program.approvalsCount ?? 0}/${
    program.approvalsRequired ?? 4
  }`;

export const getProgramApprovalLabel = (
  program: Pick<
    ProgramWorkflowRecord,
    'approvalStatus' | 'status' | 'approvalsCount' | 'approvalsRequired'
  >
) => {
  const normalizedStatus = normalizeProgramApprovalStatus(
    program.approvalStatus ?? program.status
  );

  if (normalizedStatus === 'APPROVED') {
    return 'Approved';
  }

  if (normalizedStatus === 'REJECTED') {
    return 'Rejected';
  }

  return `Pending Approval (${getProgramApprovalProgress(program)})`;
};

export const isImageProgramDocument = (
  document?: ProgramDocument | null
) => {
  if (!document) {
    return false;
  }

  if (document.mimeType?.startsWith('image/')) {
    return true;
  }

  const url = document.imageUrl.toLowerCase();

  return (
    url.includes('.jpg') ||
    url.includes('.jpeg') ||
    url.includes('.png')
  );
};

export const getImageProgramDocuments = (
  documents: ProgramDocument[] = []
) => documents.filter(isImageProgramDocument);

export const validateProgramProofFile = (file?: File | null) => {
  if (!file) {
    return 'Please select a proof file.';
  }

  if (!PROGRAM_PROOF_ALLOWED_MIME_TYPES.has(file.type)) {
    return 'Only JPG, PNG, or PDF files are allowed.';
  }

  if (file.size > PROGRAM_PROOF_MAX_SIZE_BYTES) {
    return 'File must be 5MB or smaller.';
  }

  return null;
};

export const getAssignedApprovalForUser = (
  approvals: ProgramApprovalRecord[] = [],
  userId?: number | null
) => {
  if (!userId) {
    return null;
  }

  return (
    approvals.find(
      (approval) =>
        Number(approval.approverId) === Number(userId)
    ) ?? null
  );
};
