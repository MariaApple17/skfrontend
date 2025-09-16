import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { getToken } from '../../utils/auth';

export default function ProjectProgressReport(){
  const [projects,setProjects] = useState([]);
  const [selected,setSelected] = useState('');
  const [report,setReport] = useState([]);
  useEffect(()=>{ (async()=>{ const { data } = await api.get('/projects',{ headers:{ Authorization:'Bearer '+getToken() } }); setProjects(data); })(); },[]);
  const submit = async e =>{
    e.preventDefault();
    const { data } = await api.get('/reports/progress?project_id='+selected,{ headers:{ Authorization:'Bearer '+getToken() } });
    setReport(data);
  }
  return (
    <div>
      <form onSubmit={submit}>
        <select value={selected} onChange={e=>setSelected(e.target.value)}>
          <option value="">Select Project</option>
          {projects.map(p=>(<option key={p.id} value={p.id}>{p.title}</option>))}
        </select>
        <button>Generate</button>
      </form>
      <pre>{JSON.stringify(report,null,2)}</pre>
    </div>
  );
}
