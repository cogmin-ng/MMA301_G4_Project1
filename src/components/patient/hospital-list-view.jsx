import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { PatientHeader } from './patient-header';
import { HospitalCard } from './hospital-card';
import { hospitalService } from '../../services/hospital-service';

export function HospitalListView({
  initialKeyword = '',
  onBack,
  onNavigateToDoctorList,
  onNavigateToHospitalDetail,
}) {
  const [keyword, setKeyword] = useState(initialKeyword);
  const [hospitals, setHospitals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    let isActive = true;
    hospitalService
      .getHospitals({ keyword, status: 'ACTIVE' })
      .then((data) => {
        if (!isActive) return;
        setHospitals(data);
        setError('');
      })
      .catch((err) => {
        if (!isActive) return;
        setError(err.message || 'Không thể tải danh sách bệnh viện.');
      })
      .finally(() => {
        if (!isActive) return;
        setIsLoading(false);
        setRefreshing(false);
      });

    return () => {
      isActive = false;
    };
  }, [keyword, reloadCount]);

  const onRefresh = () => {
    setRefreshing(true);
    setReloadCount((count) => count + 1);
  };

  return (
    <View style={styles.container}>
      {/* Header với Tabs (Bệnh viện active, Bác sĩ) */}
      <PatientHeader
        searchValue={keyword}
        onChangeSearch={(value) => {
          setKeyword(value);
          setError('');
          setIsLoading(true);
        }}
        placeholder="Tìm bệnh viện hoặc khu vực"
        activeTab="HOSPITAL"
        onSelectTab={(tab) => {
          if (tab === 'DOCTOR') {
            onNavigateToDoctorList();
          }
        }}
        onClose={onBack}
      />

      {/* Hospital Cards List */}
      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2478F2" />
          <Text style={styles.loadingText}>Đang tải danh sách cơ sở y tế...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Không thể tải danh sách bệnh viện.</Text>
          <Text style={styles.emptySub}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setError('');
              setIsLoading(true);
              setReloadCount((count) => count + 1);
            }}>
            <Text style={styles.retryText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={hospitals}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <HospitalCard
              hospital={item}
              onPress={() => onNavigateToHospitalDetail(item.id)}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2478F2']} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>Không tìm thấy bệnh viện phù hợp</Text>
              <Text style={styles.emptySub}>
                Vui lòng thử tìm kiếm với từ khóa khác như tên cơ sở hoặc khu vực.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F8FA',
  },
  listContent: {
    padding: 14,
    paddingBottom: 32,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 18,
  },
  errorText: {
    fontSize: 15,
    color: '#B91C1C',
    fontWeight: '700',
    marginBottom: 6,
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: '#2478F2',
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
