'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import api from '@/components/lib/api';
import { ReportPageShimmer } from '@/components/reusable/ui/PageShimmer';
import FlatSelect from '@/components/reusable/ui/FlatSelect';

/* ================= MONTH OPTIONS ================= */

const MONTH_OPTIONS = [
  { id: 'ALL', label: 'All Months' },
  ...Array.from({ length: 12 }, (_, i) => ({
    id: String(i),
    label: new Date(0, i).toLocaleString('default', {
      month: 'long',
    }),
  })),
];

/* ================= TYPES ================= */

interface BudgetRow {
  id: number;
  allocatedAmount: string;
  usedAmount: string;
  classification: { name: string };
  object: { name: string };
}
interface SystemProfile {
  location: string;
  fiscalYearId: number;
  fiscalYear: {
    id: number;
    year: number;
  };
}

interface SKOfficial {
  position: string;
  fullName: string;
  isActive: boolean;
   fiscalYear: {
    id: number;
    year: number;
  };
}


/* ===================================================== */

const FinancialReportEditor = () => {
  const editorRef = useRef<HTMLDivElement>(null);

  const [month, setMonth] = useState('ALL');
  const [fiscalYear, setFiscalYear] = useState<number | null>(null);
  const [officials, setOfficials] = useState<SKOfficial[]>([]);
  const [data, setData] = useState<BudgetRow[]>([]);
  const [loading, setLoading] = useState(true);

  /* ================= LOAD ================= */
useEffect(() => {
  const load = async () => {
    try {
      setLoading(true);

      /* 1️⃣ Get active fiscal year */
      const fyRes = await api.get('/fiscal-years');
      const years = fyRes.data?.data ?? [];
      const activeYear = years.find((y: any) => y.isActive);

      if (!activeYear) {
        console.error('No active fiscal year found');
        return;
      }

      const fiscalYearId = activeYear.id;
      setFiscalYear(activeYear.year);

      /* 2️⃣ Load SK officials */
      const officialsRes = await api.get(
        `/sk-officials/fiscal/${fiscalYearId}`
      );

      setOfficials(officialsRes.data?.data ?? []);

      /* 3️⃣ Load report data */
      const res = await api.get('/reports/budget-summary', {
        params: { limit: 999 },
      });

      setData(res.data?.data ?? []);

    } catch (error) {
      console.error('Financial Report Load Error:', error);
    } finally {
      setLoading(false);
    }
  };

  load();
}, []);
  /* ================= GET OFFICIAL ================= */
const getOfficial = (position: string) =>
  officials.find(
    o =>
      o.isActive &&
      o.position.toLowerCase().includes(position.toLowerCase())
  )?.fullName;
  /* ================= COMPUTATIONS ================= */

  const computed = useMemo(() => {
    return data.map(d => {
      const appropriation = Number(d.allocatedAmount || 0);
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
if (loading) {
  return <ReportPageShimmer />;
}
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
      
{/* HEADER WITH LOGOS */}


<div className="flex items-start justify-center gap-16 mb-6">

  {/* LEFT LOGO */}
  <img
    src="/logo/logo.jpg"
    alt="Barangay Logo"
    className="w-28 h-28 object-contain ml-20"
  />

  {/* CENTER HEADER */}
  <div className="text-center flex-1 space-y-1">
    <p className="text-sm">REPUBLIC OF THE PHILIPPINES</p>
    <p className="text-sm">PROVINCE OF BOHOL</p>
    <p className="text-sm">Municipality of Trinidad</p>
    <p className="text-sm">Barangay Bongbong</p>
    <p className="text-sm">Office of the Sangguniang Kabataan</p>

    <p className="font-bold text-xl mt-4">
      STATUS OF APPROPRIATION, ALLOTMENT, AND OBLIGATIONS
    </p>

    <p className="text-sm">
      Fiscal Year : {fiscalYear}
    </p>
  </div>

  {/* RIGHT LOGO */}
  <img
    src="/logo/sk-logo.png"
    alt="SK Logo"
    className="w-28 h-28 object-contain mr-20"
  />

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

      {/* PRINT STYLE */}
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
