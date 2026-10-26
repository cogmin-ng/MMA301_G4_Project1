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
import { hospitalService } from '../../services/hospital-service';
import { DoctorAvatar, HospitalImage } from './data-images';

const weekDayNames = {
  1: 'Thứ Hai',
  2: 'Thứ Ba',
  3: 'Thứ Tư',
  4: 'Thứ Năm',
  5: 'Thứ Sáu',
  6: 'Thứ Bảy',
  7: 'Chủ nhật',
};

const formatWorkingHours = (hours) => {
  if (Number(hours.is_closed) === 1) return `${weekDayNames[hours.day_of_week]}: Nghỉ`;
  const openTime = String(hours.open_time || '').slice(0, 5);
  const closeTime = String(hours.close_time || '').slice(0, 5);
  return openTime && closeTime
    ? `${weekDayNames[hours.day_of_week]}: ${openTime} - ${closeTime}`
    : null;
};

export function HospitalDetailView({
  hospitalId,
  onBack,
  onNavigateToDoctorDetail,
}) {
  const [hospital, setHospital] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadCount, setReloadCount] = useState(0);
  const [isIntroExpanded, setIsIntroExpanded] = useState(false);

  useEffect(() => {
    let isMounted = true;
    hospitalService
      .getHospitalById(hospitalId)
      .then((data) => {
        if (!isMounted) return;
        setHospital(data);
        setError('');
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || 'Không thể tải thông tin bệnh viện.');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [hospitalId, reloadCount]);

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0058BE" />
        <Text style={styles.loadingText}>Đang tải thông tin bệnh viện...</Text>
      </View>
    );
  }

  if (!hospital) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>
          {error || 'Không tìm thấy cơ sở y tế này.'}
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

  const openContactLink = (url) => {
    Linking.openURL(url).catch(() => {
      Alert.alert('Không thể mở ứng dụng liên hệ', 'Vui lòng thử lại trên thiết bị có ứng dụng phù hợp.');
    });
  };

  const handleCallHotline = (phone) => openContactLink(`tel:${phone}`);

  return (
    <View style={styles.screenWrapper}>
      {/* 1. Header Toolbar */}
      <View style={styles.topToolbar}>
        <TouchableOpacity style={styles.roundBackBtn} onPress={onBack} activeOpacity={0.7}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#121C2A" />
        </TouchableOpacity>
        <Text style={styles.toolbarTitle}>Hospital Detail</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* 2. Hospital Identity Header */}
        <View style={styles.identityHeader}>
          <View style={styles.identityRow}>
            <View style={styles.hospitalLogoSquare}>
              <MaterialCommunityIcons name="hospital-box" size={36} color="#0058BE" />
            </View>
            <View style={styles.identityTexts}>
              <Text style={styles.hospitalNameTitle} numberOfLines={2}>
                {hospital.name}
              </Text>
              {!!hospital.status && (
                <Text style={styles.verifiedSubText}>
                  {hospital.status === 'ACTIVE' ? 'Đang hoạt động' : 'Tạm ngưng'}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* 3. Hospital image */}
        <View style={styles.galleryBannerBox}>
          <HospitalImage
            key={hospital.id}
            hospital={hospital}
            style={styles.galleryBannerImg}
            iconSize={56}
          />
        </View>

        {/* 4. Địa chỉ */}
        {!!hospital.address && (
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionHeading}>Địa chỉ</Text>
            <View style={styles.addressCard}>
              <View style={styles.addressPinCircle}>
                <MaterialCommunityIcons name="map-marker" size={18} color="#0058BE" />
              </View>
              <Text style={styles.addressFullText}>{hospital.address}</Text>
            </View>
          </View>
        )}

        {/* 5. Chuyên khoa thế mạnh */}
        {!!hospital.specialties?.length && (
          <View style={styles.sectionBlock}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeading}>Chuyên khoa thế mạnh</Text>
              <Text style={styles.countBadge}>
                {hospital.specialties.length} chuyên khoa
              </Text>
            </View>
            <View style={styles.specialtyChipsWrap}>
              {hospital.specialties.map((spec) => (
                <View key={spec} style={styles.specialtyPill}>
                  <MaterialCommunityIcons
                    name="stethoscope"
                    size={16}
                    color="#0058BE"
                    style={{ marginRight: 6 }}
                  />
                  <Text style={styles.specialtyPillText}>{spec}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 6. Giới thiệu bệnh viện */}
        {!!hospital.description?.trim() && (
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionHeading}>Giới thiệu bệnh viện</Text>
            <View style={styles.whiteCard}>
              <Text style={styles.introParagraph} numberOfLines={isIntroExpanded ? undefined : 3}>
                {hospital.description}
              </Text>
              <TouchableOpacity
                style={styles.toggleIntroBtn}
                onPress={() => setIsIntroExpanded(!isIntroExpanded)}
                activeOpacity={0.7}>
                <Text style={styles.toggleIntroText}>
                  {isIntroExpanded ? 'Thu gọn' : 'Xem thêm'}
                </Text>
                <MaterialCommunityIcons
                  name={isIntroExpanded ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color="#0058BE"
                />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* 7. Giờ làm việc và thông tin liên hệ từ database */}
        {!!(hospital.working_hours?.length || hospital.phone || hospital.email) && (
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionHeading}>Thời gian & Liên hệ</Text>
          <View style={styles.contactCard}>
            {!!hospital.working_hours?.length && (
              <View style={styles.contactItemRow}>
                <View style={styles.contactIconBox}>
                  <MaterialCommunityIcons name="clock-outline" size={20} color="#0058BE" />
                </View>
                <View style={styles.contactItemTexts}>
                  <Text style={styles.contactItemTitle}>Giờ làm việc</Text>
                  {hospital.working_hours
                    .map(formatWorkingHours)
                    .filter(Boolean)
                    .map((hours) => (
                      <Text key={hours} style={styles.contactItemSub}>
                        {hours}
                      </Text>
                    ))}
                </View>
              </View>
            )}
            {!!hospital.phone && (
              <TouchableOpacity
                style={[styles.contactRow, !!hospital.working_hours?.length && styles.contactDivider]}
                onPress={() => handleCallHotline(hospital.phone)}>
                <MaterialCommunityIcons name="phone-outline" size={18} color="#0058BE" />
                <Text style={styles.contactText}>{hospital.phone}</Text>
                <Text style={styles.contactAction}>Gọi</Text>
              </TouchableOpacity>
            )}
            {!!hospital.email && (
              <TouchableOpacity
                style={[styles.contactRow, (hospital.phone || hospital.working_hours?.length) && styles.contactDivider]}
                onPress={() => openContactLink(`mailto:${hospital.email}`)}>
                <MaterialCommunityIcons name="email-outline" size={18} color="#0058BE" />
                <Text style={styles.contactText}>{hospital.email}</Text>
                <Text style={styles.contactAction}>Email</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        )}

        {/* 8. Bác sĩ tại bệnh viện */}
        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeading}>Bác sĩ tại bệnh viện</Text>
          </View>

          {hospital.doctors?.length ? hospital.doctors.map((doc) => (
            <View key={doc.id} style={styles.hospitalDocCard}>
              <View style={styles.hospitalDocTop}>
                <View style={styles.hospitalDocAvatarWrap}>
                  <DoctorAvatar
                    uri={doc.avatar}
                    style={styles.hospitalDocAvatar}
                    iconSize={32}
                  />
                </View>

                <View style={styles.hospitalDocInfoCol}>
                  {!!doc.specialty && (
                    <Text style={styles.miniSpecialtyText}>{doc.specialty}</Text>
                  )}
                  <Text style={styles.hospitalDocName} numberOfLines={1}>
                    {doc.full_name}
                  </Text>
                  {!!doc.qualification && (
                    <Text style={styles.hospitalDocExp} numberOfLines={1}>
                      {doc.qualification}
                    </Text>
                  )}
                  {doc.experience_years !== null && doc.experience_years !== undefined && (
                    <Text style={styles.hospitalDocExp} numberOfLines={1}>
                      {doc.experience_years} năm kinh nghiệm
                    </Text>
                  )}
                </View>
              </View>

              <View style={styles.hospitalDocBottomBar}>
                <TouchableOpacity
                  style={styles.docMiniBookBtn}
                  onPress={() => onNavigateToDoctorDetail(doc.id)}
                  activeOpacity={0.8}>
                  <Text style={styles.docMiniBookText}>Xem hồ sơ</Text>
                </TouchableOpacity>
              </View>
            </View>
          )) : (
            <Text style={styles.contactItemSub}>Chưa có hồ sơ bác sĩ đang hoạt động tại bệnh viện.</Text>
          )}
        </View>

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
  identityHeader: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  hospitalLogoSquare: {
    width: 54,
    height: 54,
    borderRadius: 14,
    backgroundColor: '#E6EEFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  identityTexts: {
    flex: 1,
  },
  hospitalNameTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#121C2A',
    lineHeight: 23,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  verifiedSubText: {
    fontSize: 12,
    color: '#64748B',
    flex: 1,
  },
  galleryBannerBox: {
    marginHorizontal: 16,
    marginTop: 14,
    height: 190,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#E2E8F0',
  },
  galleryBannerImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  galleryTagLeft: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  galleryTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E293B',
  },
  galleryCounterRight: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  galleryCounterText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
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
  subHeadingHint: {
    fontSize: 12,
    color: '#64748B',
    marginTop: -4,
  },
  countBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0058BE',
  },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  addressPinCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#E6EEFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressFullText: {
    flex: 1,
    fontSize: 13,
    color: '#1E293B',
    lineHeight: 18,
  },
  specialtyChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  specialtyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  specialtyPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0058BE',
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
  introParagraph: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 20,
  },
  toggleIntroBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  toggleIntroText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0058BE',
  },
  contactCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  contactItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  contactIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#E6EEFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactItemTexts: {
    flex: 1,
  },
  contactItemTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#121C2A',
  },
  contactItemSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
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
  contactAction: {
    color: '#0058BE',
    fontSize: 12,
    fontWeight: '700',
  },
  contactDivider: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  workingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF4FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    alignSelf: 'flex-start',
    marginTop: 6,
    gap: 4,
  },
  workingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#0058BE',
  },
  workingBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0058BE',
  },
  emergencyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  urgentTag: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  urgentTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#EF4444',
  },
  dividerLine: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  hotlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  hotlineLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  hotlineNumber: {
    fontSize: 14,
    fontWeight: '800',
    color: '#121C2A',
  },
  hotlineLabel: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  callNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF4FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  callNowText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0058BE',
  },
  hospitalDocCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  hospitalDocTop: {
    flexDirection: 'row',
    padding: 14,
    gap: 12,
  },
  hospitalDocAvatarWrap: {
    position: 'relative',
    width: 64,
    height: 64,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#E2E8F0',
  },
  hospitalDocAvatar: {
    width: '100%',
    height: '100%',
  },
  hospitalDocBadgeBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 88, 190, 0.85)',
    paddingVertical: 2,
    alignItems: 'center',
  },
  hospitalDocBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  hospitalDocInfoCol: {
    flex: 1,
  },
  specialtyRatingLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  miniSpecialtyPill: {
    backgroundColor: '#E6EEFF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  miniSpecialtyText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0058BE',
  },
  hospitalDocName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#121C2A',
    marginTop: 4,
  },
  hospitalDocExp: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  hospitalDocBottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  docAvailabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  docAvailabilityText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '500',
  },
  docMiniBookBtn: {
    backgroundColor: '#0058BE',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
  },
  docMiniBookText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
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
  hospitalMainBookBtn: {
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
  hospitalMainBookText: {
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
