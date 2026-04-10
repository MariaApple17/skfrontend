'use client';

import {
  useEffect,
  useState,
} from 'react';

import {
  FileText,
  Layers,
} from 'lucide-react';

import AuthGuard from '@/components/reusable/guard/AuthGuard';
import {
  CLASSIFICATIONS,
  getClassificationById,
  OBJECTS_OF_EXPENDITURE,
  type ExpenditureClassification,
  type ObjectOfExpenditure,
} from '@/lib/budget';
import { AdminPageShimmer } from '@/components/reusable/ui/PageShimmer';

/* ================= TYPES ================= */
interface ObjectWithClassification extends ObjectOfExpenditure {
  classification?: ExpenditureClassification;
}

/* ================= CONTENT ================= */
function ObjectOfExpenditureContent() {
  const [items, setItems] = useState<ObjectWithClassification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  /* PAGINATION */
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(6);
  const [totalPages, setTotalPages] = useState<number>(1);

  /* ================= FETCH ================= */
  const fetchObjects = async () => {
    setLoading(true);
    try {
      const objectsWithClassifications = OBJECTS_OF_EXPENDITURE.map((obj) => ({
        ...obj,
        classification: getClassificationById(obj.classificationId),
      }));

      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedItems = objectsWithClassifications.slice(startIndex, endIndex);

      setItems(paginatedItems);
      setTotalPages(Math.ceil(objectsWithClassifications.length / limit));
    } catch (err) {
      console.error('Failed to load objects of expenditure', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchObjects();
  }, [page]);

  return (
    <>
      {/* ================= HEADER ================= */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Objects of Expenditure
          </h1>
          <p className="text-sm text-slate-500">
            Define and manage expenditure categories
          </p>
        </div>
      </div>

      {/* ================= CONTENT ================= */}
      {loading ? (
        <AdminPageShimmer cards={6} showFilters={false} />
      ) : items.length === 0 ? (
        <div className="w-full rounded-2xl bg-white p-12 shadow-lg shadow-slate-200/60 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-blue-900/10 flex items-center justify-center mb-5">
            <Layers className="text-blue-900" size={28} />
          </div>

          <h3 className="text-lg font-semibold text-slate-900 mb-1">
            No Objects Found
          </h3>

          <p className="text-sm text-slate-500 max-w-md">
            No objects of expenditure are available.
          </p>
        </div>
      ) : (
        <>
          {/* GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {items.map((obj) => (
              <div
                key={obj.id}
                className="rounded-2xl bg-white p-5 shadow-lg shadow-slate-200/60 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-900/10 flex items-center justify-center">
                    <FileText className="text-blue-900" size={18} />
                  </div>

                  <div>
                    <h3 className="font-semibold text-slate-900">
                      {obj.name}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Code: {obj.code}
                    </p>
                    <p className="text-xs text-blue-700 font-medium">
                      {obj.classification?.name}
                    </p>
                  </div>
                </div>

              </div>
            ))}
          </div>

          {/* ================= PAGINATION ================= */}
          <div className="flex justify-center items-center gap-4 mt-10">
            <button
              onClick={() => setPage((prev) => prev - 1)}
              disabled={page === 1}
              className="px-4 py-2 rounded-lg bg-slate-200 text-sm font-medium disabled:opacity-40"
            >
              Previous
            </button>

            <span className="text-sm text-slate-600">
              Page {page} of {totalPages}
            </span>

            <button
              onClick={() => setPage((prev) => prev + 1)}
              disabled={page === totalPages}
              className="px-4 py-2 rounded-lg bg-blue-900 text-white text-sm font-medium disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </>
      )}

    </>
  );
}

/* ================= PAGE ================= */
export default function ObjectOfExpenditurePage() {
  return (
    <AuthGuard>
      <ObjectOfExpenditureContent />
    </AuthGuard>
  );
}
