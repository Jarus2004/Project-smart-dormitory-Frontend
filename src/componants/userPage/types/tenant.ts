export type YearLevel = '1st Year' | '2nd Year' | '3rd Year' | '4th Year' | '5th Year';
export type RelationshipOption = 'Parent' | 'Guardian' | 'Sibling' | 'Relative' | 'Other';
export type RoomTypeOption = 'Floor 1' | 'Floor 2' | 'Floor 3' | 'Floor 4' | 'Any Floor';

export interface PersonalInformation {
  fullName: string;
  studentId: string;
  course: string;
  yearLevel: YearLevel;
  contactNumber: string;
  emailAddress: string;
}

export interface EmergencyContact {
  emergencyName: string;
  relationship: RelationshipOption;
  emergencyNumber: string;
}

export interface RoomPreference {
  preferredRoomType: RoomTypeOption;
  roomNumber?: string;
  isRandomRoom?: boolean;
  notes: string;
}

export interface UploadedDocument {
  name: string;
  size: number;
  type: string;
}

export interface OcrData {
  verificationId?: number;
  citizenId?: string;
  fullNameTh?: string;
  birthDateTh?: string;
  address?: string;
  isThaiIdCard?: boolean;
  age?: number;
}

export interface ContractData {
  docLocation: string;
  docDate: string;
  docMonth: string;
  docYear: string;
  landlordName: string;
  landlordAddress: string;
  landlordPhone: string;
  tenantName: string;
  tenantAge: string;
  tenantCitizenId: string;
  tenantAddress: string;
  tenantPhone: string;
  roomNumber: string;
  building: string;
  floor: string;
  startDate: string;
  endDate: string;
  monthlyRent: string;
  depositAmount: string;
  keycardDeposit: string;
  payDueDate: string;
  electricityRate: string;
  waterRate: string;
  internetFee: string;
  otherExpenses: string;
  advanceNoticeDays: string;
}

export interface TenantApplicationForm {
  personalInformation: PersonalInformation;
  emergencyContact: EmergencyContact;
  roomPreference: RoomPreference;
  documents: UploadedDocument[];
  ocrData?: OcrData;
  contractData?: ContractData;
  idCardImagePath?: string;
  paymentSlipPath?: string;
}
