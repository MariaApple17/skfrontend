'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import api from '@/components/lib/api';
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

interface Row {
  programName: string;
  description?: string;
  beneficiaries?: string;
  used: number;
  startDate?: string;
  endDate?: string;
  createdAt: string;
}

interface SystemProfile {
  location: string;
  fiscalYear: { year: number };
}

/* ================= STATUS ================= */

const getProgramStatus = (startDate?: string, endDate?: string) => {
  if (!startDate && !endDate) return 'No Schedule';

  const now = new Date();
  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;

  if (start && now < start) return 'Upcoming';
  if (end && now > end) return 'Completed';
  return 'Ongoing';
};

const getRemarks = (
  startDate?: string,
  endDate?: string,
  used?: number
) => {
  const status = getProgramStatus(startDate, endDate);

  if (!startDate && !endDate)
    return 'No scheduled dates provided.';
  if (status === 'Upcoming')
    return 'Program not yet started.';
  if (status === 'Ongoing' && (!used || used === 0))
    return 'Ongoing – no approved cost yet.';
  if (status === 'Ongoing')
    return 'Program currently implemented.';
  if (status === 'Completed')
    return 'Program completed successfully.';

  return '-';
};

export default function AccomplishmentReportPage() {
  const editorRef = useRef<HTMLDivElement>(null);

  const [profile, setProfile] = useState<SystemProfile | null>(null);
  const [data, setData] = useState<Row[]>([]);
  const [month, setMonth] = useState('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      const profileRes = await api.get('/system-profile');
      setProfile(profileRes.data.data);

      const res = await api.get('/reports/accomplishment');
      setData(res.data.data ?? []);

      setLoading(false);
    };

    load();
  }, []);

  const filtered = useMemo(() => {
    if (month === 'ALL') return data;

    return data.filter(d =>
      new Date(d.createdAt).getMonth() === Number(month)
    );
  }, [data, month]);

  const totalCost = useMemo(() => {
    return filtered.reduce((sum, r) => sum + r.used, 0);
  }, [filtered]);

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
                ACCOMPLISHMENT REPORT
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
                  <th className="border p-2">Program</th>
                  <th className="border p-2">Description</th>
                  <th className="border p-2">Beneficiaries</th>
                  <th className="border p-2">Start</th>
                  <th className="border p-2">End</th>
                  <th className="border p-2">Status</th>
                  <th className="border p-2">Total Cost</th>
                  <th className="border p-2">Remarks</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((r, index) => {
                  const status = getProgramStatus(
                    r.startDate,
                    r.endDate
                  );
                  const remarks = getRemarks(
                    r.startDate,
                    r.endDate,
                    r.used
                  );

                  return (
                    <tr key={index} className="text-center">
                      <td className="border p-2">{index + 1}</td>
                      <td className="border p-2 font-semibold">
                        {r.programName}
                      </td>
                      <td className="border p-2">
                        {r.description || '—'}
                      </td>
                      <td className="border p-2">
                        {r.beneficiaries || '—'}
                      </td>
                      <td className="border p-2">
                        {r.startDate
                          ? new Date(
                              r.startDate
                            ).toLocaleDateString()
                          : '—'}
                      </td>
                      <td className="border p-2">
                        {r.endDate
                          ? new Date(
                              r.endDate
                            ).toLocaleDateString()
                          : '—'}
                      </td>
                      <td className="border p-2">{status}</td>
                      <td className="border p-2 font-bold text-blue-700">
                        ₱{r.used.toLocaleString()}
                      </td>
                      <td className="border p-2">
                        {remarks}
                      </td>
                    </tr>
                  );
                })}

                {/* TOTAL ROW */}
                <tr className="font-bold bg-gray-100 text-center">
                  <td colSpan={7} className="border p-2 text-right">
                    GRAND TOTAL COST
                  </td>
                  <td className="border p-2">
                    ₱{totalCost.toLocaleString()}
                  </td>
                  <td className="border p-2"></td>
                </tr>
              </tbody>
            </table>

            {/* SIGNATORIES */}
            <div className="mt-20 grid grid-cols-3 text-center text-sm">
              <div>
                <p>Prepared By:</p>
                <p className="mt-12 font-bold underline">
                  _______________________
                </p>
                <p>SK Treasurer</p>
              </div>

              <div>
                <p>Noted By:</p>
                <p className="mt-12 font-bold underline">
                  _______________________
                </p>
                <p>SK Secretary</p>
              </div>

              <div>
                <p>Approved By:</p>
                <p className="mt-12 font-bold underline">
                  _______________________
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
}
