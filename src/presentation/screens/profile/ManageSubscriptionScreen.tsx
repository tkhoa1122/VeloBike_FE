/**
 * VeloBike Manage Subscription Screen
 * Quản lý gói đăng ký hiện tại và lịch sử
 */
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  Crown,
  Calendar,
  TrendingUp,
  Package,
  CheckCircle,
  AlertCircle,
  ArrowUpCircle,
} from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  COLORS,
  SPACING,
  RADIUS,
  FONT_SIZES,
  FONT_WEIGHTS,
  SHADOWS,
} from '../../../config/theme';
import { ENV } from '../../../config/environment';

interface SubscriptionData {
  subscription: {
    planType: string;
    status: string;
    startDate: string;
    endDate: string;
  };
  plan: {
    name: string;
    displayName: string;
    price: number;
  };
  usage: {
    listings: {
      used: number;
      limit: number;
      canCreate: boolean;
    };
    boosts?: {
      used: number;
      limit: number;
      remaining: number;
    };
    inspections?: {
      used: number;
      limit: number;
      remaining: number;
    };
  };
}

interface ManageSubscriptionScreenProps {
  onBack?: () => void;
  onUpgrade?: () => void;
  navigation?: any;
}

export const ManageSubscriptionScreen: React.FC<ManageSubscriptionScreenProps> = ({
  onBack,
  onUpgrade,
  navigation,
}) => {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);

  useEffect(() => {
    loadSubscription();
  }, []);

  const getToken = async (): Promise<string> => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      return token || '';
    } catch (error) {
      console.error('Error getting token:', error);
      return '';
    }
  };

  const loadSubscription = async (isRefreshing = false) => {
    try {
      if (!isRefreshing) setLoading(true);

      const token = await getToken();
      const response = await fetch(`${ENV.API_BASE_URL}/subscriptions/my-subscription`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (result.success && result.data) {
        setSubscription(result.data);
      } else {
        throw new Error(result.message || 'Failed to load subscription');
      }
    } catch (error) {
      console.error('Failed to load subscription:', error);
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: 'Không thể tải thông tin gói đăng ký',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadSubscription(true);
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getDaysRemaining = () => {
    if (!subscription) return 0;
    const now = new Date();
    const endDate = new Date(subscription.subscription.endDate);
    const diff = endDate.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return COLORS.success;
      case 'EXPIRED':
        return COLORS.error;
      case 'CANCELLED':
        return COLORS.textLight;
      default:
        return COLORS.textSecondary;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'Đang hoạt động';
      case 'EXPIRED':
        return 'Đã hết hạn';
      case 'CANCELLED':
        return 'Đã hủy';
      default:
        return status;
    }
  };

  const getPlanColor = (planType: string) => {
    switch (planType) {
      case 'BASIC':
        return '#3B82F6';
      case 'PREMIUM':
        return '#F59E0B';
      case 'ENTERPRISE':
        return '#8B5CF6';
      default:
        return COLORS.textLight;
    }
  };

  const renderUsageBar = (used: number, limit: number, label: string) => {
    const percentage = Math.min((used / limit) * 100, 100);
    const isNearLimit = percentage >= 80;

    return (
      <View style={styles.usageItem}>
        <View style={styles.usageHeader}>
          <Text style={styles.usageLabel}>{label}</Text>
          <Text style={[styles.usageText, isNearLimit && styles.usageTextWarning]}>
            {used}/{limit}
          </Text>
        </View>
        <View style={styles.usageBarBg}>
          <View
            style={[
              styles.usageBarFill,
              {
                width: `${percentage}%`,
                backgroundColor: isNearLimit ? COLORS.warning : COLORS.primary,
              },
            ]}
          />
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => {
              if (onBack) {
                onBack();
              } else if (navigation) {
                navigation.goBack();
              }
            }}
          >
            <ChevronLeft size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Quản lý gói đăng ký</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </View>
    );
  }

  if (!subscription) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => {
              if (onBack) {
                onBack();
              } else if (navigation) {
                navigation.goBack();
              }
            }}
          >
            <ChevronLeft size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Quản lý gói đăng ký</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Package size={64} color={COLORS.textLight} />
          <Text style={styles.emptyText}>Bạn chưa có gói đăng ký nào</Text>
        </View>
      </View>
    );
  }

  const daysRemaining = getDaysRemaining();
  const isFree = subscription.subscription.planType === 'FREE';
  const planColor = getPlanColor(subscription.subscription.planType);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => {
            if (onBack) {
              onBack();
            } else if (navigation) {
              navigation.goBack();
            }
          }}
        >
          <ChevronLeft size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quản lý gói đăng ký</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 20 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Current Plan Card */}
        <View style={[styles.planCard, { borderLeftColor: planColor }]}>
          <View style={styles.planHeader}>
            <View style={[styles.planIconWrap, { backgroundColor: planColor + '20' }]}>
              <Crown size={24} color={planColor} />
            </View>
            <View style={styles.planInfo}>
              <Text style={styles.planName}>{subscription.plan.displayName}</Text>
              <View style={styles.statusBadge}>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: getStatusColor(subscription.subscription.status) },
                  ]}
                />
                <Text style={styles.statusText}>
                  {getStatusText(subscription.subscription.status)}
                </Text>
              </View>
            </View>
            {!isFree && (
              <Text style={styles.planPrice}>
                {subscription.plan.price.toLocaleString('vi-VN')}đ
              </Text>
            )}
          </View>

          {!isFree && (
            <View style={styles.planDetails}>
              <View style={styles.planDetailRow}>
                <Calendar size={16} color={COLORS.textSecondary} />
                <Text style={styles.planDetailText}>
                  Bắt đầu: {formatDate(subscription.subscription.startDate)}
                </Text>
              </View>
              <View style={styles.planDetailRow}>
                <Calendar size={16} color={COLORS.textSecondary} />
                <Text style={styles.planDetailText}>
                  Kết thúc: {formatDate(subscription.subscription.endDate)}
                </Text>
              </View>
              {daysRemaining > 0 && (
                <View style={styles.daysRemaining}>
                  {daysRemaining <= 7 ? (
                    <AlertCircle size={16} color={COLORS.warning} />
                  ) : (
                    <CheckCircle size={16} color={COLORS.success} />
                  )}
                  <Text
                    style={[
                      styles.daysRemainingText,
                      daysRemaining <= 7 && styles.daysRemainingTextWarning,
                    ]}
                  >
                    Còn {daysRemaining} ngày
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Usage Statistics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thống kê sử dụng</Text>
          <View style={styles.usageCard}>
            {renderUsageBar(
              subscription.usage.listings.used,
              subscription.usage.listings.limit,
              'Tin đăng'
            )}

            {subscription.usage.boosts && (
              <View style={styles.usageItem}>
                <View style={styles.usageHeader}>
                  <Text style={styles.usageLabel}>Đẩy tin</Text>
                  <Text style={styles.usageText}>
                    {subscription.usage.boosts.remaining}/{subscription.usage.boosts.limit} còn lại
                  </Text>
                </View>
              </View>
            )}

            {subscription.usage.inspections && (
              <View style={styles.usageItem}>
                <View style={styles.usageHeader}>
                  <Text style={styles.usageLabel}>Kiểm định</Text>
                  <Text style={styles.usageText}>
                    {subscription.usage.inspections.remaining}/{subscription.usage.inspections.limit} còn lại
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Upgrade section */}
        {isFree && (
          <View style={styles.upgradeSection}>
            <View style={styles.upgradeIconWrap}>
              <TrendingUp size={32} color={COLORS.accent} />
            </View>
            <Text style={styles.upgradeTitle}>Nâng cấp lên Premium</Text>
            <Text style={styles.upgradeSubtitle}>
              Tăng giới hạn tin đăng, giảm hoa hồng và nhiều tính năng khác
            </Text>
            <TouchableOpacity
              style={styles.upgradeBtn}
              onPress={() => {
                if (onUpgrade) {
                  onUpgrade();
                } else if (navigation) {
                  navigation.navigate('SubscriptionPlans');
                }
              }}
            >
              <ArrowUpCircle size={20} color={COLORS.white} />
              <Text style={styles.upgradeBtnText}>Xem các gói Premium</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Info section */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>ℹ️ Thông tin</Text>
          <Text style={styles.infoText}>
            {isFree
              ? '• Gói miễn phí có giới hạn về số lượng tin đăng và tính năng\n• Nâng cấp lên Premium để mở khóa toàn bộ tính năng'
              : '• Gói đăng ký sẽ tự động gia hạn vào cuối kỳ\n• Bạn có thể hủy đăng ký bất kỳ lúc nào\n• Liên hệ hỗ trợ nếu có thắc mắc'}
          </Text>
        </View>
      </ScrollView>

      <Toast />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  emptyText: {
    fontSize: FONT_SIZES.base,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
  scrollContent: {
    padding: SPACING.xl,
  },
  planCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    ...SHADOWS.md,
    borderLeftWidth: 4,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  planIconWrap: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  planInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  planName: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  planPrice: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
  },
  planDetails: {
    gap: SPACING.sm,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  planDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  planDetailText: {
    fontSize: FONT_SIZES.base,
    color: COLORS.textSecondary,
  },
  daysRemaining: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.xs,
  },
  daysRemainingText: {
    fontSize: FONT_SIZES.base,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.success,
  },
  daysRemainingTextWarning: {
    color: COLORS.warning,
  },
  section: {
    marginTop: SPACING.xl,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  usageCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    ...SHADOWS.sm,
    gap: SPACING.lg,
  },
  usageItem: {
    gap: SPACING.sm,
  },
  usageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  usageLabel: {
    fontSize: FONT_SIZES.base,
    color: COLORS.text,
    fontWeight: FONT_WEIGHTS.medium,
  },
  usageText: {
    fontSize: FONT_SIZES.base,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  usageTextWarning: {
    color: COLORS.warning,
  },
  usageBarBg: {
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  usageBarFill: {
    height: '100%',
    borderRadius: RADIUS.full,
  },
  upgradeSection: {
    marginTop: SPACING.xl,
    backgroundColor: COLORS.accentSurface,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
  },
  upgradeIconWrap: {
    width: 64,
    height: 64,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  upgradeTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  upgradeSubtitle: {
    fontSize: FONT_SIZES.base,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.lg,
  },
  upgradeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.accent,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.full,
  },
  upgradeBtnText: {
    fontSize: FONT_SIZES.base,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
  },
  infoSection: {
    marginTop: SPACING.xl,
    backgroundColor: COLORS.infoSurface,
    padding: SPACING.xl,
    borderRadius: RADIUS.lg,
  },
  infoTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  infoText: {
    fontSize: FONT_SIZES.base,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
});

export default ManageSubscriptionScreen;
