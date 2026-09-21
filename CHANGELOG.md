# CHANGELOG.md - Smart Dormitory Frontend

## [Unreleased]

### 2026-09-09 — Admin notification history and unread indicator

- เพิ่มกระดิ่งแจ้งเตือนใน Dashboard header สำหรับผู้ใช้ role `ADMIN` เท่านั้น
- เพิ่ม realtime Toast และรายการแจ้งเตือนจาก Socket.IO สำหรับบิล, แจ้งซ่อม, ผู้มาติดต่อ, ประตู และปัญหาการเชื่อมต่อ
- เพิ่มการโหลด notification history จาก backend และเก็บ realtime events ใน browser ข้าม refresh สูงสุด 24 ชั่วโมง
- เปลี่ยน badge เป็นจุดแดงสำหรับรายการที่ยังไม่อ่าน และปุ่ม “อ่านทั้งหมด” จะซ่อนจุดแดงโดยไม่ลบข้อมูล
- เอาปุ่มกากบาทออกจากรายการในกระดิ่ง และให้ Toast ปิดชั่วคราวโดยไม่ลบประวัติ
- ปิดเมนูกระดิ่งเมื่อคลิกพื้นที่ด้านนอก และล้าง listener/timer ครบเมื่อ component ถูกถอดออก
- กรอง heartbeat และ background requests ไม่ให้สร้าง success toast; mutation ที่สำคัญแสดงข้อความ action โดยตรง
- เพิ่มข้อความแจ้งเตือนแยกสำหรับ Internet, API server และ Socket.IO connection errors
- ตรวจสอบแล้ว: ESLint ผ่าน, frontend build ผ่าน และ frontend tests ผ่าน `2/2`# CHANGELOG.md - Smart-Dormitory-Management-System

## [Unreleased]

### 2026-09-09 — Visitor management, lazy loading, and payment-flow hardening

- เพิ่มหน้า Admin ผู้มาติดต่อที่ `/visitors` สำหรับค้นหา กรองสถานะ อนุมัติ/ปฏิเสธ และบันทึก Check-in / Check-out
- เพิ่มการเชื่อมหน้า Visitors เข้ากับเมนูและ Monitor พร้อมปรับ routing ให้โหลดหน้าหลักแบบ lazy loading และมี loading fallback
- ปรับ Student Billing Batch ให้รองรับผล `MANUAL_REVIEW`, สร้าง QR สำเร็จก่อนเข้าสู่ขั้นตอนชำระเงิน และหยุด polling อย่างถูกต้องเมื่อ component ถูกถอดออก
- เชื่อม PromptPay QR ในขั้นตอนเลือกห้องกับหมายเลข PromptPay จาก `VITE_PROMPTPAY_NUMBER` แทนค่าที่ฝังตายตัว
- ปรับการแสดงข้อผิดพลาดของ Payment Gateway และ flow authentication ให้สอดคล้องกับการยืนยันตัวตนผ่าน cookie

### 2026-09-06 — Admin payment review and test data cleanup

- เอาปุ่มยืนยัน/ยกเลิกชำระเงินด้วยมือออกจากหน้า Admin เพราะสถานะต้องมาจากระบบตรวจสลิปอัตโนมัติ
- เพิ่มปุ่มดูผลตรวจและรายละเอียดสลิปสำหรับ Admin
- รีเฟรชข้อมูลหลังล้างบิลทดสอบ `#13` และ `#14`

### 2026-09-06 — Multi-bill payment selection and verification result flow

- ปรับหน้า Student Billing ให้เลือกหลายบิลและรวมยอดจ่ายครั้งเดียว
- เพิ่มหน้ารายละเอียดแยกค่าเช่า ค่าไฟ ค่าน้ำ และค่าปรับ พร้อมยอดรวม
- เพิ่ม QR เดียวสำหรับ PaymentBatch และแสดงข้อมูลบัญชีจาก backend
- เพิ่ม upload slip, polling status และหน้าผลลัพธ์ไอคอนสำเร็จ/ไม่สำเร็จ
- Frontend build และ tests ผ่าน

### 2026-09-05 — Student billing payment flow

