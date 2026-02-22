'use client';

import React, { useEffect, useMemo, useState } from 'react';
import api from '@/components/lib/api';
import FlatSelect from '@/components/reusable/ui/FlatSelect';

/* ================= TYPES ================= */

interface ProcurementItem {
  id: number;
  title: string;
  amount: string;
  status: string;
  createdAt: string;
  allocation?: {
    classification?: { name: string };
    object?: { name: string };
  } | null;
  items: {
    id: number;
    name: string;
    quantity: number;
    unit: string;
    unitCost: string;
    totalPrice: string;
  }[];
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

/* ================= OPTIONS ================= */
const STATUS_OPTIONS = [
  { id: 'ALL', label: 'All Status' },
  { id: 'DRAFT', label: 'Draft' },
  { id: 'SUBMITTED', label: 'Submitted' },
  { id: 'APPROVED', label: 'Approved' },
  { id: 'REJECTED', label: 'Rejected' },
  { id: 'PURCHASED', label: 'Purchased' },
  { id: 'COMPLETED', label: 'Completed' },
];

const MONTH_OPTIONS = [
  { id: 'ALL', label: 'All Months' },
  ...Array.from({ length: 12 }, (_, i) => ({
    id: String(i),
    label: new Date(0, i).toLocaleString('default', { month: 'long' }),
  })),
];

export default function ProcurementReportEditor() {
  const [status, setStatus] = useState('APPROVED');
  const [month, setMonth] = useState('ALL');
  const [profile, setProfile] = useState<SystemProfile | null>(null);
  const [officials, setOfficials] = useState<SKOfficial[]>([]);
  const [data, setData] = useState<ProcurementItem[]>([]);
  const [loading, setLoading] = useState(true);

  /* ================= LOAD ================= */

  useEffect(() => {
    const load = async () => {
      try {
        const profileRes = await api.get('/system-profile');
        setProfile(profileRes.data.data);

        const officialsRes = await api.get(
          `/sk-officials/fiscal/${profileRes.data.data.fiscalYearId}`
        );
        setOfficials(officialsRes.data.data ?? []);

        const procurementRes = await api.get('/procurement', {
          params: {
            status: status === 'ALL' ? undefined : status,
            limit: 999,
          },
        });

        setData(procurementRes.data.data ?? []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [status]);

  const getOfficial = (pos: string) =>
    officials.find(o => o.position === pos && o.isActive)?.fullName;

  /* ================= FILTER ================= */

  const filteredData = useMemo(() => {
    if (month === 'ALL') return data;
    return data.filter(
      p => new Date(p.createdAt).getMonth() === Number(month)
    );
  }, [data, month]);

  /* ================= FLATTEN TABLE ROWS ================= */

  const tableRows = useMemo(() => {
    let counter = 0;

    return filteredData.flatMap(p =>
      p.items.map(item => {
        counter++;
        return {
          key: `${p.id}-${item.id}`,
          rowNumber: counter,
          title: p.title,
          classification: p.allocation?.classification?.name ?? '—',
          object: p.allocation?.object?.name ?? '—',
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          unitCost: Number(item.unitCost),
          totalPrice: Number(item.totalPrice),
        };
      })
    );
  }, [filteredData]);

  const grandTotal = useMemo(() => {
    return tableRows.reduce((sum, row) => sum + row.totalPrice, 0);
  }, [tableRows]);

  if (loading) return <p className="py-20 text-center">Loading…</p>;

  return (
    <>
      {/* FILTER SECTION (HIDDEN WHEN PRINTING) */}
      <div className="flex justify-center gap-4 py-6 print:hidden">
        <FlatSelect
          label="Status"
          value={status}
          options={STATUS_OPTIONS}
          onChange={setStatus}
        />
        <FlatSelect
          label="Month"
          value={month}
          options={MONTH_OPTIONS}
          onChange={setMonth}
        />
        <button
          onClick={() => window.print()}
          className="px-6 py-2 bg-gray-800 text-white rounded-lg"
        >
          Print
        </button>
      </div>

      {/* PRINTABLE AREA */}
      <div className="flex justify-center">
        <div
          id="print-area"
          className="bg-white w-[1000px] p-12 shadow-xl"
        >
          {/* HEADER */}
          <div className="text-center space-y-1">
            <p className="text-sm">REPUBLIC OF THE PHILIPPINES</p>
            <p className="text-sm">PROVINCE OF BOHOL</p>
            <p className="font-bold text-lg">{profile?.location}</p>
            <p className="font-bold text-xl mt-4">PROCUREMENT REPORT</p>
            <p className="text-sm">
              Fiscal Year {profile?.fiscalYear.year}
            </p>
          </div>

          {/* TABLE */}
          <table className="w-full mt-10 border border-black text-sm">
            <thead>
              <tr className="bg-gray-200 text-center">
                {[
                  '#',
                  'Title',
                  'Classification',
                  'Object',
                  'Item',
                  'Qty',
                  'Unit',
                  'Unit Cost',
                  'Total',
                ].map(header => (
                  <th key={header} className="border p-2">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {tableRows.map(row => (
                <tr key={row.key} className="text-center">
                  <td className="border p-2">{row.rowNumber}</td>
                  <td className="border p-2">{row.title}</td>
                  <td className="border p-2">{row.classification}</td>
                  <td className="border p-2">{row.object}</td>
                  <td className="border p-2">{row.name}</td>
                  <td className="border p-2">{row.quantity}</td>
                  <td className="border p-2">{row.unit}</td>
                  <td className="border p-2 text-right">
                    ₱{row.unitCost.toLocaleString()}
                  </td>
                  <td className="border p-2 text-right">
                    ₱{row.totalPrice.toLocaleString()}
                  </td>
                </tr>
              ))}

              <tr className="font-bold bg-gray-100 text-center">
                <td colSpan={8} className="border p-2 text-right">
                  GRAND TOTAL
                </td>
                <td className="border p-2 text-right">
                  ₱{grandTotal.toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>

          {/* SIGNATORIES */}
          <div className="mt-20 grid grid-cols-3 text-center text-sm">
            <div>
              <p>Prepared By:</p>
              <div className="mt-14 border-t border-black w-40 mx-auto" />
              <p>{getOfficial('SK Treasurer') ?? 'SK Treasurer'}</p>
            </div>
            <div>
              <p>Noted By:</p>
              <div className="mt-14 border-t border-black w-40 mx-auto" />
              <p>{getOfficial('SK Secretary') ?? 'SK Secretary'}</p>
            </div>
            <div>
              <p>Approved By:</p>
              <div className="mt-14 border-t border-black w-40 mx-auto" />
              <p>{getOfficial('SK Chairperson') ?? 'SK Chairperson'}</p>
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

          #print-area,
          #print-area * {
            visibility: visible;
          }

          #print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </>
  );
}