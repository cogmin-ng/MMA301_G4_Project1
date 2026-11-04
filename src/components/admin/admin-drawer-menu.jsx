import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  Image,
  Alert,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Chip, Divider } from 'react-native-paper';
import { useAuth } from '@/context/auth-context';
import { Spacing } from '@/constants/theme';

export function AdminDrawerMenu({
  visible,
  onClose,
  stats,
  onNavigateToHospitals,
  onOpenCreateHospital,
  onNavigateToDoctors,
  onNavigateToAppointments,
  onNavigateToDashboard,
  onNavigateToProfile,
  onNavigateToRbac,
}) {
  const { user, switchRole, logout } = useAuth();

  const handleRoleSwitchDialog = () => {
    onClose();
    setTimeout(() => {
      Alert.alert(
        'Chuyển đổi vai trò',
        `Tài khoản: ${user?.full_name || 'Người dùng'} (${user?.role})\nChọn vai trò trải nghiệm:`,
        [
          { text: 'Quản trị viên (ADMIN)', onPress: () => switchRole('ADMIN') },
          { text: 'Bác sĩ (DOCTOR)', onPress: () => switchRole('DOCTOR') },
          { text: 'Bệnh nhân (PATIENT)', onPress: () => switchRole('PATIENT') },
          { text: 'Đóng', style: 'cancel' },
        ]
      );
    }, 150);
  };

  const handleMenuClick = (action) => {
    onClose();
    action();
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        {/* Backdrop touchable to close */}
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>

        {/* Drawer Content Panel sliding from Left */}
        <View style={styles.drawerPanel}>
          {/* 1. Drawer Header: User Avatar & Info */}
          <View style={styles.drawerHeader}>
            <View style={styles.headerTopRow}>
              <View style={styles.avatarContainer}>
                <Image
                  source={{
                    uri:
                      user?.avatar ||
                      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
                  }}
                  style={styles.avatarImg}
                />
                <View style={styles.onlineBadge} />
              </View>

              <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                <MaterialCommunityIcons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.userName}>{user?.full_name || 'Quản trị viên'}</Text>
            <Text style={styles.userEmail}>{user?.email || 'admin@youmed.vn'}</Text>

            <View style={styles.roleRow}>
              <Chip
                compact
                style={styles.roleChip}
                textStyle={styles.roleChipText}>
                👑 QUẢN TRỊ VIÊN (ADMIN)
              </Chip>
            </View>
          </View>

          <Divider />

          {/* 2. Menu Navigation Items */}
          <ScrollView
            style={styles.menuScroll}
            showsVerticalScrollIndicator={false}>
            {/* Group 1: Vận hành Y tế & Cơ sở */}
            <Text style={styles.groupTitle}>VẬN HÀNH Y TẾ & BỆNH VIỆN</Text>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleMenuClick(onNavigateToHospitals)}>
              <View style={[styles.menuIconBox, { backgroundColor: '#E0F2FE' }]}>
                <MaterialCommunityIcons name="hospital-building" size={20} color="#0284C7" />
              </View>
              <Text style={styles.menuItemLabel}>Quản lý Bệnh viện</Text>
              <View style={styles.menuBadgeBox}>
                <Text style={styles.menuBadgeText}>{stats?.totalHospitals ?? 0} viện</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleMenuClick(onOpenCreateHospital)}>
              <View style={[styles.menuIconBox, { backgroundColor: '#DCFCE7' }]}>
                <MaterialCommunityIcons name="plus-box" size={20} color="#16A34A" />
              </View>
              <Text style={styles.menuItemLabel}>Thêm Bệnh viện mới</Text>
              <MaterialCommunityIcons name="chevron-right" size={18} color="#94A3B8" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => (onNavigateToDoctors ? handleMenuClick(onNavigateToDoctors) : onClose())}>
              <View style={[styles.menuIconBox, { backgroundColor: '#FEF3C7' }]}>
                <MaterialCommunityIcons name="doctor" size={20} color="#D97706" />
              </View>
              <Text style={styles.menuItemLabel}>Quản lý Bác sĩ</Text>
              <View style={[styles.menuBadgeBox, { backgroundColor: '#FEF3C7' }]}>
                <Text style={[styles.menuBadgeText, { color: '#D97706' }]}>{stats?.totalDoctors ?? 0} BS</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => (onNavigateToAppointments ? handleMenuClick(onNavigateToAppointments) : onClose())}>
              <View style={[styles.menuIconBox, { backgroundColor: '#FEE2E2' }]}>
                <MaterialCommunityIcons name="calendar-clock" size={20} color="#DC2626" />
              </View>
              <Text style={styles.menuItemLabel}>Lịch hẹn khám bệnh</Text>
              <View style={[styles.menuBadgeBox, { backgroundColor: '#FEE2E2' }]}>
                <Text style={[styles.menuBadgeText, { color: '#DC2626' }]}>{stats?.totalAppointments ?? 0} ca</Text>
              </View>
            </TouchableOpacity>

            <Divider style={styles.divider} />

            {/* Group 2: Thống kê & Dashboard */}
            <Text style={styles.groupTitle}>BÁO CÁO & THỐNG KÊ</Text>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleMenuClick(onNavigateToDashboard)}>
              <View style={[styles.menuIconBox, { backgroundColor: '#E0F2FE' }]}>
                <MaterialCommunityIcons name="view-dashboard-outline" size={20} color="#0284C7" />
              </View>
              <Text style={styles.menuItemLabel}>Bảng chỉ số Dashboard</Text>
              <MaterialCommunityIcons name="chevron-right" size={18} color="#94A3B8" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleMenuClick(onNavigateToDashboard)}>
              <View style={[styles.menuIconBox, { backgroundColor: '#EDE9FE' }]}>
                <MaterialCommunityIcons name="chart-bell-curve" size={20} color="#7C3AED" />
              </View>
              <Text style={styles.menuItemLabel}>Biểu đồ phân bổ ca khám</Text>
              <MaterialCommunityIcons name="chevron-right" size={18} color="#94A3B8" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() =>
                Alert.alert('Bệnh nhân', `Đã có ${stats?.totalPatients ?? 0} bệnh nhân đăng ký.`)
              }>
              <View style={[styles.menuIconBox, { backgroundColor: '#D1FAE5' }]}>
                <MaterialCommunityIcons name="account-group-outline" size={20} color="#059669" />
              </View>
              <Text style={styles.menuItemLabel}>Danh sách Bệnh nhân</Text>
              <View style={[styles.menuBadgeBox, { backgroundColor: '#D1FAE5' }]}>
                <Text style={[styles.menuBadgeText, { color: '#059669' }]}>
                  {stats?.totalPatients ?? 0} người
                </Text>
              </View>
            </TouchableOpacity>

            <Divider style={styles.divider} />

            {/* Group 3: Hệ thống & Phân quyền */}
            <Text style={styles.groupTitle}>HỆ THỐNG & PHÂN QUYỀN</Text>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                if (onNavigateToRbac) {
                  handleMenuClick(onNavigateToRbac);
                } else {
                  handleRoleSwitchDialog();
                }
              }}>
              <View style={[styles.menuIconBox, { backgroundColor: '#E0F2FE' }]}>
                <MaterialCommunityIcons name="shield-account-outline" size={20} color="#0284C7" />
              </View>
              <Text style={styles.menuItemLabel}>Quản lý phân quyền (RBAC)</Text>
              <MaterialCommunityIcons name="chevron-right" size={18} color="#94A3B8" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleMenuClick(onNavigateToProfile)}>
              <View style={[styles.menuIconBox, { backgroundColor: '#F1F5F9' }]}>
                <MaterialCommunityIcons name="card-account-details-outline" size={20} color="#475569" />
              </View>
              <Text style={styles.menuItemLabel}>Hồ sơ tài khoản cá nhân</Text>
              <MaterialCommunityIcons name="chevron-right" size={18} color="#94A3B8" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() =>
                Alert.alert(
                  'Bảo mật & Vận hành',
                  'Hệ thống quản trị YouMed Care đang hoạt động bình thường, dữ liệu được đồng bộ và mã hóa an toàn.'
                )
              }>
              <View style={[styles.menuIconBox, { backgroundColor: '#DCFCE7' }]}>
                <MaterialCommunityIcons name="shield-check-outline" size={20} color="#16A34A" />
              </View>
              <Text style={styles.menuItemLabel}>An toàn & Bảo mật hệ thống</Text>
              <MaterialCommunityIcons name="chevron-right" size={18} color="#94A3B8" />
            </TouchableOpacity>
          </ScrollView>

          <Divider />

          {/* 3. Drawer Footer: Logout & Version */}
          <View style={styles.drawerFooter}>
            <TouchableOpacity
              style={styles.drawerLogoutBtn}
              onPress={() => {
                onClose();
                logout();
              }}>
              <MaterialCommunityIcons name="logout" size={18} color="#DC2626" />
              <Text style={styles.drawerLogoutText}>Đăng xuất khỏi hệ thống</Text>
            </TouchableOpacity>

            <Text style={styles.versionText}>YouMed Booking v1.0.0 • Quản trị Y tế</Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
  },
  drawerPanel: {
    width: 320,
    maxWidth: '85%',
    height: '100%',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 16,
    display: 'flex',
    flexDirection: 'column',
  },

  // 1. Header
  drawerHeader: {
    backgroundColor: '#F0F9FF',
    padding: Spacing.four,
    paddingTop: Platform.OS === 'ios' ? 50 : Spacing.four,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarImg: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: '#BAE6FD',
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 8,
  },
  roleRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  roleChip: {
    backgroundColor: '#E0F2FE',
    height: 24,
    alignItems: 'center',
  },
  roleChipText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0284C7',
    marginHorizontal: 0,
    marginVertical: 0,
  },

  // 2. Menu Items
  menuScroll: {
    flex: 1,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  groupTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.8,
    marginTop: 12,
    marginBottom: 8,
    marginLeft: 6,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    marginBottom: 2,
  },
  menuIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuItemLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  menuBadgeBox: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  menuBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
  },
  divider: {
    marginVertical: 8,
    backgroundColor: '#F1F5F9',
  },

  // 3. Footer
  drawerFooter: {
    padding: Spacing.three,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
  },
  drawerLogoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    backgroundColor: '#FEE2E2',
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 8,
  },
  drawerLogoutText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DC2626',
  },
  versionText: {
    fontSize: 11,
    color: '#94A3B8',
  },
});
