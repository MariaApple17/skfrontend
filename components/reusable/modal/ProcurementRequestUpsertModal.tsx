'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  FileText,
  Info,
  PhilippinePeso,
  Plus,
  Trash2,
} from 'lucide-react';

import api from '@/components/lib/api';
import AlertModal from '@/components/reusable/modal/AlertModal';
import FlatInput from '@/components/reusable/ui/FlatInput';
import FlatSelect from '@/components/reusable/ui/FlatSelect';

/* ================= TYPES ================= */

interface Item {
  name: string;
  unit: string;
  quantity: number;
  unitCost: number;
}

interface Allocation {
  id: number;
  label: string;
  allocated: number;
  used: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  requestId?: number | null;
}

const EMPTY_ITEM: Item = {
  name: '',
  quantity: 1,
  unit: '',
  unitCost: 0,
};

export default function ProcurementRequestUpsertModal({
  open,
  onClose,
  onSuccess,
  requestId,
}: Props) {
  const isEdit = Boolean(requestId);

  /* ================= STATE ================= */

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [allocationId, setAllocationId] = useState<string | null>(null);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [items, setItems] = useState<Item[]>([{ ...EMPTY_ITEM }]);

  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  /* ================= COMPUTED ================= */

  const totalAmount = useMemo(
    () =>
      items.reduce(
        (sum, i) => sum + i.quantity * i.unitCost,
        0
      ),
    [items]
  );

  /* ================= RESET ================= */

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setAllocationId(null);
    setItems([{ ...EMPTY_ITEM }]);
  };

  /* ================= LOAD ALLOCATIONS ================= */

  useEffect(() => {
    if (!open || isEdit) return;

    api.get('/budget-allocations')
      .then(res => {
        if (!res.data?.success) return;
        
const data = (res.data.data ?? []).map((a: any) => ({
  id: Number(a.id),
  allocated: Number(a.allocatedAmount ?? 0),
  used: Number(a.usedAmount ?? 0),
  label: `${a?.program?.code ?? 'N/A'} – ${a?.program?.name ?? 'Unknown'} • ${a?.classification?.name ?? 'Unknown'} • ${a?.object?.name ?? 'Unknown'}`,
}));

        setAllocations(data);
      })
      .catch(() => {
        setAlert({
          type: 'error',
          message: 'Failed to load budget allocations',
        });
      });
  }, [open, isEdit]);

  /* ================= LOAD DRAFT ================= */

  useEffect(() => {
    if (!open || !isEdit || !requestId) return;

    setLoading(true);

    api.get(`/procurement/${requestId}/draft`)
      .then(res => {
        if (!res.data?.success) {
          throw new Error('Failed to load draft request');
        }

        const d = res.data.data;

        setTitle(d.title ?? '');
        setDescription(d.description ?? '');
        setAllocationId(String(d.allocationId ?? ''));

        setItems(
          (d.items ?? []).length
            ? d.items.map((i: any) => ({
                name: i.name ?? '',
                quantity: Number(i.quantity ?? 1),
                unit: i.unit ?? '',
                unitCost: Number(i.unitCost ?? 0),
              }))
            : [{ ...EMPTY_ITEM }]
        );
      })
      .catch(err => {
        setAlert({
          type: 'error',
          message:
            err?.response?.data?.message ||
            'Failed to load draft request',
        });
      })
      .finally(() => {
        setLoading(false);
      });
  }, [open, isEdit, requestId]);

  /* ================= SUBMIT ================= */

  const handleSubmit = async () => {
    if (!title.trim()) {
      setAlert({ type: 'error', message: 'Title is required' });
      return;
    }

    if (!isEdit && !allocationId) {
      setAlert({
        type: 'error',
        message: 'Please select a budget allocation',
      });
      return;
    }

    if (!items.length || items.some(i => !i.name.trim())) {
      setAlert({
        type: 'error',
        message: 'All items must have a name',
      });
      return;
    }

    if (items.some(i => !i.unit.trim())) {
      setAlert({
        type: 'error',
        message: 'All items must have a unit (pcs, box, kg, etc.)',
      });
      return;
    }

    if (items.some(i => i.quantity <= 0 || i.unitCost <= 0)) {
      setAlert({
        type: 'error',
        message: 'Quantity and unit cost must be greater than zero',
      });
      return;
    }

    setLoading(true);

    try {
      const payload = {
        title,
        description,
        ...(isEdit ? {} : { allocationId: Number(allocationId) }),
        items,
      };

      const res = isEdit
        ? await api.put(`/procurement/${requestId}`, payload)
        : await api.post('/procurement', payload);

      setAlert({
        type: 'success',
        message: res.data.message,
      });

      resetForm();
      onSuccess();
    } catch (err: any) {
      setAlert({
        type: 'error',
        message:
          err?.response?.data?.message ||
          'Failed to save request',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" />

      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="w-full max-w-4xl rounded-2xl bg-white p-6 shadow-xl space-y-6">

          <h2 className="text-lg font-semibold text-gray-900">
            {isEdit ? 'Update Procurement Request' : 'New Procurement Request'}
          </h2>

          <div className="flex gap-3 rounded-xl bg-blue-50 p-4 text-sm text-blue-800">
            <Info size={18} className="mt-0.5" />
            <div>
              <p className="font-medium">Total amount</p>
              <p className="mt-1">Automatically calculated from items.</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <FlatInput
              label="Title"
              icon={FileText}
              value={title}
              onChange={e => setTitle(e.target.value)}
            />

            <FlatInput
              label="Total Amount"
              icon={PhilippinePeso}
              value={`₱${totalAmount.toLocaleString()}`}
              disabled
            />
          </div>

          <FlatInput
            label="Description"
            value={description}
            onChange={e => setDescription(e.target.value)}
          />

          {!isEdit && (
            <FlatSelect
              label="Budget Allocation"
              value={allocationId ?? ''}
              options={allocations.map(a => ({
                id: String(a.id),
                label: `${a.label} (₱${(a.allocated - a.used).toLocaleString()} remaining)`,
              }))}
              placeholder="Select allocation"
              onChange={v => setAllocationId(v || null)}
            />
          )}

          {/* ================= ITEMS ================= */}

          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-700">Items</p>

            <div className="grid grid-cols-12 gap-3 text-xs font-semibold text-gray-500 px-1">
              <div className="col-span-4">Item Name</div>
              <div className="col-span-2 text-center">Quantity</div>
              <div className="col-span-2 text-center">Unit</div>
              <div className="col-span-2 text-right">Unit Cost</div>
              <div className="col-span-1 text-right">Subtotal</div>
              <div className="col-span-1"></div>
            </div>

            {items.map((item, idx) => {
              const subtotal = item.quantity * item.unitCost;

              return (
                <div key={idx} className="grid grid-cols-12 gap-3 items-center">

                  <input
                    className="col-span-4 rounded-xl bg-gray-100 px-4 py-2 text-sm"
                    placeholder="Item name"
                    value={item.name}
                    onChange={e => {
                      const updated = [...items];
                      updated[idx].name = e.target.value;
                      setItems(updated);
                    }}
                  />

                  <input
                    type="number"
                    min={1}
                    className="col-span-2 rounded-xl bg-gray-100 px-3 py-2 text-sm text-center"
                    value={item.quantity}
                    onChange={e => {
                      const updated = [...items];
                      updated[idx].quantity = Number(e.target.value);
                      setItems(updated);
                    }}
                  />

                  <input
                    className="col-span-2 rounded-xl bg-gray-100 px-3 py-2 text-sm text-center"
                    placeholder="pcs / box / kg"
                    value={item.unit}
                    onChange={e => {
                      const updated = [...items];
                      updated[idx].unit = e.target.value;
                      setItems(updated);
                    }}
                  />

                  <input
                    type="number"
                    min={0}
                    className="col-span-2 rounded-xl bg-gray-100 px-3 py-2 text-sm text-right"
                    value={item.unitCost}
                    onChange={e => {
                      const updated = [...items];
                      updated[idx].unitCost = Number(e.target.value);
                      setItems(updated);
                    }}
                  />

                  <div className="col-span-1 text-right text-sm font-medium">
                    ₱{subtotal.toLocaleString()}
                  </div>

                  <button
                    onClick={() =>
                      setItems(items.filter((_, i) => i !== idx))
                    }
                    className="col-span-1 flex justify-center text-red-500"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })}

            <button
              onClick={() => setItems([...items, { ...EMPTY_ITEM }])}
              className="flex items-center gap-2 text-sm text-blue-600"
            >
              <Plus size={16} />
              Add item
            </button>
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={() => {
                resetForm();
                onClose();
              }}
              className="rounded-xl bg-gray-100 px-4 py-2 text-sm"
            >
              Cancel
            </button>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="rounded-xl bg-blue-600 px-5 py-2 text-sm text-white disabled:opacity-50"
            >
              {loading ? 'Saving…' : isEdit ? 'Update' : 'Create'}
            </button>
          </div>
        </div>
      </div>

      <AlertModal
        open={!!alert}
        type={alert?.type}
        message={alert?.message ?? ''}
        confirmText="OK"
        onConfirm={() => {
          setAlert(null);
          if (alert?.type === 'success') onClose();
        }}
        onClose={() => setAlert(null)}
      />
    </>
  );
}
