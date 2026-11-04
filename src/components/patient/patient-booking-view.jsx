import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { patientBookingApi as api } from '../../services/patientBookingApi';
import { doctorService } from '../../services/doctor-service';
import { DoctorAvatar } from './data-images';

const DAY_LABELS = ['CN', 'Th 2', 'Th 3', 'Th 4', 'Th 5', 'Th 6', 'Th 7'];

function formatDateYMD(dateObj) {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function buildUpcomingDays(count = 7) {
  const now = new Date();
  const list = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    const ymd = formatDateYMD(d);
    const dayName = i === 0 ? 'Hôm nay' : i === 1 ? 'Ngày mai' : DAY_LABELS[d.getDay()];
    const dayMonth = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
    list.push({ ymd, dayName, dayMonth });
  }
  return list;
}

function getDefaultBookingDate() {
  const now = new Date();
  // Nếu đã qua 16:30 chiều, mặc định gợi ý ngày mai để có sẵn khung giờ trống
  if (now.getHours() > 16 || (now.getHours() === 16 && now.getMinutes() >= 30)) {
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    return formatDateYMD(tomorrow);
  }
  return formatDateYMD(now);
}

function formatCurrency(amount) {
  const num = Number(amount);
  if (!Number.isFinite(num) || num <= 0) return 'Theo bảng giá viện';
  return `${new Intl.NumberFormat('vi-VN').format(num)} đ`;
}

