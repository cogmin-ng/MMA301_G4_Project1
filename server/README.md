# API server setup

The server connects to the MySQL database described in `med_booking.txt`. Set these environment variables in `server/.env` before starting it:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your-database-password
DB_NAME=medical_booking
JWT_SECRET=replace-with-a-random-secret-of-at-least-32-characters
```

Generate a secret with `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`. The API uses a temporary random secret when `JWT_SECRET` is omitted in local development; all sessions expire when the server restarts. Set a stable secret for deployed environments.

Passwords created by registration or the admin account creation API are stored with Node.js scrypt hashes. Existing plain-text seed passwords are upgraded to scrypt when their account next logs in successfully.

Doctor portal endpoints under `/api/doctor-portal` require a signed bearer token for an active `DOCTOR` account. Admin role preview uses `/api/auth/switch-role` and requires an active admin session.
