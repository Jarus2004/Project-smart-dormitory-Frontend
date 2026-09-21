import type { ReactNode } from 'react';
import styles from './Badge.module.css';

interface BadgeProps {
  tone: 'success' | 'warning' | 'danger' | 'primary' | 'neutral';
  children: ReactNode;
}

const Badge = ({ tone, children }: BadgeProps) => {
  return <span className={`${styles.badge} ${styles[tone]}`}>{children}</span>;
};

export default Badge;
