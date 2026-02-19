'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import api from '@/components/lib/api';
import FlatSelect from '@/components/reusable/ui/FlatSelect';

const MONTH_OPTIONS = [
  { id: 'ALL', label: 'All Months' },
  ...Array.from({ length: 12 }, (_, i) => ({
    id: String(i),
    label: new Date(0, i).toLocaleString('default', {
      month: 'long',
    }),
  })),
];

interface BudgetRow {
  id: number;
  allocatedAmount: string;
  usedAmount: string;
  classification: { name: string };
  object: { name: string };
}

interface SystemProfile {
  location: string;
  fiscalYear: { year: number };
  fiscalYearId: number;
}

interface SKOfficial {
  position: string;
  fullName: string;
  isActive: boolean;
}

const FinancialReportEditor = () => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [month, setMonth] = useState('ALL');

  const [profile, setProfile] = useState<SystemProfile | null>(null);
  const [officials, setOfficials] = useState<SKOfficial[]>([]);
  const [data, setData] = useState<BudgetRow[]>([]);
  const [loading, setLoading] = useState(true);

  /* ================= LOAD ================= */

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      const profileRes = await api.get('/system-profile');
      setProfile(profileRes.data.data);

      const officialsRes = await api.get(
        `/sk-officials/fiscal/${profileRes.data.data.fiscalYearId}`
      );
      setOfficials(officialsRes.data.data ?? []);

      const res = await api.get('/reports/budget-summary', {
        params: { limit: 999 },
      });

      setData(res.data.data ?? []);
      setLoading(false);
    };

    load();
  }, []);

  const getOfficial = (pos: string) =>
    officials.find(o => o.position === pos && o.isActive)?.fullName;

  /* ================= COMPUTATIONS ================= */

  const computed = useMemo(() => {
    return data.map(d => {
      const appropriation = Number(d.allocatedAmount);
      const obligations = Number(d.usedAmount || 0);
      const balance = appropriation - obligations;

      let remarks = 'No Obligation';
      if (obligations > 0 && obligations < appropriation)
        remarks = 'Partially Utilized';
      if (obligations >= appropriation)
        remarks = 'Fully Utilized';

      return {
        ...d,
        appropriation,
        allotment: appropriation,
        obligations,
        balance,
        remarks,
      };
    });
  }, [data]);

  const totals = useMemo(() => {
    return {
      appropriation: computed.reduce((s, r) => s + r.appropriation, 0),
      obligations: computed.reduce((s, r) => s + r.obligations, 0),
      balance: computed.reduce((s, r) => s + r.balance, 0),
    };
  }, [computed]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <p className="py-20 text-center">Loading…</p>;

  return (
    <div className="space-y-10">

      {/* FILTER + PRINT */}
      <div className="flex justify-center gap-4">
        <FlatSelect
          label="Month"
          value={month}
          options={MONTH_OPTIONS}
          onChange={setMonth}
        />

        <button
          onClick={handlePrint}
          className="px-6 py-2 bg-gray-800 text-white rounded-xl"
        >
          Print
        </button>
      </div>

      {/* REPORT AREA */}
      <div className="flex justify-center bg-gray-100 py-10">
        <div className="bg-white w-[1100px] p-12 shadow-xl print-area">

          <div ref={editorRef}>

            {/* HEADER */}
            <div className="text-center space-y-1">
              <p className="text-sm">REPUBLIC OF THE PHILIPPINES</p>
              <p className="text-sm">PROVINCE OF BOHOL</p>
              <p className="font-bold text-lg">{profile?.location}</p>
              <p className="font-bold text-xl mt-4">
                FINANCIAL STATUS REPORT
              </p>
              <p className="text-sm">
                Fiscal Year {profile?.fiscalYear.year}
              </p>
            </div>

            {/* TABLE */}
            <table className="w-full mt-10 border border-gray-700 text-sm">
              <thead>
                <tr className="bg-gray-200 text-center">
                  <th className="border p-2">#</th>
                  <th className="border p-2">Classification</th>
                  <th className="border p-2">Object</th>
                  <th className="border p-2">Appropriation</th>
                  <th className="border p-2">Allotment</th>
                  <th className="border p-2">Obligations</th>
                  <th className="border p-2">Balance</th>
                  <th className="border p-2">Remarks</th>
                </tr>
              </thead>

              <tbody>
                {computed.map((r, index) => (
                  <tr key={r.id} className="text-center">
                    <td className="border p-2">{index + 1}</td>
                    <td className="border p-2">{r.classification?.name}</td>
                    <td className="border p-2">{r.object?.name}</td>
                    <td className="border p-2 text-right">
                      ₱{r.appropriation.toLocaleString()}
                    </td>
                    <td className="border p-2 text-right">
                      ₱{r.allotment.toLocaleString()}
                    </td>
                    <td className="border p-2 text-right">
                      ₱{r.obligations.toLocaleString()}
                    </td>
                    <td className="border p-2 text-right">
                      ₱{r.balance.toLocaleString()}
                    </td>
                    <td className="border p-2">{r.remarks}</td>
                  </tr>
                ))}

                {/* TOTAL ROW */}
                <tr className="font-bold bg-gray-100 text-center">
                  <td colSpan={3} className="border p-2 text-right">
                    GRAND TOTAL
                  </td>
                  <td className="border p-2 text-right">
                    ₱{totals.appropriation.toLocaleString()}
                  </td>
                  <td></td>
                  <td className="border p-2 text-right">
                    ₱{totals.obligations.toLocaleString()}
                  </td>
                  <td className="border p-2 text-right">
                    ₱{totals.balance.toLocaleString()}
                  </td>
                  <td></td>
                </tr>
              </tbody>
            </table>

            {/* SIGNATORIES */}
            <div className="mt-20 grid grid-cols-3 text-center text-sm">
              <div>
                <p>Prepared By:</p>
                <p className="mt-12 font-bold underline">
                  {getOfficial('SK Treasurer') || '_________________'}
                </p>
                <p>SK Treasurer</p>
              </div>

              <div>
                <p>Noted By:</p>
                <p className="mt-12 font-bold underline">
                  {getOfficial('SK Secretary') || '_________________'}
                </p>
                <p>SK Secretary</p>
              </div>

              <div>
                <p>Approved By:</p>
                <p className="mt-12 font-bold underline">
                  {getOfficial('SK Chairperson') || '_________________'}
                </p>
                <p>SK Chairperson</p>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* PRINT STYLING */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-area,
          .print-area * {
            visibility: visible;
          }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>

    </div>
  );
};

export default FinancialReportEditor;
