import { useMemo, useState } from 'react';
import { Building2, DoorOpen, Search, X } from 'lucide-react';
import { useDashboard } from '../../context/useDashboard';
import FilterDropdown from '../../components/FilterDropdown/FilterDropdown';
import RoomCard from '../../components/RoomCard/RoomCard';
import StatCard from '../../components/StatCard/StatCard';
import styles from './RoomManagementPage.module.css';

const RoomManagementPage = () => {
  const { rooms, metrics, loading } = useDashboard();
  const [floorFilter, setFloorFilter] = useState('All Floors');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredRooms = useMemo(() => {
    let result = rooms;

    // Filter by floor
    if (floorFilter !== 'All Floors') {
      result = result.filter((room) => `Floor ${room.floor}` === floorFilter);
    }

    // Filter by search query — Room type uses 'number' and 'students' fields
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter((room) => {
        if (room.number?.toLowerCase().includes(q)) return true;
        if (room.students?.some((name: string) => name.toLowerCase().includes(q))) return true;
        return false;
      });
    }

    return result;
  }, [floorFilter, searchQuery, rooms]);

  if (loading) {
    return <div className={styles.skeleton}>กำลังโหลดข้อมูลห้องพัก...</div>;
  }

  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <div>
          <p className={styles.eyebrow}>การจัดสรรพื้นที่</p>
          <h2>แดชบอร์ดการเข้าพักห้องพัก</h2>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Search Input */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search
              size={16}
              style={{ position: 'absolute', left: '0.85rem', color: '#64748b', pointerEvents: 'none' }}
            />
            <input
              id="room-search-input"
              type="text"
              placeholder="ค้นหาห้อง หรือชื่อผู้เช่า..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                paddingLeft: '2.5rem',
                paddingRight: searchQuery ? '2.5rem' : '1rem',
                paddingTop: '0.6rem',
                paddingBottom: '0.6rem',
                borderRadius: '0.75rem',
                border: '1.5px solid #e2e8f0',
                background: '#f8fafc',
                fontSize: '0.9rem',
                color: '#0f172a',
                outline: 'none',
                width: '220px',
                transition: 'border-color 0.2s, box-shadow 0.2s',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#2563eb';
                e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.12)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e2e8f0';
                e.target.style.boxShadow = 'none';
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#94a3b8',
                  display: 'flex',
                  alignItems: 'center',
                  padding: 0,
                }}
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Floor Filter Dropdown */}
          <FilterDropdown
            value={floorFilter}
            options={['All Floors', 'Floor 1', 'Floor 2', 'Floor 3', 'Floor 4']}
            onChange={setFloorFilter}
          />
        </div>
      </div>

      <section className={styles.statsGrid}>
        <StatCard label="นักศึกษาทั้งหมด" value={metrics[0]?.value ?? '0'} icon={Building2} />
        <StatCard label="อาคาร" value="12" icon={Building2} />
        <StatCard label="ห้องว่าง" value={metrics[2]?.value ?? '0'} icon={DoorOpen} />
        <StatCard label="รายการรอดำเนินการ" value={metrics[3]?.value ?? '0'} icon={DoorOpen} />
      </section>

      <section className={styles.roomGrid}>
        {filteredRooms.length === 0 ? (
          <div
            style={{
              gridColumn: '1 / -1',
              textAlign: 'center',
              padding: '3rem 1rem',
              color: '#64748b',
            }}
          >
            <Search
              size={40}
              style={{ display: 'block', margin: '0 auto 0.75rem', opacity: 0.35 }}
            />
            <p style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem' }}>
              ไม่พบห้องที่ค้นหา
            </p>
            <p style={{ fontSize: '0.85rem' }}>
              {searchQuery
                ? 'ลองค้นหาด้วยเลขห้อง หรือชื่อผู้เช่า'
                : 'ไม่มีห้องพักในชั้นที่เลือก'}
            </p>
          </div>
        ) : (
          filteredRooms.map((room) => <RoomCard key={room.id} room={room} />)
        )}
      </section>
    </div>
  );
};

export default RoomManagementPage;
