import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { getToken } from '../../utils/auth';

export default function TaskList(){
  const [tasks, setTasks] = useState([]);
  useEffect(()=>{ (async()=>{ const { data } = await api.get('/tasks?project_id=', { headers:{ Authorization: 'Bearer '+getToken() } }); setTasks(data); })(); },[]);
  return (
    <div>
      <h4>Tasks</h4>
      <ul>{tasks.map(t=>(<li key={t.id}>{t.title} — {t.assigned_name || t.assigned_to} — {t.status}</li>))}</ul>
    </div>
  );
}
