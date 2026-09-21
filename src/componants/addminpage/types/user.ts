export type UserRole = 'Admin' | 'Staff' | 'Student';
export type UserStatus = 'Active' | 'Pending' | 'Inactive';

export interface UserRecord {
  id: string;
  name: string;
  username?: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  isOnline: boolean;
  lastLogin: string;
}

export interface ActivityItem {
  id: string;
  userName: string;
  activity: string;
  timestamp: string;
}
