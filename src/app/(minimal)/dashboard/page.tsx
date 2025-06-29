import React from 'react';
import DashboardClient from '@/components/dashboard/DashboardClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard - Extion',
  description: 'AI 기반 Excel 어시스턴트 Extion의 대시보드',
};

const Dashboard = () => {
  return <DashboardClient />;
};

export default Dashboard;