import React, { useState } from 'react';
import api from '../../api/axios';
import { getToken } from '../../utils/auth';

export default function RegisterMember(){
  const [form, setForm] = useState({ username:'', password:'', full_name:'', role_id:4, contact:'', position:'', address:'' });
  const submit = async (e) =>{
    e.preventDefault();
    await api.post('/members/register', form, { headers: { Authorization: 'Bearer '+getToken() } });
    alert('Member registered');
  }
  return (
    <form onSubmit={submit}>
      <input placeholder="username" value={form.username} onChange={e=>setForm({...form,username:e.target.value})} />
      <input placeholder="password" type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} />
      <input placeholder="Full name" value={form.full_name} onChange={e=>setForm({...form,full_name:e.target.value})} />
      <input placeholder="Contact" value={form.contact} onChange={e=>setForm({...form,contact:e.target.value})} />
      <input placeholder="Position" value={form.position} onChange={e=>setForm({...form,position:e.target.value})} />
      <textarea placeholder="Address" value={form.address} onChange={e=>setForm({...form,address:e.target.value})} />
      <button>Register</button>
    </form>
  );
}
