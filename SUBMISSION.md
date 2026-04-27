# Mini Laundry Order Management System — Submission

## 1) Live Demo
**URL: https://laundry-mgmt-ai.onrender.com**

## 2) Public Repository
GitHub: https://github.com/AshishOP/laundry-mgmt-ai

## 3) Setup
1. `cp .env.example .env`
2. Set `MONGODB_URI`, `JWT_SECRET`
3. `npm install`
4. `npm run seed`
5. `npm start`
6. Open http://localhost:3000

Demo users:
- Admin: `admin@laundry.com` / `admin123`
- Staff: `staff@laundry.com` / `staff123`

## 4) Implemented Features
Core:
- Create order (customer, phone, garments, qty, bill, unique order ID)
- Status flow: RECEIVED → PROCESSING → READY → DELIVERED
- Order listing + filters (status, customer, phone, garment)
- Dashboard (total orders, revenue, orders by status, avg order value)

Bonus:
- JWT auth, MongoDB persistence, Vanilla JS SPA
- Estimated delivery date
- Security: helmet, rate limit, input validation, bcrypt

## 5) AI Usage Report
Tools: Claude, GitHub Copilot

AI helped with:
- Initial API/MVC scaffolding
- UI structure and styling draft
- Validation/middleware patterns

AI mistakes fixed manually:
- Express 5 wildcard routing issue (SPA fallback middleware)
- Mongoose hook `this` context (replaced arrow functions)
- Phone regex tightened to Indian 10-digit format

## 6) Clean Code + Tradeoffs
- Single-responsibility structure (routes/controllers/models/middleware)
- Centralized garment config and reusable validation
- Consistent naming, modular files, minimal duplication
- Chose Vanilla JS over React for faster delivery and simpler setup

## 7) API Collection / Demo
- Postman: `postman_collection.json`
- UI: http://localhost:3000 or live URL above
