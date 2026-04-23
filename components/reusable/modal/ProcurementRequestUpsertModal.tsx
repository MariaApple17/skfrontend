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
import ProcurementFundingSelector from '@/components/reusable/ui/ProcurementFundingSelector';
import {
  BUDGET_CATEGORY_OPTIONS,
  filterAllocationsByCategoryAndProgram,
  filterProgramsByProgramCategory,
  normalizeFundingAllocations,
  normalizeFundingPrograms,
  PROGRAM_CATEGORY_OPTIONS,
  type FundingAllocationRecord,
  type FundingProgramRecord,
} from '@/lib/funding/reference';
import type { BudgetCategory } from '@/lib/budget';

interface Item {
  name: string;
  unit: string;
  quantity: number;
  unitCost: number;
}

interface DraftRequest {
  title?: string | null;
  description?: string | null;
  allocationId?: number | null;
  allocation?: {
    id: number;
    category?: BudgetCategory | null;
    programId?: number | null;
  } | null;
  items?: Array<{
    name?: string | null;
    unit?: string | null;
    quantity?: number | null;
    unitCost?: number | string | null;
  }>;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  requestId?: number | null;
  selectedFiscalYearId: number | null;
}

const EMPTY_ITEM: Item = {
  name: '',
  quantity: 1,
  unit: '',
  unitCost: 0,
};

const deriveFundingSelections = ({
  allocationId,
  allocations,
  programs,
}: {
  allocationId?: number | null;
  allocations: FundingAllocationRecord[];
  programs: Array<
    FundingProgramRecord & {
      categoryId: number | null;
      programCategoryId: number | null;
    }
  >;
}) => {
  const allocation = allocations.find(
    (item) => Number(item.id) === Number(allocationId)
  );

  if (!allocation?.category) {
    return {
      category: '',
      programCategoryId: '',
      programId: '',
    };
  }

  if (allocation.category === 'ADMINISTRATIVE') {
    return {
      category: 'ADMINISTRATIVE' as const,
      programCategoryId: '',
      programId: '',
    };
  }

  const program = programs.find(
    (item) =>
      Number(item.id) === Number(allocation.programId ?? 0)
  );

  return {
    category: 'YOUTH' as const,
    programCategoryId: String(
      program?.programCategoryId ?? program?.categoryId ?? ''
    ),
    programId: String(allocation.programId ?? ''),
  };
};

