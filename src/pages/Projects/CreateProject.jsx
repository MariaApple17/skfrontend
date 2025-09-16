import React, { useState } from 'react';
import api from '../../api/axios';
import { getToken } from '../../utils/auth';

export default function CreateProject(){
  const [form,setForm] = useState({ title:'', category:'', description:'', start_date:'', end_date:'' });
  const submit = async e =>{
    e.preventDefault();
    await api.post('/projects', form, { headers:{ Authorization:'Bearer '+getToken() } });
    alert('Project created');
  }
  return (
    <form onSubmit={submit}>
      <input placeholder="Title" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} />
      <input placeholder="Category" value={form.category} onChange={e=>setForm({...form,category:e.target.value})} />
      <textarea placeholder="Description" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} />
      <input type="date" value={form.start_date} onChange={e=>setForm({...form,start_date:e.target.value})} />
      <input type="date" value={form.end_date} onChange={e=>setForm({...form,end_date:e.target.value})} />
      <button>Create</button>
    </form>
  );
}
