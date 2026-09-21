import styles from './AgreementsPage.module.css';

const AgreementsPage = () => {
  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <div>
          <p className={styles.eyebrow}>การปฏิบัติตามข้อกำหนด</p>
          <h2>ศูนย์สัญญาหอพัก</h2>
        </div>
      </div>

      <div className={styles.cardGrid}>
        <section className={styles.card}>
          <h3>สัญญาที่มีผลใช้งาน</h3>
          <p>สัญญาที่ลงนามแล้ว 24 ฉบับ</p>
        </section>
        <section className={styles.card}>
          <h3>รอตรวจสอบ</h3>
          <p>มีสัญญา 6 ฉบับต้องตรวจสอบ</p>
        </section>
        <section className={styles.card}>
          <h3>การต่อสัญญา</h3>
          <p>มีสัญญาที่จะครบกำหนดต่อ 3 ฉบับในเดือนนี้</p>
        </section>
      </div>
    </div>
  );
};

export default AgreementsPage;
