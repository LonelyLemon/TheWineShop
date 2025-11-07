# init_project.md

Hướng dẫn khởi tạo & đồng bộ project sau khi pull code từ GitHub  
(Backend: Python + uv, Frontend: Vite + npm, DB: PostgreSQL)

---

## 1. Tổng quan

File này hướng dẫn các bước cơ bản để **đồng bộ source code local** sau khi bạn đã `git clone` hoặc `git pull` từ GitHub, bao gồm:

- Cài đặt & đồng bộ dependency cho **backend (Python + uv)**.
- Cài đặt & đồng bộ dependency cho **frontend (Vite + npm)**.
- Thiết lập **database PostgreSQL** trên **Windows** và **Ubuntu**.
- Chạy project ở môi trường development.

> Lưu ý: Một số câu lệnh, tên thư mục, module… có thể cần chỉnh sửa cho phù hợp với cấu trúc thực tế của project (ví dụ: `backend/`, `frontend/`, `app.main`, tên DB…).

---

## 2. Chuẩn bị chung sau khi pull code

Sau khi pull code từ GitHub:

```bash
# Nếu là clone lần đầu
git clone <GITHUB_REPO_URL> project-name
cd project-name

# Nếu đã clone trước đó, chỉ cần update
git pull origin main   # hoặc branch tương ứng
