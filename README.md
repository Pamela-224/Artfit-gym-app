# Artfit Gym — React + Flask

A full rebuild of the Artfit gym web app: a Flask + MySQL JSON API on the backend,
and a React (Vite) single-page app on the frontend, matching the original dark
red-and-black brand.

## Project structure

```
artfit/
├── backend/          Flask API (MySQL, JWT auth)
│   ├── app.py
│   └── requirements.txt
└── frontend/          React app (Vite)
    ├── src/
    │   ├── pages/      Home, Login, Dashboard, AdminMembers, AdminAnalytics
    │   ├── components/ ProtectedRoute, AdminRoute
    │   ├── context/     AuthContext (JWT + user state)
    │   └── api/         axios client with JWT interceptor
    └── package.json
```

## 1. Backend setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows (PowerShell: venv\Scripts\Activate.ps1)
pip install -r requirements.txt
```

Create the MySQL database referenced in `app.py` (defaults to
`mysql+pymysql://root:@localhost:3307/gym_app_db` — edit the
`SQLALCHEMY_DATABASE_URI` near the top of `app.py` if your MySQL user, password,
port, or database name differ):

```sql
CREATE DATABASE gym_app_db;
```

Run the API:

```bash
python app.py
```

The first time it's running, hit `http://localhost:5000/api/init-db` once
(visit it in a browser or `curl` it) to create the tables and seed a default
admin account:

- **Admin email:** `admin@artfit.com`
- **Admin password:** `admin123`

Change this password (or delete/recreate the admin user) before using this in
anything beyond local development.

## 2. Frontend setup

```bash
cd frontend
npm install
npm run dev
```

The dev server runs on `http://localhost:5173` by default and talks to the API
at `http://localhost:5000/api`. To point it elsewhere, copy `.env.example` to
`.env` and set `VITE_API_URL`.

## How auth works

- Login/register hit `/api/login` and `/api/register`. A successful login
  returns a JWT, which the frontend stores in `localStorage` and attaches to
  every subsequent API call as `Authorization: Bearer <token>` (see
  `src/api/client.js`).
- `ProtectedRoute` guards `/dashboard` (must be logged in).
- `AdminRoute` guards `/admin` and `/admin/dashboard` (must be logged in **and**
  `is_admin` must be true).

## Pages

| Route               | Description                                              |
|---------------------|------------------------------------------------------------|
| `/`                  | Landing page — hero, services, gallery, plans, free-trial signup form |
| `/login`             | Sign in / create account (tabbed)                        |
| `/dashboard`         | Member dashboard — plan, services, profile editing, activity feed |
| `/admin`             | Admin: searchable tables of free-trial signups & registered users, with delete |
| `/admin/dashboard`   | Admin analytics — signups over time, plan distribution, age buckets, service popularity (Chart.js) |

## Notes

- The free-trial signup form (`/` → "Claim Free Trial") writes to the
  `Signup` table — this is the same data that powers the admin tables and
  analytics charts, and is separate from the `User` login accounts.
- To make someone an admin, set `is_admin = 1` on their row in the `user`
  table directly in MySQL (there's no UI for granting admin rights, by design).
