import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { getToken } from '../../utils/auth';

export default function RecordBudget(){
  const [projects,setProjects] = useState([]);
  const [form,setForm] = useState({ project_id:'', line_item:'', amount:'' });
  useEffect(()=>{ (async()=>{ const { data } = await api.get('/projects',{ headers:{ Authorization:'Bearer '+getToken() } }); setProjects(data); })(); },[]);
  const submit = async e =>{
    e.preventDefault();
    await api.post('/budgets', form, { headers:{ Authorization:'Bearer '+getToken() } });
    alert('Budget recorded');
  }
  return (
    <form onSubmit={submit}>
      <select value={form.project_id} onChange={e=>setForm({...form,project_id:e.target.value})}>
        <option value="">Select Project</option>
        {projects.map(p=>(<option key={p.id} value={p.id}>{p.title}</option>))}
      </select>
      <input placeholder="Line Item" value={form.line_item} onChange={e=>setForm({...form,line_item:e.target.value})} />
      <input placeholder="Amount" type="number" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} />
      <button>Save</button>
    </form>
  );
}
