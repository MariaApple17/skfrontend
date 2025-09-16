import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { getToken } from '../../utils/auth';

export default function TrackProject(){
  const [projects,setProjects] = useState([]);
  useEffect(()=>{ (async()=>{ const { data } = await api.get('/projects',{ headers:{ Authorization:'Bearer '+getToken() } }); setProjects(data); })(); },[]);

  return (
    <div>
      <h3>Projects</h3>
      <ul>
        {projects.map(p=>(<li key={p.id}>{p.title} — {p.status} ({p.start_date} to {p.end_date})</li>))}
      </ul>
    </div>
  );
}
