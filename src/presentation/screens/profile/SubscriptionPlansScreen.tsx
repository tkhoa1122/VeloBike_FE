/**
 * VeloBike Subscription Plans Screen
 * Hiển thị các gói đăng ký Premium với tính năng so sánh
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  Check,
  Crown,
  Zap,
  TrendingUp,
  Star,
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

interface SubscriptionPlan {
  name: string;
  displayName: string;
  price: number;
  commissionRate: number;
  maxListingsPerMonth: number;
  features: string[];
  maxBoosts?: number;
  maxInspections?: number;
  prioritySupport?: boolean;
  featuredBadge?: boolean;
}

interface SubscriptionPlansScreenProps {
  onBack?: () => void;
  navigation?: any;
  // Callback khi có payment link → navigator sẽ mở WebView
  onSubscriptionPayment?: (paymentLink: string, orderCode: number) => void;
}

export const SubscriptionPlansScreen: React.FC<SubscriptionPlansScreenProps> = ({
  onBack,
  navigation,
  onSubscriptionPayment,
}) => {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    loadPlans();
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

  const loadPlans = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${ENV.API_BASE_URL}/subscriptions/plans`);
      const result = await response.json();

      if (result.success && result.data) {
        // Filter out FREE plan from the list
        const paidPlans = result.data.filter((plan: SubscriptionPlan) => plan.name !== 'FREE');
        setPlans(paidPlans);
      } else {
        throw new Error(result.message || 'Failed to load plans');
      }
    } catch (error) {
      console.error('Failed to load plans:', error);
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: 'Không thể tải danh sách gói đăng ký',
      });
    } finally {
      setLoading(false);
    }
  };

  // ✅ Giống Web FE: Gọi create-payment-link rồi mở WebView thật (không dùng test endpoint)
  const handleSubscribe = async (planType: string) => {
    if (processingPayment) return;

    try {
      setProcessingPayment(true);
      const token = await getToken();

      // Gọi API tạo payment link
      const response = await fetch(`${ENV.API_BASE_URL}/subscriptions/create-payment-link`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ planType }),
      });

      const result = await response.json();

      if (result.success && result.data?.paymentLink) {
        const { paymentLink, orderCode } = result.data;
        // Mở WebView để user thanh toán thật trên PayOS (giống Web FE)
        if (onSubscriptionPayment) {
          onSubscriptionPayment(paymentLink, orderCode);
        } else if (navigation) {
          navigation.navigate('PaymentWebView', {
            paymentLink,
            orderCode,
            type: 'subscription',
          });
        }
      } else {
        throw new Error(result.message || 'Không thể tạo link thanh toán');
      }
    } catch (error: any) {
      console.error('Failed to subscribe:', error);
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: error.message || 'Không thể tạo link thanh toán',
      });
    } finally {
      setProcessingPayment(false);
    }
  };

  const getPlanIcon = (planName: string) => {
    switch (planName) {
      case 'BASIC':
        return Zap;
      case 'PREMIUM':
        return Crown;
      case 'ENTERPRISE':
        return Star;
      default:
        return TrendingUp;
    }
  };

  const getPlanColor = (planName: string) => {
    switch (planName) {
      case 'BASIC':
        return '#3B82F6'; // Blue
      case 'PREMIUM':
        return '#F59E0B'; // Amber/Gold
      case 'ENTERPRISE':
        return '#8B5CF6'; // Purple
      default:
        return COLORS.primary;
    }
  };

  const renderPlanCard = (plan: SubscriptionPlan) => {
    const Icon = getPlanIcon(plan.name);
    const color = getPlanColor(plan.name);
    const isPopular = plan.name === 'PREMIUM';

    return (
      <View
        key={plan.name}
        style={[
          styles.planCard,
          isPopular && styles.planCardPopular,
        ]}
      >
        {isPopular && (
          <View style={styles.popularBadge}>
            <Text style={styles.popularBadgeText}>PHỔ BIẾN NHẤT</Text>
          </View>
        )}

        <View style={[styles.planIconWrap, { backgroundColor: color + '20' }]}>
          <Icon size={32} color={color} />
        </View>

        <Text style={styles.planName}>{plan.displayName}</Text>

        <View style={styles.priceRow}>
          <Text style={styles.priceAmount}>
            {plan.price.toLocaleString('vi-VN')}đ
          </Text>
          <Text style={styles.pricePeriod}>/tháng</Text>
        </View>

        <View style={styles.planFeatures}>
          <View style={styles.featureItem}>
            <Check size={18} color={COLORS.success} />
            <Text style={styles.featureText}>
              Đăng tối đa {plan.maxListingsPerMonth} tin/tháng
            </Text>
          </View>

          <View style={styles.featureItem}>
            <Check size={18} color={COLORS.success} />
            <Text style={styles.featureText}>
              Hoa hồng {(plan.commissionRate * 100).toFixed(0)}%
            </Text>
          </View>

          {plan.maxBoosts !== undefined && (
            <View style={styles.featureItem}>
              <Check size={18} color={COLORS.success} />
              <Text style={styles.featureText}>
                {plan.maxBoosts} lượt đẩy tin/tháng
              </Text>
            </View>
          )}

          {plan.maxInspections !== undefined && (
            <View style={styles.featureItem}>
              <Check size={18} color={COLORS.success} />
              <Text style={styles.featureText}>
                {plan.maxInspections} lượt kiểm định/tháng
              </Text>
            </View>
          )}

          {plan.prioritySupport && (
            <View style={styles.featureItem}>
              <Check size={18} color={COLORS.success} />
              <Text style={styles.featureText}>Hỗ trợ ưu tiên</Text>
            </View>
          )}

          {plan.featuredBadge && (
            <View style={styles.featureItem}>
              <Check size={18} color={COLORS.success} />
              <Text style={styles.featureText}>Huy hiệu nổi bật</Text>
            </View>
          )}

          {plan.features.map((feature, idx) => (
            <View key={idx} style={styles.featureItem}>
              <Check size={18} color={COLORS.success} />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={[
            styles.subscribeBtn,
            { backgroundColor: color },
            processingPayment && styles.subscribeBtnDisabled,
          ]}
          onPress={() => handleSubscribe(plan.name)}
          disabled={processingPayment}
        >
          {processingPayment && selectedPlan === plan.name ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <Text style={styles.subscribeBtnText}>Đăng ký ngay</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

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
        <Text style={styles.headerTitle}>Nâng cấp gói Premium</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 20 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero section */}
          <View style={styles.hero}>
            <Crown size={48} color={COLORS.accent} />
            <Text style={styles.heroTitle}>Nâng cấp tài khoản Premium</Text>
            <Text style={styles.heroSubtitle}>
              Tăng doanh thu, mở rộng kinh doanh với các tính năng vượt trội
            </Text>
          </View>

          {/* Plans grid */}
          <View style={styles.plansGrid}>
            {plans.map(renderPlanCard)}
          </View>

          {/* FAQ or additional info */}
          <View style={styles.infoSection}>
            <Text style={styles.infoTitle}>💡 Lưu ý</Text>
            <Text style={styles.infoText}>
              • Gói đăng ký có hiệu lực trong 30 ngày kể từ ngày thanh toán{'\n'}
              • Bạn có thể nâng cấp hoặc hạ cấp bất kỳ lúc nào{'\n'}
              • Hủy đăng ký trước kỳ mới để tránh tính phí tiếp theo
            </Text>
          </View>
        </ScrollView>
      )}

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
  scrollContent: {
    padding: SPACING.xl,
  },
  hero: {
    alignItems: 'center',
    paddingVertical: SPACING['2xl'],
  },
  heroTitle: {
    fontSize: FONT_SIZES['2xl'],
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginTop: SPACING.md,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: FONT_SIZES.base,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
    textAlign: 'center',
    lineHeight: 22,
  },
  plansGrid: {
    gap: SPACING.lg,
  },
  planCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    ...SHADOWS.md,
    position: 'relative',
  },
  planCardPopular: {
    borderWidth: 2,
    borderColor: COLORS.accent,
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    right: SPACING.xl,
    backgroundColor: COLORS.accent,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
  },
  popularBadgeText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  planIconWrap: {
    width: 60,
    height: 60,
    borderRadius: RADIUS.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  planName: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: SPACING.lg,
  },
  priceAmount: {
    fontSize: FONT_SIZES['3xl'],
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
  },
  pricePeriod: {
    fontSize: FONT_SIZES.base,
    color: COLORS.textSecondary,
    marginLeft: SPACING.xs,
  },
  planFeatures: {
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  featureText: {
    fontSize: FONT_SIZES.base,
    color: COLORS.text,
    flex: 1,
  },
  subscribeBtn: {
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  subscribeBtnDisabled: {
    opacity: 0.6,
  },
  subscribeBtnText: {
    fontSize: FONT_SIZES.base,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
  },
  infoSection: {
    marginTop: SPACING['2xl'],
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

export default SubscriptionPlansScreen;
