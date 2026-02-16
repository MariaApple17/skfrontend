'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import api from '@/components/lib/api';
import FlatSelect from '@/components/reusable/ui/FlatSelect';

/* ================= TYPES ================= */

interface ProcurementItem {
  id: number;
  title: string;
  description?: string;
  amount: string;
  status: string;
  createdAt: string;

  createdBy?: { fullName: string };

  allocation?: {
    classification?: { name: string };
    objectOfExpenditure?: { name: string };
  } | null;

  items: {
    id: number;
    name: string;
    quantity: number;
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

/* ================= CONSTANTS ================= */

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

const ProcurementReportEditor = () => {
  const editorRef = useRef<HTMLDivElement>(null);

  const [status, setStatus] = useState('APPROVED');
  const [month, setMonth] = useState('ALL');
  const [profile, setProfile] = useState<SystemProfile | null>(null);
  const [officials, setOfficials] = useState<SKOfficial[]>([]);
  const [data, setData] = useState<ProcurementItem[]>([]);
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

      const procurementRes = await api.get('/procurement', {
        params: {
          status: status === 'ALL' ? undefined : status,
          limit: 999,
        },
      });

      setData(procurementRes.data.data ?? []);
      setLoading(false);
    };

    load();
  }, [status]);

  const getOfficial = (pos: string) =>
    officials.find(o => o.position === pos && o.isActive)?.fullName;

  /* ================= FILTER BY MONTH ================= */

  const filteredData = useMemo(() => {
    if (month === 'ALL') return data;
    return data.filter(
      p => new Date(p.createdAt).getMonth() === Number(month)
    );
  }, [data, month]);

  /* ================= GRAND TOTAL ================= */

  const grandTotal = useMemo(() => {
    return filteredData.reduce((sum, p) => sum + Number(p.amount), 0);
  }, [filteredData]);

  /* ================= WORD EXPORT ================= */

  const downloadWord = () => {
    if (!editorRef.current) return;

    const html = `
      <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: Arial; font-size: 11pt; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #000; padding: 6px; }
          th { background: #f2f2f2; }
          .signatories { margin-top: 60px; text-align: center; }
          .signatories td { border: none; padding: 40px 20px 0; }
        </style>
      </head>
      <body>

        <div style="text-align:center;">
          <p>REPUBLIC OF THE PHILIPPINES</p>
          <p>PROVINCE OF BOHOL</p>
          <p><strong>${profile?.location ?? ''}</strong></p>
          <p><strong>PROCUREMENT REPORT</strong></p>
          <p>Fiscal Year ${profile?.fiscalYear.year ?? ''}</p>
        </div>

        ${editorRef.current.innerHTML}

        <div class="signatories">
          <table>
            <tr>
              <td>
                Prepared By:<br/><br/>
                <strong>${getOfficial('SK Secretary') || '_________________'}</strong><br/>
                SK Secretary
              </td>
              <td>
                Noted By:<br/><br/>
                <strong>${getOfficial('SK Treasurer') || '_________________'}</strong><br/>
                SK Treasurer
              </td>
              <td>
                Approved By:<br/><br/>
                <strong>${getOfficial('SK Chairperson') || '_________________'}</strong><br/>
                SK Chairperson
              </td>
            </tr>
          </table>
        </div>

      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', html], {
      type: 'application/msword',
    });

    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'Procurement_Report.doc';
    a.click();
  };

  if (loading) return <p className="py-20 text-center">Loading…</p>;

  let rowNumber = 0;

  return (
    <div className="space-y-10">

      {/* FILTERS */}
      <div className="flex justify-center gap-4">
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
          onClick={downloadWord}
          className="px-6 py-2 bg-emerald-600 text-white rounded-xl"
        >
          Download Word
        </button>
      </div>

      {/* REPORT */}
      <div className="flex justify-center bg-gray-100 py-10">
        <div className="bg-white w-250 p-10 shadow-xl">

          <div ref={editorRef}>
            <table className="w-full text-sm mt-6">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Title</th>
                  <th>Classification</th>
                  <th>Object of Expenditure</th>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Unit Cost</th>
                  <th>Total</th>
                </tr>
              </thead>

              <tbody>
                {filteredData.map((p) =>
                  p.items.map((item) => {
                    rowNumber++;
                    return (
                      <tr key={`${p.id}-${item.id}`}>
                        <td>{rowNumber}</td>
                        <td>{p.title}</td>
                        <td>{p.allocation?.classification?.name || '—'}</td>
                        <td>{p.allocation?.objectOfExpenditure?.name || '—'}</td>
                        <td>{item.name}</td>
                        <td className="text-center">{item.quantity}</td>
                        <td className="text-right">
                          ₱{Number(item.unitCost).toLocaleString()}
                        </td>
                        <td className="text-right">
                          ₱{Number(item.totalPrice).toLocaleString()}
                        </td>
                      </tr>
                    );
                  })
                )}

                <tr>
                  <td colSpan={7} className="text-right font-bold">
                    GRAND TOTAL
                  </td>
                  <td className="text-right font-bold">
                    ₱{grandTotal.toLocaleString()}
                  </td>
                </tr>

              </tbody>
            </table>
          </div>

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
  );
};

export default ProcurementReportEditor;
