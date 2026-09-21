import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import styles from './Modal.module.css';

interface ModalProps {
  isOpen: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
}

const Modal = ({ isOpen, title, children, onClose }: ModalProps) => {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(event) => event.stopPropagation()}>
        <div className={styles.header}>
          <h3>{title}</h3>
          <button onClick={onClose} className={styles.closeButton}><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
};

export default Modal;
