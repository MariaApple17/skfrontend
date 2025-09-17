import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CreateProject from './pages/Projects/CreateProject';
import ScheduleProject from './pages/Projects/ScheduleProject';
import TrackProject from './pages/Projects/TrackProject';
import RecordBudget from './pages/Budgets/RecordBudget';
import AllocateBudget from './pages/Budgets/AllocateBudget';
import MonitorBudget from './pages/Budgets/MonitorBudget';
import ProjectProgressReport from './pages/Reports/ProjectProgressReport';
import FinancialReport from './pages/Reports/FinancialReport';
import AccomplishmentReport from './pages/Reports/AccomplishmentReport';
import Minutes from './pages/Meetings/Minutes';
import RegisterMember from './pages/Members/RegisterMember';
import MembersList from './pages/Members/MembersList';
import CreateTask from './pages/Tasks/CreateTask';
import TaskList from './pages/Tasks/TaskList';

export default function App(){
  return (
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/projects/create" element={<CreateProject />} />
        <Route path="/projects/schedule" element={<ScheduleProject />} />
        <Route path="/projects/track" element={<TrackProject />} />
        <Route path="/budgets/record" element={<RecordBudget />} />
        <Route path="/budgets/allocate" element={<AllocateBudget />} />
        <Route path="/budgets/monitor" element={<MonitorBudget />} />
        <Route path="/reports/progress" element={<ProjectProgressReport />} />
        <Route path="/reports/financial" element={<FinancialReport />} />
        <Route path="/reports/accomplishment" element={<AccomplishmentReport />} />
        <Route path="/meetings/minutes" element={<Minutes />} />
        <Route path="/members/register" element={<RegisterMember />} />
        <Route path="/members/list" element={<MembersList />} />
        <Route path="/tasks/create" element={<CreateTask />} />
        <Route path="/tasks/list" element={<TaskList />} />
      </Routes>
  );
}
