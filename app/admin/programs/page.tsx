'use client';

import { useEffect, useRef, useState } from 'react';

import {
  Calendar,
  Clock,
  Image as ImageIcon,
  Layers,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Upload
} from 'lucide-react';

import { useRouter, useSearchParams } from 'next/navigation';

import api from '@/components/lib/api';
import AuthGuard from '@/components/reusable/guard/AuthGuard';
import ProgramUpsertModal from '@/components/reusable/modal/ProgramUpsertModal';
import FlatInput from '@/components/reusable/ui/FlatInput';

/* ================= TYPES ================= */

interface ProgramDocument{
id:number
imageUrl:string
title:string
uploadedBy:string
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
isActive:boolean
approvalStatus:string
documents:ProgramDocument[]
}

/* ================= STATUS ================= */

type ProgramStatus =
| "pending"
| "rejected"
| "upcoming"
| "ongoing"
| "completed"
| "no-dates"

const getProgramStatus = (
approvalStatus?:string,
startDate?:string,
endDate?:string
):ProgramStatus => {

const status = approvalStatus?.toLowerCase()

if(status==="draft" || status==="submitted")
return "pending"

if(status==="rejected")
return "rejected"

const now = new Date()
const start = startDate ? new Date(startDate) : null
const end = endDate ? new Date(endDate) : null

if(start && now < start)
return "upcoming"

if(start && end && now>=start && now<=end)
return "ongoing"

if(end && now > end)
return "completed"

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

/* ================= CAROUSEL ================= */

function ImageCarousel({documents,programName}:any){

const [index,setIndex]=useState(0)

useEffect(()=>{

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

{documents.map((doc:any)=>(
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

const [uploadingId,setUploadingId]=useState<number|null>(null)
const [togglingId,setTogglingId]=useState<number|null>(null)

const fileInputRefs = useRef<{[key:number]:HTMLInputElement|null}>({})

/* ================= FETCH ================= */

const fetchPrograms = async()=>{

setLoading(true)

try{

const res = await api.get('/programs',{params:{q}})
setPrograms(res.data?.data ?? [])

}finally{
setLoading(false)
}

}

useEffect(()=>{
fetchPrograms()
},[q])

/* ================= TOGGLE ACTIVE ================= */

const toggleStatus = async(id:number)=>{

if(togglingId) return

setTogglingId(id)

setPrograms(prev =>
prev.map(p =>
p.id===id ? {...p,isActive:!p.isActive} : p
)
)

try{

await api.patch(`/programs/toggle-status/${id}`)

}catch{

setPrograms(prev =>
prev.map(p =>
p.id===id ? {...p,isActive:!p.isActive} : p
)
)

}finally{
setTogglingId(null)
}

}

/* ================= UPLOAD ================= */

const handleUploadDocuments = async(programId:number,files:FileList|null)=>{

if(!files || files.length===0) return

setUploadingId(programId)

try{

const formData = new FormData()

Array.from(files).forEach(file=>{
formData.append("documents",file)
})

await api.post(`/programs/${programId}/documents`,formData)

fetchPrograms()

}finally{

setUploadingId(null)

if(fileInputRefs.current[programId])
fileInputRefs.current[programId]!.value=""

}

}

return(

<>

{/* HEADER */}

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

{/* SEARCH */}

<div className="bg-white rounded-3xl p-5 mb-8">

<FlatInput
label="Search"
icon={Search}
value={q}
onChange={(e)=>router.push(`?q=${e.target.value}`)}
/>

</div>

{/* GRID */}

{loading ? (

<p>Loading programs...</p>

) : (

<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-7">

{programs.map(p=>{

const programStatus = getProgramStatus(
p.approvalStatus,
p.startDate,
p.endDate
)

return(

<div key={p.id} className="bg-white rounded-3xl shadow-lg overflow-hidden">

<ImageCarousel
documents={p.documents}
programName={p.name}
/>

<div className="p-5 space-y-3">

<div className="flex justify-between">

<div>
<h3 className="font-semibold">{p.name}</h3>
<p className="text-xs text-slate-500">{p.code}</p>
</div>

<span className={`text-xs px-3 py-1 rounded-full ${p.isActive?'bg-green-100 text-green-700':'bg-gray-200 text-gray-600'}`}>
{p.isActive?"ACTIVE":"INACTIVE"}
</span>

</div>

<StatusBadge status={programStatus}/>

{p.description && (
<p className="text-sm text-slate-600">{p.description}</p>
)}

</div>

<div className="flex items-center justify-between px-5 py-4 bg-slate-50">

{/* ACTIVE TOGGLE */}

<button
disabled={togglingId===p.id}
onClick={()=>toggleStatus(p.id)}
className={`relative h-6 w-11 rounded-full ${p.isActive?'bg-blue-600':'bg-slate-300'} ${togglingId===p.id?'opacity-60':''}`}
>
<span
className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${p.isActive?'translate-x-5':''}`}
/>
</button>

<div className="flex items-center gap-2">

{/* UPLOAD ONLY WHEN COMPLETED */}

{programStatus==="completed" && (

<>

<button
disabled={uploadingId===p.id}
onClick={()=>fileInputRefs.current[p.id]?.click()}
className="p-2 rounded-lg text-indigo-600 hover:bg-indigo-600/10"
>
<Upload size={16}/>
</button>

<input
ref={(el)=>{fileInputRefs.current[p.id]=el}}
type="file"
accept="image/*"
multiple
className="hidden"
onChange={(e)=>handleUploadDocuments(p.id,e.target.files)}
/>

</>

)}

<button
onClick={()=>{setEditId(p.id);setModalOpen(true)}}
className="p-2 text-blue-900"
>
<Pencil size={16}/>
</button>

</div>

</div>

</div>

)

})}

</div>

)}

<ProgramUpsertModal
open={modalOpen}
programId={editId}
onClose={()=>setModalOpen(false)}
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