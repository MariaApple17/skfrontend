'use client';

import { useMemo } from 'react';

import FlatSelect from '@/components/reusable/ui/FlatSelect';
import { filterProgramsByProgramCategory } from '@/lib/funding/reference';

export interface ProgramCategoryOption {
  id: number | string;
  name: string;
}

export interface CategorizedProgramOption {
  id: number | string;
  name: string;
  code?: string;
  categoryId?: number | string | null;
}

interface ProgramCategoryProgramSelectProps {
  categoryValue: string;
  programValue: string;
  categories: ProgramCategoryOption[];
  programs: CategorizedProgramOption[];
  onCategoryChange: (categoryId: string) => void;
  onProgramChange: (programId: string) => void;
}

const ProgramCategoryProgramSelect = ({
  categoryValue,
  programValue,
  categories,
  programs,
  onCategoryChange,
  onProgramChange,
}: ProgramCategoryProgramSelectProps) => {
  const filteredPrograms = useMemo(() => {
    return filterProgramsByProgramCategory(programs, categoryValue);
  }, [categoryValue, programs]);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <FlatSelect
          label="Program Category"
          value={categoryValue}
          options={categories.map((category) => ({
            id: category.id,
            label: category.name,
          }))}
          placeholder="Select Category"
          onChange={(nextCategoryId) => {
            onCategoryChange(nextCategoryId);
            onProgramChange('');
          }}
        />

        <FlatSelect
          label="Program"
          value={programValue}
          options={filteredPrograms.map((program) => ({
            id: program.id,
            label: program.code
              ? `${program.code} - ${program.name}`
              : program.name,
          }))}
          placeholder={
            categoryValue ? 'Select Program' : 'Select Category First'
          }
          disabled={!categoryValue || filteredPrograms.length === 0}
          onChange={onProgramChange}
        />
      </div>

      {categoryValue && filteredPrograms.length === 0 && (
        <p className="text-sm text-amber-600">
          No programs are available for the selected program category.
        </p>
      )}
    </div>
  );
};

export default ProgramCategoryProgramSelect;
