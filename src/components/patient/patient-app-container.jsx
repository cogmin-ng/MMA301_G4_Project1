import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import { PatientHomeView } from './patient-home-view';
import { DoctorListView } from './doctor-list-view';
import { HospitalListView } from './hospital-list-view';
import { DoctorDetailView } from './doctor-detail-view';
import { HospitalDetailView } from './hospital-detail-view';
import { PatientBottomBar } from './patient-bottom-bar';

export function PatientAppContainer({ user, onLogout, onSwitchToAdmin }) {
  // Screen stack & navigation state
  // currentScreen: 'HOME' | 'DOCTOR_LIST' | 'HOSPITAL_LIST' | 'DOCTOR_DETAIL' | 'HOSPITAL_DETAIL'
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

  const handleBottomTabSelect = (tabKey) => {
    setBottomTab(tabKey);
    if (tabKey === 'HOME') {
      setCurrentScreen('HOME');
    } else if (tabKey === 'APPOINTMENTS') {
      navigateToDoctorList();
    }
  };

  // Chỉ hiển thị BottomBar ở màn hình chính HOME
  const showBottomBar = currentScreen === 'HOME';

  return (
    <SafeAreaView style={styles.safeContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.contentArea}>
        {/* 1. Màn hình Home/Dashboard */}
        {currentScreen === 'HOME' && (
          <PatientHomeView
            user={user}
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
      </View>

      {/* Fixed Bottom Navigation chuẩn Stitch YouMed */}
      {showBottomBar && (
        <PatientBottomBar
          currentTab={bottomTab}
          onSelectTab={handleBottomTabSelect}
          onLogout={onLogout}
          onSwitchToAdmin={onSwitchToAdmin}
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