- เพิ่มหน้า `/student/billing` สำหรับดูบิลและสถานะการชำระเงิน
- เพิ่มการแสดง PromptPay QR จาก `GET /api/billing/:id/payment-qr` โดยใช้ยอดจาก Bill จริง
- เพิ่มการเลือกและอัปโหลด slip ไปยัง `POST /api/billing/:id/upload-slip` พร้อม `Idempotency-Key`
- เพิ่มสถานะ `UNPAID`, `OVERDUE`, `VERIFYING`, `PAID` และ `FAILED` ในหน้า Student Billing
- เพิ่มเมนูค่าใช้จ่ายและการชำระเงินในหน้า Student Home
- ตรวจสอบแล้ว: frontend build และ tests ผ่าน
- ข้อจำกัดปัจจุบัน: การสร้าง QR จริงยังรอ Thunder API key/application ใหม่ เนื่องจาก provider ตอบ `403 application_expired`

### 2026-09-04 — Floor and Room Selection Grid (30 rooms per floor)

- ปรับปรุงขั้นตอนการสมัครหอพัก ขั้นตอนที่ 2 (`RoomPreferences.tsx`)
- เพิ่ม Dropdown เลือกชั้น (ชั้น 1–4)
- เพิ่มผังห้องพัก 30 ห้องต่อชั้น (แถวละ 5 ห้อง ยาวลงมา 6 แถว)
- เพิ่มกล่องห้องพร้อมแสดงสถานะ "ว่าง (คลิกได้)" และ "เต็ม (คลิกไม่ได้)"
- เพิ่ม Checkbox "ไม่ระบุห้อง (ให้ระบบจัดสรรห้องว่างให้อัตโนมัติ)" สำหรับสุ่มห้องว่างบนชั้นนั้นให้อัตโนมัติ
- คำนวณเงินมัดจำและสร้าง PromptPay QR Code อัตโนมัติตามชั้นและห้องที่เลือก
- ส่งต่อเลขห้องที่เลือกไปยังหน้าตรวจสอบสัญญาเช่า (Step 4) อย่างถูกต้อง
- Frontend build ผ่านสำเร็จ 0 TypeScript errors

### 2026-09-04 — Billing management page: automatic utility bill generation and split per tenant

- ออกแบบหน้า `จัดการบิล / ค่าน้ำค่าไฟ` ใหม่ทั้งหมด แทนหน้า Income-and-Expenses เดิม
- เพิ่ม Summary Cards แสดงสถิติบิล: รอชำระ, กำลังตรวจสอบ, ชำระแล้ว, เกินกำหนด
- เพิ่มฟอร์ม Quick Bill Generator: กรอกเลขห้อง / หน่วยไฟ / เดือน-ปี พร้อม Live Preview ก่อนออกบิล
- คำนวณค่าไฟ **8 บาท/หน่วย** และค่าน้ำ **100 บาท/ห้อง** หารตามจำนวน Active tenants จริง
- เพิ่มตารางบิลพร้อม filter สถานะ / เดือน, ปุ่มลบบิล และแสดงผู้ชำระเงิน
- เพิ่ม Monthly history tabs สำหรับดูประวัติบิลแยกตามเดือน
- อัพเดท navigation sidebar: เปลี่ยนชื่อ menu เป็น `จัดการบิล / ค่าน้ำค่าไฟ` พร้อม Receipt icon
- เพิ่ม API functions ใน `adminApi.ts`: `getRoomBillingInfo`, `generateRoomBill`, `deleteBill`
- ออกแบบ CSS ใหม่ด้วย dark glassmorphism theme: gradient cards, hover effects, smooth transitions
- Frontend build ผ่านสำเร็จ 0 TypeScript errors ✅

### 2026-09-02 — Face recognition multi-face prioritization, face cropping, and student portal UI balance

- พัฒนาระบบตรวจจับใบหน้าใน MonitorPage.tsx ให้รองรับหลายใบหน้าพร้อมกัน (Multi-face detection) โดยคำนวณขนาดพื้นที่ Bounding Box เพื่อจัดลำดับประมวลผลใบหน้าที่อยู่ใกล้กล้องที่สุดก่อน
- เพิ่มการตัดภาพเฉพาะกรอบใบหน้า (Face Cropping) บน Canvas ก่อนส่งไปยัง Backend API เพื่อเพิ่มความแม่นยำในการรู้จำใบหน้า
- ปรับปรุงสถานะกรอบใบหน้าแบบ Real-time (เขียว = ผ่าน / แดง = ปฏิเสธการเข้าถึง) สอดคล้องกับ Denial-by-Default Policy
- ปรับแต่ง UI หน้า Student Home และ Student Documents: นำพื้นหลังและเงาสีเข้มที่ไม่จำเป็นออก และจัดระเบียบ Padding/Margin ฝั่งซ้าย-ขวาให้สมดุลเท่ากันทั้งสองด้าน

