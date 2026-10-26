import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@/context/auth-context';
import { LoginView } from '@/components/auth/login-view';
import { RegisterView } from '@/components/auth/register-view';
import { AdminHomeGrid } from '@/components/admin/admin-home-grid';
import { AdminDashboardView } from '@/components/admin/admin-dashboard-view';
import { HospitalListView } from '@/components/admin/hospital-list-view';
import { AdminMoreView } from '@/components/admin/admin-more-view';
import { UserRbacView } from '@/components/admin/user-rbac-view';
import { AdminBottomBar } from '@/components/admin/admin-bottom-bar';
import { PatientAppContainer } from '@/components/patient/patient-app-container';
import { dashboardService } from '@/services/dashboard-service';
import { MedicalColors, Spacing } from '@/constants/theme';

export default function AppEntryScreen() {
  const { user, isAuthenticated, isAdmin, isDoctor, isLoading, logout, switchRole } =
    useAuth();

  // Auth toggle
  const [authMode, setAuthMode] = useState('LOGIN');

  // Admin Navigation Tab
  const [currentTab, setCurrentTab] = useState('HOME');
  const [autoOpenCreateHospital, setAutoOpenCreateHospital] = useState(false);
  const [showRbacView, setShowRbacView] = useState(false);

  // Live Stats from system
  const [stats, setStats] = useState(null);

  const loadStats = useCallback(async () => {
    try {
      const data = await dashboardService.getDashboardStats();
      setStats(data);
    } catch (err) {
      console.warn('Lỗi tải thống kê hệ thống:', err.message);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      loadStats();
    }
  }, [isAuthenticated, isAdmin, loadStats]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={MedicalColors.primary} />
        <Text style={styles.loadingText}>Đang tải dữ liệu hệ thống...</Text>
      </View>
    );
  }

  // 1. Khi chưa đăng nhập: Giao diện Login / Register
  if (!isAuthenticated || !user) {
    return (
      <SafeAreaView style={styles.safeContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        {authMode === 'LOGIN' ? (
          <LoginView onNavigateToRegister={() => setAuthMode('REGISTER')} />
        ) : (
          <RegisterView onNavigateToLogin={() => setAuthMode('LOGIN')} />
        )}
      </SafeAreaView>
    );
  }

  // 2. Khi đăng nhập với vai trò PATIENT: Hiển thị trọn vẹn 5 màn hình Stitch
  if (user?.role === 'PATIENT') {
    return (
      <PatientAppContainer
        user={user}
        onLogout={logout}
        onSwitchToAdmin={() => switchRole('ADMIN')}
      />
    );
  }

  // 3. Khi đăng nhập với vai trò DOCTOR
  if (isDoctor) {
    return (
      <SafeAreaView style={styles.safeContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={styles.nonAdminContainer}>
          <View style={styles.nonAdminCard}>
            <MaterialCommunityIcons
              name="doctor"
              size={56}
              color="#0284C7"
              style={{ marginBottom: 12 }}
            />
            <View style={styles.nonAdminBadge}>
              <Text style={styles.nonAdminBadgeText}>VAI TRÒ: BÁC SĨ</Text>
            </View>
            <Text style={styles.nonAdminName}>{user.full_name}</Text>
            <Text style={styles.nonAdminEmail}>{user.email}</Text>

            <View style={styles.divider} />

            <Text style={styles.nonAdminNotice}>
              Giao diện Bác sĩ: Quản lý lịch hẹn khám, thiết lập khung giờ và theo dõi ca trực.
            </Text>

            <TouchableOpacity
              style={styles.switchBackAdminBtn}
              onPress={() => switchRole('ADMIN')}>
              <Text style={styles.switchBackAdminText}>
                Quay về giao diện Quản trị viên
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.switchBackAdminBtn, { backgroundColor: '#E0F2FE', marginTop: 10 }]}
              onPress={() => switchRole('PATIENT')}>
              <Text style={[styles.switchBackAdminText, { color: '#0369A1' }]}>
                Trải nghiệm giao diện Bệnh nhân (5 màn hình)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.logoutOutlineBtn} onPress={logout}>
              <Text style={styles.logoutOutlineText}>Đăng xuất</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // 4. PHÂN HỆ QUẢN TRỊ VIÊN (Role: ADMIN) - Giao diện chuẩn 5 Tab y tế
  return (
    <SafeAreaView style={styles.safeContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#EDF5FA" />

      {/* Main View Area based on Bottom Navigation */}
      <View style={styles.mainViewArea}>
        {/* Tab 1: Trang chủ */}
        {currentTab === 'HOME' && (
          <AdminHomeGrid
            stats={stats}
            onNavigateToHospitals={() => {
              setAutoOpenCreateHospital(false);
              setCurrentTab('HOSPITALS');
            }}
            onOpenCreateHospital={() => {
              setAutoOpenCreateHospital(true);
              setCurrentTab('HOSPITALS');
            }}
            onNavigateToDashboard={() => setCurrentTab('DASHBOARD')}
            onNavigateToProfile={() => setCurrentTab('MORE')}
            onNavigateToRbac={() => setCurrentTab('RBAC')}
          />
        )}

        {/* Tab 2: Quản lý Bệnh viện & Cơ sở y tế */}
        {currentTab === 'HOSPITALS' && (
          <HospitalListView
            initialCreateOpen={autoOpenCreateHospital}
            onCloseCreateOpen={() => setAutoOpenCreateHospital(false)}
          />
        )}

        {/* Tab 3: Thống kê & Dashboard */}
        {currentTab === 'DASHBOARD' && (
          <AdminDashboardView
            onNavigateToHospitals={() => {
              setAutoOpenCreateHospital(false);
              setCurrentTab('HOSPITALS');
            }}
            onOpenCreateHospital={() => {
              setAutoOpenCreateHospital(true);
              setCurrentTab('HOSPITALS');
            }}
          />
        )}

        {/* Tab 4: Phân quyền vai trò (RBAC) */}
        {currentTab === 'RBAC' && (
          <UserRbacView onBackToHome={() => setCurrentTab('HOME')} />
        )}

        {/* Tab 5: Khác & Cài đặt */}
        {currentTab === 'MORE' && (
          <AdminMoreView
            onNavigateToHospitals={() => setCurrentTab('HOSPITALS')}
            onNavigateToDashboard={() => setCurrentTab('DASHBOARD')}
            onNavigateToRbac={() => setCurrentTab('RBAC')}
          />
        )}
      </View>

      {/* Floating Curved Bottom Bar */}
      <AdminBottomBar currentTab={currentTab} onSelectTab={setCurrentTab} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#EDF5FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: MedicalColors.textSecondary,
  },
  mainViewArea: {
    flex: 1,
  },

  // Non-admin screens
  nonAdminContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
    backgroundColor: '#F8FAFC',
  },
  nonAdminCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: Spacing.four,
    alignItems: 'center',
    width: '100%',
    maxWidth: 420,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  nonAdminIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  nonAdminBadge: {
    backgroundColor: MedicalColors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  nonAdminBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: MedicalColors.primary,
  },
  nonAdminName: {
    fontSize: 18,
    fontWeight: '800',
    color: MedicalColors.textPrimary,
  },
  nonAdminEmail: {
    fontSize: 13,
    color: MedicalColors.textSecondary,
    marginTop: 2,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 14,
  },
  nonAdminNotice: {
    fontSize: 13,
    color: MedicalColors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 14,
  },
  switchBackAdminBtn: {
    backgroundColor: MedicalColors.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  switchBackAdminText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  logoutOutlineBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#EF4444',
    width: '100%',
    alignItems: 'center',
  },
  logoutOutlineText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '600',
  },

  // Notification and More Tabs
  notifContainer: {
    padding: Spacing.three,
    paddingBottom: 90,
  },
  moreContainer: {
    padding: Spacing.three,
    paddingBottom: 90,
  },
  tabHeader: {
    marginBottom: 14,
  },
  tabHeaderTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  tabHeaderSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  notifCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: Spacing.three,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  notifCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  notifCardBody: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
  },
  notifTime: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 6,
  },
  profileBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: Spacing.three,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  profileBoxTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  profileItem: {
    fontSize: 13,
    color: '#334155',
    marginVertical: 3,
  },
  switchBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: Spacing.three,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  switchBoxTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  switchBoxSub: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 10,
  },
  roleSwitchBtn: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  roleSwitchBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  logoutBtn: {
    backgroundColor: '#FEE2E2',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  logoutBtnText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '700',
  },
});
