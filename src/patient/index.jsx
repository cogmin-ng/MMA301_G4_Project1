import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
export default function PatientHome() {
 return <View style={styles.page}>
  <Text style={styles.heading}>Xin chào, bệnh nhân</Text>
  <Text style={styles.sub}>Quản lý lịch khám của bạn dễ dàng</Text>
  <Pressable style={styles.card} onPress={() => router.push('/patient/book')} accessibilityRole="button"><Text style={styles.icon}>＋</Text><View><Text style={styles.title}>Đặt lịch khám</Text><Text style={styles.muted}>Chọn bệnh viện, bác sĩ, ngày và giờ</Text></View></Pressable>
  <Pressable style={styles.card} onPress={() => router.push('/patient/appointments')} accessibilityRole="button"><Text style={styles.icon}>◷</Text><View><Text style={styles.title}>Lịch sử đặt lịch</Text><Text style={styles.muted}>Theo dõi trạng thái và hủy lịch</Text></View></Pressable>
 </View>;
}
const styles = StyleSheet.create({page:{flex:1,backgroundColor:'#F6FAFD',padding:20,paddingTop:32},heading:{fontSize:25,fontWeight:'800',color:'#16324A'},sub:{color:'#6B7C8E',marginTop:8,marginBottom:22},card:{flexDirection:'row',alignItems:'center',padding:20,borderRadius:16,backgroundColor:'#FFF',marginBottom:14,borderWidth:1,borderColor:'#E3EDF3',gap:16},icon:{fontSize:26,color:'#1784B7'},title:{fontSize:17,fontWeight:'700',color:'#16324A'},muted:{fontSize:12,color:'#667A89',marginTop:6}});
