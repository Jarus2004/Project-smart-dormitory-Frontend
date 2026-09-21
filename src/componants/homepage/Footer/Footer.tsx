import { MessageCircle, Mail, Phone, MapPin, Home } from 'lucide-react';
import styles from './Footer.module.css';

const FacebookIcon = ({ size = 24 }: { size?: number }) => (
  <svg 
    viewBox="0 0 24 24" 
    width={size} 
    height={size} 
    stroke="currentColor" 
    strokeWidth="2" 
    fill="none" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M18 2h-3a5 5 0 0 0 -5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
  </svg>
);

function Footer() {
  return (
    <footer id="contact" className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.row}>
          {/* Logo & Description */}
          <div className={styles.col}>
            <div className={styles.logo}>
              <div className={styles.logoIcon}>
                <Home size={20} />
              </div>
              <div>
                <h3 className={styles.brandName}>SMART DORMITORY</h3>
                <span className={styles.brandSub}>ระบบจัดการหอพัก</span>
              </div>
            </div>
            <p className={styles.desc}>
              ระบบบริหารจัดการหอพักครบวงจร สะดวก ปลอดภัย และเชื่อถือได้
            </p>
            <div className={styles.socials}>
              <a href="#" className={styles.socialLink}><FacebookIcon size={18} /></a>
              <a href="#" className={styles.socialLink}><MessageCircle size={18} /></a>
              <a href="#" className={styles.socialLink}><Mail size={18} /></a>
            </div>
          </div>

          {/* Quick Menu */}
          <div className={styles.col}>
            <h4 className={styles.colTitle}>เมนูด่วน</h4>
            <ul className={styles.links}>
              <li><a href="#home">หน้าแรก</a></li>
              <li><a href="#about">เกี่ยวกับเรา</a></li>
              <li><a href="#news">ข่าวสาร</a></li>
              <li><a href="#contact">ติดต่อเรา</a></li>
            </ul>
          </div>

          {/* For Users */}
          <div className={styles.col}>
            <h4 className={styles.colTitle}>สำหรับผู้ใช้งาน</h4>
            <ul className={styles.links}>
              <li><a href="#">คู่มือการใช้งาน</a></li>
              <li><a href="#">คำถามที่พบบ่อย</a></li>
              <li><a href="#">นโยบายความเป็นส่วนตัว</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div className={styles.col}>
            <h4 className={styles.colTitle}>ติดต่อเรา</h4>
            <ul className={styles.contactList}>
              <li>
                <MapPin size={16} className={styles.contactIcon} />
                <span>123/45 ถนนประชาอุทิศ แขวง/เขต ราษฎร์บูรณะ กรุงเทพฯ 10140</span>
              </li>
              <li>
                <Phone size={16} className={styles.contactIcon} />
                <span>02-123-4567</span>
              </li>
              <li>
                <Mail size={16} className={styles.contactIcon} />
                <span>support@smartdormitory.com</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Banner */}
        <div className={styles.bottom}>
          <p>© 2024 Smart Dormitory ระบบจัดการหอพัก สงวนลิขสิทธิ์</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;