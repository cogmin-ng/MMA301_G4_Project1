import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  Image,
  RefreshControl,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Card, Badge, Divider } from 'react-native-paper';
import { authService } from '@/services/auth-service';
import { useAuth } from '@/context/auth-context';
import { MedicalColors, Spacing } from '@/constants/theme';

export function UserRbacView({ onBackToHome }) {
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  // Modal: Đổi vai trò
  const [roleModalVisible, setRoleModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [targetRole, setTargetRole] = useState('PATIENT');
  const [updatingRole, setUpdatingRole] = useState(false);

  // Modal: Tạo tài khoản mới
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newPassword, setNewPassword] = useState('123456');
  const [newRole, setNewRole] = useState('PATIENT');
  const [creating, setCreating] = useState(false);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await authService.getUsers({
        role: roleFilter,
        search: search.trim() ? search.trim() : undefined,
      });
      setUsers(data);
    } catch (err) {
      Alert.alert('Lỗi', err.message || 'Không thể tải danh sách tài khoản.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [roleFilter, search]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const onRefresh = () => {
    setRefreshing(true);
    loadUsers();
  };

  const notify = (title, message) => {
    if (Platform.OS === 'web') {
      window.alert(`${title ? title + ': ' : ''}${message}`);
    } else {
      Alert.alert(title || 'Thông báo', message);
    }
  };

  // Đổi vai trò
  const handleOpenRoleModal = (u) => {
    setSelectedUser(u);
    setTargetRole(u.role);
    setRoleModalVisible(true);
  };

  const executeRoleChange = async () => {
    if (!selectedUser) return;
    setUpdatingRole(true);
    try {
      const updated = await authService.updateUserRole(selectedUser.id, targetRole);
      notify(
        'Thành công',
        `Đã phân quyền thành công tài khoản "${updated.full_name}" sang vai trò: ${updated.role}`
      );
      setRoleModalVisible(false);
      loadUsers();
    } catch (err) {
      notify('Lỗi', err.message);
    } finally {
      setUpdatingRole(false);
    }
  };

  const handleConfirmRoleChange = async () => {
    if (!selectedUser) return;
    if (selectedUser.id === currentUser?.id && targetRole !== 'ADMIN') {
      if (Platform.OS === 'web') {
        const ok = window.confirm(
          'Cảnh báo: Bạn đang thay đổi vai trò của chính tài khoản đang đăng nhập! Nếu chuyển thành Bác sĩ hoặc Bệnh nhân, bạn sẽ không còn quyền truy cập trang Quản trị này. Bạn có muốn tiếp tục?'
        );
        if (!ok) return;
        executeRoleChange();
        return;
      }
      Alert.alert(
        'Cảnh báo',
        'Bạn đang thay đổi vai trò của chính tài khoản đang đăng nhập! Nếu chuyển thành Bác sĩ hoặc Bệnh nhân, bạn sẽ không còn quyền truy cập trang Quản trị này.',
        [
          { text: 'Hủy', style: 'cancel' },
          { text: 'Tiếp tục', onPress: () => executeRoleChange() },
        ]
      );
      return;
    }
    executeRoleChange();
  };

  // Khóa / Kích hoạt tài khoản
  const handleToggleStatus = async (u) => {
    if (u.id === currentUser?.id) {
      notify('Lỗi', 'Không thể tự khóa tài khoản của chính bạn đang đăng nhập.');
      return;
    }

    const actionText = u.is_active ? 'Khóa' : 'Kích hoạt';
    if (Platform.OS === 'web') {
      const ok = window.confirm(`Bạn có chắc chắn muốn ${actionText.toLowerCase()} tài khoản "${u.full_name}"?`);
      if (!ok) return;
      try {
        const res = await authService.toggleUserStatus(u.id);
        notify('Thành công', res.is_active ? 'Đã kích hoạt tài khoản!' : 'Đã khóa tài khoản!');
        loadUsers();
      } catch (err) {
        notify('Lỗi', err.message);
      }
      return;
    }

    Alert.alert(
      `Xác nhận ${actionText}`,
      `Bạn có chắc chắn muốn ${actionText.toLowerCase()} tài khoản "${u.full_name}"?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xác nhận',
          onPress: async () => {
            try {
              const res = await authService.toggleUserStatus(u.id);
              Alert.alert(
                'Thành công',
                res.is_active ? 'Đã kích hoạt tài khoản!' : 'Đã khóa tài khoản!'
              );
              loadUsers();
            } catch (err) {
              Alert.alert('Lỗi', err.message);
            }
          },
        },
      ]
    );
  };

  // Tạo tài khoản mới
  const handleCreateUser = async () => {
    if (!newFullName.trim() || !newEmail.trim() || !newPassword) {
      notify('Lỗi', 'Vui lòng nhập họ tên, email và mật khẩu.');
      return;
    }

    setCreating(true);
    try {
      const created = await authService.createUser({
        full_name: newFullName.trim(),
        email: newEmail.trim(),
        phone: newPhone.trim() || undefined,
        password: newPassword,
        role: newRole,
      });

      notify(
        'Thành công',
        `Đã tạo tài khoản "${created.full_name}" với vai trò ${created.role} thành công!`
      );
      setCreateModalVisible(false);
      setNewFullName('');
      setNewEmail('');
      setNewPhone('');
      setNewPassword('123456');
      setNewRole('PATIENT');
      loadUsers();
    } catch (err) {
      notify('Lỗi', err.message);
    } finally {
      setCreating(false);
    }
  };

  // Kiểm thử đăng nhập nhanh tài khoản này
  const handleTestSwitch = async (u) => {
    if (!u.is_active) {
      notify('Lỗi', 'Tài khoản này đang bị khóa, không thể đăng nhập kiểm thử.');
      return;
    }
    try {
      await authService.switchAccountToUser(u);
      notify(
        'Đã chuyển tài khoản',
        `Hiện tại hệ thống đang chạy với phiên của: ${u.full_name} (${u.role}).`
      );
    } catch (err) {
      notify('Lỗi', err.message);
    }
  };

  // Thống kê đếm
  const countAdmin = users.filter((u) => u.role === 'ADMIN').length;
  const countDoctor = users.filter((u) => u.role === 'DOCTOR').length;
  const countPatient = users.filter((u) => u.role === 'PATIENT').length;

  const getRoleBadgeStyle = (role) => {
    switch (role) {
      case 'ADMIN':
        return { bg: '#F3E8FF', text: '#7E22CE', border: '#D8B4FE', label: '👑 QUẢN TRỊ VIÊN' };
      case 'DOCTOR':
        return { bg: '#E0F2FE', text: '#0284C7', border: '#BAE6FD', label: '🩺 BÁC SĨ' };
      case 'PATIENT':
      default:
        return { bg: '#ECFDF5', text: '#059669', border: '#A7F3D0', label: '👤 BỆNH NHÂN' };
    }
  };

  return (
    <View style={styles.container}>
      {/* 1. Header Bar */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          {onBackToHome && (
            <TouchableOpacity style={styles.backBtn} onPress={onBackToHome}>
              <MaterialCommunityIcons name="arrow-left" size={24} color="#1E293B" />
            </TouchableOpacity>
          )}
          <View style={styles.headerTextGroup}>
            <Text style={styles.headerTitle}>Phân quyền Tài khoản (RBAC)</Text>
            <Text style={styles.headerSub}>
              Quản lý tài khoản người dùng & phân quyền truy cập hệ thống
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.createBtn}
          activeOpacity={0.8}
          onPress={() => setCreateModalVisible(true)}>
          <MaterialCommunityIcons name="account-plus" size={18} color="#FFFFFF" />
          <Text style={styles.createBtnText}>Thêm tài khoản</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[MedicalColors.primary]} />
        }
        showsVerticalScrollIndicator={false}>
        {/* 2. Thống kê KPI vai trò */}
        <View style={styles.kpiRow}>
          <View style={[styles.kpiCard, { borderColor: '#CBD5E1' }]}>
            <Text style={styles.kpiNum}>{users.length}</Text>
            <Text style={styles.kpiLabel}>Tổng tài khoản</Text>
          </View>
          <View style={[styles.kpiCard, { borderColor: '#D8B4FE', backgroundColor: '#FAF5FF' }]}>
            <Text style={[styles.kpiNum, { color: '#7E22CE' }]}>{countAdmin}</Text>
            <Text style={styles.kpiLabel}>Quản trị viên</Text>
          </View>
          <View style={[styles.kpiCard, { borderColor: '#BAE6FD', backgroundColor: '#F0F9FF' }]}>
            <Text style={[styles.kpiNum, { color: '#0284C7' }]}>{countDoctor}</Text>
            <Text style={styles.kpiLabel}>Bác sĩ</Text>
          </View>
          <View style={[styles.kpiCard, { borderColor: '#A7F3D0', backgroundColor: '#F0FDF4' }]}>
            <Text style={[styles.kpiNum, { color: '#059669' }]}>{countPatient}</Text>
            <Text style={styles.kpiLabel}>Bệnh nhân</Text>
          </View>
        </View>

        {/* 3. Ô tìm kiếm */}
        <View style={styles.searchBar}>
          <MaterialCommunityIcons name="magnify" size={20} color="#64748B" />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm theo họ tên, email, số điện thoại..."
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <MaterialCommunityIcons name="close-circle" size={18} color="#94A3B8" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* 4. Bộ lọc theo vai trò */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.roleFilterRow}>
          {['ALL', 'ADMIN', 'DOCTOR', 'PATIENT'].map((r) => {
            const isSelected = roleFilter === r;
            const label =
              r === 'ALL'
                ? 'Tất cả'
                : r === 'ADMIN'
                ? 'Quản trị viên (Admin)'
                : r === 'DOCTOR'
                ? 'Bác sĩ (Doctor)'
                : 'Bệnh nhân (Patient)';
            return (
              <TouchableOpacity
                key={r}
                style={[styles.filterChip, isSelected && styles.filterChipActive]}
                onPress={() => setRoleFilter(r)}>
                <Text style={[styles.filterChipText, isSelected && styles.filterChipTextActive]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* 5. Danh sách tài khoản người dùng */}
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={MedicalColors.primary} />
            <Text style={styles.loadingText}>Đang tải danh sách tài khoản...</Text>
          </View>
        ) : users.length === 0 ? (
          <View style={styles.emptyBox}>
            <MaterialCommunityIcons name="account-search" size={48} color="#94A3B8" />
            <Text style={styles.emptyTitle}>Không tìm thấy tài khoản nào</Text>
            <Text style={styles.emptySub}>Thử tìm kiếm với từ khóa hoặc bộ lọc vai trò khác.</Text>
          </View>
        ) : (
          <View style={styles.userList}>
            {users.map((u) => {
              const roleBadge = getRoleBadgeStyle(u.role);
              const isCurrent = u.id === currentUser?.id;

              return (
                <Card key={u.id} style={styles.userCard} mode="elevated">
                  <Card.Content style={styles.userCardContent}>
                    {/* Hàng 1: Avatar + Tên + Badge Vai trò */}
                    <View style={styles.userCardHeader}>
                      <View style={styles.avatarWrapper}>
                        <Image
                          source={{
                            uri:
                              u.avatar ||
                              'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
                          }}
                          style={styles.avatarImg}
                        />
                        <View
                          style={[
                            styles.statusDot,
                            { backgroundColor: u.is_active ? '#10B981' : '#EF4444' },
                          ]}
                        />
                      </View>

                      <View style={styles.userInfoCol}>
                        <View style={styles.nameRow}>
                          <Text style={styles.userNameText}>{u.full_name}</Text>
                          {isCurrent && (
                            <Badge size={16} style={styles.currentBadge}>
                              Bạn
                            </Badge>
                          )}
                        </View>
                        <Text style={styles.userEmailText}>{u.email}</Text>
                        {u.phone ? <Text style={styles.userPhoneText}>📞 {u.phone}</Text> : null}
                      </View>

                      <View style={styles.roleBadgeCol}>
                        <View
                          style={[
                            styles.roleBadgeBox,
                            { backgroundColor: roleBadge.bg, borderColor: roleBadge.border },
                          ]}>
                          <Text style={[styles.roleBadgeText, { color: roleBadge.text }]}>
                            {roleBadge.label}
                          </Text>
                        </View>
                        <View style={styles.statusRow}>
                          <Text
                            style={[
                              styles.statusLabel,
                              { color: u.is_active ? '#059669' : '#DC2626' },
                            ]}>
                            {u.is_active ? '● Hoạt động' : '● Đã khóa'}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <Divider style={styles.cardDivider} />

                    {/* Hàng 2: Nút thao tác chuẩn hoá */}
                    <View style={styles.actionRow}>
                      <TouchableOpacity
                        style={styles.roleActionBtn}
                        activeOpacity={0.7}
                        onPress={() => handleOpenRoleModal(u)}>
                        <MaterialCommunityIcons name="shield-account-outline" size={16} color="#0284C7" />
                        <Text style={styles.roleActionBtnText}>Phân quyền vai trò</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.statusActionBtn,
                          u.is_active ? styles.statusBtnLock : styles.statusBtnUnlock,
                        ]}
                        activeOpacity={0.7}
                        onPress={() => handleToggleStatus(u)}>
                        <MaterialCommunityIcons
                          name={u.is_active ? 'lock-outline' : 'lock-open-variant-outline'}
                          size={15}
                          color={u.is_active ? '#DC2626' : '#059669'}
                        />
                        <Text
                          style={[
                            styles.statusActionBtnText,
                            { color: u.is_active ? '#DC2626' : '#059669' },
                          ]}>
                          {u.is_active ? 'Khóa tài khoản' : 'Kích hoạt lại'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </Card.Content>
                </Card>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* MODAL 1: PHÂN QUYỀN VAI TRÒ */}
      <Modal
        visible={roleModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setRoleModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderIconWrap}>
                <MaterialCommunityIcons name="shield-account-outline" size={22} color="#0284C7" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Phân quyền vai trò</Text>
                <Text style={styles.modalSub}>
                  Thiết lập quyền truy cập hệ thống cho tài khoản
                </Text>
              </View>
            </View>

            <View style={styles.modalTargetBox}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={styles.modalTargetName}>{selectedUser?.full_name}</Text>
                <Text style={styles.modalTargetEmail}>{selectedUser?.email}</Text>
              </View>
              <View style={styles.targetRoleBadge}>
                <Text style={styles.targetRoleBadgeText}>
                  {selectedUser?.role === 'ADMIN'
                    ? 'Quản trị viên'
                    : selectedUser?.role === 'DOCTOR'
                    ? 'Bác sĩ'
                    : 'Bệnh nhân'}
                </Text>
              </View>
            </View>

            <Text style={styles.roleSelectLabel}>Chọn vai trò áp dụng:</Text>

            {/* Lựa chọn ADMIN */}
            <TouchableOpacity
              style={[styles.roleOption, targetRole === 'ADMIN' && styles.roleOptionActiveAdmin]}
              activeOpacity={0.8}
              onPress={() => setTargetRole('ADMIN')}>
              <View style={styles.roleOptionLeft}>
                <View style={[styles.roleIconCircle, { backgroundColor: '#F3E8FF' }]}>
                  <MaterialCommunityIcons name="shield-crown-outline" size={20} color="#7E22CE" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.roleOptionTitle, targetRole === 'ADMIN' && { color: '#7E22CE' }]}>
                    Quản trị viên (ADMIN)
                  </Text>
                  <Text style={styles.roleOptionDesc}>
                    Toàn quyền quản trị cơ sở y tế, số liệu và tài khoản.
                  </Text>
                </View>
              </View>
              <View style={[styles.radioCircle, targetRole === 'ADMIN' && styles.radioCircleActiveAdmin]}>
                {targetRole === 'ADMIN' && <View style={[styles.radioDot, { backgroundColor: '#7E22CE' }]} />}
              </View>
            </TouchableOpacity>

            {/* Lựa chọn DOCTOR */}
            <TouchableOpacity
              style={[styles.roleOption, targetRole === 'DOCTOR' && styles.roleOptionActiveDoctor]}
              activeOpacity={0.8}
              onPress={() => setTargetRole('DOCTOR')}>
              <View style={styles.roleOptionLeft}>
                <View style={[styles.roleIconCircle, { backgroundColor: '#E0F2FE' }]}>
                  <MaterialCommunityIcons name="stethoscope" size={20} color="#0284C7" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.roleOptionTitle, targetRole === 'DOCTOR' && { color: '#0284C7' }]}>
                    Bác sĩ (DOCTOR)
                  </Text>
                  <Text style={styles.roleOptionDesc}>
                    Quản lý lịch khám bệnh, danh sách ca trực và hồ sơ chuyên môn.
                  </Text>
                </View>
              </View>
              <View style={[styles.radioCircle, targetRole === 'DOCTOR' && styles.radioCircleActiveDoctor]}>
                {targetRole === 'DOCTOR' && <View style={[styles.radioDot, { backgroundColor: '#0284C7' }]} />}
              </View>
            </TouchableOpacity>

            {/* Lựa chọn PATIENT */}
            <TouchableOpacity
              style={[styles.roleOption, targetRole === 'PATIENT' && styles.roleOptionActivePatient]}
              activeOpacity={0.8}
              onPress={() => setTargetRole('PATIENT')}>
              <View style={styles.roleOptionLeft}>
                <View style={[styles.roleIconCircle, { backgroundColor: '#ECFDF5' }]}>
                  <MaterialCommunityIcons name="account-outline" size={20} color="#059669" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.roleOptionTitle, targetRole === 'PATIENT' && { color: '#059669' }]}>
                    Bệnh nhân (PATIENT)
                  </Text>
                  <Text style={styles.roleOptionDesc}>
                    Tra cứu dịch vụ y tế, đặt lịch khám và theo dõi hồ sơ bệnh án.
                  </Text>
                </View>
              </View>
              <View style={[styles.radioCircle, targetRole === 'PATIENT' && styles.radioCircleActivePatient]}>
                {targetRole === 'PATIENT' && <View style={[styles.radioDot, { backgroundColor: '#059669' }]} />}
              </View>
            </TouchableOpacity>

            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setRoleModalVisible(false)}
                disabled={updatingRole}>
                <Text style={styles.modalCancelText}>Hủy</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={handleConfirmRoleChange}
                disabled={updatingRole}>
                {updatingRole ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalSaveText}>Lưu thay đổi</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL 2: TẠO TÀI KHOẢN MỚI */}
      <Modal
        visible={createModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setCreateModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
            <View style={styles.modalBox}>
              <View style={styles.modalHeader}>
                <MaterialCommunityIcons name="account-plus" size={24} color="#0284C7" />
                <Text style={styles.modalTitle}>Tạo tài khoản mới</Text>
              </View>
              <Text style={styles.modalSub}>
                Tạo tài khoản mới và cấp quyền truy cập hệ thống.
              </Text>
              <Divider style={{ marginVertical: 10 }} />

              <Text style={styles.inputLabel}>Họ và tên *</Text>
              <TextInput
                style={styles.input}
                placeholder="VD: Nguyễn Văn A"
                value={newFullName}
                onChangeText={setNewFullName}
              />

              <Text style={styles.inputLabel}>Email đăng nhập *</Text>
              <TextInput
                style={styles.input}
                placeholder="VD: user@youmed.vn"
                keyboardType="email-address"
                autoCapitalize="none"
                value={newEmail}
                onChangeText={setNewEmail}
              />

              <Text style={styles.inputLabel}>Số điện thoại</Text>
              <TextInput
                style={styles.input}
                placeholder="VD: 0901234567"
                keyboardType="phone-pad"
                value={newPhone}
                onChangeText={setNewPhone}
              />

              <Text style={styles.inputLabel}>Mật khẩu khởi tạo *</Text>
              <TextInput
                style={styles.input}
                placeholder="Mặc định: 123456"
                secureTextEntry
                value={newPassword}
                onChangeText={setNewPassword}
              />

              <Text style={styles.inputLabel}>Phân quyền vai trò ban đầu:</Text>
              <View style={styles.roleButtonGroup}>
                {['PATIENT', 'DOCTOR', 'ADMIN'].map((r) => (
                  <TouchableOpacity
                    key={r}
                    style={[
                      styles.roleChoiceBtn,
                      newRole === r && styles.roleChoiceBtnActive,
                    ]}
                    onPress={() => setNewRole(r)}>
                    <Text
                      style={[
                        styles.roleChoiceBtnText,
                        newRole === r && styles.roleChoiceBtnTextActive,
                      ]}>
                      {r === 'ADMIN' ? '👑 Admin' : r === 'DOCTOR' ? '🩺 Bác sĩ' : '👤 Bệnh nhân'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.modalActionRow}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => setCreateModalVisible(false)}
                  disabled={creating}>
                  <Text style={styles.modalCancelText}>Hủy</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalSaveBtn}
                  onPress={handleCreateUser}
                  disabled={creating}>
                  {creating ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.modalSaveText}>Tạo tài khoản</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EDF5FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  backBtn: {
    padding: 4,
  },
  headerTextGroup: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: MedicalColors.primary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  createBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  scrollContent: {
    padding: Spacing.four,
    paddingBottom: 110,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  kpiCard: {
    flex: 1,
    height: 76,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    elevation: 1,
  },
  kpiNum: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1E293B',
    lineHeight: 24,
  },
  kpiLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 2,
    textAlign: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginBottom: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1E293B',
  },
  roleFilterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipActive: {
    backgroundColor: MedicalColors.primary,
    borderColor: MedicalColors.primary,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  loadingBox: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: '#64748B',
  },
  emptyBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    marginTop: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
    marginTop: 12,
  },
  emptySub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
  },
  userList: {
    gap: 12,
  },
  userCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  userCardContent: {
    padding: 14,
  },
  userCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarImg: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#E2E8F0',
  },
  statusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  userInfoCol: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  userNameText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  currentBadge: {
    backgroundColor: '#0284C7',
    fontSize: 10,
  },
  userEmailText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  userPhoneText: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 1,
  },
  roleBadgeCol: {
    alignItems: 'flex-end',
    gap: 4,
  },
  roleBadgeBox: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  statusRow: {
    marginTop: 2,
  },
  statusLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  cardDivider: {
    marginVertical: 10,
    backgroundColor: '#F1F5F9',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  roleActionBtn: {
    flex: 1,
    height: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  roleActionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0284C7',
  },
  statusActionBtn: {
    flex: 1,
    height: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusBtnLock: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  statusBtnUnlock: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  statusActionBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 460,
    elevation: 8,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalHeaderIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  modalTargetBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    marginVertical: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTargetName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalTargetEmail: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  targetRoleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#E2E8F0',
  },
  targetRoleBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  roleSelectLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 10,
  },
  roleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginBottom: 10,
    backgroundColor: '#FFFFFF',
  },
  roleOptionActiveAdmin: {
    borderColor: '#7E22CE',
    backgroundColor: '#FAF5FF',
  },
  roleOptionActiveDoctor: {
    borderColor: '#0284C7',
    backgroundColor: '#F0F9FF',
  },
  roleOptionActivePatient: {
    borderColor: '#059669',
    backgroundColor: '#F0FDF4',
  },
  roleOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    paddingRight: 8,
  },
  roleIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleOptionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  roleOptionDesc: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 16,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleActiveAdmin: {
    borderColor: '#7E22CE',
  },
  radioCircleActiveDoctor: {
    borderColor: '#0284C7',
  },
  radioCircleActivePatient: {
    borderColor: '#059669',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  modalActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 18,
  },
  modalCancelBtn: {
    height: 42,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  modalSaveBtn: {
    height: 42,
    paddingHorizontal: 22,
    borderRadius: 8,
    backgroundColor: MedicalColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSaveText: {
    fontSize: 13,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginTop: 8,
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    fontSize: 13,
    color: '#0F172A',
  },
  roleButtonGroup: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  roleChoiceBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  roleChoiceBtnActive: {
    borderColor: MedicalColors.primary,
    backgroundColor: '#F0F9FF',
  },
  roleChoiceBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  roleChoiceBtnTextActive: {
    color: MedicalColors.primary,
    fontWeight: '700',
  },
});
