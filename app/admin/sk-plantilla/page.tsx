'use client';

import { useState, useEffect } from 'react';
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

export default function PlantillaPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<Plantilla[]>([]);
  const [loading, setLoading] = useState(true);

  /* ================= FETCH DATA ================= */
  const fetchPlantilla = async () => {
    try {
      const res = await api.get('/sk-plantilla');

      // Your backend returns:
      // { success: true, data: [...] }
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

  /* ================= HANDLE CREATE ================= */
  const handleCreate = async (newPlantilla: any) => {
    try {
      const res = await api.post('/sk-plantilla', newPlantilla);

      if (res.data.success) {
        await fetchPlantilla();
        setIsOpen(false);
      }

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
              Fiscal Year: 2026
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
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 text-left text-sm">
                <th className="p-3">ID</th> {/* ✅ ADDED */}
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
                  <td colSpan={7} className="text-center p-6">
                    Loading...
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center p-6 text-gray-400">
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
                      {item.id} {/* ✅ NOW DISPLAYING */}
                    </td>

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
                      {item.remarks || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

      <PlantillaModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSubmit={handleCreate}
      />
    </div>
  );
}