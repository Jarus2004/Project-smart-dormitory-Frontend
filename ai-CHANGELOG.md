# AI Change Log — 2026-09-04 (Part 2)

## 2026-09-05 — Student billing payment integration

- เพิ่ม `StudentBilling.tsx` และ CSS module สำหรับรายการบิล, QR, upload slip และสถานะการตรวจสอบ
- เพิ่ม API methods `getPaymentQr` และ `uploadBillSlip` ใน `src/modules/shared/apiService.ts`
- เพิ่ม route `/student/billing` และเมนูจาก `StudentHome.tsx`
- ใช้ `responseType: 'blob'` สำหรับ QR และสร้าง `Idempotency-Key` ต่อการส่ง slip

### Verification

- `npm run build` ผ่าน
- `npm test` ผ่าน 2/2
- QR route ฝั่ง backend ตอบ `502` ตาม provider failure หลังตรวจพบ Thunder ตอบ `403 application_expired`

## 2026-09-06 — Admin payment review and test data cleanup

- เอาปุ่มยืนยัน/ยกเลิกชำระเงินด้วยมือออกจากหน้า Admin
- เพิ่ม UI ดูผลตรวจและรายละเอียดสลิปผ่าน endpoint ที่ต้องใช้สิทธิ์ ADMIN
- ล้างข้อมูลทดสอบเฉพาะบิล `#13` และ `#14` หลังตรวจสอบกับ Backend แล้ว

### Verification

- Frontend build ผ่าน
- Frontend tests ผ่าน 2/2

## 2. Floor & Room Selection Grid (4 Floors x 30 Rooms per Floor)

### Overview

ปรับปรุงหน้าจอขั้นตอนการสมัครหอพัก ขั้นตอนที่ 2 (RoomPreferences.tsx) เพิ่มการเลือกชั้น และผังแสดงห้องพัก 30 ห้องต่อชั้น (แถวละ 5 ห้อง ยาวลงมา 6 แถว) พร้อมระบบคลิกเลือกห้อง และ Checkbox สุ่มห้องว่างอัตโนมัติ

### Files Changed

#### RoomPreferences.tsx

- Dropdown เลือกชั้น (ชั้น 1–4)
- Checkbox "ไม่ระบุห้อง (ให้ระบบจัดสรรห้องว่างให้อัตโนมัติ)"
- ผังห้องพัก 30 ห้อง (5 คอลัมน์ x 6 แถว) แยกตามชั้น
- ดึงข้อมูลห้องจริงจาก Backend เพื่อแสดงสถานะว่าง/เต็ม
- คำนวณเงินมัดจำและ PromptPay QR ตามชั้นและห้องที่เลือก

#### RoomPreferences.module.css

- เพิ่มสไตล์ CSS สำหรับ .roomGrid (5 คอลัมน์), .roomCard, .roomCardSelected, .roomCardDisabled, .checkboxContainer

#### TenantApplication.tsx

- ส่งต่อเลขห้องที่เลือกไปยังหน้าตรวจสอบสัญญาเช่า (Step 4)

#### ypes/tenant.ts

- เพิ่ม
  oomNumber?: string และ isRandomRoom?: boolean ใน RoomPreference

### Verification

- pm run build ผ่าน 0 TypeScript errors (3,733 modules transformed) ✅

---

# AI Change Log — 2026-09-04

## 1. Billing Management Page — Complete Redesign

### Overview

ออกแบบหน้าจัดการบิลค่าน้ำค่าไฟใหม่ทั้งหมด แทนหน้า Income-and-Expenses เดิมที่เป็น mock data ระบบใหม่เชื่อมต่อกับ Backend API จริง

### Files Changed

#### `IncomeAndExpensesPage.tsx` (Redesigned from scratch)

- **Summary Cards Section:** แสดง 4 card (UNPAID, VERIFYING, PAID, OVERDUE) จาก API จริง
- **Quick Bill Generator Form:**
  - Input: เลขห้อง, หน่วยไฟ, เดือน, ปี, วันครบกำหนด (optional)
  - Live Preview: คำนวณค่าไฟ (electricUnits × 8), ค่าน้ำ (100), ค่าเช่า, ยอดรวม, และแสดงส่วนแบ่งต่อหัว
  - ปุ่ม Generate Bills ส่งข้อมูลไปยัง `POST /api/billing/generate-room-bill`
- **Bills Table:**
  - แสดงข้อมูล: ชื่อผู้เช่า, ห้อง, ยอด, สถานะ, วันครบกำหนด, วันที่ชำระ
  - Filter: เดือน / สถานะ
  - ปุ่มลบ (ADMIN) ส่งไปยัง `DELETE /api/billing/:id`
- **Monthly History Tabs:** เลือกดูบิลแยกตามเดือน (3 เดือนล่าสุด)

#### `IncomeAndExpensesPage.module.css` (Redesigned)

- Dark glassmorphism theme สอดคล้องกับ Admin Dashboard
- Summary cards ด้วย gradient สี 4 สถานะ
- Live preview panel, table styles, filter bar

#### `src/services/adminApi.ts`

- เพิ่ม `getRoomBillingInfo(roomNumber: string)`
- เพิ่ม `generateRoomBill(dto: {...})`
- เพิ่ม `deleteBill(id: string)`

#### `src/componants/addminpage/layouts/DashboardLayout.tsx`

- เปลี่ยน navigation label จาก "รายรับ-รายจ่าย" → **"จัดการบิล / ค่าน้ำค่าไฟ"**
- เปลี่ยน icon เป็น `Receipt`

### Business Rules Applied

| Rule         | Value                               |
| ------------ | ----------------------------------- |
| ค่าไฟ        | 8 บาท / หน่วย                       |
| ค่าน้ำ       | 100 บาท / ห้อง                      |
| การหาร       | หารด้วย Active tenants จริงเท่านั้น |
| กรณีห้องว่าง | แสดง error ไม่สร้างบิล              |

### Verification

- `npm run build` ผ่าน 0 TypeScript errors, 3733 modules transformed ✅

---

# AI-CHANGELOG

## 2026-08-08 — Frontend Monitor Face Detection

- เปลี่ยน `MonitorPage.tsx` ไปใช้ `@tensorflow-models/blazeface` แทน browser native `FaceDetector` / MediaPipe
- เพิ่ม overlay canvas วาด bounding box บน video preview
- เพิ่ม UI panel แสดงค่า `x/y/w/h` ของ bounding box แบบสด ๆ
- ปรับ `flipHorizontal` ให้เป็น `false` เพื่อลดปัญหาการ mirror ที่ไม่ตรงกับ webcam feed
- ยืนยันการแก้ไขด้วย `bun run build`
