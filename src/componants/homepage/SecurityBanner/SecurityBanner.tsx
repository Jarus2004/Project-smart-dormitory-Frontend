import { ShieldCheck } from 'lucide-react';
import styles from './SecurityBanner.module.css';

function SecurityBanner() {
  return (
    <section className={styles.banner}>
      <div className={styles.leftIcon}>
        <ShieldCheck size={28} className={styles.shieldBlue} />
      </div>

      <div className={styles.textContainer}>
        <h4 className={styles.title}>ข้อมูลของคุณได้รับการปกป้องด้วยระบบความปลอดภัยมาตรฐาน</h4>
        <p className={styles.description}>เราให้ความสำคัญกับความปลอดภัยของข้อมูลผู้ใช้ทุกท่าน</p>
      </div>

      <div className={styles.rightIcon}>
        <ShieldCheck size={48} className={styles.shieldWatermark} />
      </div>
    </section>
  );
}

export default SecurityBanner;