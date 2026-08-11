<p align="center">
  <img src="docs/images/login.png" alt="BloomBoard Login" width="450"/>
</p>

<h1 align="center">🌸 BloomBoard</h1>

<p align="center">
  <strong>Perishable Inventory & E-Commerce Platform for Florists and Customers</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Java-21-orange?style=flat-square&logo=openjdk" />
  <img src="https://img.shields.io/badge/Spring%20Boot-3.x-brightgreen?style=flat-square&logo=spring" />
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react" />
  <img src="https://img.shields.io/badge/PostgreSQL-15-336791?style=flat-square&logo=postgresql" />
  <img src="https://img.shields.io/badge/Redis-7-DC382D?style=flat-square&logo=redis" />
  <img src="https://img.shields.io/badge/Tailwind%20CSS-4-38BDF8?style=flat-square&logo=tailwindcss" />
</p>

---

BloomBoard is a full-stack, production-ready floral inventory and order management platform designed specifically for time-sensitive, perishable inventory. It features a dual role-based interface:
1. **Customer Flower Shop Storefront** (`ROLE_CUSTOMER`): A boutique shop where customers browse 20 fresh flower varieties, view stock & 50% discount tags on near-expiry blooms, build a basket, and check out with real-time FEFO allocation.
2. **Florist Admin Management Portal** (`ROLE_ADMIN`): A clean, functional back-office dashboard for florists to track batch expirations, receive new shipments, and record stock waste.

---

## 📸 Screenshots

### 🌸 Customer Flower Storefront (`ROLE_CUSTOMER`)
![Customer Storefront](docs/images/customer_storefront.png)

Customers browse live flower stock with real-time freshness badges and 50% discount tags on near-expiry blooms.

### 🧺 Customer Shopping Basket & FEFO Checkout
![Customer Cart](docs/images/customer_cart.png)

Integrated cart drawer allowing customers to review items and place orders. Stock is atomically allocated from the oldest batches via FEFO logic.

### 🌿 Florist Management Portal (`ROLE_ADMIN`)
![Florist Dashboard](docs/images/florist_dashboard.png)

Minimalist, efficient inventory table for florists to monitor batch expirations, receive stock, and record waste.

---

## 🔑 Login Credentials

| Role | Username | Password | Access |
|---|---|---|---|
| **Florist Admin** | `admin` | `password` | Florist Inventory Management Portal |
| **Customer** | `alice` | `password` | Customer Flower Shop Storefront |
| **Customer** | `bob` | `password` | Customer Flower Shop Storefront |

---

## ✨ Core Features

| Feature | Description |
|---|---|
| **Dual Role UI** | Dynamic router presents a boutique storefront for customers and a streamlined back-office panel for florists |
| **FEFO Engine** | Allocates stock using First-Expired-First-Out logic, automatically using the oldest batches first to minimize waste |
| **Atomic Checkout** | Combines a PostgreSQL transaction with a Redis reservation in a single atomic operation — zero chance of overselling |
| **Dynamic Discounting** | Batches expiring within 48 hours are automatically flagged (`isDiscounted: true`), giving customers 50% OFF |
| **Waste Processing** | Florists can securely discard expired or unsellable batches with a single click, setting quantity to zero |
| **JWT Security** | Stateless authentication using Spring Security + JWTs with role claims (`ROLE_ADMIN`, `ROLE_CUSTOMER`) |

---

## 🏗️ Architecture

```
                       ┌─────────────────────────┐
                       │      Login Screen       │
                       └────────────┬────────────┘
                                    │ JWT Auth
                      ┌─────────────┴─────────────┐
                      ▼                           ▼
        ┌───────────────────────────┐   ┌───────────────────────────┐
        │    Customer Storefront    │   │   Florist Admin Portal    │
        │      (ROLE_CUSTOMER)      │   │       (ROLE_ADMIN)        │
        └─────────────┬─────────────┘   └─────────────┬─────────────┘
                      │                               │
                      └───────────────┬───────────────┘
                                      │ REST API
                      ┌───────────────▼───────────────┐
                      │    Spring Boot 3 (Port 8080)   │
                      │  InventoryService (FEFO)      │
                      │  OrderService & Redis Locks   │
                      └───────────────┬───────────────┘
                                      │
                         ┌────────────┴────────────┐
                         ▼                         ▼
                  ┌──────────────┐          ┌──────────────┐
                  │  PostgreSQL  │          │    Redis     │
                  └──────────────┘          └──────────────┘
```

---

## 🚀 Getting Started

### 1. Prerequisites
- Docker & Docker Compose
- Java 21 JDK
- Node.js 18+ & npm

### 2. Start Database & Redis
```bash
docker compose up -d
```

### 3. Run Backend
```bash
cd backend
./mvnw spring-boot:run
```

### 4. Run Frontend
```bash
cd frontend
npm install
npm run dev
```

Navigate to `http://localhost:5173` to log in as either `admin` or `alice`!

---

## 📄 License

MIT License — built with ❤️ for florists and flower lovers everywhere.
