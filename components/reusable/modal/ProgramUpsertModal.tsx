'use client'

import { useEffect, useState, useMemo } from 'react'
import { Calendar, Layers, Users } from 'lucide-react'

import api from '@/components/lib/api'
import AlertModal from '@/components/reusable/modal/AlertModal'
import FlatInput from '@/components/reusable/ui/FlatInput'
import { PROGRAM_CATEGORIES, PROGRAMS } from '@/src/lib/programs/catalog'

/* ================= TYPES ================= */

interface Program {
  code?: string
  name?: string
  description?: string
  committeeInCharge?: string
  beneficiaries?: string
  startDate?: string
  endDate?: string
  isActive?: boolean
  categoryId?: number | null
  programId?: number | null
}

interface ProgramUpsertModalProps {
  open: boolean
  programId?: number | null
  onClose: () => void
  onSuccess: () => void
}

interface ProgramPayload {
  code?: string
  name: string
  description?: string
  committeeInCharge: string
  beneficiaries: string
  startDate: string
  endDate: string
  isActive: boolean
  categoryId?: number | null
  programId?: number | null
}

/* ================= FORM TYPE ================= */

interface ProgramForm {
  code: string
  name: string
  description: string
  committeeInCharge: string
  beneficiaries: string
  startDate: string
  endDate: string
  isActive: boolean
  categoryId: number | null
  programId: number | null
}

/* ================= EMPTY FORM ================= */

const EMPTY_FORM: ProgramForm = {
  code: '',
  name: '',
  description: '',
  committeeInCharge: '',
  beneficiaries: '',
  startDate: '',
  endDate: '',
  isActive: false,
  categoryId: null,
  programId: null,
}

