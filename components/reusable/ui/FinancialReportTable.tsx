'use client';

import { useMemo } from 'react';

import type {
  ExpenditureClassification,
  ObjectOfExpenditure,
} from '@/lib/budget';

export interface FinancialRecord {
  objectId: number;
  appropriation: number;
  allotment: number;
  obligations: number;
  remarks?: string;
}

interface FinancialReportTableProps {
  objectsOfExpenditure: ObjectOfExpenditure[];
  classifications: ExpenditureClassification[];
  financialRecords: FinancialRecord[];
}

const pesoFormatter = new Intl.NumberFormat('en-PH', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const formatCurrency = (value: number) => `₱${pesoFormatter.format(value)}`;

export default function FinancialReportTable({
  objectsOfExpenditure,
  classifications,
  financialRecords,
}: FinancialReportTableProps) {
  const rows = useMemo(() => {
    const objectsById = new Map(
      objectsOfExpenditure.map((object) => [object.id, object])
    );
    const classificationsById = new Map(
      classifications.map((classification) => [classification.id, classification])
    );

    return financialRecords.map((record, index) => {
      const object = objectsById.get(record.objectId);
      const classification = object
        ? classificationsById.get(object.classificationId)
        : undefined;
      const balance = record.allotment - record.obligations;

      return {
        id: `${record.objectId}-${index}`,
        rowNumber: index + 1,
        classificationName: classification?.name ?? 'Unclassified',
        objectLabel: object
          ? `${object.code} - ${object.name}`
          : `Unknown Object (${record.objectId})`,
        appropriation: record.appropriation,
        allotment: record.allotment,
        obligations: record.obligations,
        balance,
        remarks: record.remarks?.trim() || '—',
      };
    });
  }, [classifications, financialRecords, objectsOfExpenditure]);

  const totals = useMemo(
    () =>
      rows.reduce(
        (summary, row) => ({
          appropriation: summary.appropriation + row.appropriation,
          allotment: summary.allotment + row.allotment,
          obligations: summary.obligations + row.obligations,
          balance: summary.balance + row.balance,
        }),
        {
          appropriation: 0,
          allotment: 0,
          obligations: 0,
          balance: 0,
        }
      ),
    [rows]
  );

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-sm">
          <thead className="bg-slate-100 text-slate-700">
            <tr>
              <th className="border-b border-slate-200 px-4 py-3 text-center font-semibold">
                #
              </th>
              <th className="border-b border-slate-200 px-4 py-3 text-left font-semibold">
                Classification
              </th>
              <th className="border-b border-slate-200 px-4 py-3 text-left font-semibold">
                Object
              </th>
              <th className="border-b border-slate-200 px-4 py-3 text-right font-semibold">
                Appropriation
              </th>
              <th className="border-b border-slate-200 px-4 py-3 text-right font-semibold">
                Allotment
              </th>
              <th className="border-b border-slate-200 px-4 py-3 text-right font-semibold">
                Obligations
              </th>
              <th className="border-b border-slate-200 px-4 py-3 text-right font-semibold">
                Balance
              </th>
              <th className="border-b border-slate-200 px-4 py-3 text-left font-semibold">
                Remarks
              </th>
            </tr>
          </thead>

          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-8 text-center text-sm text-slate-500"
                >
                  No financial records available.
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr
                  key={row.id}
                  className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}
                >
                  <td className="border-b border-slate-100 px-4 py-3 text-center text-slate-600">
                    {row.rowNumber}
                  </td>
                  <td className="border-b border-slate-100 px-4 py-3 text-slate-700">
                    {row.classificationName}
                  </td>
                  <td className="border-b border-slate-100 px-4 py-3 text-slate-700">
                    {row.objectLabel}
                  </td>
                  <td className="border-b border-slate-100 px-4 py-3 text-right font-medium tabular-nums text-slate-700">
                    {formatCurrency(row.appropriation)}
                  </td>
                  <td className="border-b border-slate-100 px-4 py-3 text-right font-medium tabular-nums text-slate-700">
                    {formatCurrency(row.allotment)}
                  </td>
                  <td className="border-b border-slate-100 px-4 py-3 text-right font-medium tabular-nums text-slate-700">
                    {formatCurrency(row.obligations)}
                  </td>
                  <td className="border-b border-slate-100 px-4 py-3 text-right font-medium tabular-nums text-slate-700">
                    {formatCurrency(row.balance)}
                  </td>
                  <td className="border-b border-slate-100 px-4 py-3 text-slate-600">
                    {row.remarks}
                  </td>
                </tr>
              ))
            )}
          </tbody>

          <tfoot className="bg-slate-100 text-slate-800">
            <tr>
              <td
                colSpan={3}
                className="border-t border-slate-200 px-4 py-3 text-right font-semibold"
              >
                GRAND TOTAL
              </td>
              <td className="border-t border-slate-200 px-4 py-3 text-right font-semibold tabular-nums">
                {formatCurrency(totals.appropriation)}
              </td>
              <td className="border-t border-slate-200 px-4 py-3 text-right font-semibold tabular-nums">
                {formatCurrency(totals.allotment)}
              </td>
              <td className="border-t border-slate-200 px-4 py-3 text-right font-semibold tabular-nums">
                {formatCurrency(totals.obligations)}
              </td>
              <td className="border-t border-slate-200 px-4 py-3 text-right font-semibold tabular-nums">
                {formatCurrency(totals.balance)}
              </td>
              <td className="border-t border-slate-200 px-4 py-3" />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
