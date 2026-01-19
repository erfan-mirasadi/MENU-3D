<div align="center">

  <img src="public/logo-web.png" alt="Menu 3D Logo" width="150" />

  # MENU 3D

  **A high-scale B2B SaaS Restaurant Management Platform with 3D visualization.**

  <p>
    <img src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js" />
    <img src="https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react" />
    <img src="https://img.shields.io/badge/Supabase-Realtime-green?style=for-the-badge&logo=supabase" />
    <img src="https://img.shields.io/badge/Tailwind-CSS-blue?style=for-the-badge&logo=tailwindcss" />
    <img src="https://img.shields.io/badge/3D-ModelViewer-orange?style=for-the-badge&logo=google" />
  </p>

  [See Live Demo](/liman-coast/T-01) • [Admin Panel](/admin/dashboard)

</div>

---

## 📚 Project Overview

**Menu 3D** is a high-scale **B2B SaaS Restaurant Management Platform** designed to support hundreds of restaurants simultaneously. It uses a strict **multi-tenant architecture** where all data is isolated by `restaurant_id`.

### Core Applications
The codebase is a monorepo containing 4 distinct applications:

1.  **Client User App (`/[slug]`)**: End customers scan QR codes to view interactive **3D menus** and place group orders via synchronous carts.
2.  **Waiter App (`/waiter`)**: Staff receive real-time notifications, manage table status, and confirm orders for the kitchen.
3.  **Cashier App (`/cashier`)**: Cashiers validate orders, handle complex split-check payments, and finalize table sessions.
4.  **Admin Portal (`/admin`)**: Owners manage menus, generate QR codes, and view business analytics.

---

## 🏗️ Architecture & Data Flow

The project follows a strict **Service-Repository Pattern** to ensure separation of concerns.

### A. Service Layer (`src/services/*.js`)
All interactions with **Supabase** (PostgreSQL, Auth) occur exclusively here.
- **Constraints**: Every function MUST require `restaurant_id` to enforce multi-tenancy.
- **Key Services**: `orderService`, `cashierService`, `waiterService`, `sessionService`.

### B. Real-time Logic (`src/hooks/*.js`)
We leverage **Supabase Realtime Channels** to keep all users in sync.
- **Cart Sync**: When multiple users scan the same table QR, they join the same session. Any `order_items` change broadcasts instantly to all connected devices.
- **Table Locking**: Critical actions (like Checkout) check session status to prevent race conditions.

### C. Folder Structure
```bash
src/
├── app/
│   ├── [slug]/[table_id]/    # 🛒 Client App (Dynamic)
│   ├── admin/                # 📊 Admin Dashboard
│   ├── cashier/              # 💳 Cashier POS
│   ├── waiter/               # 🛎️ Waiter Dashboard
│   ├── login/                # 🔐 Unified Login
│   └── layout.js             # 🌍 Root Layout
├── components/
│   ├── ui/                   # 🧩 Shared UI (GlassLoader, Modals)
│   ├── 3d/                   # 🧊 Three.js & Model Viewer Components
│   └── ...
├── services/                 # ⚙️ Business Logic & API Calls
├── hooks/                    # 🎣 React Hooks (useRealtimeOrders)
└── lib/                      # 🗄️ Supabase Client & Utils
```

---

## 💾 Database Schema

| Table | Description |
| :--- | :--- |
| **`restaurants`** | Root tenant record (Multi-tenancy root). |
| **`tables`** | Contains `qr_token` and layout data. |
| **`sessions`** | Tracks dining session (`ordering`, `waiting_payment`, `closed`). |
| **`order_items`** | Individual items with statuses (`draft`, `pending`, `confirmed`, `served`). |
| **`bills`** | Financial records for sessions. |
| **`transactions`** | Payment logs linked to bills. |

---

## 🔐 Security

1.  **Strict Isolation**: All queries are filtered by `restaurant_id`.
2.  **Row Level Security (RLS)**: Supabase policies act as the final guardrail.
3.  **Audit Logs**: Sensitive actions are recorded in `activity_logs`.

---

<div align="center">
  Built with ❤️ by <b>Erfan</b>
</div>
