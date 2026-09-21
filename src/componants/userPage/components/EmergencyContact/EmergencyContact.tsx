import type { EmergencyContact } from '../../types/tenant';
import styles from './EmergencyContact.module.css';

interface EmergencyContactProps {
  data: EmergencyContact;
  onChange: (value: EmergencyContact) => void;
  errors: Partial<Record<keyof EmergencyContact, string>>;
}

const EmergencyContactForm = ({ data, onChange, errors }: EmergencyContactProps) => {
  return (
    <div className={styles.card}>
      <h2>ผู้ติดต่อฉุกเฉิน</h2>
      <div className={styles.grid}>
        <label className={styles.field}>
          <span>ชื่อผู้ติดต่อฉุกเฉิน</span>
          <input
            type="text"
            value={data.emergencyName}
            onChange={(e) => onChange({ ...data, emergencyName: e.target.value })}
            aria-invalid={!!errors.emergencyName}
          />
          {errors.emergencyName && <small>{errors.emergencyName}</small>}
        </label>

        <label className={styles.field}>
          <span>ความสัมพันธ์</span>
          <select
            value={data.relationship}
            onChange={(e) => onChange({ ...data, relationship: e.target.value as EmergencyContact['relationship'] })}
            aria-invalid={!!errors.relationship}
          >
            <option value="">เลือกความสัมพันธ์</option>
            <option value="Parent">ผู้ปกครอง</option>
            <option value="Guardian">ผู้ดูแล</option>
            <option value="Sibling">พี่น้อง</option>
            <option value="Relative">ญาติ</option>
            <option value="Other">อื่นๆ</option>
          </select>
          {errors.relationship && <small>{errors.relationship}</small>}
        </label>

        <label className={styles.field}>
          <span>เบอร์ติดต่อฉุกเฉิน</span>
          <input
            type="tel"
            value={data.emergencyNumber}
            onChange={(e) => onChange({ ...data, emergencyNumber: e.target.value })}
            aria-invalid={!!errors.emergencyNumber}
          />
          {errors.emergencyNumber && <small>{errors.emergencyNumber}</small>}
        </label>
      </div>
    </div>
  );
};

export default EmergencyContactForm;
