'use client';

import { useEffect, useState } from 'react';
import {
  Layers,
} from 'lucide-react';

import AuthGuard from '@/components/reusable/guard/AuthGuard';
import {
  CATEGORY_LABELS,
  CLASSIFICATIONS,
  type BudgetCategory,
  type BudgetClassification,
} from '@/lib/budget';

/* ================= CONTENT ================= */
function ClassificationContent() {
  const [items, setItems] = useState<BudgetClassification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [categoryFilter, setCategoryFilter] = useState<
    '' | BudgetCategory
  >('');

  /* ================= FETCH ================= */
  const fetchClassifications = async () => {
    setLoading(true);

    // Fixed: consume the shared hardcoded dataset with the shared type.
    const filtered = categoryFilter
      ? CLASSIFICATIONS.filter((classification) =>
          classification.allowedCategories.includes(categoryFilter)
        )
      : CLASSIFICATIONS;

    setItems(filtered);
    setLoading(false);
  };

  useEffect(() => {
    fetchClassifications();
  }, [categoryFilter]);

  return (
    <>
      {/* ================= HEADER ================= */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Budget Classifications
          </h1>
          <p className="text-sm text-slate-500">
            Organize budget allocations by classification
          </p>
        </div>
      </div>

      {/* ================= FILTER ================= */}
      <div className="mb-6 max-w-xs">
        <label className="text-xs font-medium text-slate-500 block mb-1.5">
          Category Filter
        </label>
        <select
          value={categoryFilter}
          onChange={(e) =>
            setCategoryFilter(
              (e.target.value as '' | 'ADMINISTRATIVE' | 'YOUTH') || ''
            )
          }
          className="w-full rounded-xl bg-white border border-slate-200 px-3 py-2 text-sm"
        >
          <option value="">All Categories</option>
          <option value="ADMINISTRATIVE">  GAP</option>
          <option value="YOUTH">SKYDEP</option>
        </select>
      </div>

      {/* ================= CONTENT ================= */}
      {loading ? (
        <p className="text-sm text-slate-500">
          Loading classifications…
        </p>
      ) : items.length === 0 ? (
        /* EMPTY STATE */
        <div className="w-full rounded-2xl bg-white p-12 shadow-lg shadow-slate-200/60 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-blue-900/10 flex items-center justify-center mb-5">
            <Layers className="text-blue-900" size={28} />
          </div>

          <h3 className="text-lg font-semibold text-slate-900 mb-1">
            No Classifications Found
          </h3>

          <p className="text-sm text-slate-500 max-w-md">
            No classifications available for the selected filter.
          </p>
        </div>
      ) : (
        /* GRID */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {items.map((cls) => (
            <div
              key={cls.id}
              className="rounded-2xl bg-white p-5 shadow-lg shadow-slate-200/60 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
            >
              {/* CARD HEADER */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-900/10 flex items-center justify-center">
                    <Layers className="text-blue-900" size={18} />
                  </div>

                  <div>
                    <h3 className="font-semibold text-slate-900">
                      {cls.name}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Code: {cls.code}
                    </p>
                  </div>
                </div>
              </div>

              {/* DESCRIPTION */}
              {cls.description && (
                <p className="text-sm text-slate-600 mb-3">
                  {cls.description}
                </p>
              )}

              {/* CATEGORY BADGES */}
              <div className="mb-3 flex flex-wrap gap-2">
                {cls.allowedCategories.map((category) => (
                  <span
                    key={category}
                    className="rounded-full bg-blue-50 text-blue-700 text-xs font-medium px-2 py-1"
                  >
                    {CATEGORY_LABELS[category]}
                  </span>
                ))}

                {cls.allowedCategories.length === 0 && (
                  <span className="rounded-full bg-slate-100 text-slate-500 text-xs font-medium px-2 py-1">
                    No category restriction
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

/* ================= PAGE ================= */
export default function ClassificationPage() {
  return (
    <AuthGuard>
      <ClassificationContent />
    </AuthGuard>
  );
}