export default function ProcurementRequestUpsertModal({
  open,
  onClose,
  onSuccess,
  requestId,
  selectedFiscalYearId,
}: Props) {
  const isEdit = Boolean(requestId);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<
    BudgetCategory | ''
  >('');
  const [programCategoryId, setProgramCategoryId] =
    useState('');
  const [programId, setProgramId] = useState('');
  const [allocationId, setAllocationId] = useState('');
  const [programs, setPrograms] = useState<
    Array<
      FundingProgramRecord & {
        categoryId: number | null;
        programCategoryId: number | null;
      }
    >
  >([]);
  const [allocations, setAllocations] = useState<
    FundingAllocationRecord[]
  >([]);
  const [items, setItems] = useState<Item[]>([
    { ...EMPTY_ITEM },
  ]);

  const [loading, setLoading] = useState(false);
  const [referenceLoading, setReferenceLoading] =
    useState(false);
  const [alert, setAlert] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const totalAmount = useMemo(
    () =>
      items.reduce(
        (sum, item) =>
          sum + item.quantity * item.unitCost,
        0
      ),
    [items]
  );

  const filteredPrograms = useMemo(() => {
    if (category !== 'YOUTH') {
      return [];
    }

    return filterProgramsByProgramCategory(
      programs,
      programCategoryId
    );
  }, [category, programCategoryId, programs]);

  const filteredAllocations = useMemo(
    () =>
      filterAllocationsByCategoryAndProgram(
        allocations,
        category,
        programId
      ),
    [allocations, category, programId]
  );

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCategory('');
    setProgramCategoryId('');
    setProgramId('');
    setAllocationId('');
    setItems([{ ...EMPTY_ITEM }]);
  };

  useEffect(() => {
    if (!open) {
      resetForm();
      return;
    }

    if (!selectedFiscalYearId) {
      setAlert({
        type: 'error',
        message: 'Please select an active fiscal year first.',
      });
      return;
    }

    const load = async () => {
      setReferenceLoading(true);

      try {
        const requests = [
          api.get('/budget-allocations', {
            params: {
              fiscalYearId: selectedFiscalYearId,
              limit: 1000,
            },
          }),
          api.get('/programs', {
            params: {
              fiscalYearId: selectedFiscalYearId,
              approvalStatus: 'APPROVED',
              limit: 1000,
            },
          }),
        ];

        if (isEdit && requestId) {
          requests.push(
            api.get(`/procurement/${requestId}/draft`)
          );
        }

        const responses = await Promise.all(requests);
        const allocationsData = normalizeFundingAllocations(
          responses[0].data?.data ?? []
        );
        const programsData = normalizeFundingPrograms(
          responses[1].data?.data ?? []
        );

        setAllocations(allocationsData);
        setPrograms(programsData);

        if (isEdit && requestId) {
          const draft =
            responses[2]?.data?.data as DraftRequest;
          const selections = deriveFundingSelections({
            allocationId:
              draft?.allocationId ??
              draft?.allocation?.id ??
              null,
            allocations: allocationsData,
            programs: programsData,
          });

          setTitle(draft?.title ?? '');
          setDescription(draft?.description ?? '');
          setCategory(
            (draft?.allocation?.category ??
              selections.category) as BudgetCategory | ''
          );
          setProgramCategoryId(
            selections.programCategoryId
          );
          setProgramId(selections.programId);
          setAllocationId(
            String(
              draft?.allocationId ??
                draft?.allocation?.id ??
                ''
            )
          );
          setItems(
            draft?.items?.length
              ? draft.items.map((item) => ({
                  name: item.name ?? '',
                  quantity: Number(
                    item.quantity ?? 1
                  ),
                  unit: item.unit ?? '',
                  unitCost: Number(
                    item.unitCost ?? 0
                  ),
                }))
              : [{ ...EMPTY_ITEM }]
          );
          return;
        }

        resetForm();
      } catch (err: any) {
        setAlert({
          type: 'error',
          message:
            err?.response?.data?.message ??
            'Failed to load procurement funding references.',
        });
      } finally {
        setReferenceLoading(false);
      }
    };

    load();
  }, [
    open,
    isEdit,
    requestId,
    selectedFiscalYearId,
  ]);

  const handleCategoryChange = (value: string) => {
    const nextCategory = value as BudgetCategory | '';

    setCategory(nextCategory);
    setProgramCategoryId('');
    setProgramId('');
    setAllocationId('');
  };

  const handleProgramCategoryChange = (
    value: string
  ) => {
    setProgramCategoryId(value);
    setProgramId('');
    setAllocationId('');
  };

  const handleProgramChange = (value: string) => {
    setProgramId(value);
    setAllocationId('');
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      setAlert({
        type: 'error',
        message: 'Title is required.',
      });
      return;
    }

    if (!category) {
      setAlert({
        type: 'error',
        message: 'Please select a category.',
      });
      return;
    }

    if (
      category === 'YOUTH' &&
      !programCategoryId
    ) {
      setAlert({
        type: 'error',
        message:
          'Please select a program category for SKYDEP.',
      });
      return;
    }

    if (category === 'YOUTH' && !programId) {
      setAlert({
        type: 'error',
        message:
          'Please select a program for SKYDEP.',
      });
      return;
    }

    if (!allocationId) {
      setAlert({
        type: 'error',
        message: 'Please select a source of funds.',
      });
      return;
    }

    if (!items.length || items.some((item) => !item.name.trim())) {
      setAlert({
        type: 'error',
        message: 'All items must have a name.',
      });
      return;
    }

    if (items.some((item) => !item.unit.trim())) {
      setAlert({
        type: 'error',
        message:
          'All items must have a unit (pcs, box, kg, etc.).',
      });
      return;
    }

    if (
      items.some(
        (item) =>
          item.quantity <= 0 || item.unitCost <= 0
      )
    ) {
      setAlert({
        type: 'error',
        message:
          'Quantity and unit cost must be greater than zero.',
      });
      return;
    }

    setLoading(true);

    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        allocationId: Number(allocationId),
        items,
      };

      const response = isEdit
        ? await api.put(
            `/procurement/${requestId}`,
            payload
          )
        : await api.post('/procurement', payload);

      setAlert({
        type: 'success',
        message:
          response.data?.message ??
          'Procurement request saved successfully.',
      });

      onSuccess();
    } catch (err: any) {
      setAlert({
        type: 'error',
        message:
          err?.response?.data?.message ??
          'Failed to save procurement request.',
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
            {isEdit
              ? 'Update Procurement Request'
              : 'New Procurement Request'}
          </h2>

          <div className="flex gap-3 rounded-xl bg-blue-50 p-4 text-sm text-blue-800">
            <Info size={18} className="mt-0.5" />
            <div>
              <p className="font-medium">Total amount</p>
              <p className="mt-1">
                Automatically calculated from items.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <FlatInput
              label="Title"
              icon={FileText}
              value={title}
              onChange={(event) =>
                setTitle(event.target.value)
              }
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
            onChange={(event) =>
              setDescription(event.target.value)
            }
          />

          <ProcurementFundingSelector
            categoryValue={category}
            programCategoryValue={programCategoryId}
            programValue={programId}
            allocationValue={allocationId}
            categoryOptions={BUDGET_CATEGORY_OPTIONS.map(
              (option) => ({
                id: option.id,
                label: option.label,
              })
            )}
            programCategoryOptions={PROGRAM_CATEGORY_OPTIONS.map(
              (option) => ({
                id: option.id,
                label: option.name,
              })
            )}
            programOptions={filteredPrograms.map((program) => ({
              id: String(program.id),
              label: `${program.code} - ${program.name}`,
            }))}
            allocationOptions={filteredAllocations.map(
              (allocation) => ({
                id: String(allocation.id),
                label: allocation.label,
              })
            )}
            onCategoryChange={handleCategoryChange}
            onProgramCategoryChange={
              handleProgramCategoryChange
            }
            onProgramChange={handleProgramChange}
            onAllocationChange={setAllocationId}
          />

          {referenceLoading && (
            <p className="text-sm text-slate-500">
              Loading funding references...
            </p>
          )}

          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-700">
              Items
            </p>

            <div className="grid grid-cols-12 gap-3 text-xs font-semibold text-gray-500 px-1">
              <div className="col-span-4">Item Name</div>
              <div className="col-span-2 text-center">
                Quantity
              </div>
              <div className="col-span-2 text-center">
                Unit
              </div>
              <div className="col-span-2 text-right">
                Unit Cost
              </div>
              <div className="col-span-1 text-right">
                Subtotal
              </div>
              <div className="col-span-1" />
            </div>

            {items.map((item, index) => {
              const subtotal =
                item.quantity * item.unitCost;

              return (
                <div
                  key={index}
                  className="grid grid-cols-12 gap-3 items-center"
                >
                  <input
                    className="col-span-4 rounded-xl bg-gray-100 px-4 py-2 text-sm"
                    placeholder="Item name"
                    value={item.name}
                    onChange={(event) => {
                      const updated = [...items];
                      updated[index].name =
                        event.target.value;
                      setItems(updated);
                    }}
                  />

                  <input
                    type="number"
                    min={1}
                    className="col-span-2 rounded-xl bg-gray-100 px-3 py-2 text-sm text-center"
                    value={item.quantity}
                    onChange={(event) => {
                      const updated = [...items];
                      updated[index].quantity = Number(
                        event.target.value
                      );
                      setItems(updated);
                    }}
                  />

                  <input
                    className="col-span-2 rounded-xl bg-gray-100 px-3 py-2 text-sm text-center"
                    placeholder="pcs / box / kg"
                    value={item.unit}
                    onChange={(event) => {
                      const updated = [...items];
                      updated[index].unit =
                        event.target.value;
                      setItems(updated);
                    }}
                  />

                  <input
                    type="number"
                    min={0}
                    className="col-span-2 rounded-xl bg-gray-100 px-3 py-2 text-sm text-right"
                    value={item.unitCost}
                    onChange={(event) => {
                      const updated = [...items];
                      updated[index].unitCost = Number(
                        event.target.value
                      );
                      setItems(updated);
                    }}
                  />

                  <div className="col-span-1 text-right text-sm font-medium">
                    ₱{subtotal.toLocaleString()}
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setItems(
                        items.filter(
                          (_, itemIndex) =>
                            itemIndex !== index
                        )
                      )
                    }
                    className="col-span-1 flex justify-center text-red-500"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })}

            <button
              type="button"
              onClick={() =>
                setItems([
                  ...items,
                  { ...EMPTY_ITEM },
                ])
              }
              className="flex items-center gap-2 text-sm text-blue-600"
            >
              <Plus size={16} />
              Add item
            </button>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                resetForm();
                onClose();
              }}
              className="rounded-xl bg-gray-100 px-4 py-2 text-sm"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || referenceLoading}
              className="rounded-xl bg-blue-600 px-5 py-2 text-sm text-white disabled:opacity-50"
            >
              {loading
                ? 'Saving…'
                : isEdit
                  ? 'Update'
                  : 'Create'}
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
          const wasSuccess = alert?.type === 'success';
          setAlert(null);

          if (wasSuccess) {
            resetForm();
            onClose();
          }
        }}
        onClose={() => setAlert(null)}
      />
    </>
  );
}