### 2026-09-01 — Real admin dashboard and embedded Grafana observability

- เปลี่ยนหน้า Admin Dashboard ให้ใช้ข้อมูลจริงจาก backend แทน mock/debug data
- เพิ่มการดึงข้อมูล bills จริงใน `DashboardContext` และคำนวณภาพรวมการเงินจากข้อมูลบิล
- เพิ่มกราฟยอดชำระ/ค้างชำระรายเดือนจากข้อมูลจริง พร้อม empty state เมื่อยังไม่มีข้อมูลบิล
- เพิ่ม Business Health panel สำหรับอัตราเข้าพัก ห้องว่าง งานซ่อมค้าง นักศึกษาใช้งานอยู่ และผู้ใช้ออนไลน์
- เพิ่ม System Health panel สำหรับตรวจ backend health, metrics readiness, metric families และ latency check
- ฝัง Grafana dashboard ในหน้า Admin Dashboard ด้วย iframe เพื่อดูกราฟจาก Prometheus ได้ในหน้าเว็บโดยไม่ต้องเปิดหน้าใหม่
- ตั้งค่า `VITE_GRAFANA_URL=http://localhost:3003` และ `VITE_PROMETHEUS_URL=http://localhost:9091` ใน local `.env` และ `.env.example`
- ปรับ dashboard ให้เหลือปุ่มเปิด Grafana เต็มหน้าเป็นทางเลือกสำรอง และไม่ฝัง Prometheus UI ตรงๆ เพื่อความปลอดภัย
- เพิ่มปุ่มออกจากระบบใน Admin Dashboard sidebar โดยเรียก `AuthContext.logout()` และ redirect ไป `/login`
- เพิ่มการแสดง error ที่ละเอียดขึ้นสำหรับ maintenance status/delete failure
- เพิ่มระบบ viewed state สำหรับจุดแดงแจ้งเตือนรายการแจ้งซ่อมใหม่ และปรับ UI แจ้งซ่อมให้กระชับขึ้น
- ยืนยันแล้วว่า frontend production build ผ่านสำเร็จ

### 2026-08-28 — แปลข้อความที่ผู้ใช้มองเห็นในโฟลเดอร์ componants เป็นภาษาไทย ครอบคลุม

-เมนูแอดมิน แท็บ ปุ่ม หัวข้อ ตาราง และตัวกรอง
-หน้า Dashboard, จัดการห้องพัก, นักศึกษา, แจ้งซ่อม และสัญญาหอพัก
-แบบฟอร์มสมัครเข้าพัก ข้อมูลส่วนตัว ผู้ติดต่อฉุกเฉิน เลือกห้อง อัปโหลดเอกสาร และตรวจสอบสัญญา
-หน้า Student Home, Student Documents และ Student Maintenance
-ข้อความ loading, empty state, error, placeholder และสถานะต่าง ๆ
-ข้อมูลจำลองใน mockData.ts
-เพิ่มการแปล enum/status เฉพาะตอน render โดยไม่เปลี่ยนค่า logic, filter, route หรือ API
ไฟล์และfolderที่เกี่ยวข้องหลัก:

#### addminpage

-ActivityFeed.tsx
-ChartCard.tsx
-DataTable.tsx
-FilterDropdown.tsx
-MaintenanceCard.tsx
-RoomCard.tsx
-DashboardContext.tsx
-DashboardLayout.tsx
-AdminPanelPage.tsx
-AgreementsPage.tsx
-DashboardPage.tsx
-MaintenancePage.tsx
-RoomManagementPage.tsx
-StudentsPage.tsx
-mockData.ts

#### homepage

-Footer.tsx
-navbar.tsx

#### userPage

-ContractReview.tsx
-DocumentUpload.tsx
-EmergencyContact.tsx
-PersonalInformation.tsx
-ProgressStepper.tsx
-RoomPreferences.tsx
-StudentDocuments.tsx
-StudentMaintenance.tsx
-TenantApplication.tsx

### 2026-08-25 — Multi-angle Student Face Registration & Real-Time Monitoring Overhaul

