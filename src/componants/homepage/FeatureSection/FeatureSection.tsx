import styles from './FeatureSection.module.css';

function FeatureSection() {
  return (
    <section className={styles.feature}>
      <div className={styles.image}>
        <img
          src="/images/dashboard.png"
          alt="ภาพตัวอย่างแดชบอร์ดระบบจัดการหอพัก"
        />
      </div>

      <div className={styles.content}>
        <h2>
          บริหารจัดการหอพัก
          <span className={styles.blueText}> ได้ง่ายขึ้นในที่เดียว</span>
        </h2>

        <p>
          ระบบของเราช่วยให้คุณจัดการข้อมูลผู้เช่า ห้องพัก ค่าน้ำ-ค่าไฟ
          การแจ้งซ่อม และผู้มาเยือนได้อย่างมีประสิทธิภาพ
        </p>

        <button className={styles.btn}>
          ดูรายละเอียดเพิ่มเติม <span className={styles.arrow}>→</span>
        </button>
      </div>
    </section>
  );
}

export default FeatureSection;
