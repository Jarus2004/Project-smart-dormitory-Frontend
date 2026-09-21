import React from 'react';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar, Legend } from 'recharts';
import { BarChart3 } from 'lucide-react';
import styles from './ChartCard.module.css';
import type { MonthlySeries } from '../../context/dashboard-context';

interface ChartCardProps {
  data: MonthlySeries[];
}

const formatCurrency = (value: number) => `฿${value.toLocaleString('th-TH')}`;

export const ChartCard: React.FC<ChartCardProps> = ({ data }) => {
  return (
    <article className={styles.dashCard}>
      <div className={styles.cardHeader}>
        <div>
          <p className={styles.eyebrow}>Monthly Billing Trends</p>
          <h3 className={styles.cardTitle}>ยอดชำระและค้างชำระรายเดือน</h3>
        </div>
        <div className={styles.headerIcon}>
          <BarChart3 size={20} color="#6366f1" />
        </div>
      </div>

      <div className={styles.chartWrapper}>
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height={290}>
            <BarChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }} tickFormatter={(val) => `฿${val >= 1000 ? (val / 1000).toFixed(val % 1000 === 0 ? 0 : 1) + 'k' : val}`} />
              <Tooltip
                formatter={(value) => [formatCurrency(Number(value ?? 0)), '']}
                contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
              />
              <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ paddingTop: '10px', fontSize: '12px', fontWeight: 600 }} />
              <Bar name="ชำระแล้วเสร็จ (Income)" dataKey="income" fill="#2563eb" radius={[6, 6, 0, 0]} maxBarSize={45} />
              <Bar name="ค้างชำระ (Pending/Overdue)" dataKey="expenses" fill="#f59e0b" radius={[6, 6, 0, 0]} maxBarSize={45} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className={styles.emptyState}>ไม่มีข้อมูลบิลสำหรับแสดงผลกราฟ</div>
        )}
      </div>
    </article>
  );
};

export default ChartCard;
