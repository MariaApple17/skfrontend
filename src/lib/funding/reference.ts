import {
  CATEGORY_LABELS,
  type BudgetCategory,
} from '@/lib/budget';
import {
  PROGRAM_CATEGORIES,
  resolveProgramCategoryId,
} from '@/lib/programs';

export const PROGRAM_REFERENCE_LIMIT = 100;
export const FUNDING_ALLOCATION_LIMIT = 1000;

export const BUDGET_CATEGORY_OPTIONS = Object.entries(CATEGORY_LABELS).map(
  ([id, label]) => ({
    id,
    label,
  })
);

export const PROGRAM_CATEGORY_OPTIONS = PROGRAM_CATEGORIES.map(
  (programCategory) => ({
    id: programCategory.id,
    name: programCategory.name,
  })
);

export interface FundingProgramRecord {
  id: number;
  code: string;
  name: string;
  startDate?: string | null;
  categoryId?: number | null;
  programCategoryId?: number | null;
}

export interface FundingAllocationApiRecord {
  id: number;
  programId?: number | null;
  category?: BudgetCategory | null;
  allocatedAmount?: number | string;
  usedAmount?: number | string;
  program?: {
    id: number;
    code: string;
    name: string;
  } | null;
  classification?: {
    code: string;
    name: string;
  } | null;
  object?: {
    code: string;
    name: string;
  } | null;
}

export interface FundingAllocationRecord {
  id: number;
  programId: number | null;
  category: BudgetCategory | null;
  remaining: number;
  label: string;
}

export const normalizeFundingPrograms = <
  T extends FundingProgramRecord,
>(
  programs: T[]
) =>
  programs.map((program) => ({
    ...program,
    categoryId: resolveProgramCategoryId(program),
    programCategoryId: resolveProgramCategoryId(program),
  })) as Array<
    T & {
      categoryId: number | null;
      programCategoryId: number | null;
    }
  >;

export const filterProgramsByProgramCategory = <
  T extends {
    categoryId?: number | string | null;
    programCategoryId?: number | string | null;
  },
>(
  programs: T[],
  programCategoryId: string
) => {
  if (!programCategoryId) {
    return [];
  }

  return programs.filter(
    (program) =>
      String(
        program.programCategoryId ?? program.categoryId ?? ''
      ) === programCategoryId
  );
};

export const normalizeFundingAllocations = (
  allocations: FundingAllocationApiRecord[]
): FundingAllocationRecord[] =>
  allocations.map((allocation) => {
    const remaining =
      Number(allocation.allocatedAmount ?? 0) -
      Number(allocation.usedAmount ?? 0);

    return {
      id: Number(allocation.id),
      programId:
        allocation.programId === null ||
        allocation.programId === undefined
          ? null
          : Number(allocation.programId),
      category: (allocation.category ?? null) as BudgetCategory | null,
      remaining,
      label:
        `${allocation?.program?.code ?? 'GAP'} – ` +
        `${allocation?.program?.name ?? 'General Administrative Program'} • ` +
        `${allocation?.classification?.name ?? 'Unknown'} • ` +
        `${allocation?.object?.name ?? 'Unknown'} • ` +
        `(₱${remaining.toLocaleString()} remaining)`,
    };
  });

export const filterAllocationsByCategoryAndProgram = (
  allocations: FundingAllocationRecord[],
  category: BudgetCategory | '',
  programId: string
) => {
  if (!category) {
    return [];
  }

  if (category === 'ADMINISTRATIVE') {
    return allocations.filter(
      (allocation) =>
        allocation.category === 'ADMINISTRATIVE' &&
        allocation.programId === null
    );
  }

  if (!programId) {
    return [];
  }

  return allocations.filter(
    (allocation) =>
      allocation.category === 'YOUTH' &&
      allocation.programId === Number(programId)
  );
};
