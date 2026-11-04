import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  ScrollView,
  Image,
  Alert,
  RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Card, Divider } from 'react-native-paper';
import { appointmentService } from '@/services/appointment-service';
import { useAuth } from '@/context/auth-context';
import { MedicalColors, Spacing } from '@/constants/theme';

export function AppointmentManagementView({ onBackToHome }) {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
    rejected: 0,
    today: 0,
  });

  // Filters
  const [keyword, setKeyword] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedDateFilter, setSelectedDateFilter] = useState('all'); // 'all' | 'today' | 'upcoming'

  // Modals
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  // Cancel / Reject Modal State
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [targetAppointment, setTargetAppointment] = useState(null);
  const [cancellationType, setCancellationType] = useState('CANCELLED'); // 'CANCELLED' | 'REJECTED'
  const [selectedReasonTemplate, setSelectedReasonTemplate] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [actionSubmitting, setActionSubmitting] = useState(false);

  const CANCELLATION_REASONS = [
    'Bác sĩ có ca phẫu thuật hoặc công tác đột xuất',
    'Bệnh nhân chủ động liên hệ yêu cầu dời hoặc hủy lịch',
    'Không thể liên lạc được qua số điện thoại đăng ký',
    'Khung giờ khám quá tải hoặc phòng khám bảo trì thiết bị',
    'Thông tin đăng ký không chính xác hoặc trùng lặp',
  ];

  const loadAppointments = useCallback(async () => {
    try {
      const [list, statsData] = await Promise.all([
        appointmentService.getAppointments({
          keyword,
          status: selectedStatus,
          date: selectedDateFilter,
        }),
        appointmentService.getAppointmentStats(),
      ]);
      setAppointments(list);
      setStats(statsData);
    } catch (err) {
      console.warn('Lỗi tải danh sách lịch hẹn:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [keyword, selectedStatus, selectedDateFilter]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  const onRefresh = () => {
    setRefreshing(true);
    loadAppointments();
  };

  const openDetail = (item) => {
    setSelectedAppointment(item);
    setDetailModalVisible(true);
  };

  const closeDetail = () => {
    setDetailModalVisible(false);
    setSelectedAppointment(null);
  };

  const openCancelModal = (item, type = 'CANCELLED') => {
    setTargetAppointment(item);
    setCancellationType(type);
    setSelectedReasonTemplate(CANCELLATION_REASONS[0]);
    setCustomReason('');
    setCancelModalVisible(true);
  };

  const closeCancelModal = () => {
    setCancelModalVisible(false);
    setTargetAppointment(null);
    setCustomReason('');
  };

  // Xác nhận lịch hẹn (Confirm)
  const handleConfirmAppointment = (appointment) => {
    Alert.alert(
      'Xác nhận duyệt lịch hẹn',
      `Bạn có chắc chắn muốn xác nhận lịch hẹn ${appointment.appointment_code} cho bệnh nhân "${appointment.patient_name}" vào ngày ${appointment.appointment_date} (${appointment.start_time} - ${appointment.end_time})?`,
      [
        { text: 'Đóng', style: 'cancel' },
        {
          text: 'Xác nhận duyệt',
          onPress: async () => {
            try {
              await appointmentService.confirmAppointment(
                appointment.id,
                'Quản trị viên đã xác nhận duyệt lịch hẹn.',
                user?.id || 1
              );
              Alert.alert('Thành công', 'Đã duyệt và xác nhận lịch hẹn thành công!');
              loadAppointments();
              if (selectedAppointment && selectedAppointment.id === appointment.id) {
                closeDetail();
              }
            } catch (err) {
              Alert.alert('Lỗi xác nhận', err.message || 'Không thể xác nhận lịch hẹn.');
            }
          },
        },
      ]
    );
  };

  // Hoàn thành lịch hẹn (Completed)
  const handleCompleteAppointment = (appointment) => {
    Alert.alert(
      'Đánh dấu hoàn thành',
      `Đánh dấu ca khám ${appointment.appointment_code} của bệnh nhân "${appointment.patient_name}" đã hoàn thành khám?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đồng ý',
          onPress: async () => {
            try {
              await appointmentService.updateAppointmentStatus(
                appointment.id,
                'COMPLETED',
                'Quản trị viên đã đánh dấu hoàn thành ca khám.',
                user?.id || 1
              );
              Alert.alert('Thành công', 'Ca khám đã được đánh dấu hoàn thành!');
              loadAppointments();
              if (selectedAppointment && selectedAppointment.id === appointment.id) {
                closeDetail();
              }
            } catch (err) {
              Alert.alert('Lỗi', err.message || 'Không thể cập nhật trạng thái.');
            }
          },
        },
      ]
    );
  };

  // Submit Cancel / Reject
  const handleSubmitCancel = async () => {
    if (!targetAppointment) return;
    const finalReason = customReason.trim() || selectedReasonTemplate;
    if (!finalReason) {
      Alert.alert('Lỗi', 'Vui lòng chọn hoặc nhập lý do hủy / từ chối.');
      return;
    }

    setActionSubmitting(true);
    try {
      await appointmentService.cancelAppointment(
        targetAppointment.id,
        finalReason,
        cancellationType,
        user?.id || 1,
        finalReason
      );

      Alert.alert(
        'Đã xử lý',
        `Đã ${cancellationType === 'REJECTED' ? 'từ chối' : 'hủy'} lịch hẹn ${targetAppointment.appointment_code} thành công!`
      );
      closeCancelModal();
      if (selectedAppointment && selectedAppointment.id === targetAppointment.id) {
        closeDetail();
      }
      loadAppointments();
    } catch (err) {
      Alert.alert('Lỗi', err.message || 'Không thể hủy lịch hẹn.');
    } finally {
      setActionSubmitting(false);
    }
  };

  const formatVND = (num) => {
    if (!num) return '0 đ';
    return Number(num).toLocaleString('vi-VN') + ' đ';
  };

  const getStatusBadgeConfig = (status) => {
    switch (status) {
      case 'PENDING':
        return {
          label: 'Chờ duyệt',
          bgColor: '#FEF3C7',
          textColor: '#D97706',
          dotColor: '#F59E0B',
          icon: 'clock-alert-outline',
        };
      case 'CONFIRMED':
        return {
          label: 'Đã xác nhận',
          bgColor: '#DCFCE7',
          textColor: '#15803D',
          dotColor: '#16A34A',
          icon: 'check-decagram-outline',
        };
      case 'COMPLETED':
        return {
          label: 'Đã khám xong',
          bgColor: '#E0F2FE',
          textColor: '#0369A1',
          dotColor: '#0284C7',
          icon: 'check-all',
        };
      case 'CANCELLED':
        return {
          label: 'Đã hủy',
          bgColor: '#F1F5F9',
          textColor: '#64748B',
          dotColor: '#94A3B8',
          icon: 'close-circle-outline',
        };
      case 'REJECTED':
        return {
          label: 'Bị từ chối',
          bgColor: '#FEE2E2',
          textColor: '#DC2626',
          dotColor: '#EF4444',
          icon: 'cancel',
        };
      case 'NO_SHOW':
        return {
          label: 'Vắng mặt',
          bgColor: '#EDE9FE',
          textColor: '#7C3AED',
          dotColor: '#8B5CF6',
          icon: 'account-remove-outline',
        };
      default:
        return {
          label: status,
          bgColor: '#F1F5F9',
          textColor: '#475569',
          dotColor: '#64748B',
          icon: 'information-outline',
        };
    }
  };

  return (
    <View style={styles.container}>
      {/* 1. Header */}
      <View style={styles.topHeader}>
        <View style={styles.headerLeftRow}>
          {onBackToHome && (
            <TouchableOpacity style={styles.backButton} onPress={onBackToHome}>
              <MaterialCommunityIcons name="arrow-left" size={24} color="#1E293B" />
            </TouchableOpacity>
          )}
          <View>
            <Text style={styles.headerTitle}>DANH SÁCH LỊCH HẸN</Text>
            <Text style={styles.headerSubTitle}>Xác nhận, tiếp nhận & xử lý yêu cầu khám bệnh</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.refreshIconBtn} onPress={onRefresh}>
          <MaterialCommunityIcons name="refresh" size={20} color={MedicalColors.primary} />
        </TouchableOpacity>
      </View>

      {/* 2. KPI Cards Bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.kpiScrollContent}
        style={styles.kpiScroll}>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiValue}>{stats.total}</Text>
          <Text style={styles.kpiLabel}>Tất cả ca</Text>
        </View>

        <View style={[styles.kpiCard, { borderColor: '#FCD34D' }]}>
          <Text style={[styles.kpiValue, { color: '#D97706' }]}>{stats.pending}</Text>
          <Text style={styles.kpiLabel}>Chờ duyệt</Text>
        </View>

        <View style={[styles.kpiCard, { borderColor: '#86EFAC' }]}>
          <Text style={[styles.kpiValue, { color: '#16A34A' }]}>{stats.confirmed}</Text>
          <Text style={styles.kpiLabel}>Đã xác nhận</Text>
        </View>

        <View style={[styles.kpiCard, { borderColor: '#7DD3FC' }]}>
          <Text style={[styles.kpiValue, { color: '#0284C7' }]}>{stats.completed}</Text>
          <Text style={styles.kpiLabel}>Đã khám</Text>
        </View>

        <View style={[styles.kpiCard, { borderColor: '#FCA5A5' }]}>
          <Text style={[styles.kpiValue, { color: '#DC2626' }]}>
            {stats.cancelled + stats.rejected}
          </Text>
          <Text style={styles.kpiLabel}>Đã hủy / Từ chối</Text>
        </View>
      </ScrollView>

      {/* 3. Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchBox}>
          <MaterialCommunityIcons name="magnify" size={20} color="#64748B" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm theo mã lịch hẹn, tên BN, số ĐT, bác sĩ..."
            placeholderTextColor={MedicalColors.textMuted}
            value={keyword}
            onChangeText={setKeyword}
          />
          {keyword ? (
            <TouchableOpacity onPress={() => setKeyword('')}>
              <MaterialCommunityIcons name="close-circle" size={18} color="#94A3B8" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* 4. Filter Row: Status & Date */}
      <View style={styles.filterSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterPillsRow}>
          <TouchableOpacity
            style={[styles.filterPill, selectedStatus === 'ALL' && styles.filterPillActive]}
            onPress={() => setSelectedStatus('ALL')}>
            <Text style={[styles.filterPillText, selectedStatus === 'ALL' && styles.filterPillTextActive]}>
              Tất cả
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterPill, selectedStatus === 'PENDING' && styles.filterPillActive]}
            onPress={() => setSelectedStatus('PENDING')}>
            <View style={[styles.filterDot, { backgroundColor: '#F59E0B' }]} />
            <Text style={[styles.filterPillText, selectedStatus === 'PENDING' && styles.filterPillTextActive]}>
              Chờ duyệt ({stats.pending})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterPill, selectedStatus === 'CONFIRMED' && styles.filterPillActive]}
            onPress={() => setSelectedStatus('CONFIRMED')}>
            <View style={[styles.filterDot, { backgroundColor: '#16A34A' }]} />
            <Text style={[styles.filterPillText, selectedStatus === 'CONFIRMED' && styles.filterPillTextActive]}>
              Đã xác nhận ({stats.confirmed})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterPill, selectedStatus === 'COMPLETED' && styles.filterPillActive]}
            onPress={() => setSelectedStatus('COMPLETED')}>
            <View style={[styles.filterDot, { backgroundColor: '#0284C7' }]} />
            <Text style={[styles.filterPillText, selectedStatus === 'COMPLETED' && styles.filterPillTextActive]}>
              Đã khám ({stats.completed})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterPill, selectedStatus === 'CANCELLED' && styles.filterPillActive]}
            onPress={() => setSelectedStatus('CANCELLED')}>
            <View style={[styles.filterDot, { backgroundColor: '#94A3B8' }]} />
            <Text style={[styles.filterPillText, selectedStatus === 'CANCELLED' && styles.filterPillTextActive]}>
              Đã hủy ({stats.cancelled})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterPill, selectedStatus === 'REJECTED' && styles.filterPillActive]}
            onPress={() => setSelectedStatus('REJECTED')}>
            <View style={[styles.filterDot, { backgroundColor: '#DC2626' }]} />
            <Text style={[styles.filterPillText, selectedStatus === 'REJECTED' && styles.filterPillTextActive]}>
              Từ chối ({stats.rejected})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterPill, selectedDateFilter === 'today' && styles.filterPillActive]}
            onPress={() => setSelectedDateFilter(selectedDateFilter === 'today' ? 'all' : 'today')}>
            <MaterialCommunityIcons name="calendar-today" size={14} color={selectedDateFilter === 'today' ? '#0284C7' : '#64748B'} />
            <Text style={[styles.filterPillText, { marginLeft: 4 }, selectedDateFilter === 'today' && styles.filterPillTextActive]}>
              Hôm nay ({stats.today || 0})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterPill, selectedDateFilter === 'upcoming' && styles.filterPillActive]}
            onPress={() => setSelectedDateFilter(selectedDateFilter === 'upcoming' ? 'all' : 'upcoming')}>
            <MaterialCommunityIcons name="calendar-arrow-right" size={14} color={selectedDateFilter === 'upcoming' ? '#0284C7' : '#64748B'} />
            <Text style={[styles.filterPillText, { marginLeft: 4 }, selectedDateFilter === 'upcoming' && styles.filterPillTextActive]}>
              Sắp tới
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* 5. Appointment List */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={MedicalColors.primary} />
          <Text style={styles.loadingText}>Đang tải danh sách lịch khám...</Text>
        </View>
      ) : (
        <FlatList
          data={appointments}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[MedicalColors.primary]} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="calendar-clock" size={56} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>Không có lịch hẹn nào</Text>
              <Text style={styles.emptySub}>Thử thay đổi bộ lọc trạng thái hoặc từ khóa tìm kiếm.</Text>
            </View>
          }
          renderItem={({ item }) => {
            const statusConfig = getStatusBadgeConfig(item.status);
            const isPending = item.status === 'PENDING';
            const isConfirmed = item.status === 'CONFIRMED';

            return (
              <TouchableOpacity activeOpacity={0.88} onPress={() => openDetail(item)}>
                <Card style={styles.appCard} mode="elevated">
                  <Card.Content style={styles.appCardContent}>
                    {/* Top Row: Code & Status */}
                    <View style={styles.cardTopRow}>
                      <View style={styles.codeBadge}>
                        <MaterialCommunityIcons name="ticket-confirmation-outline" size={16} color="#0284C7" />
                        <Text style={styles.codeText}>{item.appointment_code}</Text>
                      </View>

                      <View style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}>
                        <View style={[styles.statusDot, { backgroundColor: statusConfig.dotColor }]} />
                        <Text style={[styles.statusBadgeText, { color: statusConfig.textColor }]}>
                          {statusConfig.label}
                        </Text>
                      </View>
                    </View>

                    <Divider style={styles.cardDivider} />

                    {/* Patient & Doctor Row */}
                    <View style={styles.mainInfoRow}>
                      {/* Patient Info */}
                      <View style={styles.patientInfoCol}>
                        <View style={styles.userRow}>
                          <MaterialCommunityIcons name="account" size={18} color="#0F172A" />
                          <Text style={styles.patientName}>{item.patient_name}</Text>
                        </View>
                        <Text style={styles.patientSub}>
                          📞 {item.patient_phone} {item.patient_gender ? `• ${item.patient_gender === 'MALE' ? 'Nam' : 'Nữ'}` : ''}
                        </Text>
                      </View>

                      {/* Doctor Info */}
                      <View style={styles.doctorInfoCol}>
                        <View style={styles.userRow}>
                          <MaterialCommunityIcons name="doctor" size={18} color="#0284C7" />
                          <Text style={styles.doctorName} numberOfLines={1}>
                            {item.doctor_name}
                          </Text>
                        </View>
                        <Text style={styles.doctorSub} numberOfLines={1}>
                          {item.hospital_name} {item.room_number ? `(${item.room_number})` : ''}
                        </Text>
                      </View>
                    </View>

                    {/* Schedule & Fee Details */}
                    <View style={styles.scheduleFeeRow}>
                      <View style={styles.timeScheduleBox}>
                        <MaterialCommunityIcons name="calendar-month-outline" size={16} color="#0369A1" />
                        <Text style={styles.timeScheduleText}>
                          {item.appointment_date} ({item.start_time} - {item.end_time})
                        </Text>
                      </View>

                      <View style={styles.feeBox}>
                        <Text style={styles.feeText}>{formatVND(item.consultation_fee)}</Text>
                      </View>
                    </View>

                    {/* Symptoms preview */}
                    {item.symptoms ? (
                      <View style={styles.symptomsPreviewBox}>
                        <Text style={styles.symptomsLabel}>Triệu chứng:</Text>
                        <Text style={styles.symptomsText} numberOfLines={1}>
                          {item.symptoms}
                        </Text>
                      </View>
                    ) : null}

                    {/* Cancellation reason preview if cancelled */}
                    {item.cancellation_reason ? (
                      <View style={styles.cancelReasonBox}>
                        <MaterialCommunityIcons name="information" size={14} color="#DC2626" />
                        <Text style={styles.cancelReasonText} numberOfLines={1}>
                          Lý do hủy: {item.cancellation_reason}
                        </Text>
                      </View>
                    ) : null}

                    {/* Action Buttons Row */}
                    <View style={styles.cardActionsRow}>
                      {isPending && (
                        <TouchableOpacity
                          style={styles.confirmActionBtn}
                          activeOpacity={0.8}
                          onPress={() => handleConfirmAppointment(item)}>
                          <MaterialCommunityIcons name="check-circle" size={16} color="#FFFFFF" />
                          <Text style={styles.confirmActionBtnText}>Xác nhận duyệt</Text>
                        </TouchableOpacity>
                      )}

                      {isConfirmed && (
                        <TouchableOpacity
                          style={styles.completeActionBtn}
                          activeOpacity={0.8}
                          onPress={() => handleCompleteAppointment(item)}>
                          <MaterialCommunityIcons name="check-all" size={16} color="#FFFFFF" />
                          <Text style={styles.completeActionBtnText}>Đã khám xong</Text>
                        </TouchableOpacity>
                      )}

                      {(isPending || isConfirmed) && (
                        <TouchableOpacity
                          style={styles.cancelActionBtn}
                          activeOpacity={0.8}
                          onPress={() => openCancelModal(item, isPending ? 'REJECTED' : 'CANCELLED')}>
                          <MaterialCommunityIcons
                            name="close-circle-outline"
                            size={16}
                            color="#DC2626"
                          />
                          <Text style={styles.cancelActionBtnText}>
                            {isPending ? 'Từ chối' : 'Hủy lịch'}
                          </Text>
                        </TouchableOpacity>
                      )}

                      <TouchableOpacity
                        style={styles.detailActionBtn}
                        activeOpacity={0.8}
                        onPress={() => openDetail(item)}>
                        <MaterialCommunityIcons name="eye-outline" size={16} color="#0284C7" />
                        <Text style={styles.detailActionBtnText}>Chi tiết</Text>
                      </TouchableOpacity>
                    </View>
                  </Card.Content>
                </Card>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* =========================================================================
          MODAL: APPOINTMENT DETAIL
      ========================================================================= */}
      <Modal
        visible={detailModalVisible && !!selectedAppointment}
        animationType="slide"
        transparent={true}
        onRequestClose={closeDetail}>
        <View style={styles.modalOverlay}>
          <View style={styles.detailModalContainer}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Chi tiết lịch hẹn khám</Text>
                <Text style={styles.modalSubTitle}>Mã: {selectedAppointment?.appointment_code}</Text>
              </View>
              <TouchableOpacity style={styles.closeModalBtn} onPress={closeDetail}>
                <MaterialCommunityIcons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            {selectedAppointment && (
              <ScrollView style={styles.detailScroll} showsVerticalScrollIndicator={false}>
                {/* Status Hero Card */}
                {(() => {
                  const cfg = getStatusBadgeConfig(selectedAppointment.status);
                  return (
                    <View style={[styles.detailHeroStatus, { backgroundColor: cfg.bgColor }]}>
                      <MaterialCommunityIcons name={cfg.icon} size={28} color={cfg.textColor} />
                      <View style={{ marginLeft: 12 }}>
                        <Text style={[styles.detailHeroStatusTitle, { color: cfg.textColor }]}>
                          TRẠNG THÁI: {cfg.label.toUpperCase()}
                        </Text>
                        <Text style={styles.detailHeroStatusSub}>
                          Mã số phiếu: {selectedAppointment.appointment_code}
                        </Text>
                      </View>
                    </View>
                  );
                })()}

                {/* Patient Information Section */}
                <View style={styles.detailCardSection}>
                  <Text style={styles.detailCardTitle}>THÔNG TIN NGƯỜI BỆNH</Text>

                  <View style={styles.detailDataRow}>
                    <Text style={styles.detailLabel}>Họ và tên:</Text>
                    <Text style={styles.detailValueBold}>{selectedAppointment.patient_name}</Text>
                  </View>

                  <View style={styles.detailDataRow}>
                    <Text style={styles.detailLabel}>Số điện thoại:</Text>
                    <Text style={styles.detailValue}>{selectedAppointment.patient_phone}</Text>
                  </View>

                  <View style={styles.detailDataRow}>
                    <Text style={styles.detailLabel}>Giới tính:</Text>
                    <Text style={styles.detailValue}>
                      {selectedAppointment.patient_gender === 'MALE'
                        ? 'Nam'
                        : selectedAppointment.patient_gender === 'FEMALE'
                        ? 'Nữ'
                        : 'Khác'}
                    </Text>
                  </View>

                  {selectedAppointment.patient_dob ? (
                    <View style={styles.detailDataRow}>
                      <Text style={styles.detailLabel}>Ngày sinh:</Text>
                      <Text style={styles.detailValue}>{selectedAppointment.patient_dob}</Text>
                    </View>
                  ) : null}

                  {selectedAppointment.symptoms ? (
                    <View style={[styles.detailDataRow, { alignItems: 'flex-start' }]}>
                      <Text style={styles.detailLabel}>Triệu chứng:</Text>
                      <Text style={[styles.detailValue, { flex: 1, color: '#DC2626' }]}>
                        {selectedAppointment.symptoms}
                      </Text>
                    </View>
                  ) : null}
                </View>

                {/* Doctor & Hospital Information Section */}
                <View style={styles.detailCardSection}>
                  <Text style={styles.detailCardTitle}>BÁC SĨ & ĐỊA ĐIỂM KHÁM</Text>

                  <View style={styles.doctorMiniCard}>
                    <Image
                      source={{
                        uri:
                          selectedAppointment.doctor_avatar ||
                          'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300',
                      }}
                      style={styles.doctorMiniAvatar}
                    />
                    <View style={{ marginLeft: 10, flex: 1 }}>
                      <Text style={styles.doctorMiniName}>{selectedAppointment.doctor_name}</Text>
                      <Text style={styles.doctorMiniQual}>
                        {selectedAppointment.doctor_qualification || 'Bác sĩ'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.detailDataRow}>
                    <Text style={styles.detailLabel}>Bệnh viện:</Text>
                    <Text style={styles.detailValueBold}>{selectedAppointment.hospital_name}</Text>
                  </View>

                  <View style={styles.detailDataRow}>
                    <Text style={styles.detailLabel}>Địa chỉ:</Text>
                    <Text style={styles.detailValue}>{selectedAppointment.hospital_address || 'Địa chỉ bệnh viện'}</Text>
                  </View>

                  <View style={styles.detailDataRow}>
                    <Text style={styles.detailLabel}>Phòng khám:</Text>
                    <Text style={styles.detailValue}>{selectedAppointment.room_number || 'P.101'}</Text>
                  </View>

                  <View style={styles.detailDataRow}>
                    <Text style={styles.detailLabel}>Giá khám bệnh:</Text>
                    <Text style={[styles.detailValueBold, { color: '#0284C7', fontSize: 14 }]}>
                      {formatVND(selectedAppointment.consultation_fee)}
                    </Text>
                  </View>
                </View>

                {/* Schedule Timing Section */}
                <View style={styles.detailCardSection}>
                  <Text style={styles.detailCardTitle}>THỜI GIAN KHÁM BỆNH</Text>

                  <View style={styles.detailDataRow}>
                    <Text style={styles.detailLabel}>Ngày khám:</Text>
                    <Text style={styles.detailValueBold}>{selectedAppointment.appointment_date}</Text>
                  </View>

                  <View style={styles.detailDataRow}>
                    <Text style={styles.detailLabel}>Khung giờ:</Text>
                    <Text style={[styles.detailValueBold, { color: '#16A34A' }]}>
                      {selectedAppointment.start_time} - {selectedAppointment.end_time}
                    </Text>
                  </View>

                  {selectedAppointment.cancellation_reason ? (
                    <View style={styles.cancelBoxDetail}>
                      <Text style={styles.cancelBoxTitle}>Lý do hủy / từ chối:</Text>
                      <Text style={styles.cancelBoxText}>{selectedAppointment.cancellation_reason}</Text>
                    </View>
                  ) : null}
                </View>

                {/* History Timeline */}
                {selectedAppointment.history && selectedAppointment.history.length > 0 && (
                  <View style={styles.detailCardSection}>
                    <Text style={styles.detailCardTitle}>NHẬT KÝ XỬ LÝ (TIMELINE)</Text>
                    {selectedAppointment.history.map((hist, idx) => (
                      <View key={hist.id || idx} style={styles.timelineItem}>
                        <View style={styles.timelineDot} />
                        <View style={styles.timelineContent}>
                          <Text style={styles.timelineStatus}>
                            Chuyển sang: <Text style={{ fontWeight: '800' }}>{hist.new_status}</Text>
                          </Text>
                          <Text style={styles.timelineNote}>{hist.note || 'Không có ghi chú'}</Text>
                          <Text style={styles.timelineMeta}>
                            Người thực hiện: {hist.changer_name || 'Hệ thống'} • {hist.created_at}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                {/* Action Buttons in Modal */}
                <View style={styles.detailModalActions}>
                  {selectedAppointment.status === 'PENDING' && (
                    <TouchableOpacity
                      style={styles.modalConfirmBtn}
                      onPress={() => handleConfirmAppointment(selectedAppointment)}>
                      <MaterialCommunityIcons name="check-circle" size={18} color="#FFFFFF" />
                      <Text style={styles.modalConfirmBtnText}>Xác nhận duyệt lịch</Text>
                    </TouchableOpacity>
                  )}

                  {selectedAppointment.status === 'CONFIRMED' && (
                    <TouchableOpacity
                      style={styles.modalCompleteBtn}
                      onPress={() => handleCompleteAppointment(selectedAppointment)}>
                      <MaterialCommunityIcons name="check-all" size={18} color="#FFFFFF" />
                      <Text style={styles.modalConfirmBtnText}>Đánh dấu đã khám xong</Text>
                    </TouchableOpacity>
                  )}

                  {(selectedAppointment.status === 'PENDING' ||
                    selectedAppointment.status === 'CONFIRMED') && (
                    <TouchableOpacity
                      style={styles.modalCancelBtn}
                      onPress={() => {
                        const app = selectedAppointment;
                        closeDetail();
                        setTimeout(() => openCancelModal(app, app.status === 'PENDING' ? 'REJECTED' : 'CANCELLED'), 150);
                      }}>
                      <MaterialCommunityIcons name="close-circle" size={18} color="#DC2626" />
                      <Text style={styles.modalCancelBtnText}>
                        {selectedAppointment.status === 'PENDING' ? 'Từ chối tiếp nhận' : 'Hủy lịch hẹn'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                <View style={{ height: 24 }} />
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* =========================================================================
          MODAL: CANCEL / REJECT WITH REASON
      ========================================================================= */}
      <Modal
        visible={cancelModalVisible && !!targetAppointment}
        animationType="fade"
        transparent={true}
        onRequestClose={closeCancelModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.cancelModalContainer}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>
                  {cancellationType === 'REJECTED' ? 'Từ chối lịch hẹn' : 'Hủy lịch hẹn khám'}
                </Text>
                <Text style={styles.modalSubTitle}>Mã phiếu: {targetAppointment?.appointment_code}</Text>
              </View>
              <TouchableOpacity style={styles.closeModalBtn} onPress={closeCancelModal}>
                <MaterialCommunityIcons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ padding: 16 }} showsVerticalScrollIndicator={false}>
              {/* Type Switcher */}
              <Text style={styles.inputLabel}>Hình thức xử lý:</Text>
              <View style={styles.cancelTypeRow}>
                <TouchableOpacity
                  style={[
                    styles.cancelTypeBtn,
                    cancellationType === 'CANCELLED' && styles.cancelTypeBtnActive,
                  ]}
                  onPress={() => setCancellationType('CANCELLED')}>
                  <MaterialCommunityIcons
                    name="calendar-remove"
                    size={16}
                    color={cancellationType === 'CANCELLED' ? '#FFFFFF' : '#64748B'}
                  />
                  <Text
                    style={[
                      styles.cancelTypeBtnText,
                      cancellationType === 'CANCELLED' && styles.cancelTypeBtnTextActive,
                    ]}>
                    Hủy lịch (CANCELLED)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.cancelTypeBtn,
                    cancellationType === 'REJECTED' && styles.cancelTypeBtnActiveRed,
                  ]}
                  onPress={() => setCancellationType('REJECTED')}>
                  <MaterialCommunityIcons
                    name="cancel"
                    size={16}
                    color={cancellationType === 'REJECTED' ? '#FFFFFF' : '#DC2626'}
                  />
                  <Text
                    style={[
                      styles.cancelTypeBtnText,
                      cancellationType === 'REJECTED' && styles.cancelTypeBtnTextActive,
                    ]}>
                    Từ chối (REJECTED)
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Patient info reminder */}
              <View style={styles.cancelPatientCard}>
                <Text style={styles.cancelPatientTitle}>Bệnh nhân: {targetAppointment?.patient_name}</Text>
                <Text style={styles.cancelPatientSub}>
                  Ngày khám: {targetAppointment?.appointment_date} ({targetAppointment?.start_time} - {targetAppointment?.end_time})
                </Text>
              </View>

              {/* Predefined Reasons */}
              <Text style={styles.inputLabel}>Chọn lý do nhanh:</Text>
              {CANCELLATION_REASONS.map((reason, index) => {
                const isSelected = selectedReasonTemplate === reason;
                return (
                  <TouchableOpacity
                    key={index}
                    style={[styles.reasonOption, isSelected && styles.reasonOptionActive]}
                    onPress={() => {
                      setSelectedReasonTemplate(reason);
                      setCustomReason(reason);
                    }}>
                    <MaterialCommunityIcons
                      name={isSelected ? 'radiobox-marked' : 'radiobox-blank'}
                      size={18}
                      color={isSelected ? '#0284C7' : '#94A3B8'}
                    />
                    <Text style={[styles.reasonText, isSelected && styles.reasonTextActive]}>
                      {reason}
                    </Text>
                  </TouchableOpacity>
                );
              })}

              {/* Custom reason input */}
              <Text style={[styles.inputLabel, { marginTop: 12 }]}>Hoặc nhập lý do cụ thể:</Text>
              <TextInput
                style={styles.reasonInput}
                placeholder="Nhập chi tiết nguyên nhân hủy / từ chối lịch khám..."
                multiline
                numberOfLines={3}
                value={customReason}
                onChangeText={setCustomReason}
              />
            </ScrollView>

            {/* Footer */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={closeCancelModal}
                disabled={actionSubmitting}>
                <Text style={styles.cancelBtnText}>Bỏ qua</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.submitCancelBtn,
                  cancellationType === 'REJECTED' && { backgroundColor: '#DC2626' },
                ]}
                onPress={handleSubmitCancel}
                disabled={actionSubmitting}>
                {actionSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="check" size={18} color="#FFFFFF" />
                    <Text style={styles.submitCancelBtnText}>
                      Xác nhận {cancellationType === 'REJECTED' ? 'từ chối' : 'hủy'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EDF5FA',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.two,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 6,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 0.3,
  },
  headerSubTitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  refreshIconBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#E0F2FE',
  },

  // KPI
  kpiScroll: {
    maxHeight: 70,
  },
  kpiScrollContent: {
    paddingHorizontal: Spacing.four,
    paddingVertical: 10,
    gap: 8,
  },
  kpiCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    minWidth: 80,
  },
  kpiValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#1E293B',
  },
  kpiLabel: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },

  // Search
  searchSection: {
    paddingHorizontal: Spacing.four,
    marginBottom: 8,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#1E293B',
  },

  // Filters
  filterSection: {
    marginBottom: 10,
  },
  filterPillsRow: {
    paddingHorizontal: Spacing.four,
    gap: 6,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterPillActive: {
    backgroundColor: '#E0F2FE',
    borderColor: '#38BDF8',
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  filterPillTextActive: {
    color: '#0369A1',
    fontWeight: '800',
  },
  filterDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },

  // List
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 13,
    color: '#64748B',
  },
  listContent: {
    paddingHorizontal: Spacing.four,
    paddingBottom: 90,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#475569',
    marginTop: 12,
  },
  emptySub: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 4,
  },

  // Card
  appCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#0F172A',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  appCardContent: {
    padding: 12,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  codeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  codeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0369A1',
    marginLeft: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  cardDivider: {
    marginVertical: 10,
    backgroundColor: '#F1F5F9',
  },
  mainInfoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  patientInfoCol: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: '#F1F5F9',
    paddingRight: 8,
  },
  doctorInfoCol: {
    flex: 1,
    paddingLeft: 8,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  patientName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginLeft: 4,
  },
  patientSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  doctorName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0284C7',
    marginLeft: 4,
    flex: 1,
  },
  doctorSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  scheduleFeeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: 8,
    marginTop: 6,
  },
  timeScheduleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  timeScheduleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0369A1',
    marginLeft: 6,
  },
  feeBox: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  feeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#B45309',
  },
  symptomsPreviewBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    paddingHorizontal: 4,
  },
  symptomsLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginRight: 4,
  },
  symptomsText: {
    fontSize: 11,
    color: '#334155',
    flex: 1,
  },
  cancelReasonBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    padding: 6,
    borderRadius: 6,
    marginTop: 6,
  },
  cancelReasonText: {
    fontSize: 11,
    color: '#DC2626',
    marginLeft: 4,
    fontWeight: '600',
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 8,
  },
  confirmActionBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16A34A',
    paddingVertical: 8,
    borderRadius: 8,
  },
  confirmActionBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
    marginLeft: 4,
  },
  completeActionBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: MedicalColors.primary,
    paddingVertical: 8,
    borderRadius: 8,
  },
  completeActionBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
    marginLeft: 4,
  },
  cancelActionBtn: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    paddingVertical: 8,
    borderRadius: 8,
  },
  cancelActionBtnText: {
    color: '#DC2626',
    fontWeight: '700',
    fontSize: 12,
    marginLeft: 4,
  },
  detailActionBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    paddingVertical: 8,
    borderRadius: 8,
  },
  detailActionBtnText: {
    color: '#0284C7',
    fontWeight: '700',
    fontSize: 12,
    marginLeft: 4,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    padding: Spacing.three,
  },
  detailModalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSubTitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  closeModalBtn: {
    padding: 6,
  },
  detailScroll: {
    padding: 16,
  },
  detailHeroStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    marginBottom: 14,
  },
  detailHeroStatusTitle: {
    fontSize: 14,
    fontWeight: '900',
  },
  detailHeroStatusSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  detailCardSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  detailCardTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0284C7',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  detailDataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailLabel: {
    fontSize: 12,
    color: '#64748B',
    width: 95,
  },
  detailValue: {
    fontSize: 12,
    color: '#1E293B',
    flex: 1,
  },
  detailValueBold: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
    flex: 1,
  },
  doctorMiniCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  doctorMiniAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E2E8F0',
  },
  doctorMiniName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  doctorMiniQual: {
    fontSize: 11,
    color: '#0284C7',
    fontWeight: '600',
  },
  cancelBoxDetail: {
    backgroundColor: '#FEE2E2',
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  cancelBoxTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#DC2626',
  },
  cancelBoxText: {
    fontSize: 12,
    color: '#991B1B',
    marginTop: 2,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: MedicalColors.primary,
    marginTop: 5,
    marginRight: 8,
  },
  timelineContent: {
    flex: 1,
  },
  timelineStatus: {
    fontSize: 12,
    color: '#0F172A',
  },
  timelineNote: {
    fontSize: 11,
    color: '#475569',
    marginTop: 2,
  },
  timelineMeta: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },
  detailModalActions: {
    gap: 8,
    marginTop: 8,
  },
  modalConfirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16A34A',
    paddingVertical: 12,
    borderRadius: 10,
  },
  modalConfirmBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
    marginLeft: 6,
  },
  modalCompleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: MedicalColors.primary,
    paddingVertical: 12,
    borderRadius: 10,
  },
  modalCancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    paddingVertical: 12,
    borderRadius: 10,
  },
  modalCancelBtnText: {
    color: '#DC2626',
    fontWeight: '800',
    fontSize: 14,
    marginLeft: 6,
  },

  // Cancel Modal
  cancelModalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    maxHeight: '85%',
    overflow: 'hidden',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  cancelTypeRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  cancelTypeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cancelTypeBtnActive: {
    backgroundColor: '#64748B',
    borderColor: '#475569',
  },
  cancelTypeBtnActiveRed: {
    backgroundColor: '#DC2626',
    borderColor: '#B91C1C',
  },
  cancelTypeBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    marginLeft: 4,
  },
  cancelTypeBtnTextActive: {
    color: '#FFFFFF',
  },
  cancelPatientCard: {
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  cancelPatientTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  cancelPatientSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 6,
  },
  reasonOptionActive: {
    backgroundColor: '#E0F2FE',
    borderColor: '#38BDF8',
  },
  reasonText: {
    fontSize: 12,
    color: '#334155',
    marginLeft: 8,
    flex: 1,
  },
  reasonTextActive: {
    color: '#0369A1',
    fontWeight: '700',
  },
  reasonInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    padding: 10,
    fontSize: 12,
    color: '#0F172A',
    height: 70,
    textAlignVertical: 'top',
  },
  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 10,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  submitCancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DC2626',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  submitCancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 6,
  },
});
