import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Card, Chip } from 'react-native-paper';
import { BarChart } from 'react-native-gifted-charts';
import { useAuth } from '@/context/auth-context';
import { dashboardService } from '@/services/dashboard-service';
import { MedicalColors, Spacing } from '@/constants/theme';

export function AdminDashboardView({
  onNavigateToHospitals,
  onOpenCreateHospital,
}) {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentHospitals, setRecentHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [s, h] = await Promise.all([
        dashboardService.getDashboardStats(),
        dashboardService.getRecentHospitals(),
      ]);
      setStats(s);
      setRecentHospitals(h);
    } catch (err) {
      console.warn('Lỗi tải dữ liệu Dashboard:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const barChartData = [
    {
      value: stats?.statusCounts?.PENDING ?? 0,
      label: 'Chờ duyệt',
      frontColor: '#F59E0B',
      topLabelComponent: () => (
        <Text style={{ color: '#F59E0B', fontSize: 11, fontWeight: '700' }}>
          {stats?.statusCounts?.PENDING ?? 0}
        </Text>
      ),
    },
    {
      value: stats?.statusCounts?.CONFIRMED ?? 0,
      label: 'Đã duyệt',
      frontColor: '#0284C7',
      topLabelComponent: () => (
        <Text style={{ color: '#0284C7', fontSize: 11, fontWeight: '700' }}>
          {stats?.statusCounts?.CONFIRMED ?? 0}
        </Text>
      ),
    },
    {
      value: stats?.statusCounts?.COMPLETED ?? 0,
      label: 'Khám xong',
      frontColor: '#10B981',
      topLabelComponent: () => (
        <Text style={{ color: '#10B981', fontSize: 11, fontWeight: '700' }}>
          {stats?.statusCounts?.COMPLETED ?? 0}
        </Text>
      ),
    },
    {
      value: stats?.statusCounts?.CANCELLED ?? 0,
      label: 'Đã hủy',
      frontColor: '#EF4444',
      topLabelComponent: () => (
        <Text style={{ color: '#EF4444', fontSize: 11, fontWeight: '700' }}>
          {stats?.statusCounts?.CANCELLED ?? 0}
        </Text>
      ),
    },
  ];

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={MedicalColors.primary} />
        <Text style={styles.loadingText}>Đang tải dữ liệu báo cáo thống kê...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[MedicalColors.primary]}
        />
      }>
      {/* Top Banner: Admin Header */}
      <Card style={styles.welcomeBanner} mode="elevated">
        <Card.Content style={styles.welcomeBannerContent}>
          <View style={styles.adminInfo}>
            <Image
              source={{
                uri:
                  user?.avatar ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
              }}
              style={styles.adminAvatar}
            />
            <View>
              <View style={styles.roleBadgeRow}>
                <Text style={styles.greetingText}>Xin chào,</Text>
                <Chip compact textStyle={{ fontSize: 9, fontWeight: '800', color: '#0284C7' }} style={{ height: 20, backgroundColor: '#E0F2FE' }}>
                  ADMIN
                </Chip>
              </View>
              <Text style={styles.adminName}>{user?.full_name || 'Quản trị viên'}</Text>
              <Text style={styles.dbIndicator}>🟢 Hệ thống máy chủ hoạt động ổn định</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
            <MaterialCommunityIcons name="logout" size={16} color="#DC2626" />
            <Text style={styles.logoutBtnText}>Đăng xuất</Text>
          </TouchableOpacity>
        </Card.Content>
      </Card>

      {/* KPI Stats Grid */}
      <Text style={styles.sectionTitle}>THỐNG KÊ TỔNG QUAN HỆ THỐNG</Text>
      <View style={styles.statsGrid}>
        {/* Thẻ Bệnh viện */}
        <TouchableOpacity
          style={[styles.statCard, { borderLeftColor: MedicalColors.primary }]}
          onPress={onNavigateToHospitals}>
          <View style={styles.statHeader}>
            <MaterialCommunityIcons name="hospital-building" size={24} color={MedicalColors.primary} />
            <Text style={styles.statBadgeSuccess}>
              {stats?.activeHospitals ?? 0} hoạt động
            </Text>
          </View>
          <Text style={styles.statNumber}>{stats?.totalHospitals ?? 0}</Text>
          <Text style={styles.statLabel}>Tổng số Bệnh viện</Text>
          <Text style={styles.statSubText}>
            ({stats?.inactiveHospitals ?? 0} cơ sở tạm ngưng)
          </Text>
        </TouchableOpacity>

        {/* Thẻ Bác sĩ */}
        <View style={[styles.statCard, { borderLeftColor: MedicalColors.secondary }]}>
          <View style={styles.statHeader}>
            <MaterialCommunityIcons name="doctor" size={24} color={MedicalColors.secondary} />
            <Text style={styles.statBadgeInfo}>Chuyên khoa</Text>
          </View>
          <Text style={styles.statNumber}>{stats?.totalDoctors ?? 0}</Text>
          <Text style={styles.statLabel}>Bác sĩ công tác</Text>
          <Text style={styles.statSubText}>Hồ sơ bác sĩ đã duyệt</Text>
        </View>

        {/* Thẻ Bệnh nhân */}
        <View style={[styles.statCard, { borderLeftColor: MedicalColors.accent }]}>
          <View style={styles.statHeader}>
            <MaterialCommunityIcons name="account-group" size={24} color="#0D9488" />
            <Text style={styles.statBadgePatient}>Tài khoản</Text>
          </View>
          <Text style={styles.statNumber}>{stats?.totalPatients ?? 0}</Text>
          <Text style={styles.statLabel}>Bệnh nhân đăng ký</Text>
          <Text style={styles.statSubText}>Người dùng kích hoạt</Text>
        </View>

        {/* Thẻ Lịch hẹn & Doanh thu */}
        <View style={[styles.statCard, { borderLeftColor: MedicalColors.warning }]}>
          <View style={styles.statHeader}>
            <MaterialCommunityIcons name="calendar-check" size={24} color="#D97706" />
            <Text style={styles.statBadgeWarn}>Viện phí</Text>
          </View>
          <Text style={styles.statNumber}>{stats?.totalAppointments ?? 0}</Text>
          <Text style={styles.statLabel}>Ca khám bệnh</Text>
          <Text style={styles.revenueText}>
            {formatCurrency(stats?.totalRevenue || 0)}
          </Text>
        </View>
      </View>

      {/* Appointment Status Chart: Gifted Charts */}
      <Card style={styles.chartCard} mode="elevated">
        <Card.Content>
          <View style={styles.chartHeader}>
            <MaterialCommunityIcons name="chart-box-outline" size={20} color="#0284C7" />
            <Text style={styles.chartTitle}>Biểu đồ trạng thái lịch hẹn khám</Text>
          </View>
          <Text style={styles.chartSubTitle}>
            Thống kê phân bổ tỷ lệ các ca khám bệnh theo trạng thái tiếp nhận
          </Text>

          <View style={styles.chartWrapper}>
            <BarChart
              data={barChartData}
              barWidth={36}
              noOfSections={4}
              maxValue={Math.max(...barChartData.map((d) => d.value), 4) + 1}
              height={140}
              spacing={24}
              barBorderRadius={6}
              isAnimated
              yAxisTextStyle={{ color: '#94A3B8', fontSize: 10 }}
              xAxisLabelTextStyle={{ color: '#475569', fontSize: 11, fontWeight: '600' }}
            />
          </View>
        </Card.Content>
      </Card>

      {/* Quick Action Buttons */}
      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.primaryActionBtn} onPress={onOpenCreateHospital}>
          <MaterialCommunityIcons name="plus-box" size={18} color="#FFFFFF" />
          <Text style={styles.primaryActionText}>Thêm bệnh viện mới</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryActionBtn} onPress={onNavigateToHospitals}>
          <MaterialCommunityIcons name="clipboard-list-outline" size={18} color={MedicalColors.primary} />
          <Text style={styles.secondaryActionText}>Quản lý bệnh viện</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Hospitals Preview */}
      <View style={styles.recentHeaderRow}>
        <Text style={styles.sectionTitle}>CƠ SỞ Y TẾ CẬP NHẬT GẦN ĐÂY</Text>
        <TouchableOpacity onPress={onNavigateToHospitals}>
          <Text style={styles.viewAllText}>Xem tất cả ({stats?.totalHospitals || 6}) ›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.recentList}>
        {recentHospitals.map((hospital) => (
          <TouchableOpacity
            key={hospital.id}
            style={styles.recentCard}
            onPress={onNavigateToHospitals}>
            <Image
              source={{
                uri:
                  hospital.image_url ||
                  'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=600',
              }}
              style={styles.recentImg}
            />
            <View style={styles.recentInfo}>
              <View style={styles.recentTopRow}>
                <Text style={styles.recentName} numberOfLines={1}>
                  {hospital.name}
                </Text>
                <Chip
                  compact
                  textStyle={{
                    fontSize: 9,
                    fontWeight: '700',
                    color: hospital.status === 'ACTIVE' ? '#16A34A' : '#DC2626',
                  }}
                  style={{
                    height: 20,
                    backgroundColor: hospital.status === 'ACTIVE' ? '#DCFCE7' : '#FEE2E2',
                  }}>
                  {hospital.status === 'ACTIVE' ? 'Hoạt động' : 'Tạm ngưng'}
                </Chip>
              </View>
              <Text style={styles.recentAddress} numberOfLines={1}>
                {hospital.address}
              </Text>
              {hospital.phone ? (
                <Text style={styles.recentPhone}>Hotline: {hospital.phone}</Text>
              ) : null}
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EDF5FA',
  },
  content: {
    padding: Spacing.three,
    paddingBottom: 90,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
    backgroundColor: '#EDF5FA',
  },
  loadingText: {
    marginTop: Spacing.two,
    fontSize: 14,
    color: MedicalColors.textSecondary,
  },
  welcomeBanner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: Spacing.three,
    elevation: 2,
  },
  welcomeBannerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  adminInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    flex: 1,
  },
  adminAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 2,
    borderColor: '#BAE6FD',
  },
  roleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  greetingText: {
    fontSize: 11,
    color: MedicalColors.textSecondary,
  },
  adminName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  dbIndicator: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '600',
    marginTop: 2,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  logoutBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 0.8,
    marginBottom: Spacing.two,
    marginLeft: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: Spacing.three,
  },
  statCard: {
    width: '48%',
    minHeight: 138,
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: Spacing.three,
    borderRadius: 14,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  statBadgeSuccess: {
    fontSize: 10,
    fontWeight: '700',
    color: '#16A34A',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statBadgeInfo: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0284C7',
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statBadgePatient: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0D9488',
    backgroundColor: '#CCFBF1',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statBadgeWarn: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D97706',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  statSubText: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  revenueText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#16A34A',
    marginTop: 2,
  },

  // Chart Card
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: Spacing.three,
    elevation: 2,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  chartSubTitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 10,
  },
  chartWrapper: {
    alignItems: 'center',
    paddingTop: 10,
  },

  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: Spacing.four,
  },
  primaryActionBtn: {
    flex: 1,
    backgroundColor: MedicalColors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  secondaryActionBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: MedicalColors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
  },
  secondaryActionText: {
    color: MedicalColors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  recentHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: MedicalColors.primary,
  },
  recentList: {
    gap: 10,
  },
  recentCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: Spacing.two,
    gap: Spacing.two,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  recentImg: {
    width: 68,
    height: 68,
    borderRadius: 10,
    backgroundColor: '#E2E8F0',
  },
  recentInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  recentTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  recentName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    flex: 1,
    marginRight: 6,
  },
  recentAddress: {
    fontSize: 12,
    color: '#475569',
    marginBottom: 2,
  },
  recentPhone: {
    fontSize: 11,
    color: MedicalColors.primary,
    fontWeight: '600',
  },
});
