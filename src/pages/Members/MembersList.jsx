import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { getToken } from '../../utils/auth';

export default function MembersList(){
  const [rows,setRows] = useState([]);
  useEffect(()=>{ (async ()=>{ const { data } = await api.get('/members/list', { headers: { Authorization: 'Bearer '+getToken() } }); setRows(data); })(); },[]);

  return (
    <div>
      <h3>Members</h3>
      <table>
        <thead><tr><th>ID</th><th>Username</th><th>Name</th><th>Role</th><th>Contact</th><th>Position</th></tr></thead>
        <tbody>
          {rows.map(r=>(<tr key={r.id}><td>{r.id}</td><td>{r.username}</td><td>{r.full_name}</td><td>{r.role}</td><td>{r.contact}</td><td>{r.position}</td></tr>))}
        </tbody>
      </table>
    </div>
  );
}
