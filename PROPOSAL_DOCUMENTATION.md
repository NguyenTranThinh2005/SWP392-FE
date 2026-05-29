# 📋 Tài liệu tính năng: Series Proposal

> **Dành cho:** Mangaka (người tạo đề xuất truyện)  
> **Phạm vi:** Toàn bộ luồng Proposal — từ tạo form đến khi Editorial Board xử lý  
> **Nguồn code:** `src/pages/series/ProposalFormPage.jsx`, `src/store/seriesStore.js`, `src/utils/validators.js`

---

## 1. Tổng quan

Tính năng **Series Proposal** cho phép Mangaka đề xuất một bộ truyện mới để Editorial Board xem xét và biểu quyết. Sau khi được duyệt, series sẽ được kích hoạt và Mangaka bắt đầu sản xuất chương.

---

## 2. Ai có quyền truy cập?

| Role | Quyền |
|------|-------|
| **Mangaka** | ✅ Tạo, lưu draft, submit proposal |
| **Editorial Board** | ✅ Xem và vote trên Voting page (không tạo proposal) |
| **Tantou Editor** | ❌ Không có quyền tạo proposal |
| **Assistant** | ❌ Không có quyền tạo proposal |

---

## 3. Proposal Form — Chi tiết từng trường

> **Route:** `/series/new` — component: `ProposalFormPage.jsx`

### 3.1 Title (Tiêu đề)

| Thuộc tính | Giá trị |
|------------|---------|
| Bắt buộc | ✅ Có |
| Độ dài tối đa | 100 ký tự (`CONFIG.TITLE_MAX_LENGTH`) |
| Business Rule | **BR-17**: Không được trùng với title của bất kỳ series nào đang có status `Active` |
| Hiển thị | Bộ đếm ký tự real-time: `(X/100)` |
| Lỗi nếu bỏ trống | `"Title is required"` |
| Lỗi nếu trùng | `"Title "X" is already used by an active series"` |

### 3.2 Genre (Thể loại)

| Thuộc tính | Giá trị |
|------------|---------|
| Bắt buộc | ✅ Có |
| Loại input | Dropdown (select) |
| Danh sách chọn | Shōnen, Shōjo, Seinen, Josei, Kodomo, Action, Romance, Fantasy, Horror, Comedy, Slice of Life, Sports, Sci-Fi, Mystery, Isekai |
| Lỗi nếu bỏ trống | `"Genre is required"` |

### 3.3 Publication Type (Loại xuất bản)

| Thuộc tính | Giá trị |
|------------|---------|
| Bắt buộc | ✅ Có |
| Loại input | Dropdown (select) |
| Danh sách chọn | Weekly, Bi-Weekly, Monthly, Quarterly, One-Shot |
| Lỗi nếu bỏ trống | `"Publication type is required"` |

### 3.4 Synopsis (Tóm tắt nội dung)

| Thuộc tính | Giá trị |
|------------|---------|
| Bắt buộc | ✅ Có |
| Độ dài tối thiểu | **200 ký tự** (`CONFIG.SYNOPSIS_MIN_LENGTH`) |
| Độ dài tối đa | **2000 ký tự** (`CONFIG.SYNOPSIS_MAX_LENGTH`) |
| Loại input | Textarea (không resize) |
| Progress bar | Màu 🔴 amber khi chưa đủ 200 ký tự → 🟢 emerald khi đủ |
| Hiển thị | Bộ đếm: `(X/2000, min 200)` |
| Lỗi | `"Synopsis must be ≥ 200 characters"` hoặc `"Synopsis must be ≤ 2000 characters"` |

### 3.5 Sample Pages (Số trang mẫu)

| Thuộc tính | Giá trị |
|------------|---------|
| Bắt buộc | ✅ Có |
| Giá trị tối thiểu | **5 trang** |
| Giá trị mặc định | 5 |
| Loại input | Number input (rộng 128px) |
| Lỗi | `"Must have ≥ 5 sample pages"` |

---

## 4. Business Rules áp dụng

| Mã BR | Tên | Mô tả |
|-------|-----|-------|
| **BR-15** | Proposal Validation | Tất cả 5 trường đều bắt buộc. Synopsis ≥ 200 ký tự. Sample pages ≥ 5. |
| **BR-17** | Unique Active Series Title | Title của proposal không được trùng với bất kỳ series nào đang `Active`. |
| **BR-19** | Single Active Proposal | Mỗi Mangaka chỉ được có **1 proposal** đang ở trạng thái `Pending Review` hoặc `Under Review` cùng lúc. Nếu vi phạm → hiện cảnh báo màu vàng và **disable cả 2 nút**. |

---

## 5. Hai hành động trên Form

### 💾 Save Draft
```
Chức năng: Lưu proposal với status = "Draft"
Điều kiện: Không bị chặn bởi BR-19
Hành vi:   Lưu ngay vào store, KHÔNG validate form, KHÔNG gửi cho Board
Kết quả:   Toast "Proposal saved as draft" (success) → redirect /series
```

