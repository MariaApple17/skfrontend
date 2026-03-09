'use client'

import { useEffect, useState } from "react"
import { User } from "lucide-react"
import api from "@/components/lib/api"
import ProgramApprovalModal from "@/components/reusable/modal/ProgramApprovalModal"
import AlertModal from "@/components/reusable/modal/AlertModal"
import { AdminPageShimmer } from "@/components/reusable/ui/PageShimmer"

interface Approval{
  member:string
  userId:number
  decision:"approved"|"rejected"
  date:string
}

interface Program{
  id:number
  name:string
  description:string
  approvalStatus:string
  approvals?:Approval[]
  user?:{
    fullName:string
  }
}

export default function ProgramApprovalPage(){

  const [programs,setPrograms] = useState<Program[]>([])
  const [selectedProgram,setSelectedProgram] = useState<Program | null>(null)
  const [loading,setLoading] = useState(true)

  const [alertOpen,setAlertOpen] = useState(false)
  const [alertMessage,setAlertMessage] = useState("")

  /* ================= CURRENT USER ================= */

  const [currentUserId,setCurrentUserId] = useState<number>(0)

  useEffect(()=>{

    try{

      const storedUser = localStorage.getItem("user")

      if(storedUser){

        const parsed = JSON.parse(storedUser)

        setCurrentUserId(parsed?.id ?? 0)

      }

    }catch{

      setCurrentUserId(0)

    }

  },[])

  /* ================= FETCH PROGRAMS ================= */

  const fetchPrograms = async()=>{

    try{

      setLoading(true)

      const res = await api.get("/programs",{
        params:{ approvalStatus:"pending" }
      })

      setPrograms(res.data?.data ?? [])

    }catch(error){

      console.error("Failed to fetch programs",error)

    }finally{

      setLoading(false)

    }

  }

  useEffect(()=>{

    fetchPrograms()

  },[])

  /* ================= VOTE ================= */

  const voteProgram = async(id:number,decision:"approved"|"rejected")=>{

    try{

      if(decision === "approved"){

        await api.patch(`/programs/${id}/approve`)

      }else{

        await api.patch(`/programs/${id}/reject`)

      }

      setSelectedProgram(null)

      fetchPrograms()

    }catch(error:any){

      const message =
      error?.response?.data?.message ||
      "Failed to vote for this program"

      setAlertMessage(message)

      setAlertOpen(true)

    }

  }

  /* ================= CALCULATE STATUS ================= */

  const getProgramStatus = (p:Program)=>{

    const approvals = p.approvals ?? []

    const approvedVotes = approvals.filter(
      v => v.decision === "approved"
    ).length

    const rejectedVotes = approvals.filter(
      v => v.decision === "rejected"
    ).length

    const totalCouncil = 7
    const majority = Math.floor(totalCouncil / 2) + 1

    if(approvedVotes >= majority){
      return "Approved"
    }

    if(rejectedVotes >= majority){
      return "Rejected"
    }

    return "Pending Approval"

  }

  /* ================= UI ================= */

  return(

  <div className="p-10">

    <h1 className="text-2xl font-semibold mb-8">
      Program Approval
    </h1>

    {loading && (
      <AdminPageShimmer cards={6} showFilters={false}/>
    )}

    {!loading && programs.length === 0 && (

      <p className="text-gray-400 text-sm">
        No programs pending approval
      </p>

    )}

    <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-7">

      {programs.map(p=>{

        const computedStatus = getProgramStatus(p)

        return(

        <div
          key={p.id}
          onClick={()=>setSelectedProgram(p)}
          className="group cursor-pointer bg-white rounded-3xl shadow-md hover:shadow-2xl hover:-translate-y-1 transition-all overflow-hidden"
        >

          <div className="bg-blue-800 text-white px-5 py-3 font-semibold text-sm">
            Program Approval
          </div>

          <div className="p-5 space-y-2">

            {/* PROGRAM NAME */}

            <h3 className="text-lg font-semibold text-slate-800">
              {p.name}
            </h3>

            {/* PROPOSED BY */}

            <p className="text-xs text-gray-500 flex items-center gap-1">
              <User size={14}/>
              {p.user?.fullName || "Unknown"}
            </p>

            {/* DESCRIPTION */}

            <p className="text-sm text-gray-600 line-clamp-2">
              {p.description}
            </p>

            {/* STATUS */}

            <div className="flex items-center gap-2 text-sm font-medium mt-3">

              <span className={`w-2 h-2 rounded-full ${
                computedStatus === "Approved"
                ? "bg-green-500"
                : computedStatus === "Rejected"
                ? "bg-red-500"
                : "bg-orange-500"
              }`}></span>

              {computedStatus}

            </div>

          </div>

          <div className="bg-gray-50 px-5 py-3 text-xs text-gray-500">
            Click to review voting
          </div>

        </div>

        )

      })}

    </div>

    {/* ================= PROGRAM MODAL ================= */}

    {selectedProgram && (

      <ProgramApprovalModal

        program={{

          id:selectedProgram.id,
          name:selectedProgram.name,
          description:selectedProgram.description,
          status:selectedProgram.approvalStatus,
          approvals:selectedProgram.approvals ?? [],
          user:selectedProgram.user ?? { fullName:"Unknown" }

        }}

        currentUserId={currentUserId}

        onApprove={(id)=>voteProgram(id,"approved")}
        onReject={(id)=>voteProgram(id,"rejected")}

        onClose={()=>setSelectedProgram(null)}

      />

    )}

    {/* ================= ALERT MODAL ================= */}

    <AlertModal
      open={alertOpen}
      type="warning"
      title="Voting Error"
      message={alertMessage}
      confirmText="OK"
      showCancel={false}
      onClose={()=>setAlertOpen(false)}
    />

  </div>

  )

}