import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { DoctorAvatar } from './data-images';

export function DoctorCard({ doctor, onPress }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      {/* Top Info */}
      <View style={styles.headerRow}>
        <DoctorAvatar
          uri={doctor.avatar}
          style={styles.avatar}
          iconSize={32}
        />
        <View style={styles.infoCol}>
          {!!doctor.qualification && <Text style={styles.degreeText}>{doctor.qualification}</Text>}
          <Text style={styles.nameText} numberOfLines={1}>
            {doctor.full_name}
          </Text>
          {doctor.experience_years !== null && doctor.experience_years !== undefined && (
            <Text style={styles.expText}>{doctor.experience_years} năm kinh nghiệm</Text>
          )}
          {!!doctor.specialty && (
            <Text style={styles.specialtyText} numberOfLines={1}>
              Chuyên khoa: <Text style={styles.specialtyName}>{doctor.specialty}</Text>
            </Text>
          )}
          {doctor.consultation_fee !== null && doctor.consultation_fee !== undefined && (
            <Text style={styles.expText}>
              Phí khám: {new Intl.NumberFormat('vi-VN').format(doctor.consultation_fee)} đ
            </Text>
          )}
        </View>
      </View>

      {/* Address */}
      {!!(doctor.hospital_address || doctor.hospital_name) && (
        <View style={styles.addressRow}>
          <MaterialCommunityIcons name="map-marker-outline" size={16} color="#94A3B8" style={styles.markerIcon} />
          <Text style={styles.addressText} numberOfLines={2}>
            {doctor.hospital_address || doctor.hospital_name}
          </Text>
        </View>
      )}

      {/* Action CTA */}
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.bookBtn} onPress={onPress} activeOpacity={0.75}>
          <MaterialCommunityIcons name="chevron-right" size={16} color="#1975F0" />
          <Text style={styles.bookBtnText}>Xem chi tiết</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8EDF2',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F1F5F9',
  },
  infoCol: {
    flex: 1,
    justifyContent: 'center',
  },
  degreeText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 2,
  },
  nameText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 22,
  },
  expText: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  specialtyText: {
    fontSize: 13,
    color: '#475569',
    marginTop: 2,
  },
  specialtyName: {
    fontWeight: '600',
    color: '#0F172A',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  markerIcon: {
    marginRight: 6,
    marginTop: 2,
  },
  addressText: {
    flex: 1,
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
  },
  actionRow: {
    marginTop: 10,
    flexDirection: 'row',
  },
  bookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF4FE',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    gap: 6,
    borderWidth: 1,
    borderColor: '#D4E6FD',
  },
  bookBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1975F0',
  },
});
