import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./HeroSection.module.css";
import UserCard from "../user-card/userCard";
import dormImg from "../../../assets/img/istockphoto-514344607-1024x1024.jpg";

function HeroSection() {
  const navigate = useNavigate();
  const [isConsentOpen, setIsConsentOpen] = useState(false);
  const [hasConsented, setHasConsented] = useState(false);

  useEffect(() => {
    if (!isConsentOpen) return undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsConsentOpen(false);
        setHasConsented(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isConsentOpen]);

  const openVisitorConsent = () => {
    setHasConsented(false);
    setIsConsentOpen(true);
  };

  const closeVisitorConsent = () => {
    setHasConsented(false);
    setIsConsentOpen(false);
  };

  const continueToVisitorForm = () => {
    if (!hasConsented) return;
    setIsConsentOpen(false);
    navigate("/visitor");
  };

  return (
    <section className={styles.hero}>
      <div className={styles.left}>

        <h1>
          SMART
          <br />
          DORMITORY
        </h1>

        <p>
          ระบบบริหารจัดการหอพักครบวงจร
        </p>

        <div className={styles.cards}>
          <UserCard
            title="สำหรับผู้เช่า / ผู้ดูแลระบบ"
            description="เข้าใช้งานระบบเพื่อจัดการข้อมูลหอพัก การเงิน และบริการต่าง ๆ"
            onClick={() => navigate("/login")}
          />

          <UserCard
            title="สำหรับผู้มาเยือน"
            description="สแกน QR Code จากผู้เช่าเพื่อลงทะเบียนเข้าเยี่ยม"
            onClick={openVisitorConsent}
          />
        </div>

      </div>

      <div className={styles.right}>
        <img src={dormImg} alt="Dormitory" />
      </div>

      {isConsentOpen && (
        <div
          className={styles.modalBackdrop}
          role="presentation"
          onClick={closeVisitorConsent}
        >
          <section
            className={styles.consentModal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="visitor-consent-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="visitor-consent-title">ยินยอมการใช้ข้อมูลส่วนบุคคล</h2>
            <p>
              ข้าพเจ้ายินยอมให้เว็บไซต์เก็บรวบรวม ใช้ และเปิดเผยข้อมูลส่วนบุคคลของข้าพเจ้า
              รวมถึงข้อมูลที่ปรากฏในบัตรประจำตัวประชาชนและเอกสารที่ข้าพเจ้าอัปโหลด
              เพื่อวัตถุประสงค์ในการยืนยันตัวตน การให้บริการ และการดำเนินการที่เกี่ยวข้องตามที่เว็บไซต์กำหนด
            </p>
            <p>
              ข้าพเจ้าได้รับทราบนโยบายความเป็นส่วนตัวของเว็บไซต์แล้ว
              และยินยอมให้ดำเนินการกับข้อมูลส่วนบุคคลดังกล่าวตามกฎหมายคุ้มครองข้อมูลส่วนบุคคล (PDPA)
            </p>

            <label className={styles.consentCheckbox}>
              <input
                type="checkbox"
                checked={hasConsented}
                onChange={(event) => setHasConsented(event.target.checked)}
              />
              <span>
                ข้าพเจ้าได้อ่านและยอมรับเงื่อนไขการเก็บรวบรวม ใช้ และเปิดเผยข้อมูลส่วนบุคคลข้างต้น
              </span>
            </label>

            <div className={styles.modalActions}>
              <button type="button" className={styles.cancelButton} onClick={closeVisitorConsent}>
                ยกเลิก
              </button>
              <button
                type="button"
                className={styles.continueButton}
                disabled={!hasConsented}
                onClick={continueToVisitorForm}
              >
                ยอมรับและไปต่อ
              </button>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}

export default HeroSection;