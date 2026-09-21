import { Building2, Users } from 'lucide-react';
import styles from './RoomCard.module.css';
import type { Room } from '../../types/room';

interface RoomCardProps {
  room: Room;
}

const getStatusStyle = (status: Room['status']) => {
  if (status === 'Occupied') return styles.occupied;
  if (status === 'Maintenance') return styles.maintenance;
  return styles.available;
};

const roomStatusLabels: Record<Room['status'], string> = {
  Occupied: 'มีผู้พัก',
  Available: 'ว่าง',
  Maintenance: 'อยู่ระหว่างซ่อมบำรุง',
};

const RoomCard = ({ room }: RoomCardProps) => {
  const occupancyPercent = Math.round((room.occupied / room.capacity) * 100);
  return (
    <article className={styles.card}>
      <div className={styles.heading}>
        <div>
          <p className={styles.roomNumber}>ห้อง {room.number}</p>
          <p className={styles.meta}>ชั้น {room.floor} • {room.building.replace('Building', 'อาคาร')}</p>
        </div>
        <span className={`${styles.badge} ${getStatusStyle(room.status)}`}>{roomStatusLabels[room.status]}</span>
      </div>
      <div className={styles.occupancyRow}>
        <Users size={16} />
        <span>{room.occupied}/{room.capacity} คน</span>
      </div>
      <div className={styles.progressTrack}>
        <div className={styles.progressBar} style={{ width: `${occupancyPercent}%` }} />
      </div>
      <div className={styles.footer}>
        <div>
          <p className={styles.footerLabel}>ผู้พักอาศัย</p>
          <p className={styles.footerValue}>{room.students.join(', ')}</p>
        </div>
        <div className={styles.buildingPill}><Building2 size={14} />{room.building.replace('Building', 'อาคาร')}</div>
      </div>
    </article>
  );
};

export default RoomCard;
