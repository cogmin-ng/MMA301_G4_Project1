import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { doctorService } from '../../services/doctor-service';
import { hospitalService } from '../../services/hospital-service';
import { DoctorAvatar, HospitalImage } from './data-images';

export function PatientHomeView({
  user,
  onNavigateToDoctorList,
  onNavigateToHospitalList,
  onNavigateToDoctorDetail,
  onNavigateToHospitalDetail,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [featuredDoctors, setFeaturedDoctors] = useState([]);
  const [featuredHospitals, setFeaturedHospitals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    let isActive = true;
    Promise.all([
      doctorService.getDoctors(),
      hospitalService.getHospitals({ status: 'ACTIVE' }),
    ])
      .then(([doctors, hospitals]) => {
        if (!isActive) return;
        setFeaturedDoctors(doctors.slice(0, 4));
        setFeaturedHospitals(hospitals.slice(0, 4));
        setError('');
      })
      .catch((err) => {
        if (!isActive) return;
        setError(err.message || 'Không thể tải dữ liệu trang chủ.');
      })
      .finally(() => {
        if (!isActive) return;
        setIsLoading(false);
        setRefreshing(false);
      });

    return () => {
      isActive = false;
    };
  }, [reloadCount]);

  const onRefresh = () => {
    setRefreshing(true);
    setReloadCount((count) => count + 1);
  };

  const displayName = user?.full_name?.trim();
  const getInitials = (name) => {
    if (!name) return '';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[parts.length - 2][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2478F2']} />}>
      {/* 1. Patient profile */}
      <View style={styles.profileHeader}>
        {!!displayName && (
          <View style={styles.userInfoRow}>
            <View style={styles.avatarRing}>
              {user?.avatar ? (
                <DoctorAvatar uri={user.avatar} style={styles.profileAvatar} iconSize={24} />
              ) : (
                <View style={styles.avatarInner}>
                  <Text style={styles.avatarInitials}>{getInitials(displayName)}</Text>
                </View>
              )}
            </View>

            <View style={styles.greetingCol}>
              <Text style={styles.greetingSub}>Xin chào,</Text>
              <Text style={styles.userName}>{displayName}</Text>
            </View>
          </View>
        )}
      </View>

      {/* 2. Prominent Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <MaterialCommunityIcons name="magnify" size={20} color="#94A3B8" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm bệnh viện, bác sĩ hoặc chuyên khoa..."
            placeholderTextColor="#94A3B8"
            value={searchTerm}
            onChangeText={setSearchTerm}
            onSubmitEditing={() => {
              if (searchTerm.trim()) {
                onNavigateToDoctorList({ keyword: searchTerm.trim() });
              }
            }}
          />
          <TouchableOpacity
            style={styles.searchBtn}
            onPress={() => onNavigateToDoctorList({ keyword: searchTerm.trim() })}
            activeOpacity={0.8}>
            <Text style={styles.searchBtnText}>Tìm</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 3. Category Shortcuts */}
      <View style={styles.categoryGrid}>
        {/* Bác sĩ */}
        <TouchableOpacity
          style={styles.categoryItem}
          onPress={() => onNavigateToDoctorList()}
          activeOpacity={0.75}>
          <View style={styles.categoryIconBox}>
            <MaterialCommunityIcons name="doctor" size={26} color="#2478F2" />
          </View>
          <Text style={styles.categoryLabel}>Bác sĩ</Text>
        </TouchableOpacity>

        {/* Bệnh viện */}
        <TouchableOpacity
          style={styles.categoryItem}
          onPress={() => onNavigateToHospitalList()}
          activeOpacity={0.75}>
          <View style={styles.categoryIconBox}>
            <MaterialCommunityIcons name="hospital-building" size={26} color="#EF4444" />
          </View>
          <Text style={styles.categoryLabel}>Bệnh viện</Text>
        </TouchableOpacity>

        {/* Chuyên khoa */}
        <TouchableOpacity
          style={styles.categoryItem}
          onPress={() => onNavigateToDoctorList()}
          activeOpacity={0.75}>
          <View style={styles.categoryIconBox}>
            <MaterialCommunityIcons name="microscope" size={26} color="#0891B2" />
          </View>
          <Text style={styles.categoryLabel}>Chuyên khoa</Text>
        </TouchableOpacity>
      </View>

      {!!error && (
        <View style={styles.homeError}>
          <Text style={styles.homeErrorText}>Không thể tải dữ liệu từ máy chủ.</Text>
          <Text style={styles.homeErrorSub}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setError('');
              setIsLoading(true);
              setReloadCount((count) => count + 1);
            }}>
            <Text style={styles.retryText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 4. Doctors from the database */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <View style={styles.blueBar} />
            <Text style={styles.sectionTitle}>Bác sĩ</Text>
          </View>
          <TouchableOpacity
            style={styles.seeAllBtn}
            onPress={() => onNavigateToDoctorList()}
            activeOpacity={0.7}>
            <Text style={styles.seeAllText}>Xem tất cả</Text>
            <MaterialCommunityIcons name="chevron-right" size={16} color="#2478F2" />
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <ActivityIndicator size="small" color="#2478F2" style={{ marginVertical: 20 }} />
        ) : featuredDoctors.length ? (
          <View style={styles.cardGrid}>
            {featuredDoctors.map((doc) => (
              <TouchableOpacity
                key={doc.id}
                style={styles.featuredDocCard}
                onPress={() => onNavigateToDoctorDetail(doc.id)}
                activeOpacity={0.85}>
                <View style={styles.docAvatarFrame}>
                  <DoctorAvatar
                    uri={doc.avatar}
                    style={styles.docAvatarCircle}
                    iconSize={36}
                  />
                </View>

                <Text style={styles.docName} numberOfLines={1}>
                  {doc.full_name}
                </Text>
                {!!doc.qualification && (
                  <Text style={styles.docSpecialty} numberOfLines={1}>
                    {doc.qualification}
                  </Text>
                )}
                {!!doc.specialty && (
                  <Text style={styles.docSpecialty} numberOfLines={1}>
                    {doc.specialty}
                  </Text>
                )}
                {!!doc.hospital_name && (
                  <Text style={styles.docHospital} numberOfLines={2}>
                    {doc.hospital_name}
                  </Text>
                )}

                <TouchableOpacity
                  style={styles.viewDetailBtn}
                  onPress={() => onNavigateToDoctorDetail(doc.id)}
                  activeOpacity={0.75}>
                  <Text style={styles.viewDetailText}>Xem chi tiết</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        ) : !error ? (
          <Text style={styles.noDataText}>Chưa có dữ liệu bác sĩ.</Text>
        ) : null}
      </View>

      {/* 5. Hospitals from the database */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <View style={[styles.blueBar, { backgroundColor: '#10B981' }]} />
            <Text style={styles.sectionTitle}>Bệnh viện</Text>
          </View>
          <TouchableOpacity
            style={styles.seeAllBtn}
            onPress={() => onNavigateToHospitalList()}
            activeOpacity={0.7}>
            <Text style={styles.seeAllText}>Xem tất cả</Text>
            <MaterialCommunityIcons name="chevron-right" size={16} color="#2478F2" />
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <ActivityIndicator size="small" color="#2478F2" style={{ marginVertical: 20 }} />
        ) : featuredHospitals.length ? (
          <View style={styles.cardGrid}>
            {featuredHospitals.map((hosp) => (
              <TouchableOpacity
                key={hosp.id}
                style={styles.featuredHospCard}
                onPress={() => onNavigateToHospitalDetail(hosp.id)}
                activeOpacity={0.85}>
                <View style={styles.hospBadgeFrame}>
                  <HospitalImage
                    key={hosp.id}
                    hospital={hosp}
                    style={styles.hospImage}
                    iconSize={36}
                  />
                </View>

                <Text style={styles.hospName} numberOfLines={1}>
                  {hosp.name}
                </Text>
                {!!(hosp.district || hosp.province) && (
                  <View style={styles.hospLocationRow}>
                    <MaterialCommunityIcons name="map-marker-outline" size={12} color="#94A3B8" />
                    <Text style={styles.hospLocation} numberOfLines={1}>
                      {[hosp.district, hosp.province].filter(Boolean).join(', ')}
                    </Text>
                  </View>
                )}

                <TouchableOpacity
                  style={styles.hospDetailBtn}
                  onPress={() => onNavigateToHospitalDetail(hosp.id)}
                  activeOpacity={0.75}>
                  <Text style={styles.hospDetailText}>Xem chi tiết</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        ) : !error ? (
          <Text style={styles.noDataText}>Chưa có dữ liệu bệnh viện.</Text>
        ) : null}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFE',
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarRing: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2478F2',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  avatarInner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1E6CEB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E2E8F0',
  },
  avatarInitials: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 13,
    height: 13,
    borderRadius: 6.5,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  greetingCol: {},
  greetingSub: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  nameVerifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  userName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  verifiedBadge: {
    width: 15,
    height: 15,
    borderRadius: 7.5,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    position: 'relative',
  },
  alertDot: {
    position: 'absolute',
    top: 9,
    right: 10,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#F43F5E',
  },
  searchSection: {
    marginTop: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#2478F2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#1E293B',
    paddingVertical: 4,
  },
  searchBtn: {
    backgroundColor: '#2478F2',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 999,
  },
  searchBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  categoryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingHorizontal: 4,
  },
  categoryItem: {
    alignItems: 'center',
    width: 68,
  },
  categoryIconBox: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#2478F2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    marginTop: 6,
  },
  promoBanner: {
    backgroundColor: '#2478F2',
    borderRadius: 20,
    padding: 16,
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#2478F2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  promoDeco1: {
    position: 'absolute',
    right: -20,
    bottom: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  promoDeco2: {
    position: 'absolute',
    top: 6,
    right: 50,
  },
  promoPlus: {
    fontSize: 48,
    fontWeight: '900',
    color: 'rgba(255, 255, 255, 0.15)',
  },
  promoContent: {
    flex: 1,
    paddingRight: 10,
  },
  promoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  promoBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  promoTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  promoSub: {
    fontSize: 13,
    fontWeight: '500',
    color: '#DBEAFE',
    marginTop: 2,
    marginBottom: 10,
  },
  promoCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    alignSelf: 'flex-start',
    gap: 4,
  },
  promoCtaText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2478F2',
  },
  medipassCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  medipassInner: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  medipassText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#DBEAFE',
    marginTop: 2,
  },
  sectionContainer: {
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  blueBar: {
    width: 4,
    height: 16,
    borderRadius: 2,
    backgroundColor: '#2478F2',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2478F2',
  },
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  featuredDocCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#2478F2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  docAvatarFrame: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 10,
  },
  qualificationBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  qualificationText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#2478F2',
  },
  docAvatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  docName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  docSpecialty: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2478F2',
    marginTop: 2,
  },
  docHospital: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },
  viewDetailBtn: {
    marginTop: 10,
    paddingVertical: 6,
    backgroundColor: '#F0F6FE',
    borderRadius: 8,
    alignItems: 'center',
  },
  viewDetailText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2478F2',
  },
  featuredHospCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#2478F2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  hospBadgeFrame: {
    width: '100%',
    aspectRatio: 1.3,
    borderRadius: 12,
    backgroundColor: '#FFF5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    overflow: 'hidden',
  },
  hospImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  hospIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  hospName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  hospLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  hospLocation: {
    fontSize: 10,
    color: '#64748B',
    flex: 1,
  },
  hospDetailBtn: {
    marginTop: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2478F2',
    alignItems: 'center',
  },
  hospDetailText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2478F2',
  },
  homeError: {
    marginTop: 14,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#FEF2F2',
  },
  homeErrorText: {
    color: '#B91C1C',
    fontSize: 13,
    fontWeight: '700',
  },
  homeErrorSub: {
    color: '#7F1D1D',
    fontSize: 12,
    marginTop: 4,
  },
  retryButton: {
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#2478F2',
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  noDataText: {
    color: '#64748B',
    fontSize: 13,
    paddingVertical: 16,
    textAlign: 'center',
  },
});
