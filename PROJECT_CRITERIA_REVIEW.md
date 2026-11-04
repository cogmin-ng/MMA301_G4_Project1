# Project criteria review

This review checks the merged `main` and `Giang` code against the supplied mobile-project brief. API checks ran against the local MySQL `medical_booking` database on 2026-11-04.

## Results

| Criterion | Result | Evidence / remaining work |
| --- | --- | --- |
| React Native app and screen navigation | Meets in code | Expo/React Native app has Patient, Doctor and Admin flows. Patient booking screens are under `src/app/patient`; the Patient appointments tab opens booking history. A physical Android/emulator run was not performed. |
| Express backend and MySQL database | Meets | API health returned `200`; the schema from `med_booking.txt` created 14 tables. API responses are JSON. |
| Login, registration and role access | Meets for tested flows | Admin, Doctor and Patient login passed. Anonymous protected requests returned `401`; cross-role requests returned `403`. New/legacy passwords use scrypt after the legacy account next logs in. |
| Main booking flow | Meets for tested flow | Hospital/doctor discovery, generated slots, busy-time blocking, booking, duplicate rejection, Doctor confirmation, Patient history/cancellation and slot release all passed end-to-end. |
| API CRUD | Meets for tested resources | Admin Hospital and Doctor create/update/status/delete operations passed. Patient profile, appointment and Doctor schedule/time-off operations passed. |
| Loading and error handling | Partially verified | Screens include loading/error states, and invalid date/password/duplicate-booking cases returned expected error status codes. Visual/device behavior was not tested. |
| Data comes from the server | Partial | Main booking and profile flows use MySQL APIs. Some Admin services retain hard-coded offline fallback arrays, so the brief's “server data, no hard-coding” criterion is not fully met. |
| Statistics and advanced features | Partial | Dashboard and appointment statistics endpoints returned `200`. Chat/multi-user messaging is not implemented in this repository. |
| APK/store deploy and demo links | Not verified | No APK, store listing, YouTube demo, or deployment configuration was validated in this task. |

## API test run

All 70 HTTP smoke assertions passed across the following areas:

- Health and MySQL connection, login for each role, invalid login, and access-control responses.
- Public hospital/doctor search and detail, patient profile, doctor profile, schedules and appointments.
- Weekly schedule and time-off creation/removal, slot generation, blocking, booking, duplicate-booking conflict, confirmation, cancellation and slot release.
- Hospital and Doctor CRUD, Admin account create/role/status/avatar management, dashboard/appointment statistics, appointment details/history and Base64 upload.
- Input validation for an invalid slot date.

Temporary test accounts, hospitals, doctors, schedules, time off, appointments, notifications and generated slot data were removed after the run. The seeded demo accounts and project data remain in the local database.

## Changes made during merge and verification

- Merged the fetched `origin/main` into `Giang`, preserving Doctor portal features and Patient booking/profile plus Admin Doctor/Appointment features.
- Updated Patient booking SQL to match `med_booking.txt` (`doctor_hospitals`, `doctor_schedules`, `start_time`, `end_time`, appointment snapshots and `appointment_slots`).
- Replaced the legacy forgeable `jwt-*` middleware with signed-token validation for protected Doctor, Patient and Admin APIs.
- Removed a hospital-detail query for `hospital_working_hours`, a table absent from the provided schema; the endpoint now returns `working_hours: []`.
- Synced `package-lock.json` with `package.json` so clean dependency installation succeeds.

## Lint

Expo lint completed with zero errors and five existing warnings in Admin, login and upload files. Android build/device testing was not part of the API test run.
