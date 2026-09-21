import type { ReactNode } from 'react';
import styles from './Button.module.css';

interface ButtonProps {
  children: ReactNode;
  type?: 'button' | 'submit' | 'reset';
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost';
}

const Button = ({
  children,
  type = 'button',
  onClick,
  disabled = false,
  variant = 'primary',
}: ButtonProps) => {
  return (
    <button
      type={type}
      className={[styles.button, styles[variant]].join(' ')}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export default Button;
