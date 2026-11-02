import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Modal } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export function PatientBottomBar({ currentTab, onSelectTab, onLogout, onSwitchToAdmin }) {
  const [showAccountModal, setShowAccountModal] = useState(false);

  const tabs = [
    {
      key: 'HOME',
      label: 'Trang chủ',
      iconActive: 'home',
      iconInactive: 'home-outline',
    },
    {
      key: 'APPOINTMENTS',
      label: 'Lịch khám',
      iconActive: 'calendar-month',
      iconInactive: 'calendar-month-outline',
    },
    {
      key: 'ACCOUNT',
      label: 'Tài khoản',
      iconActive: 'account',
      iconInactive: 'account-outline',
    },
  ];

  return (
    <>
      <View style={styles.wrapper}>
        <View style={styles.container}>
          {tabs.map((tab) => {
            const isActive = currentTab === tab.key;
            const iconName = isActive ? tab.iconActive : tab.iconInactive;
            const iconColor = isActive ? '#2478F2' : '#94A3B8';

            return (
              <TouchableOpacity
                key={tab.key}
                style={styles.tabButton}
                activeOpacity={0.7}
                onPress={() => {
                  if (tab.key === 'ACCOUNT') {
                    setShowAccountModal(true);
                  } else {
                    onSelectTab(tab.key);
                  }
                }}>
                <MaterialCommunityIcons
                  name={iconName}
                  size={24}
                  color={iconColor}
                  style={isActive && styles.activeIconScale}
                />
                <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Account Sheet Modal */}
      <Modal visible={showAccountModal} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowAccountModal(false)}>
          <View style={styles.modalSheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Tài khoản Bệnh nhân</Text>
            <Text style={styles.sheetSub}>Tuỳ chọn quản lý và chuyển đổi quyền truy cập</Text>

            {onSwitchToAdmin && (
              <TouchableOpacity
                style={styles.sheetBtn}
                onPress={() => {
                  setShowAccountModal(false);
                  onSwitchToAdmin();
                }}>
                <MaterialCommunityIcons name="shield-account" size={20} color="#0058BE" />
                <Text style={styles.sheetBtnTextBlue}>Chuyển sang giao diện Admin</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.sheetBtn, { borderColor: '#FEE2E2', backgroundColor: '#FFF5F5' }]}
              onPress={() => {
                setShowAccountModal(false);
                onLogout && onLogout();
              }}>
              <MaterialCommunityIcons name="logout" size={20} color="#EF4444" />
              <Text style={styles.sheetBtnTextRed}>Đăng xuất tài khoản</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sheetCloseBtn}
              onPress={() => setShowAccountModal(false)}>
              <Text style={styles.sheetCloseText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingBottom: Platform.OS === 'ios' ? 18 : 8,
    paddingTop: 8,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  activeIconScale: {
    transform: [{ scale: 1.05 }],
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#94A3B8',
    marginTop: 3,
  },
  tabLabelActive: {
    color: '#2478F2',
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  sheetSub: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
    marginBottom: 18,
  },
  sheetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    marginBottom: 10,
  },
  sheetBtnTextBlue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0058BE',
  },
  sheetBtnTextRed: {
    fontSize: 14,
    fontWeight: '700',
    color: '#EF4444',
  },
  sheetCloseBtn: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 4,
  },
  sheetCloseText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
});
