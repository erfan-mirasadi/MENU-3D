# 🍽️ FutureMenu: Next-Gen SaaS QR Menu

**FutureMenu** is a high-tech, multi-tenant digital menu platform built for the modern dining experience. It moves beyond static PDF menus by integrating **3D/AR Food Visualization** and a **Real-time Multiplayer Shared Cart**, allowing guests at the same table to order collaboratively.

## 🚀 Key Features

- **🏢 SaaS Architecture:** Single codebase serving multiple restaurants via dynamic routing (`/[restaurant-slug]/[table-id]`).
- **🍔 3D & AR Visualization:** Interactive 3D food models using Google `<model-viewer>` for an immersive experience.
- **🤝 Real-time Shared Cart:** "Multiplayer" ordering system where guests at the same table see cart updates instantly (powered by Supabase Realtime).
- **🌍 Multi-Language Support:** JSONB-based i18n database schema supporting unlimited languages per venue.
- **⚡ Server-Side Performance:** Built on Next.js App Router for optimal SEO and load times.

## 🛠️ Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** JavaScript (ES6+)
- **Styling:** Tailwind CSS + Lucide Icons
- **Database & Realtime:** Supabase (PostgreSQL)
- **3D Engine:** Google Model Viewer (`<model-viewer>`)
- **State Management:** Zustand

## 📂 Project Structure

```bash
src/
├── app/
│   └── [slug]/[table_id]/    # Dynamic route for each restaurant & table
├── components/               # Reusable UI & 3D components
└── lib/                      # Supabase client & utility functions
```
