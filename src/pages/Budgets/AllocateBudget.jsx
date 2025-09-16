import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { getToken } from '../../utils/auth';

export default function AllocateBudget(){
  const [budgets,setBudgets] = useState([]);
  useEffect(()=>{ (async()=>{ const { data } = await api.get('/budgets',{ headers:{ Authorization:'Bearer '+getToken() } }); setBudgets(data); })(); },[]);
  const allocate = async id =>{
    await api.put('/budgets/'+id+'/allocate',{ allocated: 0 }, { headers:{ Authorization:'Bearer '+getToken() } });
    alert('Budget allocated');
  }
  return (
    <div>
      <h3>Budgets</h3>
      <ul>
        {budgets.map(b=>(<li key={b.id}>{b.line_item} — {b.amount} <button onClick={()=>allocate(b.id)}>Allocate</button></li>))}
      </ul>
    </div>
  );
}