export default function ProgramUpsertModal({
  open,
  programId,
  onClose,
  onSuccess,
}: ProgramUpsertModalProps) {

  const isEdit = Boolean(programId)

  const [form, setForm] = useState<ProgramForm>(EMPTY_FORM)
  const [loading, setLoading] = useState(false)

  const [alert, setAlert] = useState({
    open: false,
    type: 'success' as 'success' | 'error',
    message: '',
  })

  /* ================= RESET ================= */

  const resetAll = () => {
    setForm(EMPTY_FORM)
    setLoading(false)
  }

  /* ================= LOAD PROGRAM ================= */

  useEffect(() => {

    if (!open) return

    resetAll()

    if (!programId) return

    const loadProgram = async () => {

      try {

        const res = await api.get(`/programs/${programId}`)
        const d: Program = res.data.data

        setForm({
          code: d.code ?? '',
          name: d.name ?? '',
          description: d.description ?? '',
          committeeInCharge: d.committeeInCharge ?? '',
          beneficiaries: d.beneficiaries ?? '',
          startDate: d.startDate?.slice(0, 10) ?? '',
          endDate: d.endDate?.slice(0, 10) ?? '',
          isActive: d.isActive ?? false,
          categoryId: d.categoryId ?? null,
          programId: d.programId ?? null,
        })

      } catch {

        setAlert({
          open: true,
          type: 'error',
          message: 'Failed to load program data.',
        })

      }

    }

    loadProgram()

  }, [open, programId])

  /* ================= VALIDATION ================= */

  const invalidDate =
    !!form.startDate &&
    !!form.endDate &&
    new Date(form.endDate) < new Date(form.startDate)

  const isInvalid =
    !form.categoryId ||
    !form.name ||
    !form.committeeInCharge ||
    !form.beneficiaries ||
    !form.startDate ||
    !form.endDate ||
    (!isEdit && !form.code) ||
    invalidDate

  /* ================= FILTERED PROGRAMS ================= */

  const filteredPrograms = useMemo(() => {
    if (!form.categoryId) {
      return [];
    }
    return PROGRAMS.filter(program => program.categoryId === form.categoryId);
  }, [form.categoryId]);

  /* ================= SUBMIT ================= */

  const handleSubmit = async () => {

    if (loading || isInvalid) return

    setLoading(true)

    try {

      const payload: ProgramPayload = {
        name: form.name,
        description: form.description,
        committeeInCharge: form.committeeInCharge,
        beneficiaries: form.beneficiaries,
        startDate: form.startDate,
        endDate: form.endDate,
        isActive: form.isActive,
        categoryId: form.categoryId ?? null,
        programId: form.programId ?? null,
        ...(isEdit ? {} : { code: form.code }),
      }

      if (isEdit) {
        await api.put(`/programs/${programId}`, payload)
      } else {
        await api.post('/programs', payload)
      }

      setAlert({
        open: true,
        type: 'success',
        message: isEdit
          ? 'Program updated successfully.'
          : 'Program created successfully.',
      })

      onSuccess()

    } catch (err: any) {

      setAlert({
        open: true,
        type: 'error',
        message:
          err?.response?.data?.message ??
          'Unable to save program.',
      })

    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm">

        <div className="w-full max-w-3xl rounded-2xl bg-white shadow-xl animate-scaleIn">

          {/* HEADER */}

          <div className="px-6 pt-6 pb-4 border-b border-slate-100">

            <h2 className="text-xl font-semibold text-slate-900">
              {isEdit ? 'Update Program' : 'Create Program'}
            </h2>

            <p className="text-sm text-slate-500">
              Program images are managed separately
            </p>

          </div>

          {/* BODY */}

          <div className="px-6 py-5 space-y-6">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {!isEdit && (
                <FlatInput
                  label="Program Code"
                  value={form.code}
                  onChange={(e) =>
                    setForm({ ...form, code: e.target.value })
                  }
                />
              )}

              <label className="w-full space-y-2">
                <span className="text-xs font-medium text-gray-500">
                  Program Category
                </span>
                <select
                  value={form.categoryId ?? ''}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      categoryId:
                        Number(e.target.value) || null,
                      programId: null, // Reset program when category changes
                    })
                  }
                  className="w-full rounded-xl border border-slate-300 bg-gray-100 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                >
                  <option value="">Select Category</option>
                  {PROGRAM_CATEGORIES.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="w-full space-y-2">
                <span className="text-xs font-medium text-gray-500">
                  Program
                </span>
                <select
                  value={form.programId ?? ''}
                  onChange={(e) => {
                    const selectedProgramId = Number(e.target.value) || null;
                    const selectedProgram = selectedProgramId 
                      ? PROGRAMS.find(p => p.id === selectedProgramId) 
                      : null;
                    
                    setForm({
                      ...form,
                      programId: selectedProgramId,
                      name: selectedProgram ? selectedProgram.name : '',
                    });
                  }}
                  disabled={!form.categoryId || filteredPrograms.length === 0}
                  className="w-full rounded-xl border border-slate-300 bg-gray-100 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-50"
                >
                  <option value="">
                    {form.categoryId ? 'Select Program' : 'Select Category First'}
                  </option>
                  {filteredPrograms.map((program) => (
                    <option key={program.id} value={program.id}>
                      {program.name}
                    </option>
                  ))}
                </select>
              </label>

              <FlatInput
                label="Program Name"
                value={form.name}
                onChange={(e) =>
                  setForm({ ...form, name: e.target.value })
                }
              />

              <FlatInput
                label="Committee In Charge"
                icon={Layers}
                value={form.committeeInCharge}
                onChange={(e) =>
                  setForm({
                    ...form,
                    committeeInCharge: e.target.value,
                  })
                }
              />

              <FlatInput
                label="Beneficiaries"
                icon={Users}
                value={form.beneficiaries}
                onChange={(e) =>
                  setForm({
                    ...form,
                    beneficiaries: e.target.value,
                  })
                }
              />

              <FlatInput
                type="date"
                label="Start Date"
                icon={Calendar}
                value={form.startDate}
                onChange={(e) =>
                  setForm({
                    ...form,
                    startDate: e.target.value,
                  })
                }
              />

              <FlatInput
                type="date"
                label="End Date"
                icon={Calendar}
                value={form.endDate}
                onChange={(e) =>
                  setForm({
                    ...form,
                    endDate: e.target.value,
                  })
                }
              />

            </div>

            <textarea
              rows={3}
              value={form.description}
              placeholder="Program description (optional)"
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              className="w-full rounded-xl bg-gray-100 px-4 py-3 text-sm"
            />

          </div>

          {/* FOOTER */}

          <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100">

            <button
              onClick={() => {
                resetAll()
                onClose()
              }}
              className="px-4 py-2 rounded-lg text-sm text-slate-600"
            >
              Cancel
            </button>

            <button
              onClick={handleSubmit}
              disabled={loading || isInvalid}
              className={`px-5 py-2 rounded-lg text-sm text-white ${
                loading || isInvalid
                  ? 'bg-slate-400'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {loading ? 'Saving...' : 'Save Program'}
            </button>

          </div>
        </div>
      </div>

      <AlertModal
        open={alert.open}
        type={alert.type}
        message={alert.message}
        confirmText="OK"
        onConfirm={() => {
          setAlert({ ...alert, open: false })
          resetAll()
          onClose()
        }}
        onClose={() => {
          setAlert({ ...alert, open: false })
          resetAll()
          onClose()
        }}
      />
    </>
  )
}