export function PatientBookingView({
  initialHospitalId = null,
  initialDoctorId = null,
  onBack,
  onBookingSuccess,
}) {
  const upcomingDays = useMemo(() => buildUpcomingDays(7), []);
  const [hospitals, setHospitals] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [slots, setSlots] = useState([]);

  const [hospital, setHospital] = useState(null);
  const [doctor, setDoctor] = useState(null);
  const [targetDoctorId, setTargetDoctorId] = useState(initialDoctorId);
  const [date, setDate] = useState(getDefaultBookingDate);
  const [time, setTime] = useState('');
  const [note, setNote] = useState('');

  const [loadingHospitals, setLoadingHospitals] = useState(true);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successModalMessage, setSuccessModalMessage] = useState('');

  // 1. Tải danh sách bệnh viện và tự động chọn theo initialHospitalId / initialDoctorId
  useEffect(() => {
    let active = true;
    setLoadingHospitals(true);
    setErrorMsg('');

    Promise.all([
      api.hospitals(),
      initialDoctorId && !initialHospitalId
        ? doctorService.getDoctorById(initialDoctorId).catch(() => null)
        : Promise.resolve(null),
    ])
      .then(([hospList, docDetail]) => {
        if (!active) return;
        setHospitals(hospList);

        let preferredHospId = initialHospitalId;
        if (!preferredHospId && docDetail?.hospitals?.length) {
          preferredHospId = docDetail.hospitals[0].hospital_id;
        }

        if (preferredHospId) {
          const found = hospList.find((h) => Number(h._id) === Number(preferredHospId));
          if (found) {
            setHospital(found);
            return;
          }
        }
        if (hospList.length > 0) {
          setHospital(hospList[0]);
        }
      })
      .catch((err) => {
        if (!active) return;
        setErrorMsg(err?.message || 'Không tải được danh sách bệnh viện.');
      })
      .finally(() => {
        if (active) setLoadingHospitals(false);
      });

    return () => {
      active = false;
    };
  }, [initialHospitalId, initialDoctorId]);

  // 2. Tải danh sách bác sĩ khi chọn bệnh viện
  useEffect(() => {
    let active = true;
    setDoctors([]);
    setDoctor(null);
    setSlots([]);
    setTime('');

    if (!hospital?._id) return undefined;

    setLoadingDoctors(true);
    api
      .doctors(hospital._id)
      .then((docList) => {
        if (!active) return;
        setDoctors(docList);
        if (targetDoctorId) {
          const matched = docList.find((d) => Number(d._id) === Number(targetDoctorId));
          if (matched) {
            setDoctor(matched);
            setTargetDoctorId(null);
            return;
          }
        }
        if (docList.length > 0) {
          setDoctor(docList[0]);
        }
      })
      .catch((err) => {
        if (!active) return;
        setErrorMsg(err?.message || 'Không tải được danh sách bác sĩ.');
      })
      .finally(() => {
        if (active) setLoadingDoctors(false);
      });

    return () => {
      active = false;
    };
  }, [hospital, targetDoctorId]);

  // 3. Tải khung giờ trống khi chọn bác sĩ & ngày
  const loadSlots = useCallback(async () => {
    if (!doctor?._id || !hospital?._id || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      setSlots([]);
      return;
    }
    setLoadingSlots(true);
    setTime('');
    setErrorMsg('');
    try {
      const slotList = await api.slots(doctor._id, hospital._id, date);
      setSlots(Array.isArray(slotList) ? slotList : []);
      const firstAvail = (slotList || []).find((s) => s.available);
      if (firstAvail) {
        setTime(firstAvail.time);
      }
    } catch (err) {
      setSlots([]);
      setErrorMsg(err?.message || 'Không lấy được khung giờ khám.');
    } finally {
      setLoadingSlots(false);
    }
  }, [doctor, hospital, date]);

  useEffect(() => {
    loadSlots();
  }, [loadSlots]);

  const morningSlots = useMemo(
    () => slots.filter((s) => Number(String(s.time).split(':')[0]) < 12),
    [slots]
  );
  const afternoonSlots = useMemo(
    () => slots.filter((s) => Number(String(s.time).split(':')[0]) >= 12),
    [slots]
  );

  const handleSubmit = async () => {
    if (!hospital || !doctor || !time) {
      setErrorMsg('Vui lòng chọn đầy đủ bệnh viện, bác sĩ và khung giờ khám.');
      return;
    }
    setSubmitting(true);
    setErrorMsg('');
    try {
      await api.create({
        hospitalId: hospital._id,
        doctorId: doctor._id,
        date,
        time,
        note: note.trim(),
      });
      setSuccessModalMessage(
        `Đã đặt lịch khám với ${doctor.name} tại ${hospital.name} vào lúc ${time} ngày ${date}.`
      );
      if (Alert?.alert) {
        Alert.alert('Đặt lịch thành công', 'Lịch khám của bạn đã được ghi nhận và đang chờ xác nhận.', [
          {
            text: 'Xem lịch khám',
            onPress: () => onBookingSuccess && onBookingSuccess(),
          },
        ]);
      }
    } catch (err) {
      const msg = err?.message || 'Không thể đặt lịch khám.';
      setErrorMsg(msg);
      loadSlots();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.screen}>
      {/* Top Toolbar */}
      <View style={styles.toolbar}>
        {!!onBack ? (
          <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
            <MaterialCommunityIcons name="arrow-left" size={22} color="#0F172A" />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 38 }} />
        )}
        <Text style={styles.toolbarTitle}>Đặt lịch khám bệnh</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {!!errorMsg && (
          <View style={styles.errorBanner}>
            <MaterialCommunityIcons name="alert-circle-outline" size={18} color="#DC2626" />
            <Text style={styles.errorBannerText}>{errorMsg}</Text>
          </View>
        )}

        {!!successModalMessage && (
          <View style={styles.successBanner}>
            <MaterialCommunityIcons name="check-circle" size={20} color="#059669" />
            <View style={{ flex: 1 }}>
              <Text style={styles.successBannerTitle}>Đặt lịch khám thành công!</Text>
              <Text style={styles.successBannerDesc}>{successModalMessage}</Text>
            </View>
            {!!onBookingSuccess && (
              <TouchableOpacity style={styles.viewHistoryBtn} onPress={onBookingSuccess}>
                <Text style={styles.viewHistoryBtnText}>Xem lịch</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Step 1: Chọn Bệnh viện */}
        <View style={styles.stepSection}>
          <View style={styles.stepHeader}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>1</Text>
            </View>
            <Text style={styles.stepTitle}>Chọn cơ sở y tế</Text>
          </View>

          {loadingHospitals ? (
            <ActivityIndicator size="small" color="#2478F2" style={{ marginVertical: 14 }} />
          ) : hospitals.length === 0 ? (
            <Text style={styles.emptyHint}>Chưa có bệnh viện nào đang hoạt động.</Text>
          ) : (
            <View style={styles.optionList}>
              {hospitals.map((h) => {
                const selected = Number(hospital?._id) === Number(h._id);
                return (
                  <TouchableOpacity
                    key={h._id}
                    style={[styles.hospItem, selected && styles.hospItemSelected]}
                    onPress={() => setHospital(h)}
                    activeOpacity={0.8}>
                    <View style={[styles.hospIconBox, selected && styles.hospIconBoxSelected]}>
                      <MaterialCommunityIcons
                        name="hospital-building"
                        size={20}
                        color={selected ? '#FFFFFF' : '#2478F2'}
                      />
                    </View>
                    <View style={styles.hospTexts}>
                      <Text style={[styles.hospName, selected && styles.hospNameSelected]}>
                        {h.name}
                      </Text>
                      {!!h.address && (
                        <Text style={styles.hospAddr} numberOfLines={1}>
                          {h.address}
                        </Text>
                      )}
                    </View>
                    <MaterialCommunityIcons
                      name={selected ? 'radiobox-marked' : 'radiobox-blank'}
                      size={20}
                      color={selected ? '#2478F2' : '#CBD5E1'}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* Step 2: Chọn Bác sĩ */}
        <View style={styles.stepSection}>
          <View style={styles.stepHeader}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>2</Text>
            </View>
            <Text style={styles.stepTitle}>Chọn bác sĩ chuyên khoa</Text>
          </View>

          {!hospital ? (
            <Text style={styles.emptyHint}>Vui lòng chọn bệnh viện ở bước 1 trước.</Text>
          ) : loadingDoctors ? (
            <ActivityIndicator size="small" color="#2478F2" style={{ marginVertical: 14 }} />
          ) : doctors.length === 0 ? (
            <Text style={styles.emptyHint}>
              Bệnh viện này hiện chưa có bác sĩ đang trực tuyến. Vui lòng chọn cơ sở khác.
            </Text>
          ) : (
            <View style={styles.optionList}>
              {doctors.map((d) => {
                const selected = Number(doctor?._id) === Number(d._id);
                return (
                  <TouchableOpacity
                    key={d._id}
                    style={[styles.docItem, selected && styles.docItemSelected]}
                    onPress={() => setDoctor(d)}
                    activeOpacity={0.8}>
                    <DoctorAvatar uri={d.avatar} style={styles.docAvatar} iconSize={26} />
                    <View style={styles.docTexts}>
                      {!!d.qualification && <Text style={styles.docQual}>{d.qualification}</Text>}
                      <Text style={[styles.docName, selected && styles.docNameSelected]}>
                        {d.name}
                      </Text>
                      {!!d.specialty && <Text style={styles.docSpec}>{d.specialty}</Text>}
                      <View style={styles.docMetaRow}>
                        {!!d.room_number && (
                          <Text style={styles.docRoomTag}>{d.room_number}</Text>
                        )}
                        <Text style={styles.docFeeText}>
                          Phí khám: {formatCurrency(d.consultation_fee)}
                        </Text>
                      </View>
                    </View>
                    <MaterialCommunityIcons
                      name={selected ? 'check-circle' : 'checkbox-blank-circle-outline'}
                      size={22}
                      color={selected ? '#2478F2' : '#CBD5E1'}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* Step 3: Chọn Ngày khám */}
        <View style={styles.stepSection}>
          <View style={styles.stepHeader}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>3</Text>
            </View>
            <Text style={styles.stepTitle}>Chọn ngày khám</Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dateStrip}>
            {upcomingDays.map((item) => {
              const selected = date === item.ymd;
              return (
                <TouchableOpacity
                  key={item.ymd}
                  style={[styles.dateChip, selected && styles.dateChipSelected]}
                  onPress={() => {
                    setDate(item.ymd);
                    setTime('');
                  }}
                  activeOpacity={0.8}>
                  <Text style={[styles.dateChipDay, selected && styles.dateChipTextSelected]}>
                    {item.dayName}
                  </Text>
                  <Text style={[styles.dateChipDate, selected && styles.dateChipTextSelected]}>
                    {item.dayMonth}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={styles.customDateRow}>
            <MaterialCommunityIcons name="calendar-edit" size={18} color="#64748B" />
            <Text style={styles.customDateLabel}>Hoặc nhập ngày (YYYY-MM-DD):</Text>
            <TextInput
              value={date}
              onChangeText={(v) => {
                setDate(v);
                setTime('');
              }}
              placeholder="2026-11-05"
              placeholderTextColor="#94A3B8"
              style={styles.dateInput}
              autoCapitalize="none"
              keyboardType="numbers-and-punctuation"
            />
          </View>
        </View>

        {/* Step 4: Chọn Giờ khám */}
        <View style={styles.stepSection}>
          <View style={styles.stepHeader}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>4</Text>
            </View>
            <Text style={styles.stepTitle}>Chọn khung giờ khám</Text>
          </View>

          {loadingSlots ? (
            <View style={styles.slotLoadingBox}>
              <ActivityIndicator size="small" color="#2478F2" />
              <Text style={styles.slotLoadingText}>Đang kiểm tra lịch trống của bác sĩ...</Text>
            </View>
          ) : !doctor ? (
            <Text style={styles.emptyHint}>Vui lòng chọn bác sĩ để xem khung giờ trống.</Text>
          ) : slots.length === 0 ? (
            <View style={styles.noSlotsBox}>
              <MaterialCommunityIcons name="calendar-clock-outline" size={28} color="#94A3B8" />
              <Text style={styles.noSlotsText}>
                Bác sĩ không có lịch trực hoặc đã kín lịch trong ngày {date}. Hãy thử chọn ngày khác.
              </Text>
            </View>
          ) : (
            <View style={styles.slotsWrapper}>
              {morningSlots.length > 0 && (
                <View style={styles.slotGroup}>
                  <View style={styles.slotGroupHeader}>
                    <MaterialCommunityIcons name="weather-sunny" size={16} color="#F59E0B" />
                    <Text style={styles.slotGroupTitle}>Buổi sáng</Text>
                  </View>
                  <View style={styles.slotGrid}>
                    {morningSlots.map((s) => {
                      const selected = time === s.time;
                      return (
                        <Pressable
                          key={s.time}
                          disabled={!s.available}
                          onPress={() => setTime(s.time)}
                          style={[
                            styles.slotChip,
                            selected && styles.slotChipSelected,
                            !s.available && styles.slotChipDisabled,
                          ]}>
                          <Text
                            style={[
                              styles.slotChipText,
                              selected && styles.slotChipTextSelected,
                              !s.available && styles.slotChipTextDisabled,
                            ]}>
                            {s.time}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              )}

              {afternoonSlots.length > 0 && (
                <View style={styles.slotGroup}>
                  <View style={styles.slotGroupHeader}>
                    <MaterialCommunityIcons name="weather-partly-cloudy" size={16} color="#0284C7" />
                    <Text style={styles.slotGroupTitle}>Buổi chiều</Text>
                  </View>
                  <View style={styles.slotGrid}>
                    {afternoonSlots.map((s) => {
                      const selected = time === s.time;
                      return (
                        <Pressable
                          key={s.time}
                          disabled={!s.available}
                          onPress={() => setTime(s.time)}
                          style={[
                            styles.slotChip,
                            selected && styles.slotChipSelected,
                            !s.available && styles.slotChipDisabled,
                          ]}>
                          <Text
                            style={[
                              styles.slotChipText,
                              selected && styles.slotChipTextSelected,
                              !s.available && styles.slotChipTextDisabled,
                            ]}>
                            {s.time}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Step 5: Ghi chú / Triệu chứng */}
        <View style={styles.stepSection}>
          <View style={styles.stepHeader}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>5</Text>
            </View>
            <Text style={styles.stepTitle}>Triệu chứng / Ghi chú cho bác sĩ</Text>
          </View>
          <TextInput
            style={styles.noteInput}
            multiline
            maxLength={500}
            value={note}
            onChangeText={setNote}
            placeholder="Mô tả triệu chứng, tiền sử bệnh hoặc câu hỏi cần bác sĩ tư vấn (không bắt buộc)..."
            placeholderTextColor="#94A3B8"
          />
        </View>

        {/* Summary Box */}
        {!!(hospital && doctor && time) && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryHeading}>Thông tin đặt khám</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Cơ sở y tế:</Text>
              <Text style={styles.summaryValue}>{hospital.name}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Bác sĩ:</Text>
              <Text style={styles.summaryValue}>{doctor.name}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Thời gian:</Text>
              <Text style={styles.summaryValueHighlight}>
                {time} • Ngày {date}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Phí khám dự kiến:</Text>
              <Text style={styles.summaryFee}>{formatCurrency(doctor.consultation_fee)}</Text>
            </View>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Sticky Footer Submit Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.submitBtn,
            (!hospital || !doctor || !time || submitting) && styles.submitBtnDisabled,
          ]}
          disabled={!hospital || !doctor || !time || submitting}
          onPress={handleSubmit}
          activeOpacity={0.85}>
          {submitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <MaterialCommunityIcons name="calendar-check" size={20} color="#FFFFFF" />
              <Text style={styles.submitBtnText}>Xác nhận đặt lịch khám</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8FAFE',
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolbarTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    padding: 12,
    borderRadius: 12,
    marginBottom: 14,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#B91C1C',
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    padding: 14,
    borderRadius: 14,
    marginBottom: 14,
  },
  successBannerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#065F46',
  },
  successBannerDesc: {
    fontSize: 12,
    color: '#047857',
    marginTop: 2,
  },
  viewHistoryBtn: {
    backgroundColor: '#059669',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  viewHistoryBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  stepSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  stepBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2478F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  emptyHint: {
    fontSize: 13,
    color: '#64748B',
    fontStyle: 'italic',
    paddingVertical: 6,
  },
  optionList: {
    gap: 10,
  },
  hospItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  hospItemSelected: {
    borderColor: '#2478F2',
    backgroundColor: '#EFF6FF',
  },
  hospIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hospIconBoxSelected: {
    backgroundColor: '#2478F2',
  },
  hospTexts: {
    flex: 1,
  },
  hospName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  hospNameSelected: {
    color: '#1D4ED8',
  },
  hospAddr: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  docItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  docItemSelected: {
    borderColor: '#2478F2',
    backgroundColor: '#EFF6FF',
  },
  docAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E2E8F0',
  },
  docTexts: {
    flex: 1,
  },
  docQual: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  docName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  docNameSelected: {
    color: '#1D4ED8',
  },
  docSpec: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2478F2',
    marginTop: 1,
  },
  docMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  docRoomTag: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0369A1',
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  docFeeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D97706',
  },
  dateStrip: {
    gap: 8,
    paddingBottom: 12,
  },
  dateChip: {
    minWidth: 78,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
  },
  dateChipSelected: {
    backgroundColor: '#2478F2',
    borderColor: '#2478F2',
  },
  dateChipDay: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  dateChipDate: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  dateChipTextSelected: {
    color: '#FFFFFF',
  },
  customDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  customDateLabel: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  dateInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  slotLoadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
  },
  slotLoadingText: {
    fontSize: 13,
    color: '#64748B',
  },
  noSlotsBox: {
    alignItems: 'center',
    paddingVertical: 16,
    gap: 6,
  },
  noSlotsText: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 19,
  },
  slotsWrapper: {
    gap: 14,
  },
  slotGroup: {
    gap: 8,
  },
  slotGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  slotGroupTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  slotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  slotChip: {
    minWidth: 74,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
  },
  slotChipSelected: {
    backgroundColor: '#2478F2',
    borderColor: '#2478F2',
  },
  slotChipDisabled: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
    opacity: 0.5,
  },
  slotChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  slotChipTextSelected: {
    color: '#FFFFFF',
  },
  slotChipTextDisabled: {
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  noteInput: {
    height: 88,
    textAlignVertical: 'top',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    padding: 12,
    fontSize: 13,
    color: '#0F172A',
  },
  summaryCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    gap: 8,
  },
  summaryHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E3A8A',
    marginBottom: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
    textAlign: 'right',
  },
  summaryValueHighlight: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2478F2',
  },
  summaryFee: {
    fontSize: 14,
    fontWeight: '800',
    color: '#D97706',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 18,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2478F2',
    borderRadius: 999,
    height: 48,
    shadowColor: '#2478F2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnDisabled: {
    backgroundColor: '#94A3B8',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});

