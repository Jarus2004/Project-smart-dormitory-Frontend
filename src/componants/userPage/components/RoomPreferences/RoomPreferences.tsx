import { useState, useEffect, useMemo } from 'react';
import { CheckCircle2, Home, Shuffle, Building2, AlertCircle } from 'lucide-react';
import { api } from '../../../../services/api';
import type { RoomPreference, RoomTypeOption } from '../../types/tenant';
import styles from './RoomPreferences.module.css';

interface RoomPreferencesProps {
  data: RoomPreference;
  onChange: (value: RoomPreference) => void;
  error?: string;
}

interface RoomRecord {
  id: number;
  roomNumber: string;
  floor?: number | null;
  status: string;
  capacity: number;
  tenants?: Array<{ id: number }>;
}

interface FloorRoom {
  roomNumber: string;
  isKnown: boolean;
  isOccupied: boolean;
}

const RoomPreferencesForm = ({ data, onChange, error }: RoomPreferencesProps) => {
  const [dbRooms, setDbRooms] = useState<RoomRecord[]>([]);
  const [selectionError, setSelectionError] = useState<string | null>(null);

  // Fetch all rooms from database to check real occupancy
  useEffect(() => {
    let isCancelled = false;

    const fetchRooms = async () => {
      try {
        const response = await api.get('/rooms');
        const roomList = Array.isArray(response.data?.data) ? response.data.data : [];
        if (!isCancelled) {
          setDbRooms(roomList);
        }
      } catch (err) {
        if (!isCancelled) {
          console.warn('Could not fetch room occupancy from API, using default availability:', err);
        }
      }
    };

    fetchRooms();
    return () => {
      isCancelled = true;
    };
  }, []);

  // Determine current active floor number (1, 2, 3, 4)
  const currentFloor = useMemo<number>(() => {
    switch (data.preferredRoomType) {
      case 'Floor 2':
        return 2;
      case 'Floor 3':
        return 3;
      case 'Floor 4':
        return 4;
      case 'Floor 1':
      case 'Any Floor':
      default:
        return 1;
    }
  }, [data.preferredRoomType]);

  // Generate exactly 30 rooms for the selected floor (e.g. Floor 1: 101-130)
  const floorRooms = useMemo<FloorRoom[]>(() => {
    const list: FloorRoom[] = [];

    for (let i = 1; i <= 30; i++) {
      const roomNum = `${currentFloor}${i.toString().padStart(2, '0')}`;

      // Check if room exists in DB and is full
      const match = dbRooms.find((r) => r.roomNumber === roomNum);
      const isOccupied = Boolean(match && (
        match.status === 'OCCUPIED' || (match.tenants && match.tenants.length >= match.capacity)
      ));

      list.push({ roomNumber: roomNum, isKnown: Boolean(match), isOccupied });
    }

    return list;
  }, [currentFloor, dbRooms]);

  // List of only available rooms on this floor
  const availableRoomsOnFloor = useMemo(() => {
    return floorRooms.filter((r) => r.isKnown && !r.isOccupied).map((r) => r.roomNumber);
  }, [floorRooms]);

  // Calculate dynamic Baht deposit amount based on selected floor
  const depositAmount = useMemo<number>(() => {
    switch (currentFloor) {
      case 2:
        return 4200;
      case 3:
        return 4900;
      case 4:
        return 5600;
      case 1:
      default:
        return 3500;
    }
  }, [currentFloor]);

  // Handle floor dropdown change
  const handleFloorChange = (newFloorType: RoomTypeOption) => {
    const nextFloor = newFloorType === 'Floor 2' ? 2 : newFloorType === 'Floor 3' ? 3 : newFloorType === 'Floor 4' ? 4 : 1;

    // Generate potential rooms on that floor to check if current roomNumber still matches
    const newFloorPrefix = `${nextFloor}`;
    const isCurrentRoomValid = data.roomNumber && data.roomNumber.startsWith(newFloorPrefix);

    let nextRoomNumber = isCurrentRoomValid ? data.roomNumber : '';

    if (data.isRandomRoom) {
      nextRoomNumber = '';
    }

    setSelectionError(null);

    onChange({
      ...data,
      preferredRoomType: newFloorType,
      roomNumber: nextRoomNumber,
    });
  };

  // Handle "ไม่ระบุห้อง (ให้ระบบจัดสรรห้องว่างให้อัตโนมัติ)" checkbox toggle
  const handleRandomToggle = (checked: boolean) => {
    if (checked) {
      // Randomly pick an available room on this floor
      if (availableRoomsOnFloor.length === 0) {
        setSelectionError(`ชั้น ${currentFloor} ไม่มีห้องว่างหรือยังไม่มีข้อมูลห้องจากระบบ`);
        onChange({ ...data, isRandomRoom: true, roomNumber: '' });
        return;
      }

      const picked = availableRoomsOnFloor[Math.floor(Math.random() * availableRoomsOnFloor.length)];
      setSelectionError(null);

      onChange({
        ...data,
        isRandomRoom: true,
        roomNumber: picked,
      });
    } else {
      setSelectionError(null);
      onChange({
        ...data,
        isRandomRoom: false,
      });
    }
  };

  // Handle clicking a room card
  const handleRoomClick = (roomNum: string, isOccupied: boolean) => {
    if (isOccupied) return;

    setSelectionError(null);
    onChange({
      ...data,
      isRandomRoom: false,
      roomNumber: roomNum,
    });
  };

  return (
    <div className={styles.card}>
      <h2>ขั้นตอนที่ 2: เลือกห้องพักและชำระเงินมัดจำ</h2>
      <p className={styles.subtitle}>
        เลือกชั้นห้องพัก คลิกเลือกห้องที่ต้องการจากผังห้อง 30 ห้อง หรือติ๊กให้ระบบสุ่มห้องว่างให้อัตโนมัติ
      </p>

      {(error || selectionError) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#dc2626', background: '#fef2f2', padding: '0.75rem 1rem', borderRadius: '0.75rem', marginBottom: '1rem', border: '1px solid #fecaca' }}>
          <AlertCircle size={18} />
          <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{error || selectionError}</span>
        </div>
      )}

      <div className={styles.grid}>
        <div className={styles.leftColumn}>
          {/* ผังห้องพัก พร้อมตัวเลือกชั้นและระบบสุ่มห้องด้านใน */}
          <div className={styles.roomSection}>
            {/* ส่วนเลือกชั้น และ ตัวเลือกสุ่มห้องด้านในกล่องผังห้องพัก */}
            <div className={styles.roomSectionTopBar}>
              <label className={styles.floorSelectField}>
                <span>
                  <Building2 size={16} /> ชั้นที่ต้องการ
                </span>
                <select
                  value={data.preferredRoomType || 'Floor 1'}
                  onChange={(e) => handleFloorChange(e.target.value as RoomTypeOption)}
                >
                  <option value="Floor 1">ชั้น 1 (3,500 บาท / เดือน)</option>
                  <option value="Floor 2">ชั้น 2 (4,200 บาท / เดือน)</option>
                  <option value="Floor 3">ชั้น 3 (4,900 บาท / เดือน)</option>
                  <option value="Floor 4">ชั้น 4 (5,600 บาท / เดือน)</option>
                </select>
              </label>

              <label className={styles.checkboxContainer}>
                <input
                  type="checkbox"
                  checked={Boolean(data.isRandomRoom)}
                  onChange={(e) => handleRandomToggle(e.target.checked)}
                />
                <div className={styles.checkboxLabel}>
                  <span className={styles.checkboxTitle}>
                    <Shuffle size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
                    ไม่ระบุห้อง (ให้ระบบจัดสรรห้องว่างให้อัตโนมัติ)
                  </span>
                  <span className={styles.checkboxDesc}>
                    ติ๊กตัวเลือกนี้หากไม่ต้องการระบุห้อง ระบบจะสุ่มเลือกห้องที่ว่างบนชั้น {currentFloor} ให้ทันที
                  </span>
                </div>
              </label>
            </div>

            <div className={styles.roomSectionHeader}>
              <div className={styles.roomSectionTitle}>
                <Home size={16} /> ผังห้องพักชั้น {currentFloor} (30 ห้อง)
              </div>
              <div className={styles.legendBar}>
                <div className={styles.legendItem}>
                  <div className={styles.dotAvailable} /> ว่าง
                </div>
                <div className={styles.legendItem}>
                  <div className={styles.dotSelected} /> เลือกอยู่
                </div>
                <div className={styles.legendItem}>
                  <div className={styles.dotOccupied} /> เต็ม
                </div>
              </div>
            </div>

            {/* Room Grid 5 Columns */}
            <div className={styles.roomGrid}>
              {floorRooms.map((room) => {
                const isSelected = data.roomNumber === room.roomNumber;
                const isDimmed = Boolean(data.isRandomRoom);

                return (
                  <button
                    key={room.roomNumber}
                    type="button"
                    disabled={!room.isKnown || room.isOccupied}
                    onClick={() => handleRoomClick(room.roomNumber, room.isOccupied)}
                    className={`${styles.roomCard} ${
                      isSelected ? styles.roomCardSelected : ''
                    } ${room.isOccupied ? styles.roomCardDisabled : ''} ${
                      isDimmed ? styles.roomCardDimmed : ''
                    }`}
                  >
                    <span className={styles.roomNumber}>{room.roomNumber}</span>
                    <span
                      className={`${styles.roomBadge} ${
                        !room.isKnown || room.isOccupied ? styles.badgeOccupied : styles.badgeAvailable
                      }`}
                    >
                      {!room.isKnown ? 'ไม่มีข้อมูล' : room.isOccupied ? 'เต็ม' : isSelected ? 'เลือก ✓' : 'ว่าง'}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Selection Notification */}
            {data.isRandomRoom ? (
              <div className={styles.randomRoomAlert}>
                <Shuffle size={18} color="#16a34a" />
                <span>
                  <strong>ระบบสุ่มห้องให้อัตโนมัติ:</strong> ได้รับ <strong>ห้อง {data.roomNumber || `ชั้น ${currentFloor}`}</strong> (ชั้น {currentFloor})
                </span>
              </div>
            ) : data.roomNumber ? (
              <div className={styles.selectedRoomAlert}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={18} color="#2563eb" />
                  <span>
                    คุณกำลังเลือก: <strong>ห้อง {data.roomNumber}</strong> (ชั้น {currentFloor})
                  </span>
                </span>
                <span style={{ fontWeight: 700, color: '#1e3a8a' }}>
                  ฿{depositAmount.toLocaleString()} / เดือน
                </span>
              </div>
            ) : (
              <div style={{ fontSize: '0.84rem', color: '#64748b', textAlign: 'center', padding: '0.5rem' }}>
                👆 คลิกเลือกห้องที่ต้องการจากผังด้านบน หรือติ๊กเลือกให้ระบบสุ่มห้องให้
              </div>
            )}
          </div>

          {/* 4. หมายเหตุความต้องการห้องพัก */}
          <label className={styles.field}>
            <span>หมายเหตุความต้องการห้องพัก (ไม่บังคับ)</span>
            <textarea
              value={data.notes}
              onChange={(e) => onChange({ ...data, notes: e.target.value })}
              rows={3}
              placeholder="ความต้องการหรือรายละเอียดเพิ่มเติม เช่น ขอฝั่งตะวันออก หรือห้องที่เงียบสงบ"
            />
          </label>

          <div className={styles.notesCard}>
            <span>รายละเอียดราคาและเงินมัดจำห้องพัก</span>
            <ul>
              <li>ผู้เช่าต้องชำระค่ามัดจำห้องเช่าล่วงหน้า (เท่ากับค่าเช่า 1 เดือน)</li>
              <li>เงินมัดจำนี้จะได้รับคืนเต็มจำนวนเมื่อสิ้นสุดสัญญาตามเงื่อนไข</li>
            </ul>
          </div>
        </div>

        {/* PromptPay Invoice Section */}
        <div>
          <div className={styles.promptPayContainer}>
            <div className={styles.promptPayHeader}>
              <span className={styles.promptPayLogoText}>Prompt</span>
              <span className={styles.promptPayLogoDot}>|</span>
              <span className={styles.promptPayLogoText}>Pay</span>
            </div>

            <div className={styles.qrPlaceholder}>
              <img
                className={styles.qrImage}
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=https://promptpay.io/${import.meta.env.VITE_PROMPTPAY_NUMBER}/${depositAmount}`}
                alt="คิวอาร์โค้ด PromptPay"
              />
            </div>
            <div className={styles.amountTitle}>
              ยอดเงินมัดจำ {data.roomNumber ? `ห้อง ${data.roomNumber}` : `ชั้น ${currentFloor}`}
            </div>
            <div className={styles.amountValue}>฿{depositAmount.toLocaleString()}</div>
            <p className={styles.paymentInstruction}>
              เปิดแอปพลิเคชันธนาคารของท่าน สแกน QR Code เพื่อชำระเงินมัดจำ จากนั้นบันทึกรูปภาพสลิปเพื่อนำไปอัปโหลดในขั้นตอนถัดไป
            </p>

            {data.roomNumber && (
              <div style={{ marginTop: '0.75rem', padding: '0.5rem 0.75rem', background: '#dbeafe', borderRadius: '0.5rem', fontSize: '0.8rem', color: '#1e40af', fontWeight: 600 }}>
                ห้องที่จอง: {data.roomNumber} (ชั้น {currentFloor})
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomPreferencesForm;
