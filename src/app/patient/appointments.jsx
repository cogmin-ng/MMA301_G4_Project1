import React from 'react';
import { router } from 'expo-router';
import { PatientAppointmentsView } from '../../components/patient/patient-appointments-view';

export default function AppointmentHistoryScreen() {
  return (
    <PatientAppointmentsView
      onBack={() => (router.canGoBack() ? router.back() : router.replace('/'))}
      onNavigateToBook={(params) =>
        router.push({
          pathname: '/patient/book',
          params: {
            ...(params?.hospitalId ? { hospitalId: String(params.hospitalId) } : {}),
            ...(params?.doctorId ? { doctorId: String(params.doctorId) } : {}),
          },
        })
      }
    />
  );
}
