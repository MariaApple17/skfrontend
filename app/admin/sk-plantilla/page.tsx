'use client';

import { useEffect, useState } from 'react';
import PlantillaModal from '@/components/reusable/modal/PlantillaModal';
import api from '@/components/lib/api';

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

interface FiscalYear {
  id: number;
  year: number;
  isActive: boolean;
}

export default function PlantillaPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<Plantilla[]>([]);
  const [activeFiscal, setActiveFiscal] = useState<FiscalYear | null>(null);
  const [loading, setLoading] = useState(true);

  /* ============================================
     FETCH PLANTILLA BY ACTIVE FISCAL YEAR
  ============================================ */
  const fetchPlantilla = async () => {
    try {
      setLoading(true);

      // 1️⃣ Get active fiscal year
      const fiscalRes = await api.get('/fiscal-years');
      const active = fiscalRes.data?.data?.find(
        (f: FiscalYear) => f.isActive
      );

      if (!active) {
        console.error('No active fiscal year found');
        return;
      }

      setActiveFiscal(active);

      // 2️⃣ Fetch plantilla records
      const res = await api.get(
        `/sk-plantilla/fiscal/${active.id}`
      );

      setData(res.data.data);

    } catch (error) {
      console.error('Failed to fetch plantilla:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlantilla();
  }, []);

  /* ============================================
     HANDLE CREATE (Instant UI Update)
  ============================================ */
  const handleCreate = async (payload: any) => {
    try {
      const res = await api.post('/sk-plantilla', payload);

      // Immediately show newly created record
      setData((prev) => [res.data.data, ...prev]);

    } catch (error) {
      console.error('Create failed:', error);
    }
  };

  return (
    <div className="p-6">
      <div className="bg-white rounded-2xl shadow-md p-6">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-xl font-semibold">
              Plantilla of SK Officials
            </h1>
            <p className="text-sm text-gray-500">
              Fiscal Year: {activeFiscal?.year ?? '—'}
            </p>
          </div>

          <button
            onClick={() => setIsOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition"
          >
            + Add Plantilla
          </button>
        </div>

        {/* TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="p-3">Name</th>
                <th className="p-3">Position</th>
                <th className="p-3">Classification</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Period</th>
                <th className="p-3">Remarks</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center p-6">
                    Loading...
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center p-6 text-gray-400">
                    No plantilla records yet.
                  </td>
                </tr>
              ) : (
                data.map((item) => (
                  <tr
                    key={item.id}
                    className="border-t hover:bg-gray-50 transition"
                  >
                    <td className="p-3 font-medium">
                      {item.official?.fullName}
                    </td>

                    <td className="p-3">
                      {item.official?.position}
                    </td>

                    <td className="p-3">
                      {item.budgetAllocation?.classification?.name}
                    </td>

                    <td className="p-3">
                      ₱ {Number(item.amount).toLocaleString()}
                    </td>

                    <td className="p-3">
                      {item.periodCovered}
                    </td>

                    <td className="p-3">
                      {item.remarks}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* MODAL */}
      <PlantillaModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSubmit={handleCreate}
      />
    </div>
  );
}