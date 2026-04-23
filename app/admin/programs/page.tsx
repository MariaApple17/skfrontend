'use client';

import { useEffect, useState } from 'react';
import {
  Calendar,
  Clock,
  Image as ImageIcon,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Upload
} from 'lucide-react';

import { useRouter, useSearchParams } from 'next/navigation';

import api from '@/components/lib/api';
import AuthGuard from '@/components/reusable/guard/AuthGuard';
import ProgramDetailModal from '@/components/reusable/modal/ProgramDetailModal';
import ProgramUpsertModal from '@/components/reusable/modal/ProgramUpsertModal';
import { AdminPageShimmer } from '@/components/reusable/ui/PageShimmer';
import FlatInput from '@/components/reusable/ui/FlatInput';

/* ================= TYPES ================= */

interface ProgramDocument{
  id:number
  imageUrl:string
  title?:string
  uploadedBy?:string
  createdAt:string
}

interface Program{
  id:number
  code:string
  name:string
  description?:string | null
  committeeInCharge:string
  beneficiaries:string
  startDate?:string
  endDate?:string
  approvalStatus:string
  documents?:ProgramDocument[]
}

interface ProgramDetail extends Program {
  category?: string | null
  fiscalYear?: { id:number; year:number } | null
  allocatedBudget?: string | null
  usedBudget?: string | null
  remainingBudget?: string | null
  createdBy?: { id:number; name:string } | null
  createdAt?: string
  updatedAt?: string | null
}

/* ================= STATUS ================= */

type ProgramStatus =
| "pending"
| "rejected"
| "upcoming"
| "ongoing"
| "completed"
| "incomplete"
| "no-dates"
const getProgramStatus = (
  approvalStatus?: string,
  startDate?: string,
  endDate?: string,
  documents?: ProgramDocument[]
): ProgramStatus => {

  const status = approvalStatus?.toLowerCase()

  if (status === "draft" || status === "submitted") return "pending"
  if (status === "rejected") return "rejected"

  const today = new Date()
  today.setHours(0,0,0,0)

  const start = startDate ? new Date(startDate) : null
  const end = endDate ? new Date(endDate) : null

  if (start) start.setHours(0,0,0,0)
  if (end) end.setHours(0,0,0,0)

  /* UPCOMING */
  if (start && today < start) {
    return "upcoming"
  }

  /* ONGOING */
  if (start && end && today >= start && today <= end) {
    return "ongoing"
  }

  /* FINISHED PROGRAM */
  if (end && today > end) {

    const hasProof = documents && documents.length > 0

    return hasProof ? "completed" : "incomplete"
  }

  return "no-dates"
}
/* ================= STATUS BADGE ================= */

const STATUS_CONFIG={

pending:{
label:"Pending Approval",
icon:Clock,
bg:"bg-orange-50",
text:"text-orange-700",
border:"border-orange-200",
iconBg:"bg-orange-100"
},

rejected:{
label:"Rejected",
icon:Trash2,
bg:"bg-red-50",
text:"text-red-700",
border:"border-red-200",
iconBg:"bg-red-100"
},

upcoming:{
label:"Upcoming",
icon:Sparkles,
bg:"bg-purple-50",
text:"text-purple-700",
border:"border-purple-200",
iconBg:"bg-purple-100"
},

ongoing:{
label:"Ongoing",
icon:Clock,
bg:"bg-green-50",
text:"text-green-700",
border:"border-green-200",
iconBg:"bg-green-100"
},

completed:{
label:"Completed",
icon:Calendar,
bg:"bg-gray-50",
text:"text-gray-600",
border:"border-gray-200",
iconBg:"bg-gray-100"
},

incomplete:{
label:"Incomplete",
icon:Upload,
bg:"bg-red-50",
text:"text-red-700",
border:"border-red-200",
iconBg:"bg-red-100"
},

"no-dates":{
label:"No Schedule",
icon:Calendar,
bg:"bg-amber-50",
text:"text-amber-700",
border:"border-amber-200",
iconBg:"bg-amber-100"
}

} as const

