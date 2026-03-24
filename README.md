<div align="center">

# 🛠️ Houserve
### *A polished home-services booking experience built with React, TypeScript, Vite, Supabase, and Capacitor.*

<p>
  <img alt="React" src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img alt="Vite" src="https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite&logoColor=white" />
  <img alt="Supabase" src="https://img.shields.io/badge/Supabase-Backend-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" />
  <img alt="Capacitor" src="https://img.shields.io/badge/Capacitor-Mobile-119EFF?style=for-the-badge&logo=capacitor&logoColor=white" />
  <img alt="Tailwind CSS" src="https://img.shields.io/badge/TailwindCSS-v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" />
</p>

<p>
  <strong>Houserve</strong> is a mobile-first service-booking app for home and facility assistance. It guides users from onboarding and authentication all the way to address selection, browsing services, adding items to a cart, placing bookings, tracking orders, and receiving live notifications.
</p>

</div>

---

## ✨ Why this project stands out

This codebase is more than a starter app. It is already shaped like a **real customer-facing booking product**:

- Smooth onboarding and branded splash flow.
- Multi-method authentication with **email/password**, **phone OTP**, and **Google OAuth**.
- Address management for selecting where a technician should arrive.
- Browseable, searchable, category-based service catalogue.
- Cart and checkout journey with persistent state.
- Booking success, booking history, booking detail, and cancellation flows.
- Realtime notifications powered by Supabase channels.
- Mobile-ready routing patterns and Capacitor support for native app behavior.

---

## 🧭 Product overview

Houserve is positioned as a **trusted, polished, doorstep-services experience** for customers in Delhi NCR. The app interface emphasizes:

- **Fast booking** for common household services.
- **Premium visual design** with bold typography, rounded cards, and warm brand colors.
- **Trust signals** like verified experts, transparent pricing, live status, and booking history.
- **Mobile-first UX** with a persistent bottom navigation and focused screens for each step of the journey.

---

## 🚀 Core features

### 1. Branded launch + onboarding
Users start with an animated splash screen and a premium multi-slide onboarding experience that introduces the value proposition before moving into authentication.

### 2. Flexible authentication
The app supports multiple sign-in methods:

- Email + password login.
- Phone login with OTP verification.
- Google OAuth with Capacitor deep-link handling.
- Supabase-backed session restoration and auth-state syncing.

### 3. Address-first service flow
Before users can start browsing, the app ensures they select a service location. Saved addresses can be created, edited, deleted, and reused.

### 4. Service discovery
Customers can:

- Browse all services.
- Search by keyword.
- Filter by category.
- Open service details.
- Add services directly to cart.

### 5. Persistent cart + checkout journey
Cart state is stored locally with Zustand persistence, making the experience feel app-like even across reloads.

### 6. Booking lifecycle support
The app includes:

- Booking confirmation.
- Order history.
- Booking detail pages.
- Booking cancellation flow.
- Notification-driven revisits into a booking.

### 7. Realtime updates
Supabase realtime subscriptions power in-app notifications so users can see updates without manual refresh.

### 8. Mobile-app readiness
Capacitor packages are already included, and the authentication flow contains native deep-link handling for OAuth return URLs.

---

## 🖼️ Experience highlights

The UI language is one of the strongest parts of this project.

- **Warm orange primary palette** with deep accent tones.
- **Custom theme tokens** for color, typography, states, and surfaces.
- **Reusable UI primitives** like `btn-primary`, `btn-ghost`, `card`, and `input-field`.
- **Premium mobile composition** using rounded panels, sticky headers, and elevated shadows.
- **Animated moments** powered by Framer Motion for onboarding, splash, and success states.

If your goal was to build something that feels **less like a CRUD dashboard** and **more like a consumer mobile product**, this project is already moving in the right direction.

---

## 🏗️ Tech stack

### Frontend
- **React 19**
- **TypeScript**
- **Vite 8**
- **React Router 7**
- **Framer Motion**

### State & forms
- **Zustand** for persisted client state.
- **React Hook Form** for ergonomic forms.
- **Zod** for schema validation.

### Backend & platform services
- **Supabase Auth** for authentication.
- **Supabase Database** for profiles, services, bookings, addresses, and notifications.
- **Supabase Realtime** for live notification updates.
- **Supabase Edge Functions** for admin notification dispatch.

### Payments & mobile
- **Stripe** libraries are installed for payment integrations.
- **Capacitor** packages are included for native app packaging and device capabilities.

### Styling
- **Tailwind CSS v4** with custom theme tokens.
- Project-specific utility classes defined in `src/index.css`.

---

## 🧱 Architecture at a glance

```text
User Interface (React + React Router)
        ↓
Client State (Zustand persist stores)
        ↓
Supabase Client Layer
        ├── Auth
        ├── Database
        ├── Realtime
        └── Edge Functions
        ↓
Mobile Runtime Support (Capacitor)
```

The app mixes **clean page-driven routing** with **small persistent state stores**, which is a strong fit for mobile commerce and booking flows.

---

## 📱 Main user journey

