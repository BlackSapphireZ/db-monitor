# 🖥️ DB Monitor - ระบบตรวจสอบเซิร์ฟเวอร์

ระบบ Dashboard สำหรับตรวจสอบสถานะเซิร์ฟเวอร์ DigitalOcean และฐานข้อมูล PostgreSQL แบบ Real-time

---

## 📋 สารบัญ

- [คุณสมบัติหลัก](#-คุณสมบัติหลัก)
- [เทคโนโลยี](#-เทคโนโลยี)
- [การติดตั้ง](#-การติดตั้ง)
- [การใช้งาน](#-การใช้งาน)
- [โครงสร้างโปรเจค](#-โครงสร้างโปรเจค)
- [API Endpoints](#-api-endpoints)
- [การ Deploy](#-การ-deploy)

---

## ✨ คุณสมบัติหลัก

### 1. 📊 Real-time Server Monitoring
- **CPU Usage**: แสดงการใช้งาน CPU แบบ Real-time พร้อม Load Average
- **Memory**: แสดงการใช้ RAM ปัจจุบัน/ทั้งหมด
- **Storage**: แสดงพื้นที่ดิสก์ที่ใช้งาน
- **Network**: แสดง Traffic In/Out

### 2. 📈 กราฟแบบ Real-time พร้อม Time Range
- เลือกช่วงเวลาได้: **5 นาที**, **10 นาที**, **30 นาที**, **1 ชั่วโมง**, **24 ชั่วโมง**
- กราฟเส้นแสดง CPU และ Memory ย้อนหลัง
- อัปเดตอัตโนมัติตามช่วงเวลาที่เลือก

### 3. 🗄️ Database Browser
- แสดงรายการตารางทั้งหมดพร้อมจำนวน Row
- เรียกดูข้อมูลในแต่ละตารางพร้อม Pagination
- รองรับการแสดงรูปภาพจาก URL (สำหรับตาราง Message)

### 4. 🔍 SQL Query Runner
- รัน SQL Query ได้โดยตรง (เฉพาะ SELECT)
- Quick Query buttons สำหรับคำสั่งที่ใช้บ่อย
- Export ผลลัพธ์เป็น CSV
- แสดงเวลาที่ใช้ในการ Query

### 5. 🔐 ระบบ Authentication
- Login ด้วย Username/Password
- JWT Token เก็บใน HTTP-only Cookie
- ป้องกันการเข้าถึงโดยไม่ได้รับอนุญาต

### 6. 🎨 UI/UX Professional
- Dark Theme สไตล์ Enterprise
- ไม่มี Emoji ใช้ SVG Icons
- Responsive Design
- Health Check Status

---

## 🛠️ เทคโนโลยี

| หมวด | เทคโนโลยี |
|------|----------|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS |
| Database | PostgreSQL |
| Auth | JWT + Cookie |
| Charts | Canvas API |
| Remote Metrics | SSH Commands |

---

## 📦 การติดตั้ง

### 1. Clone โปรเจค
```bash
git clone https://github.com/YOUR_USERNAME/db-monitor.git
cd db-monitor
```

### 2. ติดตั้ง Dependencies
```bash
npm install
```

### 3. ตั้งค่า Environment Variables
สร้างไฟล์ `.env` จาก `.env.example`:
```bash
cp .env.example .env
```

แก้ไขค่าต่อไปนี้:
```env
# DigitalOcean PostgreSQL
DATABASE_URL="postgresql://user:password@host:5432/dbname"

# Authentication
JWT_SECRET="your-secret-key"
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="your-password"
```

### 4. ตั้งค่า SSH Key (สำหรับ Remote Metrics)
SSH Key ต้องมีสิทธิ์เข้าถึง DigitalOcean server:
```bash
# ตรวจสอบว่า key อยู่ใน path นี้
ls ~/.ssh/crisp_do_key
```

### 5. รัน Development Server
```bash
npm run dev
```

เปิดเบราว์เซอร์ที่ http://localhost:3001

---

## 📖 การใช้งาน

### เข้าสู่ระบบ
1. เปิด http://localhost:3001
2. กรอก Username และ Password
3. กด "Sign In"

### Dashboard หลัก
- **Server Info**: แสดงรายละเอียด DO Droplet และ Uptime
- **Metric Cards**: CPU, Memory, Storage, Network พร้อมกราฟเล็ก
- **Large Chart**: กราฟใหญ่แสดง CPU + Memory พร้อมปุ่มเลือก Time Range
- **Database Info**: ขนาด DB, จำนวนตาราง, Connections
- **Health Check**: สถานะ PostgreSQL, SSH, API

### เรียกดูตาราง
1. คลิก "Database" ที่ Sidebar
2. เลือกตารางที่ต้องการดู
3. ใช้ Pagination เพื่อเลื่อนดูข้อมูล

### รัน SQL Query
1. คลิก "SQL Query" ที่ Sidebar
2. พิมพ์ SQL Query (SELECT เท่านั้น)
3. กด "Run Query" หรือ Cmd+Enter
4. กด "Copy CSV" เพื่อ Export

---

## 📁 โครงสร้างโปรเจค

```
db-monitor/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   ├── login/route.ts    # POST /api/auth/login
│   │   │   │   ├── logout/route.ts   # POST /api/auth/logout
│   │   │   │   └── check/route.ts    # GET /api/auth/check
│   │   │   ├── metrics/route.ts      # GET /api/metrics
│   │   │   ├── tables/
│   │   │   │   ├── route.ts          # GET /api/tables
│   │   │   │   └── [name]/route.ts   # GET /api/tables/:name
│   │   │   └── query/route.ts        # POST /api/query
│   │   ├── dashboard/
│   │   │   ├── layout.tsx            # Sidebar Layout
│   │   │   ├── page.tsx              # Main Dashboard
│   │   │   ├── tables/[name]/page.tsx
│   │   │   └── query/page.tsx
│   │   ├── login/page.tsx
│   │   ├── globals.css
│   │   └── layout.tsx
│   └── lib/
│       ├── auth.ts                   # JWT + Cookie utilities
│       └── db.ts                     # PostgreSQL queries
├── .env                              # Environment variables
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

---

## 🔌 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | เข้าสู่ระบบ |
| POST | `/api/auth/logout` | ออกจากระบบ |
| GET | `/api/auth/check` | ตรวจสอบสถานะ Login |

### Metrics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/metrics` | ดึงข้อมูล CPU, Memory, Disk, Network, DB Stats |

### Database
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tables` | รายการตารางทั้งหมด |
| GET | `/api/tables/:name` | ข้อมูลในตาราง |
| POST | `/api/query` | รัน SQL Query (SELECT only) |

---

## 🚀 การ Deploy

### Deploy ไป DigitalOcean

1. **Build Production**
```bash
npm run build
```

2. **SSH ไปยังเซิร์ฟเวอร์**
```bash
ssh -i ~/.ssh/crisp_do_key root@206.189.36.199
```

3. **Clone และ Setup บนเซิร์ฟเวอร์**
```bash
cd /var/www
git clone https://github.com/YOUR_USERNAME/db-monitor.git
cd db-monitor
npm install
```

4. **ตั้งค่า .env บนเซิร์ฟเวอร์**
```bash
nano .env
# เพิ่มค่า environment variables
```

5. **รันด้วย PM2**
```bash
npm run build
pm2 start npm --name "db-monitor" -- start
pm2 save
```

6. **ตั้งค่า Nginx (Optional)**
```nginx
server {
    listen 80;
    server_name monitor.yourdomain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 🔒 ความปลอดภัย

- ✅ SQL Query จำกัดเฉพาะ SELECT เท่านั้น
- ✅ JWT Secret เก็บใน Environment Variable
- ✅ Password ไม่เก็บใน Client-side
- ✅ HTTP-only Cookie ป้องกัน XSS
- ⚠️ ควรใช้ HTTPS บน Production

---

## 📄 License

MIT License - ใช้งานได้อย่างอิสระ

---

## 👨‍💻 พัฒนาโดย

Developed with ❤️ for Crisp Analytics Pro
