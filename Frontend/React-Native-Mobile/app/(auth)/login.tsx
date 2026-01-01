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

export default function LoginScreen() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please enter email and password',
      });
      return;
    }

    setLoading(true);
    try {
      await login({ email: email.trim(), password });
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Welcome back!',
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Login Failed',
        text2: error instanceof Error ? error.message : 'Invalid credentials',
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
          {/* Logo/Header */}
          <View className="items-center mb-12">
            <Image
              source={require('../../assets/images/cropped_circle_image_without_text.png')}
              className="w-32 h-32 mb-4"
              resizeMode="contain"
            />
            <Text className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              Salah Planner
            </Text>
            <Text className="text-slate-500 dark:text-slate-400 text-center">
              {t('auth.appSlogan')}
            </Text>
          </View>

          {/* Login Form */}
          <View className="space-y-4">
            {/* Email Input */}
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

            {/* Password Input */}
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

            {/* Login Button */}
            <TouchableOpacity
              className="bg-primary rounded-xl py-4 mt-6"
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#102216" />
              ) : (
                <Text className="text-background-dark text-center font-semibold text-lg">
                  {t('auth.login')}
                </Text>
              )}
            </TouchableOpacity>

            {/* Register Link */}
            <View className="flex-row justify-center items-center mt-6">
              <Text className="text-slate-500 dark:text-slate-400">{t('auth.dontHaveAccount')} </Text>
              <Link href="/(auth)/register" asChild>
                <TouchableOpacity disabled={loading}>
                  <Text className="text-primary font-semibold">{t('auth.signup')}</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
