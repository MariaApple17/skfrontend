import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { getToken } from '../../utils/auth';

export default function MonitorBudget(){
  const [budgets,setBudgets] = useState([]);
  useEffect(()=>{ (async()=>{ const { data } = await api.get('/budgets',{ headers:{ Authorization:'Bearer '+getToken() } }); setBudgets(data); })(); },[]);
  return (
    <div>
      <h3>Budget Monitoring</h3>
      <table>
        <thead><tr><th>Line Item</th><th>Amount</th><th>Allocated</th><th>Spent</th></tr></thead>
        <tbody>
          {budgets.map(b=>(<tr key={b.id}><td>{b.line_item}</td><td>{b.amount}</td><td>{b.allocated}</td><td>{b.spent}</td></tr>))}
        </tbody>
      </table>
    </div>
  );
}