- **Student Face Registration Wizard Page (`UserIdentityFlowPage.tsx`):**
  - รวมการแสดงขั้นตอนการถิายรูป 5 มุม มาเป็นโครงสร้าง Wizard คอลัมน์เดี่ยวกึ่งกลางที่สะอ้านและคลีน
  - กล่องแสดงภาพกล้องเป็นรูปวงกลมพรีเมียมขนาดใหญ่ (340px) พร้อมขอบสีเขียวและมีเส้นเป้ากึ่งกลาง
  - แก้ไขปัญหากล้องดับขณะสลับสล๊อตการสแกนใบหน้าโดยเปลี่ยนเป็น Single-Stream คอลัมน์เดียว และเรนเดอร์แท็ก Video แบบ Unconditional ใน DOM เพื่อตัดปัญหา Timing race condition ของ React Ref
  - แสดงผลภาพขนาดย่อ (Thumbnails Progress Timeline) ด้านล่าง ที่ระบุผลการถ่าย 5 มุมอย่างเรียบง่าย และกดแก้ไขเพื่อถ่ายซ่อมช่องเฉพาะเจาะจงได้ทันที
  - ลบตัวแปรนำเข้าที่ล้นออกเพื่อไม่ให้เกิดข้อผิดพลาดในการรันคอมไพล์ TypeScript
- **Admin Face Monitoring Engine (`MonitorPage.tsx`):**
  - เปลี่ยนรูปแบบเวลายื่นสไลด์ของกล้องจากแบบ Polling 2 วินาที มาเป็น local face detection โดยใช้ BlazeFace ตรวจหารูปใบหน้าผู้เช่าจากฝั่ง Client ทุกๆ 100ms
  - ส่งใบหน้าประมวลผลลึกบน Server แบบ Asynchronous เมื่อพ้นดีเลย์ cooldown ป้องกันการยิงสแปม และแสดงกรอบสีกำหนดทิศทาง: 🟡 เหลือง (สแกน), 🟢 เขียว (ผ่านและคืนชื่อห้อง/คะแนนจริง), 🔴 แดง (ไม่อนุมัติ)
  - แนบลายแทงแบนเนอร์แสดงสถานะสแกนล่าสุดที่ส่วนล่างของจอภาพ

### 2026-08-15 — Wizard restructuring, status validation fixes, and admin data mapping alignment

- ปรับปรุงขั้นตอนการกรอกใบสมัครพัก (Step 1-4): รวมฟอร์มข้อมูลส่วนตัวและข้อมูผู้ติดต่อฉุกเฉิน, ย้ายฟอร์มอัปโหลดเอกสารบัตรและหลักฐานสลิปไปที่ Step 3, และย้ายตัวสัญญาจัดพิมพ์ให้ตรวจสอบใน Step 4
- ลบข้อมูล OCR จำลอง: ปรับปรุง `DocumentUpload.tsx` โดยการลบ dummy data fallback ใน catch block เพื่อให้กลไกการป้อนข้อมูลสัญญามาจากข้อมูลสแกน OCR จริงเท่านั้น
- ปรับเปลี่ยนตรรกะความเสร็จสมบูรณ์ของ API: แก้ไขใน `DocumentUpload.tsx` และ `TenantApplication.tsx` ให้ใช้ `response.data?.statusCode === 200` ร่วมกับสถานะ HTTP แทนการเรียกตรวจ `.success` ที่ไม่มีอยู่ใน Body ของโมเดล Response
- ซิงก์ข้อมูลแดชบอร์ดนักเรียน (Dashboard Student Map): แก้ไขคีย์ใน `normalizeTenant` (`DashboardContext.tsx`) เพื่อซิงค์กับสกีมาฐานข้อมูลจริง: `fullName` -> `name`, `phone` -> `contact`, `yearLevel` -> `year`, ดึง preferredRoomType โชว์แทนข้อมูลห้องที่ยังไม่ได้รับการอนุมัติ และแปลงอักษรใหญ่ของ PENDING สู่ PascalCase ให้ระบบจัดกลุ่ม Badge ได้สวยงามถูกต้อง

### 2026-07-27 — API endpoint alignment for dashboard connectivity

- ปรับ default backend API base URL จาก `http://localhost:3001/api` เป็น `http://localhost:3000/api` เพื่อให้ตรงกับ backend runtime ปัจจุบัน
- แยก resolver ของ API base URL ออกมาเป็น helper กลางเพื่อให้ทดสอบได้และลดโอกาส fallback ผิดพอร์ต
- เพิ่ม unit test ตรวจว่า `VITE_API_URL` ยัง override ได้ และ fallback ไปพอร์ต `3000` เมื่อไม่ได้ตั้งค่า
- ตรวจยืนยันด้วย `npm test` และ `npm run build` ผ่านสำเร็จ
- แก้ไข `src/componants/addminpage/pages/Monitor/MonitorPage.tsx` ให้ส่ง full-frame webcam capture เป็น `frame_base64` ไปยัง backend แทนการตรวจจับใบหน้าฝั่ง browser
- อัปเดต SSE contract ให้รองรับ `snapshot`, `scan`, `heartbeat`, และ `live_frame` พร้อม overlay จาก `scan.bounding_box` และสถานะ `match` / `no-match`
- ยืนยันการแก้ไขแล้วด้วย `bun run test` และ `bun run build`

