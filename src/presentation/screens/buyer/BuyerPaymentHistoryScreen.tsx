/**
 * Buyer Payment History Screen
 * Màn hình lịch sử thanh toán chi tiết cho buyer
 * - Hiển thị tất cả giao dịch với phân trang
 * - Filter theo loại giao dịch
 * - Phân biệt thu/chi bằng màu sắc
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { ArrowLeft, ArrowUp, ArrowDown, Filter } from 'lucide-react-native';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, SHADOWS } from '../../../config/theme';
import { WalletApiClient, type WalletTransaction } from '../../../data/apis/WalletApiClient';
import { container } from '../../../di/Container';

interface BuyerPaymentHistoryScreenProps {
  onBack: () => void;
}

const TYPE_LABELS: Record<string, string> = {
  DEPOSIT: 'Nạp tiền',
  WITHDRAW: 'Rút tiền',
  PAYMENT_HOLD: 'Giữ tiền thanh toán',
  PAYMENT_RELEASE: 'Giải phóng tiền',
  REFUND: 'Hoàn tiền',
  PLATFORM_FEE: 'Phí nền tảng',
  INSPECTION_FEE: 'Phí kiểm định',
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Đang chờ',
  COMPLETED: 'Hoàn thành',
  FAILED: 'Thất bại',
  CANCELLED: 'Đã hủy',
};

export const BuyerPaymentHistoryScreen: React.FC<BuyerPaymentHistoryScreenProps> = ({ onBack }) => {
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  const walletClient = container().walletApiClient;

  const fetchTransactions = useCallback(
    async (page: number, append: boolean = false) => {
      try {
        if (append) {
          setLoadingMore(true);
        } else {
          setLoading(true);
        }

        const res = await walletClient.getTransactions({ page, limit: 20 });

        if (res.success && res.data) {
          const mapped = res.data.map((t: any) => ({
            id: t._id,
            type: t.type,
            amount: t.amount,
            status: t.status,
            description: t.description,
            createdAt: t.createdAt,
            relatedOrderId: t.relatedOrderId,
            metadata: t.metadata,
          }));

          if (append) {
            setTransactions((prev) => [...prev, ...mapped]);
          } else {
            setTransactions(mapped);
          }

          setTotalPages(res.totalPages ?? 1);
          setCurrentPage(page);
        }
      } catch (error) {
        console.error('Error fetching transactions:', error);
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [walletClient]
  );

  useEffect(() => {
    fetchTransactions(1);
  }, [fetchTransactions]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTransactions(1);
  }, [fetchTransactions]);

  const loadMore = useCallback(() => {
    if (!loadingMore && currentPage < totalPages) {
      fetchTransactions(currentPage + 1, true);
    }
  }, [loadingMore, currentPage, totalPages, fetchTransactions]);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const formatDateTime = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isOutflow = (type: string): boolean => {
    return ['PAYMENT_HOLD', 'WITHDRAW', 'PLATFORM_FEE', 'INSPECTION_FEE'].includes(type);
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'COMPLETED':
        return COLORS.success;
      case 'PENDING':
        return COLORS.warning;
      case 'FAILED':
      case 'CANCELLED':
        return COLORS.error;
      default:
        return COLORS.textLight;
    }
  };

  const renderItem = ({ item }: { item: WalletTransaction }) => {
    const outflow = isOutflow(item.type);
    const amountColor = outflow ? COLORS.error : COLORS.success;
    const ArrowIcon = outflow ? ArrowDown : ArrowUp;

    return (
      <View style={styles.transactionCard}>
        <View style={styles.transactionHeader}>
          <View style={styles.transactionLeft}>
            <View style={[styles.iconCircle, { backgroundColor: `${amountColor}15` }]}>
              <ArrowIcon size={20} color={amountColor} />
            </View>
            <View style={styles.transactionInfo}>
              <Text style={styles.transactionType}>{TYPE_LABELS[item.type] || item.type}</Text>
              <Text style={styles.transactionDate}>{formatDateTime(item.createdAt)}</Text>
            </View>
          </View>
          <View style={styles.transactionRight}>
            <Text style={[styles.transactionAmount, { color: amountColor }]}>
              {outflow ? '-' : '+'}
              {formatCurrency(Math.abs(item.amount))}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(item.status)}20` }]}>
              <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                {STATUS_LABELS[item.status] || item.status}
              </Text>
            </View>
          </View>
        </View>
        {item.description && <Text style={styles.transactionDesc}>{item.description}</Text>}
      </View>
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={COLORS.primary} />
        <Text style={styles.footerText}>Đang tải thêm...</Text>
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>Bạn chưa có giao dịch nào</Text>
      <Text style={styles.emptySubtext}>Lịch sử thanh toán của bạn sẽ hiển thị ở đây</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <ArrowLeft size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Lịch sử thanh toán</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <ArrowLeft size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lịch sử thanh toán</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Pagination Info */}
      {totalPages > 1 && (
        <View style={styles.paginationInfo}>
          <Text style={styles.paginationText}>
            Trang {currentPage} / {totalPages}
          </Text>
        </View>
      )}

      {/* Transaction List */}
      <FlatList
        data={transactions}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    ...SHADOWS.sm,
  },
  backButton: {
    padding: SPACING.xs,
  },
  headerTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.textLight,
  },
  paginationInfo: {
    padding: SPACING.sm,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  paginationText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textLight,
    textAlign: 'center',
  },
  listContent: {
    padding: SPACING.md,
  },
  transactionCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionType: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.text,
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textLight,
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  transactionDesc: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textLight,
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  footerLoader: {
    paddingVertical: SPACING.lg,
    alignItems: 'center',
  },
  footerText: {
    marginTop: SPACING.xs,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textLight,
  },
  emptyContainer: {
    paddingVertical: SPACING.xl * 2,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  emptySubtext: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textLight,
    textAlign: 'center',
  },
});