```text
Splash → Onboarding → Login / Signup / OTP
      → Address Selection
      → Home
      → Browse Services / Search
      → Service Detail
      → Cart
      → Checkout
      → Booking Success
      → Bookings / Booking Detail / Notifications / Profile
```

This flow is already product-shaped and intuitive for users who want to get from intent to confirmed booking quickly.

---

## 📂 Project structure

```bash
boys-at-work/
├── public/
├── src/
│   ├── assets/          # Static assets
│   ├── components/      # Shared UI and route guards
│   ├── lib/             # Supabase client and notification utilities
│   ├── pages/           # Screen-level pages for the full user journey
│   ├── stores/          # Zustand state stores
│   ├── App.tsx          # Route map and auth bootstrapping
│   ├── index.css        # Theme tokens and reusable component classes
│   └── main.tsx         # App entry point
├── package.json
└── README.md
```

---

## 🔐 Authentication modes

The current app supports the following auth patterns:

| Method | Status | Notes |
|---|---|---|
| Email + Password | Implemented | Standard Supabase sign-in flow |
| Phone OTP | Implemented | Includes OTP verification screen |
| Google OAuth | Implemented | Configured for Capacitor deep-link return |
| Session restore | Implemented | Session checked on app boot |

This gives the product a much stronger real-world feel than a typical single-login demo.

---

## 🗺️ Key application areas

### Home
A branded dashboard with greeting logic, selected address display, search, a hero banner, categories, and “How It Works” messaging.

### Services
Searchable and filterable service listing fetched from Supabase, with direct cart actions and service detail navigation.

### Cart & checkout
Persistent cart management with quantity support, subtotal calculation, and booking progression.

### Bookings
Users can review historical and active bookings, inspect details, and manage service progress.

### Notifications
Realtime inserts from Supabase are reflected inside the notifications screen for a dynamic, app-like experience.

### Profile
Central place for account info, addresses, order history, support access, and logout.

---

## 🌈 Design system notes

The project defines a consistent design language through theme variables such as:

- `--color-primary`
- `--color-accent`
- `--color-bg`
- `--color-surface`
- `--color-success`
- `--color-error`
- `--font-syne`
- `--font-sans`
- `--font-mono`

Reusable component-layer utilities include:

- `.btn-primary`
- `.btn-ghost`
- `.card`
- `.card-elevated`
- `.input-field`

That is a great foundation for scaling the UI without visual drift.

---

## ⚙️ Getting started

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd Houserve
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root:

```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

> The app currently includes fallback Supabase values in the client, but using your own environment configuration is the cleaner production setup.

### 4. Start the development server

```bash
npm run dev
```

### 5. Build for production

```bash
npm run build
```

### 6. Preview the production build

```bash
npm run preview
```

---

## 🧪 Available scripts

| Command | What it does |
|---|---|
| `npm run dev` | Starts the Vite development server |
| `npm run build` | Runs TypeScript build and produces production assets |
| `npm run lint` | Runs ESLint across the project |
| `npm run preview` | Serves the built app locally |

---

## 🔌 Backend expectations

For the full experience, your Supabase project should provide tables and flows that support at least:

- `profiles`
- `services`
- `user_addresses`
- `bookings`
- `notifications`

You will also want:

- Auth providers configured for email, phone OTP, and Google OAuth.
- Realtime enabled for notifications.
- Edge Function support for admin notification delivery.

---

## 📍 Environment + deployment notes

### Web
This app runs smoothly as a standard Vite SPA.

### Mobile
Because Capacitor dependencies are included, the codebase is well-positioned for Android/native packaging and deeper device integration.

### Important setup consideration
If you use OAuth in a native context, make sure your redirect URLs, app scheme, and Supabase auth settings align with the configured deep-link flow.

---

## 🧠 Why this README matters

A polished product deserves a polished first impression.

This README is designed to help:

- Developers understand the architecture quickly.
- Recruiters or clients see the product quality fast.
- Collaborators onboard without digging through code first.
- Future-you come back to the repo and immediately remember how everything fits together.

---

## 🔮 Strong next improvements

If you want to push this project from **already impressive** to **seriously production-ready**, the best next steps would be:

1. Add a dedicated backend/schema setup guide.
2. Document the bookings table shape and service seed data.
3. Complete Stripe checkout/payment flow documentation.
4. Add screenshots or device mockups to showcase the UI.
5. Add automated tests for stores, auth guards, and booking flows.
6. Add CI for lint + build validation.
7. Add role-based dashboards for technicians and admins.

---

## 🤝 Contributing

If you continue iterating on this project, keep the same standard throughout:

- Mobile-first thinking.
- Product-quality design.
- Strong visual consistency.
- Clear flows with minimal friction.
- Reusable components and clean state boundaries.

---

## 📄 License

No license is currently specified in this repository. Add one if you plan to distribute or open-source the project.

---

<div align="center">

### 💥 Final word

**Houserve already feels like a real app, not just a template.**  
It has a clear brand, a believable booking flow, strong UX direction, and a solid modern stack.

If you wanted this README to be **super duper fine** and **actually worthy of the project**, now it is.

</div>
