import type { PersonalInformation } from '../../types/tenant';
import styles from './PersonalInformation.module.css';

interface PersonalInformationProps {
  data: PersonalInformation;
  onChange: (value: PersonalInformation) => void;
  errors: Partial<Record<keyof PersonalInformation, string>>;
}

const PersonalInformationForm = ({ data, onChange, errors }: PersonalInformationProps) => {
  return (
    <div className={styles.card}>
      <h2>ข้อมูลส่วนตัว</h2>
      <div className={styles.grid}>
        <label className={styles.field}>
          <span>ชื่อ-นามสกุล</span>
          <input
            type="text"
            value={data.fullName}
            onChange={(e) => onChange({ ...data, fullName: e.target.value })}
            aria-invalid={!!errors.fullName}
          />
          {errors.fullName && <small>{errors.fullName}</small>}
        </label>

        <label className={styles.field}>
          <span>รหัสนักศึกษา</span>
          <input
            type="text"
            value={data.studentId}
            onChange={(e) => onChange({ ...data, studentId: e.target.value })}
            aria-invalid={!!errors.studentId}
          />
          {errors.studentId && <small>{errors.studentId}</small>}
        </label>

        <label className={styles.field}>
          <span>หลักสูตร</span>
          <input
            type="text"
            value={data.course}
            onChange={(e) => onChange({ ...data, course: e.target.value })}
            aria-invalid={!!errors.course}
          />
          {errors.course && <small>{errors.course}</small>}
        </label>

        <label className={styles.field}>
          <span>ชั้นปี</span>
          <select
            value={data.yearLevel}
            onChange={(e) => onChange({ ...data, yearLevel: e.target.value as PersonalInformation['yearLevel'] })}
            aria-invalid={!!errors.yearLevel}
          >
            <option value="">เลือกชั้นปี</option>
            <option value="1st Year">ชั้นปีที่ 1</option>
            <option value="2nd Year">ชั้นปีที่ 2</option>
            <option value="3rd Year">ชั้นปีที่ 3</option>
            <option value="4th Year">ชั้นปีที่ 4</option>
            <option value="5th Year">ชั้นปีที่ 5</option>
          </select>
          {errors.yearLevel && <small>{errors.yearLevel}</small>}
        </label>

        <label className={styles.field}>
          <span>เบอร์โทรศัพท์</span>
          <input
            type="tel"
            value={data.contactNumber}
            onChange={(e) => onChange({ ...data, contactNumber: e.target.value })}
            aria-invalid={!!errors.contactNumber}
          />
          {errors.contactNumber && <small>{errors.contactNumber}</small>}
        </label>

        <label className={styles.field}>
          <span>อีเมล</span>
          <input
            type="email"
            value={data.emailAddress}
            onChange={(e) => onChange({ ...data, emailAddress: e.target.value })}
            aria-invalid={!!errors.emailAddress}
          />
          {errors.emailAddress && <small>{errors.emailAddress}</small>}
        </label>
      </div>
    </div>
  );
};

export default PersonalInformationForm;
