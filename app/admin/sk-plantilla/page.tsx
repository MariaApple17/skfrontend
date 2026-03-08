'use client';

import { useState, useEffect } from 'react';
import { Plus, Users } from 'lucide-react';

import PlantillaModal from '@/components/reusable/modal/PlantillaModal';
import AlertModal from '@/components/reusable/modal/AlertModal';
import api from '@/components/lib/api';
import { AdminPageShimmer } from '@/components/reusable/ui/PageShimmer';

/* ================= TYPES ================= */

interface FiscalYear {
  id: number;
  year: string;
  isActive: boolean;
}

interface Plantilla {
  id: number;
  official: {
    fullName: string;
    position: string;
  };
  budgetAllocation: {
    classification: {
      name: string;
    };
  };
  amount: number;
  periodCovered: string;
  remarks?: string;
}

/* ================= PAGE ================= */

export default function PlantillaPage() {

  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<Plantilla[]>([]);
  const [loading, setLoading] = useState(true);

  const [fiscalYears, setFiscalYears] = useState<FiscalYear[]>([]);
  const [selectedFiscalYearId, setSelectedFiscalYearId] =
    useState<number | null>(null);

  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] =
    useState<'success' | 'error' | 'warning' | 'info'>('error');

  /* ================= LOAD FISCAL YEARS ================= */

  useEffect(() => {

    async function loadFiscalYears() {

      try {

        const res = await api.get('/fiscal-years');
        const years = res.data?.data || [];

        setFiscalYears(years);

        const active = years.find((y: FiscalYear) => y.isActive);

        if (active) setSelectedFiscalYearId(active.id);

      } catch (error) {
        console.error('Failed to load fiscal years', error);
      }

    }

    loadFiscalYears();

  }, []);

  /* ================= FETCH PLANTILLA ================= */

  const fetchPlantilla = async (fiscalYearId: number) => {

    try {

      setLoading(true);

      const res = await api.get('/sk-plantilla', {
        params: { fiscalYearId }
      });

      setData(res.data?.data || []);

    } catch (error) {
      console.error('Failed to fetch plantilla:', error);
    }

    finally {
      setLoading(false);
    }

  };

  useEffect(() => {

    if (!selectedFiscalYearId) return;

    fetchPlantilla(selectedFiscalYearId);

  }, [selectedFiscalYearId]);

  /* ================= HANDLE CREATE ================= */

  const handleCreate = async (newPlantilla: any) => {

    try {

      await api.post('/sk-plantilla', {
        ...newPlantilla,
        fiscalYearId: selectedFiscalYearId
      });

      if (selectedFiscalYearId) {
        fetchPlantilla(selectedFiscalYearId);
      }

    }

    catch (error: any) {

      const message =
        error.response?.data?.message ||
        "Something went wrong.";

      setAlertMessage(message);

      setAlertType(
        message.includes("Insufficient")
          ? "warning"
          : "error"
      );

      setAlertOpen(true);

    }

  };

  /* ================= UI ================= */

  return (

    <div className="p-8">

      <div className="bg-white border border-slate-100 rounded-3xl shadow-sm p-8">

        {/* HEADER */}

        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">

          <div>

            <h1 className="text-2xl font-semibold text-slate-700">
              Plantilla of SK Officials
            </h1>

            <p className="text-sm text-slate-400 mt-1">
              Manage honorarium allocations for SK officials
            </p>

          </div>

          <button
            onClick={() => setIsOpen(true)}
            disabled={!selectedFiscalYearId}
            className="
            flex items-center gap-2
            px-5 py-2.5
            rounded-xl
            bg-slate-700 text-white
            text-sm font-medium
            hover:bg-slate-600
            transition
            disabled:opacity-40
            "
          >

            <Plus size={16} />
            Add Plantilla

          </button>

        </div>

        {/* CONTENT */}

        {loading ? (
          <AdminPageShimmer cards={6} showFilters={false} table />

        ) : data.length === 0 ? (

          /* EMPTY STATE */

          <div className="flex flex-col items-center text-center py-16">

            <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mb-4">
              <Users size={24} className="text-slate-400"/>
            </div>

            <h3 className="text-lg font-medium text-slate-600 mb-1">
              No Plantilla Records
            </h3>

            <p className="text-sm text-slate-400 mb-6 max-w-sm">
              Add honorarium allocations for SK officials to manage payroll and allowances.
            </p>

            <button
              onClick={() => setIsOpen(true)}
              className="
              flex items-center gap-2
              px-5 py-2.5
              rounded-xl
              bg-slate-700 text-white
              text-sm font-medium
              hover:bg-slate-600
              transition
              "
            >
              <Plus size={16}/>
              Create First Plantilla
            </button>

          </div>

        ) : (

          /* TABLE */

          <div className="overflow-x-auto">

            <table className="w-full border-collapse">

              <thead>

                <tr className="bg-slate-50 text-left text-xs uppercase text-slate-400 tracking-wide">

                  <th className="p-4">Name</th>
                  <th className="p-4">Position</th>
                  <th className="p-4">Classification</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Period</th>
                  <th className="p-4">Remarks</th>

                </tr>

              </thead>

              <tbody>

                {data.map((item) => (

                  <tr
                    key={item.id}
                    className="border-t border-slate-100 hover:bg-slate-50 transition"
                  >

                    <td className="p-4 font-medium text-slate-700">
                      {item.official?.fullName}
                    </td>

                    <td className="p-4 text-slate-600">
                      {item.official?.position}
                    </td>

                    <td className="p-4 text-slate-600">
                      {item.budgetAllocation?.classification?.name}
                    </td>

                    <td className="p-4 text-slate-700 font-medium">
                      ₱ {Number(item.amount).toLocaleString()}
                    </td>

                    <td className="p-4 text-slate-600">
                      {item.periodCovered}
                    </td>

                    <td className="p-4 text-slate-500">
                      {item.remarks}
                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        )}

      </div>

      {/* MODAL */}

      <PlantillaModal
        isOpen={isOpen}
        selectedFiscalYearId={selectedFiscalYearId}
        onClose={() => setIsOpen(false)}
        onSubmit={handleCreate}
      />

      {/* ALERT */}

      <AlertModal
        open={alertOpen}
        title="Action Not Allowed"
        message={alertMessage}
        type={alertType}
        onClose={() => setAlertOpen(false)}
      />

    </div>

  );

}
