/**
 * VeloBike Search Screen
 * Full search with filter modal, category chips, results grid
 */
import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  Animated,
  StatusBar,
  Modal,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Search,
  SlidersHorizontal,
  X,
  MapPin,
  Heart,
  ChevronDown,
  Rocket,
} from 'lucide-react-native';
import {
  COLORS,
  SPACING,
  RADIUS,
  FONT_SIZES,
  FONT_WEIGHTS,
  SHADOWS,
} from '../../../config/theme';
import { Button } from '../../components/common/Button';
import { formatCurrency, formatBikeCondition, formatBikeType } from '../../../utils/formatters';
import { BIKE_TYPES, BIKE_CONDITIONS, POPULAR_BIKE_BRANDS } from '../../../config/constants';
import { useListingStore } from '../../viewmodels/ListingStore';
import type { Listing, ListingFilters, ListingSearchParams, ListingSortOptions } from '../../../domain/entities/Listing';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_W = (SCREEN_WIDTH - SPACING.xl * 2 - SPACING.md) / 2;

const SORT_OPTIONS = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'price_asc', label: 'Giá thấp → cao' },
  { value: 'price_desc', label: 'Giá cao → thấp' },
  { value: 'popular', label: 'Phổ biến nhất' },
];

interface SearchScreenProps {
  onListingPress?: (id: string) => void;
}

