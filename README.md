<div align="center">

# 🛠️ Houserve
### *A polished home-services booking experience built with React, TypeScript, Supabase, Razorpay, and Capacitor.*

<p>
  <img alt="React" src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img alt="Supabase" src="https://img.shields.io/badge/Supabase-Backend-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" />
  <img alt="Razorpay" src="https://img.shields.io/badge/Razorpay-Payments-02042B?style=for-the-badge&logo=razorpay&logoColor=white" />
  <img alt="Capacitor" src="https://img.shields.io/badge/Capacitor-Android-119EFF?style=for-the-badge&logo=capacitor&logoColor=white" />
  <img alt="Brevo" src="https://img.shields.io/badge/Brevo-Emails-0092FF?style=for-the-badge&logo=sendinblue&logoColor=white" />
</p>

<p>
  <strong>Houserve</strong> is a mobile-first service-booking system for home and facility assistance. It guides users from onboarding and authentication all the way to address selection, booking, secure Razorpay checkout, tracking, and live notifications.
</p>

</div>

---

## ✨ Production-Ready Integrations

Houserve is a fully integrated, full-stack application built for production workloads.

- **Seamless Payments (Razorpay):** Replaced default integrations with a server-authorized Razorpay Orders flow. Payments are cryptographically verified via Supabase Edge Functions mapping exact values to database line-items.
- **Native UPI Support (Capacitor):** Intercepts deep links (`upi://`, `gpay://`, `phonepe://`) inside the native Android WebView to natively launch payment apps during razorpay checkout, solving the standard Capacitor restriction issue.
- **Real-Time Notification Emails (Brevo):** Orders trigger dual, custom HTML confirmation emails processed asynchronously using the Brevo API via Edge Functions (one high-fidelity receipt to the customer, one operational alert to admin teams).
- **Multi-Method Auth:** Includes **email/password**, **phone OTP**, and **Google OAuth** powered by Supabase.

---

## 🧭 Core Features

### 1. Branded Launch + Onboarding
Users start with an animated splash screen and a premium multi-slide onboarding experience that introduces the value proposition before moving into authentication.

### 2. Flexible Authentication
The app supports multiple sign-in methods, including deep-link OAuth handling for native Android packaging.

### 3. Address-First Service Flow
Before users can start browsing, the app ensures they select a service location. Saved addresses can be created, edited, deleted, and reused.

### 4. Service Discovery
Customers can browse all services, search by keyword, filter by category, open service details, and add services directly to the persistent cart.

### 5. Persistent Cart + Checkout Journey
Cart state is stored locally with Zustand persistence, making the experience feel app-like even across reloads. The checkout securely generates orders via the backend.

### 6. Booking & Payment Lifecycle 
The application supports multi-item bookings, GST/platform fee calculations, strict Edge Function-powered payment verification, and automated Brevo email alerts.

### 7. Realtime Updates
Supabase realtime subscriptions power in-app notifications so users can see updates natively inside the app without a manual refresh.

---

## 🏗️ Architecture Stack

### Frontend & Mobile
- **React 19 & TypeScript 5**
- **Vite 8**
- **React Router 7**
- **Capacitor 8** (Native packaging for Android and iOS)
- **Tailwind CSS v4**
- **Zustand** (Local persisted state)

### Backend & Cloud Services
- **Supabase Auth** (Tokens & OAuth)
- **Supabase Database / Postgres** (RLS-protected tables)
- **Supabase Edge Functions** (Deno-based serverless processing)
- **Razorpay Orders API** (Server-side generated checkouts)
- **Brevo SMTP API** (Transactional dual-dispatch emails)

---

## 🧱 Data & Security Flow

```text
User Interface (React)
    └── Adds to Cart -> Clicks Checkout -> Requests Order ID
        ↓
Edge Function (create-razorpay-order)
    └── Validates JWT -> Fetches prices -> Calls Razorpay -> Returns Exact Amount 
        ↓
Razorpay Checkout (Native UI)
    └── Handles Cards / UPI deep links -> Returns Success Signature
        ↓
Edge Function (verify-razorpay-payment)
    └── Resolves HMAC-SHA256 Cryptography -> Returns Authenticity Boolean
        ↓
Database (Supabase)
    └── Inserts Bookings + Stores Items 
        ↓
Edge Function (admin-notification)
    └── Dispatches Brevo Emails -> Notifies Customer (HTML) + Admins (Text)
```

By ensuring that the total is recalculated on the server (`create-razorpay-order`), and the payment is cryptographically verified on the backend (`verify-razorpay-payment`), the checkout architecture is completely immune to frontend pricing manipulation.

---

## ⚙️ Setup & Deployment

### 1. Environment Config (`.env`)

```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_PLATFORM=android
VITE_RAZORPAY_KEY_ID=rzp_live_...
```

### 2. Edge Function Secrets
You must configure the following securely in your Supabase Dashboard (or via Supabase CLI):

```bash
RAZORPAY_KEY_ID=rzp_live_...
RAZORPAY_KEY_SECRET=...
BREVO_API_KEY=...
```

### 3. Running Locally
```bash
npm install
npm run dev
```

### 4. Compiling the Android APK
```bash
npm run build
npx cap sync android
cd android && ./gradlew assembleDebug
```

---

<div align="center">

### 💥 Final word

**Houserve operates as a hardened, production-ready product.**  
It has a clear brand, a mathematically secure payment architecture, native Android intercept capability, and a robust dual-channel transactional notification system. 

</div>
