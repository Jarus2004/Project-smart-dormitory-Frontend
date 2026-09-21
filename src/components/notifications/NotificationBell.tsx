import { Bell, CheckCheck } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNotifications } from './notification-context';
import styles from './NotificationBell.module.css';

const NotificationBell = () => {
  const { alerts, markAllRead } = useNotifications();
  const unreadCount = alerts.filter((alert) => !alert.read).length;
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      <button type="button" className={`${styles.trigger} ${open ? styles.active : ''}`} onClick={() => setOpen((value) => !value)} aria-label="เปิดการแจ้งเตือน" aria-expanded={open}>
        <Bell size={20} />
        {unreadCount > 0 && <span className={styles.unreadDot} aria-label={`${unreadCount} รายการยังไม่อ่าน`} />}
      </button>
      {open && (
        <div className={styles.panel} role="dialog" aria-label="รายการแจ้งเตือน">
          <div className={styles.panelHeader}>
            <div><strong>การแจ้งเตือน</strong><span>{alerts.length ? `${alerts.length} รายการ` : 'ไม่มีรายการ'}</span></div>
            {unreadCount > 0 && <button type="button" className={styles.clearButton} onClick={markAllRead}><CheckCheck size={15} /> อ่านทั้งหมด</button>}
          </div>
          <div className={styles.list}>
            {alerts.length === 0 ? <p className={styles.empty}>ยังไม่มีการแจ้งเตือน</p> : alerts.map((alert) => (
              <div className={`${styles.item} ${styles[alert.tone]} ${!alert.read ? styles.unread : ''}`} key={alert.id}>
                <div className={styles.itemText}><strong>{alert.title}</strong><span>{alert.message}</span></div>
                {!alert.read && <span className={styles.itemUnreadDot} aria-label="ยังไม่อ่าน" />}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;