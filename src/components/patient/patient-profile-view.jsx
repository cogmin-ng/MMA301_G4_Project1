import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Platform,
  Image,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { patientService } from '../../services/patient-service';

/* ─── Helper functions ─── */

function formatDisplayDate(dateStr) {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '-';
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  } catch {
    return '-';
  }
}

function formatDateForInput(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  } catch {
    return '';
  }
}

function formatDisplayGender(gender) {
  if (!gender) return '-';
  const map = { MALE: 'Nam', FEMALE: 'Nữ', OTHER: 'Khác' };
  return map[gender.toUpperCase()] || gender;
}

function parseDateInput(text) {
  // Accept dd/mm/yyyy format
  const parts = text.split('/');
  if (parts.length === 3) {
    const [dd, mm, yyyy] = parts;
    if (dd && mm && yyyy && yyyy.length === 4) {
      return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
    }
  }
  return null;
}

/* ─── Component ─── */

export function PatientProfileView({ user, onLogout, onBack, onProfileUpdated }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Edit mode state
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editData, setEditData] = useState({});

  const loadProfile = useCallback(async () => {
    try {
      setError('');
      const data = await patientService.getProfile();
      setProfile(data);
      if (onProfileUpdated && data) {
        onProfileUpdated(data);
      }
    } catch (err) {
      setError(err.message || 'Không thể tải thông tin cá nhân.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [onProfileUpdated]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const onRefresh = () => {
    setRefreshing(true);
    loadProfile();
  };

  const startEditing = () => {
    setEditData({
      full_name: profile?.full_name || '',
      phone: profile?.phone || '',
      date_of_birth: formatDateForInput(profile?.date_of_birth),
      gender: profile?.gender || '',
      address: profile?.address || '',
    });
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
    setEditData({});
  };

  const saveProfile = async () => {
    try {
      setSaving(true);
      const payload = {
        full_name: editData.full_name?.trim() || undefined,
        phone: editData.phone?.trim() || undefined,
        gender: editData.gender || undefined,
        address: editData.address?.trim() || undefined,
      };

      // Parse date
      if (editData.date_of_birth) {
        const parsed = parseDateInput(editData.date_of_birth);
        if (parsed) {
          payload.date_of_birth = parsed;
        }
      } else {
        payload.date_of_birth = null;
      }

      const updated = await patientService.updateProfile(payload);
      setProfile(updated);
      if (onProfileUpdated && updated) {
        onProfileUpdated(updated);
      }
      setEditing(false);
      Alert.alert('Thành công', 'Đã cập nhật thông tin cá nhân.');
    } catch (err) {
      Alert.alert('Lỗi', err.message || 'Cập nhật thất bại.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc muốn đăng xuất?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: () => onLogout && onLogout(),
      },
    ]);
  };

  const displayName = profile?.full_name || user?.full_name || '-';
  const getInitials = (name) => {
    if (!name || name === '-') return '?';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[parts.length - 2][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  /* ─── Loading state ─── */
  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2478F2" />
        <Text style={styles.loadingText}>Đang tải thông tin...</Text>
      </View>
    );
  }

  /* ─── Error state ─── */
  if (error && !profile) {
    return (
      <View style={styles.centerContainer}>
        <MaterialCommunityIcons name="alert-circle-outline" size={48} color="#EF4444" />
        <Text style={styles.errorTitle}>Không thể tải dữ liệu</Text>
        <Text style={styles.errorSub}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => { setLoading(true); loadProfile(); }}>
          <Text style={styles.retryBtnText}>Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const avatarUri = profile?.avatar || user?.avatar;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2478F2']} />}
    >
      {/* ─── Header ─── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MaterialCommunityIcons name="plus-box" size={28} color="#2478F2" />
          <Text style={styles.headerTitle}>Cá Nhân</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerIconBtn}>
            <MaterialCommunityIcons name="bell-outline" size={22} color="#334155" />
          </TouchableOpacity>
          <View style={styles.headerAvatarBox}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.headerAvatar} />
            ) : (
              <View style={styles.headerAvatarFallback}>
                <MaterialCommunityIcons name="account" size={18} color="#FFFFFF" />
              </View>
            )}
          </View>
        </View>
      </View>

      {/* ─── Profile Card ─── */}
      <View style={styles.profileCard}>
        <View style={styles.avatarContainer}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.profileAvatar} />
          ) : (
            <View style={styles.profileAvatarFallback}>
              <Text style={styles.avatarInitials}>{getInitials(displayName)}</Text>
            </View>
          )}
          <View style={styles.cameraBadge}>
            <MaterialCommunityIcons name="camera" size={14} color="#FFFFFF" />
          </View>
        </View>

        <Text style={styles.profileName}>{displayName}</Text>

        <View style={styles.roleBadge}>
          <MaterialCommunityIcons name="map-marker-outline" size={14} color="#2478F2" />
          <Text style={styles.roleText}>Bệnh nhân</Text>
        </View>

        <TouchableOpacity style={styles.editBtn} onPress={startEditing}>
          <MaterialCommunityIcons name="pencil-outline" size={16} color="#2478F2" />
          <Text style={styles.editBtnText}>Chỉnh sửa thông tin</Text>
        </TouchableOpacity>
      </View>

      {/* ─── Personal Info / Edit Form ─── */}
      {editing ? (
        <View style={styles.infoSection}>
          <Text style={styles.infoSectionTitle}>
            <MaterialCommunityIcons name="card-account-details-outline" size={18} color="#334155" />
            {'  '}Chỉnh sửa thông tin
          </Text>
          <View style={styles.infoCard}>
            {/* Họ và tên */}
            <View style={styles.editField}>
              <Text style={styles.editLabel}>Họ và tên</Text>
              <TextInput
                style={styles.editInput}
                value={editData.full_name}
                onChangeText={(v) => setEditData({ ...editData, full_name: v })}
                placeholder="Nhập họ và tên"
                placeholderTextColor="#94A3B8"
              />
            </View>

            {/* Email (read-only) */}
            <View style={styles.editField}>
              <Text style={styles.editLabel}>Email</Text>
              <TextInput
                style={[styles.editInput, styles.editInputDisabled]}
                value={profile?.email || ''}
                editable={false}
              />
            </View>

            {/* Số điện thoại */}
            <View style={styles.editField}>
              <Text style={styles.editLabel}>Số điện thoại</Text>
              <TextInput
                style={styles.editInput}
                value={editData.phone}
                onChangeText={(v) => setEditData({ ...editData, phone: v })}
                placeholder="Nhập số điện thoại"
                placeholderTextColor="#94A3B8"
                keyboardType="phone-pad"
              />
            </View>

            {/* Ngày sinh */}
            <View style={styles.editField}>
              <Text style={styles.editLabel}>Ngày sinh (dd/mm/yyyy)</Text>
              <TextInput
                style={styles.editInput}
                value={editData.date_of_birth}
                onChangeText={(v) => setEditData({ ...editData, date_of_birth: v })}
                placeholder="VD: 15/08/1990"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
              />
            </View>

            {/* Giới tính */}
            <View style={styles.editField}>
              <Text style={styles.editLabel}>Giới tính</Text>
              <View style={styles.genderChips}>
                {['MALE', 'FEMALE', 'OTHER'].map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[styles.genderChip, editData.gender === g && styles.genderChipActive]}
                    onPress={() => setEditData({ ...editData, gender: g })}
                  >
                    <Text style={[styles.genderChipText, editData.gender === g && styles.genderChipTextActive]}>
                      {formatDisplayGender(g)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Địa chỉ */}
            <View style={styles.editField}>
              <Text style={styles.editLabel}>Địa chỉ</Text>
              <TextInput
                style={[styles.editInput, { minHeight: 60, textAlignVertical: 'top' }]}
                value={editData.address}
                onChangeText={(v) => setEditData({ ...editData, address: v })}
                placeholder="Nhập địa chỉ"
                placeholderTextColor="#94A3B8"
                multiline
              />
            </View>

            {/* Buttons */}
            <View style={styles.editActions}>
              <TouchableOpacity
                style={[styles.actionBtn, styles.saveBtnStyle]}
                onPress={saveProfile}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="content-save-outline" size={16} color="#FFFFFF" />
                    <Text style={styles.saveBtnText}>Lưu thay đổi</Text>
                  </>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, styles.cancelBtnStyle]}
                onPress={cancelEditing}
                disabled={saving}
              >
                <MaterialCommunityIcons name="close" size={16} color="#64748B" />
                <Text style={styles.cancelBtnText}>Hủy</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.infoSection}>
          <Text style={styles.infoSectionTitle}>
            <MaterialCommunityIcons name="card-account-details-outline" size={18} color="#334155" />
            {'  '}Thông tin cá nhân
          </Text>
          <View style={styles.infoCard}>
            <InfoRow label="Họ và tên" value={profile?.full_name} />
            <InfoRow label="Email" value={profile?.email} />
            <InfoRow label="Số điện thoại" value={profile?.phone} />
            <InfoRow label="Ngày sinh" value={formatDisplayDate(profile?.date_of_birth)} />
            <InfoRow label="Giới tính" value={formatDisplayGender(profile?.gender)} isLast={!profile?.address} />
            <InfoRow label="Địa chỉ" value={profile?.address} isLast />
          </View>
        </View>
      )}

      {/* ─── Logout Button ─── */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
        <MaterialCommunityIcons name="logout" size={20} color="#EF4444" />
        <Text style={styles.logoutBtnText}>Đăng xuất</Text>
      </TouchableOpacity>

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

/* ─── Info Row Sub-component ─── */
function InfoRow({ label, value, isLast }) {
  return (
    <View style={[styles.infoRow, !isLast && styles.infoRowBorder]}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value || '-'}</Text>
    </View>
  );
}

