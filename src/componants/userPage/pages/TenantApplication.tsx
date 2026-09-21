import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ProgressStepper from '../components/ProgressStepper/ProgressStepper';
import PersonalInformationForm from '../components/PersonalInformation/PersonalInformation';
import EmergencyContactForm from '../components/EmergencyContact/EmergencyContact';
import RoomPreferencesForm from '../components/RoomPreferences/RoomPreferences';
import DocumentUpload from '../components/DocumentUpload/DocumentUpload';
import ContractReview from '../components/ContractReview/ContractReview';
import Button from '../components/Button/Button';
import { ChevronLeft } from 'lucide-react';
import styles from './TenantApplication.module.css';
import type {
  EmergencyContact,
  PersonalInformation,
  RoomPreference,
  OcrData,
  ContractData,
} from '../types/tenant';
import { api } from '../../../services/api';
import axios from 'axios';

const steps = ['ข้อมูลส่วนตัวและผู้ติดต่อฉุกเฉิน', 'เลือกห้องพักและชำระเงิน', 'อัปโหลดเอกสาร', 'ตรวจสอบสัญญาและยื่นใบสมัคร'];

const defaultPersonalInformation: PersonalInformation = {
  fullName: '',
  studentId: '',
  course: '',
  yearLevel: '1st Year',
  contactNumber: '',
  emailAddress: '',
};

const defaultEmergencyContact: EmergencyContact = {
  emergencyName: '',
  relationship: 'Parent',
  emergencyNumber: '',
};

const defaultRoomPreference: RoomPreference = {
  preferredRoomType: 'Floor 1',
  notes: '',
};

const defaultContractData: ContractData = {
  docLocation: 'สำนักงานหอพัก Smart Dormitory',
  docDate: '',
  docMonth: '',
  docYear: '',
  landlordName: 'ผู้บริหารหอพัก Smart Dormitory',
  landlordAddress: '123/45 ถนนพหลโยธิน กรุงเทพมหานคร',
  landlordPhone: '02-123-4567',
  tenantName: '',
  tenantAge: '20',
  tenantCitizenId: '',
  tenantAddress: '',
  tenantPhone: '',
  roomNumber: '402',
  building: 'อาคาร A',
  floor: 'Floor 1',
  startDate: '',
  endDate: '',
  monthlyRent: '3,500',
  depositAmount: '3,500',
  keycardDeposit: '300',
  payDueDate: '5',
  electricityRate: '7',
  waterRate: '18',
  internetFee: '0 (ฟรี WiFi)',
  otherExpenses: '0',
  advanceNoticeDays: '30',
};

