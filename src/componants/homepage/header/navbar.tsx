import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import styles from "./navbar.module.css";

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleMenuClick = () => {
    setIsMenuOpen(false);
  };

  return (
    <>
    <nav className={styles.navbar}>
      <div className={styles.logo}>
        <h2>SMART DORMITORY</h2>
        <small>ระบบจัดการหอพัก</small>
      </div>

      <button
        type="button"
        className={styles.menuButton}
        aria-label={isMenuOpen ? 'ปิดเมนู' : 'เปิดเมนู'}
        aria-expanded={isMenuOpen}
        onClick={() => setIsMenuOpen((isOpen) => !isOpen)}
      >
        {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      <ul className={`${styles.menu} ${isMenuOpen ? styles.menuOpen : ''}`}>
        <li><a href="#home" onClick={handleMenuClick}>หน้าแรก</a></li>
        <li><a href="#about" onClick={handleMenuClick}>เกี่ยวกับเรา</a></li>
        <li><a href="#news" onClick={handleMenuClick}>ข่าวสาร</a></li>
        <li><a href="#contact" onClick={handleMenuClick}>ติดต่อเรา</a></li>
        <li>
          <Link to="/login" className={styles.loginBtn} onClick={() => setIsMenuOpen(false)}>
            เข้าสู่ระบบ
          </Link>
        </li>
      </ul>

    </nav>
    
    <hr className={styles.divider} />
    </>
  );
}

export default Navbar;