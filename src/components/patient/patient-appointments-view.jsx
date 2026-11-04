import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { patientBookingApi as api } from '../../services/patientBookingApi';
import { DoctorAvatar } from './data-images';

const STATUS_META = {
  pending: {
    label: 'Chờ xác nhận',
    color: '#D97706',
    bg: '#FEF3C7',
    border: '#FDE68A',
    icon: 'clock-outline',
  },
  confirmed: {
    label: 'Đã xác nhận',
    color: '#0284C7',
    bg: '#E0F2FE',
    border: '#BAE6FD',
    icon: 'check-decagram-outline',
  },
  completed: {
    label: 'Đã khám',
    color: '#059669',
    bg: '#D1FAE5',
    border: '#A7F3D0',
    icon: 'check-circle-outline',
  },
  cancelled: {
    label: 'Đã hủy',
    color: '#DC2626',
    bg: '#FEE2E2',
    border: '#FECACA',
    icon: 'close-circle-outline',
  },
  rejected: {
    label: 'Từ chối',
    color: '#DC2626',
    bg: '#FEE2E2',
    border: '#FECACA',
    icon: 'alert-circle-outline',
  },
};

const FILTER_TABS = [
  { key: 'ALL', label: 'Tất cả' },
  { key: 'pending', label: 'Chờ duyệt' },
  { key: 'confirmed', label: 'Đã xác nhận' },
  { key: 'completed', label: 'Đã khám' },
  { key: 'cancelled', label: 'Đã hủy' },
];

function formatDisplayDate(dateStr) {
  if (!dateStr) return '—';
  const clean = String(dateStr).slice(0, 10);
  const parts = clean.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return clean;
}

function formatCurrency(amount) {
  const num = Number(amount);
  if (!Number.isFinite(num) || num <= 0) return 'Miễn phí / Theo bảng giá viện';
  return `${new Intl.NumberFormat('vi-VN').format(num)} đ`;
}

