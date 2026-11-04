import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import { router } from 'expo-router';
import { PatientHomeView } from './patient-home-view';
import { DoctorListView } from './doctor-list-view';
import { HospitalListView } from './hospital-list-view';
import { DoctorDetailView } from './doctor-detail-view';
import { HospitalDetailView } from './hospital-detail-view';
import { PatientProfileView } from './patient-profile-view';
import { PatientBottomBar } from './patient-bottom-bar';

export function PatientAppContainer({ user, onLogout, onSwitchToAdmin }) {
  const [currentUser, setCurrentUser] = useState(user);

  // Screen stack & navigation state
  // currentScreen: 'HOME' | 'DOCTOR_LIST' | 'HOSPITAL_LIST' | 'DOCTOR_DETAIL' | 'HOSPITAL_DETAIL' | 'PROFILE'
  const [currentScreen, setCurrentScreen] = useState('HOME');
  const [selectedDoctorId, setSelectedDoctorId] = useState(null);
  const [selectedHospitalId, setSelectedHospitalId] = useState(null);
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
    setSelectedDoctorId(doctorId);
    setCurrentScreen('DOCTOR_DETAIL');
  };

  const navigateToHospitalDetail = (hospitalId) => {
    setSelectedHospitalId(hospitalId);
    setCurrentScreen('HOSPITAL_DETAIL');
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
      router.push('/patient/appointments');
    }
  };

  // Hiển thị BottomBar ở màn hình HOME và PROFILE
  const showBottomBar = currentScreen === 'HOME' || currentScreen === 'PROFILE';

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
            onBack={() => setCurrentScreen('DOCTOR_LIST')}
            onNavigateToHospitalDetail={navigateToHospitalDetail}
          />
        )}

        {/* 5. Màn hình Hospital Detail */}
        {currentScreen === 'HOSPITAL_DETAIL' && (
          <HospitalDetailView
            hospitalId={selectedHospitalId}
            onBack={() => setCurrentScreen('HOSPITAL_LIST')}
            onNavigateToDoctorDetail={navigateToDoctorDetail}
          />
        )}

        {/* 6. Màn hình Patient Profile */}
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
