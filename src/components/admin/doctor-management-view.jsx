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
import { Card, Divider } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { doctorService } from '@/services/doctor-service';
import { hospitalService } from '@/services/hospital-service';
import { uploadService } from '@/services/upload-service';
import { MedicalColors, Spacing } from '@/constants/theme';

export function DoctorManagementView({ onBackToHome, initialCreateOpen = false }) {
  const [doctors, setDoctors] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [specialtiesList, setSpecialtiesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [keyword, setKeyword] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedHospital, setSelectedHospital] = useState('ALL');
  const [selectedSpecialty, setSelectedSpecialty] = useState('Tất cả');

  // Modals
  const [modalType, setModalType] = useState(initialCreateOpen ? 'CREATE' : null); // 'CREATE' | 'EDIT' | 'DETAIL'
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  // Form states for Create / Edit
  const [formFullName, setFormFullName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formPassword, setFormPassword] = useState('123456');
  const [formAvatar, setFormAvatar] = useState('');
  const [formLicenseNumber, setFormLicenseNumber] = useState('');
  const [formQualification, setFormQualification] = useState('BS. CKII');
  const [formExperienceYears, setFormExperienceYears] = useState('5');
  const [formBiography, setFormBiography] = useState('');
  const [formHospitalId, setFormHospitalId] = useState('');
  const [formRoomNumber, setFormRoomNumber] = useState('P.101');
  const [formConsultationFee, setFormConsultationFee] = useState('250000');
  const [formSelectedSpecialties, setFormSelectedSpecialties] = useState([]);
  const [formStatus, setFormStatus] = useState('ACTIVE');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const docs = await doctorService.getDoctors({
        keyword,
        status: selectedStatus,
        hospital_id: selectedHospital,
        specialty: selectedSpecialty,
        admin: true,
      });
      setDoctors(docs);
    } catch (err) {
      console.warn('Lỗi tải danh sách bác sĩ:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [keyword, selectedStatus, selectedHospital, selectedSpecialty]);

  const loadMetadata = useCallback(async () => {
    try {
      const [hospList, specList] = await Promise.all([
        hospitalService.getHospitals(),
        doctorService.getSpecialties(),
      ]);
      setHospitals(hospList || []);
      setSpecialtiesList(specList || []);
      if (hospList?.length > 0 && !formHospitalId) {
        setFormHospitalId(String(hospList[0].id));
      }
    } catch (err) {
      console.warn('Lỗi tải metadata bác sĩ:', err);
    }
  }, [formHospitalId]);

  useEffect(() => {
    loadMetadata();
  }, [loadMetadata]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
    loadMetadata();
  };

  // KPIs
  const totalCount = doctors.length;
  const activeCount = doctors.filter((d) => d.status === 'ACTIVE').length;
  const inactiveCount = doctors.filter((d) => d.status === 'INACTIVE').length;

  const resetForm = () => {
    setFormFullName('');
    setFormEmail('');
    setFormPhone('');
    setFormPassword('123456');
    setFormAvatar('https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300');
    setFormLicenseNumber('');
    setFormQualification('BS. CKII');
    setFormExperienceYears('5');
    setFormBiography('');
    setFormHospitalId(hospitals.length > 0 ? String(hospitals[0].id) : '1');
    setFormRoomNumber('P.101');
    setFormConsultationFee('250000');
    setFormSelectedSpecialties(['Nội tổng quát']);
    setFormStatus('ACTIVE');
    setFormError('');
  };

  const openCreateModal = () => {
    resetForm();
    setSelectedDoctor(null);
    setModalType('CREATE');
  };

  const openEditModal = (doctor) => {
    setSelectedDoctor(doctor);
    setFormFullName(doctor.full_name || '');
    setFormEmail(doctor.email || '');
    setFormPhone(doctor.phone || '');
    setFormPassword('');
    setFormAvatar(doctor.avatar || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300');
    setFormLicenseNumber(doctor.license_number || '');
    setFormQualification(doctor.qualification || 'Bác sĩ');
    setFormExperienceYears(String(doctor.experience_years ?? 0));
    setFormBiography(doctor.biography || '');
    setFormHospitalId(doctor.hospital_id ? String(doctor.hospital_id) : (hospitals[0]?.id ? String(hospitals[0].id) : '1'));
    setFormRoomNumber(doctor.room_number || 'P.101');
    setFormConsultationFee(doctor.consultation_fee ? String(doctor.consultation_fee) : '200000');
    setFormSelectedSpecialties(doctor.specialties || []);
    setFormStatus(doctor.status || 'ACTIVE');
    setFormError('');
    setModalType('EDIT');
  };

  const openDetailModal = (doctor) => {
    setSelectedDoctor(doctor);
    setModalType('DETAIL');
  };

  const closeModal = () => {
    setModalType(null);
    setSelectedDoctor(null);
  };

  const toggleSpecialtySelection = (name) => {
    if (formSelectedSpecialties.includes(name)) {
      if (formSelectedSpecialties.length === 1) {
        Alert.alert('Lưu ý', 'Bác sĩ cần có ít nhất 1 chuyên khoa.');
        return;
      }
      setFormSelectedSpecialties(formSelectedSpecialties.filter((s) => s !== name));
    } else {
      setFormSelectedSpecialties([...formSelectedSpecialties, name]);
    }
  };

  const handlePickAvatar = async () => {
    try {
      if (Platform.OS === 'web') {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/jpeg,image/png,image/webp,image/gif';
        input.onchange = async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          if (file.size > 10 * 1024 * 1024) {
            Alert.alert('Lỗi', 'Dung lượng ảnh tối đa 10MB.');
            return;
          }
          setUploadingAvatar(true);
          try {
            const url = await uploadService.uploadFile(file);
            setFormAvatar(url);
          } catch (err) {
            Alert.alert('Lỗi tải ảnh', err.message || 'Không thể tải ảnh');
          } finally {
            setUploadingAvatar(false);
          }
        };
        input.click();
        return;
      }

      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Quyền truy cập', 'Vui lòng cho phép truy cập thư viện ảnh.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setUploadingAvatar(true);
        try {
          let url = '';
          if (asset.base64) {
            url = await uploadService.uploadBase64(
              `data:${asset.mimeType || 'image/jpeg'};base64,${asset.base64}`,
              asset.fileName || 'doctor.jpg'
            );
          } else {
            const formData = new FormData();
            formData.append('file', {
              uri: asset.uri,
              name: asset.fileName || 'doctor.jpg',
              type: asset.mimeType || 'image/jpeg',
            });
            url = await uploadService.uploadFile(formData);
          }
          setFormAvatar(url);
        } catch (err) {
          Alert.alert('Lỗi tải ảnh', err.message || 'Không thể tải ảnh');
        } finally {
          setUploadingAvatar(false);
        }
      }
    } catch (err) {
      Alert.alert('Lỗi', 'Không thể chọn ảnh: ' + err.message);
    }
  };

  const handleSaveDoctor = async () => {
    if (!formFullName.trim()) {
      setFormError('Vui lòng nhập họ và tên bác sĩ.');
      return;
    }
    if (!formEmail.trim() || !formEmail.includes('@')) {
      setFormError('Vui lòng nhập địa chỉ email hợp lệ.');
      return;
    }

    setFormSubmitting(true);
    setFormError('');

    try {
      const selectedHospitalObj = hospitals.find((h) => String(h.id) === String(formHospitalId));
      const specialtyIds = specialtiesList
        .filter((s) => formSelectedSpecialties.includes(s.name))
        .map((s) => s.id);

      const payload = {
        full_name: formFullName.trim(),
        email: formEmail.trim(),
        phone: formPhone.trim(),
        avatar: formAvatar || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300',
        license_number: formLicenseNumber.trim() || `CCHN-${Date.now().toString().slice(-6)}`,
        qualification: formQualification.trim() || 'Bác sĩ',
        experience_years: Number(formExperienceYears) || 0,
        biography: formBiography.trim(),
        hospital_id: formHospitalId ? Number(formHospitalId) : null,
        hospital_name: selectedHospitalObj?.name || 'Bệnh viện',
        room_number: formRoomNumber.trim() || 'P.101',
        consultation_fee: Number(formConsultationFee) || 200000,
        specialty_names: formSelectedSpecialties,
        specialty_ids: specialtyIds,
        status: formStatus,
      };

      if (modalType === 'CREATE') {
        payload.password = formPassword || '123456';
        await doctorService.createDoctor(payload);
        Alert.alert('Thành công', 'Đã thêm mới hồ sơ bác sĩ thành công!');
      } else if (modalType === 'EDIT' && selectedDoctor) {
        await doctorService.updateDoctor(selectedDoctor.id, payload);
        Alert.alert('Thành công', 'Đã cập nhật hồ sơ bác sĩ thành công!');
      }

      closeModal();
      loadData();
    } catch (err) {
      setFormError(err.message || 'Không thể lưu hồ sơ bác sĩ.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleToggleStatus = (doctor) => {
    const nextStatus = doctor.status === 'ACTIVE' ? 'Tạm ngưng (INACTIVE)' : 'Hoạt động (ACTIVE)';
    Alert.alert(
      'Xác nhận đổi trạng thái',
      `Bạn có chắc chắn muốn chuyển trạng thái bác sĩ "${doctor.full_name}" sang "${nextStatus}"?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đồng ý',
          onPress: async () => {
            try {
              await doctorService.toggleDoctorStatus(doctor.id);
              Alert.alert('Thành công', `Đã cập nhật trạng thái bác sĩ sang ${nextStatus}.`);
              loadData();
              if (selectedDoctor && selectedDoctor.id === doctor.id) {
                closeModal();
              }
            } catch (err) {
              Alert.alert('Lỗi', err.message || 'Không thể đổi trạng thái.');
            }
          },
        },
      ]
    );
  };

  const handleDeleteDoctor = (doctor) => {
    Alert.alert(
      'Xác nhận xóa bác sĩ',
      `Bạn có chắc chắn muốn xóa bác sĩ "${doctor.full_name}" khỏi hệ thống?\nLưu ý: Không thể hoàn tác hành động này.`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa vĩnh viễn',
          style: 'destructive',
          onPress: async () => {
            try {
              await doctorService.deleteDoctor(doctor.id);
              Alert.alert('Thành công', 'Đã xóa bác sĩ khỏi hệ thống.');
              loadData();
              if (selectedDoctor && selectedDoctor.id === doctor.id) {
                closeModal();
              }
            } catch (err) {
              Alert.alert('Không thể xóa', err.message || 'Lỗi khi xóa bác sĩ.');
            }
          },
        },
      ]
    );
  };

  const formatVND = (num) => {
    if (num === null || num === undefined) return '200.000 đ';
    return Number(num).toLocaleString('vi-VN') + ' đ';
  };

  return (
    <View style={styles.container}>
      {/* 1. Top Header */}
      <View style={styles.topHeader}>
        <View style={styles.headerLeftRow}>
          {onBackToHome && (
            <TouchableOpacity style={styles.backButton} onPress={onBackToHome}>
              <MaterialCommunityIcons name="arrow-left" size={24} color="#1E293B" />
            </TouchableOpacity>
          )}
          <View>
            <Text style={styles.headerTitle}>QUẢN LÝ BÁC SĨ</Text>
            <Text style={styles.headerSubTitle}>Hồ sơ chuyên môn, phòng khám & ca trực</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.addDoctorBtn} activeOpacity={0.8} onPress={openCreateModal}>
          <MaterialCommunityIcons name="account-plus" size={18} color="#FFFFFF" />
          <Text style={styles.addDoctorBtnText}>Thêm bác sĩ</Text>
        </TouchableOpacity>
      </View>

      {/* 2. KPI Summary Bar */}
      <View style={styles.kpiRow}>
        <View style={styles.kpiCard}>
          <View style={[styles.kpiIconBox, { backgroundColor: '#E0F2FE' }]}>
            <MaterialCommunityIcons name="doctor" size={20} color="#0284C7" />
          </View>
          <View>
            <Text style={styles.kpiValue}>{totalCount}</Text>
            <Text style={styles.kpiLabel}>Tổng số</Text>
          </View>
        </View>

        <View style={styles.kpiCard}>
          <View style={[styles.kpiIconBox, { backgroundColor: '#DCFCE7' }]}>
            <MaterialCommunityIcons name="check-circle-outline" size={20} color="#16A34A" />
          </View>
          <View>
            <Text style={[styles.kpiValue, { color: '#16A34A' }]}>{activeCount}</Text>
            <Text style={styles.kpiLabel}>Hoạt động</Text>
          </View>
        </View>

        <View style={styles.kpiCard}>
          <View style={[styles.kpiIconBox, { backgroundColor: '#FEE2E2' }]}>
            <MaterialCommunityIcons name="pause-circle-outline" size={20} color="#DC2626" />
          </View>
          <View>
            <Text style={[styles.kpiValue, { color: '#DC2626' }]}>{inactiveCount}</Text>
            <Text style={styles.kpiLabel}>Tạm ngưng</Text>
          </View>
        </View>
      </View>

      {/* 3. Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchBox}>
          <MaterialCommunityIcons name="magnify" size={20} color="#64748B" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm theo tên bác sĩ, học vị, CCHN, bệnh viện..."
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
      </View>

      {/* 4. Filter Pills */}
      <View style={styles.filterSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterPillsRow}>
          <TouchableOpacity
            style={[styles.filterPill, selectedStatus === 'ALL' && styles.filterPillActive]}
            onPress={() => setSelectedStatus('ALL')}>
            <Text style={[styles.filterPillText, selectedStatus === 'ALL' && styles.filterPillTextActive]}>
              Tất cả ({totalCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterPill, selectedStatus === 'ACTIVE' && styles.filterPillActive]}
            onPress={() => setSelectedStatus('ACTIVE')}>
            <View style={[styles.filterDot, { backgroundColor: '#16A34A' }]} />
            <Text style={[styles.filterPillText, selectedStatus === 'ACTIVE' && styles.filterPillTextActive]}>
              Hoạt động ({activeCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterPill, selectedStatus === 'INACTIVE' && styles.filterPillActive]}
            onPress={() => setSelectedStatus('INACTIVE')}>
            <View style={[styles.filterDot, { backgroundColor: '#DC2626' }]} />
            <Text style={[styles.filterPillText, selectedStatus === 'INACTIVE' && styles.filterPillTextActive]}>
              Tạm ngưng ({inactiveCount})
            </Text>
          </TouchableOpacity>

          {/* Specialties Filter */}
          {specialtiesList.map((spec) => {
            const isSelected = selectedSpecialty === spec.name;
            return (
              <TouchableOpacity
                key={spec.id}
                style={[styles.filterPill, isSelected && styles.filterPillActive]}
                onPress={() => setSelectedSpecialty(isSelected ? 'Tất cả' : spec.name)}>
                <Text style={[styles.filterPillText, isSelected && styles.filterPillTextActive]}>
                  {spec.name}
                </Text>
              </TouchableOpacity>
            );
          })}

          {/* Hospitals Filter */}
          {hospitals.map((hosp) => {
            const isSelected = String(selectedHospital) === String(hosp.id);
            return (
              <TouchableOpacity
                key={hosp.id}
                style={[styles.filterPill, isSelected && styles.filterPillActive]}
                onPress={() => setSelectedHospital(isSelected ? 'ALL' : String(hosp.id))}>
                <MaterialCommunityIcons
                  name="hospital-building"
                  size={14}
                  color={isSelected ? '#0284C7' : '#64748B'}
                />
                <Text
                  style={[
                    styles.filterPillText,
                    { marginLeft: 4 },
                    isSelected && styles.filterPillTextActive,
                  ]}>
                  {hosp.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* 5. Doctor List */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={MedicalColors.primary} />
          <Text style={styles.loadingText}>Đang tải danh sách bác sĩ...</Text>
        </View>
      ) : (
        <FlatList
          data={doctors}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[MedicalColors.primary]} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="doctor" size={56} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>Không tìm thấy bác sĩ nào</Text>
              <Text style={styles.emptySub}>Thử thay đổi từ khóa tìm kiếm hoặc bấm Thêm bác sĩ mới.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity activeOpacity={0.88} onPress={() => openDetailModal(item)}>
              <Card style={styles.doctorCard} mode="elevated">
                <Card.Content style={styles.doctorCardContent}>
                  {/* Top Doctor Row: Avatar, Name, Status */}
                  <View style={styles.cardHeaderRow}>
                    <Image
                      source={{
                        uri: item.avatar || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300',
                      }}
                      style={styles.doctorAvatar}
                    />

                    <View style={styles.doctorHeaderInfo}>
                      <View style={styles.nameRow}>
                        <Text style={styles.doctorName} numberOfLines={1}>
                          {item.full_name}
                        </Text>
                        <View
                          style={[
                            styles.statusBadge,
                            item.status === 'ACTIVE' ? styles.statusBadgeActive : styles.statusBadgeInactive,
                          ]}>
                          <View
                            style={[
                              styles.statusDot,
                              { backgroundColor: item.status === 'ACTIVE' ? '#16A34A' : '#DC2626' },
                            ]}
                          />
                          <Text
                            style={[
                              styles.statusBadgeText,
                              { color: item.status === 'ACTIVE' ? '#15803D' : '#DC2626' },
                            ]}>
                            {item.status === 'ACTIVE' ? 'Hoạt động' : 'Tạm ngưng'}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.qualificationRow}>
                        <View style={styles.qualificationBadge}>
                          <Text style={styles.qualificationBadgeText}>{item.qualification || 'Bác sĩ'}</Text>
                        </View>
                        <Text style={styles.experienceText}>
                          🩺 {item.experience_years ? `${item.experience_years} năm KN` : 'Bác sĩ trẻ'}
                        </Text>
                      </View>

                      <Text style={styles.licenseText}>
                        Số CCHN: <Text style={styles.licenseValue}>{item.license_number || 'Chưa cập nhật'}</Text>
                      </Text>
                    </View>
                  </View>

                  <Divider style={styles.cardDivider} />

                  {/* Specialties & Hospital Affiliation */}
                  <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                      <MaterialCommunityIcons name="hospital-building" size={16} color="#0284C7" />
                      <Text style={styles.metaText} numberOfLines={1}>
                        {item.hospital_name || 'Bệnh viện'} {item.room_number ? `(${item.room_number})` : ''}
                      </Text>
                    </View>

                    <View style={styles.feeBadge}>
                      <Text style={styles.feeBadgeText}>{formatVND(item.consultation_fee)}</Text>
                    </View>
                  </View>

                  {/* Specialties Tags */}
                  {item.specialties && item.specialties.length > 0 && (
                    <View style={styles.specialtiesTagRow}>
                      {item.specialties.map((spec, i) => (
                        <View key={i} style={styles.specChip}>
                          <Text style={styles.specChipText}>{spec}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Action Buttons Row */}
                  <View style={styles.cardActionRow}>
                    <TouchableOpacity
                      style={styles.detailBtn}
                      activeOpacity={0.7}
                      onPress={() => openDetailModal(item)}>
                      <MaterialCommunityIcons name="eye-outline" size={16} color="#0284C7" />
                      <Text style={styles.detailBtnText}>Chi tiết</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.editBtn}
                      activeOpacity={0.7}
                      onPress={() => openEditModal(item)}>
                      <MaterialCommunityIcons name="pencil-outline" size={16} color="#D97706" />
                      <Text style={styles.editBtnText}>Sửa</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.toggleBtn,
                        item.status === 'ACTIVE' ? styles.toggleBtnPause : styles.toggleBtnActive,
                      ]}
                      activeOpacity={0.7}
                      onPress={() => handleToggleStatus(item)}>
                      <MaterialCommunityIcons
                        name={item.status === 'ACTIVE' ? 'pause-circle-outline' : 'play-circle-outline'}
                        size={16}
                        color={item.status === 'ACTIVE' ? '#64748B' : '#16A34A'}
                      />
                      <Text
                        style={[
                          styles.toggleBtnText,
                          { color: item.status === 'ACTIVE' ? '#475569' : '#16A34A' },
                        ]}>
                        {item.status === 'ACTIVE' ? 'Tạm ngưng' : 'Mở lại'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.deleteBtn}
                      activeOpacity={0.7}
                      onPress={() => handleDeleteDoctor(item)}>
                      <MaterialCommunityIcons name="trash-can-outline" size={16} color="#DC2626" />
                    </TouchableOpacity>
                  </View>
                </Card.Content>
              </Card>
            </TouchableOpacity>
          )}
        />
      )}

      {/* =========================================================================
          MODAL: CREATE / EDIT DOCTOR
      ========================================================================= */}
      <Modal
        visible={modalType === 'CREATE' || modalType === 'EDIT'}
        animationType="slide"
        transparent={true}
        onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.formModalContainer}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>
                  {modalType === 'CREATE' ? 'Thêm mới bác sĩ' : 'Chỉnh sửa bác sĩ'}
                </Text>
                <Text style={styles.modalSubTitle}>
                  {modalType === 'CREATE'
                    ? 'Tạo tài khoản và hồ sơ bác sĩ trên YouMed Care'
                    : `Cập nhật thông tin: ${selectedDoctor?.full_name}`}
                </Text>
              </View>
              <TouchableOpacity style={styles.closeModalBtn} onPress={closeModal}>
                <MaterialCommunityIcons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
              {formError ? (
                <View style={styles.errorAlert}>
                  <MaterialCommunityIcons name="alert-circle" size={18} color="#DC2626" />
                  <Text style={styles.errorAlertText}>{formError}</Text>
                </View>
              ) : null}

              {/* Avatar picker */}
              <View style={styles.avatarSection}>
                <TouchableOpacity
                  style={styles.avatarPickerButton}
                  activeOpacity={0.8}
                  onPress={handlePickAvatar}
                  disabled={uploadingAvatar}>
                  <Image source={{ uri: formAvatar }} style={styles.formAvatarImg} />
                  <View style={styles.avatarEditOverlay}>
                    {uploadingAvatar ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <MaterialCommunityIcons name="camera" size={18} color="#FFFFFF" />
                    )}
                  </View>
                </TouchableOpacity>
                <Text style={styles.avatarNoteText}>Chạm vào ảnh để thay đổi hình đại diện</Text>
              </View>

              {/* 1. Account Info */}
              <Text style={styles.formSectionHeader}>THÔNG TIN TÀI KHOẢN & ĐỊNH DANH</Text>

              <Text style={styles.inputLabel}>
                Họ và tên bác sĩ <Text style={{ color: '#DC2626' }}>*</Text>
              </Text>
              <TextInput
                style={styles.textInput}
                placeholder="Ví dụ: BS. CKII Lê Hoàng Giang"
                value={formFullName}
                onChangeText={setFormFullName}
              />

              <View style={styles.twoColumnRow}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.inputLabel}>
                    Email đăng nhập <Text style={{ color: '#DC2626' }}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="doctor@youmed.vn"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={formEmail}
                    onChangeText={setFormEmail}
                    editable={modalType === 'CREATE'}
                  />
                </View>

                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.inputLabel}>Số điện thoại liên hệ</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="0912345678"
                    keyboardType="phone-pad"
                    value={formPhone}
                    onChangeText={setFormPhone}
                  />
                </View>
              </View>

              {modalType === 'CREATE' && (
                <>
                  <Text style={styles.inputLabel}>Mật khẩu khởi tạo</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="123456"
                    secureTextEntry
                    value={formPassword}
                    onChangeText={setFormPassword}
                  />
                </>
              )}

              {/* 2. Professional Profile */}
              <Text style={[styles.formSectionHeader, { marginTop: 18 }]}>HỒ SƠ CHUYÊN MÔN</Text>

              <View style={styles.twoColumnRow}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.inputLabel}>Học vị / Học hàm</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="BS. CKII / ThS / PGS. TS"
                    value={formQualification}
                    onChangeText={setFormQualification}
                  />
                </View>

                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.inputLabel}>Số năm kinh nghiệm</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="12"
                    keyboardType="number-pad"
                    value={formExperienceYears}
                    onChangeText={setFormExperienceYears}
                  />
                </View>
              </View>

              <Text style={styles.inputLabel}>Số chứng chỉ hành nghề (CCHN)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Ví dụ: CCHN-00123-BYT"
                value={formLicenseNumber}
                onChangeText={setFormLicenseNumber}
              />

              <Text style={styles.inputLabel}>Chuyên khoa tiếp nhận</Text>
              <View style={styles.specialtySelectBox}>
                {specialtiesList.map((spec) => {
                  const isChecked = formSelectedSpecialties.includes(spec.name);
                  return (
                    <TouchableOpacity
                      key={spec.id}
                      style={[styles.specSelectChip, isChecked && styles.specSelectChipActive]}
                      onPress={() => toggleSpecialtySelection(spec.name)}>
                      <MaterialCommunityIcons
                        name={isChecked ? 'check-circle' : 'plus-circle-outline'}
                        size={16}
                        color={isChecked ? '#0284C7' : '#64748B'}
                      />
                      <Text style={[styles.specSelectChipText, isChecked && styles.specSelectChipTextActive]}>
                        {spec.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* 3. Hospital & Room */}
              <Text style={[styles.formSectionHeader, { marginTop: 18 }]}>CƠ SỞ Y TẾ & PHÒNG KHÁM</Text>

              <Text style={styles.inputLabel}>Bệnh viện trực</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hospitalPickerScroll}>
                {hospitals.map((hosp) => {
                  const isSelected = String(formHospitalId) === String(hosp.id);
                  return (
                    <TouchableOpacity
                      key={hosp.id}
                      style={[styles.hospPill, isSelected && styles.hospPillActive]}
                      onPress={() => setFormHospitalId(String(hosp.id))}>
                      <MaterialCommunityIcons
                        name="hospital-building"
                        size={16}
                        color={isSelected ? '#FFFFFF' : '#0284C7'}
                      />
                      <Text style={[styles.hospPillText, isSelected && styles.hospPillTextActive]}>
                        {hosp.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <View style={styles.twoColumnRow}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.inputLabel}>Số phòng khám</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="P.102 / P.201"
                    value={formRoomNumber}
                    onChangeText={setFormRoomNumber}
                  />
                </View>

                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.inputLabel}>Giá khám (VND)</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="250000"
                    keyboardType="number-pad"
                    value={formConsultationFee}
                    onChangeText={setFormConsultationFee}
                  />
                </View>
              </View>

              <Text style={styles.inputLabel}>Giới thiệu & Tiểu sử chuyên môn</Text>
              <TextInput
                style={[styles.textInput, { height: 75, textAlignVertical: 'top' }]}
                placeholder="Mô tả quá trình đào tạo, lĩnh vực nghiên cứu và kinh nghiệm lâm sàng..."
                multiline
                numberOfLines={3}
                value={formBiography}
                onChangeText={setFormBiography}
              />

              <Text style={styles.inputLabel}>Trạng thái hoạt động</Text>
              <View style={styles.statusSelectRow}>
                <TouchableOpacity
                  style={[styles.statusOptionBtn, formStatus === 'ACTIVE' && styles.statusOptionBtnActive]}
                  onPress={() => setFormStatus('ACTIVE')}>
                  <View style={[styles.statusDot, { backgroundColor: '#16A34A' }]} />
                  <Text style={[styles.statusOptionText, formStatus === 'ACTIVE' && styles.statusOptionTextActive]}>
                    Hoạt động
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.statusOptionBtn, formStatus === 'INACTIVE' && styles.statusOptionBtnInactive]}
                  onPress={() => setFormStatus('INACTIVE')}>
                  <View style={[styles.statusDot, { backgroundColor: '#DC2626' }]} />
                  <Text
                    style={[styles.statusOptionText, formStatus === 'INACTIVE' && styles.statusOptionTextInactive]}>
                    Tạm ngưng
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={{ height: 20 }} />
            </ScrollView>

            {/* Modal Footer */}
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelBtn} onPress={closeModal} disabled={formSubmitting}>
                <Text style={styles.cancelBtnText}>Hủy</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSaveDoctor}
                disabled={formSubmitting}>
                {formSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="content-save" size={18} color="#FFFFFF" />
                    <Text style={styles.saveBtnText}>
                      {modalType === 'CREATE' ? 'Thêm bác sĩ' : 'Lưu thay đổi'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* =========================================================================
          MODAL: DOCTOR DETAIL VIEW
      ========================================================================= */}
      <Modal
        visible={modalType === 'DETAIL' && !!selectedDoctor}
        animationType="fade"
        transparent={true}
        onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.detailModalContainer}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Hồ sơ chi tiết bác sĩ</Text>
              <TouchableOpacity style={styles.closeModalBtn} onPress={closeModal}>
                <MaterialCommunityIcons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            {selectedDoctor && (
              <ScrollView style={styles.detailScroll} showsVerticalScrollIndicator={false}>
                {/* Doctor Bio Card */}
                <View style={styles.detailBioCard}>
                  <Image
                    source={{
                      uri: selectedDoctor.avatar || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300',
                    }}
                    style={styles.detailAvatar}
                  />
                  <Text style={styles.detailDoctorName}>{selectedDoctor.full_name}</Text>
                  <Text style={styles.detailQualification}>{selectedDoctor.qualification}</Text>

                  <View
                    style={[
                      styles.statusBadge,
                      selectedDoctor.status === 'ACTIVE'
                        ? styles.statusBadgeActive
                        : styles.statusBadgeInactive,
                      { marginTop: 8 },
                    ]}>
                    <View
                      style={[
                        styles.statusDot,
                        { backgroundColor: selectedDoctor.status === 'ACTIVE' ? '#16A34A' : '#DC2626' },
                      ]}
                    />
                    <Text
                      style={[
                        styles.statusBadgeText,
                        { color: selectedDoctor.status === 'ACTIVE' ? '#15803D' : '#DC2626' },
                      ]}>
                      {selectedDoctor.status === 'ACTIVE' ? 'Đang hoạt động' : 'Tạm ngưng công tác'}
                    </Text>
                  </View>
                </View>

                {/* Details Breakdown */}
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>THÔNG TIN LIÊN HỆ & PHÁP LÝ</Text>

                  <View style={styles.detailItemRow}>
                    <MaterialCommunityIcons name="email-outline" size={18} color="#0284C7" />
                    <Text style={styles.detailItemLabel}>Email:</Text>
                    <Text style={styles.detailItemValue}>{selectedDoctor.email || 'Chưa cập nhật'}</Text>
                  </View>

                  <View style={styles.detailItemRow}>
                    <MaterialCommunityIcons name="phone-outline" size={18} color="#0284C7" />
                    <Text style={styles.detailItemLabel}>Điện thoại:</Text>
                    <Text style={styles.detailItemValue}>{selectedDoctor.phone || 'Chưa cập nhật'}</Text>
                  </View>

                  <View style={styles.detailItemRow}>
                    <MaterialCommunityIcons name="card-account-details-outline" size={18} color="#0284C7" />
                    <Text style={styles.detailItemLabel}>Số CCHN:</Text>
                    <Text style={styles.detailItemValue}>{selectedDoctor.license_number || 'Chưa cập nhật'}</Text>
                  </View>

                  <View style={styles.detailItemRow}>
                    <MaterialCommunityIcons name="clock-outline" size={18} color="#0284C7" />
                    <Text style={styles.detailItemLabel}>Kinh nghiệm:</Text>
                    <Text style={styles.detailItemValue}>{selectedDoctor.experience_years || 0} năm lâm sàng</Text>
                  </View>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>CƠ SỞ TRỰC & PHÒNG KHÁM</Text>

                  <View style={styles.detailItemRow}>
                    <MaterialCommunityIcons name="hospital-building" size={18} color="#16A34A" />
                    <Text style={styles.detailItemLabel}>Bệnh viện:</Text>
                    <Text style={styles.detailItemValue}>{selectedDoctor.hospital_name || 'Bệnh viện'}</Text>
                  </View>

                  <View style={styles.detailItemRow}>
                    <MaterialCommunityIcons name="door-open" size={18} color="#16A34A" />
                    <Text style={styles.detailItemLabel}>Phòng khám:</Text>
                    <Text style={styles.detailItemValue}>{selectedDoctor.room_number || 'P.101'}</Text>
                  </View>

                  <View style={styles.detailItemRow}>
                    <MaterialCommunityIcons name="cash-multiple" size={18} color="#16A34A" />
                    <Text style={styles.detailItemLabel}>Giá khám:</Text>
                    <Text style={[styles.detailItemValue, { color: '#0284C7', fontWeight: '800' }]}>
                      {formatVND(selectedDoctor.consultation_fee)}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>CHUYÊN KHOA TIẾP NHẬN</Text>
                  <View style={styles.specialtiesTagRow}>
                    {selectedDoctor.specialties?.map((spec, i) => (
                      <View key={i} style={[styles.specChip, { backgroundColor: '#E0F2FE' }]}>
                        <Text style={[styles.specChipText, { color: '#0369A1' }]}>{spec}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                {selectedDoctor.biography ? (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>TIỂU SỬ & QUÁ TRÌNH CÔNG TÁC</Text>
                    <Text style={styles.detailBioText}>{selectedDoctor.biography}</Text>
                  </View>
                ) : null}

                {/* Action Buttons in Detail */}
                <View style={styles.detailActionsBar}>
                  <TouchableOpacity
                    style={styles.detailEditBtn}
                    onPress={() => {
                      const doc = selectedDoctor;
                      closeModal();
                      setTimeout(() => openEditModal(doc), 150);
                    }}>
                    <MaterialCommunityIcons name="pencil" size={18} color="#FFFFFF" />
                    <Text style={styles.detailEditBtnText}>Chỉnh sửa</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.detailToggleBtn,
                      selectedDoctor.status === 'ACTIVE'
                        ? { backgroundColor: '#FEF3C7' }
                        : { backgroundColor: '#DCFCE7' },
                    ]}
                    onPress={() => handleToggleStatus(selectedDoctor)}>
                    <MaterialCommunityIcons
                      name={selectedDoctor.status === 'ACTIVE' ? 'pause-circle' : 'play-circle'}
                      size={18}
                      color={selectedDoctor.status === 'ACTIVE' ? '#D97706' : '#16A34A'}
                    />
                    <Text
                      style={[
                        styles.detailToggleBtnText,
                        { color: selectedDoctor.status === 'ACTIVE' ? '#B45309' : '#15803D' },
                      ]}>
                      {selectedDoctor.status === 'ACTIVE' ? 'Tạm ngưng' : 'Kích hoạt'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.detailDeleteBtn}
                    onPress={() => handleDeleteDoctor(selectedDoctor)}>
                    <MaterialCommunityIcons name="trash-can" size={18} color="#DC2626" />
                  </TouchableOpacity>
                </View>

                <View style={{ height: 20 }} />
              </ScrollView>
            )}
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
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.two,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 6,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 0.3,
  },
  headerSubTitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  addDoctorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MedicalColors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    elevation: 2,
  },
  addDoctorBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
    marginLeft: 6,
  },

  // KPI Row
  kpiRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.four,
    paddingVertical: 10,
    gap: 8,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  kpiIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  kpiValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#1E293B',
  },
  kpiLabel: {
    fontSize: 11,
    color: '#64748B',
  },

  // Search
  searchSection: {
    paddingHorizontal: Spacing.four,
    marginBottom: 8,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#1E293B',
  },

  // Filter Pills
  filterSection: {
    marginBottom: 10,
  },
  filterPillsRow: {
    paddingHorizontal: Spacing.four,
    gap: 6,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterPillActive: {
    backgroundColor: '#E0F2FE',
    borderColor: '#38BDF8',
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  filterPillTextActive: {
    color: '#0369A1',
    fontWeight: '800',
  },
  filterDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },

  // List
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 13,
    color: '#64748B',
  },
  listContent: {
    paddingHorizontal: Spacing.four,
    paddingBottom: 90,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#475569',
    marginTop: 12,
  },
  emptySub: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 4,
  },

  // Doctor Card
  doctorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#0F172A',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  doctorCardContent: {
    padding: 12,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  doctorAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E2E8F0',
  },
  doctorHeaderInfo: {
    flex: 1,
    marginLeft: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  doctorName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    flex: 1,
    marginRight: 6,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
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
    marginRight: 4,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  qualificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  qualificationBadge: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    marginRight: 6,
  },
  qualificationBadgeText: {
    fontSize: 11,
    color: '#0284C7',
    fontWeight: '700',
  },
  experienceText: {
    fontSize: 11,
    color: '#64748B',
  },
  licenseText: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  licenseValue: {
    color: '#475569',
    fontWeight: '600',
  },
  cardDivider: {
    marginVertical: 10,
    backgroundColor: '#F1F5F9',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  metaText: {
    fontSize: 12,
    color: '#334155',
    marginLeft: 6,
    fontWeight: '600',
  },
  feeBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  feeBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#B45309',
  },
  specialtiesTagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 8,
  },
  specChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  specChipText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },
  cardActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  detailBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E0F2FE',
    paddingVertical: 7,
    borderRadius: 8,
  },
  detailBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284C7',
    marginLeft: 4,
  },
  editBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF3C7',
    paddingVertical: 7,
    borderRadius: 8,
  },
  editBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D97706',
    marginLeft: 4,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: 8,
  },
  toggleBtnPause: {
    backgroundColor: '#F1F5F9',
  },
  toggleBtnActive: {
    backgroundColor: '#DCFCE7',
  },
  toggleBtnText: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
  deleteBtn: {
    backgroundColor: '#FEE2E2',
    padding: 7,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Form Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    padding: Spacing.three,
  },
  formModalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSubTitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  closeModalBtn: {
    padding: 6,
  },
  formScroll: {
    padding: 16,
  },
  errorAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  errorAlertText: {
    fontSize: 12,
    color: '#DC2626',
    marginLeft: 6,
    flex: 1,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarPickerButton: {
    position: 'relative',
    width: 76,
    height: 76,
    borderRadius: 38,
    overflow: 'hidden',
    backgroundColor: '#E2E8F0',
    elevation: 3,
  },
  formAvatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarEditOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 26,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarNoteText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 6,
  },
  formSectionHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0284C7',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 4,
    marginTop: 8,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0F172A',
  },
  twoColumnRow: {
    flexDirection: 'row',
  },
  specialtySelectBox: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  specSelectChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  specSelectChipActive: {
    backgroundColor: '#E0F2FE',
    borderColor: '#38BDF8',
  },
  specSelectChipText: {
    fontSize: 12,
    color: '#475569',
    marginLeft: 4,
  },
  specSelectChipTextActive: {
    color: '#0284C7',
    fontWeight: '700',
  },
  hospitalPickerScroll: {
    marginTop: 4,
    marginBottom: 4,
  },
  hospPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  hospPillActive: {
    backgroundColor: MedicalColors.primary,
    borderColor: MedicalColors.primary,
  },
  hospPillText: {
    fontSize: 12,
    color: '#334155',
    marginLeft: 6,
  },
  hospPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  statusSelectRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  statusOptionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statusOptionBtnActive: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
  },
  statusOptionBtnInactive: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
  },
  statusOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginLeft: 6,
  },
  statusOptionTextActive: {
    color: '#15803D',
    fontWeight: '800',
  },
  statusOptionTextInactive: {
    color: '#DC2626',
    fontWeight: '800',
  },
  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 10,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MedicalColors.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 6,
  },

  // Detail Modal
  detailModalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    maxHeight: '85%',
    overflow: 'hidden',
  },
  detailScroll: {
    padding: 16,
  },
  detailBioCard: {
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  detailAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E2E8F0',
  },
  detailDoctorName: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 8,
  },
  detailQualification: {
    fontSize: 13,
    color: '#0284C7',
    fontWeight: '700',
    marginTop: 2,
  },
  detailSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  detailSectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0284C7',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  detailItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailItemLabel: {
    fontSize: 12,
    color: '#64748B',
    marginLeft: 6,
    width: 90,
  },
  detailItemValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
  },
  detailBioText: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
  },
  detailActionsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  detailEditBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: MedicalColors.primary,
    paddingVertical: 10,
    borderRadius: 10,
  },
  detailEditBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
    marginLeft: 6,
  },
  detailToggleBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
  },
  detailToggleBtnText: {
    fontWeight: '700',
    fontSize: 13,
    marginLeft: 6,
  },
  detailDeleteBtn: {
    backgroundColor: '#FEE2E2',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
