import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { doctorService } from '../../services/doctor-service';
import { DoctorAvatar } from './data-images';

const weekDayNames = {
  1: 'Thứ Hai',
  2: 'Thứ Ba',
  3: 'Thứ Tư',
  4: 'Thứ Năm',
  5: 'Thứ Sáu',
  6: 'Thứ Bảy',
  7: 'Chủ nhật',
};

export function DoctorDetailView({ doctorId, onBack, onNavigateToHospitalDetail }) {
  const [doctor, setDoctor] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadCount, setReloadCount] = useState(0);
  const [isAboutExpanded, setIsAboutExpanded] = useState(false);
  const openContactLink = (url) => {
    Linking.openURL(url).catch(() => {
      Alert.alert('Không thể mở ứng dụng liên hệ', 'Vui lòng thử lại trên thiết bị có ứng dụng phù hợp.');
    });
  };

  useEffect(() => {
    let isMounted = true;
    doctorService
      .getDoctorById(doctorId)
      .then((data) => {
        if (!isMounted) return;
        setDoctor(data);
        setError('');
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || 'Không thể tải hồ sơ bác sĩ.');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [doctorId, reloadCount]);

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0058BE" />
        <Text style={styles.loadingText}>Đang tải hồ sơ bác sĩ...</Text>
      </View>
    );
  }

  if (!doctor) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>
          {error || 'Không tìm thấy thông tin bác sĩ.'}
        </Text>
        {!!error && (
          <TouchableOpacity
            style={styles.backBtnFallback}
            onPress={() => {
              setIsLoading(true);
              setReloadCount((count) => count + 1);
            }}>
            <Text style={styles.backBtnText}>Thử lại</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.backBtnFallback} onPress={onBack}>
          <Text style={styles.backBtnText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.screenWrapper}>
      {/* 1. Header Toolbar */}
      <View style={styles.topToolbar}>
        <TouchableOpacity style={styles.roundBackBtn} onPress={onBack} activeOpacity={0.7}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#121C2A" />
        </TouchableOpacity>
        <Text style={styles.toolbarTitle}>Doctor Detail</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* 2. Hero Doctor Header Profile */}
        <View style={styles.heroSection}>
          <View style={styles.heroRow}>
            <DoctorAvatar uri={doctor.avatar} style={styles.heroAvatar} iconSize={42} />

            {/* Main Info */}
            <View style={styles.heroInfo}>
              {!!doctor.status && (
                <View style={styles.statusPill}>
                  <View
                    style={[
                      styles.statusGreenDot,
                      doctor.status !== 'ACTIVE' && styles.statusInactiveDot,
                    ]}
                  />
                  <Text style={styles.statusPillText}>
                    {doctor.status === 'ACTIVE' ? 'Đang hoạt động' : 'Tạm ngưng'}
                  </Text>
                </View>
              )}
              {!!doctor.qualification && (
                <Text style={styles.qualificationText}>{doctor.qualification}</Text>
              )}
              <Text style={styles.doctorNameText}>{doctor.full_name}</Text>
              {!!doctor.specialty && (
                <Text style={styles.specialtyHighlight}>{doctor.specialty}</Text>
              )}
              {doctor.experience_years !== null && doctor.experience_years !== undefined && (
                <Text style={styles.expHighlight}>{doctor.experience_years} năm kinh nghiệm</Text>
              )}
              {!!doctor.hospital_name && (
                <View style={styles.hospitalRow}>
                  <MaterialCommunityIcons name="hospital-building" size={14} color="#64748B" />
                  <Text style={styles.hospitalNameSnippet} numberOfLines={1}>
                    {doctor.hospital_name}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {!!doctor.hospitals?.length && (
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionHeading}>Địa điểm khám</Text>
            {doctor.hospitals.map((hospital) => (
              <TouchableOpacity
                key={hospital.hospital_id}
                style={styles.locationCard}
                onPress={() =>
                  onNavigateToHospitalDetail &&
                  onNavigateToHospitalDetail(hospital.hospital_id)
                }
                activeOpacity={0.85}>
                <View style={styles.domainIconCircle}>
                  <MaterialCommunityIcons name="domain" size={20} color="#0058BE" />
                </View>
                <View style={styles.locationDetails}>
                  <Text style={styles.locationHospName}>{hospital.hospital_name}</Text>
                  {!!hospital.hospital_address && (
                    <Text style={styles.locationAddressText}>
                      {hospital.hospital_address}
                    </Text>
                  )}
                  {!!hospital.room_number && (
                    <View style={styles.roomTag}>
                      <Text style={styles.roomTagText}>{hospital.room_number}</Text>
                    </View>
                  )}
                  {hospital.consultation_fee !== null &&
                    hospital.consultation_fee !== undefined && (
                      <Text style={styles.locationAddressText}>
                        Phí khám: {new Intl.NumberFormat('vi-VN').format(hospital.consultation_fee)} đ
                      </Text>
                    )}
                  {!!hospital.schedules?.length && (
                    <Text style={styles.locationAddressText}>
                      {hospital.schedules
                        .map(
                          (schedule) =>
                            `${weekDayNames[schedule.day_of_week] || `Thứ ${schedule.day_of_week}`}: ${String(schedule.start_time).slice(0, 5)}–${String(schedule.end_time).slice(0, 5)}`
                        )
                        .join('\n')}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* 5. Chuyên khoa Tags */}
        {!!doctor.specialties?.length && (
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionHeading}>Chuyên khoa</Text>
            <View style={styles.chipWrap}>
              {doctor.specialties.map((spec) => (
                <View key={spec} style={styles.chipItem}>
                  <Text style={styles.chipItemText}>{spec}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 6. Giới thiệu bác sĩ */}
        {!!doctor.biography?.trim() && (
          <View style={styles.sectionBlock}>
            <View style={styles.whiteCard}>
              <Text style={styles.cardHeaderTitle}>Giới thiệu bác sĩ</Text>
              <Text
                style={styles.biographyText}
                numberOfLines={isAboutExpanded ? undefined : 3}>
                {doctor.biography}
              </Text>
              <TouchableOpacity
                style={styles.toggleAboutBtn}
                onPress={() => setIsAboutExpanded(!isAboutExpanded)}
                activeOpacity={0.7}>
                <Text style={styles.toggleAboutText}>
                  {isAboutExpanded ? 'Thu gọn' : 'Xem thêm'}
                </Text>
                <MaterialCommunityIcons
                  name={isAboutExpanded ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color="#0058BE"
                />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {!!(doctor.phone || doctor.email) && (
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionHeading}>Liên hệ</Text>
            <View style={styles.whiteCard}>
              {!!doctor.phone && (
                <TouchableOpacity
                  style={styles.contactRow}
                  onPress={() => openContactLink(`tel:${doctor.phone}`)}>
                  <MaterialCommunityIcons name="phone-outline" size={18} color="#0058BE" />
                  <Text style={styles.contactText}>{doctor.phone}</Text>
                </TouchableOpacity>
              )}
              {!!doctor.email && (
                <TouchableOpacity
                  style={styles.contactRow}
                  onPress={() => openContactLink(`mailto:${doctor.email}`)}>
                  <MaterialCommunityIcons name="email-outline" size={18} color="#0058BE" />
                  <Text style={styles.contactText}>{doctor.email}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        <View style={{ height: 80 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screenWrapper: {
    flex: 1,
    backgroundColor: '#F8F9FF',
  },
  topToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  roundBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolbarTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#121C2A',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  heroSection: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2F6',
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  avatarContainer: {
    position: 'relative',
    width: 86,
    height: 86,
  },
  heroAvatar: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: '#E2E8F0',
  },
  verifiedIconBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  heroInfo: {
    flex: 1,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6EEFF',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    alignSelf: 'flex-start',
    marginBottom: 4,
    gap: 6,
  },
  statusGreenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  statusInactiveDot: {
    backgroundColor: '#94A3B8',
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0058BE',
  },
  qualificationText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  doctorNameText: {
    fontSize: 19,
    fontWeight: '800',
    color: '#121C2A',
    lineHeight: 24,
    marginTop: 1,
  },
  specialtyExpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  specialtyHighlight: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0058BE',
  },
  dotSeparator: {
    color: '#94A3B8',
    fontSize: 12,
  },
  expHighlight: {
    fontSize: 12,
    color: '#475569',
  },
  hospitalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  hospitalNameSnippet: {
    fontSize: 12,
    color: '#64748B',
    flex: 1,
  },
  noticeCard: {
    marginHorizontal: 16,
    marginTop: 14,
    backgroundColor: '#FFFBEB',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FEF3C7',
  },
  noticeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  noticeTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#B45309',
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 3,
    gap: 6,
  },
  bulletDot: {
    fontSize: 13,
    color: '#92400E',
    lineHeight: 18,
  },
  bulletText: {
    fontSize: 12,
    color: '#92400E',
    flex: 1,
    lineHeight: 18,
  },
  sectionBlock: {
    marginTop: 18,
    paddingHorizontal: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: '#121C2A',
    marginBottom: 8,
  },
  tierBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0058BE',
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  domainIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E6EEFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationDetails: {
    flex: 1,
  },
  locationHospName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#121C2A',
  },
  locationAddressText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 16,
  },
  roomTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#EFF4FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginTop: 6,
  },
  roomTagText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '500',
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chipItem: {
    backgroundColor: '#E6EEFF',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
  },
  chipItemActive: {
    backgroundColor: '#EFF4FF',
    borderWidth: 1,
    borderColor: '#C7D8FE',
  },
  chipItemText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  chipItemTextActive: {
    color: '#0058BE',
    fontWeight: '700',
  },
  whiteCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  cardHeaderTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#121C2A',
    marginBottom: 6,
  },
  biographyText: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 20,
  },
  toggleAboutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  toggleAboutText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0058BE',
  },
  qualificationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    gap: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  qualIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E6EEFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qualTexts: {
    flex: 1,
  },
  qualTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#121C2A',
  },
  qualDesc: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 17,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  contactText: {
    flex: 1,
    color: '#334155',
    fontSize: 13,
  },
  stickyFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#EEF2F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 10,
  },
  bookMainBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0058BE',
    borderRadius: 999,
    height: 48,
    shadowColor: '#0058BE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  bookMainBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
  },
  errorText: {
    fontSize: 15,
    color: '#EF4444',
    marginBottom: 12,
  },
  backBtnFallback: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#0058BE',
    borderRadius: 8,
  },
  backBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
