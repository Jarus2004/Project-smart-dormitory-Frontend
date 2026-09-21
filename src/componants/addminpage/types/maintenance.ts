export type MaintenanceStatus = 'Pending' | 'In Progress' | 'Completed' | 'Cancelled';

export interface MaintenanceRequest {
  id: string;
  reporterKey?: string;
  title: string;
  description: string;
  studentName: string;
  roomNumber: string;
  submittedAt: string;
  assignedStaff: string;
  status: MaintenanceStatus;
  rawStatus?: string;
  contactTime?: string;
  imageUrl?: string;
}
