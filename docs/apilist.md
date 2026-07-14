# MangaFlow — Frontend API List

This document lists all the backend REST API endpoints consumed by the MangaFlow Next.js frontend application.

## Base URL
* Dev/Prod Base API Path: `/api` (configured via `API_BASE_URL` in `lib/constants.ts`)

---

## 1. Authentication & Profile
Managed in `services/authService.ts` and `services/api.ts`

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| **POST** | `/api/auth/login` | Login user, returns JWT and Refresh tokens | No |
| **POST** | `/api/auth/register` | Register new Mangaka/Assistant account | No |
| **POST** | `/api/auth/logout` | Revoke session and log out | Yes |
| **GET** | `/api/auth/me` | Fetch active user credentials and role | Yes |
| **POST** | `/api/auth/change-password` | Change user account password | Yes |
| **GET** | `/api/users/me` | Get detailed user profile information | Yes |
| **PUT** | `/api/users/me/avatar` | Upload and update user avatar image | Yes |

---

## 2. User Management (Admin Only)
Managed in `services/userService.ts`

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| **GET** | `/api/users` | Get list of all accounts | Yes (Admin) |
| **POST** | `/api/users` | Create a new user account | Yes (Admin) |
| **PUT** | `/api/users/{id}` | Update user details or role | Yes (Admin) |
| **DELETE** | `/api/users/{id}` | Deactivate/delete a user account | Yes (Admin) |
| **GET** | `/api/users/editors` | Retrieve list of active Tantou Editors | Yes |
| **GET** | `/api/users/me/mangakas` | Retrieve list of mangakas assigned to the current editor | Yes |

---

## 3. Series & Proposals
Managed in `services/seriesService.ts`

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| **GET** | `/api/series` | Fetch all active series and proposed works | Yes |
| **GET** | `/api/series/{id}` | Fetch detailed metadata of a specific series | Yes |
| **POST** | `/api/series` | Create a new series proposal (Mangaka) | Yes |
| **PUT** | `/api/series/{id}` | Edit fields of draft series proposals | Yes |
| **DELETE** | `/api/series/{id}/soft-delete` | Soft delete a series | Yes |
| **POST** | `/api/proposals/{id}/submit-review` | Submit draft proposal for Tantou Editor review | Yes |
| **POST** | `/api/proposals/{id}/submit-to-board` | Submit approved proposal to Editorial Board for voting | Yes |
| **POST** | `/api/proposals/{id}/reject` | Reject proposal (Tantou Editor) | Yes |
| **POST** | `/api/proposals/{id}/activate` | Finalize and activate proposal to 'Active' | Yes |
| **GET** | `/api/series/{id}/board-decisions` | Fetch board voting decisions for a series | Yes |

---

## 4. Chapters
Managed in `services/chapterService.ts`

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| **GET** | `/api/chapters` | Get all chapters in the system | Yes |
| **GET** | `/api/series/{seriesId}/chapters` | Get chapters belonging to a specific series | Yes |
| **POST** | `/api/chapters` | Create a new chapter (Mangaka) | Yes |
| **PUT** | `/api/chapters/{id}` | Update chapter info or change its status | Yes |

---

## 5. Manuscripts
Managed in `services/manuscriptService.ts`

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| **GET** | `/api/chapters/{chapterId}/manuscripts` | Get list of manuscript versions for a chapter | Yes |
| **POST** | `/api/manuscripts` | Submit a new manuscript version for review | Yes |
| **PUT** | `/api/manuscripts/{id}` | Update status (APPROVE/REVISION REQUIRED) | Yes |
| **GET** | `/api/manuscripts/{id}/annotations` | Get visual feedback pins on a manuscript | Yes |
| **POST** | `/api/manuscripts/{id}/annotations` | Save review feedback annotation pin | Yes |

---

## 6. Page Tasks & Submissions
Managed in `services/taskService.ts` and component actions

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| **GET** | `/api/page-tasks` | Get all page tasks | Yes |
| **GET** | `/api/chapters/{chapterId}/page-tasks` | Get page tasks assigned under a chapter | Yes |
| **POST** | `/api/page-tasks` | Assign a new drawing page task to an Assistant | Yes |
| **PUT** | `/api/page-tasks/{id}` | Update drawing task details | Yes |
| **POST** | `/api/page-tasks/{taskId}/submissions` | Submit drawn pages for review (Assistant) | Yes |
| **POST** | `/api/page-tasks/submissions/{submissionId}/approve` | Approve assistant's page submission | Yes |
| **POST** | `/api/page-tasks/submissions/{submissionId}/reject` | Reject assistant's page submission with feedback | Yes |
| **GET** | `/api/submissions/{submissionId}/annotations` | Get annotations on assistant's submission | Yes |
| **POST** | `/api/submissions/{submissionId}/annotations` | Save correction annotation on submission | Yes |

---

## 7. File Assets
Managed in `services/api.ts` (multipart upload) and `services/seriesService.ts`

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| **POST** | `/api/files` | Upload raw assets (images, zip archive) | Yes |
| **GET** | `/api/files/{id}` | Fetch file metadata and public URL | Yes |

---

## 8. Ranking, Voting & Finance
Managed in `services/rankingService.ts`, `services/voteService.ts`, and `services/salaryService.ts`

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| **GET** | `/api/ranking` | Fetch current quarter manga rankings | Yes |
| **POST** | `/api/ranking/confirm` | Freeze rankings and confirm snapshot for a quarter | Yes |
| **POST** | `/api/vote-records` | Upload/import reader vote sheet | Yes |
| **PUT** | `/api/vote-records/{id}/confirm` | Recalculate rankings and confirm votes | Yes |
| **GET** | `/api/series/{seriesId}/vote-records` | Fetch reader vote records for a series | Yes |
| **GET** | `/api/salary-records` | Get history of payrolls for assistants and mangaka | Yes |
| **POST** | `/api/board-decisions/{id}/votes` | Cast board vote on proposal | Yes |
| **POST** | `/api/board-decisions/{id}/extend-deadline` | Extend vote duration for a proposal | Yes |
| **POST** | `/api/board-decisions/{id}/special-decision` | Direct veto override on board decision (Chief Editor) | Yes |

---

## 9. System Management
Managed in `services/systemService.ts`

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| **GET** | `/api/genres` | Get all system genres | Yes |
| **POST** | `/api/genres` | Create a new manga genre | Yes (Admin) |
| **PUT** | `/api/genres/{id}` | Update genre title | Yes (Admin) |
| **DELETE** | `/api/genres/{id}` | Delete a genre | Yes (Admin) |
| **GET** | `/api/roles` | Get list of user roles | Yes |

---

## 10. Notifications
Managed in `services/api.ts` & `store/notificationStore.ts`

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| **GET** | `/api/notifications` | Fetch user notification inbox | Yes |
| **PUT** | `/api/notifications/{id}/read` | Mark a notification as read | Yes |
