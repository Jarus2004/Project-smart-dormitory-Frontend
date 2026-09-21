import { useState, useEffect, useRef } from 'react';
import type {
  PersonalInformation,
  EmergencyContact,
  RoomPreference,
  OcrData,
  ContractData,
} from '../../types/tenant';
import styles from './ContractReview.module.css';

const calculateAge = (birthDate?: string): number | null => {
  if (!birthDate) return null;

  const thaiMonths: Record<string, number> = {
    มกราคม: 1, กุมภาพันธ์: 2, มีนาคม: 3, เมษายน: 4, พฤษภาคม: 5, มิถุนายน: 6,
    กรกฎาคม: 7, สิงหาคม: 8, กันยายน: 9, ตุลาคม: 10, พฤศจิกายน: 11, ธันวาคม: 12,
  };
  const monthName = Object.keys(thaiMonths).find((month) => birthDate.includes(month));
  const numbers = birthDate.match(/\d+/gu)?.map(Number) ?? [];
  if (monthName && numbers.length >= 2) {
    const day = numbers[0];
    const year = numbers[numbers.length - 1];
    return calculateAgeFromParts(day, thaiMonths[monthName], year);
  }

  if (numbers.length < 3) return null;

  const [first, second, third] = numbers;
  const day = first > 31 ? third : first;
  const month = first > 31 ? second : second;
  const year = first > 31 ? first : third;
  return calculateAgeFromParts(day, month, year);
};

const calculateAgeFromParts = (day: number, month: number, year: number): number | null => {
  const currentYear = new Date().getFullYear();
  const birthYear = year > currentYear + 100 ? year - 543 : year;
  if (day < 1 || day > 31 || month < 1 || month > 12 || birthYear < 1900 || birthYear > currentYear) return null;

  const today = new Date();
  let age = currentYear - birthYear;
  const birthdayThisYear = new Date(currentYear, month - 1, day);
  if (today < birthdayThisYear) age -= 1;
  return age >= 0 ? age : null;
};

const floorLabels: Record<string, string> = { 'Floor 1': 'ชั้น 1', 'Floor 2': 'ชั้น 2', 'Floor 3': 'ชั้น 3', 'Floor 4': 'ชั้น 4', 'Any Floor': 'ชั้นใดก็ได้' };

interface ContractReviewProps {
  personalInformation: PersonalInformation;
  emergencyContact: EmergencyContact;
  roomPreference: RoomPreference;
  ocrData: OcrData;
  contractData: ContractData;
  onUpdateContractData: (contract: ContractData) => void;
}

