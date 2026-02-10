# Property Marketplace – Backend

Flask API for seller registration, login, property listing (with DHA/Bahria auto-approve vs other locations pending admin approval), and admin approve/reject. Uses **PostgreSQL** (or SQLite if `DATABASE_URL` is not set; see Config below).

## Setup

1. Install PostgreSQL from https://www.postgresql.org/download/windows/
1. **PostgreSQL**: Create a database, e.g. `property_market`.

2. **Environment**: Set `DATABASE_URL` for PostgreSQL in config.py:
   ```bash
   set DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/property_market
   
   DATABASE_URL=postgresql://postgres:admin@localhost:5432/property_market # current username and password
   ```
   If unset, the app defaults to `postgresql://postgres:postgres@localhost:5432/property_market`.

3. **Run**:
   ```bash
   cd backend
   python -m venv venv
   venv\Scripts\activate   # Windows
   # source venv/bin/activate  # Mac/Linux
   pip install -r requirements.txt
   python run.py
   ```

Server runs at `http://localhost:5000`. Use the frontend from a local server (e.g. Live Server on port 5500) so CORS and API calls work.

## Default admin (for testing)

- **Email:** `admin@maharajabuilders.pk`  
- **Password:** `admin123`  

Created automatically on first run if no admin exists.

## API

- **POST** `/api/users/signup` – Body: `{ "full_name", "email", "phone", "password" }`
- **POST** `/api/users/login` – Body: `{ "email", "password" }` → returns `{ "token", "user" }`
- **GET** `/api/properties` – Public list of approved properties. Query: `?city=&area=&listing_type=`
- **GET** `/api/properties/<id>` – Single approved property (for detail page)
- **GET** `/api/properties/my` – **Auth** – Current user’s properties (any status)
- **POST** `/api/properties` – **Auth** – Create property. DHA/Bahria → approved; Other → pending_approval
- **GET** `/api/admin/stats` – **Admin** – Platform stats (total_users, total_listings, pending_approvals, approved_listings)
- **GET** `/api/admin/users` – **Admin** – List all users
- **GET** `/api/admin/properties` – **Admin** – List all properties. Query: `?status=pending|approved|rejected`
- **GET** `/api/admin/properties/pending` – **Admin** – List pending properties
- **POST** `/api/admin/properties/<id>/approve` – **Admin** – Approve
- **POST** `/api/admin/properties/<id>/reject` – **Admin** – Reject and delete
- **DELETE** `/api/properties/<id>` – **Auth** – Seller deletes own property

Auth header for protected routes: `Authorization: Bearer <token>`.

## Payment placeholder

For non–DHA/Bahria listings, the frontend shows Rs. 500 payment via JazzCash/EasyPaisa (placeholder number **0300-1234567**). The backend does not verify payment; it only sets status to `pending_approval` until admin approves or rejects.
