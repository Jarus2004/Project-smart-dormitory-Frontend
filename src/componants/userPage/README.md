# โมดูลแบบฟอร์มสมัครผู้เช่าหอพัก

โฟลเดอร์นี้ประกอบด้วยฟอร์มสมัครผู้เช่าหอพักแบบหลายขั้นตอนที่สร้างด้วย React + TypeScript และ CSS Modules.

## โครงสร้างโฟลเดอร์

- `components/`
  - `Button/` — ปุ่มที่ใช้ซ้ำได้.
  - `ProgressStepper/` — แถบแสดงความก้าวหน้าแบบแนวนอนพร้อมสถานะแต่ละขั้นตอน.
  - `PersonalInformation/` — ฟอร์มขั้นตอนที่ 1 สำหรับข้อมูลส่วนตัว.
  - `EmergencyContact/` — ฟอร์มขั้นตอนที่ 2 สำหรับข้อมูลผู้ติดต่อฉุกเฉิน.
  - `RoomPreferences/` — ฟอร์มขั้นตอนที่ 3 สำหรับการเลือกห้องและหมายเหตุ.
  - `DocumentUpload/` — ฟอร์มขั้นตอนที่ 4 สำหรับการอัปโหลดเอกสาร.
- `pages/`
  - `TenantApplication.tsx` — คอนเทนเนอร์หน้าที่จัดการสถานะขั้นตอน การตรวจสอบ และการส่งข้อมูล.
- `types/`
  - `tenant.ts` — interface และ type union ของข้อมูลฟอร์ม.

## คำจำกัดความประเภท (`types/tenant.ts`)

- `YearLevel` — union type สำหรับ `1st Year` ถึง `5th Year`.
- `RelationshipOption` — union type สำหรับความสัมพันธ์ของผู้ติดต่อฉุกเฉิน.
- `RoomTypeOption` — union type สำหรับตัวเลือกชั้นห้อง.
- `PersonalInformation` — ฟิลด์ขั้นตอนที่ 1: ชื่อ-นามสกุล, รหัสนักศึกษา, คณะ, ปีการศึกษา, เบอร์โทร, อีเมล.
- `EmergencyContact` — ฟิลด์ขั้นตอนที่ 2: ชื่อผู้ติดต่อฉุกเฉิน, ความสัมพันธ์, เบอร์โทร.
- `RoomPreference` — ฟิลด์ขั้นตอนที่ 3: ประเภทห้องที่ต้องการ และหมายเหตุเพิ่มเติม.
- `UploadedDocument` — ข้อมูลเมตาของไฟล์ที่อัปโหลด.
- `TenantApplicationForm` — payload ของฟอร์มแบบสมบูรณ์รวมทุกขั้นตอน.

## คอมโพเนนต์

### `Button/` (`Button.tsx`)
- ปุ่มที่ใช้งานซ้ำได้ โดยใช้ CSS Modules.
- รองรับ variant: `primary`, `secondary`, `ghost`.
- ใช้ `ReactNode` สำหรับ children และรับ props: `type`, `onClick`, `disabled`.

### `ProgressStepper/` (`ProgressStepper.tsx`)
- แสดงความก้าวหน้าของขั้นตอนปัจจุบันพร้อมเปอร์เซ็นต์.
- มีแถบโหลดสีเต็มและวงกลมแต่ละขั้นตอน.
- ตรรกะสถานะขั้นตอน:
  - `completed` สำหรับขั้นตอนก่อนหน้า
  - `active` สำหรับขั้นตอนปัจจุบัน
  - `pending` สำหรับขั้นตอนถัดไป
- ใช้ CSS class ในการจัดสไตล์สถานะต่าง ๆ.

### `PersonalInformation/` (`PersonalInformation.tsx`)
- ฟอร์มขั้นตอนที่ 1 สำหรับข้อมูลส่วนตัวของผู้สมัคร.
- ใช้ controlled input ผูกกับ object `PersonalInformation`.
- แสดงข้อความ validation ใต้ช่องกรอกข้อมูล.
- ฟิลด์:
  - Full Name
  - Student ID
  - Course
  - Year Level
  - Contact Number
  - Email Address

