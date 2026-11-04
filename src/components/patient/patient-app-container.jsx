import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import { PatientHomeView } from './patient-home-view';
import { DoctorListView } from './doctor-list-view';
import { HospitalListView } from './hospital-list-view';
import { DoctorDetailView } from './doctor-detail-view';
import { HospitalDetailView } from './hospital-detail-view';
import { PatientProfileView } from './patient-profile-view';
import { PatientAppointmentsView } from './patient-appointments-view';
import { PatientBookingView } from './patient-booking-view';
import { PatientBottomBar } from './patient-bottom-bar';

export function PatientAppContainer({ user, onLogout, onSwitchToAdmin }) {
  const [currentUser, setCurrentUser] = useState(user);

  // Screen stack & navigation state
  // currentScreen: 'HOME' | 'DOCTOR_LIST' | 'HOSPITAL_LIST' | 'DOCTOR_DETAIL' | 'HOSPITAL_DETAIL' | 'APPOINTMENTS' | 'BOOK_APPOINTMENT' | 'PROFILE'
  const [currentScreen, setCurrentScreen] = useState('HOME');
  const [previousScreen, setPreviousScreen] = useState('HOME');
  const [selectedDoctorId, setSelectedDoctorId] = useState(null);
  const [selectedHospitalId, setSelectedHospitalId] = useState(null);
  const [bookingParams, setBookingParams] = useState({ hospitalId: null, doctorId: null });
  const [searchParams, setSearchParams] = useState({});

  // Bottom bar tab state: 'HOME' | 'APPOINTMENTS' | 'ACCOUNT'
  const [bottomTab, setBottomTab] = useState('HOME');

  const navigateToHome = () => {
    setCurrentScreen('HOME');
    setBottomTab('HOME');
  };

  const navigateToDoctorList = (params = {}) => {
    setSearchParams(params);
    setCurrentScreen('DOCTOR_LIST');
  };

  const navigateToHospitalList = (params = {}) => {
    setSearchParams(params);
    setCurrentScreen('HOSPITAL_LIST');
  };

  const navigateToDoctorDetail = (doctorId) => {
    setPreviousScreen(currentScreen);
    setSelectedDoctorId(doctorId);
    setCurrentScreen('DOCTOR_DETAIL');
  };

  const navigateToHospitalDetail = (hospitalId) => {
    setPreviousScreen(currentScreen);
    setSelectedHospitalId(hospitalId);
    setCurrentScreen('HOSPITAL_DETAIL');
  };

  const navigateToAppointments = () => {
    setCurrentScreen('APPOINTMENTS');
    setBottomTab('APPOINTMENTS');
  };

  const navigateToBookAppointment = (params = {}) => {
    setPreviousScreen(currentScreen);
    setBookingParams({
      hospitalId: params?.hospitalId || null,
      doctorId: params?.doctorId || null,
    });
    setCurrentScreen('BOOK_APPOINTMENT');
  };

  const navigateToProfile = () => {
    setCurrentScreen('PROFILE');
    setBottomTab('ACCOUNT');
  };

  const handleBottomTabSelect = (tabKey) => {
    setBottomTab(tabKey);
    if (tabKey === 'HOME') {
      setCurrentScreen('HOME');
    } else if (tabKey === 'APPOINTMENTS') {
      setCurrentScreen('APPOINTMENTS');
    } else if (tabKey === 'PROFILE') {
      setCurrentScreen('PROFILE');
    }
  };

  // Hiển thị BottomBar ở 3 màn hình tab chính: HOME, APPOINTMENTS, PROFILE
  const showBottomBar =
    currentScreen === 'HOME' ||
    currentScreen === 'APPOINTMENTS' ||
    currentScreen === 'PROFILE';

  return (
    <SafeAreaView style={styles.safeContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.contentArea}>
        {/* 1. Màn hình Home/Dashboard */}
        {currentScreen === 'HOME' && (
          <PatientHomeView
            user={currentUser}
            onNavigateToDoctorList={navigateToDoctorList}
            onNavigateToHospitalList={navigateToHospitalList}
            onNavigateToDoctorDetail={navigateToDoctorDetail}
            onNavigateToHospitalDetail={navigateToHospitalDetail}
            onNavigateToBook={navigateToBookAppointment}
            onNavigateToAppointments={navigateToAppointments}
          />
        )}

        {/* 2. Màn hình Doctor List */}
        {currentScreen === 'DOCTOR_LIST' && (
          <DoctorListView
            initialKeyword={searchParams?.keyword || ''}
            initialSpecialty={searchParams?.specialty || ''}
            initialHospitalId={searchParams?.hospital_id}
            onBack={navigateToHome}
            onNavigateToHospitalList={navigateToHospitalList}
            onNavigateToDoctorDetail={navigateToDoctorDetail}
          />
        )}

        {/* 3. Màn hình Hospital List */}
        {currentScreen === 'HOSPITAL_LIST' && (
          <HospitalListView
            initialKeyword={searchParams?.keyword || ''}
            onBack={navigateToHome}
            onNavigateToDoctorList={navigateToDoctorList}
            onNavigateToHospitalDetail={navigateToHospitalDetail}
          />
        )}

        {/* 4. Màn hình Doctor Detail */}
        {currentScreen === 'DOCTOR_DETAIL' && (
          <DoctorDetailView
            doctorId={selectedDoctorId}
            onBack={() =>
              setCurrentScreen(
                previousScreen === 'APPOINTMENTS' || previousScreen === 'HOSPITAL_DETAIL'
                  ? previousScreen
                  : 'DOCTOR_LIST'
              )
            }
            onNavigateToHospitalDetail={navigateToHospitalDetail}
            onNavigateToBook={navigateToBookAppointment}
          />
        )}

        {/* 5. Màn hình Hospital Detail */}
        {currentScreen === 'HOSPITAL_DETAIL' && (
          <HospitalDetailView
            hospitalId={selectedHospitalId}
            onBack={() =>
              setCurrentScreen(
                previousScreen === 'DOCTOR_DETAIL' ? 'DOCTOR_DETAIL' : 'HOSPITAL_LIST'
              )
            }
            onNavigateToDoctorDetail={navigateToDoctorDetail}
            onNavigateToBook={navigateToBookAppointment}
          />
        )}

        {/* 6. Màn hình Lịch khám của bệnh nhân */}
        {currentScreen === 'APPOINTMENTS' && (
          <PatientAppointmentsView
            onNavigateToBook={navigateToBookAppointment}
            onNavigateToDoctorDetail={navigateToDoctorDetail}
          />
        )}

        {/* 7. Màn hình Đặt lịch khám */}
        {currentScreen === 'BOOK_APPOINTMENT' && (
          <PatientBookingView
            initialHospitalId={bookingParams.hospitalId}
            initialDoctorId={bookingParams.doctorId}
            onBack={() =>
              setCurrentScreen(
                previousScreen && previousScreen !== 'BOOK_APPOINTMENT'
                  ? previousScreen
                  : 'HOME'
              )
            }
            onBookingSuccess={navigateToAppointments}
          />
        )}

        {/* 8. Màn hình Patient Profile */}
        {currentScreen === 'PROFILE' && (
          <PatientProfileView
            user={currentUser}
            onLogout={onLogout}
            onBack={navigateToHome}
            onProfileUpdated={(updated) => setCurrentUser((prev) => ({ ...prev, ...updated }))}
          />
        )}
      </View>

      {/* Fixed Bottom Navigation */}
      {showBottomBar && (
        <PatientBottomBar
          currentTab={bottomTab}
          onSelectTab={handleBottomTabSelect}
          onLogout={onLogout}
          onSwitchToAdmin={onSwitchToAdmin}
          onNavigateToProfile={navigateToProfile}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  contentArea: {
    flex: 1,
  },
});
