import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';
import api from '../../api/axios';
import { getToken } from '../../utils/auth';

export default function BudgetByProjectChart(){
  const [data, setData] = useState([]);
  useEffect(()=>{ (async()=>{
    const { data } = await api.get('/reports/analytics/budget-by-project', { headers: { Authorization: 'Bearer '+getToken() } });
    setData(data);
  })(); },[]);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid />
        <XAxis dataKey="project"/>
        <YAxis />
        <Tooltip />
        <Bar dataKey="total_budget" />
      </BarChart>
    </ResponsiveContainer>
  );
}
