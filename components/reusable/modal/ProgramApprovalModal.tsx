'use client'

import { useState, useEffect } from "react"
import { CheckCircle, XCircle, Check, X } from "lucide-react"
import AlertModal from "@/components/reusable/modal/AlertModal"

interface Approval {
  member: string
  userId: number
  decision: "approved" | "rejected"
  date?: string
}

interface Program {
  id: number
  name: string
  description: string
  status: string
  approvals?: Approval[]
  user?: {
    fullName: string
  }
}

interface Props {
  program?: Program
  currentUserId: number
  onApprove: (id: number) => Promise<void>
  onReject: (id: number) => Promise<void>
  onClose?: () => void
}

export default function ProgramApprovalModal({
  program,
  currentUserId,
  onApprove,
  onReject,
  onClose
}: Props) {

  if (!program) return null

  /* ================= STATES ================= */

  const [loading, setLoading] = useState(false)
  const [approvals, setApprovals] = useState<Approval[]>(program.approvals ?? [])
  const [alertOpen, setAlertOpen] = useState(false)
  const [alertMessage, setAlertMessage] = useState("")

  /* ================= SYNC APPROVALS ================= */

  useEffect(() => {
    setApprovals(program.approvals ?? [])
  }, [program])

  /* ================= USER VOTE ================= */

  const userVote = approvals.find(
    a => Number(a.userId) === Number(currentUserId)
  )

  const alreadyVoted = Boolean(userVote)

  /* ================= APPROVAL COUNT ================= */

  const approvalCount = approvals.filter(
    a => a.decision === "approved"
  ).length

  const totalCouncil = 7
  const majority = Math.floor(totalCouncil / 2) + 1

  /* ================= COMPUTED STATUS ================= */

  let computedStatus = "Pending Approval"

  if (approvalCount >= majority) {
    computedStatus = "Approved"
  }

  if (program.status === "REJECTED") {
    computedStatus = "Rejected"
  }

  const approvalsNeeded = Math.max(0, majority - approvalCount)

  /* ================= APPROVE ================= */

  const handleApprove = async () => {

    if (alreadyVoted) {
      setAlertMessage(`You already voted: ${userVote?.decision?.toUpperCase()}`)
      setAlertOpen(true)
      return
    }

    if (loading) return

    try {

      setLoading(true)

      await onApprove(program.id)

      setApprovals(prev => [
        ...prev,
        {
          member: "You",
          userId: currentUserId,
          decision: "approved",
          date: new Date().toISOString()
        }
      ])

    } catch (error: any) {

      const message =
        error?.response?.data?.message ||
        "Failed to approve program."

      setAlertMessage(message)
      setAlertOpen(true)

    } finally {
      setLoading(false)
    }
  }

  /* ================= REJECT ================= */

  const handleReject = async () => {

    if (alreadyVoted) {
      setAlertMessage(`You already voted: ${userVote?.decision?.toUpperCase()}`)
      setAlertOpen(true)
      return
    }

    if (loading) return

    try {

      setLoading(true)

      await onReject(program.id)

      setApprovals(prev => [
        ...prev,
        {
          member: "You",
          userId: currentUserId,
          decision: "rejected",
          date: new Date().toISOString()
        }
      ])

    } catch (error: any) {

      const message =
        error?.response?.data?.message ||
        "Failed to reject program."

      setAlertMessage(message)
      setAlertOpen(true)

    } finally {
      setLoading(false)
    }
  }

  /* ================= UI ================= */

  return (

    <>

      <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm">

        <div className="w-[520px] bg-white rounded-2xl shadow-2xl overflow-hidden relative">

          {/* CLOSE BUTTON */}

          {onClose && (
            <button
              onClick={onClose}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
            >
              ✕
            </button>
          )}

          {/* HEADER */}

          <div className="bg-blue-800 text-white text-center py-5 text-xl font-semibold">
            Program Approval
          </div>

          <div className="p-6">

            <h2 className="text-xl font-semibold text-slate-800 mb-4">
              {program.name}
            </h2>

            <p className="text-sm mb-1">
              <span className="font-medium text-slate-600">Proposed By:</span>{" "}
              {program.user?.fullName || "Unknown"}
            </p>

            <p className="text-sm text-slate-600 mb-4">
              {program.description}
            </p>

            {/* STATUS */}

            <div className="flex items-center gap-2 font-medium mb-5">

              <span className={`w-2 h-2 rounded-full ${
                computedStatus === "Approved"
                  ? "bg-green-500"
                  : computedStatus === "Rejected"
                  ? "bg-red-500"
                  : "bg-orange-500"
              }`}></span>

              Status: {computedStatus}

            </div>

            {/* ================= TABLE ================= */}

            <div className="border rounded-xl overflow-hidden mb-5">

              <div className="bg-gray-100 px-4 py-2 text-sm font-semibold">
                Council Members' Decisions
              </div>

              <table className="w-full text-sm">

                <thead className="text-gray-500">
                  <tr className="border-b">
                    <th className="text-left px-4 py-2">Member</th>
                    <th className="text-left px-4 py-2">Decision</th>
                    <th className="text-left px-4 py-2">Date</th>
                  </tr>
                </thead>

                <tbody>

                  {approvals.length === 0 && (
                    <tr>
                      <td colSpan={3} className="text-center py-4 text-gray-400">
                        No votes yet
                      </td>
                    </tr>
                  )}

                  {approvals.map((vote, i) => (
                    <tr key={i} className="border-b">

                      <td className="px-4 py-2">
                        {vote.member}
                      </td>

                      <td className="px-4 py-2">

                        {vote.decision === "approved" && (
                          <span className="flex items-center gap-1 text-green-600 font-medium">
                            <CheckCircle size={16}/> Approved
                          </span>
                        )}

                        {vote.decision === "rejected" && (
                          <span className="flex items-center gap-1 text-red-600 font-medium">
                            <XCircle size={16}/> Rejected
                          </span>
                        )}

                      </td>

                      <td className="px-4 py-2">
                        {vote.date
                          ? new Date(vote.date).toLocaleDateString()
                          : "-"}
                      </td>

                    </tr>
                  ))}

                </tbody>

              </table>

            </div>

            {/* ================= BUTTONS ================= */}

            <div className="flex gap-4 justify-center mb-4">

              <button
                disabled={loading || alreadyVoted || computedStatus === "Approved"}
                onClick={handleApprove}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white px-6 py-3 rounded-xl shadow"
              >
                <Check size={18}/> Approve
              </button>

              <button
                disabled={loading || alreadyVoted || computedStatus === "Approved"}
                onClick={handleReject}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white px-6 py-3 rounded-xl shadow"
              >
                <X size={18}/> Reject
              </button>

            </div>

            {/* USER MESSAGE */}

            {alreadyVoted && (
              <p className="text-center text-sm text-gray-500 mb-4">
                You already voted:
                <span className="font-semibold ml-1">
                  {userVote?.decision === "approved" ? "Approved" : "Rejected"}
                </span>
              </p>
            )}

            <div className="text-center text-sm text-gray-500">

              <p>Awaiting Approval from Council Members...</p>

              <p className="font-semibold mt-1">
                {approvalsNeeded} Approvals Needed to Proceed
              </p>

            </div>

          </div>

        </div>

      </div>

      {/* ================= ALERT MODAL ================= */}

      <div className="z-[100]">

        <AlertModal
          open={alertOpen}
          type="warning"
          title="Vote Already Recorded"
          message={alertMessage}
          confirmText="OK"
          showCancel={false}
          onClose={() => setAlertOpen(false)}
        />

      </div>

    </>

  )
}