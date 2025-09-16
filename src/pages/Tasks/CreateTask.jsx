import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { getToken } from '../../utils/auth';

export default function CreateTask(){
  const [projects, setProjects] = useState([]);
  const [form, setForm] = useState({ project_id:'', title:'', description:'', assigned_to:'', due_date:'' });
  useEffect(()=>{ (async()=>{ const { data } = await api.get('/projects', { headers:{ Authorization: 'Bearer '+getToken() } }); setProjects(data); })(); },[]);
  const submit = async (e)=>{ e.preventDefault(); await api.post('/tasks', form, { headers: { Authorization: 'Bearer '+getToken() } }); alert('Task created'); }
  return (
    <form onSubmit={submit}>
      <select value={form.project_id} onChange={e=>setForm({...form,project_id:e.target.value})}><option value="">Select project</option>{projects.map(p=>(<option key={p.id} value={p.id}>{p.title}</option>))}</select>
      <input placeholder="Title" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} />
      <textarea placeholder="Description" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} />
      <input placeholder="Assigned to (user id)" value={form.assigned_to} onChange={e=>setForm({...form,assigned_to:e.target.value})} />
      <input type="date" value={form.due_date} onChange={e=>setForm({...form,due_date:e.target.value})} />
      <button>Create Task</button>
    </form>
  );
}
