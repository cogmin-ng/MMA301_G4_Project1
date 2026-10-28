import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MedicalColors } from '@/constants/theme';

export function AdminBottomBar({ currentTab, onSelectTab }) {
  const tabs = [
    {
      key: 'HOME',
      label: 'Trang chủ',
      iconActive: 'home',
      iconInactive: 'home-outline',
    },
    {
      key: 'HOSPITALS',
      label: 'Bệnh viện',
      iconActive: 'hospital-building',
      iconInactive: 'hospital-building',
    },
    {
      key: 'DOCTORS',
      label: 'Bác sĩ',
      iconActive: 'doctor',
      iconInactive: 'doctor',
    },
    {
      key: 'APPOINTMENTS',
      label: 'Lịch hẹn',
      iconActive: 'calendar-clock',
      iconInactive: 'calendar-clock-outline',
    },
    {
      key: 'MORE',
      label: 'Khác',
      iconActive: 'dots-horizontal-circle',
      iconInactive: 'dots-horizontal-circle-outline',
    },
  ];

  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        {tabs.map((tab) => {
          const isActive = currentTab === tab.key;
          const iconName = isActive ? tab.iconActive : tab.iconInactive;
          const iconColor = isActive ? MedicalColors.primary : '#94A3B8';

          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.tabButton}
              activeOpacity={0.7}
              onPress={() => onSelectTab(tab.key)}>
              <MaterialCommunityIcons
                name={iconName}
                size={24}
                color={iconColor}
                style={isActive && styles.activeIconScale}
              />
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                {tab.label}
              </Text>
              {isActive && <View style={styles.activeIndicator} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
    paddingHorizontal: 12,
    paddingBottom: Platform.OS === 'ios' ? 24 : 10,
  },
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 8,
    paddingHorizontal: 6,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
    position: 'relative',
  },
  activeIconScale: {
    transform: [{ scale: 1.1 }],
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  tabLabelActive: {
    color: MedicalColors.primary,
    fontWeight: '800',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -4,
    width: 16,
    height: 3,
    borderRadius: 2,
    backgroundColor: MedicalColors.primary,
  },
});
