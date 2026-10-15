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
import { PieChart, BarChart } from 'react-native-gifted-charts';
import { useAuth } from '@/context/auth-context';
import { dashboardService } from '@/services/dashboard-service';
import { MedicalColors, Spacing } from '@/constants/theme';

export function AdminDashboardView({
  onNavigateToHospitals,
  onOpenCreateHospital,
}) {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [chartType, setChartType] = useState('PIE'); // 'PIE' (Tròn) hoặc 'BAR' (Cột)

  const loadData = useCallback(async () => {
    try {
      const s = await dashboardService.getDashboardStats();
      setStats(s);
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

  const pendingCount = stats?.statusCounts?.PENDING ?? 0;
  const confirmedCount = stats?.statusCounts?.CONFIRMED ?? 0;
  const completedCount = stats?.statusCounts?.COMPLETED ?? 0;
  const cancelledCount = stats?.statusCounts?.CANCELLED ?? 0;
  const totalCount = pendingCount + confirmedCount + completedCount + cancelledCount;

  const statusItems = [
    {
      id: 'PENDING',
      label: 'Chờ duyệt',
      count: pendingCount,
      color: '#F59E0B',
      bgColor: '#FEF3C7',
      icon: 'clock-outline',
      percent: totalCount > 0 ? Math.round((pendingCount / totalCount) * 100) : 0,
    },
    {
      id: 'CONFIRMED',
      label: 'Đã duyệt',
      count: confirmedCount,
      color: '#0284C7',
      bgColor: '#E0F2FE',
      icon: 'check-circle-outline',
      percent: totalCount > 0 ? Math.round((confirmedCount / totalCount) * 100) : 0,
    },
    {
      id: 'COMPLETED',
      label: 'Khám xong',
      count: completedCount,
      color: '#10B981',
      bgColor: '#DCFCE7',
      icon: 'checkbox-marked-circle-outline',
      percent: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0,
    },
    {
      id: 'CANCELLED',
      label: 'Đã hủy',
      count: cancelledCount,
      color: '#EF4444',
      bgColor: '#FEE2E2',
      icon: 'close-circle-outline',
      percent: totalCount > 0 ? Math.round((cancelledCount / totalCount) * 100) : 0,
    },
  ];

  // Dữ liệu cho biểu đồ tròn (Pie/Donut Chart)
  const pieData = [
    {
      value: pendingCount > 0 ? pendingCount : 0.001,
      color: '#F59E0B',
      text: pendingCount > 0 ? `${pendingCount}` : '',
    },
    {
      value: confirmedCount > 0 ? confirmedCount : 0.001,
      color: '#0284C7',
      text: confirmedCount > 0 ? `${confirmedCount}` : '',
    },
    {
      value: completedCount > 0 ? completedCount : 0.001,
      color: '#10B981',
      text: completedCount > 0 ? `${completedCount}` : '',
    },
    {
      value: cancelledCount > 0 ? cancelledCount : 0.001,
      color: '#EF4444',
      text: cancelledCount > 0 ? `${cancelledCount}` : '',
    },
  ];

  // Dữ liệu cho biểu đồ cột (Bar Chart)
  const barData = [
    {
      value: pendingCount,
      label: 'Chờ duyệt',
      frontColor: '#F59E0B',
      topLabelComponent: () => (
        <Text style={styles.barTopLabel}>{pendingCount}</Text>
      ),
    },
    {
      value: confirmedCount,
      label: 'Đã duyệt',
      frontColor: '#0284C7',
      topLabelComponent: () => (
        <Text style={styles.barTopLabel}>{confirmedCount}</Text>
      ),
    },
    {
      value: completedCount,
      label: 'Khám xong',
      frontColor: '#10B981',
      topLabelComponent: () => (
        <Text style={styles.barTopLabel}>{completedCount}</Text>
      ),
    },
    {
      value: cancelledCount,
      label: 'Đã hủy',
      frontColor: '#EF4444',
      topLabelComponent: () => (
        <Text style={styles.barTopLabel}>{cancelledCount}</Text>
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
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[MedicalColors.primary]}
        />
      }>
      {/* 1. Top Banner: Admin Header */}
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
                <Chip
                  compact
                  textStyle={{ fontSize: 9, fontWeight: '800', color: '#0284C7' }}
                  style={{ height: 20, backgroundColor: '#E0F2FE' }}>
                  ADMIN
                </Chip>
              </View>
              <Text style={styles.adminName}>{user?.full_name || 'Quản trị viên'}</Text>
              <View style={styles.serverRow}>
                <View style={styles.onlineDot} />
                <Text style={styles.dbIndicator}>Kết nối MySQL 8.0 ổn định</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity style={styles.logoutBtn} onPress={logout} activeOpacity={0.7}>
            <MaterialCommunityIcons name="logout" size={15} color="#DC2626" />
            <Text style={styles.logoutBtnText}>Đăng xuất</Text>
          </TouchableOpacity>
        </Card.Content>
      </Card>

      {/* 2. KPI Stats Grid: Gọn gàng 2x2 trên mobile, loại bỏ khoảng trắng thừa */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>THỐNG KÊ TỔNG QUAN HỆ THỐNG</Text>
        <Text style={styles.syncTimeText}>Dữ liệu thời gian thực</Text>
      </View>

      <View style={styles.statsGrid}>
        {/* Thẻ Bệnh viện */}
        <TouchableOpacity
          style={[styles.statCard, { borderLeftColor: MedicalColors.primary }]}
          activeOpacity={0.8}
          onPress={onNavigateToHospitals}>
          <View style={styles.statHeader}>
            <View style={[styles.statIconBox, { backgroundColor: '#E0F2FE' }]}>
              <MaterialCommunityIcons name="hospital-building" size={18} color={MedicalColors.primary} />
            </View>
            <Text style={styles.statBadgeSuccess}>
              {stats?.activeHospitals ?? 0} hoạt động
            </Text>
          </View>
          <View>
            <Text style={styles.statNumber}>{stats?.totalHospitals ?? 0}</Text>
            <Text style={styles.statLabel}>Tổng số Bệnh viện</Text>
          </View>
          <Text style={styles.statSubText}>
            ({stats?.inactiveHospitals ?? 0} cơ sở tạm ngưng)
          </Text>
        </TouchableOpacity>

        {/* Thẻ Bác sĩ */}
        <View style={[styles.statCard, { borderLeftColor: MedicalColors.secondary }]}>
          <View style={styles.statHeader}>
            <View style={[styles.statIconBox, { backgroundColor: '#F3E8FF' }]}>
              <MaterialCommunityIcons name="doctor" size={18} color={MedicalColors.secondary} />
            </View>
            <Text style={styles.statBadgeInfo}>Chuyên khoa</Text>
          </View>
          <View>
            <Text style={styles.statNumber}>{stats?.totalDoctors ?? 0}</Text>
            <Text style={styles.statLabel}>Bác sĩ công tác</Text>
          </View>
          <Text style={styles.statSubText}>Hồ sơ bác sĩ đã duyệt</Text>
        </View>

        {/* Thẻ Bệnh nhân */}
        <View style={[styles.statCard, { borderLeftColor: '#0D9488' }]}>
          <View style={styles.statHeader}>
            <View style={[styles.statIconBox, { backgroundColor: '#CCFBF1' }]}>
              <MaterialCommunityIcons name="account-group" size={18} color="#0D9488" />
            </View>
            <Text style={styles.statBadgePatient}>Tài khoản</Text>
          </View>
          <View>
            <Text style={styles.statNumber}>{stats?.totalPatients ?? 0}</Text>
            <Text style={styles.statLabel}>Bệnh nhân đăng ký</Text>
          </View>
          <Text style={styles.statSubText}>Người dùng kích hoạt</Text>
        </View>

        {/* Thẻ Lịch hẹn & Doanh thu */}
        <View style={[styles.statCard, { borderLeftColor: '#D97706' }]}>
          <View style={styles.statHeader}>
            <View style={[styles.statIconBox, { backgroundColor: '#FEF3C7' }]}>
              <MaterialCommunityIcons name="calendar-check" size={18} color="#D97706" />
            </View>
            <Text style={styles.statBadgeWarn}>Viện phí</Text>
          </View>
          <View>
            <Text style={styles.statNumber}>{stats?.totalAppointments ?? 0}</Text>
            <Text style={styles.statLabel}>Ca khám bệnh</Text>
          </View>
          <Text style={styles.revenueText}>
            {formatCurrency(stats?.totalRevenue || 0)}
          </Text>
        </View>
      </View>

      {/* 3. Biểu đồ đại trà (Tròn Donut & Cột Bar) kèm nút chuyển đổi tiện lợi */}
      <Card style={styles.chartCard} mode="elevated">
        <Card.Content style={styles.chartCardContent}>
          {/* Header biểu đồ với Switcher Tròn / Cột */}
          <View style={styles.chartHeaderRow}>
            <View>
              <View style={styles.chartTitleRow}>
                <MaterialCommunityIcons
                  name={chartType === 'PIE' ? 'chart-donut' : 'chart-bar'}
                  size={20}
                  color={MedicalColors.primary}
                />
                <Text style={styles.chartTitle}>Biểu đồ trạng thái lịch hẹn</Text>
              </View>
              <Text style={styles.chartSubTitle}>
                Phân bổ {totalCount} ca khám bệnh từ CSDL
              </Text>
            </View>

            {/* Nút bấm chuyển đổi loại biểu đồ đại trà: Tròn / Cột */}
            <View style={styles.chartToggleGroup}>
              <TouchableOpacity
                style={[
                  styles.chartToggleBtn,
                  chartType === 'PIE' && styles.chartToggleBtnActive,
                ]}
                activeOpacity={0.7}
                onPress={() => setChartType('PIE')}>
                <MaterialCommunityIcons
                  name="chart-arc"
                  size={14}
                  color={chartType === 'PIE' ? '#FFFFFF' : '#64748B'}
                />
                <Text
                  style={[
                    styles.chartToggleText,
                    chartType === 'PIE' && styles.chartToggleTextActive,
                  ]}>
                  Tròn
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.chartToggleBtn,
                  chartType === 'BAR' && styles.chartToggleBtnActive,
                ]}
                activeOpacity={0.7}
                onPress={() => setChartType('BAR')}>
                <MaterialCommunityIcons
                  name="chart-bar"
                  size={14}
                  color={chartType === 'BAR' ? '#FFFFFF' : '#64748B'}
                />
                <Text
                  style={[
                    styles.chartToggleText,
                    chartType === 'BAR' && styles.chartToggleTextActive,
                  ]}>
                  Cột
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Nội dung Biểu đồ theo lựa chọn */}
          {chartType === 'PIE' ? (
            /* BIỂU ĐỒ TRÒN (DONUT CHART ĐẠI TRÀ) */
            <View style={styles.pieChartContainer}>
              <View style={styles.pieWrapper}>
                <PieChart
                  data={pieData}
                  donut
                  radius={58}
                  innerRadius={38}
                  innerCircleColor={'#FFFFFF'}
                  centerLabelComponent={() => (
                    <View style={styles.pieCenterLabel}>
                      <Text style={styles.pieCenterCount}>{totalCount}</Text>
                      <Text style={styles.pieCenterSub}>Ca khám</Text>
                    </View>
                  )}
                />
              </View>

              {/* Chú thích (Legend) dạng hàng ngang/dọc gọn gàng */}
              <View style={styles.pieLegendContainer}>
                {statusItems.map((item) => (
                  <View key={`pie-item-${item.id}`} style={styles.legendRow}>
                    <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                    <Text style={styles.legendLabel}>{item.label}</Text>
                    <Text style={styles.legendCount}>{item.count} ca</Text>
                    <View style={[styles.legendPercentBadge, { backgroundColor: item.bgColor }]}>
                      <Text style={[styles.legendPercentText, { color: item.color }]}>
                        {item.percent}%
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          ) : (
            /* BIỂU ĐỒ CỘT (BAR CHART ĐẠI TRÀ) */
            <View style={styles.barChartWrapper}>
              <BarChart
                data={barData}
                barWidth={32}
                spacing={26}
                noOfSections={4}
                height={130}
                barBorderRadius={5}
                isAnimated
                yAxisTextStyle={{ color: '#94A3B8', fontSize: 10 }}
                xAxisLabelTextStyle={{ color: '#475569', fontSize: 11, fontWeight: '600' }}
                maxValue={Math.max(...barData.map((d) => d.value), 4) + 1}
              />
            </View>
          )}
        </Card.Content>
      </Card>

      {/* 4. Quick Action Buttons */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.primaryActionBtn}
          activeOpacity={0.8}
          onPress={onOpenCreateHospital}>
          <MaterialCommunityIcons name="plus-box" size={17} color="#FFFFFF" />
          <Text style={styles.primaryActionText}>Thêm bệnh viện mới</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryActionBtn}
          activeOpacity={0.8}
          onPress={onNavigateToHospitals}>
          <MaterialCommunityIcons
            name="clipboard-list-outline"
            size={17}
            color={MedicalColors.primary}
          />
          <Text style={styles.secondaryActionText}>Quản lý bệnh viện</Text>
        </TouchableOpacity>
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
    width: '100%',
    maxWidth: 1000,
    alignSelf: 'center',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: 120,
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

  // 1. Welcome Banner
  welcomeBanner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    marginBottom: 12,
    elevation: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
  },
  welcomeBannerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  adminInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  adminAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  serverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  dbIndicator: {
    fontSize: 10,
    color: '#059669',
    fontWeight: '600',
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

  // 2. Section Header
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 0.5,
  },
  syncTimeText: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '500',
  },

  // 3. Stats Grid: 2 cột gọn gàng (width: 48%) trên mọi kích thước màn hình
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 12,
  },
  statCard: {
    width: '48%',
    minHeight: 105,
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 12,
    borderLeftWidth: 3.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1.5,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statIconBox: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statBadgeSuccess: {
    fontSize: 9,
    fontWeight: '700',
    color: '#16A34A',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statBadgeInfo: {
    fontSize: 9,
    fontWeight: '700',
    color: '#0284C7',
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statBadgePatient: {
    fontSize: 9,
    fontWeight: '700',
    color: '#0D9488',
    backgroundColor: '#CCFBF1',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statBadgeWarn: {
    fontSize: 9,
    fontWeight: '700',
    color: '#D97706',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  statSubText: {
    fontSize: 10,
    color: '#94A3B8',
  },
  revenueText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#16A34A',
  },

  // 4. Chart Card & Analytics
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    marginBottom: 12,
    elevation: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
  },
  chartCardContent: {
    padding: 14,
  },
  chartHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  chartTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chartTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  chartSubTitle: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  chartToggleGroup: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    padding: 3,
    gap: 2,
  },
  chartToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  chartToggleBtnActive: {
    backgroundColor: MedicalColors.primary,
  },
  chartToggleText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
  },
  chartToggleTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // Biểu đồ tròn (Donut Layout)
  pieChartContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 8,
  },
  pieWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pieCenterLabel: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pieCenterCount: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0F172A',
  },
  pieCenterSub: {
    fontSize: 9,
    color: '#64748B',
    fontWeight: '600',
  },
  pieLegendContainer: {
    flex: 1,
    paddingLeft: 14,
    gap: 8,
    justifyContent: 'center',
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    fontSize: 11,
    color: '#334155',
    fontWeight: '600',
    flex: 1,
  },
  legendCount: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F172A',
  },
  legendPercentBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    minWidth: 34,
    alignItems: 'center',
  },
  legendPercentText: {
    fontSize: 10,
    fontWeight: '700',
  },

  // Biểu đồ cột (Bar Chart Layout)
  barChartWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
    paddingBottom: 4,
  },
  barTopLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 4,
  },

  // 5. Actions Row
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  primaryActionBtn: {
    flex: 1,
    backgroundColor: MedicalColors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 9,
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  secondaryActionBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: MedicalColors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 9,
  },
  secondaryActionText: {
    color: MedicalColors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
});
