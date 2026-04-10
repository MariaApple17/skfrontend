'use client';

import FlatSelect from '@/components/reusable/ui/FlatSelect';

interface Option {
  id: number | string;
  label: string;
}

interface ProcurementFundingSelectorProps {
  categoryValue: string;
  programCategoryValue: string;
  programValue: string;
  allocationValue: string;
  categoryOptions: Option[];
  programCategoryOptions: Option[];
  programOptions: Option[];
  allocationOptions: Option[];
  onCategoryChange: (value: string) => void;
  onProgramCategoryChange: (value: string) => void;
  onProgramChange: (value: string) => void;
  onAllocationChange: (value: string) => void;
}

const ProcurementFundingSelector = ({
  categoryValue,
  programCategoryValue,
  programValue,
  allocationValue,
  categoryOptions,
  programCategoryOptions,
  programOptions,
  allocationOptions,
  onCategoryChange,
  onProgramCategoryChange,
  onProgramChange,
  onAllocationChange,
}: ProcurementFundingSelectorProps) => {
  const isGap = categoryValue === 'ADMINISTRATIVE';
  const canSelectProgramCategory = categoryValue === 'YOUTH';
  const canSelectProgram =
    categoryValue === 'YOUTH' &&
    Boolean(programCategoryValue) &&
    canSelectProgramCategory;
  const canSelectAllocation =
    Boolean(categoryValue) &&
    (isGap || Boolean(programValue));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <FlatSelect
          label="Category"
          value={categoryValue}
          options={categoryOptions}
          placeholder="Select Category"
          onChange={onCategoryChange}
        />

        <FlatSelect
          label="Program Category"
          value={programCategoryValue}
          options={programCategoryOptions}
          placeholder={
            !categoryValue
              ? 'Select Category First'
              : isGap
                ? 'Not required for GAP'
                : 'Select Program Category'
          }
          disabled={!canSelectProgramCategory}
          onChange={onProgramCategoryChange}
        />

        <FlatSelect
          label="Program"
          value={programValue}
          options={programOptions}
          placeholder={
            !categoryValue
              ? 'Select Category First'
              : isGap
                ? 'Not required for GAP'
                : !programCategoryValue
                  ? 'Select Program Category First'
                  : 'Select Program'
          }
          disabled={!canSelectProgram}
          onChange={onProgramChange}
        />

        <FlatSelect
          label="Source of Funds"
          value={allocationValue}
          options={allocationOptions}
          placeholder={
            !categoryValue
              ? 'Select Category First'
              : !isGap && !programCategoryValue
                ? 'Select Program Category First'
                : !isGap && !programValue
                  ? 'Select Program First'
                  : 'Select Source of Funds'
          }
          disabled={!canSelectAllocation || allocationOptions.length === 0}
          onChange={onAllocationChange}
        />
      </div>

      {isGap && categoryValue && (
        <p className="text-sm text-amber-600">
          Program category and program are not required for GAP.
        </p>
      )}

      {categoryValue === 'YOUTH' && programCategoryOptions.length === 0 && (
        <p className="text-sm text-amber-600">
          No program categories are available for the selected category.
        </p>
      )}

      {categoryValue &&
        programCategoryValue &&
        programOptions.length === 0 && (
          <p className="text-sm text-amber-600">
            No programs available.
          </p>
        )}

      {categoryValue &&
        (isGap || programValue) &&
        allocationOptions.length === 0 && (
          <p className="text-sm text-amber-600">
            No budget allocated.
          </p>
        )}
    </div>
  );
};

export default ProcurementFundingSelector;
