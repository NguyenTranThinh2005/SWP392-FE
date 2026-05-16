<p align="center">
  <img src="https://img.shields.io/badge/status-In%20Development-yellow?style=for-the-badge" alt="Status" />
  <img src="https://img.shields.io/badge/semester-Summer%202026-blue?style=for-the-badge" alt="Semester" />
  <img src="https://img.shields.io/badge/course-SWP391-red?style=for-the-badge" alt="Course" />
</p>

# 📚 MangaHub — Manga Creation & Publishing Management System

> **Hệ thống quản lý quy trình sáng tác và xuất bản Manga**

**Topic Code:** `SU26SWP04` &nbsp;|&nbsp; **Semester:** Summer 2026

---

## 📖 Giới thiệu dự án

**MangaHub** là hệ thống quản lý toàn diện cho quy trình sáng tác và xuất bản Manga — từ giai đoạn nộp bản thảo ban đầu cho đến quyết định xuất bản cuối cùng và xếp hạng từ độc giả.

### 🎯 Bối cảnh & Vấn đề

Ngành công nghiệp Manga đòi hỏi sự cộng tác chặt chẽ giữa **Mangaka** (tác giả), **Assistants** (trợ lý), **Tantou Editors** (biên tập viên phụ trách) và **Editorial Board** (ban biên tập). Hiện tại, quy trình làm việc bị phân mảnh trên nhiều công cụ khác nhau:

| Vấn đề hiện tại | Mô tả |
|---|---|
| 📁 Chia sẻ bản thảo | Google Drive, WeTransfer — không có quản lý phiên bản tập trung |
| 💬 Giao việc | Qua Zalo/Line — khó theo dõi tiến độ |
| ✉️ Phản hồi biên tập | Email — thiếu tính tương tác trực tiếp |
| 📊 Dữ liệu bình chọn | Nhập thủ công từ spreadsheet — dễ sai sót và chậm trễ |

### 🔑 Điểm đau chính

1. Tác giả và trợ lý phải sử dụng nhiều ứng dụng — khó theo dõi tiến độ từng trang.
2. Biên tập viên không có khả năng xem tiến độ hoàn thành của studio theo thời gian thực.
3. Ban biên tập thiếu hệ thống bỏ phiếu có cấu trúc cho các quyết định xuất bản.
4. Dữ liệu xếp hạng series được cập nhật thủ công — dễ xảy ra lỗi và chậm trễ.

---

## 🧩 Phạm vi dự án

### ✅ Trong phạm vi (In Scope)

- 📝 Nộp đề xuất series mới và bỏ phiếu của Ban biên tập
- 📄 Phân công task chương/trang từ Mangaka cho Assistants
- 📊 Theo dõi tiến độ cấp trang (**Pending → In-Progress → Review → Approved**)
- ✏️ Tantou Editor review bản thảo với chú thích trực tiếp (inline annotation)
- 🗳️ Nhập dữ liệu bình chọn từ độc giả và xếp hạng series tự động
- ⚖️ Quy trình quyết định hủy/thay đổi loại xuất bản của Ban biên tập

### ❌ Ngoài phạm vi (Out of Scope)

- AI auto-coloring hoặc phân đoạn trang
- Nền tảng đọc manga công khai cho độc giả
- Thanh toán thực tế cho trợ lý (chỉ hiển thị thu nhập)
- Tích hợp với nền tảng xuất bản bên ngoài (Shonen Jump, Webtoon, v.v.)

---

## 👥 Vai trò người dùng (Actors)

| Actor | Tần suất | Mô tả vai trò |
|---|---|---|
| 🎨 **Mangaka** | Hàng ngày | Tạo series, assign tasks cho assistant, approve/reject từng trang |
| ✍️ **Assistant** | Hàng ngày | Nhận task, hoàn thiện phần việc, submit lại cho Mangaka review |
| 📋 **Tantou Editor** | Hàng tuần | Review bản thảo, annotate trực tiếp, bảo vệ series trước board |
| 🏛️ **Editorial Board** | Hàng tháng | Bỏ phiếu series mới, nhập vote độc giả, quyết định hủy/thay đổi |

---

## 🗂️ Thực thể chính (Key Entities)

