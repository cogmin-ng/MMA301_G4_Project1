import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import { useAuth } from '@/context/auth-context';
import { MedicalColors, Spacing } from '@/constants/theme';

export function RegisterView({ onNavigateToLogin }) {
  const { register, isLoading } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleRegister = async () => {
    if (!fullName.trim()) {
      setErrorMsg('Vui lòng nhập họ và tên.');
      return;
    }
    if (!email.trim()) {
      setErrorMsg('Vui lòng nhập địa chỉ email.');
      return;
    }
    if (!password) {
      setErrorMsg('Vui lòng nhập mật khẩu.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Mật khẩu xác nhận không khớp.');
      return;
    }

    setErrorMsg('');
    try {
      await register({
        full_name: fullName,
        email,
        phone,
        password,
      });
      Alert.alert(
        'Đăng ký thành công',
        'Tài khoản Bệnh nhân của bạn đã được tạo thành công trên hệ thống YouMed! Vui lòng đăng nhập.',
        [{ text: 'Đăng nhập ngay', onPress: onNavigateToLogin }]
      );
    } catch (err) {
      setErrorMsg(err.message || 'Đăng ký thất bại.');
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContainer}
      keyboardShouldPersistTaps="handled">
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoIcon}>📝</Text>
          </View>
          <Text style={styles.appName}>Đăng ký tài khoản</Text>
          <Text style={styles.subTitle}>
            Tạo tài khoản để đặt lịch khám nhanh chóng
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Họ và tên *</Text>
          <TextInput
            style={styles.input}
            placeholder="Nguyễn Văn A"
            placeholderTextColor={MedicalColors.textMuted}
            value={fullName}
            onChangeText={(text) => {
              setFullName(text);
              if (errorMsg) setErrorMsg('');
            }}
          />

          <Text style={styles.label}>Email *</Text>
          <TextInput
            style={styles.input}
            placeholder="example@gmail.com"
            placeholderTextColor={MedicalColors.textMuted}
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (errorMsg) setErrorMsg('');
            }}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>Số điện thoại</Text>
          <TextInput
            style={styles.input}
            placeholder="0901234567"
            placeholderTextColor={MedicalColors.textMuted}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />

          <Text style={styles.label}>Mật khẩu *</Text>
          <TextInput
            style={styles.input}
            placeholder="Tối thiểu 6 ký tự"
            placeholderTextColor={MedicalColors.textMuted}
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (errorMsg) setErrorMsg('');
            }}
            secureTextEntry
          />

          <Text style={styles.label}>Xác nhận mật khẩu *</Text>
          <TextInput
            style={styles.input}
            placeholder="Nhập lại mật khẩu"
            placeholderTextColor={MedicalColors.textMuted}
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              if (errorMsg) setErrorMsg('');
            }}
            secureTextEntry
          />

          {errorMsg ? <Text style={styles.errorText}>⚠️ {errorMsg}</Text> : null}

          <TouchableOpacity
            style={[styles.registerBtn, isLoading && styles.btnDisabled]}
            onPress={handleRegister}
            disabled={isLoading}>
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.registerBtnText}>Tạo tài khoản</Text>
            )}
          </TouchableOpacity>

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Đã có tài khoản? </Text>
            <TouchableOpacity onPress={onNavigateToLogin}>
              <Text style={styles.loginLink}>Đăng nhập</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.four,
    backgroundColor: '#F3F4F6',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: Spacing.four,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.four,
  },
  logoBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: MedicalColors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  logoIcon: {
    fontSize: 28,
  },
  appName: {
    fontSize: 20,
    fontWeight: '700',
    color: MedicalColors.primary,
    marginBottom: 4,
  },
  subTitle: {
    fontSize: 13,
    color: MedicalColors.textSecondary,
    textAlign: 'center',
  },
  form: {
    gap: Spacing.two,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: MedicalColors.textPrimary,
    marginTop: 4,
  },
  input: {
    backgroundColor: MedicalColors.inputBg,
    borderWidth: 1,
    borderColor: MedicalColors.inputBorder,
    borderRadius: 10,
    paddingHorizontal: Spacing.three,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    fontSize: 14,
    color: MedicalColors.textPrimary,
  },
  errorText: {
    fontSize: 12,
    color: MedicalColors.danger,
    marginTop: 4,
  },
  registerBtn: {
    backgroundColor: MedicalColors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: Spacing.three,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  registerBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.three,
  },
  footerText: {
    fontSize: 13,
    color: MedicalColors.textSecondary,
  },
  loginLink: {
    fontSize: 13,
    fontWeight: '600',
    color: MedicalColors.primary,
  },
});
