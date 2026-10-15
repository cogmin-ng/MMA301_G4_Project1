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
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Card } from 'react-native-paper';
import { useAuth } from '@/context/auth-context';
import { MedicalColors, Spacing } from '@/constants/theme';

export function LoginView({ onNavigateToRegister, onLoginSuccess }) {
  const { login, switchRole, isLoading } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async () => {
    if (!identifier.trim()) {
      setErrorMsg('Vui lòng nhập email hoặc số điện thoại.');
      return;
    }
    if (!password) {
      setErrorMsg('Vui lòng nhập mật khẩu.');
      return;
    }

    setErrorMsg('');
    try {
      await login(identifier, password);
      onLoginSuccess?.();
    } catch (err) {
      setErrorMsg(err.message || 'Đăng nhập không thành công.');
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContainer}
      keyboardShouldPersistTaps="handled">
      <Card style={styles.card} mode="elevated">
        <Card.Content style={{ padding: Spacing.four }}>
          {/* Logo & Brand Header */}
          <View style={styles.header}>
            <View style={styles.logoBadge}>
              <MaterialCommunityIcons name="hospital-box" size={32} color="#FFFFFF" />
            </View>
            <Text style={styles.appName}>YOUMED CARE</Text>
            <Text style={styles.subTitle}>Hệ thống Đặt lịch Khám & Quản trị Y tế</Text>
          </View>

          {/* Form Inputs */}
          <View style={styles.form}>
            <Text style={styles.formTitle}>Đăng nhập Quản trị viên</Text>
            <Text style={styles.formSubtitle}>Vui lòng nhập tài khoản được cấp quyền để truy cập</Text>

            <Text style={styles.label}>Email hoặc Số điện thoại</Text>
            <TextInput
              style={styles.input}
              placeholder="VD: admin@youmed.vn hoặc 0901234567"
              placeholderTextColor={MedicalColors.textMuted}
              value={identifier}
              onChangeText={(text) => {
                setIdentifier(text);
                if (errorMsg) setErrorMsg('');
              }}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <Text style={styles.label}>Mật khẩu</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Nhập mật khẩu (Mặc định: 123456)"
                placeholderTextColor={MedicalColors.textMuted}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (errorMsg) setErrorMsg('');
                }}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowPassword(!showPassword)}>
                <MaterialCommunityIcons
                  name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={20}
                  color="#64748B"
                />
              </TouchableOpacity>
            </View>

            {errorMsg ? <Text style={styles.errorText}>⚠️ {errorMsg}</Text> : null}

            <TouchableOpacity
              style={[styles.loginBtn, isLoading && styles.loginBtnDisabled]}
              onPress={handleLogin}
              disabled={isLoading}>
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.loginBtnText}>Đăng nhập vào hệ thống</Text>
              )}
            </TouchableOpacity>

            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Chưa có tài khoản? </Text>
              <TouchableOpacity onPress={onNavigateToRegister}>
                <Text style={styles.registerLink}>Đăng ký tài khoản</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.four,
    backgroundColor: '#EDF5FA',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
    elevation: 3,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.four,
  },
  logoBadge: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  appName: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0369A1',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  subTitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
    textAlign: 'center',
  },
  formSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 20,
    textAlign: 'center',
  },
  hintBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  hintText: {
    fontSize: 12,
    color: '#64748B',
  },
  form: {
    gap: Spacing.two,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 4,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: Spacing.three,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    fontSize: 14,
    color: '#0F172A',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: Spacing.three,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    fontSize: 14,
    color: '#0F172A',
  },
  eyeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  errorText: {
    fontSize: 12,
    color: MedicalColors.danger,
    marginTop: 4,
  },
  loginBtn: {
    backgroundColor: MedicalColors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: Spacing.three,
  },
  loginBtnDisabled: {
    opacity: 0.6,
  },
  loginBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.three,
  },
  footerText: {
    fontSize: 13,
    color: '#64748B',
  },
  registerLink: {
    fontSize: 13,
    fontWeight: '700',
    color: MedicalColors.primary,
  },
});
