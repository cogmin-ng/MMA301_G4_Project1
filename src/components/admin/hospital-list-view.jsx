import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  ScrollView,
  Image,
  Alert,
  RefreshControl,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Card, Chip, Divider } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { hospitalService } from '@/services/hospital-service';
import { uploadService } from '@/services/upload-service';
import { MedicalColors, Spacing } from '@/constants/theme';

export function HospitalListView({
  initialCreateOpen = false,
  onCloseCreateOpen,
}) {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [keyword, setKeyword] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [provinces, setProvinces] = useState([]);

  // Modals state
  const [modalType, setModalType] = useState(
    initialCreateOpen ? 'CREATE' : null
  );
  const [selectedHospital, setSelectedHospital] = useState(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formProvince, setFormProvince] = useState('Hồ Chí Minh');
  const [formDistrict, setFormDistrict] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formStatus, setFormStatus] = useState('ACTIVE');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  const loadHospitals = useCallback(async () => {
    try {
      const data = await hospitalService.getHospitals({
        keyword,
        province: selectedProvince,
        status: selectedStatus,
      });
      setHospitals(data);
    } catch (err) {
      console.warn('Lỗi lấy danh sách bệnh viện:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [keyword, selectedProvince, selectedStatus]);

  const loadProvinces = async () => {
    const list = await hospitalService.getProvinces();
    setProvinces(list);
  };

  useEffect(() => {
    loadProvinces();
  }, []);

  useEffect(() => {
    loadHospitals();
  }, [loadHospitals]);

  const onRefresh = () => {
    setRefreshing(true);
    loadHospitals();
    loadProvinces();
  };

  const handlePickImage = async () => {
    try {
      if (Platform.OS === 'web') {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/jpeg,image/png,image/webp,image/gif';
        input.onchange = async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          if (file.size > 10 * 1024 * 1024) {
            Alert.alert('Lỗi', 'Dung lượng ảnh tối đa là 10MB.');
            return;
          }
          setUploadingImage(true);
          try {
            const url = await uploadService.uploadFile(file);
            setFormImageUrl(url);
          } catch (err) {
            Alert.alert('Lỗi tải ảnh', err.message || 'Không thể tải ảnh lên máy chủ');
          } finally {
            setUploadingImage(false);
          }
        };
        input.click();
        return;
      }

      // Trên thiết bị di động Native (iOS/Android)
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Quyền truy cập',
          'Vui lòng cấp quyền truy cập thư viện ảnh để tải ảnh cơ sở y tế.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.85,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setUploadingImage(true);
        try {
          let url = '';
          if (asset.base64) {
            url = await uploadService.uploadBase64(
              `data:${asset.mimeType || 'image/jpeg'};base64,${asset.base64}`,
              asset.fileName || 'hospital.jpg'
            );
          } else {
            const formData = new FormData();
            formData.append('file', {
              uri: asset.uri,
              name: asset.fileName || 'hospital.jpg',
              type: asset.mimeType || 'image/jpeg',
            });
            url = await uploadService.uploadFile(formData);
          }
          setFormImageUrl(url);
        } catch (err) {
          Alert.alert('Lỗi tải ảnh', err.message || 'Không thể tải ảnh lên');
        } finally {
          setUploadingImage(false);
        }
      }
    } catch (err) {
      console.error('Lỗi chọn ảnh:', err);
      Alert.alert('Lỗi', 'Không thể chọn ảnh: ' + err.message);
    }
  };

  const openCreateModal = () => {
    setFormName('');
    setFormAddress('');
    setFormProvince('Hồ Chí Minh');
    setFormDistrict('');
    setFormPhone('');
    setFormEmail('');
    setFormDescription('');
    setFormImageUrl('');
    setFormStatus('ACTIVE');
    setFormError('');
    setModalType('CREATE');
  };

  const openEditModal = (h) => {
    setSelectedHospital(h);
    setFormName(h.name);
    setFormAddress(h.address);
    setFormProvince(h.province || 'Hồ Chí Minh');
    setFormDistrict(h.district || '');
    setFormPhone(h.phone || '');
    setFormEmail(h.email || '');
    setFormDescription(h.description || '');
    setFormImageUrl(h.image_url || '');
    setFormStatus(h.status);
    setFormError('');
    setModalType('EDIT');
  };

  const openDetailModal = (h) => {
    setSelectedHospital(h);
    setModalType('DETAIL');
  };

  const closeModal = () => {
    setModalType(null);
    setSelectedHospital(null);
    onCloseCreateOpen?.();
  };

  const handleSubmitForm = async () => {
    if (!formName.trim()) {
      setFormError('Vui lòng nhập tên bệnh viện.');
      return;
    }
    if (!formAddress.trim()) {
      setFormError('Vui lòng nhập địa chỉ bệnh viện.');
      return;
    }

    setFormError('');
    setFormSubmitting(true);
    try {
      if (modalType === 'CREATE') {
        await hospitalService.createHospital({
          name: formName,
          address: formAddress,
          province: formProvince,
          district: formDistrict,
          phone: formPhone,
          email: formEmail,
          description: formDescription,
          image_url: formImageUrl,
          status: formStatus,
        });
        Alert.alert('Thành công', 'Thêm cơ sở y tế thành công!');
      } else if (modalType === 'EDIT' && selectedHospital) {
        await hospitalService.updateHospital(selectedHospital.id, {
          name: formName,
          address: formAddress,
          province: formProvince,
          district: formDistrict,
          phone: formPhone,
          email: formEmail,
          description: formDescription,
          image_url: formImageUrl,
          status: formStatus,
        });
        Alert.alert('Thành công', 'Cập nhật cơ sở y tế thành công!');
      }
      closeModal();
      loadHospitals();
      loadProvinces();
    } catch (err) {
      setFormError(err.message || 'Thao tác thất bại.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleToggleStatus = async (hospital) => {
    try {
      await hospitalService.toggleHospitalStatus(hospital.id);
      loadHospitals();
    } catch (err) {
      Alert.alert('Lỗi', err.message);
    }
  };

  const handleDeleteHospital = (hospital) => {
    Alert.alert(
      'Xác nhận xóa',
      `Bạn có chắc chắn muốn xóa cơ sở y tế "${hospital.name}"?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa vĩnh viễn',
          style: 'destructive',
          onPress: async () => {
            try {
              await hospitalService.deleteHospital(hospital.id);
              loadHospitals();
            } catch (err) {
              Alert.alert('Không thể xóa', err.message);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header Bar */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.pageTitle}>Quản lý Cơ sở Y tế</Text>
          <Text style={styles.pageSub}>
            ({hospitals.length} cơ sở y tế đang liên kết)
          </Text>
        </View>

        <TouchableOpacity style={styles.addBtn} onPress={openCreateModal}>
          <MaterialCommunityIcons name="plus" size={18} color="#FFFFFF" />
          <Text style={styles.addBtnText}>Thêm mới</Text>
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View style={styles.searchBox}>
        <MaterialCommunityIcons name="magnify" size={20} color="#64748B" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm theo tên bệnh viện, địa chỉ, quận huyện..."
          placeholderTextColor={MedicalColors.textMuted}
          value={keyword}
          onChangeText={setKeyword}
        />
        {keyword ? (
          <TouchableOpacity onPress={() => setKeyword('')}>
            <MaterialCommunityIcons name="close-circle" size={18} color="#94A3B8" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Filter Tabs: Status & Province */}
      <View style={styles.filterSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsRow}>
          <TouchableOpacity
            style={[styles.filterPill, selectedStatus === 'ALL' && styles.filterPillActive]}
            activeOpacity={0.7}
            onPress={() => setSelectedStatus('ALL')}>
            <Text style={[styles.filterPillText, selectedStatus === 'ALL' && styles.filterPillTextActive]}>
              Tất cả
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterPill, selectedStatus === 'ACTIVE' && styles.filterPillActive]}
            activeOpacity={0.7}
            onPress={() => setSelectedStatus('ACTIVE')}>
            <View style={[styles.filterDot, { backgroundColor: '#16A34A' }]} />
            <Text style={[styles.filterPillText, selectedStatus === 'ACTIVE' && styles.filterPillTextActive]}>
              Hoạt động
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterPill, selectedStatus === 'INACTIVE' && styles.filterPillActive]}
            activeOpacity={0.7}
            onPress={() => setSelectedStatus('INACTIVE')}>
            <View style={[styles.filterDot, { backgroundColor: '#DC2626' }]} />
            <Text style={[styles.filterPillText, selectedStatus === 'INACTIVE' && styles.filterPillTextActive]}>
              Tạm ngưng
            </Text>
          </TouchableOpacity>

          {provinces.map((prov) => {
            const isSelected = selectedProvince === prov;
            return (
              <TouchableOpacity
                key={prov}
                style={[styles.filterPill, isSelected && styles.filterPillActive]}
                activeOpacity={0.7}
                onPress={() => setSelectedProvince(isSelected ? 'ALL' : prov)}>
                <Text style={[styles.filterPillText, isSelected && styles.filterPillTextActive]}>
                  {prov}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Hospital List */}
      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={MedicalColors.primary} />
          <Text style={styles.loadingText}>Đang tải dữ liệu cơ sở y tế...</Text>
        </View>
      ) : (
        <FlatList
          data={hospitals}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[MedicalColors.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="hospital-box-outline" size={48} color="#94A3B8" />
              <Text style={styles.emptyTitle}>Không tìm thấy bệnh viện nào</Text>
              <Text style={styles.emptySub}>
                Thử thay đổi từ khóa tìm kiếm hoặc bấm Thêm mới để tạo cơ sở mới.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => openDetailModal(item)}>
              <Card style={styles.card} mode="elevated">
                <Card.Content style={{ padding: 12 }}>
                  <View style={styles.cardHeader}>
                    <Image
                      source={{
                        uri:
                          item.image_url ||
                          'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=600',
                      }}
                      style={styles.hospitalImage}
                    />
                    <View style={styles.headerInfo}>
                      <View style={styles.statusRow}>
                        <View
                          style={[
                            styles.statusBadge,
                            item.status === 'ACTIVE'
                              ? styles.statusBadgeActive
                              : styles.statusBadgeInactive,
                          ]}>
                          <View
                            style={[
                              styles.statusDot,
                              {
                                backgroundColor:
                                  item.status === 'ACTIVE' ? '#16A34A' : '#DC2626',
                              },
                            ]}
                          />
                          <Text
                            style={[
                              styles.statusBadgeText,
                              {
                                color:
                                  item.status === 'ACTIVE' ? '#15803D' : '#DC2626',
                              },
                            ]}>
                            {item.status === 'ACTIVE' ? 'Hoạt động' : 'Tạm ngưng'}
                          </Text>
                        </View>

                        <Text style={styles.doctorCountTag}>
                          🩺 {item.doctor_count || 0} BS
                        </Text>
                      </View>

                      <Text style={styles.hospitalName} numberOfLines={2}>
                        {item.name}
                      </Text>
                      <Text style={styles.hospitalAddress} numberOfLines={1}>
                        📍 {item.district ? `${item.district}, ` : ''}{item.province || item.address}
                      </Text>
                    </View>
                  </View>

                  {/* Nút thao tác nhanh gọn */}
                  <View style={styles.cardActionsRow}>
                    <TouchableOpacity
                      style={styles.actionBtnEdit}
                      activeOpacity={0.7}
                      onPress={(e) => {
                        e.stopPropagation?.();
                        openEditModal(item);
                      }}>
                      <MaterialCommunityIcons name="pencil-outline" size={15} color="#334155" />
                      <Text style={styles.actionBtnEditText}>Chỉnh sửa</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.actionBtnToggle,
                        item.status === 'ACTIVE'
                          ? styles.actionBtnToggleDeactive
                          : styles.actionBtnToggleActive,
                      ]}
                      activeOpacity={0.7}
                      onPress={(e) => {
                        e.stopPropagation?.();
                        handleToggleStatus(item);
                      }}>
                      <MaterialCommunityIcons
                        name={
                          item.status === 'ACTIVE'
                            ? 'pause-circle-outline'
                            : 'play-circle-outline'
                        }
                        size={15}
                        color={item.status === 'ACTIVE' ? '#64748B' : '#15803D'}
                      />
                      <Text
                        style={[
                          styles.actionBtnToggleText,
                          { color: item.status === 'ACTIVE' ? '#475569' : '#15803D' },
                        ]}>
                        {item.status === 'ACTIVE' ? 'Tạm ngưng' : 'Kích hoạt'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.actionBtnDelete}
                      activeOpacity={0.7}
                      onPress={(e) => {
                        e.stopPropagation?.();
                        handleDeleteHospital(item);
                      }}>
                      <MaterialCommunityIcons name="trash-can-outline" size={16} color="#DC2626" />
                    </TouchableOpacity>
                  </View>
                </Card.Content>
              </Card>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Modal: Create & Edit Form */}
      <Modal
        visible={modalType === 'CREATE' || modalType === 'EDIT'}
        animationType="slide"
        transparent={true}
        onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <MaterialCommunityIcons
                  name={modalType === 'CREATE' ? 'plus-box' : 'hospital-box-outline'}
                  size={22}
                  color={MedicalColors.primary}
                />
                <Text style={styles.modalTitle}>
                  {modalType === 'CREATE' ? 'Thêm Cơ sở Y tế mới' : 'Cập nhật Cơ sở Y tế'}
                </Text>
              </View>
              <TouchableOpacity onPress={closeModal}>
                <MaterialCommunityIcons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.formScroll} keyboardShouldPersistTaps="handled">
              <Text style={styles.formLabel}>Tên cơ sở y tế / Bệnh viện *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="VD: Bệnh viện Đại học Y Dược TP.HCM"
                value={formName}
                onChangeText={setFormName}
              />

              <Text style={styles.formLabel}>Địa chỉ chi tiết *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="VD: 215 Hồng Bàng, Phường 11, Quận 5"
                value={formAddress}
                onChangeText={setFormAddress}
              />

              <View style={styles.formRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formLabel}>Tỉnh / Thành phố</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="Hồ Chí Minh"
                    value={formProvince}
                    onChangeText={setFormProvince}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formLabel}>Quận / Huyện</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="Quận 5"
                    value={formDistrict}
                    onChangeText={setFormDistrict}
                  />
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formLabel}>Hotline liên hệ</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="028 3855 4269"
                    value={formPhone}
                    onChangeText={setFormPhone}
                    keyboardType="phone-pad"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formLabel}>Email</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="contact@hospital.vn"
                    value={formEmail}
                    onChangeText={setFormEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              <Text style={styles.formLabel}>Hình ảnh đại diện cơ sở y tế</Text>

              {/* Upload Dropzone / Preview */}
              {formImageUrl ? (
                <View style={styles.imagePreviewBox}>
                  <Image source={{ uri: formImageUrl }} style={styles.previewImage} />
                  <View style={styles.imageOverlayControls}>
                    <TouchableOpacity
                      style={styles.changeImageBtn}
                      activeOpacity={0.8}
                      onPress={handlePickImage}
                      disabled={uploadingImage}>
                      <MaterialCommunityIcons name="image-edit-outline" size={16} color="#FFFFFF" />
                      <Text style={styles.changeImageText}>
                        {uploadingImage ? 'Đang tải...' : 'Đổi ảnh khác'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.removeImageBtn}
                      activeOpacity={0.8}
                      onPress={() => setFormImageUrl('')}
                      disabled={uploadingImage}>
                      <MaterialCommunityIcons name="trash-can-outline" size={16} color="#FFFFFF" />
                      <Text style={styles.changeImageText}>Xóa</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.uploadSuccessBadge}>
                    <MaterialCommunityIcons name="check-circle" size={12} color="#16A34A" />
                    <Text style={styles.uploadSuccessText}>Đã tải ảnh lên máy chủ</Text>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.uploadDropzone}
                  activeOpacity={0.7}
                  onPress={handlePickImage}
                  disabled={uploadingImage}>
                  {uploadingImage ? (
                    <View style={styles.uploadingContainer}>
                      <ActivityIndicator size="small" color={MedicalColors.primary} />
                      <Text style={styles.uploadingText}>Đang tải ảnh lên máy chủ...</Text>
                    </View>
                  ) : (
                    <>
                      <View style={styles.uploadIconCircle}>
                        <MaterialCommunityIcons name="cloud-upload" size={26} color="#0284C7" />
                      </View>
                      <Text style={styles.uploadPrimaryText}>Bấm để chọn và tải tệp ảnh lên</Text>
                      <Text style={styles.uploadSecondaryText}>
                        Hỗ trợ định dạng JPG, PNG, WEBP (Tối đa 10MB)
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              )}

              <Text style={styles.formLabel}>Giới thiệu / Cơ sở vật chất</Text>
              <TextInput
                style={[styles.formInput, { height: 70, textAlignVertical: 'top' }]}
                placeholder="Mô tả trang thiết bị, các chuyên khoa hàng đầu..."
                value={formDescription}
                onChangeText={setFormDescription}
                multiline
              />

              <Text style={styles.formLabel}>Trạng thái hoạt động</Text>
              <View style={styles.statusChoiceRow}>
                <TouchableOpacity
                  style={[
                    styles.statusChoiceBtn,
                    formStatus === 'ACTIVE' && styles.statusChoiceActive,
                  ]}
                  onPress={() => setFormStatus('ACTIVE')}>
                  <MaterialCommunityIcons
                    name="check-circle"
                    size={16}
                    color={formStatus === 'ACTIVE' ? '#16A34A' : '#64748B'}
                  />
                  <Text
                    style={[
                      styles.statusChoiceText,
                      formStatus === 'ACTIVE' && styles.statusChoiceTextActive,
                    ]}>
                    Đang hoạt động
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.statusChoiceBtn,
                    formStatus === 'INACTIVE' && styles.statusChoiceInactive,
                  ]}
                  onPress={() => setFormStatus('INACTIVE')}>
                  <MaterialCommunityIcons
                    name="pause-circle"
                    size={16}
                    color={formStatus === 'INACTIVE' ? '#DC2626' : '#64748B'}
                  />
                  <Text
                    style={[
                      styles.statusChoiceText,
                      formStatus === 'INACTIVE' && styles.statusChoiceTextInactive,
                    ]}>
                    Tạm ngưng
                  </Text>
                </TouchableOpacity>
              </View>

              {formError ? <Text style={styles.errorText}>⚠️ {formError}</Text> : null}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelBtn} onPress={closeModal}>
                <Text style={styles.cancelBtnText}>Hủy</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.submitBtn, formSubmitting && styles.submitBtnDisabled]}
                onPress={handleSubmitForm}
                disabled={formSubmitting}>
                {formSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitBtnText}>
                    {modalType === 'CREATE' ? 'Lưu thông tin' : 'Cập nhật thông tin'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal: View Detail */}
      <Modal
        visible={modalType === 'DETAIL'}
        animationType="fade"
        transparent={true}
        onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.detailBox}>
            {selectedHospital ? (
              <ScrollView>
                <Image
                  source={{
                    uri:
                      selectedHospital.image_url ||
                      'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=600',
                  }}
                  style={styles.detailImage}
                />

                <View style={styles.detailBody}>
                  <View style={styles.statusRow}>
                    <View
                      style={[
                        styles.statusBadge,
                        selectedHospital.status === 'ACTIVE'
                          ? styles.statusBadgeActive
                          : styles.statusBadgeInactive,
                      ]}>
                      <View
                        style={[
                          styles.statusDot,
                          {
                            backgroundColor:
                              selectedHospital.status === 'ACTIVE'
                                ? '#16A34A'
                                : '#DC2626',
                          },
                        ]}
                      />
                      <Text
                        style={[
                          styles.statusBadgeText,
                          {
                            color:
                              selectedHospital.status === 'ACTIVE'
                                ? '#15803D'
                                : '#DC2626',
                          },
                        ]}>
                        {selectedHospital.status === 'ACTIVE'
                          ? 'Đang hoạt động'
                          : 'Tạm ngưng'}
                      </Text>
                    </View>
                    <Text style={styles.detailId}>Mã cơ sở: #{selectedHospital.id}</Text>
                  </View>

                  <Text style={styles.detailTitle}>{selectedHospital.name}</Text>
                  <Text style={styles.detailAddress}>📍 {selectedHospital.address}</Text>

                  <Divider style={{ marginVertical: 10 }} />

                  <Text style={styles.detailSectionTitle}>Thông tin liên hệ</Text>
                  <Text style={styles.detailContactText}>
                    📞 Hotline: {selectedHospital.phone || 'Chưa cập nhật'}
                  </Text>
                  <Text style={styles.detailContactText}>
                    ✉️ Email: {selectedHospital.email || 'Chưa cập nhật'}
                  </Text>
                  <Text style={styles.detailContactText}>
                    🏙️ Khu vực: {selectedHospital.district || ''}, {selectedHospital.province || ''}
                  </Text>

                  <Divider style={{ marginVertical: 10 }} />

                  <Text style={styles.detailSectionTitle}>Giới thiệu & Cơ sở vật chất</Text>
                  <Text style={styles.detailDesc}>
                    {selectedHospital.description ||
                      'Chưa có thông tin mô tả chi tiết cho cơ sở y tế này.'}
                  </Text>

                  <Divider style={{ marginVertical: 10 }} />

                  <Text style={styles.detailMeta}>
                    🕒 Ngày tạo: {selectedHospital.created_at}
                  </Text>
                  <Text style={styles.detailMeta}>
                    🔄 Cập nhật: {selectedHospital.updated_at}
                  </Text>
                </View>
              </ScrollView>
            ) : null}

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.actionBtnEditFull}
                onPress={() => {
                  if (selectedHospital) openEditModal(selectedHospital);
                }}>
                <Text style={styles.actionBtnEditText}>✏️ Chỉnh sửa</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.closeBtn} onPress={closeModal}>
                <Text style={styles.closeBtnText}>Đóng</Text>
              </TouchableOpacity>
            </View>
          </View>
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
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.two,
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  pageSub: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
    marginTop: 2,
  },
  addBtn: {
    backgroundColor: MedicalColors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: Spacing.three,
    marginBottom: Spacing.two,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    fontSize: 13,
    color: '#0F172A',
  },
  filterSection: {
    marginBottom: Spacing.two,
  },
  tabsRow: {
    paddingHorizontal: Spacing.three,
    flexDirection: 'row',
    gap: 8,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  filterPillActive: {
    backgroundColor: '#E0F2FE',
    borderColor: '#0284C7',
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  filterPillTextActive: {
    color: '#0284C7',
    fontWeight: '700',
  },
  filterDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  listContent: {
    paddingHorizontal: Spacing.three,
    paddingBottom: 110,
    gap: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardHeader: {
    flexDirection: 'row',
    gap: 10,
  },
  hospitalImage: {
    width: 76,
    height: 76,
    borderRadius: 10,
    backgroundColor: '#E2E8F0',
  },
  headerInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusBadgeActive: {
    backgroundColor: '#DCFCE7',
  },
  statusBadgeInactive: {
    backgroundColor: '#FEE2E2',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 14,
  },
  doctorCountTag: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  provinceTag: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  hospitalName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  hospitalAddress: {
    fontSize: 12,
    color: '#475569',
  },
  cardContactRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  contactItemBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  contactItemText: {
    fontSize: 11,
    color: '#475569',
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  actionBtnDetail: {
    flex: 1,
    height: 34,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 8,
  },
  actionBtnDetailText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284C7',
  },
  actionBtnEdit: {
    flex: 1,
    height: 34,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
  },
  actionBtnEditText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  actionBtnToggle: {
    flex: 1.1,
    height: 34,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  actionBtnToggleActive: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  actionBtnToggleDeactive: {
    backgroundColor: '#F8FAFC',
    borderColor: '#CBD5E1',
  },
  actionBtnToggleText: {
    fontSize: 12,
    fontWeight: '700',
  },
  actionBtnDelete: {
    width: 34,
    height: 34,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 13,
    color: '#64748B',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: Spacing.five,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 8,
  },
  emptySub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: Spacing.three,
  },
  modalBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    maxHeight: '90%',
    padding: Spacing.three,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 10,
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: MedicalColors.primaryDark,
  },
  formScroll: {
    maxHeight: 400,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 8,
    marginBottom: 4,
  },
  formInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    fontSize: 13,
    color: '#0F172A',
  },
  formRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statusChoiceRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  statusChoiceBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F1F5F9',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  statusChoiceActive: {
    backgroundColor: '#DCFCE7',
    borderColor: '#16A34A',
  },
  statusChoiceInactive: {
    backgroundColor: '#FEE2E2',
    borderColor: '#DC2626',
  },
  statusChoiceText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  statusChoiceTextActive: {
    color: '#16A34A',
    fontWeight: '800',
  },
  statusChoiceTextInactive: {
    color: '#DC2626',
    fontWeight: '800',
  },
  errorText: {
    fontSize: 12,
    color: MedicalColors.danger,
    marginTop: 8,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 10,
    marginTop: 10,
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  submitBtn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
    backgroundColor: MedicalColors.primary,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // Detail Modal styles
  detailBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    maxHeight: '85%',
    overflow: 'hidden',
  },
  detailImage: {
    width: '100%',
    height: 180,
    backgroundColor: '#E2E8F0',
  },
  detailBody: {
    padding: Spacing.three,
  },
  detailId: {
    fontSize: 11,
    color: '#94A3B8',
    marginLeft: 'auto',
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 6,
  },
  detailAddress: {
    fontSize: 13,
    color: '#475569',
    marginTop: 4,
  },
  detailSectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: MedicalColors.primaryDark,
    marginBottom: 4,
  },
  detailContactText: {
    fontSize: 13,
    color: '#1E293B',
    marginVertical: 2,
  },
  detailDesc: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
  },
  detailMeta: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  actionBtnEditFull: {
    flex: 1,
    backgroundColor: '#FEF3C7',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeBtn: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  closeBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },

  // Image Upload & Preview styles
  imagePreviewBox: {
    height: 140,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#0F172A',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageOverlayControls: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    gap: 8,
  },
  changeImageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  removeImageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(220, 38, 38, 0.85)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  changeImageText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  uploadSuccessBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  uploadSuccessText: {
    color: '#16A34A',
    fontSize: 10,
    fontWeight: '700',
  },
  uploadDropzone: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#0284C7',
    borderRadius: 10,
    backgroundColor: '#F0F9FF',
    paddingVertical: 18,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  uploadIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  uploadPrimaryText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0284C7',
    marginBottom: 2,
  },
  uploadSecondaryText: {
    fontSize: 11,
    color: '#64748B',
  },
  uploadingContainer: {
    paddingVertical: 12,
    alignItems: 'center',
    gap: 8,
  },
  uploadingText: {
    fontSize: 12,
    color: '#0284C7',
    fontWeight: '600',
  },
});