export const SearchScreen: React.FC<SearchScreenProps> = ({ onListingPress }) => {
  const insets = useSafeAreaInsets();
  const { listings, loadingState, totalCount, getListings } = useListingStore();
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedCondition, setSelectedCondition] = useState<string | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const loading = loadingState === 'loading';
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasMountedRef = useRef(false);
  const didSkipInitialDebounceRef = useRef(false);

  const boostedTopTwo = useMemo(() => {
    return [...listings]
      .filter(item => (item.boostCount ?? 0) > 0)
      .sort((a, b) => (b.boostCount ?? 0) - (a.boostCount ?? 0))
      .slice(0, 2);
  }, [listings]);

  const regularResults = useMemo(() => {
    if (boostedTopTwo.length === 0) return listings;
    const boostedIds = new Set(boostedTopTwo.map(item => item._id));
    return listings.filter(item => !boostedIds.has(item._id));
  }, [listings, boostedTopTwo]);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, [fadeAnim]);

  const activeFilterCount = [selectedType, selectedCondition, selectedBrand, priceMin, priceMax].filter(Boolean).length;

  const clearDebounce = useCallback(() => {
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
      searchDebounceRef.current = null;
    }
  }, []);

  const buildFilters = useCallback((): ListingFilters => {
    const filters: ListingFilters = {};
    if (selectedType) filters.type = selectedType as any;
    if (selectedCondition) filters.condition = selectedCondition as any;
    if (selectedBrand) filters.brand = selectedBrand;
    if (priceMin) filters.minPrice = Number(priceMin);
    if (priceMax) filters.maxPrice = Number(priceMax);
    return filters;
  }, [selectedType, selectedCondition, selectedBrand, priceMin, priceMax]);

  const mapSortByToApi = useCallback((): ListingSortOptions => {
    switch (sortBy) {
      case 'price_asc':
        return { field: 'price', order: 'asc' };
      case 'price_desc':
        return { field: 'price', order: 'desc' };
      case 'popular':
        return { field: 'views', order: 'desc' };
      case 'newest':
      default:
        return { field: 'createdAt', order: 'desc' };
    }
  }, [sortBy]);

  const buildSearchParams = useCallback(
    (queryOverride?: string): ListingSearchParams => {
      const trimmedQuery = (queryOverride ?? query).trim();
      const filters = buildFilters();
      const filtersToSend = Object.keys(filters).length > 0 ? filters : undefined;

      return {
        page: 1,
        limit: 20,
        ...(trimmedQuery ? { query: trimmedQuery } : {}),
        ...(filtersToSend ? { filters: filtersToSend } : {}),
        sort: mapSortByToApi(),
      };
    },
    [query, buildFilters, mapSortByToApi],
  );

  const performSearch = useCallback(
    (queryOverride?: string) => {
      clearDebounce();
      getListings(buildSearchParams(queryOverride));
    },
    [clearDebounce, getListings, buildSearchParams],
  );

  // Initial load (chạy 1 lần) + đảm bảo có sort & filter thống nhất
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    clearDebounce();
    getListings(buildSearchParams());
    hasMountedRef.current = true;
    return () => clearDebounce();
  }, []);

  // Debounce: gõ chữ / đổi filter / đổi sort đều áp dụng sau ~250ms
  useEffect(() => {
    if (!hasMountedRef.current) return;
    // Skip the first debounce tick after initial load to avoid duplicate API calls.
    if (!didSkipInitialDebounceRef.current) {
      didSkipInitialDebounceRef.current = true;
      return;
    }
    clearDebounce();
    searchDebounceRef.current = setTimeout(() => {
      performSearch();
    }, 250);

    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, [
    query,
    selectedType,
    selectedCondition,
    selectedBrand,
    priceMin,
    priceMax,
    sortBy,
    performSearch,
    clearDebounce,
  ]);

  const clearFilters = useCallback(() => {
    setSelectedType(null);
    setSelectedCondition(null);
    setSelectedBrand(null);
    setPriceMin('');
    setPriceMax('');
  }, []);

  const renderItem = useCallback(({ item }: { item: Listing }) => (
    <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={() => onListingPress?.(item._id!)}>
      <View style={styles.imgWrap}>
        <Image source={{ uri: item.media?.thumbnails?.[0] }} style={styles.img} />
        <View style={styles.condBadge}>
          <Text style={styles.condText}>{formatBikeCondition(item.generalInfo?.condition ?? '')}</Text>
        </View>
        <TouchableOpacity style={styles.heartBtn}><Heart size={14} color={COLORS.white} /></TouchableOpacity>
      </View>
      <View style={styles.cardInfo}>
        <Text style={styles.cardBrand}>{item.generalInfo?.brand}</Text>
        <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.cardPrice}>{formatCurrency(item.pricing?.amount ?? 0)}</Text>
        <View style={styles.cardMeta}><MapPin size={10} color={COLORS.textLight} /><Text style={styles.cardMetaTxt}>{item.location?.address}</Text></View>
      </View>
    </TouchableOpacity>
  ), [onListingPress]);

  const renderBoostedCard = useCallback((item: Listing) => (
    <TouchableOpacity
      key={item._id}
      style={[styles.card, styles.boostedCard]}
      activeOpacity={0.85}
      onPress={() => onListingPress?.(item._id!)}
    >
      <View style={styles.imgWrap}>
        <Image source={{ uri: item.media?.thumbnails?.[0] }} style={styles.img} />
        <View style={styles.boostedBadge}>
          <Rocket size={10} color={COLORS.accentDark} />
          <Text style={styles.boostedBadgeText}>Boost x{item.boostCount ?? 0}</Text>
        </View>
      </View>
      <View style={styles.cardInfo}>
        <Text style={styles.cardBrand}>{item.generalInfo?.brand}</Text>
        <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.cardPrice}>{formatCurrency(item.pricing?.amount ?? 0)}</Text>
        <View style={styles.cardMeta}><MapPin size={10} color={COLORS.textLight} /><Text style={styles.cardMetaTxt}>{item.location?.address}</Text></View>
      </View>
    </TouchableOpacity>
  ), [onListingPress]);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      {/* Search header */}
      <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
        <View style={styles.searchBox}>
          <Search size={18} color={COLORS.textLight} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm xe đạp, phụ kiện..."
            placeholderTextColor={COLORS.textLight}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => performSearch()}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setQuery('');
                performSearch('');
              }}
            >
              <X size={16} color={COLORS.textLight} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.filterBtn} onPress={() => setShowFilters(true)}>
          <SlidersHorizontal size={20} color={COLORS.primary} />
          {activeFilterCount > 0 && <View style={styles.filterBadge}><Text style={styles.filterBadgeText}>{activeFilterCount}</Text></View>}
        </TouchableOpacity>
      </Animated.View>

      {/* Category chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        scrollEnabled
        style={styles.chipScrollView}
        contentContainerStyle={styles.chipScroll}
      >
        {BIKE_TYPES.map(t => (
          <TouchableOpacity key={t} style={[styles.chip, selectedType === t && styles.chipActive]} onPress={() => setSelectedType(selectedType === t ? null : t)}>
            <Text style={[styles.chipText, selectedType === t && styles.chipTextActive]}>{formatBikeType(t)}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Sort */}
      <View style={styles.sortRow}>
        <Text style={styles.resultCount}>{totalCount} kết quả</Text>
        <TouchableOpacity
          style={styles.sortBtn}
          onPress={() => {
            const idx = SORT_OPTIONS.findIndex((s) => s.value === sortBy);
            const next = SORT_OPTIONS[(idx + 1) % SORT_OPTIONS.length]?.value ?? 'newest';
            setSortBy(next);
          }}
        >
          <Text style={styles.sortTxt}>{SORT_OPTIONS.find(s => s.value === sortBy)?.label}</Text>
          <ChevronDown size={14} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Results */}
      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>
      ) : listings.length === 0 ? (
        <View style={styles.center}><Search size={48} color={COLORS.textLight} /><Text style={styles.emptyTitle}>Không tìm thấy</Text><Text style={styles.emptySub}>Thử thay đổi bộ lọc hoặc từ khóa</Text></View>
      ) : (
        <FlatList
          data={regularResults}
          numColumns={2}
          keyExtractor={i => i._id!}
          renderItem={renderItem}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            boostedTopTwo.length > 0 ? (
              <View style={styles.boostedSection}>
                <Text style={styles.boostedTitle}>Nổi bật gợi ý</Text>
                <View style={styles.boostedRow}>
                  {boostedTopTwo.map(renderBoostedCard)}
                </View>
                <Text style={styles.resultLabel}>Kết quả tìm kiếm</Text>
              </View>
            ) : null
          }
        />
      )}

      {/* Filter modal */}
      <Modal visible={showFilters} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { paddingBottom: insets.bottom + SPACING.xl }]}>
            <View style={styles.modalHeader}><Text style={styles.modalTitle}>Bộ lọc</Text><TouchableOpacity onPress={() => setShowFilters(false)}><X size={22} color={COLORS.text} /></TouchableOpacity></View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.filterLabel}>Tình trạng</Text>
              <View style={styles.filterChips}>
                {BIKE_CONDITIONS.map(c => (
                  <TouchableOpacity key={c} style={[styles.fChip, selectedCondition === c && styles.fChipActive]} onPress={() => setSelectedCondition(selectedCondition === c ? null : c)}>
                    <Text style={[styles.fChipText, selectedCondition === c && styles.fChipTextActive]}>{formatBikeCondition(c)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.filterLabel}>Thương hiệu</Text>
              <View style={styles.filterChips}>
                {POPULAR_BIKE_BRANDS.slice(0, 15).map(b => (
                    <TouchableOpacity key={b} style={[styles.fChip, selectedBrand === b && styles.fChipActive]} onPress={() => setSelectedBrand(selectedBrand === b ? null : b)}>
                      <Text style={[styles.fChipText, selectedBrand === b && styles.fChipTextActive]}>{b}</Text>
                    </TouchableOpacity>
                  ))}
              </View>
              <Text style={styles.filterLabel}>Khoảng giá (VNĐ)</Text>
              <View style={styles.priceRow}>
                <TextInput style={styles.priceInput} placeholder="Từ" placeholderTextColor={COLORS.textLight} keyboardType="numeric" value={priceMin} onChangeText={setPriceMin} />
                <Text style={styles.priceSep}>—</Text>
                <TextInput style={styles.priceInput} placeholder="Đến" placeholderTextColor={COLORS.textLight} keyboardType="numeric" value={priceMax} onChangeText={setPriceMax} />
              </View>
            </ScrollView>
            <View style={styles.modalActions}>
              <Button title="Xóa bộ lọc" onPress={clearFilters} variant="ghost" style={{ flex: 1 }} />
              <Button
                title={`Áp dụng${activeFilterCount ? ` (${activeFilterCount})` : ''}`}
                onPress={() => {
                  setShowFilters(false);
                  performSearch();
                }}
                style={{ flex: 2 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.base, paddingVertical: SPACING.sm, gap: SPACING.sm },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, paddingHorizontal: SPACING.md, height: 44, gap: SPACING.sm },
  searchInput: { flex: 1, fontSize: FONT_SIZES.base, color: COLORS.text, padding: 0 },
  filterBtn: { width: 44, height: 44, borderRadius: RADIUS.lg, backgroundColor: COLORS.primarySurface, justifyContent: 'center', alignItems: 'center' },
  filterBadge: { position: 'absolute', top: 4, right: 4, width: 16, height: 16, borderRadius: 8, backgroundColor: COLORS.accent, justifyContent: 'center', alignItems: 'center' },
  filterBadgeText: { fontSize: 10, fontWeight: FONT_WEIGHTS.bold, color: COLORS.white },
  chipScrollView: { maxHeight: 52 },
  chipScroll: { paddingHorizontal: SPACING.base, gap: SPACING.sm, paddingVertical: SPACING.xs, alignItems: 'center' },
  chip: { height: 34, minHeight: 34, alignSelf: 'center', justifyContent: 'center', paddingHorizontal: SPACING.md, borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.border },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, fontWeight: FONT_WEIGHTS.medium },
  chipTextActive: { color: COLORS.white },
  sortRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.xl, paddingVertical: SPACING.sm },
  resultCount: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },
  sortBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sortTxt: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, fontWeight: FONT_WEIGHTS.medium },
  listContent: { paddingHorizontal: SPACING.xl, paddingBottom: 120 },
  row: { gap: SPACING.md, marginBottom: SPACING.md },
  card: { width: CARD_W, backgroundColor: COLORS.white, borderRadius: RADIUS.lg, ...SHADOWS.sm, overflow: 'hidden' },
  imgWrap: { width: '100%', height: CARD_W * 0.75, backgroundColor: COLORS.surface },
  img: { width: '100%', height: '100%', resizeMode: 'cover' },
  condBadge: { position: 'absolute', top: 6, left: 6, backgroundColor: COLORS.accent, borderRadius: RADIUS.xs, paddingHorizontal: 6, paddingVertical: 1 },
  condText: { fontSize: 10, fontWeight: FONT_WEIGHTS.bold, color: COLORS.white },
  heartBtn: { position: 'absolute', top: 6, right: 6, width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  cardInfo: { padding: SPACING.sm },
  cardBrand: { fontSize: 10, fontWeight: FONT_WEIGHTS.semibold, color: COLORS.primary, textTransform: 'uppercase', letterSpacing: 0.5 },
  cardTitle: { fontSize: FONT_SIZES.sm, fontWeight: FONT_WEIGHTS.medium, color: COLORS.text, marginVertical: 2, lineHeight: FONT_SIZES.sm * 1.4 },
  cardPrice: { fontSize: FONT_SIZES.base, fontWeight: FONT_WEIGHTS.bold, color: COLORS.accent },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 4 },
  cardMetaTxt: { fontSize: 11, color: COLORS.textLight },
  boostedSection: { marginBottom: SPACING.sm },
  boostedRow: { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.sm },
  boostedTitle: {
    fontSize: FONT_SIZES.base,
    color: COLORS.accentDark,
    fontWeight: FONT_WEIGHTS.bold,
    marginBottom: SPACING.sm,
  },
  boostedCard: {
    borderWidth: 1.5,
    borderColor: '#FCD34D',
    backgroundColor: '#FFFBEB',
  },
  boostedBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FEF3C7',
    borderRadius: RADIUS.xs,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  boostedBadgeText: {
    fontSize: 10,
    color: COLORS.accentDark,
    fontWeight: FONT_WEIGHTS.bold,
  },
  resultLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHTS.semibold,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: SPACING.md },
  emptyTitle: { fontSize: FONT_SIZES.lg, fontWeight: FONT_WEIGHTS.semibold, color: COLORS.text },
  emptySub: { fontSize: FONT_SIZES.md, color: COLORS.textLight },
  modalOverlay: { flex: 1, backgroundColor: COLORS.overlay, justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: COLORS.white, borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl, maxHeight: '90%', paddingHorizontal: SPACING.xl, paddingTop: SPACING.xl },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.xl },
  modalTitle: { fontSize: FONT_SIZES.xl, fontWeight: FONT_WEIGHTS.bold, color: COLORS.text },
  filterLabel: { fontSize: FONT_SIZES.base, fontWeight: FONT_WEIGHTS.semibold, color: COLORS.text, marginTop: SPACING.lg, marginBottom: SPACING.sm },
  filterChips: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, paddingHorizontal: 0 },
  fChip: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border },
  fChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  fChipText: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },
  fChipTextActive: { color: COLORS.white, fontWeight: FONT_WEIGHTS.semibold },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  priceInput: { flex: 1, backgroundColor: COLORS.surface, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: SPACING.md, fontSize: FONT_SIZES.base, color: COLORS.text },
  priceSep: { fontSize: FONT_SIZES.lg, color: COLORS.textLight },
  modalActions: { flexDirection: 'row', gap: SPACING.md, marginTop: SPACING.xl },
});

export default SearchScreen;
