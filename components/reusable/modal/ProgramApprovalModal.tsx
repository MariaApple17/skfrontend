'use client'

import { CheckCircle, XCircle } from 'lucide-react'

interface Decision {
  id:number
  member:string
  decision:'approved'|'rejected'|'pending'
  date?:string
}

interface Props{
  open:boolean
  program:any
  decisions:Decision[]
  onApprove:()=>void
  onReject:()=>void
  onClose:()=>void
}

export default function ProgramApprovalModal({
 open,
 program,
 decisions,
 onApprove,
 onReject,
 onClose
}:Props){

if(!open) return null

return(

<div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">

<div className="bg-white w-[520px] rounded-2xl shadow-xl overflow-hidden">

{/* HEADER */}
<div className="bg-blue-700 text-white text-center py-4 text-lg font-semibold">
Program Approval
</div>

{/* PROGRAM INFO */}
<div className="p-6 border-b">

<h2 className="font-semibold text-slate-900">
{program.name}
</h2>

<p className="text-sm text-slate-500">
Proposed By: {program.proposedBy}
</p>

<p className="text-sm text-slate-500">
Budget: ₱{program.budget}
</p>

<p className="text-sm text-slate-500 mt-2">
{program.description}
</p>

</div>

{/* DECISIONS */}
<div className="p-6">

<h3 className="font-semibold mb-3 text-slate-700">
Council Members Decisions
</h3>

<table className="w-full text-sm">

<thead>
<tr className="border-b text-slate-500">
<th className="text-left py-2">Member</th>
<th>Decision</th>
<th>Date</th>
</tr>
</thead>

<tbody>

{decisions.map(d=>(
<tr key={d.id} className="border-b">

<td className="py-2">{d.member}</td>

<td>

{d.decision==="approved" && (
<span className="flex items-center gap-1 text-green-600">
<CheckCircle size={16}/> Approved
</span>
)}

{d.decision==="rejected" && (
<span className="flex items-center gap-1 text-red-600">
<XCircle size={16}/> Rejected
</span>
)}

{d.decision==="pending" && (
<span className="text-slate-400">
Pending
</span>
)}

</td>

<td>{d.date ?? '-'}</td>

</tr>
))}

</tbody>

</table>

</div>

{/* BUTTONS */}
<div className="flex justify-center gap-4 p-6 border-t">

<button
onClick={onApprove}
className="flex items-center gap-2 bg-green-600 text-white px-6 py-2 rounded-lg"
>
<CheckCircle size={18}/>
Approve
</button>

<button
onClick={onReject}
className="flex items-center gap-2 bg-red-600 text-white px-6 py-2 rounded-lg"
>
<XCircle size={18}/>
Reject
</button>

</div>

</div>


</div>


)
}