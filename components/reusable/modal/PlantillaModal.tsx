'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown, X, Search } from 'lucide-react';
import api from '@/components/lib/api';

interface Official {
  id: number;
  fullName: string;
  position: string;
}

interface Budget {
  id: number;
  code: string;
  program: string;
  classification: {
    id: number;
    name: string;
  } | null;
  object: string;
  remainingAmount: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

export default function PlantillaModal({
  isOpen,
  onClose,
  onSubmit,
}: Props) {
  const [officials, setOfficials] = useState<Official[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(false);

  const [selectedOfficial, setSelectedOfficial] =
    useState<Official | null>(null);
  const [selectedBudget, setSelectedBudget] =
    useState<Budget | null>(null);

  const [searchOfficial, setSearchOfficial] = useState('');
  const [searchBudget, setSearchBudget] = useState('');

  const [officialOpen, setOfficialOpen] = useState(false);
  const [budgetOpen, setBudgetOpen] = useState(false);

  const [form, setForm] = useState({
    amount: '',
    periodCovered: '',
    remarks: '',
  });

  const officialRef = useRef<HTMLDivElement>(null);
  const budgetRef = useRef<HTMLDivElement>(null);

  /* ================= LOAD DATA ================= */
  useEffect(() => {
    if (!isOpen) return;

    async function loadData() {
      try {
        setLoading(true);

        // ✅ FETCH OFFICIALS FOR ACTIVE YEAR
        const officialsRes = await api.get('/sk-officials/active');
        setOfficials(officialsRes.data?.data || []);

        // ✅ FETCH BUDGET ALLOCATIONS (backend already year-aware)
        const budgetRes = await api.get('/budget-allocations');

        const allocations = budgetRes.data?.data || [];

        // Filter: ADMINISTRATIVE + Personal Services
        const personalServices = allocations
          .filter(
            (b: any) =>
              b?.classification?.name
                ?.toLowerCase()
                .includes('personal') &&
              b?.category === 'ADMINISTRATIVE'
          )
          .map((b: any) => ({
            id: b.id,
            code: b.object?.code || '',
            program: b.program?.name || '',
            classification: b.classification
              ? {
                  id: b.classification.id,
                  name: b.classification.name,
                }
              : null,
            object: `${b.object?.code || ''} — ${
              b.object?.name || ''
            }`,
            remainingAmount:
              Number(b.allocatedAmount || 0) -
              Number(b.usedAmount || 0),
          }));

        setBudgets(personalServices);

      } catch (error) {
        console.error('Load error:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [isOpen]);

  /* ================= CLOSE DROPDOWN OUTSIDE ================= */
  useEffect(() => {
    function handleClickOutside(e: any) {
      if (
        officialRef.current &&
        !officialRef.current.contains(e.target)
      )
        setOfficialOpen(false);

      if (
        budgetRef.current &&
        !budgetRef.current.contains(e.target)
      )
        setBudgetOpen(false);
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () =>
      document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isOpen) return null;

  /* ================= SUBMIT ================= */
  const handleSubmit = () => {
    if (!selectedOfficial || !selectedBudget) return;

    onSubmit({
      officialId: selectedOfficial.id,
      budgetAllocationId: selectedBudget.id,
      amount: Number(form.amount),
      periodCovered: form.periodCovered,
      remarks: form.remarks,
    });

    onClose();
  };

  const filteredOfficials = officials.filter((o) =>
    `${o.fullName} ${o.position}`
      .toLowerCase()
      .includes(searchOfficial.toLowerCase())
  );

  const filteredBudgets = budgets.filter((b) =>
    `${b.code} ${b.program} ${b.object}`
      .toLowerCase()
      .includes(searchBudget.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl p-10">

        {/* HEADER */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h2 className="text-2xl font-semibold text-slate-700">
              Add Plantilla
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Assign SK Official to Personal Services budget
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100"
          >
            <X size={18} />
          </button>
        </div>

        {loading ? (
          <div className="py-10 text-center text-slate-500">
            Loading data...
          </div>
        ) : (
          <>
            {/* OFFICIAL SELECT */}
            <div className="mb-6 relative" ref={officialRef}>
              <label className="text-sm font-medium text-slate-600">
                SK Official
              </label>

              <div
                onClick={() => setOfficialOpen(!officialOpen)}
                className="mt-2 border rounded-xl px-4 py-3 flex justify-between items-center cursor-pointer"
              >
                {selectedOfficial
                  ? `${selectedOfficial.fullName} – ${selectedOfficial.position}`
                  : 'Select SK Official'}
                <ChevronDown size={16} />
              </div>

              {officialOpen && (
                <div className="absolute mt-2 w-full bg-white border rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto">
                  {filteredOfficials.map((o) => (
                    <div
                      key={o.id}
                      onClick={() => {
                        setSelectedOfficial(o);
                        setOfficialOpen(false);
                      }}
                      className="px-4 py-3 text-sm hover:bg-blue-50 cursor-pointer"
                    >
                      {o.fullName}
                      <div className="text-xs text-slate-400">
                        {o.position}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* AMOUNT */}
            <div className="mb-6">
              <label className="text-sm font-medium text-slate-600">
                Amount
              </label>
              <input
                type="number"
                value={form.amount}
                onChange={(e) =>
                  setForm({ ...form, amount: e.target.value })
                }
                className="w-full mt-2 border rounded-xl px-4 py-2.5"
              />
            </div>

            {/* PERIOD */}
            <div className="mb-6">
              <label className="text-sm font-medium text-slate-600">
                Period Covered
              </label>
              <input
                value={form.periodCovered}
                onChange={(e) =>
                  setForm({
                    ...form,
                    periodCovered: e.target.value,
                  })
                }
                className="w-full mt-2 border rounded-xl px-4 py-2.5"
              />
            </div>

            {/* REMARKS */}
            <div>
              <label className="text-sm font-medium text-slate-600">
                Remarks
              </label>
              <textarea
                rows={3}
                value={form.remarks}
                onChange={(e) =>
                  setForm({
                    ...form,
                    remarks: e.target.value,
                  })
                }
                className="w-full mt-2 border rounded-xl px-4 py-2.5"
              />
            </div>
          </>
        )}

        <div className="flex justify-end gap-3 mt-10">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-slate-100"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            className="px-7 py-2.5 rounded-xl bg-blue-600 text-white"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}