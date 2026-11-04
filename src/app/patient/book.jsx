import React from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { PatientBookingView } from '../../components/patient/patient-booking-view';

export default function BookAppointmentScreen() {
  const params = useLocalSearchParams();
  return (
    <PatientBookingView
      initialHospitalId={params?.hospitalId ? Number(params.hospitalId) : null}
      initialDoctorId={params?.doctorId ? Number(params.doctorId) : null}
      onBack={() => (router.canGoBack() ? router.back() : router.replace('/'))}
      onBookingSuccess={() => router.replace('/patient/appointments')}
    />
  );
}
