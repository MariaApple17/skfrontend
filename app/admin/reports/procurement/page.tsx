'use client';

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

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
  latestDecision?: string;
  latestRemark?: string;

  createdBy?: { fullName: string };

  items: {
    id: number;
    name: string;
    quantity: number;
    unitCost: string;
    totalPrice: string;
  }[];

  approvals: {
    id: number;
    status: string;
    remarks?: string | null;
    createdAt: string;
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

/* ================= COMPONENT ================= */

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
        params: { status, limit: 999 },
      });

      setData(procurementRes.data.data ?? []);
      setLoading(false);
    };

    load();
  }, [status]);

  /* ================= FILTER ================= */

  const filteredData = useMemo(() => {
    if (month === 'ALL') return data;
    return data.filter(
      p => new Date(p.createdAt).getMonth() === Number(month)
    );
  }, [data, month]);

  const getOfficial = (pos: string) =>
    officials.find(o => o.position === pos && o.isActive)?.fullName;

  /* ================= WORD EXPORT ================= */

const downloadWord = () => {
  if (!editorRef.current) return;

  const html = `
  <html xmlns:o="urn:schemas-microsoft-com:office:office"
        xmlns:w="urn:schemas-microsoft-com:office:word"
        xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8" />

      <style>
        @page {
          size: A4;
          margin: 25mm 20mm 25mm 20mm;
        }

        body {
          font-family: Arial, sans-serif;
          font-size: 11pt;
          line-height: 1.4;
        }

        /* HEADER */
        .header {
          text-align: center;
          font-size: 11pt;
          line-height: 1.4;
          margin-bottom: 24px;
        }

        .header p {
          margin: 2px 0;
        }

        .header .title {
          margin-top: 24px;
          font-weight: bold;
        }

        .header .subtitle {
          margin-top: 16px;
          font-size: 10pt;
        }

        /* DATA TABLES */
        table.data {
          width: 100%;
          border-collapse: collapse;
          margin: 24px 0;
        }

        table.data th,
        table.data td {
          border: 1px solid #000;
          padding: 6px;
          vertical-align: top;
          font-size: 11pt;
        }

        table.data th {
          background: #f2f2f2;
          font-weight: bold;
          text-align: center;
        }

        /* SIGNATORIES */
        .signatories {
          margin-top: 48px;
          text-align: center;
        }

        .signatories table {
          width: 100%;
          border-collapse: collapse;
        }

        .signatories td {
          border: none;
          padding: 0 12px;
          vertical-align: top;
        }

        .signatories p {
          margin: 4px 0;
        }

        .signatories .signature-line {
          margin-top: 48px;
          font-weight: bold;
          text-decoration: underline;
        }
      </style>

      <xml>
        <w:WordDocument>
          <w:View>Print</w:View>
          <w:Zoom>100</w:Zoom>
          <w:DoNotOptimizeForBrowser/>
        </w:WordDocument>
      </xml>
    </head>

    <body>
      <!-- HEADER -->
      <div class="header">
        <p>REPUBLIC OF THE PHILIPPINES</p>
        <p>PROVINCE OF BOHOL</p>
        <p><strong>${profile?.location ?? ''}</strong></p>

        <div class="title">
          <p>OFFICE OF THE SANGGUNIANG KABATAAN</p>
          <p>PROCUREMENT REPORT</p>
        </div>

        <p class="subtitle">
          Fiscal Year ${profile?.fiscalYear.year ?? ''} — Status: ${status}
        </p>
      </div>

      <!-- CONTENT TABLE -->
      ${editorRef.current.innerHTML}

      <!-- SIGNATORIES -->
      <div class="signatories">
        <table>
          <tr>
            ${['SK Secretary', 'SK Treasurer', 'SK Chairperson']
              .map(
                pos => `
                <td>
                  <p>Prepared / Approved By:</p>
                  <p class="signature-line">
                    ${getOfficial(pos) || '________________________'}
                  </p>
                  <p>${pos}</p>
                </td>
              `
              )
              .join('')}
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
  a.download = 'SK_Procurement_Report.doc';
  a.click();
  URL.revokeObjectURL(a.href);
};

  if (loading) {
    return (
      <p className="py-24 text-center text-sm text-gray-500">
        Loading…
      </p>
    );
  }

  /* ================= RENDER ================= */

  return (
    <div className="space-y-10">

      {/* CONTROLS */}
      <div className="flex justify-center">
        <div className="flex flex-wrap gap-4 items-end bg-white p-4 rounded-xl shadow-sm">
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
            className="h-11 px-6 rounded-xl bg-emerald-600 text-white text-sm hover:bg-emerald-700"
          >
            📄 Download Word
          </button>
        </div>
      </div>

      {/* WORD-STYLE DOCUMENT PREVIEW */}
      <div className="flex justify-center bg-gray-100 py-12">
        <div
          className="
            bg-white
            w-[794px]
            min-h-[1123px]
            p-16
            shadow-xl
            rounded-xl
            text-[11px]
            leading-relaxed
          "
        >
          {/* ================= HEADER ================= */}
          <div className="text-center space-y-1">
            <p className="uppercase">REPUBLIC OF THE PHILIPPINES</p>
            <p className="uppercase">PROVINCE OF BOHOL</p>
            <p className="font-medium uppercase">
              {profile?.location}
            </p>

            <div className="pt-6 font-bold uppercase">
              <p>OFFICE OF THE SANGGUNIANG KABATAAN</p>
              <p>PROCUREMENT REPORT</p>
            </div>

            <p className="pt-4 text-[10px]">
              Fiscal Year {profile?.fiscalYear.year} — Status: {status}
            </p>
          </div>

          {/* ================= TABLE (this gets copied to Word) ================= */}
          <div ref={editorRef}>
            <table className="mt-10 w-full border-collapse text-[11px] data">
              <thead>
                <tr className="text-center font-semibold">
                  <th className="w-[4%]">#</th>
                  <th className="w-[18%] text-left">Title</th>
                  <th className="w-[22%] text-left">Description</th>
                  <th className="w-[10%]">Status</th>
                  <th className="w-[16%] text-left">Remark</th>
                  <th className="w-[10%] text-right">Amount</th>
                  <th className="w-[12%] text-left">Prepared By</th>
                  <th className="w-[8%]">Date</th>
                </tr>
              </thead>

              <tbody>
                {filteredData.map((p, i) => (
                  <tr key={p.id} className="align-top">
                    <td className="text-center">{i + 1}</td>

                    <td className="font-semibold text-left">
                      {p.title}
                    </td>

                    <td className="text-left">
                      {p.description || '—'}
                    </td>

                    <td className="text-center">
                      {p.latestDecision ?? p.status}
                    </td>

                    <td className="text-left">
                      {p.latestRemark || '—'}
                    </td>

                    <td className="text-right">
                      {Number(p.amount).toLocaleString()}
                    </td>

                    <td className="text-left">
                      {p.createdBy?.fullName || '—'}
                    </td>

                    <td className="text-center">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ================= SIGNATORIES (preview only) ================= */}
          <div className="mt-32 grid grid-cols-3 text-center text-[11px]">
            {['SK Secretary', 'SK Treasurer', 'SK Chairperson'].map(pos => (
              <div key={pos}>
                <p>Prepared / Approved By:</p>

                <p className="mt-12 font-bold underline">
                  {getOfficial(pos) || '________________________'}
                </p>

                <p className="mt-1">{pos}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
};

export default ProcurementReportEditor;