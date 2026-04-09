import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import tw from 'twrnc';
import { Eye, Rocket, ChevronRight } from 'lucide-react-native';
import { COLORS } from '../../../../config/theme';

interface ListingCardProps {
  id: string;
  title: string;
  image: string;
  price: number;
  views: number;
  boostCount?: number;
  status: 'DRAFT' | 'PUBLISHED' | 'SOLD' | 'REJECTED';
  onPress: () => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'PUBLISHED':
      return { bg: '#DBEAFE', text: '#1D4ED8' };
    case 'DRAFT':
      return { bg: '#F3F4F6', text: '#6B7280' };
    case 'SOLD':
      return { bg: '#D1FAE5', text: '#059669' };
    case 'REJECTED':
      return { bg: '#FEE2E2', text: '#DC2626' };
    default:
      return { bg: '#F3F4F6', text: '#6B7280' };
  }
};

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    PUBLISHED: '🟢 Đang bán',
    DRAFT: '⚪ Nháp',
    SOLD: '✓ Đã bán',
    REJECTED: '✗ Bị từ chối',
  };
  return labels[status] || status;
};

export const ListingCard: React.FC<ListingCardProps> = ({
  id,
  title,
  image,
  price,
  views,
  boostCount,
  status,
  onPress,
}) => {
  const statusColor = getStatusColor(status);

  return (
    <TouchableOpacity
      style={tw`flex-row bg-white rounded-2xl overflow-hidden mb-3 shadow-sm border border-gray-100`}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Thumbnail */}
      <Image source={{ uri: image }} style={tw`w-20 h-20 bg-gray-200`} resizeMode="cover" />

      {/* Info */}
      <View style={tw`flex-1 p-3 justify-between`}>
        {/* Title & Price */}
        <View>
          <Text style={tw`text-sm font-bold text-gray-900 mb-1`} numberOfLines={1}>
            {title}
          </Text>
          <Text style={tw`text-base font-bold text-green-600`}>{(price / 1000000).toFixed(1)}M</Text>
        </View>

        {/* Status & Views */}
        <View style={tw`flex-row items-center justify-between`}>
          <View
            style={[
              tw`px-2 py-1 rounded-full`,
              { backgroundColor: statusColor.bg },
            ]}
          >
            <Text style={[tw`text-xs font-semibold`, { color: statusColor.text }]}>
              {getStatusLabel(status)}
            </Text>
          </View>
          <View style={tw`flex-row items-center`}>
            <Eye size={14} color={COLORS.textSecondary} />
            <Text style={tw`text-xs text-gray-500 ml-1`}>{views}</Text>
          </View>
          <View style={tw`flex-row items-center ml-2`}>
            <Rocket size={14} color="#B45309" />
            <Text style={tw`text-xs text-amber-700 ml-1 font-semibold`}>x{boostCount ?? 0}</Text>
          </View>
        </View>
      </View>

      {/* Arrow */}
      <View style={tw`justify-center pr-3`}>
        <ChevronRight size={18} color={COLORS.textLight} />
      </View>
    </TouchableOpacity>
  );
};
