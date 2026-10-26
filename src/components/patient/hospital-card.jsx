import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { HospitalImage } from './data-images';

export function HospitalCard({ hospital, onPress }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      {/* Header Info */}
      <View style={styles.headerRow}>
        <View style={styles.logoWrapper}>
          <HospitalImage
            key={hospital.id}
            hospital={hospital}
            style={styles.logoImage}
          />
        </View>

        <View style={styles.infoCol}>
          <Text style={styles.nameText} numberOfLines={2}>
            {hospital.name}
          </Text>
          {hospital.specialties?.length > 0 ? (
            <Text style={styles.specialtyText} numberOfLines={2}>
              {hospital.specialties.join(', ')}
            </Text>
          ) : (
            !!(hospital.district || hospital.province) && (
              <Text style={styles.specialtyText} numberOfLines={1}>
                {[hospital.district, hospital.province].filter(Boolean).join(', ')}
              </Text>
            )
          )}
        </View>
      </View>

      {/* Address */}
      {!!hospital.address && (
        <View style={styles.addressRow}>
          <MaterialCommunityIcons name="map-marker-outline" size={16} color="#94A3B8" style={styles.markerIcon} />
          <Text style={styles.addressText} numberOfLines={2}>
            {hospital.address}
          </Text>
        </View>
      )}

      {/* Action CTA */}
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.bookBtn} onPress={onPress} activeOpacity={0.75}>
          <MaterialCommunityIcons name="chevron-right" size={16} color="#2478F2" />
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
    borderColor: '#F1F5F9',
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
  logoWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    backgroundColor: '#FAFCFF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
  },
  logoImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  infoCol: {
    flex: 1,
  },
  nameText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 22,
  },
  specialtyText: {
    fontSize: 13,
    color: '#475569',
    marginTop: 2,
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
    borderRadius: 12,
    gap: 6,
  },
  bookBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2478F2',
  },
});
