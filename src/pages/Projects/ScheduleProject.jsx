import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { getToken } from '../../utils/auth';

export default function ScheduleProject(){
  const [projects,setProjects] = useState([]);
  const [form,setForm] = useState({ project_id:'', title:'', start_date:'', end_date:'' });
  useEffect(()=>{ (async()=>{ const { data } = await api.get('/projects',{ headers:{ Authorization:'Bearer '+getToken() } }); setProjects(data); })(); },[]);
  const submit = async e =>{
    e.preventDefault();
    await api.post('/schedules', form, { headers:{ Authorization:'Bearer '+getToken() } });
    alert('Schedule added');
  }
  return (
    <form onSubmit={submit}>
      <select value={form.project_id} onChange={e=>setForm({...form,project_id:e.target.value})}>
        <option value="">Select Project</option>
        {projects.map(p=>(<option key={p.id} value={p.id}>{p.title}</option>))}
      </select>
      <input placeholder="Schedule Title" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} />
      <input type="date" value={form.start_date} onChange={e=>setForm({...form,start_date:e.target.value})} />
      <input type="date" value={form.end_date} onChange={e=>setForm({...form,end_date:e.target.value})} />
      <button>Save</button>
    </form>
  );
}
