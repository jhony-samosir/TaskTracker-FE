# Frontend Implementation Plan for MyTask & Task Management Services

Dokumen ini menjelaskan rencana integrasi antara Frontend (Angular) dengan Backend Web API yang baru diimplementasi, khususnya untuk modul **Task Management** (Admin) dan **MyTask** (User/Employee).

## 1. Analisis Kesenjangan (Gap Analysis)
Saat ini, file `src/app/core/services/task.service.ts` di Frontend:
- Masih menggunakan mock data via `catchError`.
- Endpoint `getMyTasks` menembak `/api/tasks/my`, padahal di BE endpointnya adalah `/api/my-tasks`.
- Belum ada implementasi untuk menghapus task (`DELETE /api/tasks/{taskId}`).
- Belum ada implementasi untuk komentar (`POST /api/my-tasks/{taskId}/comments` atau `/api/tasks/{taskId}/comments`).
- Belum ada implementasi upload attachment dokumen (`POST /api/tasks/{taskId}/documents`).
- Belum mengambil list status dan users langsung dari backend (masih menggunakan mock user).
- Response models perlu disesuaikan dengan mapping yang benar terhadap DTO backend (contoh: `TaskResponse` dari BE menggunakan properti `camelCase` ketika diserialisasi oleh JSON formatter BE, tetapi struktur `history`, `comments`, dan `documents` berbeda dari `TaskActivity`).

## 2. API Contract Mapping

### A. Modul Task Management (Admin) - Base Route: `/api/tasks`
- `GET /api/tasks`: Get all tasks (Managed Tasks).
- `GET /api/tasks/{taskId}`: Get detail task.
- `POST /api/tasks`: Create task baru.
- `PUT /api/tasks/{taskId}`: Update task detail.
- `DELETE /api/tasks/{taskId}`: Hapus task.
- `PUT /api/tasks/{taskId}/status`: Update status task oleh Admin.
- `POST /api/tasks/{taskId}/comments`: Tambah komentar oleh Admin.
- `POST /api/tasks/{taskId}/documents`: Attach document.

### B. Modul MyTask (User) - Base Route: `/api/my-tasks`
- `GET /api/my-tasks`: Get list task user terkait.
- `GET /api/my-tasks/{taskId}`: Get detail task user terkait.
- `PUT /api/my-tasks/{taskId}/status`: Update status task sesuai rule (Assignee/Reviewer).
- `POST /api/my-tasks/{taskId}/comments`: Tambah komentar oleh user terkait.

## 3. GitHub Issues Breakdown (Frontend)

Implementasi akan dibagi menjadi 5 Issue di repository Frontend:

### Issue 1 - [FE] Update TaskService Core for API Integration
- Hapus semua mock fallback (contoh: `catchError(() => of(this.getMockTasks()))`) di `task.service.ts`.
- Sesuaikan endpoint URL `/my` menjadi endpoint yang membedakan URL untuk `my-tasks` dan `tasks`.
- Update `Task`, `CreateTaskRequest`, `UpdateTaskRequest` model di Frontend agar 100% cocok dengan properti JSON BE (`title` menjadi `taskTitle`, dll, jika diperlukan. Atau implementasikan Adapter pattern untuk mapping object Backend ke model Frontend).

### Issue 2 - [FE] Implement Task Management CRUD (Admin Features)
- Implementasi `createTask` yang menembak `POST /api/tasks`.
- Implementasi `updateTask` yang menembak `PUT /api/tasks/{taskId}`.
- Tambahkan dan integrasikan `deleteTask` (`DELETE /api/tasks/{taskId}`) dengan UI Task Management.
- Pastikan refresh tabel berjalan setelah Create, Update, atau Delete berhasil.

### Issue 3 - [FE] Implement MyTask List & Status Workflow
- Pastikan `loadMyTasks` memanggil `GET /api/my-tasks` dengan parameter filter (search, statusId, dll) yang relevan.
- Perbarui `updateTaskStatus` agar memanggil `PUT /api/my-tasks/{taskId}/status`.
- Sesuaikan logic state management Frontend (Signal update) terhadap status yang kembali dari server (yang menyertakan history baru).

### Issue 4 - [FE] Implement Comments & Audit History View
- Buat fungsi API call untuk Add Comment (bisa untuk admin/my-task).
- Modifikasi `task-detail-drawer` dan `task-management-detail-drawer` untuk me-render `history` (audit trail) dan `comments` dengan data real dari API (sebelumnya mock di `TaskActivity`).
- Pastikan form tambah komentar di UI terkoneksi dengan API Add Comment.

### Issue 5 - [FE] Implement File Attachments logic
- Integrasikan logic base64 encoding (atau FormData jika BE diubah ke IFormFile, namun DTO saat ini menggunakan `FileBase64` string) pada komponen form lampiran dokumen.
- Buat request interface `AttachTaskDocumentRequest` dan implementasikan HTTP call `POST /api/tasks/{taskId}/documents`.
- Tampilkan daftar dokumen dari respons BE (properti `documents` pada `TaskResponse`) di UI.
