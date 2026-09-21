import { useState } from 'react';
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
  type TableOptions,
} from '@tanstack/react-table';
import styles from './DataTable.module.css';

interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T, unknown>[];
  globalFilter?: string;
  onGlobalFilterChange?: (value: string) => void;
  showGlobalFilter?: boolean;
  filterPlaceholder?: string;
}

const DataTable = <T extends object>({
  data,
  columns,
  globalFilter,
  onGlobalFilterChange,
  showGlobalFilter = true,
  filterPlaceholder = 'ค้นหารายการ...',
}: DataTableProps<T>) => {
  const [internalGlobalFilter, setInternalGlobalFilter] = useState('');
  const resolvedGlobalFilter = globalFilter ?? internalGlobalFilter;
  const resolvedOnGlobalFilterChange = onGlobalFilterChange ?? setInternalGlobalFilter;

  // TanStack Table returns mutable table APIs that React Compiler cannot memoize safely.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable<T>({
    data,
    columns,
    state: {
      globalFilter: resolvedGlobalFilter,
    },
    onGlobalFilterChange: resolvedOnGlobalFilterChange,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  } as TableOptions<T>);

  const visibleRows = table.getRowModel().rows;

  return (
    <div className={styles.wrapper}>
      {showGlobalFilter ? (
        <div className={styles.filterRow}>
          <input value={resolvedGlobalFilter} onChange={(event) => resolvedOnGlobalFilterChange(event.target.value)} placeholder={filterPlaceholder} />
        </div>
      ) : null}
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {visibleRows.map((row) => (
              <tr key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className={styles.footer}>
        <button className={styles.pageButton} onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>ก่อนหน้า</button>
        <span>{table.getState().pagination.pageIndex + 1} / {table.getPageCount()}</span>
        <button className={styles.pageButton} onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>ถัดไป</button>
      </div>
    </div>
  );
};

export default DataTable;
