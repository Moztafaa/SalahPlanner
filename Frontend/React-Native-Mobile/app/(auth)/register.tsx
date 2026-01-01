import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Link } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

export default function RegisterScreen() {
  const { t } = useTranslation();
  const [fullName, setFullName] = useState('');
  const [userName, setUserName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();

  const handleRegister = async () => {
    // Validation
    if (!fullName.trim() || !userName.trim() || !email.trim() || !password.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please fill in all fields',
      });
      return;
    }

    if (password !== confirmPassword) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Passwords do not match',
      });
      return;
    }

    if (password.length < 6) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Password must be at least 6 characters',
      });
      return;
    }

    setLoading(true);
    try {
      await register({
        fullName: fullName.trim(),
        userName: userName.trim(),
        email: email.trim(),
        password,
        confirmPassword,
      });
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Account created successfully!',
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Registration Failed',
        text2: error instanceof Error ? error.message : 'Something went wrong',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-background-light dark:bg-background-dark"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 justify-center px-6 py-12">
          {/* Header */}
          <View className="items-center mb-8">
            <Image
              source={require('../../assets/images/cropped_circle_image_without_text.png')}
              className="w-24 h-24 mb-4"
              resizeMode="contain"
            />
            <Text className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              {t('auth.createAccount')}
            </Text>
            <Text className="text-slate-500 dark:text-slate-400 text-center">
              {t('auth.joinApp')}
            </Text>
          </View>

          {/* Register Form */}
          <View className="space-y-4">
            {/* Full Name */}
            <View>
              <Text className="text-slate-900 dark:text-white font-medium mb-2">{t('auth.fullName')}</Text>
              <View className="flex-row items-center bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark rounded-xl px-4 py-3">
                <Ionicons name="person-outline" size={20} color="#94a3b8" />
                <TextInput
                  className="flex-1 ms-3 text-slate-900 dark:text-white text-start"
                  placeholder={t('auth.fullName')}
                  placeholderTextColor="#94a3b8"
                  value={fullName}
                  onChangeText={setFullName}
                  autoCapitalize="words"
                  editable={!loading}
                />
              </View>
            </View>

            {/* Username */}
            <View>
              <Text className="text-slate-900 dark:text-white font-medium mb-2">{t('auth.username')}</Text>
              <View className="flex-row items-center bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark rounded-xl px-4 py-3">
                <Ionicons name="at-outline" size={20} color="#94a3b8" />
                <TextInput
                  className="flex-1 ms-3 text-slate-900 dark:text-white text-start"
                  placeholder={t('auth.username')}
                  placeholderTextColor="#94a3b8"
                  value={userName}
                  onChangeText={setUserName}
                  autoCapitalize="none"
                  editable={!loading}
                />
              </View>
            </View>

            {/* Email */}
            <View>
              <Text className="text-slate-900 dark:text-white font-medium mb-2">{t('auth.email')}</Text>
              <View className="flex-row items-center bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark rounded-xl px-4 py-3">
                <Ionicons name="mail-outline" size={20} color="#94a3b8" />
                <TextInput
                  className="flex-1 ms-3 text-slate-900 dark:text-white text-start"
                  placeholder={t('auth.email')}
                  placeholderTextColor="#94a3b8"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  editable={!loading}
                />
              </View>
            </View>

            {/* Password */}
            <View>
              <Text className="text-slate-900 dark:text-white font-medium mb-2">{t('auth.password')}</Text>
              <View className="flex-row items-center bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark rounded-xl px-4 py-3">
                <Ionicons name="lock-closed-outline" size={20} color="#94a3b8" />
                <TextInput
                  className="flex-1 ms-3 text-slate-900 dark:text-white text-start"
                  placeholder={t('auth.password')}
                  placeholderTextColor="#94a3b8"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  editable={!loading}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color="#94a3b8"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm Password */}
            <View>
              <Text className="text-slate-900 dark:text-white font-medium mb-2">{t('auth.confirmPassword')}</Text>
              <View className="flex-row items-center bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark rounded-xl px-4 py-3">
                <Ionicons name="lock-closed-outline" size={20} color="#94a3b8" />
                <TextInput
                  className="flex-1 ms-3 text-slate-900 dark:text-white text-start"
                  placeholder={t('auth.confirmPassword')}
                  placeholderTextColor="#94a3b8"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  editable={!loading}
                />
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                  <Ionicons
                    name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color="#94a3b8"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Register Button */}
            <TouchableOpacity
              className="bg-primary rounded-xl py-4 mt-6"
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#102216" />
              ) : (
                <Text className="text-background-dark text-center font-semibold text-lg">
                  {t('auth.createAccount')}
                </Text>
              )}
            </TouchableOpacity>

            {/* Login Link */}
            <View className="flex-row justify-center items-center mt-6">
              <Text className="text-slate-500 dark:text-slate-400">{t('auth.alreadyHaveAccount')} </Text>
              <Link href="/(auth)/login" asChild>
                <TouchableOpacity disabled={loading}>
                  <Text className="text-primary font-semibold">{t('auth.login')}</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
