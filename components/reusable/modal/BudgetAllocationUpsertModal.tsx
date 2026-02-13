'use client';

import React, {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  AlertCircle,
  Layers,
  PhilippinePeso,
  Plus,
  X,
} from 'lucide-react';

import api from '@/components/lib/api';
import AlertModal from '@/components/reusable/modal/AlertModal';
import FlatInput from '@/components/reusable/ui/FlatInput';
import FlatSelect from '@/components/reusable/ui/FlatSelect';

/* ================= TYPES ================= */
interface BudgetAllocationUpsertModalProps {
  open: boolean;
  allocationId?: number | null;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormState {
  budgetId: string;
  programId: string;
  classificationId: string;
  objectOfExpenditureId: string;
  allocatedAmount: string;
}

interface ClassificationLimit {
  id: number;
  budgetId: number;
  classificationId: number;
  limitAmount: string;
  budget: {
    id: number;
    totalAmount: string;
    fiscalYear: {
      id: number;
      year: number;
    };
  };
}

interface LimitInfo {
  limitAmount: number;
  totalAllocated: number;
  remaining: number;
}

interface RemainingBudget {
  totalAmount: number;
  totalAllocated: number;
  remaining: number;
}

/* ================= CONSTANTS ================= */
const initialForm: FormState = {
  budgetId: '',
  programId: '',
  classificationId: '',
  objectOfExpenditureId: '',
  allocatedAmount: '',
};

/* ================= COMPONENT ================= */
const BudgetAllocationUpsertModal: React.FC<
  BudgetAllocationUpsertModalProps
> = ({ open, allocationId, onClose, onSuccess }) => {
  const isEdit = !!allocationId;

  const [form, setForm] = useState<FormState>(initialForm);
  const [loading, setLoading] = useState(false);

  const [budgets, setBudgets] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [classifications, setClassifications] = useState<any[]>([]);
  const [objects, setObjects] = useState<any[]>([]);

  /* ================= LIMIT STATE ================= */
  const [classificationLimits, setClassificationLimits] = useState<
    ClassificationLimit[]
  >([]);
  const [limitInfo, setLimitInfo] = useState<LimitInfo | null>(null);
  const [limitLoading, setLimitLoading] = useState(false);

  /* ================= NEW LIMIT STATE ================= */
  const [showLimitForm, setShowLimitForm] = useState(false);
  const [newLimitBudgetId, setNewLimitBudgetId] = useState('');
  const [newLimitAmount, setNewLimitAmount] = useState('');
  const [remainingBudget, setRemainingBudget] = useState<RemainingBudget | null>(
    null
  );
  const [limitSaving, setLimitSaving] = useState(false);

  const [alert, setAlert] = useState<{
    open: boolean;
    type: 'success' | 'error';
    title: string;
    message: string;
  }>({
    open: false,
    type: 'success',
    title: '',
    message: '',
  });

  /* ================= RESET ================= */
  const resetForm = () => {
    setForm(initialForm);
    setClassificationLimits([]);
    setLimitInfo(null);
    setShowLimitForm(false);
    setNewLimitBudgetId('');
    setNewLimitAmount('');
    setRemainingBudget(null);
  };

  /* ================= FETCH LIMITS BY CLASSIFICATION ================= */
  const fetchClassificationLimits = useCallback(
    async (classificationId: string) => {
      if (!classificationId) {
        setClassificationLimits([]);
        return;
      }

      setLimitLoading(true);

      try {
        const res = await api.get(
          `/classification-limits/classification/${classificationId}`
        );
        setClassificationLimits(res.data.data.limits || []);
      } catch {
        setClassificationLimits([]);
      } finally {
        setLimitLoading(false);
      }
    },
    []
  );

  /* ================= FETCH REMAINING LIMIT FOR ALLOCATION ================= */
  const fetchRemainingLimit = useCallback(
    async (budgetId: string, classificationId: string) => {
      if (!budgetId || !classificationId) {
        setLimitInfo(null);
        return;
      }

      try {
        const res = await api.get(
          `/budget-allocations/remaining/${budgetId}/${classificationId}`
        );

        setLimitInfo({
          limitAmount: res.data.data.limitAmount,
          totalAllocated: res.data.data.totalAllocated,
          remaining: res.data.data.remaining,
        });
      } catch (err) {
        console.error('Error fetching remaining limit:', err);
        setLimitInfo(null);
      }
    },
    []
  );

  /* ================= FETCH REMAINING BUDGET FOR NEW LIMIT ================= */
  const fetchRemainingBudget = useCallback(async (budgetId: string) => {
    if (!budgetId) {
      setRemainingBudget(null);
      return;
    }

    try {
      const res = await api.get(
        `/classification-limits/remaining/${budgetId}`
      );
      setRemainingBudget(res.data.data);
    } catch {
      setRemainingBudget(null);
    }
  }, []);

  /* ================= LOAD DATA ================= */
  useEffect(() => {
    if (!open) {
      resetForm();
      return;
    }

    const load = async () => {
      const [b, p, c, o] = await Promise.all([
        api.get('/budgets'),
        api.get('/programs?isActive=true&limit=100'),
        api.get('/classifications'),
        api.get('/objects-of-expenditure?limit=100'),
      ]);

      setBudgets(b.data.data);
      setPrograms(p.data.data);
      setClassifications(c.data.data);
      setObjects(o.data.data);

      if (allocationId) {
        const res = await api.get(`/budget-allocations/${allocationId}`);
        const a = res.data.data;

        setForm({
          budgetId: String(a.budgetId),
          programId: String(a.programId),
          classificationId: String(a.classificationId),
          objectOfExpenditureId: String(a.objectOfExpenditureId),
          allocatedAmount: String(a.allocatedAmount),
        });

        await fetchClassificationLimits(String(a.classificationId));
        await fetchRemainingLimit(
          String(a.budgetId),
          String(a.classificationId)
        );
      }
    };

    load();
  }, [open, allocationId, fetchClassificationLimits, fetchRemainingLimit]);

  /* ================= CLASSIFICATION CHANGE ================= */
  const handleClassificationChange = async (classificationId: string) => {
    setForm((f) => ({
      ...f,
      classificationId,
      budgetId: '',
      allocatedAmount: '',
    }));
    setLimitInfo(null);
    setShowLimitForm(false);

    await fetchClassificationLimits(classificationId);
  };

  /* ================= BUDGET LIMIT SELECT - FIXED ================= */
  const handleBudgetLimitChange = async (selectedValue: string) => {
    console.log('Budget limit selected:', selectedValue);
    console.log('Classification ID:', form.classificationId);
    
    // Set the budgetId in form
    setForm((f) => ({
      ...f,
      budgetId: selectedValue,
      allocatedAmount: '',
    }));

    // Fetch remaining limit with both budgetId and classificationId
    if (selectedValue && form.classificationId) {
      console.log('Fetching remaining limit for:', selectedValue, form.classificationId);
      await fetchRemainingLimit(selectedValue, form.classificationId);
    } else {
      setLimitInfo(null);
    }
  };

  /* ================= SHOW ADD NEW LIMIT FORM ================= */
  const handleShowAddLimit = () => {
    setShowLimitForm(true);
    setNewLimitBudgetId('');
    setNewLimitAmount('');
    setRemainingBudget(null);
  };

  /* ================= NEW LIMIT BUDGET CHANGE ================= */
  const handleNewLimitBudgetChange = async (budgetId: string) => {
    setNewLimitBudgetId(budgetId);
    await fetchRemainingBudget(budgetId);
  };

  /* ================= GET AVAILABLE BUDGETS FOR NEW LIMIT ================= */
  const getAvailableBudgetsForNewLimit = () => {
    const usedBudgetIds = classificationLimits.map((l) => l.budgetId);
    return budgets.filter((b) => !usedBudgetIds.includes(b.id));
  };

  /* ================= AMOUNT HANDLER ================= */
  const handleAmountChange = (val: string) => {
    if (val === '') {
      setForm((f) => ({ ...f, allocatedAmount: '' }));
      return;
    }

    const num = Number(val);
    if (Number.isNaN(num)) return;

    setForm((f) => ({
      ...f,
      allocatedAmount: val,
    }));
  };

  /* ================= CREATE NEW LIMIT ================= */
  const handleCreateLimit = async () => {
    if (!newLimitBudgetId) {
      setAlert({
        open: true,
        type: 'error',
        title: 'Select Budget',
        message: 'Please select a budget for the new limit.',
      });
      return;
    }

    if (!newLimitAmount || Number(newLimitAmount) <= 0) {
      setAlert({
        open: true,
        type: 'error',
        title: 'Invalid Amount',
        message: 'Limit amount must be greater than zero.',
      });
      return;
    }

    if (
      remainingBudget &&
      Number(newLimitAmount) > remainingBudget.remaining
    ) {
      setAlert({
        open: true,
        type: 'error',
        title: 'Exceeds Budget',
        message: `Limit cannot exceed remaining budget (₱${remainingBudget.remaining.toLocaleString()}).`,
      });
      return;
    }

    setLimitSaving(true);

    try {
      await api.post('/classification-limits', {
        budgetId: Number(newLimitBudgetId),
        classificationId: Number(form.classificationId),
        limitAmount: Number(newLimitAmount),
      });

      // Refresh classification limits
      await fetchClassificationLimits(form.classificationId);

      // Set the newly created budget as selected
      setForm((f) => ({ ...f, budgetId: newLimitBudgetId }));
      
      // Fetch remaining limit for the new budget
      await fetchRemainingLimit(newLimitBudgetId, form.classificationId);

      setShowLimitForm(false);
      setNewLimitBudgetId('');
      setNewLimitAmount('');

      setAlert({
        open: true,
        type: 'success',
        title: 'Limit Created',
        message: 'Classification limit has been set successfully.',
      });
    } catch (err: any) {
      setAlert({
        open: true,
        type: 'error',
        title: 'Failed',
        message: err?.response?.data?.message ?? 'Failed to create limit.',
      });
    } finally {
      setLimitSaving(false);
    }
  };

  /* ================= SUBMIT ================= */
  const handleSubmit = async () => {
    // Validate classification
    if (!form.classificationId) {
      setAlert({
        open: true,
        type: 'error',
        title: 'Select Classification',
        message: 'Please select a classification.',
      });
      return;
    }

    // Validate budget limit
    if (!form.budgetId) {
      setAlert({
        open: true,
        type: 'error',
        title: 'Select Budget Limit',
        message: 'Please select a budget limit before creating an allocation.',
      });
      return;
    }

    // Validate program
    if (!form.programId) {
      setAlert({
        open: true,
        type: 'error',
        title: 'Select Program',
        message: 'Please select a program.',
      });
      return;
    }

    // Validate object of expenditure
    if (!form.objectOfExpenditureId) {
      setAlert({
        open: true,
        type: 'error',
        title: 'Select Object',
        message: 'Please select an object of expenditure.',
      });
      return;
    }

    // Validate amount
    const allocatedAmount = Number(form.allocatedAmount);
    if (!form.allocatedAmount || allocatedAmount <= 0) {
      setAlert({
        open: true,
        type: 'error',
        title: 'Invalid Amount',
        message: 'Allocated amount must be greater than zero.',
      });
      return;
    }

    // Check if amount exceeds limit
    if (limitInfo && allocatedAmount > limitInfo.remaining) {
      setAlert({
        open: true,
        type: 'error',
        title: 'Exceeds Available Budget',
        message: `Allocated amount (₱${allocatedAmount.toLocaleString()}) exceeds available budget (₱${limitInfo.remaining.toLocaleString()}).`,
      });
      return;
    }

    setLoading(true);

    try {
      const payload = {
        budgetId: Number(form.budgetId),
        programId: Number(form.programId),
        classificationId: Number(form.classificationId),
        objectOfExpenditureId: Number(form.objectOfExpenditureId),
        allocatedAmount: allocatedAmount,
      };

      console.log('Submitting budget allocation:', payload);

      if (isEdit) {
        await api.put(`/budget-allocations/${allocationId}`, payload);
      } else {
        await api.post('/budget-allocations', payload);
      }

      setAlert({
        open: true,
        type: 'success',
        title: 'Success',
        message: `Budget allocation ${
          isEdit ? 'updated' : 'created'
        } successfully.`,
      });
    } catch (e: any) {
      setAlert({
        open: true,
        type: 'error',
        title: 'Failed',
        message: e?.response?.data?.message ?? 'Something went wrong',
      });
    } finally {
      setLoading(false);
    }
  };

  /* ================= ALERT CLOSE ================= */
  const handleAlertClose = () => {
    const wasSuccess = alert.type === 'success';
    const wasAllocationSuccess = wasSuccess && alert.title === 'Success';

    setAlert((a) => ({ ...a, open: false }));

    if (wasAllocationSuccess) {
      resetForm();
      onClose();
      onSuccess();
    }
  };

  if (!open) return null;

  const availableBudgetsForNewLimit = getAvailableBudgetsForNewLimit();
  const hasAvailableBudgets = availableBudgetsForNewLimit.length > 0;

  /* ================= UI ================= */
  return (
    <>
      {/* BACKDROP */}
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
        {/* MODAL CONTAINER */}
        <div
          className="
            w-full max-w-2xl mx-4
            rounded-3xl bg-white
            shadow-2xl shadow-slate-900/20
            max-h-[90vh] overflow-hidden
            flex flex-col
          "
        >
          {/* ================= HEADER ================= */}
          <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div
                className="
                  w-12 h-12 rounded-2xl
                  bg-gradient-to-br from-blue-600 to-blue-700
                  flex items-center justify-center
                  shadow-lg shadow-blue-600/30
                "
              >
                <Layers className="text-white" size={22} />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-800 tracking-tight">
                  {isEdit ? 'Edit Allocation' : 'New Budget Allocation'}
                </h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  Allocate funds to programs and expenditures
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="
                p-2.5 rounded-xl
                text-slate-400 hover:text-slate-600
                hover:bg-slate-100
                transition-all duration-200
              "
            >
              <X size={20} />
            </button>
          </div>

          {/* ================= BODY ================= */}
          <div className="px-8 py-6 space-y-6 overflow-y-auto flex-1">
            {/* ROW 1: CLASSIFICATION & PROGRAM */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <FlatSelect
                label="Classification"
                value={form.classificationId}
                options={classifications.map((c) => ({
                  id: c.id,
                  label: `${c.code} — ${c.name}`,
                }))}
                onChange={handleClassificationChange}
              />

              <FlatSelect
                label="Program"
                value={form.programId}
                options={programs.map((p) => ({
                  id: p.id,
                  label: `${p.code} — ${p.name}`,
                }))}
                onChange={(v) => setForm((f) => ({ ...f, programId: v }))}
              />
            </div>

            {/* ================= BUDGET LIMIT SECTION ================= */}
            {form.classificationId && (
              <div
                className="
                  rounded-2xl
                  bg-slate-50/80
                  border border-slate-200
                  p-5
                "
              >
                {/* SECTION HEADER */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800">
                      Budget Limit
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Select or create a limit for this classification
                    </p>
                  </div>
                  {hasAvailableBudgets && !showLimitForm && (
                    <button
                      onClick={handleShowAddLimit}
                      className="
                        flex items-center gap-1.5
                        px-3.5 py-2 rounded-xl
                        text-xs font-semibold
                        text-blue-600 bg-blue-50
                        border border-blue-100
                        hover:bg-blue-100
                        transition-all duration-200
                      "
                    >
                      <Plus size={14} strokeWidth={2.5} />
                      Add Limit
                    </button>
                  )}
                </div>

                {/* LOADING STATE */}
                {limitLoading ? (
                  <div className="py-8 text-center">
                    <div
                      className="
                        w-8 h-8 mx-auto mb-3
                        border-2 border-slate-200 border-t-blue-600
                        rounded-full animate-spin
                      "
                    />
                    <p className="text-sm text-slate-500 font-medium">
                      Loading limits...
                    </p>
                  </div>
                ) : classificationLimits.length === 0 && !showLimitForm ? (
                  /* NO LIMITS EXIST */
                  <div
                    className="
                      rounded-xl
                      bg-amber-50/80 border border-amber-200
                      p-5
                    "
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className="
                          w-11 h-11 rounded-xl
                          bg-amber-100
                          flex items-center justify-center
                          flex-shrink-0
                        "
                      >
                        <AlertCircle className="text-amber-600" size={20} />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-slate-800">
                          No Budget Limit Found
                        </h4>
                        <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
                          This classification doesn't have a budget limit set.
                          Create one to start allocating funds.
                        </p>
                        {hasAvailableBudgets && (
                          <button
                            onClick={handleShowAddLimit}
                            className="
                              mt-4 flex items-center gap-2
                              px-4 py-2.5 rounded-xl
                              text-sm font-semibold
                              text-white bg-amber-500
                              hover:bg-amber-600
                              shadow-lg shadow-amber-500/25
                              transition-all duration-200
                            "
                          >
                            <Plus size={16} strokeWidth={2.5} />
                            Create Budget Limit
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* EXISTING LIMITS DROPDOWN */}
                    {classificationLimits.length > 0 && !showLimitForm && (
                      <div className="space-y-4">
                        <FlatSelect
                          label="Select Budget / Fiscal Year"
                          value={form.budgetId}
                          options={classificationLimits.map((l) => ({
                            id: l.budgetId,
                            label: `FY ${
                              l.budget.fiscalYear.year
                            } — Limit: ₱${Number(
                              l.limitAmount
                            ).toLocaleString()}`,
                          }))}
                          onChange={handleBudgetLimitChange}
                        />

                        {/* DEBUG INFO */}
                        {form.budgetId && (
                          <div className="text-xs text-slate-500 bg-slate-100 rounded-lg p-2">
                            Selected Budget ID: {form.budgetId}
                            {limitInfo && ` | Remaining: ₱${limitInfo.remaining.toLocaleString()}`}
                          </div>
                        )}

                        {/* LIMIT INFO DISPLAY */}
                        {limitInfo && (
                          <div
                            className="
                              grid grid-cols-3 gap-1
                              p-1 rounded-xl
                              bg-white border border-slate-200
                              shadow-sm
                            "
                          >
                            <div className="py-4 px-3 text-center rounded-lg">
                              <p className="text-lg font-bold text-slate-800">
                                ₱{limitInfo.limitAmount.toLocaleString()}
                              </p>
                              <p className="text-xs text-slate-500 mt-1.5 font-medium uppercase tracking-wide">
                                Total Limit
                              </p>
                            </div>
                            <div className="py-4 px-3 text-center bg-slate-50 rounded-lg">
                              <p className="text-lg font-bold text-slate-600">
                                ₱{limitInfo.totalAllocated.toLocaleString()}
                              </p>
                              <p className="text-xs text-slate-500 mt-1.5 font-medium uppercase tracking-wide">
                                Allocated
                              </p>
                            </div>
                            <div className="py-4 px-3 text-center bg-emerald-50 rounded-lg">
                              <p className="text-lg font-bold text-emerald-600">
                                ₱{limitInfo.remaining.toLocaleString()}
                              </p>
                              <p className="text-xs text-emerald-600 mt-1.5 font-medium uppercase tracking-wide">
                                Available
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}

                {/* ADD NEW LIMIT FORM */}
                {showLimitForm && (
                  <div
                    className="
                      rounded-xl
                      bg-blue-50/80 border border-blue-200
                      p-5
                    "
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-semibold text-slate-800">
                        Create New Budget Limit
                      </h4>
                      <button
                        onClick={() => {
                          setShowLimitForm(false);
                          setNewLimitBudgetId('');
                          setNewLimitAmount('');
                          setRemainingBudget(null);
                        }}
                        className="
                          p-2 rounded-lg
                          text-slate-400 hover:text-slate-600
                          hover:bg-blue-100
                          transition-all duration-200
                        "
                      >
                        <X size={16} />
                      </button>
                    </div>

                    <div className="space-y-4">
                      <FlatSelect
                        label="Select Budget / Fiscal Year"
                        value={newLimitBudgetId}
                        options={availableBudgetsForNewLimit.map((b) => ({
                          id: b.id,
                          label: `FY ${b.fiscalYear?.year} — Total: ₱${Number(
                            b.totalAmount
                          ).toLocaleString()}`,
                        }))}
                        onChange={handleNewLimitBudgetChange}
                      />

                      {remainingBudget && (
                        <div
                          className="
                            px-4 py-3.5 rounded-xl
                            bg-white border border-blue-100
                          "
                        >
                          <p className="text-sm text-slate-700">
                            <span className="text-slate-500 font-medium">
                              Available Budget:
                            </span>{' '}
                            <span className="font-bold text-slate-800">
                              ₱{remainingBudget.remaining.toLocaleString()}
                            </span>{' '}
                            <span className="text-slate-400">
                              of ₱{remainingBudget.totalAmount.toLocaleString()}
                            </span>
                          </p>
                        </div>
                      )}

                      <FlatInput
                        label="Limit Amount"
                        icon={PhilippinePeso}
                        type="number"
                        value={newLimitAmount}
                        onChange={(e) => setNewLimitAmount(e.target.value)}
                      />

                      <button
                        onClick={handleCreateLimit}
                        disabled={limitSaving}
                        className="
                          w-full py-3 rounded-xl
                          text-sm font-semibold
                          text-white bg-blue-600
                          hover:bg-blue-700
                          disabled:opacity-50 disabled:cursor-not-allowed
                          shadow-lg shadow-blue-600/25
                          transition-all duration-200
                        "
                      >
                        {limitSaving ? 'Creating Limit...' : 'Create Limit'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ================= OBJECT OF EXPENDITURE ================= */}
            <FlatSelect
              label="Object of Expenditure"
              value={form.objectOfExpenditureId}
              options={objects.map((o) => ({
                id: o.id,
                label: `${o.code} — ${o.name}`,
              }))}
              onChange={(v) =>
                setForm((f) => ({ ...f, objectOfExpenditureId: v }))
              }
            />

            {/* ================= ALLOCATED AMOUNT ================= */}
            <div>
              <FlatInput
                label="Allocated Amount"
                icon={PhilippinePeso}
                type="number"
                value={form.allocatedAmount}
                onChange={(e) => handleAmountChange(e.target.value)}
              />
              {limitInfo && form.budgetId && (
                <p className="mt-2.5 text-sm text-slate-500">
                  Maximum available:{' '}
                  <span className="font-semibold text-emerald-600">
                    ₱{limitInfo.remaining.toLocaleString()}
                  </span>
                </p>
              )}
              {!form.budgetId && form.classificationId && (
                <p className="mt-2.5 text-sm text-amber-600">
                  Please select a budget limit first
                </p>
              )}
            </div>
          </div>

          {/* ================= FOOTER ================= */}
          <div
            className="
              px-8 py-5
              border-t border-slate-100
              bg-slate-50/50
              flex justify-end gap-3
            "
          >
            <button
              onClick={onClose}
              className="
                px-5 py-2.5 rounded-xl
                text-sm font-semibold
                text-slate-600 bg-white
                border border-slate-200
                hover:bg-slate-50 hover:border-slate-300
                transition-all duration-200
              "
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="
                px-6 py-2.5 rounded-xl
                text-sm font-semibold
                text-white bg-blue-600
                hover:bg-blue-700
                disabled:opacity-50 disabled:cursor-not-allowed
                shadow-lg shadow-blue-600/25
                transition-all duration-200
              "
            >
              {loading
                ? 'Saving...'
                : isEdit
                ? 'Update Allocation'
                : 'Create Allocation'}
            </button>
          </div>
        </div>
      </div>

      <AlertModal
        open={alert.open}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        confirmText="OK"
        onConfirm={handleAlertClose}
        onClose={handleAlertClose}
      />
    </>
  );
};

export default BudgetAllocationUpsertModal;