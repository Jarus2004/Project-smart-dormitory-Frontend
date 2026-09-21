export type RoomStatus = 'Occupied' | 'Available' | 'Maintenance';

export interface Room {
  id: string;
  number: string;
  floor: number;
  building: string;
  capacity: number;
  occupied: number;
  status: RoomStatus;
  students: string[];
  checkInDate: string;
}
