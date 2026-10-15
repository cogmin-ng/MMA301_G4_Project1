import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Divider } from 'react-native-paper';
import { useAuth } from '@/context/auth-context';
import { MedicalColors, Spacing } from '@/constants/theme';

export function AdminMoreView({
  onNavigateToHospitals,
  onNavigateToDashboard,
  onNavigateToRbac,
}) {
  const { user, switchRole, logout } = useAuth();

  // Modals state
  const [buildingModalVisible, setBuildingModalVisible] = useState(false);
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [managementModalVisible, setManagementModalVisible] = useState(false);
  const [serviceModalVisible, setServiceModalVisible] = useState(false);
  const [fontSizeModalVisible, setFontSizeModalVisible] = useState(false);

  // Form states
  const [selectedFontSize, setSelectedFontSize] = useState('normal');
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');

  const handleChangePassword = () => {
    if (!oldPass || !newPass) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ mật khẩu cũ và mới.');
      return;
    }
    if (newPass.length < 6) {
      Alert.alert('Lỗi', 'Mật khẩu mới phải có tối thiểu 6 ký tự.');
      return;
    }
    if (newPass !== confirmPass) {
      Alert.alert('Lỗi', 'Mật khẩu xác nhận không khớp.');
      return;
    }

    Alert.alert('Thành công', 'Đổi mật khẩu tài khoản thành công!');
    setPasswordModalVisible(false);
    setOldPass('');
    setNewPass('');
    setConfirmPass('');
  };

  const handleRestartApp = () => {
    Alert.alert(
      'Restart App',
      'Khởi động lại ứng dụng và làm mới toàn bộ dữ liệu hệ thống?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đồng ý',
          onPress: () => {
            Alert.alert('Thông báo', 'Đã làm mới dữ liệu thành công!');
          },
        },
      ]
    );
  };

  return (
    <View style={styles.screenWrapper}>
      {/* Thanh viền xanh trên cùng chuẩn ảnh mẫu */}
      <View style={styles.topBlueBar} />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        {/* 1. Header: Logo tròn + Tên người dùng + Nút Đăng xuất màu cam */}
        <View style={styles.headerRow}>
          <View style={styles.headerUserSection}>
            <View style={styles.circleLogoBadge}>
              <MaterialCommunityIcons name="hospital-building" size={24} color="#0284C7" />
              <Text style={styles.circleLogoText}>ADMIN</Text>
            </View>
            <Text style={styles.userName}>
              {user?.full_name || 'Quản trị viên'}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.logoutButton}
            activeOpacity={0.7}
            onPress={logout}>
            <MaterialCommunityIcons name="logout" size={20} color="#EA580C" />
            <Text style={styles.logoutButtonText}>Đăng xuất</Text>
          </TouchableOpacity>
        </View>

        <Divider style={styles.headerDivider} />

        {/* 2. Danh sách Menu (8 hàng chuẩn 100% theo ảnh mẫu) */}
        <View style={styles.menuList}>
          {/* Hàng 1: Thông tin toà nhà */}
          <TouchableOpacity
            style={styles.menuRow}
            activeOpacity={0.7}
            onPress={() => setBuildingModalVisible(true)}>
            <View style={styles.menuRowLeft}>
              <MaterialCommunityIcons
                name="home-outline"
                size={24}
                color="#EA580C"
                style={styles.menuIcon}
              />
              <Text style={styles.menuTitle}>Thông tin toà nhà</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#94A3B8" />
          </TouchableOpacity>
          <Divider style={styles.rowDivider} />

          {/* Hàng 2: Thông tin cá nhân */}
          <TouchableOpacity
            style={styles.menuRow}
            activeOpacity={0.7}
            onPress={() => setProfileModalVisible(true)}>
            <View style={styles.menuRowLeft}>
              <MaterialCommunityIcons
                name="account-outline"
                size={24}
                color="#EA580C"
                style={styles.menuIcon}
              />
              <Text style={styles.menuTitle}>Thông tin cá nhân</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#94A3B8" />
          </TouchableOpacity>
          <Divider style={styles.rowDivider} />

          {/* Hàng 3: Thay đổi mật khẩu */}
          <TouchableOpacity
            style={styles.menuRow}
            activeOpacity={0.7}
            onPress={() => setPasswordModalVisible(true)}>
            <View style={styles.menuRowLeft}>
              <MaterialCommunityIcons
                name="lock-outline"
                size={24}
                color="#EA580C"
                style={styles.menuIcon}
              />
              <Text style={styles.menuTitle}>Thay đổi mật khẩu</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#94A3B8" />
          </TouchableOpacity>
          <Divider style={styles.rowDivider} />

          {/* Hàng 4: Ban quản lý */}
          <TouchableOpacity
            style={styles.menuRow}
            activeOpacity={0.7}
            onPress={() => setManagementModalVisible(true)}>
            <View style={styles.menuRowLeft}>
              <MaterialCommunityIcons
                name="office-building"
                size={24}
                color="#EA580C"
                style={styles.menuIcon}
              />
              <Text style={styles.menuTitle}>Ban quản lý</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#94A3B8" />
          </TouchableOpacity>
          <Divider style={styles.rowDivider} />

          {/* Hàng 5: Phiếu đăng ký dịch vụ */}
          <TouchableOpacity
            style={styles.menuRow}
            activeOpacity={0.7}
            onPress={() => setServiceModalVisible(true)}>
            <View style={styles.menuRowLeft}>
              <MaterialCommunityIcons
                name="plus-box-outline"
                size={24}
                color="#EA580C"
                style={styles.menuIcon}
              />
              <Text style={styles.menuTitle}>Phiếu đăng ký dịch vụ</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#94A3B8" />
          </TouchableOpacity>
          <Divider style={styles.rowDivider} />

          {/* Hàng 6: Cỡ chữ */}
          <TouchableOpacity
            style={styles.menuRow}
            activeOpacity={0.7}
            onPress={() => setFontSizeModalVisible(true)}>
            <View style={styles.menuRowLeft}>
              <View style={styles.textIconWrapper}>
                <Text style={styles.textIcon}>Aa</Text>
              </View>
              <Text style={styles.menuTitle}>Cỡ chữ</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#94A3B8" />
          </TouchableOpacity>
          <Divider style={styles.rowDivider} />

          {/* Hàng 7: Restart App */}
          <TouchableOpacity
            style={styles.menuRow}
            activeOpacity={0.7}
            onPress={handleRestartApp}>
            <View style={styles.menuRowLeft}>
              <MaterialCommunityIcons
                name="restart"
                size={24}
                color="#EA580C"
                style={styles.menuIcon}
              />
              <Text style={styles.menuTitle}>Restart App</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#94A3B8" />
          </TouchableOpacity>
          <Divider style={styles.rowDivider} />

          {/* Hàng 8: Nâng cấp ứng dụng */}
          <TouchableOpacity
            style={styles.menuRow}
            activeOpacity={0.7}
            onPress={() =>
              Alert.alert(
                'Nâng cấp ứng dụng',
                'Hệ thống đang hoạt động ở phiên bản 6.5.4_v32 (production) mới nhất.'
              )
            }>
            <View style={styles.menuRowLeft}>
              <MaterialCommunityIcons
                name="cloud-upload-outline"
                size={24}
                color="#EA580C"
                style={styles.menuIcon}
              />
              <Text style={styles.menuTitle}>Nâng cấp ứng dụng</Text>
            </View>
            <View style={styles.versionBlock}>
              <Text style={styles.versionCode}>6.5.4_v32</Text>
              <Text style={styles.versionEnv}>- production -</Text>
            </View>
          </TouchableOpacity>
          <Divider style={styles.rowDivider} />
        </View>

        {/* 3. Footer Hotline chuẩn ảnh mẫu */}
        <View style={styles.footerHotlineSection}>
          <View style={styles.footerCenterBox}>
            <View style={styles.footerLogoBadge}>
              <MaterialCommunityIcons name="hospital-building" size={26} color="#0284C7" />
              <Text style={styles.footerLogoText}>ADMIN</Text>
            </View>

            <TouchableOpacity
              style={styles.hotlineButton}
              activeOpacity={0.7}
              onPress={() => Alert.alert('Hotline', 'Tổng đài hỗ trợ kỹ thuật: 1900 2805')}>
              <MaterialCommunityIcons name="phone-outline" size={22} color="#EA580C" />
              <Text style={styles.hotlineButtonText}>Hotline</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Modal 1: Thông tin toà nhà */}
        <Modal
          visible={buildingModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setBuildingModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>Thông tin toà nhà & Cơ sở</Text>
              <Divider style={{ marginVertical: 12 }} />
              <Text style={styles.infoLabel}>🏢 Tên toà nhà: <Text style={styles.infoValue}>Trung tâm Quản trị Y tế YouMed Tower</Text></Text>
              <Text style={styles.infoLabel}>📍 Địa chỉ: <Text style={styles.infoValue}>215 Hồng Bàng, Phường 11, Quận 5, TP.HCM</Text></Text>
              <Text style={styles.infoLabel}>🏥 Quy mô liên kết: <Text style={styles.infoValue}>6 Bệnh viện tuyến Trung ương</Text></Text>
              <Text style={styles.infoLabel}>🟢 Trạng thái vận hành: <Text style={styles.infoValueGreen}>Đang hoạt động (Online)</Text></Text>

              <TouchableOpacity
                style={styles.modalPrimaryBtn}
                onPress={() => {
                  setBuildingModalVisible(false);
                  onNavigateToHospitals();
                }}>
                  <Text style={styles.modalPrimaryBtnText}>Xem danh sách bệnh viện</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setBuildingModalVisible(false)}>
                <Text style={styles.modalCloseBtnText}>Đóng</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Modal 2: Thông tin cá nhân */}
        <Modal
          visible={profileModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setProfileModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>Thông tin cá nhân</Text>
              <Divider style={{ marginVertical: 12 }} />
              <Text style={styles.infoLabel}>👤 Họ và tên: <Text style={styles.infoValue}>{user?.full_name || 'Quản trị viên'}</Text></Text>
              <Text style={styles.infoLabel}>✉️ Email: <Text style={styles.infoValue}>{user?.email || 'admin@youmed.vn'}</Text></Text>
              <Text style={styles.infoLabel}>📞 Điện thoại: <Text style={styles.infoValue}>{user?.phone || 'Chưa cập nhật'}</Text></Text>
              <Text style={styles.infoLabel}>👑 Vai trò: <Text style={styles.infoValue}>{user?.role === 'ADMIN' ? 'Quản trị viên (ADMIN)' : user?.role === 'DOCTOR' ? 'Bác sĩ (DOCTOR)' : 'Bệnh nhân (PATIENT)'}</Text></Text>
              <Text style={styles.infoLabel}>🟢 Trạng thái: <Text style={styles.infoValueGreen}>Đang hoạt động (Trực tuyến)</Text></Text>

              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setProfileModalVisible(false)}>
                <Text style={styles.modalCloseBtnText}>Đóng</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Modal 3: Thay đổi mật khẩu */}
        <Modal
          visible={passwordModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setPasswordModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>Thay đổi mật khẩu</Text>
              <Divider style={{ marginVertical: 12 }} />

              <Text style={styles.inputLabel}>Mật khẩu hiện tại</Text>
              <TextInput
                style={styles.input}
                placeholder="Nhập mật khẩu hiện tại"
                secureTextEntry
                value={oldPass}
                onChangeText={setOldPass}
              />

              <Text style={styles.inputLabel}>Mật khẩu mới</Text>
              <TextInput
                style={styles.input}
                placeholder="Tối thiểu 6 ký tự"
                secureTextEntry
                value={newPass}
                onChangeText={setNewPass}
              />

              <Text style={styles.inputLabel}>Xác nhận mật khẩu mới</Text>
              <TextInput
                style={styles.input}
                placeholder="Nhập lại mật khẩu mới"
                secureTextEntry
                value={confirmPass}
                onChangeText={setConfirmPass}
              />

              <View style={styles.modalActionRow}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => setPasswordModalVisible(false)}>
                  <Text style={styles.modalCancelText}>Hủy</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalSaveBtn}
                  onPress={handleChangePassword}>
                  <Text style={styles.modalSaveText}>Lưu thay đổi</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Modal 4: Ban quản lý */}
        <Modal
          visible={managementModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setManagementModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>Ban quản lý & Điều hành</Text>
              <Divider style={{ marginVertical: 12 }} />
              <Text style={styles.infoLabel}>🏢 Đơn vị chủ quản: <Text style={styles.infoValue}>Trung tâm Điều hành Y tế YouMed</Text></Text>
              <Text style={styles.infoLabel}>👨‍💼 Ban giám đốc: <Text style={styles.infoValue}>Ban Điều hành Quản trị Y tế</Text></Text>
              <Text style={styles.infoLabel}>🩺 Hội đồng Y khoa: <Text style={styles.infoValue}>Ban Cố vấn Chuyên môn Y tế</Text></Text>
              <Text style={styles.infoLabel}>📞 Tổng đài ban quản trị: <Text style={styles.infoValue}>1900 2805</Text></Text>
              <Text style={styles.infoLabel}>✉️ Hộp thư hỗ trợ: <Text style={styles.infoValue}>hotro@youmed.vn</Text></Text>

              <TouchableOpacity
                style={styles.modalPrimaryBtn}
                onPress={() => {
                  setManagementModalVisible(false);
                  onNavigateToRbac?.();
                }}>
                <Text style={styles.modalPrimaryBtnText}>Quản lý phân quyền tài khoản (RBAC)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setManagementModalVisible(false)}>
                <Text style={styles.modalCloseBtnText}>Đóng</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Modal 5: Phiếu đăng ký dịch vụ */}
        <Modal
          visible={serviceModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setServiceModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>Phiếu đăng ký dịch vụ</Text>
              <Divider style={{ marginVertical: 12 }} />

              <View style={styles.ticketItem}>
                <Text style={styles.ticketCode}>#PDK-2026-001</Text>
                <Text style={styles.ticketName}>Đăng ký khám tổng quát - BV Chợ Rẫy</Text>
                <Text style={styles.ticketStatus}>Trạng thái: Đã duyệt</Text>
              </View>

              <View style={styles.ticketItem}>
                <Text style={styles.ticketCode}>#PDK-2026-002</Text>
                <Text style={styles.ticketName}>Đăng ký tầm soát tim mạch - BV ĐHYD</Text>
                <Text style={styles.ticketStatus}>Trạng thái: Chờ xử lý</Text>
              </View>

              <TouchableOpacity
                style={styles.modalPrimaryBtn}
                onPress={() => {
                  setServiceModalVisible(false);
                  onNavigateToDashboard();
                }}>
                <Text style={styles.modalPrimaryBtnText}>Xem báo cáo thống kê</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setServiceModalVisible(false)}>
                <Text style={styles.modalCloseBtnText}>Đóng</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Modal 6: Cỡ chữ */}
        <Modal
          visible={fontSizeModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setFontSizeModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>Tuỳ chỉnh cỡ chữ</Text>
              <Divider style={{ marginVertical: 12 }} />

              {['normal', 'medium', 'large'].map((size) => (
                <TouchableOpacity
                  key={size}
                  style={[
                    styles.fontSizeOption,
                    selectedFontSize === size && styles.fontSizeOptionActive,
                  ]}
                  onPress={() => setSelectedFontSize(size)}>
                  <Text style={styles.fontSizeOptionText}>
                    {size === 'normal'
                      ? 'Tiêu chuẩn (Mặc định)'
                      : size === 'medium'
                      ? 'Vừa (Thoải mái)'
                      : 'Lớn (Dễ đọc)'}
                  </Text>
                  {selectedFontSize === size && (
                    <MaterialCommunityIcons name="check" size={20} color={MedicalColors.primary} />
                  )}
                </TouchableOpacity>
              ))}

              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => {
                  setFontSizeModalVisible(false);
                  Alert.alert('Thành công', 'Đã lưu thiết lập cỡ chữ hiển thị!');
                }}>
                <Text style={styles.modalCloseBtnText}>Xác nhận & Đóng</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screenWrapper: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topBlueBar: {
    height: 8,
    backgroundColor: '#0284C7',
    width: '100%',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    paddingBottom: 110,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
  },
  headerUserSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  circleLogoBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F0F9FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#0284C7',
  },
  circleLogoText: {
    fontSize: 7,
    fontWeight: '900',
    color: '#0284C7',
    marginTop: -2,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EA580C',
  },
  headerDivider: {
    backgroundColor: '#E2E8F0',
    height: 1,
  },
  menuList: {
    backgroundColor: '#FFFFFF',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
  },
  menuRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  menuIcon: {
    width: 28,
    textAlign: 'center',
  },
  textIconWrapper: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textIcon: {
    fontSize: 18,
    fontWeight: '700',
    color: '#EA580C',
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1E293B',
  },
  rowDivider: {
    backgroundColor: '#E2E8F0',
    height: 1,
  },
  versionBlock: {
    alignItems: 'flex-end',
  },
  versionCode: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '600',
  },
  versionEnv: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  footerHotlineSection: {
    paddingVertical: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  footerCenterBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  footerLogoBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F0F9FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#0284C7',
  },
  footerLogoText: {
    fontSize: 7,
    fontWeight: '900',
    color: '#0284C7',
    marginTop: -2,
  },
  hotlineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  hotlineButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#475569',
  },

  // Modal styling
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
  },
  modalBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: Spacing.four,
    width: '100%',
    maxWidth: 420,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  infoLabel: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 8,
  },
  infoValue: {
    fontWeight: '700',
    color: '#1E293B',
  },
  infoValueGreen: {
    fontWeight: '700',
    color: '#10B981',
  },
  modalCloseBtn: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 14,
  },
  modalCloseBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
  modalPrimaryBtn: {
    backgroundColor: MedicalColors.primary,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  modalPrimaryBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginTop: 10,
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    fontSize: 14,
    color: '#0F172A',
  },
  modalActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 16,
  },
  modalCancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  modalCancelText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  modalSaveBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: MedicalColors.primary,
  },
  modalSaveText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  ticketItem: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  ticketCode: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0284C7',
  },
  ticketName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 2,
  },
  ticketStatus: {
    fontSize: 12,
    color: '#10B981',
    marginTop: 2,
  },
  fontSizeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
  },
  fontSizeOptionActive: {
    borderColor: MedicalColors.primary,
    backgroundColor: '#F0F9FF',
  },
  fontSizeOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
});