export function PatientAppointmentsView({
  onNavigateToBook,
  onNavigateToDoctorDetail,
  onBack,
}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [cancellingItem, setCancellingItem] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const loadHistory = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await api.history();
      setItems(Array.isArray(data) ? data : []);
      setError('');
    } catch (e) {
      setError(e?.message || 'Không thể tải danh sách lịch khám.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleConfirmCancel = async () => {
    if (!cancellingItem) return;
    setIsCancelling(true);
    try {
      await api.cancel(cancellingItem._id);
      setCancellingItem(null);
      await loadHistory(true);
    } catch (e) {
      Alert.alert('Không thể hủy lịch', e?.message || 'Vui lòng thử lại sau.');
    } finally {
      setIsCancelling(false);
    }
  };

  const filteredItems = items.filter((item) => {
    if (activeFilter === 'ALL') return true;
    if (activeFilter === 'cancelled') {
      return item.status === 'cancelled' || item.status === 'rejected';
    }
    return item.status === activeFilter;
  });

  const renderAppointmentCard = ({ item }) => {
    const meta = STATUS_META[item.status] || {
      label: item.status || 'Không rõ',
      color: '#475569',
      bg: '#F1F5F9',
      border: '#E2E8F0',
      icon: 'calendar-outline',
    };
    const canCancel = ['pending', 'confirmed'].includes(item.status);

    return (
      <View style={styles.card}>
        {/* Top Row: Code + Status Badge */}
        <View style={styles.cardTopRow}>
          <View style={styles.codeBadge}>
            <MaterialCommunityIcons name="ticket-confirmation-outline" size={14} color="#2478F2" />
            <Text style={styles.codeText}>{item.appointmentCode || `#${item._id}`}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: meta.bg, borderColor: meta.border }]}>
            <MaterialCommunityIcons name={meta.icon} size={13} color={meta.color} />
            <Text style={[styles.statusText, { color: meta.color }]}>{meta.label}</Text>
          </View>
        </View>

        {/* Doctor Row */}
        <TouchableOpacity
          style={styles.doctorRow}
          activeOpacity={0.8}
          disabled={!onNavigateToDoctorDetail || !item.doctor?.id}
          onPress={() => onNavigateToDoctorDetail && item.doctor?.id && onNavigateToDoctorDetail(item.doctor.id)}>
          <DoctorAvatar uri={item.doctor?.avatar} style={styles.docAvatar} iconSize={28} />
          <View style={styles.docInfo}>
            {!!item.doctor?.qualification && (
              <Text style={styles.docQual}>{item.doctor.qualification}</Text>
            )}
            <Text style={styles.docName} numberOfLines={1}>
              {item.doctor?.name || 'Bác sĩ chuyên khoa'}
            </Text>
            {!!item.doctor?.specialty && (
              <Text style={styles.docSpec} numberOfLines={1}>
                {item.doctor.specialty}
              </Text>
            )}
          </View>
        </TouchableOpacity>

        {/* Schedule & Hospital Box */}
        <View style={styles.infoBox}>
          <View style={styles.infoLine}>
            <MaterialCommunityIcons name="calendar-clock" size={16} color="#2478F2" />
            <Text style={styles.infoPrimaryText}>
              {formatDisplayDate(item.date)} • {item.time}
              {item.endTime ? ` - ${item.endTime}` : ''}
            </Text>
          </View>

          <View style={styles.infoLine}>
            <MaterialCommunityIcons name="hospital-building" size={16} color="#059669" />
            <Text style={styles.infoText} numberOfLines={2}>
              {item.hospital?.name || 'Cơ sở y tế'}
              {item.roomNumber ? ` (${item.roomNumber})` : ''}
            </Text>
          </View>

          {!!item.hospital?.address && (
            <View style={styles.infoLine}>
              <MaterialCommunityIcons name="map-marker-outline" size={16} color="#64748B" />
              <Text style={styles.infoSubText} numberOfLines={2}>
                {item.hospital.address}
              </Text>
            </View>
          )}

          <View style={styles.infoLine}>
            <MaterialCommunityIcons name="cash-multiple" size={16} color="#D97706" />
            <Text style={styles.infoText}>
              Phí khám dự kiến: <Text style={styles.feeHighlight}>{formatCurrency(item.consultationFee)}</Text>
            </Text>
          </View>
        </View>

        {!!item.note && (
          <View style={styles.noteBox}>
            <Text style={styles.noteLabel}>Triệu chứng / Ghi chú:</Text>
            <Text style={styles.noteContent}>{item.note}</Text>
          </View>
        )}

        {!!item.cancelReason && (
          <View style={[styles.noteBox, styles.cancelReasonBox]}>
            <Text style={[styles.noteLabel, { color: '#B91C1C' }]}>Lý do hủy / từ chối:</Text>
            <Text style={[styles.noteContent, { color: '#7F1D1D' }]}>{item.cancelReason}</Text>
          </View>
        )}

        {/* Footer Actions */}
        <View style={styles.cardFooter}>
          {canCancel ? (
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setCancellingItem(item)}
              activeOpacity={0.75}>
              <MaterialCommunityIcons name="calendar-remove-outline" size={16} color="#DC2626" />
              <Text style={styles.cancelBtnText}>Hủy lịch hẹn</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.rebookBtn}
              onPress={() =>
                onNavigateToBook &&
                onNavigateToBook({
                  hospitalId: item.hospital?.id,
                  doctorId: item.doctor?.id,
                })
              }
              activeOpacity={0.75}>
              <MaterialCommunityIcons name="calendar-plus" size={16} color="#2478F2" />
              <Text style={styles.rebookBtnText}>Đặt lịch lại</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {!!onBack && (
            <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
              <MaterialCommunityIcons name="arrow-left" size={22} color="#0F172A" />
            </TouchableOpacity>
          )}
          <View>
            <Text style={styles.headerTitle}>Lịch khám của tôi</Text>
            <Text style={styles.headerSubtitle}>Theo dõi trạng thái và quản lý lịch hẹn</Text>
          </View>
        </View>

        {!!onNavigateToBook && (
          <TouchableOpacity
            style={styles.newBookBtn}
            onPress={() => onNavigateToBook()}
            activeOpacity={0.85}>
            <MaterialCommunityIcons name="plus" size={18} color="#FFFFFF" />
            <Text style={styles.newBookBtnText}>Đặt khám</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterBarWrapper}>
        <FlatList
          horizontal
          data={FILTER_TABS}
          keyExtractor={(tab) => tab.key}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterBar}
          renderItem={({ item: tab }) => {
            const active = activeFilter === tab.key;
            const count =
              tab.key === 'ALL'
                ? items.length
                : tab.key === 'cancelled'
                  ? items.filter((i) => i.status === 'cancelled' || i.status === 'rejected').length
                  : items.filter((i) => i.status === tab.key).length;

            return (
              <TouchableOpacity
                style={[styles.filterChip, active && styles.filterChipActive]}
                onPress={() => setActiveFilter(tab.key)}
                activeOpacity={0.75}>
                <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                  {tab.label} ({count})
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {!!error && (
        <View style={styles.errorBanner}>
          <View style={{ flex: 1 }}>
            <Text style={styles.errorBannerTitle}>Không tải được lịch khám</Text>
            <Text style={styles.errorBannerSub}>{error}</Text>
          </View>
          <TouchableOpacity style={styles.retryBtn} onPress={() => loadHistory()}>
            <Text style={styles.retryBtnText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#2478F2" />
          <Text style={styles.loadingText}>Đang tải lịch khám của bạn...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => String(item._id)}
          renderItem={renderAppointmentCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadHistory(true);
              }}
              colors={['#2478F2']}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <View style={styles.emptyIconCircle}>
                <MaterialCommunityIcons name="calendar-blank-outline" size={44} color="#2478F2" />
              </View>
              <Text style={styles.emptyTitle}>Chưa có lịch khám nào</Text>
              <Text style={styles.emptySub}>
                Bạn chưa có lịch hẹn khám bệnh trong mục này. Hãy đặt lịch khám ngay để được bác sĩ tư vấn.
              </Text>
              {!!onNavigateToBook && (
                <TouchableOpacity
                  style={styles.emptyBookBtn}
                  onPress={() => onNavigateToBook()}
                  activeOpacity={0.85}>
                  <MaterialCommunityIcons name="calendar-plus" size={18} color="#FFFFFF" />
                  <Text style={styles.emptyBookBtnText}>Đặt lịch khám ngay</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}

      {/* Confirmation Modal for Cancelling */}
      <Modal
        visible={!!cancellingItem}
        transparent
        animationType="fade"
        onRequestClose={() => !isCancelling && setCancellingItem(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconWrap}>
              <MaterialCommunityIcons name="alert-outline" size={28} color="#DC2626" />
            </View>
            <Text style={styles.modalTitle}>Xác nhận hủy lịch khám?</Text>
            <Text style={styles.modalDesc}>
              Bạn có chắc chắn muốn hủy lịch khám với{' '}
              <Text style={{ fontWeight: '700', color: '#0F172A' }}>
                {cancellingItem?.doctor?.name || 'bác sĩ'}
              </Text>{' '}
              vào ngày{' '}
              <Text style={{ fontWeight: '700', color: '#0F172A' }}>
                {formatDisplayDate(cancellingItem?.date)} lúc {cancellingItem?.time}
              </Text>{' '}
              không?
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalKeepBtn}
                disabled={isCancelling}
                onPress={() => setCancellingItem(null)}>
                <Text style={styles.modalKeepText}>Giữ lại lịch</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalCancelBtn, isCancelling && { opacity: 0.6 }]}
                disabled={isCancelling}
                onPress={handleConfirmCancel}>
                {isCancelling ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalCancelText}>Đồng ý hủy</Text>
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
    backgroundColor: '#F8FAFE',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  newBookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#2478F2',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    shadowColor: '#2478F2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  newBookBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  filterBarWrapper: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2F6',
  },
  filterBar: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipActive: {
    backgroundColor: '#2478F2',
    borderColor: '#2478F2',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
    paddingBottom: 36,
    flexGrow: 1,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  codeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  codeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  doctorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  docAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#E2E8F0',
  },
  docInfo: {
    flex: 1,
  },
  docQual: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  docName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 1,
  },
  docSpec: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2478F2',
    marginTop: 2,
  },
  infoBox: {
    marginTop: 12,
    gap: 7,
  },
  infoLine: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  infoPrimaryText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
  },
  infoText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    flex: 1,
  },
  infoSubText: {
    fontSize: 12,
    color: '#64748B',
    flex: 1,
  },
  feeHighlight: {
    fontWeight: '800',
    color: '#D97706',
  },
  noteBox: {
    marginTop: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cancelReasonBox: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  noteLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 2,
  },
  noteContent: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 17,
  },
  cardFooter: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
  },
  rebookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  rebookBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2478F2',
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: '#64748B',
  },
  emptyBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 56,
    paddingHorizontal: 28,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
  },
  emptyBookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#2478F2',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 999,
    shadowColor: '#2478F2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  emptyBookBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  errorBanner: {
    margin: 16,
    marginBottom: 0,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  errorBannerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#B91C1C',
  },
  errorBannerSub: {
    fontSize: 12,
    color: '#7F1D1D',
    marginTop: 2,
  },
  retryBtn: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 22,
    alignItems: 'center',
  },
  modalIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  modalDesc: {
    fontSize: 13,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  modalKeepBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  modalKeepText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: '#DC2626',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

