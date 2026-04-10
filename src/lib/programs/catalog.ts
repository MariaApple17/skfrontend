export interface ProgramCategory {
  id: number;
  name: string;
}

export const PROGRAM_CATEGORIES: ProgramCategory[] = [
  { id: 1, name: 'Education' },
  { id: 2, name: 'Sports Development' },
  { id: 3, name: 'Health and Wellness' },
  { id: 4, name: 'Peace and Order' },
  { id: 5, name: 'Environment and Disaster Preparedness' },
];

export interface ProgramCatalogItem {
  id: number;
  name: string;
  categoryId: number;
}

export const PROGRAMS: ProgramCatalogItem[] = [
  { id: 1, name: 'School Supplies Distribution', categoryId: 1 },
  { id: 2, name: 'Youth Scholarship Program', categoryId: 1 },
  { id: 3, name: 'Basketball League', categoryId: 2 },
  { id: 4, name: 'Volleyball Tournament', categoryId: 2 },
  { id: 5, name: 'Medical Mission', categoryId: 3 },
  { id: 6, name: 'Anti-Drug Awareness Seminar', categoryId: 4 },
];

export interface ProgramCategoryLookupInput {
  name?: string | null;
  categoryId?: number | null;
  programCategoryId?: number | null;
}

const normalizeProgramName = (name?: string | null) =>
  name?.trim().toLowerCase() ?? '';

export const findProgramCatalogItemByName = (name?: string | null) => {
  const normalizedName = normalizeProgramName(name);

  if (!normalizedName) {
    return null;
  }

  return (
    PROGRAMS.find(
      (program) => normalizeProgramName(program.name) === normalizedName
    ) ?? null
  );
};

export const resolveProgramCategoryId = (
  program: ProgramCategoryLookupInput
) => {
  if (
    Number.isInteger(Number(program.programCategoryId)) &&
    Number(program.programCategoryId) > 0
  ) {
    return Number(program.programCategoryId);
  }

  if (
    Number.isInteger(Number(program.categoryId)) &&
    Number(program.categoryId) > 0
  ) {
    return Number(program.categoryId);
  }

  return findProgramCatalogItemByName(program.name)?.categoryId ?? null;
};
