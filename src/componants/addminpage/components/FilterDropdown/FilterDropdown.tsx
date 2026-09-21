import styles from './FilterDropdown.module.css';

interface FilterDropdownProps {
  value: string;
  options: string[];
  onChange: (value: string) => void;
}

const FilterDropdown = ({ value, options, onChange }: FilterDropdownProps) => {
  const displayOption = (option: string) => ({
    'All Buildings': 'ทุกอาคาร',
    'Building A': 'อาคาร A',
    'Building B': 'อาคาร B',
    'Building C': 'อาคาร C',
    'All Floors': 'ทุกชั้น',
    'Floor 1': 'ชั้น 1',
    'Floor 2': 'ชั้น 2',
    'Floor 3': 'ชั้น 3',
    'Floor 4': 'ชั้น 4',
  }[option] ?? option);

  return (
    <label className={styles.wrap}>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option} value={option}>
            {displayOption(option)}
          </option>
        ))}
      </select>
    </label>
  );
};

export default FilterDropdown;