### 🚀 Submit for Review
```
Chức năng: Gửi proposal để Editorial Board xem xét
Điều kiện: Không bị chặn bởi BR-19

Luồng xử lý:
  1. Validate toàn bộ form (BR-15)
  2. Kiểm tra title trùng lặp (BR-17)
  3. Nếu có lỗi → highlight đỏ các trường lỗi, toast "Please fix validation errors" → DỪNG
  4. Nếu pass → setIsSubmitting(true), hiện spinner
  5. Delay 1000ms (giả lập network)
  6. 30% xác suất timeout/lỗi mạng:
       → Toast lỗi "Lỗi kết nối hoặc timeout. Vui lòng thử lại!" → DỪNG
  7. 70% thành công:
       → addProposal() → status: "Pending Review"
       → submitProposal()
       → createDecision() loại "Series Approval"
       → addNotification() gửi cho toàn bộ Editorial Board
       → Toast "Proposal submitted for board review!" (success)
       → redirect /series
```

---

## 6. Proposal Status (Vòng đời)

```
                  ┌──────────────────────────────────────┐
                  │                                      │
  [Mangaka tạo]   ▼                                      │
      Draft ──→ Pending Review ──→ Under Review ──→ Approved
                                                 ──→ Rejected
```

| Status | Màu hiển thị | Ý nghĩa |
|--------|-------------|---------|
| `Draft` | Slate/Xám | Đã lưu, chưa submit |
| `Pending Review` | Amber/Vàng | Đã submit, chờ Board mở phiên |
| `Under Review` | Blue/Xanh | Board đang trong phiên biểu quyết |
| `Approved` | Emerald/Xanh lá | Được duyệt |
| `Rejected` | Red/Đỏ | Bị từ chối |

---

## 7. Dữ liệu mẫu (Seed Data)

### Proposals có sẵn trong hệ thống:

| ID | Title | Mangaka | Status |
|----|-------|---------|--------|
| PR01 | Whispers of the Deep | Oda Kenji (U02) | `Approved` |
| PR02 | Sakura Knights | Tanaka Yuki (U01) | `Under Review` |

> ⚠️ Do `PR02` của Tanaka Yuki đang `Under Review` → Tanaka Yuki bị **BR-19 block**, không thể tạo proposal mới cho đến khi PR02 được xử lý xong.

---

## 8. Cấu trúc dữ liệu Proposal Object

```js
{
  id: "PR03",                        // Auto-generated: "PR" + padded index
  title: "My New Series",            // string, max 100 chars
  genre: "Fantasy",                  // từ danh sách GENRES
  publicationType: "Weekly",         // từ danh sách PUBLICATION_TYPES
  synopsis: "...",                   // string, 200–2000 chars
  samplePages: 5,                    // number, >= 5
  mangakaId: "U01",                  // ID của Mangaka tạo
  status: "Pending Review",          // PROPOSAL_STATUS enum
  createdAt: "2026-05-28T...",       // ISO timestamp
  submittedAt: "2026-05-28T...",     // ISO timestamp (set khi submit)
}
```

---

## 9. Sau khi Submit — Điều gì xảy ra tiếp theo?

1. **Voting page** (`/voting`) xuất hiện 1 Decision mới loại `"Series Approval"`
2. **Editorial Board** nhận notification với link đến `/voting`
3. Board members vote **Approve** hoặc **Reject** (cần quorum tối thiểu 3 người)
4. Nếu **Approved** → Series được kích hoạt (status `Active`), Mangaka có thể bắt đầu tạo Chapter
5. Nếu **Rejected** → Proposal chuyển `Rejected`, Mangaka được thông báo và có thể tạo proposal mới

---

## 10. Các file liên quan

| File | Mô tả |
|------|-------|
| [`src/pages/series/ProposalFormPage.jsx`](src/pages/series/ProposalFormPage.jsx) | UI form tạo proposal |
| [`src/pages/series/SeriesListPage.jsx`](src/pages/series/SeriesListPage.jsx) | Danh sách series + nút "New Proposal" |
| [`src/store/seriesStore.js`](src/store/seriesStore.js) | State management: addProposal, submitProposal |
| [`src/store/votingStore.js`](src/store/votingStore.js) | createDecision() sau khi submit |
| [`src/store/notificationStore.js`](src/store/notificationStore.js) | addNotification() cho Board |
| [`src/utils/validators.js`](src/utils/validators.js) | validateProposal, validateUniqueTitle, validateSingleActiveProposal |
| [`src/utils/constants.js`](src/utils/constants.js) | GENRES, PUBLICATION_TYPES, CONFIG, PROPOSAL_STATUS |
| [`src/data/series.js`](src/data/series.js) | Seed data: proposals[], series[] |

---

*Tài liệu được tạo ngày 2026-05-28 — MangaHub Prototype*
