export type StudentStatus = 'Active' | 'Pending' | 'Inactive';

export interface Student {
  id: string;
  name: string;
  email: string;
  room: string;
  building: string;
  year: string;
  contact: string;
  checkInDate: string;
  status: StudentStatus;
  avatar: string;
}
