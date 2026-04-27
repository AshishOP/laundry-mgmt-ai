# 🧺 LaundryOS — AI-First Order Management System

![Node.js](https://img.shields.io/badge/Node.js-18%2B-111111?style=flat&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-5.x-111111?style=flat&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Database-111111?style=flat&logo=mongodb&logoColor=white)
![JWT](https://img.shields.io/badge/Auth-JWT-111111?style=flat)
![License](https://img.shields.io/badge/License-MIT-111111?style=flat)

A professional, high-performance laundry management system built with an "AI-First" methodology. This project demonstrates high-speed execution, deep problem-solving, and a focus on production-grade security.

## ✨ Live Demo
**URL: https://laundry-mgmt-ai.onrender.com**

### First-time Render bootstrap (free plan)
If demo users are missing on live deploy, run this once in browser:

`https://laundry-mgmt-ai.onrender.com/api/dev/seed-database?secret=<YOUR_SEED_SECRET>`

Then login with:
- Admin: `admin@laundry.com` / `admin123`
- Staff: `staff@laundry.com` / `staff123`

## 🔗 Repository
Public GitHub: https://github.com/AshishOP/laundry-mgmt-ai

## 🚀 Quick Execution Guide

### 1. Prerequisites
- Node.js 18+
- MongoDB running locally or remotely

### 2. Environment Setup
```bash
cp .env.example .env
```
Update at least:
- `MONGODB_URI`
- `JWT_SECRET`

### 3. Install + Seed Demo Data
```bash
# Install dependencies
npm install

# Seed the database (Creates credentials & sample data)
npm run seed
```
**Admin Login:** `admin@laundry.com` | `admin123`

### 4. Run the App
```bash
npm start
```
Go to: [http://localhost:3000](http://localhost:3000)

---

## 🎯 Evaluation Checklist (Meeting All Requirements)

### Core Features
- [x] **Create Order**: Dynamic form with auto-calculated billing.
- [x] **Unique ID**: Nanoid generated readable IDs (e.g., `LD-X7K9M2B4`).
- [x] **Status Management**: Full lifecycle (`RECEIVED` → `PROCESSING` → `READY` → `DELIVERED`).
- [x] **View Orders**: Comprehensive list with status and customer name/phone searching.
- [x] **Dashboard**: Real-time stats on revenue, total orders, and pipeline status.

### Bonus Features (Included)
- [x] **Authentication**: Secure JWT-based login/logout.
- [x] **Role-Based Access**: Public sign-up disabled; only admins can create users.
- [x] **Database**: Robust MongoDB integration with indexing.
- [x] **Search**: Search by garment type (e.g., find all "Saree" orders).
- [x] **Advanced UI**: Minimal monochrome SPA (Single Page Application).
- [x] **Security Stack**: Helmet, Rate Limiting, Input Validation, Bcrypt.
- [x] **Estimated Delivery**: Algorithm-based delivery date calculation.

---

## 🤖 AI Usage & Problem Solving Report

### Tools Used
- Claude (planning, prompt-based scaffolding, debugging ideas)
- GitHub Copilot (in-editor code completion and refactors)

### Sample Prompts Used
1. "Generate Express + MongoDB MVC scaffolding for a laundry order API with create/list/update status and dashboard stats."
2. "Create a Mongoose order schema that calculates garment subtotals and total bill automatically before save."
3. "Build a simple monochrome vanilla JS SPA with login, dashboard cards, order table, filters, and modal forms."
4. "Add status transition validation so order flow is strictly RECEIVED → PROCESSING → READY → DELIVERED."
5. "Harden this Express app with helmet, rate limiting, JWT auth middleware, and request validation."

### Where AI Helped
- **Scaffolding**: Used AI to generate the initial Express structure and Mongoose schemas based on the problem statement.
- **UI Design**: Prompted for a "Monochrome Premium Design System" which generated the base CSS variables and layout structure.
- **Data Generation**: Used AI to create realistic seed data for the laundry business context.

### What AI Got Wrong + What I Improved
1. **Express 5.x Wildcard Conflict**: AI generated boilerplate for Express 4.x. Upon running, the server crashed due to a `PathError` in the new routing engine. I manually debugged the router layers and refactored the wildcard logic to use `app.use` middleware for the SPA fallback.
2. **Mongoose Context Binding**: AI initially suggested `async` arrow functions for Mongoose hooks. I identified that this would break `this` context binding for field calculations and refactored them to standard `function` expressions.
3. **Regex Security**: I manually improved the phone number regex to strictly enforce 10-digit Indian formats, preventing malformed customer data that AI-generated regex often overlooks.

---

## 🛠️ Code Quality & Architecture

- **Clean Architecture**: 
  - `controllers/`: Pure business logic.
  - `models/`: Data schema and automated calculations.
  - `middleware/`: Decoupled security and validation layers.
- **Dry Pricing Engine**: Pricing and processing times are centralized in `config/garments.js` for easy updates without changing code logic.
- **Fail-Safe Processing**: Status transitions are validated at the API level (e.g., an order cannot be "Delivered" unless it was "Ready" first).

---

## 📐 Tradeoffs & Decisions

| Decision | Tradeoff | Rationale |
| :--- | :--- | :--- |
| **Vanilla JS Frontend** | No React build-step | Blazing fast load times and demonstrates "back-to-basics" DOM proficiency. |
| **Express 5.x** | Newer syntax required | Used the latest version to demonstrate familiarity with cutting-edge framework updates. |
| **Monochrome UI** | Restricted color palette | Ensures a professional, "SaaS-like" feel that focuses on data over decoration. |

---

## 📄 API Collection
A Postman collection `postman_collection.json` is provided in the root directory for automated testing of all endpoints.

---
**Developed with Speed and Precision for Internship Assessment**
