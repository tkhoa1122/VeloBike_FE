/**
 * VeloBike Welcome / Onboarding Screen
 * 3-slide onboarding with smooth animations
 */
import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Animated,
  Dimensions,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bike, Search, ShieldCheck, ChevronRight } from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import { COLORS, SPACING, RADIUS, FONT_SIZES, FONT_WEIGHTS, ANIMATION, SHADOWS } from '../../../config/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// =============================================================================
// ONBOARDING DATA
// =============================================================================
interface OnboardingSlide {
  id: string;
  icon: React.FC<{ size: number; color: string; strokeWidth?: number }>;
  title: string;
  subtitle: string;
  description: string;
  gradientColors: string[];
  iconBgColor: string;
}

const SLIDES: OnboardingSlide[] = [
  {
    id: '1',
    icon: Bike,
    title: 'Chào mừng đến\nVeloBike',
    subtitle: 'Marketplace xe đạp #1 Việt Nam',
    description: 'Mua bán xe đạp đã qua sử dụng dễ dàng, an toàn và tiết kiệm.',
    gradientColors: ['#D8F3DC', '#B7E4C7', '#95D5B2'],
    iconBgColor: '#2D6A4F',
  },
  {
    id: '2',
    icon: Search,
    title: 'Khám phá &\nSo sánh',
    subtitle: 'Hàng ngàn lựa chọn chất lượng',
    description: 'Tìm kiếm theo loại xe, thương hiệu, giá cả và vị trí. So sánh chi tiết để chọn xe phù hợp nhất.',
    gradientColors: ['#FEF9E7', '#FFF3CD', '#F5E6B8'],
    iconBgColor: '#D4A017',
  },
  {
    id: '3',
    icon: ShieldCheck,
    title: 'An toàn &\nTin cậy',
    subtitle: 'Bảo vệ mọi giao dịch',
    description: 'Thanh toán giữ hộ (escrow), kiểm định chuyên nghiệp và đánh giá minh bạch từ cộng đồng.',
    gradientColors: ['#D8F3DC', '#52B788', '#40916C'],
    iconBgColor: '#1B4332',
  },
];

