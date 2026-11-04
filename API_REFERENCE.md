# Medical Booking API

Base URL: `http://localhost:5000/api`. Responses use JSON unless the endpoint returns an uploaded image data URL. Protected requests use `Authorization: Bearer <token>` from `POST /auth/login`.

Roles in this document: **Public** requires no session, **Patient** requires an active `PATIENT`, **Doctor** requires an active `DOCTOR`, and **Admin** requires an active `ADMIN`.

## Health and authentication

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/health` | Public | Check API and MySQL connectivity. |
| POST | `/auth/login` | Public | Sign in with email/phone and password; returns user and signed token. |
| POST | `/auth/register` | Public | Register a patient account. |
| POST | `/auth/switch-role` | Admin | Issue a signed demo session for an active account with the requested role. |
| POST | `/auth/switch-user` | Admin | Issue a signed demo session for a selected active user. |
| GET | `/auth/users?role=&search=` | Admin | Search and filter accounts. |
| POST | `/auth/users` | Admin | Create a user account and its role profile. |
| PATCH | `/auth/users/:id/role` | Admin | Change a user's role. |
| PATCH | `/auth/users/:id/status` | Admin | Toggle account active status. |
| PATCH | `/auth/users/:id/avatar` | Owner or Admin | Update the user's avatar URL. |
| GET | `/auth/profile` | Patient | Read the signed-in patient's profile. |
| PUT | `/auth/profile` | Patient | Update the signed-in patient's profile. |

## Hospitals

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/hospitals?keyword=&province=&status=` | Public | Search/filter hospitals. |
| GET | `/hospitals/meta/provinces` | Public | List provinces in the database. |
| GET | `/hospitals/:id` | Public | Read hospital, linked doctors and specialties. `working_hours` is empty because the supplied schema has no hospital-hours table. |
| POST | `/hospitals` | Admin | Create a hospital. |
| PUT | `/hospitals/:id` | Admin | Update a hospital. |
| PATCH | `/hospitals/:id/status` | Admin | Toggle hospital status. |
| DELETE | `/hospitals/:id` | Admin | Delete an unreferenced hospital. |

## Doctors and specialties

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/doctors/meta/specialties` | Public | List specialties. |
| GET | `/doctors?keyword=&specialty=&hospital_id=&status=` | Public | Search and filter doctors. |
| GET | `/doctors/:id` | Public | Read doctor profile, locations and weekly schedules. |
| POST | `/doctors` | Admin | Create a doctor profile and optional hospital/specialty links. |
| PUT | `/doctors/:id` | Admin | Update a doctor profile and its links. |
| PATCH | `/doctors/:id/status` | Admin | Toggle doctor/account status. |
| DELETE | `/doctors/:id` | Admin | Delete a doctor without appointments. |

## Doctor portal

All `/doctor-portal` endpoints require a Doctor token.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/doctor-portal/profile` | Read the signed-in doctor's profile and linked hospitals/specialties. |
| PATCH | `/doctor-portal/profile` | Update the doctor's profile. |
| GET | `/doctor-portal/appointments?status=&date=` | List that doctor's appointments. |
| PATCH | `/doctor-portal/appointments/:id` | Confirm or reject a pending appointment (`status=CONFIRMED` or `REJECTED`). |
| GET | `/doctor-portal/schedules` | Read weekly schedules and future time off. |
| POST | `/doctor-portal/schedules` | Add a weekly available window with slot duration. |
| DELETE | `/doctor-portal/schedules/:id` | Delete one of the doctor's schedules. |
| POST | `/doctor-portal/time-offs` | Mark a date/time range as busy. |
| DELETE | `/doctor-portal/time-offs/:id` | Remove a busy range. |

## Patient booking

All `/patient` endpoints require a Patient token.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/patient/hospitals` | List active hospitals. |
| GET | `/patient/hospitals/:hospitalId/doctors` | List active doctors linked to a hospital. |
| GET | `/patient/doctors/:doctorId/slots?hospitalId=:id&date=YYYY-MM-DD` | Generate available slots from weekly schedules, existing bookings and time off. |
| POST | `/patient/appointments` | Book an available slot; creates a pending appointment and slot record. |
| GET | `/patient/appointments` | Read the signed-in patient's booking history. |
| PATCH | `/patient/appointments/:id/cancel` | Cancel the patient's pending or confirmed appointment and release its slot. |

## Admin appointments and dashboard

All `/appointments` and `/admin/dashboard` endpoints require an Admin token.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/appointments/stats` | Count appointments by status and today's appointments. |
| GET | `/appointments?keyword=&status=&hospital_id=&doctor_id=&date=` | Search/filter all appointments. |
| GET | `/appointments/:id` | Read an appointment and status history. |
| POST | `/appointments` | Create an appointment. |
| PATCH | `/appointments/:id/confirm` | Confirm an appointment. |
| PATCH | `/appointments/:id/cancel` | Cancel/reject an appointment with a reason. |
| PATCH | `/appointments/:id/status` | Set an allowed appointment status. |
| DELETE | `/appointments/:id` | Delete an appointment and its history. |
| GET | `/admin/dashboard/stats` | Read system dashboard counts and revenue. |

## Uploads

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| POST | `/upload` | Public | Convert an uploaded image to a data URL in memory. |
| POST | `/upload/base64` | Public | Normalize a Base64 image string to a data URL. |