function StatusBadge({status}:{status:ProgramStatus}){

const config = STATUS_CONFIG[status]
const Icon = config.icon

return(

<div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl border ${config.bg} ${config.text} ${config.border}`}>

<div className={`${config.iconBg} rounded-md p-0.5`}>
<Icon size={11}/>
</div>

<span className="text-[11px] font-semibold">
{config.label.toUpperCase()}
</span>

</div>

)

}

/* ================= IMAGE CAROUSEL ================= */

function ImageCarousel({documents = [], programName}:{documents:ProgramDocument[],programName:string}){

const [index,setIndex]=useState(0)

useEffect(()=>{

setIndex(0)

if(documents.length<=1) return

const interval=setInterval(()=>{
setIndex(prev => (prev+1)%documents.length)
},5000)

return()=>clearInterval(interval)

},[documents.length])

if(documents.length===0){

return(
<div className="h-40 bg-slate-100 flex items-center justify-center">
<ImageIcon className="text-slate-400"/>
</div>
)

}

return(

<div className="relative h-40 overflow-hidden">

<div
className="flex transition-transform duration-500 h-full"
style={{transform:`translateX(-${index*100}%)`}}
>

{documents.map(doc=>(
<img
key={doc.id}
src={doc.imageUrl}
className="w-full h-full object-cover flex-shrink-0"
alt={programName}
/>
))}

</div>

</div>

)

}

/* ================= PAGE ================= */

function ProgramsContent(){

const router = useRouter()
const params = useSearchParams()

const q = params.get('q') ?? ''

const [programs,setPrograms]=useState<Program[]>([])
const [loading,setLoading]=useState(true)

const [modalOpen,setModalOpen]=useState(false)
const [editId,setEditId]=useState<number|null>(null)
const [detailOpen,setDetailOpen]=useState(false)
const [detailLoading,setDetailLoading]=useState(false)
const [selectedProgram,setSelectedProgram]=useState<ProgramDetail | null>(null)

const fetchProgramDetail = async (programId:number) => {
  setDetailLoading(true)
  try {
    const res = await api.get(`/programs/${programId}`)
    setSelectedProgram(res.data.data)
  } catch (err) {
    console.error('Failed to fetch program detail', err)
    setSelectedProgram(null)
  } finally {
    setDetailLoading(false)
  }
}

const openProgramDetail = async (programId:number) => {
  setDetailOpen(true)
  await fetchProgramDetail(programId)
}

/* ================= FETCH PROGRAMS ================= */

const fetchPrograms = async()=>{

setLoading(true)

try{

const res = await api.get('/programs',{params:{q}})

const safePrograms = (res?.data?.data ?? []).map((p:any)=>({
...p,
documents:Array.isArray(p.documents) ? p.documents : []
}))

setPrograms(safePrograms)

}catch(err){

console.error("Failed to fetch programs",err)
setPrograms([])

}finally{

setLoading(false)

}

}

useEffect(()=>{
fetchPrograms()
},[q])

/* ================= UPLOAD PROOF ================= */

const uploadProof = async (programId:number,file:File)=>{

const formData = new FormData()
formData.append("file",file)

await api.post(`/programs/${programId}/upload-proof`,formData,{
headers:{
'Content-Type':'multipart/form-data'
}
})

fetchPrograms()

}

/* ================= UI ================= */

return(

<>

<div className="flex justify-between mb-8">

<div>
<h1 className="text-2xl font-semibold">Programs</h1>
<p className="text-sm text-slate-500">
Manage programs and beneficiaries
</p>
</div>

<button
onClick={()=>{setEditId(null);setModalOpen(true)}}
className="flex items-center gap-2 px-4 py-2 bg-blue-900 text-white rounded-xl"
>
<Plus size={16}/>
Create Program
</button>

</div>

<div className="bg-white rounded-3xl p-5 mb-8">

<FlatInput
label="Search"
icon={Search}
value={q}
onChange={(e)=>{
const value = e.target.value
router.push(`?q=${value}`)
}}
/>

</div>

{loading ? (

<AdminPageShimmer cards={6} showFilters={false} />

) : (

<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-7">

{programs.map(p=>{

const programStatus = getProgramStatus(
p.approvalStatus,
p.startDate,
p.endDate,
p.documents
)

return(

<div
  key={p.id}
  role="button"
  tabIndex={0}
  onClick={() => openProgramDetail(p.id)}
  onKeyDown={(event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      openProgramDetail(p.id)
    }
  }}
  className="bg-white rounded-3xl shadow-lg overflow-hidden cursor-pointer focus:outline-none focus:ring-2 focus:ring-slate-300"
>

<ImageCarousel
documents={p.documents ?? []}
programName={p.name}
/>

<div className="p-5 space-y-3">

<div>
<h3 className="font-semibold">{p.name}</h3>
<p className="text-xs text-slate-500">{p.code}</p>
</div>

<StatusBadge status={programStatus}/>

{p.description && (
<p className="text-sm text-slate-600">{p.description}</p>
)}

{/* Upload button when incomplete */}

{programStatus === "incomplete" && (

<label className="flex items-center gap-2 mt-3 text-xs bg-red-600 text-white px-3 py-2 rounded-lg cursor-pointer">

<Upload size={14}/>
Upload Proof

<input
type="file"
hidden
onChange={(e)=>{

const file = e.target.files?.[0]

if(file){
uploadProof(p.id,file)
}

}}
/>

</label>

)}

<div className="mt-4 rounded-3xl bg-slate-50 p-3 text-xs text-slate-500">
  Click card for full program details
</div>

</div>
</div>

)
})}

</div>

)}

<ProgramDetailModal
  open={detailOpen}
  loading={detailLoading}
  program={selectedProgram}
  onClose={() => {
    setDetailOpen(false)
    setSelectedProgram(null)
  }}
/>

<ProgramUpsertModal
  open={modalOpen}
  programId={editId}
  onClose={() => setModalOpen(false)}
  onSuccess={fetchPrograms}
/>

</>

)

}

export default function ProgramsPage(){

return(

<AuthGuard>
<ProgramsContent/>
</AuthGuard>

)

}