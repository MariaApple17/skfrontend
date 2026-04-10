import type { BudgetCategory } from './categories';

// Shared minimal shape used anywhere we only need an id/name pair.
export interface ClassificationReference {
  id: number;
  name: string;
}

// Full budget classification shape used by data setup and allocation screens.
export interface BudgetClassification extends ClassificationReference {
  code: string;
  description?: string;
  allowedCategories: BudgetCategory[];
}

// Alias kept for components that only expect id/name classifications.
export type ExpenditureClassification = ClassificationReference;

export const CLASSIFICATIONS: BudgetClassification[] = [
  {
    id: 1,
    code: 'PS',
    // Fixed: aligned the display name with the rest of the budget dataset.
    name: 'Personnel Services',
    description: 'Salaries and employee compensation',
    allowedCategories: ['ADMINISTRATIVE'],
  },
  {
    id: 2,
    code: 'MOOE',
    name: 'Maintenance and Other Operating Expenses',
    description: 'Operational expenses',
    allowedCategories: ['ADMINISTRATIVE', 'YOUTH'],
  },
  {
    id: 3,
    code: 'CO',
    name: 'Capital Outlay',
    description: 'Equipment and infrastructure',
    // Fixed: kept category support explicit so consumers do not rely on guesses.
    allowedCategories: ['ADMINISTRATIVE', 'YOUTH'],
  },
];

// Fixed: derive the simple id/name list from CLASSIFICATIONS so the two exports
// never disagree on ids or names.
export const EXPENDITURE_CLASSIFICATIONS: ExpenditureClassification[] =
  CLASSIFICATIONS.map(({ id, name }) => ({
    id,
    name,
  }));

// Fixed: central helper for safe relationship lookups from object.classificationId.
export const getClassificationById = (
  classificationId?: number | string | null
) => {
  const normalizedClassificationId = Number(classificationId);

  if (
    !Number.isInteger(normalizedClassificationId) ||
    normalizedClassificationId <= 0
  ) {
    return undefined;
  }

  return CLASSIFICATIONS.find(
    (classification) => classification.id === normalizedClassificationId
  );
};
