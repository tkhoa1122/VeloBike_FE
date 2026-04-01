import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import tw from 'twrnc';
import { Clock, CheckCircle, Truck, ChevronRight } from 'lucide-react-native';
import { COLORS } from '../../../../config/theme';

interface OrderCardProps {
  id: string;
  orderCode: string;
  buyerName: string;
  itemTitle: string;
  amount: number;
  status: 'ESCROW_LOCKED' | 'IN_INSPECTION' | 'INSPECTION_PASSED' | 'SHIPPING' | 'DELIVERED' | 'COMPLETED';
  createdAt: string;
  onPress: () => void;
}

const getOrderStatusColor = (status: string) => {
  switch (status) {
    case 'ESCROW_LOCKED':
      return { bg: '#FEF3C7', text: '#92400E', icon: Clock };
    case 'IN_INSPECTION':
      return { bg: '#SPC7E9FF', text: '#1E3A8A', icon: Clock };
    case 'INSPECTION_PASSED':
      return { bg: '#D1FAE5', text: '#065F46', icon: CheckCircle };
    case 'SHIPPING':
      return { bg: '#DDD6FE', text: '#4F46E5', icon: Truck };
    case 'DELIVERED':
      return { bg: '#E0E7FF', text: '#3730A3', icon: CheckCircle };
    case 'COMPLETED':
      return { bg: '#DCF5E8', text: '#065F46', icon: CheckCircle };
    default:
      return { bg: '#F3F4F6', text: '#6B7280', icon: Clock };
  }
};

const getOrderStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    ESCROW_LOCKED: '💰 Đang chờ kiểm tra',
    IN_INSPECTION: '🔍 Kiểm tra hàng',
    INSPECTION_PASSED: '✓ Kiểm tra xong',
    SHIPPING: '📦 Đang gửi hàng',
    DELIVERED: '🚚 Đã giao',
    COMPLETED: '✓ Hoàn tất',
  };
  return labels[status] || status;
};

export const OrderCard: React.FC<OrderCardProps> = ({
  id,
  orderCode,
  buyerName,
  itemTitle,
  amount,
  status,
  createdAt,
  onPress,
}) => {
  const statusInfo = getOrderStatusColor(status);
  const Icon = statusInfo.icon;

  return (
    <TouchableOpacity
      style={tw`bg-white rounded-2xl p-4 mb-3 shadow-sm border border-gray-100`}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Header: Order code + Status badge */}
      <View style={tw`flex-row items-center justify-between mb-3`}>
        <Text style={tw`text-sm font-bold text-gray-700`}>#{orderCode}</Text>
        <View
          style={[
            tw`flex-row items-center px-2.5 py-1 rounded-full gap-1`,
            { backgroundColor: statusInfo.bg },
          ]}
        >
          <Icon size={12} color={statusInfo.text} strokeWidth={2.5} />
          <Text style={[tw`text-xs font-semibold`, { color: statusInfo.text }]}>
            {getOrderStatusLabel(status)}
          </Text>
        </View>
      </View>

      {/* Buyer info */}
      <Text style={tw`text-xs text-gray-500 mb-2`}>Từ: {buyerName}</Text>

      {/* Item & Amount */}
      <View style={tw`flex-row justify-between items-start mb-3`}>
        <Text style={tw`flex-1 text-sm text-gray-800`} numberOfLines={1}>
          {itemTitle}
        </Text>
        <Text style={tw`text-lg font-bold text-green-600 ml-2`}>{(amount / 1000000).toFixed(1)}M</Text>
      </View>

      {/* Date & Arrow */}
      <View style={tw`flex-row items-center justify-between`}>
        <Text style={tw`text-xs text-gray-400`}>{createdAt}</Text>
        <ChevronRight size={16} color={COLORS.textLight} />
      </View>
    </TouchableOpacity>
  );
};