const ContractReview = ({
  personalInformation,
  roomPreference,
  ocrData,
  contractData,
  onUpdateContractData,
}: ContractReviewProps) => {
  const [isEditingContract, setIsEditingContract] = useState(false);
  const contractDataRef = useRef(contractData);
  useEffect(() => {
    contractDataRef.current = contractData;
  }, [contractData]);

  useEffect(() => {
    const currentContractData = contractDataRef.current;
    const today = new Date();
    const thaiYear = (today.getFullYear() + 543).toString();

    // Map dynamic prices for Thai Baht
    const getDepositAmount = (): string => {
      switch (roomPreference.preferredRoomType) {
        case 'Floor 1':
          return '3,500';
        case 'Floor 2':
          return '4,200';
        case 'Floor 3':
          return '4,900';
        case 'Floor 4':
          return '5,600';
        case 'Any Floor':
          return '3,500';
        default:
          return '3,500';
      }
    };

    const rent = getDepositAmount();

    const updated: ContractData = {
      docLocation: currentContractData.docLocation || 'สำนักงานหอพัก MEEDEE Dormitory',
      docDate: currentContractData.docDate || today.getDate().toString(),
      docMonth: currentContractData.docMonth || today.toLocaleString('th-TH', { month: 'long' }),
      docYear: currentContractData.docYear || thaiYear,

      landlordName: currentContractData.landlordName || 'ผู้บริหารหอพัก MEEDEE Dormitory',
      landlordAddress: currentContractData.landlordAddress || '123/45 ถนนพหลโยธิน กรุงเทพมหานคร',
      landlordPhone: currentContractData.landlordPhone || '02-123-4567',

      // Tenant identity fields: prioritise what OCR extracted from the scanned ID card
      tenantName: ocrData.fullNameTh || personalInformation.fullName || currentContractData.tenantName || '',
      tenantAge: String(ocrData.age ?? calculateAge(ocrData.birthDateTh) ?? ''),
      tenantCitizenId: ocrData.citizenId || currentContractData.tenantCitizenId || '',
      tenantAddress: ocrData.address || currentContractData.tenantAddress || '',
      tenantPhone: personalInformation.contactNumber || currentContractData.tenantPhone || '',

      // roomPreference.roomNumber is the source of truth from user selection
      roomNumber: roomPreference.roomNumber || currentContractData.roomNumber || '',
      building: currentContractData.building || 'อาคาร A',
      floor: roomPreference.preferredRoomType || currentContractData.floor || 'Floor 1',
      startDate: currentContractData.startDate || '01/09/2569',
      endDate: currentContractData.endDate || '31/08/2570',

      monthlyRent: currentContractData.monthlyRent || rent,
      depositAmount: currentContractData.depositAmount || rent,
      keycardDeposit: currentContractData.keycardDeposit || '300',
      payDueDate: currentContractData.payDueDate || '5',

      electricityRate: currentContractData.electricityRate || '7',
      waterRate: currentContractData.waterRate || '18',
      internetFee: currentContractData.internetFee || '0 (ฟรี WiFi)',
      otherExpenses: currentContractData.otherExpenses || '0',
      advanceNoticeDays: currentContractData.advanceNoticeDays || '30',
    };

    onUpdateContractData(updated);
  }, [
    personalInformation.fullName,
    personalInformation.contactNumber,
    roomPreference.preferredRoomType,
    roomPreference.roomNumber,
    ocrData.age,
    ocrData.address,
    ocrData.birthDateTh,
    ocrData.citizenId,
    ocrData.fullNameTh,
    onUpdateContractData,
  ]);

  const handleContractFieldChange = (key: keyof ContractData, value: string) => {
    onUpdateContractData({
      ...contractData,
      [key]: value,
    });
  };

  return (
    <div className={styles.card}>
      <h2>ขั้นตอนที่ 4: ตรวจสอบสัญญาเช่า</h2>
      <p className={styles.cardSubtitle}>
        โปรดตรวจสอบข้อมูลในหนังสือสัญญาเช่าด้านล่าง หากมีข้อผิดพลาดสามารถกดแก้ไขและอัปเดตสัญญาก่อนกดยื่นใบสมัคร
      </p>

      {/* Contract Header and Edit controls */}
      <div className={styles.contractHeader}>
        <div className={styles.contractHeaderTitle}>
          <h3>หนังสือสัญญาเช่าหอพักระบบ MEEDEE Dormitory</h3>
          <span className={styles.autoFillBadge}>
            {ocrData.isThaiIdCard
              ? '✔️ ตรวจสอบแล้วผ่านระบบ OCR หลักฐานและเอกสารของท่าน'
              : '⚠️ รอผลตรวจสอบบัตรประชาชนจากระบบ OCR'}
          </span>
        </div>
        <button
          type="button"
          className={styles.editToggleButton}
          onClick={() => setIsEditingContract((prev) => !prev)}
        >
          {isEditingContract ? '🔒 ล็อกสัญญาและพรีวิว' : '✏️ แก้ไขข้อมูลสัญญา'}
        </button>
      </div>

      <div className={styles.contractPaper}>
        <div className={styles.contractPaperTitle}>หนังสือสัญญาเช่าหอพัก (กรณีส่งัไลน์)</div>

        <div className={styles.contractRow} style={{ justifyContent: 'flex-end' }}>
          <span>ทำที่</span>
          {isEditingContract ? (
            <input
              className={styles.contractInput}
              value={contractData.docLocation || ''}
              onChange={(e) => handleContractFieldChange('docLocation', e.target.value)}
            />
          ) : (
            <span className={styles.contractFieldVal}>{contractData.docLocation}</span>
          )}
        </div>

        <div className={styles.contractRow} style={{ justifyContent: 'flex-end' }}>
          <span>วันที่</span>
          {isEditingContract ? (
            <input
              className={styles.contractInput}
              style={{ width: '50px' }}
              value={contractData.docDate || ''}
              onChange={(e) => handleContractFieldChange('docDate', e.target.value)}
            />
          ) : (
            <span className={styles.contractFieldVal}>{contractData.docDate}</span>
          )}
          <span>เดือน</span>
          {isEditingContract ? (
            <input
              className={styles.contractInput}
              style={{ width: '100px' }}
              value={contractData.docMonth || ''}
              onChange={(e) => handleContractFieldChange('docMonth', e.target.value)}
            />
          ) : (
            <span className={styles.contractFieldVal}>{contractData.docMonth}</span>
          )}
          <span>พ.ศ.</span>
          {isEditingContract ? (
            <input
              className={styles.contractInput}
              style={{ width: '70px' }}
              value={contractData.docYear || ''}
              onChange={(e) => handleContractFieldChange('docYear', e.target.value)}
            />
          ) : (
            <span className={styles.contractFieldVal}>{contractData.docYear}</span>
          )}
        </div>

        <div className={styles.contractSectionTitle}>สัญญาฉบับนี้ทำขึ้นระหว่าง</div>

        <div className={styles.contractRow}>
          <span>ผู้ให้เช่า/เจ้าของหอพัก ชื่อ</span>
          {isEditingContract ? (
            <input
              className={styles.contractInput}
              style={{ width: '220px' }}
              value={contractData.landlordName || ''}
              onChange={(e) => handleContractFieldChange('landlordName', e.target.value)}
            />
          ) : (
            <span className={styles.contractFieldVal}>{contractData.landlordName}</span>
          )}
        </div>

        <div className={styles.contractRow}>
          <span>ที่อยู่</span>
          {isEditingContract ? (
            <input
              className={styles.contractInput}
              style={{ width: '320px' }}
              value={contractData.landlordAddress || ''}
              onChange={(e) => handleContractFieldChange('landlordAddress', e.target.value)}
            />
          ) : (
            <span className={styles.contractFieldVal}>{contractData.landlordAddress}</span>
          )}
          <span>โทรศัพท์</span>
          {isEditingContract ? (
            <input
              className={styles.contractInput}
              style={{ width: '120px' }}
              value={contractData.landlordPhone || ''}
              onChange={(e) => handleContractFieldChange('landlordPhone', e.target.value)}
            />
          ) : (
            <span className={styles.contractFieldVal}>{contractData.landlordPhone}</span>
          )}
        </div>

        <div className={styles.contractRow} style={{ color: '#4b5563', fontStyle: 'italic' }}>
          ซึ่งต่อไปในสัญญานี้เรียกว่า "ผู้ให้เช่า"
        </div>

        <div className={styles.contractRow} style={{ marginTop: '0.5rem' }}>
          <span>กับ ผู้เช่า ชื่อ</span>
          {isEditingContract ? (
            <input
              className={styles.contractInput}
              style={{ width: '220px' }}
              value={contractData.tenantName || ''}
              onChange={(e) => handleContractFieldChange('tenantName', e.target.value)}
            />
          ) : (
            <span className={styles.contractFieldVal}>{contractData.tenantName || '-'}</span>
          )}
          <span>อายุ</span>
          {isEditingContract ? (
            <input
              className={styles.contractInput}
              style={{ width: '50px' }}
              value={contractData.tenantAge || ''}
              onChange={(e) => handleContractFieldChange('tenantAge', e.target.value)}
            />
          ) : (
            <span className={styles.contractFieldVal}>{contractData.tenantAge}</span>
          )}
          <span>ปี</span>
        </div>

        <div className={styles.contractRow}>
          <span>เลขบัตรประชาชน</span>
          {isEditingContract ? (
            <input
              className={styles.contractInput}
              style={{ width: '180px' }}
              value={contractData.tenantCitizenId || ''}
              onChange={(e) => handleContractFieldChange('tenantCitizenId', e.target.value)}
            />
          ) : (
            <span className={styles.contractFieldVal}>{contractData.tenantCitizenId || '-'}</span>
          )}
        </div>

        <div className={styles.contractRow}>
          <span>ที่อยู่ตามทะเบียนบ้าน</span>
          {isEditingContract ? (
            <input
              className={styles.contractInput}
              style={{ width: '340px' }}
              value={contractData.tenantAddress || ''}
              onChange={(e) => handleContractFieldChange('tenantAddress', e.target.value)}
            />
          ) : (
            <span className={styles.contractFieldVal}>{contractData.tenantAddress || '-'}</span>
          )}
        </div>

        <div className={styles.contractRow}>
          <span>โทรศัพท์</span>
          {isEditingContract ? (
            <input
              className={styles.contractInput}
              style={{ width: '140px' }}
              value={contractData.tenantPhone || ''}
              onChange={(e) => handleContractFieldChange('tenantPhone', e.target.value)}
            />
          ) : (
            <span className={styles.contractFieldVal}>{contractData.tenantPhone || '-'}</span>
          )}
        </div>

        <div className={styles.contractRow} style={{ color: '#4b5563', fontStyle: 'italic' }}>
          ซึ่งต่อไปในสัญญานี้เรียกว่า "ผู้เช่า"
        </div>

        <div className={styles.contractSectionTitle} style={{ marginTop: '1.25rem' }}>
          ทั้งสองฝ่ายตกลงทำสัญญาเช่าหอพัก โดยมีรายละเอียดดังต่อไปนี้:
        </div>

        <div className={styles.contractRow}>
          <strong>ข้อ 1 ห้องพัก:</strong> ผู้ให้เช่าตกลงให้เช่าห้องพักเลขที่
          {isEditingContract ? (
            <input
              className={styles.contractInput}
              style={{ width: '80px' }}
              value={contractData.roomNumber || ''}
              onChange={(e) => handleContractFieldChange('roomNumber', e.target.value)}
            />
          ) : (
            <span className={styles.contractFieldVal}>{contractData.roomNumber}</span>
          )}
          <span>อาคาร</span>
          {isEditingContract ? (
            <input
              className={styles.contractInput}
              style={{ width: '90px' }}
              value={contractData.building || ''}
              onChange={(e) => handleContractFieldChange('building', e.target.value)}
            />
          ) : (
            <span className={styles.contractFieldVal}>{contractData.building}</span>
          )}
          <span>ชั้น</span>
          {isEditingContract ? (
            <input
              className={styles.contractInput}
              style={{ width: '90px' }}
              value={contractData.floor || ''}
              onChange={(e) => handleContractFieldChange('floor', e.target.value)}
            />
          ) : (
            <span className={styles.contractFieldVal}>{floorLabels[contractData.floor] ?? contractData.floor}</span>
          )}
        </div>

        <div className={styles.contractRow}>
          <strong>ข้อ 2 ระยะเวลาการเช่า:</strong> กำหนดระยะเวลาเช่า ตั้งแต่วันที่
          {isEditingContract ? (
            <input
              className={styles.contractInput}
              style={{ width: '110px' }}
              value={contractData.startDate || ''}
              onChange={(e) => handleContractFieldChange('startDate', e.target.value)}
            />
          ) : (
            <span className={styles.contractFieldVal}>{contractData.startDate}</span>
          )}
          <span>ถึงวันที่</span>
          {isEditingContract ? (
            <input
              className={styles.contractInput}
              style={{ width: '110px' }}
              value={contractData.endDate || ''}
              onChange={(e) => handleContractFieldChange('endDate', e.target.value)}
            />
          ) : (
            <span className={styles.contractFieldVal}>{contractData.endDate}</span>
          )}
        </div>

        <div className={styles.contractSectionTitle}>ข้อ 3 การจองออนไลน์</div>
        <ol className={styles.contractList}>
          <li>ผู้เช่าได้ทำการจองห้องพักและชำระเงินมัดจำล่วงหน้าเรียบร้อยแล้ว</li>
          <li>เงินมัดจำจะถูกเก็บรักษาจนกว่าจะหมดสัญญาเช่าตามเงื่อนไขของทางระเบียบหอพัก</li>
        </ol>

        <div className={styles.contractSectionTitle}>ข้อ 4 ค่าเช่าและค่าประกัน</div>
        <div className={styles.contractRow}>
          <span>1. ค่าเช่าห้องพัก เดือนละ</span>
          {isEditingContract ? (
            <input
              className={styles.contractInput}
              style={{ width: '90px' }}
              value={contractData.monthlyRent || ''}
              onChange={(e) => handleContractFieldChange('monthlyRent', e.target.value)}
            />
          ) : (
            <span className={styles.contractFieldVal}>{contractData.monthlyRent}</span>
          )}
          <span>บาท</span>
        </div>
        <div className={styles.contractRow}>
          <span>2. ค่าประกันห้องพัก (เต็มจำนวน)</span>
          {isEditingContract ? (
            <input
              className={styles.contractInput}
              style={{ width: '90px' }}
              value={contractData.depositAmount || ''}
              onChange={(e) => handleContractFieldChange('depositAmount', e.target.value)}
            />
          ) : (
            <span className={styles.contractFieldVal}>{contractData.depositAmount}</span>
          )}
          <span>บาท</span>
        </div>
        <div className={styles.contractRow}>
          <span>3. ค่ามัดจำกุญแจและคีย์การ์ด</span>
          {isEditingContract ? (
            <input
              className={styles.contractInput}
              style={{ width: '90px' }}
              value={contractData.keycardDeposit || ''}
              onChange={(e) => handleContractFieldChange('keycardDeposit', e.target.value)}
            />
          ) : (
            <span className={styles.contractFieldVal}>{contractData.keycardDeposit}</span>
          )}
          <span>บาท</span>
        </div>
        <div className={styles.contractRow}>
          <span>4. ผู้เช่าตกลงชำระค่าเช่าภายในวันที่</span>
          {isEditingContract ? (
            <input
              className={styles.contractInput}
              style={{ width: '50px' }}
              value={contractData.payDueDate || ''}
              onChange={(e) => handleContractFieldChange('payDueDate', e.target.value)}
            />
          ) : (
            <span className={styles.contractFieldVal}>{contractData.payDueDate}</span>
          )}
          <span>ของทุกเดือน</span>
        </div>

        <div className={styles.contractSectionTitle}>ข้อ 5 ค่าสาธารณูปโภค</div>
        <div className={styles.contractRow}>
          <span>1. ค่าไฟฟ้า หน่วยละ</span>
          {isEditingContract ? (
            <input
              className={styles.contractInput}
              style={{ width: '60px' }}
              value={contractData.electricityRate || ''}
              onChange={(e) => handleContractFieldChange('electricityRate', e.target.value)}
            />
          ) : (
            <span className={styles.contractFieldVal}>{contractData.electricityRate}</span>
          )}
          <span>บาท</span>
        </div>
        <div className={styles.contractRow}>
          <span>2. ค่าน้ำประปา หน่วยละ</span>
          {isEditingContract ? (
            <input
              className={styles.contractInput}
              style={{ width: '60px' }}
              value={contractData.waterRate || ''}
              onChange={(e) => handleContractFieldChange('waterRate', e.target.value)}
            />
          ) : (
            <span className={styles.contractFieldVal}>{contractData.waterRate}</span>
          )}
          <span>บาท</span>
        </div>

        <div className={styles.contractSectionTitle}>ข้อ 6 การรักษาความปลอดภัยและระเบียบวินัย</div>
        <ol className={styles.contractList}>
          <li>ผู้เช่าต้องปฏิบัติตามมาตรฐานความปลอดภัยและไม่ยินยอมให้บุคคลภายนอกเข้าพักโดยไม่ลงทะเบียน</li>
          <li>การกระทำความผิดใด ๆ ที่ส่งผลกระทบต่อความสงบเรียบร้อยจะได้รับหนังสือเตือนระเบียบวินัย</li>
        </ol>

        <div className={styles.contractSignatures}>
          <div className={styles.signatureBox}>
            <div className={styles.signatureLine}></div>
            <div>ลงชื่อ ผู้ให้เช่า</div>
            <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>({contractData.landlordName})</div>
          </div>
          <div className={styles.signatureBox}>
            <div className={styles.signatureLine}></div>
            <div>ลงชื่อ ผู้เช่า</div>
            <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
              ({contractData.tenantName || 'ผู้เช่า'})
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractReview;
