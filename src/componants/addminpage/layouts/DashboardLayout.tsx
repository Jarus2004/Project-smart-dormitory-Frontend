import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  Building2,
  ClipboardList,
  BarChart3,
  House,
  LogOut,
  Menu,
  Settings,
  ShieldCheck,
  Users,
  X,
  Receipt,
  UserRoundPlus,
} from 'lucide-react';
import { useAuth } from '../../../contexts/useAuth';
import NotificationBell from '../../../components/notifications/NotificationBell';
import styles from '../styles/DashboardLayout.module.css';

const navigationItems = [
  { label: 'แดชบอร์ด', path: '/dashboard', icon: House },
  { label: 'ผังห้องพัก', path: '/room-management', icon: Building2 },
  { label: 'รายรับ-รายจ่าย', path: '/income-expenses', icon: Receipt },
  { label: 'แจ้งซ่อมบำรุง', path: '/maintenance', icon: ClipboardList },
  { label: 'นักศึกษา / ผู้พัก', path: '/students', icon: Users },
  { label: 'เข้า-ออกหอพัก', path: '/access-control', icon: ShieldCheck },
  { label: 'ผู้มาติดต่อ', path: '/visitors', icon: UserRoundPlus },
  { label: 'วิเคราะห์ระบบ', path: '/analysis', icon: BarChart3 },
  { label: 'ผู้ดูแลระบบ', path: '/admin-panel', icon: Settings },
];

const DashboardLayout = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setMobileOpen(false);
    navigate('/login', { replace: true });
  };

  return (
    <div className={styles.shell}>
      <aside className={`${styles.sidebar} ${mobileOpen ? styles.open : ''}`}>
        <div
          className={styles.brand}
          onClick={() => {
            navigate('/dashboard');
            setMobileOpen(false);
          }}
          style={{ cursor: 'pointer' }}
        >
          <div className={styles.brandIcon}>
            <Building2 size={22} />
          </div>
          <div>
            <p className={styles.brandTitle}>MEEDEE Dorm</p>
            <p className={styles.brandSubtitle}>ระบบบริหารหอพัก</p>
          </div>
        </div>

        <nav className={styles.navList}>
          {navigationItems.map(({ label, path, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className={styles.userCard}>
          <div className={styles.avatar}>AD</div>
          <div className={styles.userInfo}>
            <p className={styles.userName}>{user?.username || user?.email || 'ผู้ดูแลระบบ'}</p>
            <p className={styles.userEmail}>{user?.email || 'admin@dormitory.com'}</p>
          </div>
          <ShieldCheck size={18} className={styles.userBadge} />
        </div>

        <button type="button" className={styles.logoutButton} onClick={handleLogout}>
          <LogOut size={16} />
          <span>ออกจากระบบ</span>
        </button>
      </aside>

      <div className={styles.mainArea}>
        <header className={styles.header}>
          <button className={styles.menuButton} onClick={() => setMobileOpen((value) => !value)}>
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div>
            <p className={styles.headerEyebrow}>ศูนย์ควบคุมหลัก</p>
            <h1 className={styles.headerTitle}>Smart Dormitory Management</h1>
          </div>
          <NotificationBell />
        </header>

        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
