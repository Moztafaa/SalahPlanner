import React from 'react';
import { View, Text, ImageBackground } from 'react-native';
// import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';

interface NextPrayerCardProps {
  prayerName: string;
  prayerTime: string;
  timeRemaining: string;
  progress: number; // 0 to 1
}

export default function NextPrayerCard({ prayerName, prayerTime, timeRemaining, progress }: NextPrayerCardProps) {
  return (
    <View className="p-4 w-full">
      <View className="relative overflow-hidden rounded-2xl shadow-lg bg-surface-dark h-48">
        {/* Background Image */}
        <ImageBackground
          source={require('../../assets/images/nextprayerbackground.webp')}
          className="absolute inset-0 w-full h-full"
          resizeMode="cover"
        >
           {/* Gradient Overlay - Temporarily replaced with solid overlay for stability */}
           {/* <LinearGradient
              colors={['#102216', 'rgba(16, 34, 22, 0.9)', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="absolute inset-0"
           /> */}
           <View className="absolute inset-0 bg-background-dark/80" />

           <View className="relative z-10 flex-row items-start justify-between p-6 h-full">
              <View className="flex-col gap-1">
                 <View className="flex-row items-center gap-2">
                    <MaterialIcons name="schedule" size={14} color="#13ec5b" />
                    <Text className="text-primary font-medium text-sm tracking-wider uppercase">Next Prayer</Text>
                 </View>
                 <Text className="text-4xl font-extrabold text-white tracking-tight">{prayerName}</Text>
                 <Text className="text-2xl font-semibold text-white/90">{prayerTime}</Text>
              </View>

              <View className="flex-col items-end justify-end mt-2">
                 <View className="bg-black/30 rounded-xl p-3 border border-white/10">
                    <Text className="text-[#9db9a6] text-xs uppercase font-semibold mb-1">Time Remaining</Text>
                    <Text className="text-primary text-3xl font-mono font-bold tracking-tight">{timeRemaining}</Text>
                 </View>
              </View>
           </View>

           {/* Progress Bar */}
           <View className="absolute bottom-0 left-0 h-1 bg-white/10 w-full z-10">
              <View
                className="h-full bg-primary rounded-r-full"
                style={{ width: `${Math.max(0, Math.min(100, progress * 100))}%` }}
              />
           </View>
        </ImageBackground>
      </View>
    </View>
  );
}
