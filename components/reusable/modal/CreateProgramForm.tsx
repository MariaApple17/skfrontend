'use client';

import { useMemo, useState } from 'react';

export interface ProgramCategory {
  id: number;
  name: string;
}

export interface Program {
  id: number;
  name: string;
  categoryId: number;
}

export const PROGRAM_CATEGORIES: ProgramCategory[] = [
  { id: 1, name: 'Education' },
  { id: 2, name: 'Sports Development' },
  { id: 3, name: 'Health and Wellness' },
  { id: 4, name: 'Peace and Order' },
  { id: 5, name: 'Environment and Disaster Preparedness' },
];

export const PROGRAMS: Program[] = [
  { id: 1, name: 'School Supplies Distribution', categoryId: 1 },
  { id: 2, name: 'Youth Scholarship Program', categoryId: 1 },
  { id: 3, name: 'Basketball League', categoryId: 2 },
  { id: 4, name: 'Volleyball Tournament', categoryId: 2 },
  { id: 5, name: 'Medical Mission', categoryId: 3 },
  { id: 6, name: 'Anti-Drug Awareness Seminar', categoryId: 4 },
];

const CreateProgramForm = () => {
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedProgram, setSelectedProgram] = useState<number | null>(null);

  const filteredPrograms = useMemo(() => {
    if (!selectedCategory) {
      return [];
    }

    return PROGRAMS.filter(
      (program) => program.categoryId === selectedCategory
    );
  }, [selectedCategory]);

  return (
    <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Create Program</h2>
          <p className="mt-2 text-sm text-slate-600">
            Select a category first, then choose a program from the filtered list.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Program Category</span>
            <select
              value={selectedCategory ?? ''}
              onChange={(event) => {
                const nextCategory = Number(event.target.value);
                setSelectedCategory(nextCategory || null);
                setSelectedProgram(null);
              }}
              className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
            >
              <option value="">Select Category</option>
              {PROGRAM_CATEGORIES.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Program</span>
            <select
              value={selectedProgram ?? ''}
              onChange={(event) => {
                const nextProgram = Number(event.target.value);
                setSelectedProgram(nextProgram || null);
              }}
              disabled={!selectedCategory || filteredPrograms.length === 0}
              className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-100"
            >
              <option value="">
                {selectedCategory ? 'Select Program' : 'Select Category First'}
              </option>
              {filteredPrograms.map((program) => (
                <option key={program.id} value={program.id}>
                  {program.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        {selectedCategory && filteredPrograms.length === 0 && (
          <p className="text-sm text-amber-600">
            No programs are available for the selected category.
          </p>
        )}

        <div className="rounded-3xl bg-slate-50 p-4 text-sm text-slate-700">
          <p className="font-semibold text-slate-900">Current selection</p>
          <p className="mt-2">
            Category:{' '}
            <span className="font-medium text-slate-900">
              {selectedCategory
                ? PROGRAM_CATEGORIES.find((category) => category.id === selectedCategory)
                    ?.name
                : 'None'}
            </span>
          </p>
          <p className="mt-1">
            Program:{' '}
            <span className="font-medium text-slate-900">
              {selectedProgram
                ? PROGRAMS.find((program) => program.id === selectedProgram)
                    ?.name
                : 'None'}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default CreateProgramForm;
