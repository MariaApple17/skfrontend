import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { getToken } from '../../utils/auth';

export default function Minutes(){
  const [minutes,setMinutes] = useState([]);
  const [form,setForm] = useState({ title:'', date:'', attendees:'', content:'' });
  useEffect(()=>{ (async()=>{ const { data } = await api.get('/minutes',{ headers:{ Authorization:'Bearer '+getToken() } }); setMinutes(data); })(); },[]);
  const submit = async e =>{
    e.preventDefault();
    await api.post('/minutes', form,{ headers:{ Authorization:'Bearer '+getToken() } });
    alert('Minutes saved');
  }
  return (
    <div>
      <form onSubmit={submit}>
        <input placeholder="Title" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} />
        <input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} />
        <input placeholder="Attendees" value={form.attendees} onChange={e=>setForm({...form,attendees:e.target.value})} />
        <textarea placeholder="Content" value={form.content} onChange={e=>setForm({...form,content:e.target.value})} />
        <button>Save</button>
      </form>
      <h3>Past Meetings</h3>
      <ul>{minutes.map(m=>(<li key={m.id}>{m.title} — {m.date}</li>))}</ul>
    </div>
  );
}
