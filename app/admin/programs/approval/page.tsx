'use client'

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Search } from "lucide-react"

import api from "@/components/lib/api"
import AuthGuard from "@/components/reusable/guard/AuthGuard"
import FlatInput from "@/components/reusable/ui/FlatInput"

/* ================= TYPES ================= */

interface ProgramDocument {
  id:number
  imageUrl:string
  title:string
}

interface ProgramApproval {
  member:string
  decision:"approved"|"rejected"
  date:string
}

interface ApprovalStats {
  approved:number
  rejected:number
  pending:number
  majority:number
}

interface Program {
  id:number
  code:string
  name:string
  description?:string
  committeeInCharge:string
  beneficiaries:string
  startDate?:string
  endDate?:string
  isActive:boolean
  approvalStatus?:string
  documents:ProgramDocument[]
  approvals?:ProgramApproval[]
  approvalStats?:ApprovalStats
}

/* ================= PAGE ================= */

function ProgramsContent(){

  const router = useRouter()
  const params = useSearchParams()

  const q = params.get("q") ?? ""

  const [programs,setPrograms] = useState<Program[]>([])
  const [loading,setLoading] = useState(true)
  const [actionLoading,setActionLoading] = useState<number|null>(null)

  /* ================= FETCH ================= */

  const fetchPrograms = async () => {

    try{

      const res = await api.get("/programs",{ params:{ q } })

      setPrograms(res.data?.data || [])

    }catch(err){

      console.error("Fetch programs error:",err)
      setPrograms([])

    }finally{

      setLoading(false)

    }

  }

  useEffect(()=>{
    fetchPrograms()
  },[q])

  /* ================= APPROVE ================= */

  const approveProgram = async(id:number)=>{

    try{

      setActionLoading(id)

      await api.patch(`/programs/${id}/approve`)

      fetchPrograms()

    }catch(err){

      console.error("Approve error:",err)

    }finally{

      setActionLoading(null)

    }

  }

  /* ================= REJECT ================= */

  const rejectProgram = async(id:number)=>{

    try{

      setActionLoading(id)

      await api.patch(`/programs/${id}/reject`)

      fetchPrograms()

    }catch(err){

      console.error("Reject error:",err)

    }finally{

      setActionLoading(null)

    }

  }

  /* ================= STATUS HELPER ================= */

  const getStatus = (status?:string) => {

    if(!status) return "pending"

    const s = status.toLowerCase()

    if(s === "approved") return "approved"
    if(s === "upcoming") return "approved"
    if(s === "rejected") return "rejected"

    return "pending"
  }

  /* ================= UI ================= */

  return(

    <div className="min-h-screen bg-blue-50 p-10">

      {/* HEADER */}

      <div className="text-center mb-10">

        <h1 className="text-3xl font-bold text-blue-800">
          Program Approval
        </h1>

        <p className="text-gray-500 text-sm">
          Review and approve SK programs
        </p>

      </div>

      {/* SEARCH */}

      <div className="bg-white p-5 rounded-xl shadow mb-10 max-w-xl mx-auto">

        <FlatInput
          label="Search Program"
          icon={Search}
          value={q}
          onChange={(e)=>router.push(`?q=${e.target.value}`)}
        />

      </div>

      {/* PROGRAM GRID */}

      {loading ? (

        <p className="text-center text-gray-500">
          Loading programs...
        </p>

      ) : (

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">

          {programs.map(p=>{

            const status = getStatus(p.approvalStatus)

            const approved = p.approvalStats?.approved ?? 0
            const rejected = p.approvalStats?.rejected ?? 0
            const pending = p.approvalStats?.pending ?? 0
            const officials = p.approvalStats?.majority ?? 1

            const progress = Math.min(100,(approved / officials) * 100)

            return(

              <div
                key={p.id}
                className="bg-white rounded-2xl shadow-lg overflow-hidden"
              >

                {/* IMAGE */}

                <div className="h-40 bg-gray-100 flex items-center justify-center">

                  {p.documents?.length ? (

                    <img
                      src={p.documents[0]?.imageUrl}
                      className="w-full h-full object-cover"
                    />

                  ) : (

                    <span className="text-gray-400 text-sm">
                      No Image
                    </span>

                  )}

                </div>

                {/* CONTENT */}

                <div className="p-5 space-y-3">

                  {/* TITLE */}

                  <div className="flex justify-between">

                    <h2 className="font-semibold text-lg">
                      {p.name}
                    </h2>

                    <span className="text-xs text-gray-400">
                      {p.code}
                    </span>

                  </div>

                  {/* DESCRIPTION */}

                  <p className="text-sm text-gray-500">
                    {p.description}
                  </p>

                  {/* INFO */}

                  <div className="text-xs text-gray-500 space-y-1">

                    <p>Proposed By: {p.committeeInCharge}</p>
                    <p>Beneficiaries: {p.beneficiaries}</p>

                  </div>

                  {/* DATES */}

                  <div className="flex justify-between text-xs text-gray-500">

                    <span>
                      {p.startDate
                        ? new Date(p.startDate).toLocaleDateString()
                        : "—"}
                    </span>

                    <span>
                      {p.endDate
                        ? new Date(p.endDate).toLocaleDateString()
                        : "—"}
                    </span>

                  </div>

                  {/* STATUS */}

                  <div className="text-center mt-2">

                    <span
                      className={`text-xs font-semibold ${
                        status === "pending"
                          ? "text-orange-600"
                          : status === "approved"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {status.toUpperCase()}
                    </span>

                  </div>

                  {/* APPROVAL PROGRESS BAR */}

                  <div className="mt-4">

                    <div className="text-sm font-semibold mb-1">
                      Program Approval Progress
                    </div>

                    <div className="text-xs text-gray-600 mb-2">

                      Approved: {approved} |
                      Rejected: {rejected} |
                      Pending: {pending}

                    </div>

                    <div className="w-full bg-gray-200 rounded-full h-3">

                      <div
                        className="bg-green-600 h-3 rounded-full transition-all"
                        style={{
                          width:`${progress}%`
                        }}
                      />

                    </div>

                    <div className="text-xs text-gray-500 mt-1">

                      {approved} / {officials} approvals

                    </div>

                  </div>

                  {/* COUNCIL DECISIONS TABLE */}

                  <div className="border rounded-lg overflow-hidden mt-4">

                    <div className="bg-gray-100 px-4 py-2 font-semibold text-sm">
                      Council Members Decisions
                    </div>

                    <table className="w-full text-sm">

                      <thead className="bg-gray-50">

                        <tr>
                          <th className="p-2 text-left">Member</th>
                          <th className="p-2 text-left">Decision</th>
                          <th className="p-2 text-left">Date</th>
                        </tr>

                      </thead>

                      <tbody>

                        {p.approvals?.length ? (

                          p.approvals.map((a,i)=>(

                            <tr key={i} className="border-t">

                              <td className="p-2">{a.member}</td>

                              <td
                                className={`p-2 font-medium ${
                                  a.decision === "approved"
                                    ? "text-green-600"
                                    : "text-red-600"
                                }`}
                              >
                                {a.decision === "approved"
                                  ? "✔ Approved"
                                  : "✖ Rejected"}
                              </td>

                              <td className="p-2 text-gray-500">
                                {new Date(a.date).toLocaleDateString()}
                              </td>

                            </tr>

                          ))

                        ) : (

                          <tr>

                            <td
                              colSpan={3}
                              className="p-3 text-center text-gray-400"
                            >
                              No votes yet
                            </td>

                          </tr>

                        )}

                      </tbody>

                    </table>

                  </div>

                </div>

                {/* APPROVAL BUTTONS */}

                <div className="flex justify-center gap-4 p-4 border-t">

                  {status === "pending" && (

                    <>

                      <button
                        disabled={actionLoading === p.id}
                        onClick={()=>approveProgram(p.id)}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50"
                      >
                        ✔ Approve
                      </button>

                      <button
                        disabled={actionLoading === p.id}
                        onClick={()=>rejectProgram(p.id)}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50"
                      >
                        ✖ Reject
                      </button>

                    </>

                  )}

                  {status === "approved" && (

                    <span className="text-green-600 font-semibold text-sm">
                      ✔ Program Approved
                    </span>

                  )}

                  {status === "rejected" && (

                    <span className="text-red-600 font-semibold text-sm">
                      ✖ Program Rejected
                    </span>

                  )}

                </div>

              </div>

            )

          })}

        </div>

      )}

    </div>

  )

}

/* ================= WRAPPER ================= */

export default function ProgramsPage(){

  return(

    <AuthGuard>
      <ProgramsContent/>
    </AuthGuard>

  )

}