### 2026-08-08 — Monitor Face Detection UI Update

- เปลี่ยน front-end face detection ใน `src/componants/addminpage/pages/Monitor/MonitorPage.tsx` จาก browser `FaceDetector` / MediaPipe ไปใช้ `@tensorflow-models/blazeface`
- เพิ่มการวาด bounding box overlay บน preview video และปรับ CSS ให้ canvas overlay แมทช์กับ video display
- เพิ่ม panel แสดงค่า `x/y/w/h` ของ bounding box แบบสด ๆ เมื่อเจอใบหน้า
- ปรับ `flipHorizontal` ให้ตรงกับ webcam feed ปัจจุบัน และลดการแจ้งเตือน false negative จากการ mirror ที่ไม่จำเป็น
- ยืนยัน `bun run build` ผ่านสำเร็จ

### 2026-05-26 — Project Structure Migration

- ปรับโครงสร้างโปรเจกต์จาก Polyglot Microservices เป็น Modular Architecture (Frontend + Backend)
- ย้ายโฟลเดอร์เดิม (`core/`, `engine/`, `realtime/`) ไปเก็บที่ `_archive/`
- เปลี่ยนชื่อ `gateway/` เป็น `backend/`
- สร้างโครงสร้าง Backend modules: auth, users, visitor, billing, maintenance, ocr, face-verification
- สร้างโครงสร้าง Frontend modules: auth, student, admin, visitor, billing, maintenance, ocr, face-verification
- สร้างโฟลเดอร์ shared, workers, database (backend) และ components, services, hooks, types (frontend)
- สร้างโฟลเดอร์ docs/api และ docs/flow
- อัปเดต `docker-compose.yml` ให้รองรับโครงสร้างใหม่ (backend + frontend + db)
- เพิ่ม healthcheck สำหรับ PostgreSQL
- อัปเดต `AGENTS.md`, `BLUEPRINT.md`, `.cursorrules` ให้ตรงกับสถาปัตยกรรมใหม่

### Backend Configuration Fixes

- แก้ไข `backend/src/database/db.ts`: ลบ `datasourceUrl` option ที่ไม่รองรับใน Prisma v7 ออก เปลี่ยนเป็น `new PrismaClient()` (ใช้ config จาก `prisma.config.ts` แทน)
- รัน `npx prisma generate` เพื่อสร้าง Prisma Client types ให้ TypeScript รู้จัก `PrismaClient`
- แก้ไข `backend/tsconfig.json`: เพิ่ม `include: ["src/**/*"]` และ `exclude: ["node_modules", "dist"]` เพื่อแก้ปัญหา `prisma.config.ts` ที่อยู่นอก `rootDir`

### 2026-05-27 — Repository and Git Setup

- แยกโค้ด `frontend` และ `backend` ออกจากกันเป็น 2 GitHub repository แยก: `smart-dormitory-frontend` และ `smart-dormitory-backend`
- ตั้งค่า remote ของแต่ละ repo ให้ถูกต้อง และสร้าง branch `dev` สำหรับพัฒนาทุกฝั่ง
- ตรวจสอบและ push ข้อมูลขึ้น GitHub เรียบร้อยทั้ง `frontend` และ `backend`
- ปรับ `frontend` remote ที่เคยชี้ผิดไปยัง backend ให้ชี้กลับไป repo frontend อย่างถูกต้อง

### 2026-07-02 — AI Alignment Guidance Added

- เพิ่มไฟล์ [AI-INDEX.md](AI-INDEX.md) เพื่อเป็นจุดเริ่มต้นสำหรับ AI agent ในการค้นหาความรู้และไฟล์ที่เกี่ยวข้องกับ frontend
- อัปเดต [AGENTS.md](AGENTS.md) ให้มีกฎการสอดคล้องกับ backend แบบชัดเจน โดยเน้นเรื่อง API contract, module architecture, scope guardrails, และ verification ก่อนจบงาน
- เพิ่มคำแนะนำให้ frontend ยึด In-Scope / Out-of-Scope ที่สอดคล้องกับ backend โดยตัด Face Detection / Face Verification ออกจาก scope ของเทอมนี้
- อัปเดต [CHANGELOG.md](CHANGELOG.md) เพื่อให้การเปลี่ยนแปลงนี้เป็นประวัติที่ตามหลังได้

