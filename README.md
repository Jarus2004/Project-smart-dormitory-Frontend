# Smart Dormitory Frontend

Frontend สำหรับระบบจัดการหอพัก พัฒนาด้วย React, TypeScript และ Vite เพื่อให้ผู้ดูแลหอพักและนักศึกษาจัดการข้อมูลห้องพัก ค่าใช้จ่าย การแจ้งซ่อม และผู้มาติดต่อผ่านเว็บแอปพลิเคชันเดียว

> โปรเจกต์นี้จัดทำเพื่อแสดงทักษะด้าน Frontend Development, การออกแบบระบบแบบ Modular และการเชื่อมต่อ API สำหรับใช้ประกอบ Portfolio สมัครฝึกงาน

## Frontend Highlights

- Dashboard สำหรับ Admin พร้อมข้อมูลห้องพัก นักศึกษา รายรับ-รายจ่าย และงานแจ้งซ่อม
- Student portal สำหรับดูข้อมูลการเข้าพัก เอกสาร สัญญา และรายการบิล
- ระบบเลือกห้องพักและขั้นตอนสมัครเข้าพักแบบ Wizard
- ระบบ Billing สำหรับดูบิล แยกรายการค่าเช่า ค่าน้ำ ค่าไฟ และอัปโหลดสลิปชำระเงิน
- ระบบ Maintenance สำหรับสร้างและติดตามสถานะการแจ้งซ่อม
- ระบบ Visitor สำหรับลงทะเบียน อนุมัติ Check-in และ Check-out ผู้มาติดต่อ
- ระบบแจ้งเตือนสำหรับ Admin แบบ realtime ผ่าน Socket.IO
- เชื่อมต่อ REST API ผ่าน Axios พร้อมจัดการสถานะ authentication และข้อผิดพลาดจาก server
- รองรับหน้า Monitor สำหรับแสดงสถานะการเข้าออกและผลการตรวจสอบจาก backend

## My Contributions

ส่วนที่สามารถใช้พูดคุยระหว่างสัมภาษณ์ได้:

- พัฒนาและปรับปรุงหน้าจอ Admin Dashboard และหน้าจัดการข้อมูลหลักของหอพัก
- พัฒนา flow การสมัครเข้าพัก ตั้งแต่กรอกข้อมูล อัปโหลดเอกสาร เลือกห้อง จนถึงตรวจสอบสัญญา
- พัฒนา Student Billing ตั้งแต่เลือกหลายบิล สร้าง QR อัปโหลดสลิป ไปจนถึงติดตามผลการตรวจสอบ
- พัฒนา Visitor Management สำหรับค้นหา กรอง อนุมัติ และบันทึกเวลาเข้า-ออก
- ออกแบบการแจ้งเตือน success/error และ notification history ให้ใช้งานต่อเนื่องข้าม refresh
- แยกส่วน UI, context, service และ shared components เพื่อให้ดูแลและขยายระบบได้ง่าย
- ตรวจสอบคุณภาพงานด้วย lint, TypeScript build และ unit tests

## Technology Stack

| Category | Technology |
| --- | --- |
| Frontend | React 19, TypeScript, Vite |
| Routing | React Router |
| API Client | Axios |
| Realtime | Socket.IO Client |
| UI and Icons | CSS Modules, Lucide React |
| Data Visualization | Recharts |
| Tables | TanStack React Table |
| Face Detection UI | TensorFlow.js, BlazeFace, MediaPipe |
| Quality Tools | ESLint, TypeScript, Node Test Runner |

## Frontend Architecture

```text
src/
├── components/       # Shared components and notification UI
├── componants/       # Admin dashboard, homepage, and user page modules
├── contexts/         # Authentication and application contexts
├── modules/          # Feature modules such as auth, admin, visitor, and face verification
├── services/         # Axios API client, realtime client, and API URL helpers
├── assets/           # Images and static frontend assets
├── App.tsx           # Application providers and router entry
└── main.tsx          # Vite application entry point
```

การเชื่อมต่อข้อมูลใช้ `src/services/api.ts` เป็น Axios instance กลาง และใช้ `src/services/realtime.ts` สำหรับ Socket.IO โดย frontend รับ URL ของ backend ผ่าน environment variable `VITE_API_URL`

## Getting Started

### Prerequisites

- Bun หรือ Node.js ที่รองรับการทำงานของ Vite
- Backend API ของ Smart Dormitory ที่กำลังทำงานอยู่ หากต้องการทดสอบ flow ที่เชื่อมต่อข้อมูลจริง
- Git

### Installation

```bash
git clone <your-repository-url>
cd <repository-folder>
bun install
```

### Environment Variables

สร้างไฟล์ `.env` ที่ root ของโปรเจกต์:

```env
VITE_API_URL=http://localhost:3000/api
```

### Run Development Server

```bash
bun run dev
```

จากนั้นเปิด URL ที่ Vite แสดงใน terminal โดยทั่วไปคือ `http://localhost:5173`

## Available Scripts

```bash
bun run dev       # Start Vite development server
bun run build     # Type-check and create production build
bun run lint      # Run ESLint
bun run test      # Run unit tests
bun run preview   # Preview production build locally
```

## Screenshots and Demo

เพิ่มภาพหน้าจอหรือวิดีโอสาธิตในส่วนนี้ก่อนนำไปใช้ใน Portfolio:

- Live Demo: `<add-demo-url>`
- GitHub Repository: `<add-github-url>`
- Project Presentation: `<add-presentation-url>`

## What I Learned

- การออกแบบ Frontend แบบ Modular ที่แบ่ง feature และความรับผิดชอบอย่างชัดเจน
- การจัดการ authentication, protected routes และ session ที่หมดอายุ
- การเชื่อมต่อ API จริง รวมถึง loading, empty, success และ error states
- การจัดการข้อมูล realtime และ notification lifecycle ด้วย Socket.IO
- การทำ responsive interface สำหรับ workflow ของ Admin และ Student
- การตรวจสอบคุณภาพโค้ดด้วย lint, build และ automated tests

## Project Status

โปรเจกต์อยู่ระหว่างการพัฒนา โดย frontend มีหน้าจอและ flow หลักของ Admin, Student, Billing, Maintenance และ Visitor แล้ว การใช้งานข้อมูลจริงต้องทำงานร่วมกับ backend API ที่เกี่ยวข้อง

## Author

- Name: `<your-name>`
- Role: Frontend Developer Intern Applicant
- Email: `<your-email>`
- GitHub: `<your-github-url>`
- LinkedIn: `<your-linkedin-url>`

## License

โปรเจกต์นี้จัดทำเพื่อการศึกษาและใช้ประกอบ Portfolio