const TenantApplication = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [personalInformation, setPersonalInformation] = useState(defaultPersonalInformation);
  const [emergencyContact, setEmergencyContact] = useState(defaultEmergencyContact);
  const [roomPreference, setRoomPreference] = useState(defaultRoomPreference);
  
  // Track document upload files
  const [idCardFile, setIdCardFile] = useState<File | null>(null);
  const [paymentSlipFile, setPaymentSlipFile] = useState<File | null>(null);
  const [idCardImagePath, setIdCardImagePath] = useState<string>('');
  const [paymentSlipPath, setPaymentSlipPath] = useState<string>('');

  const [ocrData, setOcrData] = useState<OcrData>({});
  const [contractData, setContractData] = useState<ContractData>(defaultContractData);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const validateStep = () => {
    const nextErrors: Record<string, string> = {};

    if (activeStep === 0) {
      // Validate Personal Information
      if (!personalInformation.fullName.trim()) nextErrors.fullName = 'กรุณากรอกชื่อ-นามสกุล';
      if (!personalInformation.studentId.trim()) nextErrors.studentId = 'กรุณากรอกรหัสนักศึกษา';
      if (!personalInformation.course.trim()) nextErrors.course = 'กรุณากรอกหลักสูตร';
      if (!personalInformation.yearLevel) nextErrors.yearLevel = 'กรุณาเลือกชั้นปี';
      if (!personalInformation.contactNumber.trim()) nextErrors.contactNumber = 'กรุณากรอกเบอร์โทรศัพท์';
      if (!personalInformation.emailAddress.trim()) nextErrors.emailAddress = 'กรุณากรอกอีเมล';

      // Validate Emergency Contact
      if (!emergencyContact.emergencyName.trim()) nextErrors.emergencyName = 'กรุณากรอกชื่อผู้ติดต่อฉุกเฉิน';
      if (!emergencyContact.relationship) nextErrors.relationship = 'กรุณาเลือกความสัมพันธ์';
      if (!emergencyContact.emergencyNumber.trim()) nextErrors.emergencyNumber = 'กรุณากรอกเบอร์ติดต่อฉุกเฉิน';
    }

    if (activeStep === 1) {
      if (!roomPreference.preferredRoomType) {
        nextErrors.preferredRoomType = 'กรุณาเลือกชั้นห้องพัก';
      } else if (!roomPreference.roomNumber && !roomPreference.isRandomRoom) {
        nextErrors.roomNumber = 'กรุณาคลิกเลือกห้องพักที่ต้องการ หรือติ๊กให้ระบบสุ่มห้องว่างให้อัตโนมัติ';
      }
    }

    if (activeStep === 2) {
      if (!idCardImagePath || !paymentSlipPath) {
        nextErrors.documents = 'กรุณากดอัปโหลดและตรวจสอบเอกสารหลักฐานให้เรียบร้อยก่อนเข้าร่วมขั้นตอนถัดไป';
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      if (activeStep === 1) {
        const floorMatch = (roomPreference.preferredRoomType || '').match(/\d+/);
        const floorStr = floorMatch ? floorMatch[0] : '1';
        const rentMap: Record<string, string> = { '1': '3500', '2': '4200', '3': '4900', '4': '5600' };
        const rent = rentMap[floorStr] || '3500';
        setContractData((prev) => ({
          ...prev,
          floor: floorStr,
          roomNumber: roomPreference.roomNumber || (roomPreference.isRandomRoom ? 'จัดสรรอัตโนมัติ' : ''),
          monthlyRent: rent,
          depositAmount: rent,
        }));
      }
      setActiveStep((prev) => Math.min(prev + 1, steps.length - 1));
    }
  };

  const handleBack = () => {
    setErrors({});
    setActiveStep((prev) => Math.max(prev - 1, 0));
  };

  // Called when Documents are successfully uploaded
  const handleUploadSuccess = (data: { idCardImagePath: string; paymentSlipPath: string; ocrData: OcrData }) => {
    setIdCardImagePath(data.idCardImagePath);
    setPaymentSlipPath(data.paymentSlipPath);
    setOcrData(data.ocrData);
    setErrors({});
    
    // Autoslides to Step 4 (index 3) when checked
    setActiveStep(3);
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const payload = {
        personalInformation,
        emergencyContact,
        roomPreference,
        ocrData,
        idCardImagePath,
        paymentSlipPath,
        contractData,
      };

      const response = await api.post('/tenants/apply', payload);

      if (response.data?.statusCode === 200 || response.data?.statusCode === 201 || response.status === 200 || response.status === 201) {
        navigate('/student', { replace: true, state: { applicationSubmitted: true } });
      } else {
        setSubmitError(response.data?.message || 'ไม่สามารถยื่นใบสมัครได้');
      }
    } catch (err: unknown) {
      console.error('Submit application error:', err);
      const message = axios.isAxiosError<{ message?: string }>(err)
        ? err.response?.data?.message
        : undefined;
      setSubmitError(message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูลใบสมัครลงฐานข้อมูล กรุณาลองใหม่อีกครั้ง');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.pageWrapper}>
      <a href="/student">
        <ChevronLeft className={styles.backIcon} />
      </a>
      <div className={styles.panel}>
        <div className={styles.header}>
          <p className={styles.caption}>ใบสมัครผู้เช่าหอพัก</p>
          <h1>เริ่มต้นสมัครเข้าพัก</h1>
          <p className={styles.description}>
            ลงทะเบียนข้อมูลผู้เช่าหอพัก คัดแยกเอกสารสัญญาสะสม และลงทะเบียนเช่าหอพักระบบออนไลน์
          </p>
        </div>

        <ProgressStepper activeStep={activeStep} steps={steps} />

        <div className={styles.formCard}>
          {activeStep === 0 && (
            <div style={{ display: 'grid', gap: '1.5rem' }}>
              <PersonalInformationForm
                data={personalInformation}
                onChange={setPersonalInformation}
                errors={errors}
              />
              <EmergencyContactForm
                data={emergencyContact}
                onChange={setEmergencyContact}
                errors={errors}
              />
            </div>
          )}
          {activeStep === 1 && (
            <RoomPreferencesForm data={roomPreference} onChange={setRoomPreference} error={errors.roomNumber || errors.preferredRoomType} />
          )}
          {activeStep === 2 && (
            <DocumentUpload
              idCardFile={idCardFile}
              setIdCardFile={setIdCardFile}
              paymentSlipFile={paymentSlipFile}
              setPaymentSlipFile={setPaymentSlipFile}
              onUploadSuccess={handleUploadSuccess}
            />
          )}
          {activeStep === 3 && (
            <ContractReview
              personalInformation={personalInformation}
              emergencyContact={emergencyContact}
              roomPreference={roomPreference}
              ocrData={ocrData}
              contractData={contractData}
              onUpdateContractData={setContractData}
            />
          )}

          <div className={styles.actionRow}>
            <Button
              type="button"
              variant="secondary"
              onClick={handleBack}
              disabled={activeStep === 0 || submitting}
            >
              ย้อนกลับ
            </Button>
            {activeStep < steps.length - 1 ? (
              <Button
                type="button"
                variant="primary"
                onClick={handleNext}
                disabled={activeStep === 2 && (!idCardFile || !paymentSlipFile)}
              >
                ขั้นตอนถัดไป
              </Button>
            ) : (
              <Button type="button" variant="primary" onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'กำลังบันทึกข้อมูล...' : 'ยื่นใบสมัคร'}
              </Button>
            )}
          </div>
          {errors.documents && <p className={styles.errorText}>{errors.documents}</p>}
          {submitError && <p className={styles.errorText}>{submitError}</p>}
        </div>
      </div>
    </div>
  );
};

export default TenantApplication;
