import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../contexts/useAuth';
import styles from './UserPageHeader.module.css';

type UserPageHeaderProps = {
  backPath?: string;
  backLabel?: string;
  onBack?: () => void;
};

const UserPageHeader = ({ backPath = '/student', backLabel = 'ย้อนกลับ', onBack }: UserPageHeaderProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const displayName = user?.username || user?.email || 'นักศึกษา';

  return (
    <header className={styles.header}>
      <button type="button" className={styles.backButton} onClick={() => { onBack?.(); navigate(backPath); }}>
        <ArrowLeft size={16} /> {backLabel}
      </button>
      <span className={styles.userLabel}>ผู้ใช้งาน: {displayName}</span>
    </header>
  );
};

export default UserPageHeader;