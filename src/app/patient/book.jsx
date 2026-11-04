import React, { useEffect, useState, useCallback } from 'react';
import { Alert, ActivityIndicator, ScrollView, View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { patientBookingApi as api } from '../../services/patientBookingApi';
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
const errorMessage = e => e?.message || 'Có lỗi xảy ra';
function Choice({ title, selected, onPress, disabled }) { return <Pressable disabled={disabled} onPress={onPress} style={[styles.choice,selected && styles.selected,disabled && {opacity:.4}]}><Text style={[styles.choiceText,selected && {color:'#FFF'}]}>{title}</Text></Pressable> }
export default function BookAppointment() {
 const [hospitals,setHospitals] = useState([]), [doctors,setDoctors] = useState([]), [slots,setSlots] = useState([]);
 const [hospital,setHospital] = useState(null), [doctor,setDoctor] = useState(null), [date,setDate] = useState(today()), [time,setTime] = useState(''), [note,setNote] = useState('');
 const [busy,setBusy] = useState(false), [loading,setLoading] = useState(false);
 useEffect(()=>{let active=true;setLoading(true);api.hospitals().then(d=>{if(active)setHospitals(d)}).catch(e=>Alert.alert('Không tải được bệnh viện',errorMessage(e))).finally(()=>{if(active)setLoading(false)});return()=>{active=false}},[]);
 useEffect(()=>{let active=true;setDoctors([]);setDoctor(null);setSlots([]);setTime('');if(!hospital)return;api.doctors(hospital._id).then(d=>{if(active)setDoctors(d)}).catch(e=>Alert.alert('Lỗi tải bác sĩ',errorMessage(e)));return()=>{active=false}},[hospital]);
 const loadSlots = useCallback(async()=>{if(!doctor||!hospital)return;setLoading(true);setTime('');try{setSlots(await api.slots(doctor._id,hospital._id,date))}catch(e){setSlots([]);Alert.alert('Không lấy được khung giờ',errorMessage(e))}finally{setLoading(false)}},[doctor,hospital,date]);
 useEffect(()=>{if(!doctor){setSlots([]);return} if(!/^\d{4}-\d{2}-\d{2}$/.test(date)){setSlots([]);return}loadSlots()},[loadSlots,doctor,date]);
 async function submit(){if(!hospital||!doctor||!time)return Alert.alert('Thiếu thông tin','Vui lòng chọn bệnh viện, bác sĩ và giờ khám');setBusy(true);try{await api.create({hospitalId:hospital._id,doctorId:doctor._id,date,time,note:note.trim()});Alert.alert('Đặt lịch thành công','Lịch khám đang chờ xác nhận',[{text:'Xem lịch của tôi',onPress:()=>router.replace('/patient/appointments')}])}catch(e){Alert.alert('Không thể đặt lịch',errorMessage(e));loadSlots()}finally{setBusy(false)}}
 return <ScrollView style={styles.page} contentContainerStyle={{paddingBottom:50}} keyboardShouldPersistTaps="handled">
  <Text style={styles.heading}>Đặt lịch khám bệnh</Text><Text style={styles.helper}>Chọn lần lượt bệnh viện, bác sĩ và thời gian phù hợp.</Text>
  <Text style={styles.label}>1. Bệnh viện</Text><View style={styles.wrap}>{hospitals.map(h=><Choice key={h._id} title={h.name} selected={hospital?._id===h._id} onPress={()=>setHospital(h)} />)}</View>
  <Text style={styles.label}>2. Bác sĩ</Text>{!hospital?<Text style={styles.helper}>Vui lòng chọn bệnh viện trước.</Text>:doctors.length===0?<Text style={styles.helper}>Không có bác sĩ đang hoạt động.</Text>:<View style={styles.wrap}>{doctors.map(d=><Choice key={d._id} title={`${d.name}${d.specialty?' • '+d.specialty:''}`} selected={doctor?._id===d._id} onPress={()=>setDoctor(d)}/>)}</View>}
  <Text style={styles.label}>3. Ngày khám (YYYY-MM-DD)</Text><TextInput value={date} onChangeText={v=>{setDate(v);setTime('')}} placeholder="2026-11-02" style={styles.input} autoCapitalize="none" keyboardType="numbers-and-punctuation"/>
  <Text style={styles.label}>4. Giờ khám</Text>{loading?<ActivityIndicator color="#1784B7"/>:slots.length===0?<Text style={styles.helper}>Chọn bác sĩ và nhập ngày hợp lệ để xem giờ trống.</Text>:<View style={styles.wrap}>{slots.map(s=><Choice key={s.time} title={s.time} selected={time===s.time} disabled={!s.available} onPress={()=>setTime(s.time)}/>)}</View>}
  <Text style={styles.label}>Ghi chú (không bắt buộc)</Text><TextInput style={[styles.input,{height:90,textAlignVertical:'top'}]} multiline maxLength={500} value={note} onChangeText={setNote} placeholder="Triệu chứng hoặc yêu cầu khác"/>
  <Pressable style={[styles.action,busy && {opacity:.55}]} disabled={busy} onPress={submit}><Text style={styles.actionText}>{busy?'Đang xử lý...':'Xác nhận đặt lịch'}</Text></Pressable>
 </ScrollView>
}
const styles=StyleSheet.create({page:{flex:1,backgroundColor:'#F6FAFD',padding:18},heading:{fontSize:24,fontWeight:'800',color:'#16324A'},helper:{color:'#708391',marginTop:8,lineHeight:20},label:{fontSize:16,fontWeight:'700',color:'#24465F',marginTop:23,marginBottom:12},wrap:{flexDirection:'row',flexWrap:'wrap',gap:9},choice:{backgroundColor:'white',paddingHorizontal:16,paddingVertical:12,borderRadius:12,borderWidth:1,borderColor:'#D8E7EF'},selected:{backgroundColor:'#1686B9',borderColor:'#1686B9'},choiceText:{color:'#254B63',fontWeight:'600'},input:{padding:14,borderWidth:1,borderColor:'#D8E7EF',borderRadius:12,backgroundColor:'#FFF',fontSize:15},action:{backgroundColor:'#1686B9',marginTop:28,borderRadius:14,padding:16,alignItems:'center'},actionText:{color:'#FFF',fontWeight:'800',fontSize:16}});
