'use client';

import {
  useEffect,
  useState,
} from 'react';

import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  WidthType,
} from 'docx';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';

import api from '@/components/lib/api';

type ReportType =
  | 'budget'
  | 'procurement'
  | 'approvals'
  | 'program-utilization';

type Row = Record<string, any>;

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-700',

  SUBMITTED: 'bg-blue-100 text-blue-700',
  APPROVED: 'bg-emerald-100 text-emerald-700',

  REJECTED: 'bg-red-100 text-red-700',

  PURCHASED: 'bg-purple-100 text-purple-700',
  COMPLETED: 'bg-slate-900 text-white',
};


export default function ReportsPage() {
  const [type, setType] = useState<ReportType>('budget');
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);

  type ViewMode = 'table' | 'grid';

const [viewMode, setViewMode] = useState<ViewMode>('table'); // default = TABLE


  /* ---------------- Debounce search ---------------- */
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    loadReport();
  }, [type, page, debouncedSearch, status]);

  /* ---------------- Data fetch ---------------- */
  const loadReport = async () => {
    setLoading(true);

    const urlMap: Record<ReportType, string> = {
      budget: '/reports/budget-summary',
      procurement: '/reports/procurements',
      approvals: '/reports/approvals',
      'program-utilization': '/reports/program-utilization',
    };

    const res = await api.get(urlMap[type], {
      params: {
        page,
        limit,
        search: debouncedSearch,
        status,
      },
    });

    setTotal(res.data.meta?.total || 0);

   const mapped: Row[] = res.data.data.map((r: any) => {
  switch (type) {
    /* ===================== BUDGET SUMMARY ===================== */
    case 'budget':
      return {
        AllocationID: r.id,
        ProgramCode: r.program.code,
        ProgramName: r.program.name,
        ClassificationCode: r.classification.code,
        ClassificationName: r.classification.name,
        ObjectCode: r.object.code,
        ObjectName: r.object.name,
        FiscalYear: r.budget.fiscalYear.year,
        AllocatedAmount: Number(r.allocatedAmount),
        UsedAmount: Number(r.usedAmount),
        RemainingAmount:
          Number(r.allocatedAmount) - Number(r.usedAmount),
        CreatedAt: new Date(r.createdAt).toLocaleString(),
        UpdatedAt: new Date(r.updatedAt).toLocaleString(),
      };

    /* ===================== PROCUREMENT ===================== */
    case 'procurement':
      return {
        RequestID: r.id,
        Title: r.title,
        Description: r.description,
        Status: r.status,
        TotalAmount: Number(r.amount),
        ItemCount: r.items?.length ?? 0,
        ItemsSummary: r.items
          ?.map(
            (i: any) =>
              `${i.name} (${i.quantity} × ${i.unitCost})`
          )
          .join(', '),
        Program: r.allocation.program.name,
        Classification: r.allocation.classification.name,
        CreatedBy: r.createdBy.fullName,
        CreatedAt: new Date(r.createdAt).toLocaleString(),
        UpdatedAt: new Date(r.updatedAt).toLocaleString(),
      };

    /* ===================== APPROVALS ===================== */
    case 'approvals':
      return {
        ApprovalID: r.id,
        RequestID: r.request.id,
        RequestTitle: r.request.title,
        RequestStatus: r.request.status,
        ApprovalStatus: r.status,
        Amount: Number(r.request.amount),
        ApproverName: r.approver.fullName,
        ApproverEmail: r.approver.email,
        Remarks: r.remarks ?? '-',
        CreatedAt: new Date(r.createdAt).toLocaleString(),
      };

    /* ===================== PROGRAM UTILIZATION ===================== */
    case 'program-utilization':
      return {
        ProgramID: r.programId,
        ProgramName: r.programName,
        AllocatedAmount: r.allocated,
        UsedAmount: r.used,
        RemainingAmount: r.remaining,
      };
  }
});


    setRows(mapped);
    setLoading(false);
  };

  /* ---------------- Helpers ---------------- */
  const renderCell = (value: any) => {
    if (typeof value === 'number') return value.toLocaleString();
    if (STATUS_COLORS[value]) {
      return (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[value]}`}
        >
          {value}
        </span>
      );
    }
    return value ?? '-';
  };

  /* ---------------- Export ---------------- */
  const exportExcel = () => {
    const sheet = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, sheet, 'Report');
    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([buffer]), `report-${type}.xlsx`);
  };

  const exportWord = async () => {
    if (!rows.length) return;
    const headers = Object.keys(rows[0]);

    const table = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: headers.map(h => new TableCell({
            children: [new Paragraph({ text: h })],
          })),
        }),
        ...rows.map(r =>
          new TableRow({
            children: headers.map(h =>
              new TableCell({
                children: [new Paragraph(String(r[h] ?? ''))],
              })
            ),
          })
        ),
      ],
    });

    const doc = new Document({
      sections: [{ children: [new Paragraph({ text: 'Report', heading: 'Heading1' }), table] }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `report-${type}.docx`);
  };

  const totalPages = Math.ceil(total / limit);

  /* ---------------- UI ---------------- */
  return (
    <div className="min-h-screen bg-slate-50 p-8 space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Reports</h1>
          <p className="text-sm text-slate-500">
            Advanced reporting, filtering & export
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={exportExcel}
            className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm hover:shadow"
          >
            Export Excel
          </button>
          <button
            onClick={exportWord}
            className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm hover:shadow"
          >
            Export Word
          </button>

          
        <div className="flex rounded-xl bg-white shadow-sm overflow-hidden">
  <button
    onClick={() => setViewMode('table')}
    className={`px-4 py-2 text-sm transition
      ${viewMode === 'table'
        ? 'bg-slate-900 text-white'
        : 'text-slate-600 hover:bg-slate-100'
      }`}
  >
    Table
  </button>

  <button
    onClick={() => setViewMode('grid')}
    className={`px-4 py-2 text-sm transition
      ${viewMode === 'grid'
        ? 'bg-slate-900 text-white'
        : 'text-slate-600 hover:bg-slate-100'
      }`}
  >
    Grid
  </button>
</div>
        </div>


      </div>

      {/* FILTER BAR */}
      <div className="flex flex-wrap gap-3 items-center">
        <input
          value={search}
          onChange={e => {
            setPage(1);
            setSearch(e.target.value);
          }}
          placeholder="Search anything…"
          className="px-4 py-2 rounded-xl bg-white shadow-sm w-64 text-sm focus:ring-2 focus:ring-blue-200"
        />

        {(type === 'procurement' || type === 'approvals') && (
          <select
            value={status}
            onChange={e => {
              setPage(1);
              setStatus(e.target.value);
            }}
            className="px-4 py-2 rounded-xl bg-white shadow-sm text-sm"
          >
            <option value="">All Status</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        )}

        {(['budget', 'procurement', 'approvals', 'program-utilization'] as ReportType[])
          .map(t => (
            <button
              key={t}
              onClick={() => {
                setType(t);
                setPage(1);
                setStatus('');
              }}
              className={`px-4 py-2 rounded-xl text-sm shadow-sm transition
                ${type === t
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-700 hover:bg-slate-100'
                }`}
            >
              {t.replace('-', ' ').toUpperCase()}
            </button>
          ))}
      </div>

{/* TABLE / GRID */}
<div className="bg-white rounded-3xl shadow-sm p-6">
  {loading ? (
    <div className="p-10 text-center text-slate-400">
      Loading report…
    </div>
  ) : rows.length === 0 ? (
    <div className="p-10 text-center text-slate-400">
      No data found
    </div>
  ) : viewMode === 'table' ? (
    /* ================= TABLE (COLLAPSED WIDTH) ================= */
    <div className="overflow-auto">
      <table className="table-auto w-max min-w-full text-sm border-collapse">
        <thead className="bg-slate-50">
          <tr>
            {Object.keys(rows[0]).map(h => (
              <th
                key={h}
                className="px-4 py-3 text-left font-medium text-slate-600 whitespace-nowrap"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="hover:bg-slate-50 transition">
              {Object.values(r).map((v, j) => (
                <td
                  key={j}
                  className="px-4 py-2 text-slate-800 whitespace-nowrap"
                >
                  {renderCell(v)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ) : (
    /* ================= GRID (UNCHANGED) ================= */
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {rows.map((row, index) => {
        const entries = Object.entries(row);

        return (
          <div
            key={index}
            className="
              group relative
              rounded-3xl
              bg-gradient-to-br from-white to-slate-50
              border border-slate-200/70
              p-6
              shadow-sm
              hover:shadow-lg
              transition-all
            "
          >
            {/* TOP / TITLE */}
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-slate-900 truncate">
                {entries[0]?.[1] ?? 'Record'}
              </h3>
              <p className="text-xs text-slate-500">
                {type.replace('-', ' ').toUpperCase()}
              </p>
            </div>

            {/* CONTENT */}
            <div className="space-y-3">
              {entries.slice(1).map(([key, value]) => (
                <div
                  key={key}
                  className="flex items-center justify-between gap-4"
                >
                  <span className="text-xs text-slate-500">
                    {key}
                  </span>

                  <span className="text-sm font-medium text-slate-800 text-right max-w-[65%] break-words">
                    {renderCell(value)}
                  </span>
                </div>
              ))}
            </div>

            {/* FOOTER */}
            <div className="mt-5 pt-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
              <span>#{index + 1}</span>
              <span className="opacity-0 group-hover:opacity-100 transition">
                View details →
              </span>
            </div>
          </div>
        );
      })}
    </div>
  )}
</div>



      {/* PAGINATION */}
      <div className="flex justify-between items-center text-sm text-slate-600">
        <span>
          Page {page} of {totalPages || 1}
        </span>
        <div className="flex gap-2">
          <button
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
            className="px-4 py-2 rounded-xl bg-white shadow-sm disabled:opacity-40"
          >
            Previous
          </button>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage(p => p + 1)}
            className="px-4 py-2 rounded-xl bg-white shadow-sm disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
