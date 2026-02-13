# 🚀 SK System Frontend (Next.js)

This is the **frontend application** for **SK System**, built using **Next.js**.
It connects to the SK System backend API and provides the user interface for authentication,
budget management, classifications, expenditures, allocations, and other system modules.

---

## 🛠 Tech Stack

- Next.js (Latest)
- React
- JavaScript / TypeScript
- Fetch API / Axios
- JWT Authentication

---

## 📁 Project Structure (Typical)

```
sk_system_frontend/
├─ app/ or src/
│  ├─ pages/ or app/
│  ├─ components/
│  ├─ services/
│  ├─ hooks/
│  └─ styles/
├─ public/
├─ .env.local
├─ package.json
├─ next.config.js
└─ README.md
```

---

## ✅ Prerequisites

- Node.js v18+
- npm or yarn
- SK System Backend running locally

Backend default URL:
```
http://localhost:3001/api
```


---

## 📦 Installation

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/MariaApple17/skfrontend.git
cd skfrontend
```

### 2️⃣ Install Dependencies

```bash
npm install
```

or

```bash
yarn install
```

---

## 🔐 Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

⚠️ Do NOT commit `.env.local` to version control.

---

## ▶️ Run Development Server

```bash
npm run dev
```

or

```bash
yarn dev
```

App will be available at:

```
http://localhost:3000
```

---

## 🔄 API Usage

Always use the base API URL:

```js
process.env.NEXT_PUBLIC_API_URL
```

Example:

```js
fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`)
```

---

## 🔐 Authentication

- Uses JWT authentication
- Token must be sent via header:

```
Authorization: Bearer <token>
```

---

## 📚 Features

- Authentication (Login / Logout)
- Role & Permission Management
- Fiscal Year Management
- Budget Management
- Classification Management
- Expenditure Management
- Budget Allocation
- Secure API Integration

---

## 🚀 Production Build

```bash
npm run build
npm run start
```

---

## 📄 License

MIT License
