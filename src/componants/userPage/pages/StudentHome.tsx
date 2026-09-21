import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/useAuth';
import {
  ClipboardList,
  Home,
  LogOut,
  FileText,
  Bell,
  Camera,
  Building2,
  DoorOpen,
  Layers,
  Calendar,
  Clock,
  CheckCircle2,
  CreditCard,
} from 'lucide-react';
import { getMyTenant } from '../../../services/adminApi';
import styles from './StudentHome.module.css';

type TenantRecord = {
  id?: number;
  status?: string | null;
  room?: {
    id?: number;
    roomNumber?: string | null;
    floor?: number | null;
    monthlyRent?: string | number | null;
  } | null;
  preferredRoomType?: string | null;
  checkInDate?: string | null;
  contractData?: string | null;
};

const readContract = (value?: string | null): Record<string, string> => {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;
    return Object.fromEntries(Object.entries(parsed).map(([key, entry]) => [key, String(entry ?? '')]));
  } catch {
    return {};
  }
};

const formatCheckInDate = (dateVal?: string | null, fallbackDate?: string | null) => {
  if (fallbackDate) return fallbackDate;
  if (!dateVal) return '-';
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return dateVal;
    return d.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return dateVal;
  }
};

const StudentHome = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tenant, setTenant] = useState<TenantRecord | null>(null);
  const [tenantLoaded, setTenantLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;

    getMyTenant()
      .then((response) => {
        if (mounted) {
          setTenant((response.data?.data as TenantRecord) ?? null);
          setTenantLoaded(true);
        }
      })
      .catch(() => {
        if (mounted) setTenantLoaded(true);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const isApproved = tenant?.status === 'APPROVED' || tenant?.status === 'ACTIVE';
  const isPending = tenant?.status === 'PENDING';

  const contract = readContract(tenant?.contractData);
  const buildingName = contract.building || 'อาคาร A';
  const roomNumber = tenant?.room?.roomNumber || contract.roomNumber || tenant?.preferredRoomType || '-';
  const floorName = tenant?.room?.floor
    ? `ชั้น ${tenant.room.floor}`
    : contract.floor
    ? contract.floor.startsWith('Floor') || contract.floor.startsWith('ชั้น')
      ? contract.floor
      : `ชั้น ${contract.floor}`
    : '-';
  const checkInDate = formatCheckInDate(tenant?.checkInDate, contract.startDate);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const menuItems = [
    {
      icon: ClipboardList,
      title: 'สมัครเข้าพักหอพัก',
      description: 'กรอกแบบฟอร์มสมัครเช่าห้องพัก พร้อมแนบเอกสารประกอบ',
      action: () => navigate('/apply'),
      color: '#3b82f6',
      bg: '#eff6ff',
      // Hide the menu when user already has an application (PENDING or APPROVED)
      hidden: tenantLoaded && (isPending || isApproved),
    },
    {
      icon: CreditCard,
      title: 'ค่าใช้จ่ายและการชำระเงิน',
      description: 'ดูบิลหอพัก สแกน QR และส่งสลิปตรวจสอบการชำระเงิน',
      action: () => navigate('/student/billing'),
      color: '#126782',
      bg: '#dff3f5',
      disabled: !isApproved,
      lockedLabel: tenantLoaded && !isApproved ? 'รอ Admin ยืนยัน' : undefined,
    },
    {
      icon: FileText,
      title: 'ใบสัญญาและเอกสาร',
      description: 'ดูสัญญาเช่า ข้อบังคับหอพัก และเอกสารสำคัญต่างๆ',
      action: () => navigate('/student/documents'),
      color: '#8b5cf6',
      bg: '#f5f3ff',
      disabled: !isApproved,
      lockedLabel: tenantLoaded && !isApproved ? 'รอ Admin ยืนยัน' : undefined,
    },
    {
      icon: Bell,
      title: 'แจ้งซ่อมบำรุง',
      description: 'แจ้งปัญหาห้องพัก ไฟฟ้า ประปา และสิ่งอำนวยความสะดวก',
      action: () => navigate('/student/maintenance'),
      color: '#f59e0b',
      bg: '#fffbeb',
      disabled: !isApproved,
      lockedLabel: tenantLoaded && !isApproved ? 'รอ Admin ยืนยัน' : undefined,
    },
    {
      icon: Camera,
      title: 'บันทึกใบหน้าเข้าหอพัก',
      description: 'ลงทะเบียนใบหน้า 5 มุม (ก้ม, ตรง, เหงย, ซ้าย, ขวา) เพื่อใช้ประตูอัตโนมัติ',
      action: () => navigate('/user-identity-flow'),
      color: '#10b981',
      bg: '#ecfdf5',
      disabled: !isApproved,
      lockedLabel: tenantLoaded && !isApproved ? 'รอ Admin ยืนยัน' : undefined,
    },
  ];

  const displayName = user?.username || user?.email || 'นักศึกษา';
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerBrand} onClick={() => window.location.assign('/student')} style={{ cursor: 'pointer' }}>
          <div className={styles.headerIcon}>
            <Home size={20} />
          </div>
          <div>
            <p className={styles.headerSub}>MEEDEE Dormitory</p>
            <p className={styles.headerTitle}>ระบบหอพักนักศึกษา</p>
          </div>
        </div>

        <div className={styles.headerRight}>
          <div className={styles.userPill}>
            <div className={styles.avatar}>{initials}</div>
            <div className={styles.userText}>
              <p className={styles.userName}>
                {displayName}
              </p>
              <p className={styles.userRole}>นักศึกษา</p>
            </div>
          </div>
          <button id="btn-student-logout" className={styles.logoutBtn} onClick={handleLogout}>
            <LogOut size={16} />
            <span>ออกจากระบบ</span>
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroBadge}>🏠 ยินดีต้อนรับ</div>
        <h1 className={styles.heroTitle}>
          สวัสดี, {displayName}!
        </h1>
        <p className={styles.heroDesc}>
          ระบบบริหารจัดการหอพักนักศึกษา เลือกเมนูด้านล่างเพื่อเริ่มต้นใช้งาน
        </p>
      </section>

      {/* Housing Information Card */}
      {tenantLoaded && (
        <section className={styles.housingCard}>
          <div className={styles.housingCardHeader}>
            <div className={styles.housingCardTitleWrap}>
              <div className={styles.housingCardIcon}>
                <Building2 size={20} />
              </div>
              <h2 className={styles.housingCardTitle}>ข้อมูลห้องพัก</h2>
            </div>
            {isApproved ? (
              <span className={`${styles.housingStatusBadge} ${styles.statusApproved}`}>
                <CheckCircle2 size={14} /> อนุมัติแล้ว
              </span>
            ) : isPending ? (
              <span className={`${styles.housingStatusBadge} ${styles.statusPending}`}>
                <Clock size={14} /> กำลังรอจัดสรรห้องพัก
              </span>
            ) : null}
          </div>

          {isApproved ? (
            <div className={styles.housingGrid}>
              <div className={styles.housingItem}>
                <div className={styles.itemIcon}>
                  <Building2 size={18} />
                </div>
                <div className={styles.itemContent}>
                  <span className={styles.itemLabel}>อาคาร (Building)</span>
                  <strong className={styles.itemValue}>{buildingName}</strong>
                </div>
              </div>

              <div className={styles.housingItem}>
                <div className={styles.itemIcon}>
                  <DoorOpen size={18} />
                </div>
                <div className={styles.itemContent}>
                  <span className={styles.itemLabel}>เลขห้อง (Room Number)</span>
                  <strong className={`${styles.itemValue} ${styles.itemValueHighlight}`}>
                    {roomNumber}
                  </strong>
                </div>
              </div>

              <div className={styles.housingItem}>
                <div className={styles.itemIcon}>
                  <Layers size={18} />
                </div>
                <div className={styles.itemContent}>
                  <span className={styles.itemLabel}>ชั้น (Floor)</span>
                  <strong className={styles.itemValue}>{floorName}</strong>
                </div>
              </div>

              <div className={styles.housingItem}>
                <div className={styles.itemIcon}>
                  <Calendar size={18} />
                </div>
                <div className={styles.itemContent}>
                  <span className={styles.itemLabel}>วันที่เช็คอิน (Check-in Date)</span>
                  <strong className={styles.itemValue}>{checkInDate}</strong>
                </div>
              </div>
            </div>
          ) : isPending ? (
            <div className={styles.pendingNotice}>
              <Clock size={18} />
              <span>
                ใบสมัครเช่าห้องพักของคุณอยู่ระหว่างการตรวจสอบและจัดสรรห้องพักจากเจ้าหน้าที่
              </span>
            </div>
          ) : (
            <div className={styles.pendingNotice}>
              <ClipboardList size={18} />
              <span>คุณยังไม่ได้ยื่นใบสมัครเข้าพักหอพัก กรุณากดเมนู "สมัครเข้าพักหอพัก" ด้านล่าง</span>
            </div>
          )}
        </section>
      )}

      {/* Menu Grid */}
      <section className={styles.menuGrid}>
        {menuItems.filter((item) => !item.hidden).map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.title}
              className={`${styles.menuCard} ${item.disabled ? styles.disabled : ''}`}
              onClick={item.disabled ? undefined : item.action}
              disabled={item.disabled}
            >
              <div className={styles.menuIconWrap} style={{ background: item.bg, color: item.color }}>
                <Icon size={28} />
              </div>
              <div className={styles.menuContent}>
                <p className={styles.menuTitle}>{item.title}</p>
                <p className={styles.menuDesc}>{item.description}</p>
                {item.disabled && <span className={styles.comingSoon}>{item.lockedLabel ?? 'เร็วๆ นี้'}</span>}
              </div>
              {!item.disabled && (
                <div className={styles.menuArrow} style={{ color: item.color }}>→</div>
              )}
            </button>
          );
        })}
      </section>
    </div>
  );
};

export default StudentHome;
