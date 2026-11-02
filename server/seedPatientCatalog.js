// Usage from project root: node server/scripts/seedPatientCatalog.js
// Requires mongoose installed on backend; safe upsert by hospital name and doctor name.
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const Hospital = require('../models/PatientHospital'), Doctor = require('../models/PatientDoctor');

(async () => {
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/medicalmanagement');
    for (const hospital of [{ name: 'Bệnh viện Đa khoa Trung tâm (demo)', address: 'Hà Nội' }, { name: 'Phòng khám An Tâm (demo)', address: 'Hà Nội' }]) {
        const h = await Hospital.findOneAndUpdate(
            { name: hospital.name },
            { $set: hospital },
            { upsert: true, new: true });
        for (const doctor of [
            { name: 'BS. Nguyễn Minh Anh', specialty: 'Nội tổng quát' },
            { name: 'BS. Trần Bảo Linh', specialty: 'Tai Mũi Họng' }]) {
            await Doctor.findOneAndUpdate(
                { name: doctor.name, hospital: h._id },
                { $set: { ...doctor, hospital: h._id } },
                { upsert: true });
        }
    }
    console.log('Seeded demo hospitals and doctors');
    await mongoose.disconnect();
})().catch(e => { console.error(e); process.exit(1) });
