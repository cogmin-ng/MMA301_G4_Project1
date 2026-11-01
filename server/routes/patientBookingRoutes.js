const router=require('express').Router();
const requirePatient=require('../middleware/requirePatient');
const c=require('../controllers/patientBookingController');
router.use(requirePatient); // FIRST mount your existing JWT/session auth middleware in server entrypoint
router.get('/hospitals',c.hospitals);
router.get('/hospitals/:hospitalId/doctors',c.doctors);
router.get('/doctors/:doctorId/slots',c.slots);
router.post('/appointments',c.create);
router.get('/appointments',c.history);
router.patch('/appointments/:id/cancel',c.cancel);
module.exports=router;
