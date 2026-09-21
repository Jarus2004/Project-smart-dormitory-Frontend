import type { ComponentType } from 'react';
import styles from './StatCard.module.css';

interface StatCardProps {
  label: string;
  value: string;
  icon: ComponentType<{ size?: number; className?: string }>;
}

const StatCard = ({ label, value, icon: Icon }: StatCardProps) => {
  return (
    <article className={styles.card}>
      <div className={styles.iconWrap}><Icon size={20} /></div>
      <div>
        <p className={styles.value}>{value}</p>
        <p className={styles.label}>{label}</p>
      </div>
    </article>
  );
};

export default StatCard;