### 2026-07-29 — Room Management UI Fix & Database Seed Cleanup

#### Frontend (`smart-dormitory-frontend`)

**`DashboardContext.tsx`**

- เพิ่ม `const { token } = useAuth()` ใน `DashboardProvider` เพื่อป้องกันการยิง API ก่อน login
- เพิ่มเงื่อนไข `if (!token) return` ใน `useEffect` — reset ข้อมูลทั้งหมดเมื่อ logout
- เพิ่ม `token` เข้าไปใน dependency array ของ `useEffect` เพื่อให้ดึงข้อมูลใหม่อัตโนมัติทันทีที่ login สำเร็จ
- เพิ่ม `statusMap` เพื่อแปลง backend status UPPERCASE (`OCCUPIED`, `AVAILABLE`, `MAINTENANCE`) ให้เป็น title-case ที่ `RoomCard` รองรับ (`Occupied`, `Available`, `Maintenance`)
- ปรับ `normalizeRoom` ให้แยกชื่อผู้พักจาก `tenant.fullName` โดย split ด้วย `,`
- เพิ่ม logic สำหรับ infer `building` name จาก floor number เมื่อ database ไม่มี field นี้
- ปรับ `checkInDate` ให้ตัด timestamp ส่วน `T...` ออก (ISO → date string)

#### Backend (`smart-dormitory-backend`)

**`prisma/seed.ts`**

- เพิ่ม `import dotenv` เพื่อให้รัน seed บน host โดยตรงด้วย `bun run prisma/seed.ts` ได้
- เพิ่ม cleanup step ตอนเริ่ม seed: ลบ `Bill`, `MaintenanceTicket`, `Visitor`, `Tenant` ก่อนเสมอ เพื่อหลีกเลี่ยง unique constraint conflict
- เพิ่ม step ลบห้องที่ไม่อยู่ใน `roomsToSeed` list ออกจาก database (`room.deleteMany` with `notIn`)
- ปรับ `roomsToSeed` ให้มีเฉพาะ **Room 304** ที่มี tenant จริง (`สมชาย ทดสอบระบบ`) — ลบข้อมูลจำลอง (Alice Chen, Nina Patel ฯลฯ) ออกทั้งหมด
- ผลลัพธ์: database มีเฉพาะข้อมูลที่สะท้อนความเป็นจริง ได้แก่ Room 304 + Somchai + Bill + Maintenance Ticket

### 2026-08-06 — Face Recognition Client Environment & MediaPipe Debugging

#### Face_Recognition Environment (`C:\Users\raphi\Documents\Face_Recognition`)

- แก้ไขปัญหาไลบรารี `mediapipe` ขาดโมดูล `mp.solutions.face_detection` (เกิดข้อผิดพลาด `AttributeError: module 'mediapipe' has no attribute 'solutions'`)
- ตรวจพบว่า `.venv` เดิมจำลองมาจาก Python 3.14.0 (Pre-release) ซึ่งไม่มี Precompiled binary ของ MediaPipe บน Windows ส่งผลให้ได้สคริปต์คอมไพล์ที่ไม่สมบูรณ์และไม่มีโฟลเดอร์ `solutions`
- วิธีแก้ไข:
  - ลบโฟลเดอร์ `.venv` สภาพแวดล้อมเดิมออกทั้งหมดเพื่อป้องกันไฟล์ไบนารีตกค้าง
  - สร้างสภาพแวดล้อมจำลอง `.venv` ใหม่โดยระบุเอนจินหลักเป็น Python 3.11.9 (เวอร์ชันเสถียรที่ระบบพัฒนาและผู้ใช้มีติดตั้งอยู่แล้ว)
  - ติดตั้งและดาวน์เกรด `mediapipe` มาใช้เวอร์ชัน `0.10.14` ที่ระบุโมดูล `solutions` ครบถ้วน พร้อมอัปเกรด package ที่เกี่ยวข้อง
  - ยืนยันการเริ่มทำงานของแบบจำลองตรวจจับใบหน้า `FaceDetection` และ TensorFlow Lite XNNPACK delegate สำเร็จเรียบร้อย สามารถรันสตรีมกล้องกับเว็บแคมได้อย่างราบรื่น