```
Series          ─── seriesID, title, genre, mangakaID, editorID, publicationType, status, rankingScore
Chapter         ─── chapterID, seriesID, chapterNo, deadline, submittedAt, approvedAt, status
PageTask        ─── taskID, chapterID, assistantID, pageRange, taskType, dueDate, status
Manuscript      ─── msID, chapterID, fileURL, version, submittedAt, editorFeedback, status
VoteRecord      ─── voteID, seriesID, period, readerCount, voteCount, rankPosition, enteredAt
BoardDecision   ─── decisionID, seriesID, decisionType, votes[], reason, decisionDate
```

---

## 📏 Quy tắc nghiệp vụ (Business Rules)

| Mã | Loại | Mô tả |
|---|---|---|
| **BR-01** | Behavioral | Tantou Editor **KHÔNG ĐƯỢC** bỏ phiếu cho quyết định xuất bản của series mà họ trực tiếp quản lý (xung đột lợi ích). |
| **BR-02** | Calculational | Xếp hạng series = `(voteCount / readerCount) × 100%`; nếu bằng điểm thì so sánh theo tổng vote. Bottom 20% bị đánh dấu để xem xét hủy. |
| **BR-03** | Temporal | Deadline nộp chương là **14 ngày** trước ngày xuất bản; trễ deadline sẽ tự động gửi cảnh báo cho editor. |
| **BR-04** | Definitional | Page task chỉ hoàn thành khi Mangaka đánh dấu **"Approved"**; trạng thái "Submitted" không được tính vào % hoàn thành chương. |
| **BR-05** | Behavioral | Ban biên tập cần tối thiểu **3 phiếu** (quorum) để thông qua quyết định hủy series; dưới 3 phiếu → quyết định bị hoãn. |

---

## 👨‍💻 Thành viên nhóm & Vai trò

| # | Họ và Tên | Vai trò | Trách nhiệm chính |
|---|---|---|---|
| 1 | **Đỗ Quốc Bảo** | 🔧 Backend Developer | Thiết kế & phát triển API, xử lý logic nghiệp vụ, quản lý database |
| 2 | **Lý Gia Khiêm** | 🔧 Backend Developer | Xây dựng RESTful API, authentication/authorization, business rules |
| 3 | **Trần Đăng Hải** | 🔧 Backend Developer | Phát triển API endpoints, data validation, integration testing |
| 4 | **Nguyễn Trần Thịnh** | 🎨 Frontend Developer | Thiết kế giao diện người dùng, phát triển UI components, responsive design |
| 5 | **Nguyễn Hoàng Thưởng** | 🎨 Frontend Developer | Xây dựng các trang chức năng, state management, API integration |

---

## 🛠️ Công nghệ sử dụng

### Backend