### `EmergencyContact/` (`EmergencyContact.tsx`)
- ฟอร์มขั้นตอนที่ 2 สำหรับข้อมูลผู้ติดต่อฉุกเฉิน.
- ฟีลด์ควบคุมผูกกับ object `EmergencyContact`.
- แสดงข้อผิดพลาดการตรวจสอบใต้แต่ละช่อง.
- ฟิลด์:
  - Emergency Contact Name
  - Relationship
  - Emergency Contact Number

### `RoomPreferences/` (`RoomPreferences.tsx`)
- ฟอร์มขั้นตอนที่ 3 สำหรับการเลือกความต้องการห้องพัก.
- มีบัตรข้อมูลแสดงราคาตามแต่ละชั้น.
- มีฟิลด์เลือกประเภทห้องและ textarea สำหรับหมายเหตุเพิ่มเติม.

### `DocumentUpload/` (`DocumentUpload.tsx`)
- ฟอร์มขั้นตอนที่ 4 เป็นบัตรอัปโหลดไฟล์สไตล์ drag-and-drop.
- รองรับไฟล์ PDF, JPG, PNG.
- กำหนดขนาดไฟล์สูงสุด 10 MB ต่อไฟล์.
- แสดงรายการเอกสารที่ต้องการและรายการไฟล์ที่อัปโหลดแล้ว.
- เรียก callback `onAddDocument` และ `onRemoveDocument` เพื่ออัปเดตสถานะใน parent.

## หน้าเพจหลัก (`pages/TenantApplication.tsx`)

คอมโพเนนต์นี้จัดการ workflow แบบหลายขั้นตอนทั้งหมด:

- ใช้ `useState` สำหรับ:
  - `activeStep` — ดัชนีขั้นตอนปัจจุบัน.
  - `personalInformation`, `emergencyContact`, `roomPreference`, `documents`.
  - `errors` — ข้อความตรวจสอบ.
  - `submitted` — สถานะส่งฟอร์มสำเร็จ.
- ใช้ `useMemo` เพื่อสร้าง `formData` จาก state ของแต่ละขั้นตอน.
- ใช้ `useEffect` เพื่อ log payload เมื่อส่งฟอร์มสำเร็จ.
- มีฟังก์ชัน `validateStep()` เพื่อตรวจสอบฟิลด์ที่จำเป็นของแต่ละขั้นตอน.
- มีปุ่ม `handleNext()`, `handleBack()`, `handleSubmit()` สำหรับการนำทาง.
- แสดงคอมโพเนนต์ขั้นตอนที่เหมาะสมตาม `activeStep`.
- แสดงข้อความสำเร็จเมื่อส่งฟอร์มเรียบร้อย.

### ลำดับขั้นตอน

1. **Personal Information**
2. **Emergency Contact**
3. **Room Preferences**
4. **Document Upload**

หน้าเพจเก็บข้อมูลระหว่างขั้นตอน และเลื่อนไปขั้นตอนถัดไปได้เมื่อ validation ของขั้นตอนปัจจุบันผ่านเท่านั้น.

## การจัดสไตล์

- ทุกคอมโพเนนต์ใช้ CSS Modules เพื่อแยกสไตล์แต่ละไฟล์.
- ใช้โทนสีหลักเป็นสีเขียว-ฟ้า (#6CB6B1).
- รองรับ responsive ด้วย media query ในแต่ละไฟล์ CSS.

## การใช้งาน

นำโมดูลนี้ไปใช้ในแอปด้วยการ import และ render `TenantApplication`:

```tsx
import TenantApplication from './componants/userPage/pages/TenantApplication';

function App() {
  return <TenantApplication />;
}

export default App;
```

## หมายเหตุ

- ปัจจุบันฟอร์มจะ log payload ลงคอนโซลเมื่อกดส่ง.
- validation ทำงานเป็นขั้นตอนและป้องกันไม่ให้เลื่อนไปขั้นตอนถัดไปเมื่อฟิลด์จำเป็นยังว่าง.
- ส่วนอัปโหลดไฟล์ตอนนี้ใช้ input file ปกติ และยังไม่ได้เพิ่มการลากแล้ววางแบบเต็มรูปแบบ.
