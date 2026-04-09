/**
 * Buyer Wallet Screen
 * Màn hình quản lý ví tiền cho buyer
 * - Hiển thị số dư
 * - Lịch sử giao dịch (deposits, refunds, payment holds)
 * - Chức năng rút tiền với thông tin ngân hàng
 * - Lịch sử yêu cầu rút tiền
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Image,
  Alert,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Wallet, TrendingUp, Download, X, AlertCircle, CheckCircle, Clock } from 'lucide-react-native';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, SHADOWS } from '../../../config/theme';
import { WalletApiClient, type WalletTransaction, type WalletWithdrawal, type BankAccount } from '../../../data/apis/WalletApiClient';
import { container } from '../../../di/Container';

interface BuyerWalletScreenProps {
  onBack: () => void;
}

const TYPE_LABELS: Record<string, string> = {
  DEPOSIT: 'Nạp tiền',
  PAYMENT_HOLD: 'Giữ tiền thanh toán',
  REFUND: 'Hoàn tiền',
  PLATFORM_FEE: 'Phí nền tảng',
  INSPECTION_FEE: 'Phí kiểm định',
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Đang chờ',
  COMPLETED: 'Hoàn thành',
  FAILED: 'Thất bại',
  CANCELLED: 'Đã hủy',
  PROCESSING: 'Đang xử lý',
};

export const BuyerWalletScreen: React.FC<BuyerWalletScreenProps> = ({ onBack }) => {
  const insets = useSafeAreaInsets();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [withdrawals, setWithdrawals] = useState<WalletWithdrawal[]>([]);
  const [savedBank, setSavedBank] = useState<BankAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Withdraw Modal States
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [bankForm, setBankForm] = useState<BankAccount>({
    accountName: '',
    accountNumber: '',
    bankName: '',
  });
  const [withdrawLoading, setWithdrawLoading] = useState(false);

  // Withdrawal Detail Modal
  const [detailModal, setDetailModal] = useState<WalletWithdrawal | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const walletClient = container().walletApiClient;

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      const [walletRes, txRes, wdRes, userRes] = await Promise.all([
        walletClient.getWalletBalance(),
        walletClient.getTransactions({ page: 1, limit: 50 }),
        walletClient.getWithdrawals(),
        walletClient.getUserProfile(),
      ]);

      if (walletRes.success && walletRes.data) {
        setBalance(walletRes.data.balance ?? 0);
      }

      if (txRes.success && txRes.data) {
        // Filter buyer transaction types
        const buyerTypes = ['PAYMENT_HOLD', 'REFUND', 'DEPOSIT'];
        const filtered = txRes.data.filter((t: any) => buyerTypes.includes(t.type));
        setTransactions(
          filtered.map((t: any) => ({
            id: t._id,
            type: t.type,
            amount: t.amount,
            status: t.status,
            description: t.description,
            createdAt: t.createdAt,
            relatedOrderId: t.relatedOrderId,
            metadata: t.metadata,
          }))
        );
      }

      if (wdRes.success && wdRes.data) {
        setWithdrawals(
          wdRes.data.map((w: any) => ({
            id: w._id,
            amount: w.amount,
            fee: w.fee ?? 0,
            status: w.status,
            bankAccount: w.bankAccount?.accountNumber
              ? `***${String(w.bankAccount.accountNumber).slice(-4)}`
              : '-',
            requestedAt: w.requestedAt,
            transferProof: w.transferProof,
            note: w.note,
            bankAccountRaw: w.bankAccount,
          }))
        );
      }

      if (userRes.success && userRes.data?.bankAccount) {
        setSavedBank(userRes.data.bankAccount);
      }
    } catch (error) {
      console.error('Error fetching wallet data:', error);
      Alert.alert('Lỗi', 'Không thể tải thông tin ví');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [walletClient]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  const calculateFee = (amount: number): number => {
    return amount >= 1000000 ? 0 : 10000;
  };

  const handleWithdraw = async () => {
    const amount = parseInt(withdrawAmount);
    if (!amount || isNaN(amount)) {
      Alert.alert('Lỗi', 'Vui lòng nhập số tiền hợp lệ');
      return;
    }
    if (amount < 50000) {
      Alert.alert('Lỗi', 'Số tiền rút tối thiểu là 50,000 VND');
      return;
    }
    if (amount > balance) {
      Alert.alert('Lỗi', 'Số dư không đủ');
      return;
    }

    const bank = savedBank || bankForm;
    if (!bank.accountName?.trim() || !bank.accountNumber?.trim() || !bank.bankName?.trim()) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin tài khoản ngân hàng');
      return;
    }

    try {
      setWithdrawLoading(true);
      const res = await walletClient.requestWithdrawal({
        amount,
        bankAccount: {
          accountName: bank.accountName!.trim(),
          accountNumber: bank.accountNumber!.trim(),
          bankName: bank.bankName!.trim(),
        },
      });

      if (res.success) {
        Alert.alert('Thành công', 'Yêu cầu rút tiền đã được gửi');
        setShowWithdrawModal(false);
        setWithdrawAmount('');
        setBankForm({ accountName: '', accountNumber: '', bankName: '' });
        fetchData();
      } else {
        Alert.alert('Lỗi', res.message || 'Không thể tạo yêu cầu rút tiền');
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Có lỗi xảy ra khi xử lý yêu cầu');
    } finally {
      setWithdrawLoading(false);
    }
  };

  const handleCancelWithdrawal = async (id: string) => {
    Alert.alert('Xác nhận', 'Bạn có chắc muốn hủy yêu cầu rút tiền này?', [
      { text: 'Không', style: 'cancel' },
      {
        text: 'Có',
        style: 'destructive',
        onPress: async () => {
          try {
            setCancellingId(id);
            const res = await walletClient.cancelWithdrawal(id);
            if (res.success) {
              Alert.alert('Thành công', 'Đã hủy yêu cầu rút tiền');
              fetchData();
            }
          } catch (error) {
            Alert.alert('Lỗi', 'Không thể hủy yêu cầu');
          } finally {
            setCancellingId(null);
          }
        },
      },
    ]);
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN');
  };

  const formatDateTime = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleString('vi-VN');
  };

  const isOutflow = (type: string): boolean => {
    return type === 'PAYMENT_HOLD';
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'COMPLETED':
        return COLORS.success;
      case 'PENDING':
      case 'PROCESSING':
        return COLORS.warning;
      case 'FAILED':
      case 'CANCELLED':
        return COLORS.error;
      default:
        return COLORS.textLight;
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
        <View style={[styles.header, { paddingTop: insets.top + SPACING.md }]}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <ArrowLeft size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Ví của tôi</Text>
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
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + SPACING.md }]}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <ArrowLeft size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ví của tôi</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceHeader}>
            <Wallet size={32} color={COLORS.white} />
            <Text style={styles.balanceLabel}>Số dư khả dụng</Text>
          </View>
          <Text style={styles.balanceAmount}>{formatCurrency(balance)}</Text>
          <Text style={styles.balanceNote}>Tiền hoàn từ tranh chấp sẽ hiển thị ở đây</Text>
          <TouchableOpacity
            style={[styles.withdrawButton, balance < 50000 && styles.withdrawButtonDisabled]}
            onPress={() => setShowWithdrawModal(true)}
            disabled={balance < 50000}
          >
            <Download size={20} color={balance < 50000 ? COLORS.textLight : COLORS.text} />
            <Text style={[styles.withdrawButtonText, balance < 50000 && styles.withdrawButtonTextDisabled]}>
              Rút tiền
            </Text>
          </TouchableOpacity>
        </View>

        {/* Withdrawal History */}
        {withdrawals.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Lịch sử rút tiền</Text>
            <View style={styles.card}>
              {withdrawals.map((w, index) => (
                <View key={w.id} style={[styles.withdrawalItem, index === withdrawals.length - 1 && { borderBottomWidth: 0 }]}>
                  {/* Header row: date + status */}
                  <View style={styles.withdrawalRow}>
                    <Text style={styles.withdrawalDate}>{formatDateTime(w.requestedAt)}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(w.status)}20` }]}>
                      <Text style={[styles.statusText, { color: getStatusColor(w.status) }]}>
                        {STATUS_LABELS[w.status] || w.status}
                      </Text>
                    </View>
                  </View>

                  {/* Amount */}
                  <Text style={styles.withdrawalAmountLarge}>
                    -{formatCurrency(w.amount)}
                  </Text>

                  {/* Bank info */}
                  <Text style={styles.withdrawalBankInline}>
                    {w.bankAccountRaw?.bankName
                      ? `${w.bankAccountRaw.bankName} · ${w.bankAccount}`
                      : w.bankAccount}
                  </Text>

                  {/* Proof indicator */}
                  {w.transferProof && (
                    <View style={styles.proofIndicator}>
                      <CheckCircle size={12} color={COLORS.success} />
                      <Text style={styles.proofIndicatorText}>Admin đã gửi chứng từ</Text>
                    </View>
                  )}

                  {/* Action row */}
                  <View style={styles.withdrawalActions}>
                    <TouchableOpacity
                      style={styles.detailButton}
                      onPress={() => setDetailModal(w)}
                    >
                      <TrendingUp size={14} color={COLORS.primary} />
                      <Text style={styles.detailButtonText}>Xem chi tiết</Text>
                    </TouchableOpacity>

                    {w.status === 'PENDING' && (
                      <TouchableOpacity
                        style={styles.cancelWithdrawButton}
                        onPress={() => handleCancelWithdrawal(w.id)}
                        disabled={cancellingId === w.id}
                      >
                        <X size={14} color={COLORS.error} />
                        <Text style={styles.cancelWithdrawButtonText}>
                          {cancellingId === w.id ? 'Đang hủy...' : 'Hủy yêu cầu'}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Transaction History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lịch sử giao dịch</Text>
          <View style={styles.card}>
            {transactions.length === 0 ? (
              <Text style={styles.emptyText}>Chưa có giao dịch nào</Text>
            ) : (
              transactions.map((t) => (
                <View key={t.id} style={styles.transactionItem}>
                  <View style={styles.transactionHeader}>
                    <Text style={styles.transactionType}>{TYPE_LABELS[t.type] || t.type}</Text>
                    <Text style={[styles.transactionAmount, { color: isOutflow(t.type) ? COLORS.error : COLORS.success }]}>
                      {isOutflow(t.type) ? '-' : '+'}
                      {formatCurrency(Math.abs(t.amount))}
                    </Text>
                  </View>
                  <Text style={styles.transactionDesc}>{t.description}</Text>
                  <View style={styles.transactionFooter}>
                    <Text style={styles.transactionDate}>{formatDateTime(t.createdAt)}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(t.status)}20` }]}>
                      <Text style={[styles.statusText, { color: getStatusColor(t.status) }]}>
                        {STATUS_LABELS[t.status] || t.status}
                      </Text>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>

      {/* Withdraw Modal */}
      <Modal visible={showWithdrawModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Rút tiền</Text>
              <TouchableOpacity onPress={() => setShowWithdrawModal(false)}>
                <X size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Số tiền (VND)</Text>
              <TextInput
                style={styles.input}
                value={withdrawAmount}
                onChangeText={setWithdrawAmount}
                placeholder="Tối thiểu 50,000"
                keyboardType="numeric"
                placeholderTextColor={COLORS.textLight}
              />
              {withdrawAmount && !isNaN(parseInt(withdrawAmount)) && (
                <View style={styles.feeInfo}>
                  <Text style={styles.feeText}>Phí: {formatCurrency(calculateFee(parseInt(withdrawAmount)))}</Text>
                  <Text style={styles.feeText}>
                    Bạn nhận: {formatCurrency(parseInt(withdrawAmount) - calculateFee(parseInt(withdrawAmount)))}
                  </Text>
                </View>
              )}

              <Text style={styles.inputLabel}>Tài khoản ngân hàng</Text>
              {savedBank ? (
                <View style={styles.savedBankCard}>
                  <Text style={styles.savedBankName}>{savedBank.bankName}</Text>
                  <Text style={styles.savedBankDetails}>
                    {savedBank.accountName} - {savedBank.accountNumber}
                  </Text>
                </View>
              ) : (
                <>
                  <TextInput
                    style={styles.input}
                    value={bankForm.accountName}
                    onChangeText={(text) => setBankForm({ ...bankForm, accountName: text })}
                    placeholder="Tên chủ tài khoản"
                    placeholderTextColor={COLORS.textLight}
                  />
                  <TextInput
                    style={styles.input}
                    value={bankForm.accountNumber}
                    onChangeText={(text) => setBankForm({ ...bankForm, accountNumber: text })}
                    placeholder="Số tài khoản"
                    keyboardType="numeric"
                    placeholderTextColor={COLORS.textLight}
                  />
                  <TextInput
                    style={styles.input}
                    value={bankForm.bankName}
                    onChangeText={(text) => setBankForm({ ...bankForm, bankName: text })}
                    placeholder="Tên ngân hàng (VD: Vietcombank)"
                    placeholderTextColor={COLORS.textLight}
                  />
                </>
              )}

              <View style={styles.infoBox}>
                <Text style={styles.infoText}>Số dư: {formatCurrency(balance)}</Text>
                <Text style={styles.infoText}>Thời gian xử lý: 1-3 ngày làm việc</Text>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonSecondary]}
                  onPress={() => setShowWithdrawModal(false)}
                >
                  <Text style={styles.modalButtonTextSecondary}>Hủy</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonPrimary]}
                  onPress={handleWithdraw}
                  disabled={withdrawLoading}
                >
                  {withdrawLoading ? (
                    <ActivityIndicator size="small" color={COLORS.white} />
                  ) : (
                    <Text style={styles.modalButtonTextPrimary}>Xác nhận</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Withdrawal Detail Modal */}
      <Modal visible={!!detailModal} animationType="slide" transparent onRequestClose={() => setDetailModal(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.detailModalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chi tiết rút tiền</Text>
              <TouchableOpacity onPress={() => setDetailModal(null)} style={styles.closeButton}>
                <X size={22} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {detailModal && (
                <>
                  {/* Status Banner */}
                  <View style={[styles.statusBanner, { backgroundColor: `${getStatusColor(detailModal.status)}15`, borderColor: `${getStatusColor(detailModal.status)}40` }]}>
                    {detailModal.status === 'COMPLETED' ? (
                      <CheckCircle size={20} color={getStatusColor(detailModal.status)} />
                    ) : detailModal.status === 'FAILED' || detailModal.status === 'CANCELLED' ? (
                      <AlertCircle size={20} color={getStatusColor(detailModal.status)} />
                    ) : (
                      <Clock size={20} color={getStatusColor(detailModal.status)} />
                    )}
                    <Text style={[styles.statusBannerText, { color: getStatusColor(detailModal.status) }]}>
                      {STATUS_LABELS[detailModal.status] || detailModal.status}
                    </Text>
                  </View>

                  {/* Amount */}
                  <View style={styles.detailAmountBox}>
                    <Text style={styles.detailAmountLabel}>Số tiền yêu cầu rút</Text>
                    <Text style={styles.detailAmountValue}>-{formatCurrency(detailModal.amount)}</Text>
                    <Text style={styles.detailNetLabel}>
                      Phí dịch vụ: {formatCurrency(detailModal.fee)} · Thực nhận: {formatCurrency(detailModal.amount - detailModal.fee)}
                    </Text>
                  </View>

                  {/* Transaction Info */}
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>Thông tin giao dịch</Text>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailRowLabel}>Ngày yêu cầu</Text>
                      <Text style={styles.detailRowValue}>{formatDateTime(detailModal.requestedAt)}</Text>
                    </View>
                    {detailModal.processedAt && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailRowLabel}>Ngày xử lý</Text>
                        <Text style={styles.detailRowValue}>{formatDateTime(detailModal.processedAt)}</Text>
                      </View>
                    )}
                  </View>

                  {/* Bank Info */}
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>Tài khoản nhận tiền</Text>
                    {detailModal.bankAccountRaw?.bankName && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailRowLabel}>Ngân hàng</Text>
                        <Text style={styles.detailRowValue}>{detailModal.bankAccountRaw.bankName}</Text>
                      </View>
                    )}
                    {detailModal.bankAccountRaw?.accountName && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailRowLabel}>Chủ tài khoản</Text>
                        <Text style={styles.detailRowValue}>{detailModal.bankAccountRaw.accountName}</Text>
                      </View>
                    )}
                    <View style={styles.detailRow}>
                      <Text style={styles.detailRowLabel}>Số tài khoản</Text>
                      <Text style={styles.detailRowValue}>{detailModal.bankAccount}</Text>
                    </View>
                  </View>

                  {/* Admin Note */}
                  {detailModal.note && (
                    <View style={styles.detailSection}>
                      <Text style={styles.detailSectionTitle}>Ghi chú từ Admin</Text>
                      <View style={styles.adminNoteBox}>
                        <AlertCircle size={16} color={COLORS.warning} />
                        <Text style={styles.adminNoteText}>{detailModal.note}</Text>
                      </View>
                    </View>
                  )}

                  {/* Transfer Proof Image */}
                  {detailModal.transferProof ? (
                    <View style={styles.detailSection}>
                      <Text style={styles.detailSectionTitle}>Chứng từ chuyển khoản từ Admin</Text>
                      <View style={styles.proofImageWrapper}>
                        <Image
                          source={{ uri: detailModal.transferProof }}
                          style={styles.proofImageFull}
                          resizeMode="contain"
                        />
                        <View style={styles.proofVerifiedBadge}>
                          <CheckCircle size={14} color={COLORS.white} />
                          <Text style={styles.proofVerifiedText}>Đã xác nhận bởi Admin</Text>
                        </View>
                      </View>
                    </View>
                  ) : detailModal.status === 'COMPLETED' ? (
                    <View style={styles.detailSection}>
                      <Text style={styles.detailSectionTitle}>Chứng từ chuyển khoản</Text>
                      <View style={styles.noProofBox}>
                        <AlertCircle size={20} color={COLORS.textLight} />
                        <Text style={styles.noProofText}>Admin chưa đính kèm chứng từ</Text>
                      </View>
                    </View>
                  ) : detailModal.status === 'PENDING' || detailModal.status === 'PROCESSING' ? (
                    <View style={styles.detailSection}>
                      <View style={styles.pendingProofBox}>
                        <Clock size={20} color={COLORS.warning} />
                        <Text style={styles.pendingProofText}>
                          Yêu cầu đang được xử lý. Admin sẽ gửi chứng từ sau khi chuyển khoản.
                        </Text>
                      </View>
                    </View>
                  ) : null}
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    paddingBottom: SPACING.md,
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
  content: {
    flex: 1,
    padding: SPACING.md,
  },
  balanceCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    ...SHADOWS.md,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  balanceLabel: {
    fontSize: FONT_SIZES.md,
    color: COLORS.white,
    marginLeft: SPACING.sm,
    opacity: 0.9,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
    marginVertical: SPACING.sm,
  },
  balanceNote: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.white,
    opacity: 0.7,
    marginBottom: SPACING.md,
  },
  withdrawButton: {
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    borderRadius: 12,
    gap: SPACING.xs,
  },
  withdrawButtonDisabled: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  withdrawButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.text,
  },
  withdrawButtonTextDisabled: {
    color: COLORS.textLight,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.md,
    ...SHADOWS.sm,
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.textLight,
    fontSize: FONT_SIZES.md,
    paddingVertical: SPACING.lg,
  },
  withdrawalItem: {
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  withdrawalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  withdrawalDate: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textLight,
  },
  withdrawalLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textLight,
  },
  withdrawalAmount: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
  },
  withdrawalFee: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textLight,
  },
  withdrawalBank: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
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
  withdrawalAmountLarge: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.error,
    marginVertical: SPACING.xs,
  },
  withdrawalBankInline: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textLight,
    marginBottom: SPACING.xs,
  },
  proofIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: SPACING.xs,
  },
  proofIndicatorText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.success,
    fontWeight: FONT_WEIGHTS.medium,
  },
  withdrawalActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  detailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    backgroundColor: `${COLORS.primary}15`,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: `${COLORS.primary}30`,
  },
  detailButtonText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHTS.medium,
  },
  cancelWithdrawButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    backgroundColor: `${COLORS.error}10`,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: `${COLORS.error}25`,
  },
  cancelWithdrawButtonText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.error,
    fontWeight: FONT_WEIGHTS.medium,
  },
  transactionItem: {
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  transactionType: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.text,
  },
  transactionAmount: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
  },
  transactionDesc: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textLight,
    marginBottom: SPACING.xs,
  },
  transactionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transactionDate: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textLight,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: SPACING.lg,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  modalTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
  },
  inputLabel: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
    marginTop: SPACING.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  feeInfo: {
    backgroundColor: COLORS.background,
    padding: SPACING.sm,
    borderRadius: 8,
    marginBottom: SPACING.sm,
  },
  feeText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textLight,
    marginBottom: 4,
  },
  savedBankCard: {
    backgroundColor: COLORS.background,
    padding: SPACING.md,
    borderRadius: 12,
    marginBottom: SPACING.sm,
  },
  savedBankName: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginBottom: 4,
  },
  savedBankDetails: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textLight,
  },
  infoBox: {
    backgroundColor: COLORS.background,
    padding: SPACING.md,
    borderRadius: 12,
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
  },
  infoText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textLight,
    marginBottom: 4,
  },
  modalActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  modalButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonSecondary: {
    backgroundColor: COLORS.background,
  },
  modalButtonPrimary: {
    backgroundColor: COLORS.primary,
  },
  modalButtonTextSecondary: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.text,
  },
  modalButtonTextPrimary: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.white,
  },
  detailModalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: SPACING.lg,
    maxHeight: '92%',
  },
  closeButton: {
    padding: SPACING.xs,
    backgroundColor: COLORS.background,
    borderRadius: 20,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: SPACING.md,
  },
  statusBannerText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  detailAmountBox: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  detailAmountLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textLight,
    marginBottom: SPACING.xs,
  },
  detailAmountValue: {
    fontSize: 32,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.error,
    marginBottom: SPACING.xs,
  },
  detailNetLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textLight,
    textAlign: 'center',
  },
  detailSection: {
    marginBottom: SPACING.md,
  },
  detailSectionTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  detailRowLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textLight,
    flex: 1,
  },
  detailRowValue: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    fontWeight: FONT_WEIGHTS.medium,
    flex: 2,
    textAlign: 'right',
  },
  adminNoteBox: {
    flexDirection: 'row',
    gap: SPACING.sm,
    backgroundColor: '#FFF8E7',
    padding: SPACING.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFE082',
  },
  adminNoteText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    flex: 1,
    lineHeight: 20,
  },
  proofImageWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: COLORS.background,
  },
  proofImageFull: {
    width: '100%',
    height: 280,
  },
  proofVerifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.success,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    justifyContent: 'center',
  },
  proofVerifiedText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.white,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  noProofBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.background,
    padding: SPACING.md,
    borderRadius: 12,
  },
  noProofText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textLight,
  },
  pendingProofBox: {
    flexDirection: 'row',
    gap: SPACING.sm,
    backgroundColor: '#FFF8E7',
    padding: SPACING.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFE082',
    alignItems: 'flex-start',
  },
  pendingProofText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    flex: 1,
    lineHeight: 20,
  },
});
