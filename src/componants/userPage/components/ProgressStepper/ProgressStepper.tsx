import styles from './ProgressStepper.module.css';

interface ProgressStepperProps {
  activeStep: number;
  steps: string[];
}

const ProgressStepper = ({ activeStep, steps }: ProgressStepperProps) => {
  const progress = ((activeStep + 1) / steps.length) * 100;

  return (
    <div className={styles.stepperContainer}>
      <div className={styles.progressHeader}>
        <span className={styles.progressLabel}>ความคืบหน้าการสมัคร</span>
        <span className={styles.progressValue}>{Math.round(progress)}%</span>
      </div>
      <div className={styles.track}>
        <div className={styles.filled} style={{ width: `${progress}%` }} />
      </div>
      <div className={styles.stepList}>
        {steps.map((step, index) => {
          const status = index < activeStep ? 'completed' : index === activeStep ? 'active' : 'pending';
          return (
            <div key={step} className={styles.stepItem}>
              <div className={[styles.stepCircle, styles[status]].join(' ')}>
                {status === 'completed' ? '✓' : index + 1}
              </div>
              <span className={styles.stepText}>{step}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProgressStepper;