// =============================================================================
// COMPONENT
// =============================================================================
interface WelcomeScreenProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onGetStarted,
  onLogin,
}) => {
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const [currentIndex, setCurrentIndex] = useState(0);

  // Entrance animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index || 0);
    }
  }).current;

  const viewConfigRef = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const handleNext = useCallback(() => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    } else {
      onGetStarted();
    }
  }, [currentIndex, onGetStarted]);

  const handleSkip = useCallback(() => {
    onGetStarted();
  }, [onGetStarted]);

  // =========================================================================
  // RENDER SLIDE
  // =========================================================================
  const renderSlide = useCallback(({ item, index }: { item: OnboardingSlide; index: number }) => {
    const inputRange = [
      (index - 1) * SCREEN_WIDTH,
      index * SCREEN_WIDTH,
      (index + 1) * SCREEN_WIDTH,
    ];

    const iconScale = scrollX.interpolate({
      inputRange,
      outputRange: [0.6, 1, 0.6],
      extrapolate: 'clamp',
    });

    const iconOpacity = scrollX.interpolate({
      inputRange,
      outputRange: [0, 1, 0],
      extrapolate: 'clamp',
    });

    const textTranslateY = scrollX.interpolate({
      inputRange,
      outputRange: [40, 0, 40],
      extrapolate: 'clamp',
    });

    const textOpacity = scrollX.interpolate({
      inputRange,
      outputRange: [0, 1, 0],
      extrapolate: 'clamp',
    });

    const IconComponent = item.icon;

    return (
      <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
        <LinearGradient
          colors={item.gradientColors}
          style={styles.slideGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Icon Circle */}
          <Animated.View
            style={[
              styles.iconCircle,
              {
                backgroundColor: item.iconBgColor,
                transform: [{ scale: iconScale }],
                opacity: iconOpacity,
              },
            ]}
          >
            {/* Decorative rings */}
            <View style={[styles.iconRing, { borderColor: `${item.iconBgColor}40` }]} />
            <View style={[styles.iconRingOuter, { borderColor: `${item.iconBgColor}20` }]} />
            <IconComponent size={56} color={COLORS.white} strokeWidth={1.5} />
          </Animated.View>
        </LinearGradient>

        {/* Text Content */}
        <Animated.View
          style={[
            styles.slideContent,
            {
              transform: [{ translateY: textTranslateY }],
              opacity: textOpacity,
            },
          ]}
        >
          <Text style={styles.slideTitle}>{item.title}</Text>
          <Text style={styles.slideSubtitle}>{item.subtitle}</Text>
          <Text style={styles.slideDescription}>{item.description}</Text>
        </Animated.View>
      </View>
    );
  }, [scrollX]);

  // =========================================================================
  // PAGINATION DOTS
  // =========================================================================
  const renderDots = () => (
    <View style={styles.dotsContainer}>
      {SLIDES.map((_, index) => {
        const inputRange = [
          (index - 1) * SCREEN_WIDTH,
          index * SCREEN_WIDTH,
          (index + 1) * SCREEN_WIDTH,
        ];

        const dotWidth = scrollX.interpolate({
          inputRange,
          outputRange: [8, 28, 8],
          extrapolate: 'clamp',
        });

        const dotOpacity = scrollX.interpolate({
          inputRange,
          outputRange: [0.3, 1, 0.3],
          extrapolate: 'clamp',
        });

        const dotColor = scrollX.interpolate({
          inputRange,
          outputRange: [COLORS.primaryMuted, COLORS.primary, COLORS.primaryMuted],
          extrapolate: 'clamp',
        });

        return (
          <Animated.View
            key={index}
            style={[
              styles.dot,
              {
                width: dotWidth,
                opacity: dotOpacity,
                backgroundColor: dotColor,
              },
            ]}
          />
        );
      })}
    </View>
  );

  // =========================================================================
  // RENDER
  // =========================================================================
  const isLastSlide = currentIndex === SLIDES.length - 1;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      {/* Skip Button */}
      <Animated.View
        style={[
          styles.skipContainer,
          { paddingTop: insets.top + SPACING.sm, opacity: fadeAnim },
        ]}
      >
        {!isLastSlide && (
          <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
            <Text style={styles.skipText}>Bỏ qua</Text>
          </TouchableOpacity>
        )}
      </Animated.View>

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewConfigRef}
        scrollEventThrottle={16}
      />

      {/* Bottom Section */}
      <Animated.View
        style={[
          styles.bottomSection,
          {
            paddingBottom: insets.bottom + SPACING.xl,
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {renderDots()}

        {/* Action Buttons */}
        <View style={styles.buttonsContainer}>
          {/* Next / Get Started Button */}
          <TouchableOpacity
            style={styles.nextButton}
            onPress={handleNext}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[COLORS.primary, COLORS.primaryDark]}
              style={styles.nextButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.nextButtonText}>
                {isLastSlide ? 'Bắt đầu ngay' : 'Tiếp theo'}
              </Text>
              {!isLastSlide && (
                <ChevronRight size={20} color={COLORS.white} strokeWidth={2.5} />
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Login Link */}
          <TouchableOpacity onPress={onLogin} style={styles.loginLink}>
            <Text style={styles.loginText}>
              Đã có tài khoản?{' '}
              <Text style={styles.loginTextBold}>Đăng nhập</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
};

// =============================================================================
// STYLES
// =============================================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  skipContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 10,
    paddingRight: SPACING.lg,
  },
  skipButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.base,
  },
  skipText: {
    fontSize: FONT_SIZES.base,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.textSecondary,
  },

  // Slide
  slide: {
    flex: 1,
  },
  slideGradient: {
    flex: 0.55,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomLeftRadius: RADIUS['3xl'],
    borderBottomRightRadius: RADIUS['3xl'],
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.xl,
  },
  iconRing: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 2,
  },
  iconRingOuter: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 1.5,
  },
  slideContent: {
    flex: 0.45,
    paddingHorizontal: SPACING['2xl'],
    paddingTop: SPACING['2xl'],
  },
  slideTitle: {
    fontSize: FONT_SIZES['4xl'],
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    lineHeight: FONT_SIZES['4xl'] * 1.15,
    marginBottom: SPACING.sm,
  },
  slideSubtitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.primary,
    marginBottom: SPACING.md,
  },
  slideDescription: {
    fontSize: FONT_SIZES.base,
    fontWeight: FONT_WEIGHTS.regular,
    color: COLORS.textSecondary,
    lineHeight: FONT_SIZES.base * 1.6,
  },

  // Bottom
  bottomSection: {
    paddingHorizontal: SPACING['2xl'],
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xl,
    gap: SPACING.sm,
  },
  dot: {
    height: 8,
    borderRadius: RADIUS.full,
  },
  buttonsContainer: {
    gap: SPACING.base,
  },
  nextButton: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.lg,
  },
  nextButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.base + 2,
    gap: SPACING.sm,
  },
  nextButtonText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
  },
  loginLink: {
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  loginText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  loginTextBold: {
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.primary,
  },
});

export default WelcomeScreen;
