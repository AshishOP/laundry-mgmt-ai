# Mini Laundry Order Management System — Submission

## Live Demo
- URL: https://laundry-mgmt-ai.onrender.com

## Public Repository
- GitHub: https://github.com/AshishOP/laundry-mgmt-ai

## Setup (Local)
1. `cp .env.example .env`
2. Set `MONGODB_URI`, `JWT_SECRET`
3. `npm install`
4. `npm run seed`
5. `npm start`

Demo credentials:
- Admin: `admin@laundry.com` / `admin123`
- Staff: `staff@laundry.com` / `staff123`

## Features
Core:
- Create order (customer, phone, garments, quantities, bill, unique order ID)
- Status lifecycle: RECEIVED → PROCESSING → READY → DELIVERED
- Order listing + filters (status, customer, phone, garment type)
- Dashboard: total orders, revenue, status distribution, average order value

Bonus:
- JWT auth, MongoDB persistence, Vanilla JS SPA
- Estimated delivery date
- Security middleware (helmet, rate limit, validation, bcrypt)

## AI Usage
Tools:
- Claude
- GitHub Copilot

AI helped with:
- API/MVC scaffolding
- UI structure and style baseline
- Validation/middleware patterns

Manual improvements:
- Express 5 routing fallback fix
- Mongoose hook context fix (`function` over arrow in hooks)
- Phone validation hardening (`^[6-9]\d{9}$`)

## Clean Code + Tradeoffs
- Modular structure (`routes/controllers/models/middleware`)
- Centralized garment config and reusable validation
- Minimal duplication and clear naming
- Chose Vanilla JS for faster delivery over React

## API Collection / Demo Assets
- Postman: `postman_collection.json`
- Live app: https://laundry-mgmt-ai.onrender.com
