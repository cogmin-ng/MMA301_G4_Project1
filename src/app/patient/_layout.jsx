import { Stack } from 'expo-router';
export default function PatientLayout() {
  return <Stack screenOptions={{ headerStyle: { backgroundColor: '#F6FAFD' }, headerTintColor: '#16324A', headerTitleStyle: { fontWeight: '700' } }}>
    <Stack.Screen name="index" options={{ title: 'Dịch vụ bệnh nhân' }} />
    <Stack.Screen name="book" options={{ title: 'Đặt lịch khám' }} />
    <Stack.Screen name="appointments" options={{ title: 'Lịch sử đặt lịch' }} />
  </Stack>;
}
