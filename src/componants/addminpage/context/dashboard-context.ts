import { createContext } from 'react';
import type { ActivityItem, UserRecord } from '../types/user';
import type { MaintenanceRequest } from '../types/maintenance';
import type { Room } from '../types/room';
import type { Student } from '../types/student';

export interface DashboardMetric {
  id: string;
  label: string;
  value: string;
  icon: string;
}

export interface FinancialOverview {
  totalRent: string;
  waterAndElectricity: string;
  outstandingPayments: string;
  netIncome: string;
}

export interface MonthlySeries {
  month: string;
  income: number;
  expenses: number;
}

export interface BillRecord {
  id: string;
  amount: number;
  status: string;
  dueDate: string;
}

export interface DashboardContextValue {
  metrics: DashboardMetric[];
  rooms: Room[];
  students: Student[];
  maintenance: MaintenanceRequest[];
  users: UserRecord[];
  bills: BillRecord[];
  activities: ActivityItem[];
  financials: FinancialOverview;
  series: MonthlySeries[];
  loading: boolean;
  error: string | null;
  refetchRooms: () => Promise<void>;
  refetchTenants: () => Promise<void>;
  updateStudentStatus: (id: string, status: Student['status']) => void;
  refetchMaintenance: () => Promise<void>;
  refetchUsers: () => Promise<void>;
}

export const DashboardContext = createContext<DashboardContextValue | undefined>(undefined);
