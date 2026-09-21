import styles from "./UserCard.module.css";

interface UserCardProps {
  title: string;
  description: string;
  onClick?: () => void;
}

function UserCard({
  title,
  description,
  onClick,
}: UserCardProps) {
  return (
    <div 
      className={styles.card} 
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <div className={styles.icon}>👤</div>

      <h3>{title}</h3>

      <p>{description}</p>

      <button 
        className={styles.btn}
        onClick={(e) => {
          e.stopPropagation();
          onClick?.();
        }}
      >
        →
      </button>
    </div>
  );
}

export default UserCard;