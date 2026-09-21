import styles from './ActivityFeed.module.css';
import type { ActivityItem } from '../../types/user';

interface ActivityFeedProps {
  items: ActivityItem[];
}

const ActivityFeed = ({ items }: ActivityFeedProps) => {
  return (
    <section className={styles.card}>
      <div className={styles.header}>
        <h3>กิจกรรมและความเคลื่อนไหวล่าสุด</h3>
        <span className={styles.pill}>สด</span>
      </div>
      <div className={styles.list}>
        {items.length === 0 ? (
          <p style={{ color: '#64748b', fontSize: '0.85rem', padding: '1rem 0' }}>ไม่มีความเคลื่อนไหวล่าสุด</p>
        ) : (
          items.map((item) => (
            <div key={item.id} className={styles.item}>
              <div className={styles.dot} />
              <div>
                <p className={styles.name}>{item.userName}</p>
                <p className={styles.activity}>{item.activity}</p>
              </div>
              <span className={styles.time}>{item.timestamp}</span>
            </div>
          ))
        )}
      </div>
    </section>
  );
};

export default ActivityFeed;
