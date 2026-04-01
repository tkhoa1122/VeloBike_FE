import React from 'react';
import { View, Text } from 'react-native';
import tw from 'twrnc';
import { LucideIcon } from 'lucide-react-native';
import { COLORS } from '../../../../config/theme';

interface StatsCardProps {
  icon: LucideIcon;
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: string;
  backgroundColor?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  icon: Icon,
  title,
  value,
  subtitle,
  trend,
  color = COLORS.primary,
  backgroundColor = '#F0F9FF',
}) => {
  return (
    <View style={[tw`flex-1 rounded-2xl p-4 mb-3`, { backgroundColor }]}>
      {/* Header with icon */}
      <View style={tw`flex-row items-center mb-3`}>
        <View
          style={[
            tw`w-10 h-10 rounded-full items-center justify-center mr-2`,
            { backgroundColor: color + '20' },
          ]}
        >
          <Icon size={20} color={color} strokeWidth={2} />
        </View>
        <Text style={tw`flex-1 text-sm text-gray-600`}>{title}</Text>
      </View>

      {/* Value */}
      <Text style={tw`text-2xl font-bold text-gray-900 mb-1`}>{value}</Text>

      {/* Subtitle & Trend */}
      <View style={tw`flex-row items-center justify-between`}>
        {subtitle && <Text style={tw`text-xs text-gray-500`}>{subtitle}</Text>}
        {trend && (
          <Text style={[tw`text-xs font-semibold`, { color: trend.isPositive ? '#10B981' : '#EF4444' }]}>
            {trend.isPositive ? '↑' : '↓'} {trend.value}%
          </Text>
        )}
      </View>
    </View>
  );
};