/* ─── Styles ─── */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFE',
  },
  contentContainer: {
    paddingBottom: 24,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#F8FAFE',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
  },
  errorTitle: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '700',
    color: '#EF4444',
  },
  errorSub: {
    marginTop: 6,
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 16,
    backgroundColor: '#2478F2',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 12 : 8,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarBox: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#2478F2',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  headerAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  headerAvatarFallback: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#2478F2',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Profile Card */
  profileCard: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  profileAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#E2E8F0',
  },
  profileAvatarFallback: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#2478F2',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#E2E8F0',
  },
  avatarInitials: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '800',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2478F2',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  profileName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 14,
  },
  roleText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2478F2',
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0F6FE',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  editBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2478F2',
  },

  /* Info Section */
  infoSection: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  infoSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 10,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 14,
  },
  infoRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1.5,
    textAlign: 'right',
  },

  /* Edit Form */
  editField: {
    marginBottom: 16,
  },
  editLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  editInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
  },
  editInputDisabled: {
    backgroundColor: '#F1F5F9',
    color: '#94A3B8',
  },
  genderChips: {
    flexDirection: 'row',
    gap: 10,
  },
  genderChip: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  genderChipActive: {
    backgroundColor: '#2478F2',
    borderColor: '#2478F2',
  },
  genderChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  genderChipTextActive: {
    color: '#FFFFFF',
  },
  editActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
  },
  saveBtnStyle: {
    backgroundColor: '#2478F2',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  cancelBtnStyle: {
    backgroundColor: '#F1F5F9',
  },
  cancelBtnText: {
    color: '#64748B',
    fontWeight: '700',
    fontSize: 14,
  },

  /* Logout */
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 24,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  logoutBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#EF4444',
  },
});

