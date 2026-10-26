import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export function PatientHeader({
  searchValue = '',
  onChangeSearch = () => {},
  placeholder = 'Tìm theo triệu chứng bệnh',
  activeTab = 'DOCTOR', // 'DOCTOR' | 'HOSPITAL'
  onSelectTab = () => {},
  onClose = () => {},
}) {
  return (
    <View style={styles.container}>
      {/* Search Row */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <MaterialCommunityIcons name="magnify" size={20} color="#94A3B8" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={placeholder}
            placeholderTextColor="#94A3B8"
            value={searchValue}
            onChangeText={onChangeSearch}
          />
          {searchValue.length > 0 && (
            <TouchableOpacity onPress={() => onChangeSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <MaterialCommunityIcons name="close-circle" size={16} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
          <Text style={styles.closeBtnText}>Đóng</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs Filter Bar (Bác sĩ | Bệnh viện | Bộ lọc) */}
      <View style={styles.tabRow}>
        {/* Tab Bác sĩ */}
        <TouchableOpacity
          style={[styles.pillBtn, activeTab === 'DOCTOR' && styles.activePill]}
          onPress={() => onSelectTab('DOCTOR')}
          activeOpacity={0.8}>
          <Text style={[styles.pillText, activeTab === 'DOCTOR' && styles.activePillText]}>Bác sĩ</Text>
          {activeTab === 'DOCTOR' && (
            <MaterialCommunityIcons name="close" size={14} color="#1E293B" style={{ marginLeft: 4 }} />
          )}
        </TouchableOpacity>

        {/* Tab Bệnh viện */}
        <TouchableOpacity
          style={[styles.pillBtn, activeTab === 'HOSPITAL' && styles.activePill]}
          onPress={() => onSelectTab('HOSPITAL')}
          activeOpacity={0.8}>
          <Text style={[styles.pillText, activeTab === 'HOSPITAL' && styles.activePillText]}>Bệnh viện</Text>
          {activeTab === 'HOSPITAL' && (
            <MaterialCommunityIcons name="close" size={14} color="#1E293B" style={{ marginLeft: 4 }} />
          )}
        </TouchableOpacity>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#D7E7FB', // Chuẩn Stitch header pastel blue
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingHorizontal: 14,
    height: 44,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1E293B',
    paddingVertical: 0,
  },
  closeBtn: {
    paddingHorizontal: 4,
    paddingVertical: 6,
  },
  closeBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
  },
  tabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  pillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: 'transparent',
  },
  activePill: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 2,
  },
  pillText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#334155',
  },
  activePillText: {
    fontWeight: '700',
    color: '#0F172A',
  },
});