| Công nghệ | Mô tả |
|---|---|
| ![C#](https://img.shields.io/badge/C%23-239120?style=flat-square&logo=csharp&logoColor=white) **C#** | Ngôn ngữ lập trình chính cho backend |
| ![.NET](https://img.shields.io/badge/.NET-512BD4?style=flat-square&logo=dotnet&logoColor=white) **ASP.NET Core** | Framework xây dựng RESTful Web API |
| ![EF Core](https://img.shields.io/badge/Entity%20Framework-512BD4?style=flat-square&logo=dotnet&logoColor=white) **Entity Framework Core** | ORM cho thao tác database |
| ![SQL Server](https://img.shields.io/badge/SQL%20Server-CC2927?style=flat-square&logo=microsoftsqlserver&logoColor=white) **SQL Server** | Hệ quản trị cơ sở dữ liệu |
| ![Swagger](https://img.shields.io/badge/Swagger-85EA2D?style=flat-square&logo=swagger&logoColor=black) **Swagger / OpenAPI** | Tài liệu hóa và test API |

### Frontend

| Công nghệ | Mô tả |
|---|---|
| ![React](https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black) **React** | Thư viện xây dựng giao diện người dùng (SPA) |
| ![TailwindCSS](https://img.shields.io/badge/Tailwind%20CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white) **Tailwind CSS** | Framework CSS utility-first cho styling nhanh và nhất quán |
| ![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white) **Vite** | Build tool & dev server siêu nhanh |
| ![Axios](https://img.shields.io/badge/Axios-5A29E4?style=flat-square&logo=axios&logoColor=white) **Axios** | HTTP client cho gọi API |

### DevOps & Tools

| Công nghệ | Mô tả |
|---|---|
| ![Git](https://img.shields.io/badge/Git-F05032?style=flat-square&logo=git&logoColor=white) **Git** | Quản lý phiên bản source code |
| ![GitHub](https://img.shields.io/badge/GitHub-181717?style=flat-square&logo=github&logoColor=white) **GitHub** | Lưu trữ repository và quản lý dự án |
| ![VS Code](https://img.shields.io/badge/VS%20Code-007ACC?style=flat-square&logo=visualstudiocode&logoColor=white) **VS Code** | IDE cho Frontend development |
| ![Visual Studio](https://img.shields.io/badge/Visual%20Studio-5C2D91?style=flat-square&logo=visualstudio&logoColor=white) **Visual Studio** | IDE cho Backend development |

---

## 🏗️ Kiến trúc hệ thống

```
┌─────────────────────────────────────────────────────────┐
│                      CLIENT SIDE                        │
│  ┌───────────────────────────────────────────────────┐  │
│  │          React + Tailwind CSS + Vite              │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────┐    │  │
│  │  │  Pages   │  │Components│  │    Hooks      │    │  │
│  │  └──────────┘  └──────────┘  └──────────────┘    │  │
│  └──────────────────────┬────────────────────────────┘  │
│                         │ HTTP / REST API (Axios)       │
└─────────────────────────┼───────────────────────────────┘
                          │
┌─────────────────────────┼───────────────────────────────┐
│                   SERVER SIDE                           │
│  ┌──────────────────────▼────────────────────────────┐  │
│  │            ASP.NET Core Web API                   │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────┐    │  │
│  │  │Controllers│ │ Services │  │ Repositories │    │  │
│  │  └──────────┘  └──────────┘  └──────┬───────┘    │  │
│  └─────────────────────────────────────┼─────────────┘  │
│  ┌─────────────────────────────────────▼─────────────┐  │
│  │          Entity Framework Core (ORM)              │  │
│  └─────────────────────────────────────┬─────────────┘  │
│  ┌─────────────────────────────────────▼─────────────┐  │
│  │              SQL Server Database                  │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## 🚀 Hướng dẫn cài đặt & chạy

### Yêu cầu hệ thống

- [.NET 8 SDK](https://dotnet.microsoft.com/download) trở lên
- [Node.js](https://nodejs.org/) v18+ & npm
- [SQL Server](https://www.microsoft.com/en-us/sql-server) (hoặc SQL Server Express)
- [Git](https://git-scm.com/)

### Backend

```bash
# Clone repository
git clone <repository-url>
cd <project-folder>/backend

# Restore dependencies
dotnet restore

# Cập nhật connection string trong appsettings.json

# Chạy migration
dotnet ef database update

# Khởi chạy server
dotnet run
```

### Frontend

```bash
# Di chuyển vào thư mục frontend
cd <project-folder>/frontend

# Cài đặt dependencies
npm install

# Khởi chạy dev server
npm run dev
```

---

## 📂 Cấu trúc thư mục dự kiến

```
MangaHub/
├── backend/                    # ASP.NET Core Web API
│   ├── Controllers/            # API Controllers
│   ├── Models/                 # Entity models
│   ├── DTOs/                   # Data Transfer Objects
│   ├── Services/               # Business logic layer
│   ├── Repositories/           # Data access layer
│   ├── Migrations/             # EF Core migrations
│   └── appsettings.json        # Configuration
│
├── frontend/                   # React Application
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── pages/              # Page-level components
│   │   ├── hooks/              # Custom React hooks
│   │   ├── services/           # API call services
│   │   ├── utils/              # Utility functions
│   │   └── App.jsx             # Root component
│   ├── tailwind.config.js      # Tailwind configuration
│   └── package.json
│
└── README.md
```

---

## 📝 Module trọng tâm

> **Manuscript Submission & Editorial Review Module**
>
> Module chính của dự án trong kỳ SU26, tập trung vào quy trình nộp bản thảo và review biên tập.

---

## 📄 Giấy phép

Dự án này được phát triển phục vụ mục đích học tập trong khuôn khổ môn **SWP391** — **FPT University**, Semester **Summer 2026**.

---

<p align="center">
  Made with ❤️ by <strong>Team SU26SWP04</strong> — FPT University
</p>
