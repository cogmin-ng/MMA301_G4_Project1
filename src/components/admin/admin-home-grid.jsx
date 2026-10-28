import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Card, Badge } from 'react-native-paper';
import { useAuth } from '@/context/auth-context';
import { Spacing } from '@/constants/theme';
import { AdminDrawerMenu } from './admin-drawer-menu';

function PortalButton({
  label,
  badge,
  badgeColor = '#0284C7',
  iconName,
  iconColor,
  bgColor,
  onPress,
}) {
  return (
    <TouchableOpacity style={styles.gridItem} activeOpacity={0.7} onPress={onPress}>
      <View style={[styles.iconBox, { backgroundColor: bgColor }]}>
        <MaterialCommunityIcons name={iconName} size={28} color={iconColor} />
      </View>
      <View style={styles.labelWrapper}>
        <Text style={styles.gridItemLabel} numberOfLines={2}>
          {label}
        </Text>
      </View>
      <View style={styles.badgeWrapper}>
        {badge ? (
          <Text style={[styles.gridItemBadge, { color: badgeColor }]}>{badge}</Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

export function AdminHomeGrid({
  stats,
  onNavigateToHospitals,
  onOpenCreateHospital,
  onNavigateToDoctors,
  onOpenCreateDoctor,
  onNavigateToAppointments,
  onNavigateToDashboard,
  onNavigateToProfile,
  onNavigateToRbac,
}) {
  const { user, switchRole, logout } = useAuth();
  const [drawerVisible, setDrawerVisible] = useState(false);

  const handleRoleSwitchDialog = () => {
    Alert.alert(
      'Chuyển đổi vai trò',
      `Tài khoản: ${user?.full_name || 'Người dùng'} (${user?.role})\nChọn vai trò cần trải nghiệm:`,
      [
        { text: 'Quản trị viên (ADMIN)', onPress: () => switchRole('ADMIN') },
        { text: 'Bác sĩ (DOCTOR)', onPress: () => switchRole('DOCTOR') },
        { text: 'Bệnh nhân (PATIENT)', onPress: () => switchRole('PATIENT') },
        { text: 'Đóng', style: 'cancel' },
      ]
    );
  };

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        {/* 1. Header Bar: Menu ☰, Logo YouMed, Actions */}
        <View style={styles.topHeader}>
          <TouchableOpacity
            style={styles.headerIconButton}
            activeOpacity={0.7}
            onPress={() => setDrawerVisible(true)}>
            <MaterialCommunityIcons name="menu" size={24} color="#1E293B" />
          </TouchableOpacity>

          <View style={styles.logoContainer}>
            <View style={styles.logoBadge}>
              <MaterialCommunityIcons name="hospital-box" size={24} color="#FFFFFF" />
            </View>
            <View>
              <Text style={styles.logoText}>YOUMED CARE</Text>
              <Text style={styles.logoSubText}>HỆ THỐNG Y TẾ SỐ</Text>
            </View>
          </View>

          <View style={styles.headerRightActions}>
            <TouchableOpacity
              style={styles.headerIconButton}
              onPress={() =>
                Alert.alert('Quét mã QR', 'Tính năng quét mã QR tra cứu cơ sở y tế / bác sĩ.')
              }>
              <MaterialCommunityIcons name="qrcode-scan" size={20} color="#1E293B" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.headerIconButton}
              onPress={() =>
                Alert.alert('Thông báo', 'Hệ thống đang hoạt động ổn định, không có cảnh báo mới.')
              }>
              <MaterialCommunityIcons name="bell-outline" size={22} color="#1E293B" />
              <Badge size={8} style={styles.notifBadge} />
            </TouchableOpacity>
          </View>
        </View>

        {/* 2. Admin User Info Card */}
        <Card style={styles.profileCard} mode="elevated">
          <Card.Content style={styles.profileCardContent}>
            <View style={styles.profileLeft}>
              <View style={styles.avatarWrapper}>
                <Image
                  source={{
                    uri:
                      user?.avatar ||
                      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
                  }}
                  style={styles.avatarImg}
                />
                <View style={styles.onlineDot} />
              </View>

              <View style={styles.profileTextWrapper}>
                <View style={styles.nameRow}>
                  <Text style={styles.userName}>{user?.full_name || 'Quản trị viên'}</Text>
                  <View style={styles.roleTag}>
                    <Text style={styles.roleTagText}>{user?.role || 'ADMIN'}</Text>
                  </View>
                </View>
                <Text style={styles.systemInfoText}>
                  {user?.email || 'admin@youmed.vn'}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.switchRoleBtn}
              activeOpacity={0.7}
              onPress={handleRoleSwitchDialog}>
              <MaterialCommunityIcons name="account-switch" size={20} color="#0284C7" />
            </TouchableOpacity>
          </Card.Content>
        </Card>

        {/* 3. SECTION 1: VẬN HÀNH Y TẾ & BỆNH VIỆN (8 phím tắt - 2 hàng 4 cột) */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionIconBadge}>
              <MaterialCommunityIcons name="domain" size={15} color="#0284C7" />
            </View>
            <Text style={styles.sectionHeaderTitle}>VẬN HÀNH Y TẾ & BỆNH VIỆN</Text>
          </View>

          <View style={styles.gridRow}>
            <PortalButton
              label="Bệnh viện"
              badge={`${stats?.totalHospitals ?? 0} viện`}
              badgeColor="#0284C7"
              iconName="hospital-building"
              iconColor="#0284C7"
              bgColor="#E0F2FE"
              onPress={onNavigateToHospitals}
            />

            <PortalButton
              label="Thêm viện"
              badge="Tạo mới"
              badgeColor="#16A34A"
              iconName="plus-box"
              iconColor="#16A34A"
              bgColor="#DCFCE7"
              onPress={onOpenCreateHospital}
            />

            <PortalButton
              label="Bác sĩ"
              badge={`${stats?.totalDoctors ?? 0} BS`}
              badgeColor="#D97706"
              iconName="doctor"
              iconColor="#D97706"
              bgColor="#FEF3C7"
              onPress={onNavigateToDoctors}
            />

            <PortalButton
              label="Lịch hẹn"
              badge={`${stats?.totalAppointments ?? 0} ca`}
              badgeColor="#DC2626"
              iconName="calendar-clock"
              iconColor="#DC2626"
              bgColor="#FEE2E2"
              onPress={onNavigateToAppointments}
            />

            <PortalButton
              label="Chuyên khoa"
              badge="24 khoa"
              badgeColor="#7C3AED"
              iconName="medical-bag"
              iconColor="#7C3AED"
              bgColor="#EDE9FE"
              onPress={() =>
                Alert.alert('Chuyên khoa', 'Quản lý các khoa phòng chuyên môn (Tai Mũi Họng, Nhi khoa, Tim Mạch...)')
              }
            />

            <PortalButton
              label="Ca kíp"
              badge="Khung giờ"
              badgeColor="#DB2777"
              iconName="clock-time-four-outline"
              iconColor="#DB2777"
              bgColor="#FCE7F3"
              onPress={() =>
                Alert.alert(
                  'Ca khám bệnh',
                  'Quản lý lịch làm việc và các khung giờ khám bệnh của bác sĩ.'
                )
              }
            />

            <PortalButton
              label="Duyệt Viện"
              badge="Hoạt động"
              badgeColor="#0D9488"
              iconName="check-decagram-outline"
              iconColor="#0D9488"
              bgColor="#CCFBF1"
              onPress={onNavigateToHospitals}
            />

            <PortalButton
              label="Bệnh án"
              badge="Hồ sơ EMR"
              badgeColor="#4F46E5"
              iconName="clipboard-pulse-outline"
              iconColor="#4F46E5"
              bgColor="#E0E7FF"
              onPress={() =>
                Alert.alert('Hồ sơ Bệnh nhân', 'Tra cứu hồ sơ bệnh án điện tử và thông tin người bệnh.')
              }
            />
          </View>
        </View>

        {/* 4. SECTION 2: BÁO CÁO & THỐNG KÊ (6 phím tắt - chuẩn cột) */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View style={[styles.sectionIconBadge, { backgroundColor: '#FEF3C7' }]}>
              <MaterialCommunityIcons name="chart-bar" size={15} color="#D97706" />
            </View>
            <Text style={styles.sectionHeaderTitle}>BÁO CÁO & THỐNG KÊ</Text>
          </View>

          <View style={styles.gridRow}>
            <PortalButton
              label="Dashboard"
              badge="Tổng quan"
              badgeColor="#0284C7"
              iconName="view-dashboard-outline"
              iconColor="#0284C7"
              bgColor="#E0F2FE"
              onPress={onNavigateToDashboard}
            />

            <PortalButton
              label="Biểu đồ"
              badge="Phân bổ"
              badgeColor="#D97706"
              iconName="chart-bell-curve"
              iconColor="#D97706"
              bgColor="#FEF3C7"
              onPress={onNavigateToDashboard}
            />

            <PortalButton
              label="Bệnh nhân"
              badge={`${stats?.totalPatients ?? 0} người`}
              badgeColor="#059669"
              iconName="account-group-outline"
              iconColor="#059669"
              bgColor="#D1FAE5"
              onPress={() =>
                Alert.alert(
                  'Bệnh nhân',
                  `Đã có ${stats?.totalPatients ?? 0} tài khoản bệnh nhân đã đăng ký trên hệ thống.`
                )
              }
            />

            <PortalButton
              label="Doanh thu"
              badge="Viện phí"
              badgeColor="#DC2626"
              iconName="cash-multiple"
              iconColor="#DC2626"
              bgColor="#FEE2E2"
              onPress={onNavigateToDashboard}
            />

            <PortalButton
              label="Lịch sử đổi"
              badge="Audit log"
              badgeColor="#7C3AED"
              iconName="history"
              iconColor="#7C3AED"
              bgColor="#F3E8FF"
              onPress={() =>
                Alert.alert(
                  'Audit log',
                  'Theo dõi lịch sử cập nhật và thay đổi trạng thái phiếu khám bệnh.'
                )
              }
            />

            <PortalButton
              label="Thông báo"
              badge="Hệ thống"
              badgeColor="#EA580C"
              iconName="bell-ring-outline"
              iconColor="#EA580C"
              bgColor="#FFEDD5"
              onPress={() =>
                Alert.alert('Thông báo', 'Quản lý và phát thông báo trên toàn hệ thống.')
              }
            />
          </View>
        </View>

        {/* 5. SECTION 3: HỆ THỐNG & PHÂN QUYỀN (4 phím tắt - 1 hàng 4 cột chuẩn) */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View style={[styles.sectionIconBadge, { backgroundColor: '#E0E7FF' }]}>
              <MaterialCommunityIcons name="shield-check-outline" size={15} color="#4F46E5" />
            </View>
            <Text style={styles.sectionHeaderTitle}>HỆ THỐNG & PHÂN QUYỀN</Text>
          </View>

          <View style={styles.gridRow}>
            <PortalButton
              label="Phân quyền"
              badge="RBAC 3 vai trò"
              badgeColor="#0284C7"
              iconName="shield-account-outline"
              iconColor="#0284C7"
              bgColor="#E0F2FE"
              onPress={onNavigateToRbac}
            />

            <PortalButton
              label="Tài khoản"
              badge="Hồ sơ Admin"
              badgeColor="#475569"
              iconName="card-account-details-outline"
              iconColor="#475569"
              bgColor="#F1F5F9"
              onPress={onNavigateToProfile}
            />

            <PortalButton
              label="Cài đặt"
              badge="Hệ thống"
              badgeColor="#0D9488"
              iconName="cog-outline"
              iconColor="#0D9488"
              bgColor="#CCFBF1"
              onPress={() =>
                Alert.alert(
                  'Cài đặt hệ thống',
                  'Hệ thống quản trị vận hành ổn định. Dữ liệu được sao lưu và bảo mật tự động.'
                )
              }
            />

            <PortalButton
              label="Đăng xuất"
              badge="Thoát phiên"
              badgeColor="#DC2626"
              iconName="logout-variant"
              iconColor="#DC2626"
              bgColor="#FEE2E2"
              onPress={logout}
            />
          </View>
        </View>
      </ScrollView>

      <AdminDrawerMenu
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        stats={stats}
        onNavigateToHospitals={onNavigateToHospitals}
        onOpenCreateHospital={onOpenCreateHospital}
        onNavigateToDoctors={onNavigateToDoctors}
        onNavigateToAppointments={onNavigateToAppointments}
        onNavigateToDashboard={onNavigateToDashboard}
        onNavigateToProfile={onNavigateToProfile}
        onNavigateToRbac={onNavigateToRbac}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EDF5FA',
  },
  content: {
    width: '100%',
    maxWidth: 1100,
    alignSelf: 'center',
    paddingHorizontal: Spacing.three,
    paddingTop: 10,
    paddingBottom: 120,
  },

  // Top Header
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    marginBottom: 6,
  },
  headerIconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
    position: 'relative',
  },
  notifBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#EF4444',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  logoText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0369A1',
    letterSpacing: 0.5,
  },
  logoSubText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  headerRightActions: {
    flexDirection: 'row',
    gap: 10,
  },

  // Profile Card
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  profileCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  profileLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarImg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#BAE6FD',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  profileTextWrapper: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  userName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  roleTag: {
    backgroundColor: '#E0F2FE',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  roleTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#0284C7',
  },
  systemInfoText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 2,
  },
  switchRoleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F0F9FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    marginLeft: 8,
  },

  // Categorized Sections
  section: {
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
    marginLeft: 2,
  },
  sectionIconBadge: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeaderTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 0.8,
  },

  // 4-COLUMN STANDARDIZED GRID
  gridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  gridItem: {
    width: '25%',
    alignItems: 'center',
    paddingHorizontal: 4,
    marginBottom: 14,
  },
  iconBox: {
    width: 58,
    height: 58,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
  },
  labelWrapper: {
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
    width: '100%',
  },
  gridItemLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    textAlign: 'center',
    lineHeight: 14,
  },
  badgeWrapper: {
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
    width: '100%',
  },
  gridItemBadge: {
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  },
});
