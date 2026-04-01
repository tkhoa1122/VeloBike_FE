/**
 * VeloBike Seller Wallet & Withdrawal
 * ✅ Đã bỏ code cứng, kết nối API thật giống luồng web
 *
 * API endpoints (giống web SellerWallet.tsx):
 *  GET  /users/me/wallet                 → số dư
 *  GET  /transactions/my-transactions    → giao dịch (PAYMENT_RELEASE, COMMISSION_DEBIT, WITHDRAW)
 *  GET  /wallet/withdrawals              → lịch sử rút tiền
 *  GET  /users/me                        → tài khoản ngân hàng đã lưu
 *  GET  /subscriptions/my-subscription  → gói đăng ký & phí hoa hồng
 *  POST /wallet/withdraw                 → yêu cầu rút tiền
 *  POST /users/me/bank                   → lưu/cập nhật tài khoản ngân hàng
 *  PUT  /wallet/withdrawals/:id/cancel  → hủy yêu cầu rút tiền
 */
import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Animated,
  StatusBar,
  ActivityIndicator,
  SafeAreaView,
  Modal,
  TextInput,
  FlatList,
  Alert,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  ArrowDownLeft,
  ArrowUpRight,
  Wallet,
  CreditCard,
  Banknote,
  X,
  AlertCircle,
  Eye,
  EyeOff,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Info,
} from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import LinearGradient from 'react-native-linear-gradient';
import {
  COLORS,
  SPACING,
  RADIUS,
  FONT_SIZES,
  FONT_WEIGHTS,
  SHADOWS,
} from '../../../config/theme';
import { container } from '../../../di/Container';
import type {
  WalletBalance,
  WalletTransaction,
  WalletWithdrawal,
  BankAccount,
  SubscriptionInfo,
} from '../../../data/apis/WalletApiClient';

// ─── helpers ──────────────────────────────────────────────────────────────────

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

const calculateFee = (amount: number) => (amount >= 1_000_000 ? 0 : 10_000);

// ─── types ────────────────────────────────────────────────────────────────────

interface SellerWalletScreenProps {
  onBack?: () => void;
}

// ─── component ────────────────────────────────────────────────────────────────

export const SellerWalletScreen: React.FC<SellerWalletScreenProps> = ({ onBack }) => {
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // ── state ──────────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hideBalance, setHideBalance] = useState(false);
  const [activeTab, setActiveTab] = useState<'transactions' | 'withdrawals'>('transactions');

  const [balance, setBalance] = useState<WalletBalance>({ balance: 0, totalEarnings: 0, totalWithdrawn: 0 });
  const [heldAmount, setHeldAmount] = useState(0);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [withdrawals, setWithdrawals] = useState<WalletWithdrawal[]>([]);
  const [savedBankAccount, setSavedBankAccount] = useState<BankAccount | null>(null);
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo | null>(null);

  // Withdraw modal
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawBankAccount, setWithdrawBankAccount] = useState<BankAccount>({
    accountName: '', accountNumber: '', bankName: '',
  });
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawError, setWithdrawError] = useState('');
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  // Bank account modal
  const [showBankModal, setShowBankModal] = useState(false);
  const [bankForm, setBankForm] = useState<BankAccount>({ accountName: '', accountNumber: '', bankName: '' });
  const [bankLoading, setBankLoading] = useState(false);
  const [bankError, setBankError] = useState('');

  // Proof modal
  const [proofModal, setProofModal] = useState<{ image?: string; note?: string } | null>(null);

  // ── data fetching ──────────────────────────────────────────────────────────
  const fetchWalletData = useCallback(async () => {
    try {
      const api = container().walletApiClient;

      // 1. Số dư
      const balanceRes = await api.getWalletBalance();
      if (balanceRes.success && balanceRes.data) {
        setBalance({
          balance: balanceRes.data.balance ?? 0,
          totalEarnings: balanceRes.data.totalEarnings ?? 0,
          totalWithdrawn: balanceRes.data.totalWithdrawn ?? 0,
        });
      }

      // 2. Giao dịch (PAYMENT_RELEASE, COMMISSION_DEBIT, WITHDRAW)
      const txRes = await api.getTransactions({ page: 1, limit: 100 });
      if (txRes.success && Array.isArray(txRes.data)) {
        const sellerTypes = ['PAYMENT_RELEASE', 'WITHDRAW', 'COMMISSION_DEBIT'];
        const txList: WalletTransaction[] = txRes.data
          .filter((t: any) => sellerTypes.includes(t.type))
          .map((t: any) => ({
            id: t._id,
            type: t.type,
            amount: t.amount,
            status: t.status,
            description: t.description,
            createdAt: t.createdAt,
            metadata: t.metadata,
          }));
        setTransactions(txList);

        // Cập nhật totalEarnings / totalWithdrawn từ giao dịch
        let totalEarnings = 0;
        let totalWithdrawn = 0;
        txList.forEach(t => {
          if (t.type === 'PAYMENT_RELEASE') totalEarnings += t.amount;
          if (t.type === 'WITHDRAW') totalWithdrawn += t.amount;
        });
        setBalance(prev => ({ ...prev, totalEarnings, totalWithdrawn }));

        // Held: PAYMENT_RELEASE trong 7 ngày gần nhất
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        let held = 0;
        txList.forEach(t => {
          if (t.type === 'PAYMENT_RELEASE' && new Date(t.createdAt).getTime() > sevenDaysAgo) {
            held += t.amount;
          }
        });
        setHeldAmount(held);
      }

      // 3. Lịch sử rút tiền
      const wdRes = await api.getWithdrawals();
      if (wdRes.success && Array.isArray(wdRes.data)) {
        const wdList: WalletWithdrawal[] = wdRes.data.map((w: any) => ({
          id: w._id,
          amount: w.amount,
          fee: w.fee ?? 0,
          status: w.status,
          bankAccount: w.bankAccount?.accountNumber
            ? `***${String(w.bankAccount.accountNumber).slice(-4)}`
            : '-',
          bankAccountRaw: w.bankAccount,
          requestedAt: w.requestedAt,
          processedAt: w.processedAt,
          transferProof: w.transferProof,
          note: w.note,
        }));
        setWithdrawals(wdList);
      }

      // 4. Thông tin ngân hàng đã lưu
      const userRes = await api.getUserProfile();
      if (userRes.success && userRes.data?.bankAccount) {
        setSavedBankAccount(userRes.data.bankAccount);
      }

      // 5. Gói đăng ký & hoa hồng
      const subRes = await api.getMySubscription();
      if (subRes.success && subRes.data?.subscription) {
        const sub = subRes.data.subscription;
        const plan = subRes.data.plan;
        const planDisplayMap: Record<string, string> = {
          FREE: 'Free', BASIC: 'Basic', PRO: 'Pro', PREMIUM: 'Premium',
        };
        const fallbackRates: Record<string, number> = {
          FREE: 0.12, BASIC: 0.10, PRO: 0.08, PREMIUM: 0.05,
        };
        const commissionRate = plan?.commissionRate ?? fallbackRates[sub.planType] ?? 0.12;
        setSubscriptionInfo({
          planType: sub.planType,
          commissionRate,
          commissionPercent: Math.round(commissionRate * 100),
          planDisplayName: planDisplayMap[sub.planType] || sub.planType,
          endDate: sub.endDate,
          status: sub.status,
        });
      }
    } catch (error) {
      console.error('[SellerWallet] fetch error:', error);
      Toast.show({ type: 'error', text1: 'Lỗi tải dữ liệu ví', text2: 'Vui lòng thử lại' });
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchWalletData();
      setLoading(false);
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    };
    init();
  }, [fetchWalletData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchWalletData();
    setRefreshing(false);
  };

  // ── bank account modal ─────────────────────────────────────────────────────
  const openBankModal = () => {
    setBankForm({
      accountName: savedBankAccount?.accountName ?? '',
      accountNumber: savedBankAccount?.accountNumber ?? '',
      bankName: savedBankAccount?.bankName ?? '',
    });
    setBankError('');
    setShowBankModal(true);
  };

  const handleSaveBankAccount = async () => {
    if (!bankForm.accountName?.trim()) { setBankError('Vui lòng nhập tên chủ tài khoản'); return; }
    if (!bankForm.accountNumber?.trim()) { setBankError('Vui lòng nhập số tài khoản'); return; }
    if (!bankForm.bankName?.trim()) { setBankError('Vui lòng nhập tên ngân hàng'); return; }

    setBankLoading(true);
    try {
      const api = container().walletApiClient;
      const res = await api.saveBankAccount({
        accountName: bankForm.accountName.trim(),
        accountNumber: bankForm.accountNumber.trim(),
        bankName: bankForm.bankName.trim(),
      });
      if (res.success) {
        setSavedBankAccount({ ...bankForm });
        Toast.show({ type: 'success', text1: 'Đã lưu tài khoản ngân hàng' });
        setShowBankModal(false);
      } else {
        setBankError(res.message || 'Lưu thất bại');
      }
    } catch (err) {
      setBankError(err instanceof Error ? err.message : 'Lỗi lưu tài khoản');
    } finally {
      setBankLoading(false);
    }
  };

  // ── withdraw ───────────────────────────────────────────────────────────────
  const handleWithdraw = async () => {
    setWithdrawError('');
    const amount = parseInt(withdrawAmount);
    if (!amount || isNaN(amount)) { setWithdrawError('Vui lòng nhập số tiền hợp lệ'); return; }
    if (amount < 50_000) { setWithdrawError('Số tiền tối thiểu là 50.000 đ'); return; }
    if (amount > balance.balance) { setWithdrawError('Số dư không đủ'); return; }

    let bankAccountData: BankAccount;
    if (savedBankAccount) {
      bankAccountData = savedBankAccount;
    } else {
      if (!withdrawBankAccount.accountName?.trim()) { setWithdrawError('Vui lòng nhập tên chủ tài khoản'); return; }
      if (!withdrawBankAccount.accountNumber?.trim()) { setWithdrawError('Vui lòng nhập số tài khoản'); return; }
      if (!withdrawBankAccount.bankName?.trim()) { setWithdrawError('Vui lòng nhập tên ngân hàng'); return; }
      bankAccountData = withdrawBankAccount;
    }

    setWithdrawLoading(true);
    try {
      const api = container().walletApiClient;
      const res = await api.requestWithdrawal({
        amount,
        bankAccount: {
          accountName: bankAccountData.accountName?.trim(),
          accountNumber: bankAccountData.accountNumber?.trim(),
          bankName: bankAccountData.bankName?.trim(),
        },
      });

      if (res.success) {
        // Nếu chưa có tài khoản lưu sẵn → tự lưu
        if (!savedBankAccount) {
          try { await api.saveBankAccount(bankAccountData); setSavedBankAccount(bankAccountData); } catch { /* silent */ }
        }
        setShowWithdrawModal(false);
        setWithdrawAmount('');
        setWithdrawBankAccount({ accountName: '', accountNumber: '', bankName: '' });
        Toast.show({ type: 'success', text1: 'Yêu cầu rút tiền đã được gửi', text2: 'Xử lý trong 1–3 ngày làm việc' });
        await fetchWalletData();
      } else {
        setWithdrawError(res.message || 'Yêu cầu rút tiền thất bại');
      }
    } catch (err) {
      setWithdrawError(err instanceof Error ? err.message : 'Lỗi yêu cầu rút tiền');
    } finally {
      setWithdrawLoading(false);
    }
  };

  // ── cancel withdrawal ──────────────────────────────────────────────────────
  const handleCancelWithdrawal = (id: string) => {
    Alert.alert('Hủy yêu cầu', 'Bạn có chắc muốn hủy yêu cầu rút tiền này?', [
      { text: 'Không', style: 'cancel' },
      {
        text: 'Hủy yêu cầu', style: 'destructive', onPress: async () => {
          setCancellingId(id);
          try {
            const api = container().walletApiClient;
            const res = await api.cancelWithdrawal(id);
            if (res.success) {
              Toast.show({ type: 'success', text1: 'Đã hủy yêu cầu rút tiền' });
              await fetchWalletData();
            } else {
              Toast.show({ type: 'error', text1: res.message || 'Hủy thất bại' });
            }
          } catch (err) {
            Toast.show({ type: 'error', text1: 'Lỗi hủy yêu cầu' });
          } finally {
            setCancellingId(null);
          }
        },
      },
    ]);
  };

  // ── render helpers ─────────────────────────────────────────────────────────
  const getTxLabel = (type: string) => {
    const map: Record<string, string> = {
      PAYMENT_RELEASE: 'Nhận tiền bán hàng',
      COMMISSION_DEBIT: 'Phí hoa hồng',
      WITHDRAW: 'Rút tiền',
    };
    return map[type] || type;
  };

  const getTxColor = (type: string) => {
    const map: Record<string, string> = {
      PAYMENT_RELEASE: '#10B981',
      COMMISSION_DEBIT: '#F97316',
      WITHDRAW: '#3B82F6',
    };
    return map[type] || COLORS.textSecondary;
  };

  const getWdStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      PENDING: 'Chờ xử lý',
      PROCESSING: 'Đang xử lý',
      COMPLETED: 'Hoàn thành',
      FAILED: 'Thất bại',
      CANCELLED: 'Đã hủy',
    };
    return map[status] || status;
  };

  const getWdStatusColor = (status: string) => {
    const map: Record<string, { text: string; bg: string }> = {
      PENDING:    { text: '#92400E', bg: '#FEF3C7' },
      PROCESSING: { text: '#1E40AF', bg: '#EFF6FF' },
      COMPLETED:  { text: '#065F46', bg: '#D1FAE5' },
      FAILED:     { text: '#991B1B', bg: '#FEE2E2' },
      CANCELLED:  { text: '#374151', bg: '#F3F4F6' },
    };
    return map[status] || { text: COLORS.textSecondary, bg: COLORS.surface };
  };

  const getPlanIcon = (planType: string) => {
    const map: Record<string, string> = { FREE: '🆓', BASIC: '✓', PRO: '⭐', PREMIUM: '👑' };
    return map[planType] || '📦';
  };

  // ── transaction item ───────────────────────────────────────────────────────
  const renderTransaction = ({ item }: { item: WalletTransaction }) => {
    const isRelease = item.type === 'PAYMENT_RELEASE';
    const isCommission = item.type === 'COMMISSION_DEBIT';
    const isWithdraw = item.type === 'WITHDRAW';
    const color = getTxColor(item.type);
    const bd = item.metadata?.breakdown;

    return (
      <View style={txStyles.card}>
        <View style={txStyles.row}>
          <View style={[txStyles.iconWrap, { backgroundColor: color + '20' }]}>
            {isRelease ? (
              <ArrowDownLeft size={18} color={color} />
            ) : (
              <ArrowUpRight size={18} color={color} />
            )}
          </View>
          <View style={txStyles.info}>
            <Text style={txStyles.label}>{getTxLabel(item.type)}</Text>
            <Text style={txStyles.date}>
              {new Date(item.createdAt).toLocaleDateString('vi-VN', {
                day: '2-digit', month: '2-digit', year: 'numeric',
              })}
            </Text>
          </View>
          <View style={txStyles.amountCol}>
            <Text style={[txStyles.amount, { color }]}>
              {isRelease ? '+' : '-'}{formatCurrency(item.amount)}
            </Text>
            <View style={[txStyles.statusBadge, {
              backgroundColor: item.status === 'COMPLETED' ? '#D1FAE5' : '#FEF3C7',
            }]}>
              <Text style={[txStyles.statusText, {
                color: item.status === 'COMPLETED' ? '#065F46' : '#92400E',
              }]}>
                {item.status === 'COMPLETED' ? 'Hoàn thành' : 'Chờ xác nhận'}
              </Text>
            </View>
          </View>
        </View>

        {/* Breakdown cho PAYMENT_RELEASE */}
        {isRelease && bd && (
          <View style={txStyles.breakdown}>
            <View style={txStyles.breakdownRow}>
              <Text style={txStyles.bLabel}>Giá bán xe:</Text>
              <Text style={txStyles.bValue}>{formatCurrency(bd.itemPrice || 0)}</Text>
            </View>
            <View style={txStyles.breakdownRow}>
              <Text style={[txStyles.bLabel, { color: '#F97316' }]}>
                Hoa hồng ({bd.commissionPercent ?? Math.round((bd.commissionRate || 0) * 100)}%
                {bd.planName ? ` - ${bd.planName}` : ''}):
              </Text>
              <Text style={[txStyles.bValue, { color: '#F97316' }]}>-{formatCurrency(bd.platformFee || 0)}</Text>
            </View>
            <View style={[txStyles.breakdownRow, txStyles.breakdownTotal]}>
              <Text style={[txStyles.bLabel, { color: '#065F46', fontWeight: '600' }]}>Bạn nhận được:</Text>
              <Text style={[txStyles.bValue, { color: '#065F46', fontWeight: '700' }]}>
                {formatCurrency(bd.sellerReceived || item.amount)}
              </Text>
            </View>
          </View>
        )}

        {/* Breakdown cho COMMISSION_DEBIT */}
        {isCommission && item.metadata && (
          <View style={[txStyles.breakdown, { backgroundColor: '#FFF7ED' }]}>
            <View style={txStyles.breakdownRow}>
              <Text style={[txStyles.bLabel, { color: '#F97316' }]}>
                Hoa hồng {item.metadata.commissionPercent ?? Math.round((item.metadata.commissionRate || 0) * 100)}%
                {item.metadata.planName ? ` (${item.metadata.planName})` : ''}:
              </Text>
              <Text style={[txStyles.bValue, { color: '#F97316' }]}>-{formatCurrency(item.amount)}</Text>
            </View>
            {item.metadata.itemPrice && (
              <View style={txStyles.breakdownRow}>
                <Text style={txStyles.bLabel}>Giá bán:</Text>
                <Text style={txStyles.bValue}>{formatCurrency(item.metadata.itemPrice)}</Text>
              </View>
            )}
          </View>
        )}

        {/* Mô tả cho WITHDRAW */}
        {isWithdraw && (
          <Text style={txStyles.desc}>{item.description}</Text>
        )}
      </View>
    );
  };

  // ── withdrawal item ────────────────────────────────────────────────────────
  const renderWithdrawal = ({ item }: { item: WalletWithdrawal }) => {
    const statusColor = getWdStatusColor(item.status);
    return (
      <View style={txStyles.card}>
        <View style={txStyles.row}>
          <View style={[txStyles.iconWrap, { backgroundColor: '#DBEAFE' }]}>
            <Banknote size={18} color="#3B82F6" />
          </View>
          <View style={txStyles.info}>
            <Text style={txStyles.label}>{formatCurrency(item.amount)}</Text>
            <Text style={txStyles.date}>
              {new Date(item.requestedAt).toLocaleDateString('vi-VN')} · {item.bankAccount}
            </Text>
            {item.fee > 0 && (
              <Text style={[txStyles.date, { color: '#F97316' }]}>Phí: {formatCurrency(item.fee)}</Text>
            )}
          </View>
          <View style={txStyles.amountCol}>
            <View style={[txStyles.statusBadge, { backgroundColor: statusColor.bg }]}>
              <Text style={[txStyles.statusText, { color: statusColor.text }]}>
                {getWdStatusLabel(item.status)}
              </Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={txStyles.actionRow}>
          {item.status === 'PENDING' && (
            <TouchableOpacity
              style={txStyles.cancelBtn}
              onPress={() => handleCancelWithdrawal(item.id)}
              disabled={cancellingId === item.id}
            >
              {cancellingId === item.id ? (
                <ActivityIndicator size="small" color="#EF4444" />
              ) : (
                <Text style={txStyles.cancelBtnText}>Hủy yêu cầu</Text>
              )}
            </TouchableOpacity>
          )}
          {item.status === 'COMPLETED' && (item.transferProof || item.note) && (
            <TouchableOpacity
              style={txStyles.proofBtn}
              onPress={() => setProofModal({ image: item.transferProof, note: item.note })}
            >
              <Text style={txStyles.proofBtnText}>Xem bằng chứng</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={s.loadingText}>Đang tải dữ liệu ví...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      {/* ── Header ── */}
      <Animated.View style={[s.header, { opacity: fadeAnim }]}>
        <View style={[s.headerInner, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity onPress={onBack} style={s.backBtn}>
            <ChevronLeft size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Ví & Rút tiền</Text>
          <TouchableOpacity onPress={() => setHideBalance(h => !h)} style={s.eyeBtn}>
            {hideBalance ? <EyeOff size={20} color={COLORS.textLight} /> : <Eye size={20} color={COLORS.textLight} />}
          </TouchableOpacity>
        </View>
      </Animated.View>

      <ScrollView
        contentContainerStyle={s.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Balance card ── */}
        <LinearGradient
          colors={['#10B981', '#1D4ED8']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.balanceCard}
        >
          <View style={s.balanceTop}>
            <View style={s.balanceRow}>
              <Wallet size={22} color="white" />
              <Text style={s.balanceLabel}>Số dư khả dụng</Text>
            </View>
            <TouchableOpacity style={s.refreshBtn} onPress={onRefresh}>
              <RefreshCw size={14} color="white" />
              <Text style={s.refreshBtnText}>Làm mới</Text>
            </TouchableOpacity>
          </View>

          <Text style={s.balanceAmount}>
            {hideBalance ? '••••••' : formatCurrency(balance.balance)}
          </Text>

          <View style={s.balanceStats}>
            <View style={s.statItem}>
              <Text style={s.statLabel}>Tổng thu nhập</Text>
              <Text style={s.statValue}>
                {hideBalance ? '••••' : formatCurrency(balance.totalEarnings)}
              </Text>
            </View>
            <View style={[s.statItem, s.statBorder]}>
              <Text style={s.statLabel}>Đã rút</Text>
              <Text style={s.statValue}>
                {hideBalance ? '••••' : formatCurrency(balance.totalWithdrawn)}
              </Text>
            </View>
            {heldAmount > 0 && (
              <View style={s.statItem}>
                <Text style={s.statLabel}>Đang giữ (7 ngày)</Text>
                <Text style={s.statValue}>
                  {hideBalance ? '••••' : formatCurrency(heldAmount)}
                </Text>
              </View>
            )}
          </View>
        </LinearGradient>

        {/* ── Quick actions ── */}
        <View style={s.quickActions}>
          <TouchableOpacity style={s.actionBtn} onPress={() => setShowWithdrawModal(true)}>
            <Banknote size={22} color={COLORS.primary} />
            <Text style={s.actionBtnText}>Rút tiền</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.actionBtn, s.actionBtnSecondary]} onPress={openBankModal}>
            <CreditCard size={22} color={COLORS.textSecondary} />
            <Text style={[s.actionBtnText, s.actionBtnTextSecondary]}>Tài khoản NH</Text>
          </TouchableOpacity>
        </View>

        {/* ── Subscription & Commission ── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Gói & Hoa hồng</Text>
          {subscriptionInfo ? (
            <View style={s.subCard}>
              <View style={s.subRow}>
                <Text style={s.subKey}>Gói hiện tại</Text>
                <Text style={s.subValue}>
                  {getPlanIcon(subscriptionInfo.planType)} {subscriptionInfo.planDisplayName}
                  {subscriptionInfo.planType !== 'FREE' && subscriptionInfo.endDate
                    ? ` · HSD: ${new Date(subscriptionInfo.endDate).toLocaleDateString('vi-VN')}`
                    : ''}
                </Text>
              </View>
              <View style={s.subRow}>
                <Text style={s.subKey}>Tỷ lệ hoa hồng</Text>
                <Text style={[s.subValue, { color: '#F97316', fontWeight: '700' }]}>
                  {subscriptionInfo.commissionPercent}% / giao dịch
                </Text>
              </View>
              <View style={[s.breakdown, { marginTop: 8 }]}>
                <Text style={s.breakdownTitle}>Ví dụ tính toán</Text>
                <View style={txStyles.breakdownRow}>
                  <Text style={txStyles.bLabel}>Giá bán xe:</Text>
                  <Text style={txStyles.bValue}>10.000.000 đ</Text>
                </View>
                <View style={txStyles.breakdownRow}>
                  <Text style={[txStyles.bLabel, { color: '#F97316' }]}>
                    Hoa hồng ({subscriptionInfo.commissionPercent}%):
                  </Text>
                  <Text style={[txStyles.bValue, { color: '#F97316' }]}>
                    -{formatCurrency(10_000_000 * subscriptionInfo.commissionRate)}
                  </Text>
                </View>
                <View style={[txStyles.breakdownRow, txStyles.breakdownTotal]}>
                  <Text style={[txStyles.bLabel, { color: '#065F46', fontWeight: '600' }]}>Bạn nhận:</Text>
                  <Text style={[txStyles.bValue, { color: '#065F46', fontWeight: '700' }]}>
                    {formatCurrency(10_000_000 * (1 - subscriptionInfo.commissionRate))}
                  </Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={s.subCard}>
              <View style={s.subRow}>
                <Text style={s.subKey}>Gói hiện tại</Text>
                <Text style={s.subValue}>🆓 Free</Text>
              </View>
              <View style={s.subRow}>
                <Text style={s.subKey}>Hoa hồng</Text>
                <Text style={[s.subValue, { color: '#F97316', fontWeight: '700' }]}>12%</Text>
              </View>
              <View style={s.subCompare}>
                {[['Free', '12%'], ['Basic', '10%'], ['Pro', '8%'], ['Premium', '5%']].map(([plan, rate]) => (
                  <View key={plan} style={s.subCompareRow}>
                    <Text style={s.subKey}>{plan}:</Text>
                    <Text style={[s.subValue, { color: '#F97316' }]}>{rate}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* ── Bank account ── */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Tài khoản ngân hàng</Text>
            <TouchableOpacity style={s.editBtn} onPress={openBankModal}>
              <Text style={s.editBtnText}>{savedBankAccount ? 'Cập nhật' : 'Thêm mới'}</Text>
            </TouchableOpacity>
          </View>
          {savedBankAccount ? (
            <View style={s.bankCard}>
              <View style={s.bankRow}>
                <Text style={s.bankLabel}>Ngân hàng</Text>
                <Text style={s.bankValue}>{savedBankAccount.bankName}</Text>
              </View>
              <View style={s.bankRow}>
                <Text style={s.bankLabel}>Số tài khoản</Text>
                <Text style={s.bankValue}>{savedBankAccount.accountNumber}</Text>
              </View>
              <View style={s.bankRow}>
                <Text style={s.bankLabel}>Chủ tài khoản</Text>
                <Text style={s.bankValue}>{savedBankAccount.accountName}</Text>
              </View>
            </View>
          ) : (
            <View style={s.bankEmpty}>
              <AlertCircle size={18} color="#92400E" />
              <Text style={s.bankEmptyText}>
                Bạn chưa có tài khoản ngân hàng. Thêm tài khoản để rút tiền.
              </Text>
            </View>
          )}
        </View>

        {/* ── Withdrawal info ── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Thông tin rút tiền</Text>
          <View style={s.infoBox}>
            {[
              'Số tiền tối thiểu: 50.000 đ',
              'Miễn phí nếu rút từ 1.000.000 đ trở lên',
              'Phí 10.000 đ nếu rút dưới 1.000.000 đ',
              'Thời gian xử lý: 1–3 ngày làm việc',
            ].map((item, i) => (
              <Text key={i} style={s.infoItem}>• {item}</Text>
            ))}
          </View>
        </View>

        {/* ── Tabs ── */}
        <View style={s.tabs}>
          {(['transactions', 'withdrawals'] as const).map(tab => (
            <TouchableOpacity
              key={tab}
              style={[s.tab, activeTab === tab && s.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[s.tabText, activeTab === tab && s.tabTextActive]}>
                {tab === 'transactions' ? 'Giao dịch' : 'Lịch sử rút tiền'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Tab content ── */}
        <View style={s.tabContent}>
          {activeTab === 'transactions' ? (
            transactions.length > 0 ? (
              <FlatList
                scrollEnabled={false}
                data={transactions}
                renderItem={renderTransaction}
                keyExtractor={item => item.id}
              />
            ) : (
              <View style={s.empty}>
                <AlertCircle size={24} color={COLORS.textLight} />
                <Text style={s.emptyText}>Chưa có giao dịch nào</Text>
              </View>
            )
          ) : (
            withdrawals.length > 0 ? (
              <FlatList
                scrollEnabled={false}
                data={withdrawals}
                renderItem={renderWithdrawal}
                keyExtractor={item => item.id}
              />
            ) : (
              <View style={s.empty}>
                <AlertCircle size={24} color={COLORS.textLight} />
                <Text style={s.emptyText}>Chưa có yêu cầu rút tiền nào</Text>
              </View>
            )
          )}
        </View>
      </ScrollView>

      {/* ════════════════════════════════════════
          WITHDRAW MODAL
      ════════════════════════════════════════ */}
      <Modal visible={showWithdrawModal} animationType="slide" transparent onRequestClose={() => setShowWithdrawModal(false)}>
        <SafeAreaView style={modal.root}>
          <View style={modal.header}>
            <Text style={modal.title}>Yêu cầu rút tiền</Text>
            <TouchableOpacity onPress={() => { setShowWithdrawModal(false); setWithdrawError(''); }}>
              <X size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={modal.body} keyboardShouldPersistTaps="handled">
            {/* Balance info */}
            <View style={modal.balanceBox}>
              <Text style={modal.balanceLabel}>Số dư có thể rút</Text>
              <Text style={modal.balanceValue}>{formatCurrency(balance.balance)}</Text>
              <Text style={modal.balanceNote}>Tối thiểu: 50.000 đ</Text>
            </View>

            {/* Amount */}
            <View style={modal.field}>
              <Text style={modal.fieldLabel}>Số tiền rút (VND) *</Text>
              <TextInput
                placeholder="VD: 500000"
                placeholderTextColor={COLORS.textLight}
                keyboardType="numeric"
                style={modal.input}
                value={withdrawAmount}
                onChangeText={setWithdrawAmount}
              />
              {withdrawAmount && !isNaN(parseInt(withdrawAmount)) && (
                <Text style={modal.fieldHint}>
                  Nhận: {formatCurrency(parseInt(withdrawAmount) - calculateFee(parseInt(withdrawAmount)))}
                  {' '}· Phí: {formatCurrency(calculateFee(parseInt(withdrawAmount)))}
                </Text>
              )}
            </View>

            {/* Bank account */}
            <View style={modal.field}>
              <View style={modal.fieldHeaderRow}>
                <Text style={modal.fieldLabel}>Tài khoản ngân hàng *</Text>
                {savedBankAccount && (
                  <TouchableOpacity onPress={openBankModal}>
                    <Text style={modal.editLink}>Sửa</Text>
                  </TouchableOpacity>
                )}
              </View>
              {savedBankAccount ? (
                <View style={modal.savedBank}>
                  <Text style={modal.savedBankName}>{savedBankAccount.bankName}</Text>
                  <Text style={modal.savedBankDetail}>
                    {savedBankAccount.accountName} · {savedBankAccount.accountNumber}
                  </Text>
                </View>
              ) : (
                <>
                  <TextInput
                    placeholder="Tên chủ tài khoản *"
                    placeholderTextColor={COLORS.textLight}
                    style={[modal.input, { marginBottom: 8 }]}
                    value={withdrawBankAccount.accountName}
                    onChangeText={v => setWithdrawBankAccount(prev => ({ ...prev, accountName: v }))}
                  />
                  <TextInput
                    placeholder="Số tài khoản *"
                    placeholderTextColor={COLORS.textLight}
                    keyboardType="numeric"
                    style={[modal.input, { marginBottom: 8 }]}
                    value={withdrawBankAccount.accountNumber}
                    onChangeText={v => setWithdrawBankAccount(prev => ({ ...prev, accountNumber: v }))}
                  />
                  <TextInput
                    placeholder="Tên ngân hàng *"
                    placeholderTextColor={COLORS.textLight}
                    style={modal.input}
                    value={withdrawBankAccount.bankName}
                    onChangeText={v => setWithdrawBankAccount(prev => ({ ...prev, bankName: v }))}
                  />
                  <Text style={modal.fieldHint}>💡 Tài khoản sẽ được tự động lưu sau khi rút thành công</Text>
                </>
              )}
            </View>

            {/* Error */}
            {withdrawError ? (
              <View style={modal.errorBox}>
                <Text style={modal.errorText}>{withdrawError}</Text>
              </View>
            ) : null}

            {/* Note box */}
            <View style={modal.noteBox}>
              <AlertCircle size={14} color="#92400E" />
              <Text style={modal.noteText}>
                Kiểm tra kỹ thông tin tài khoản trước khi gửi. Không thể hoàn hủy sau khi xác nhận.
              </Text>
            </View>

            {/* Buttons */}
            <View style={modal.btnRow}>
              <TouchableOpacity
                style={modal.cancelBtn}
                onPress={() => { setShowWithdrawModal(false); setWithdrawError(''); }}
              >
                <Text style={modal.cancelBtnText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[modal.submitBtn, withdrawLoading && { opacity: 0.7 }]}
                onPress={handleWithdraw}
                disabled={withdrawLoading}
              >
                {withdrawLoading
                  ? <ActivityIndicator size="small" color="white" />
                  : <Text style={modal.submitBtnText}>Gửi yêu cầu</Text>
                }
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* ════════════════════════════════════════
          BANK ACCOUNT MODAL
      ════════════════════════════════════════ */}
      <Modal visible={showBankModal} animationType="slide" transparent onRequestClose={() => setShowBankModal(false)}>
        <SafeAreaView style={modal.root}>
          <View style={modal.header}>
            <Text style={modal.title}>{savedBankAccount ? 'Cập nhật tài khoản NH' : 'Thêm tài khoản NH'}</Text>
            <TouchableOpacity onPress={() => setShowBankModal(false)}>
              <X size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={modal.body} keyboardShouldPersistTaps="handled">
            <View style={modal.field}>
              <Text style={modal.fieldLabel}>Tên chủ tài khoản *</Text>
              <TextInput
                placeholder="VD: NGUYEN VAN A"
                placeholderTextColor={COLORS.textLight}
                style={modal.input}
                value={bankForm.accountName}
                onChangeText={v => setBankForm(f => ({ ...f, accountName: v }))}
              />
            </View>
            <View style={modal.field}>
              <Text style={modal.fieldLabel}>Số tài khoản *</Text>
              <TextInput
                placeholder="VD: 1234567890"
                placeholderTextColor={COLORS.textLight}
                keyboardType="numeric"
                style={modal.input}
                value={bankForm.accountNumber}
                onChangeText={v => setBankForm(f => ({ ...f, accountNumber: v }))}
              />
            </View>
            <View style={modal.field}>
              <Text style={modal.fieldLabel}>Tên ngân hàng *</Text>
              <TextInput
                placeholder="VD: Vietcombank"
                placeholderTextColor={COLORS.textLight}
                style={modal.input}
                value={bankForm.bankName}
                onChangeText={v => setBankForm(f => ({ ...f, bankName: v }))}
              />
            </View>

            {bankError ? (
              <View style={modal.errorBox}>
                <Text style={modal.errorText}>{bankError}</Text>
              </View>
            ) : null}

            <View style={[modal.noteBox, { marginBottom: 16 }]}>
              <Info size={14} color="#1E40AF" />
              <Text style={[modal.noteText, { color: '#1E40AF' }]}>
                Tài khoản này sẽ được dùng để nhận tiền khi rút.
              </Text>
            </View>

            <View style={modal.btnRow}>
              <TouchableOpacity style={modal.cancelBtn} onPress={() => setShowBankModal(false)}>
                <Text style={modal.cancelBtnText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[modal.submitBtn, bankLoading && { opacity: 0.7 }]}
                onPress={handleSaveBankAccount}
                disabled={bankLoading}
              >
                {bankLoading
                  ? <ActivityIndicator size="small" color="white" />
                  : <Text style={modal.submitBtnText}>Lưu</Text>
                }
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* ════════════════════════════════════════
          PROOF MODAL
      ════════════════════════════════════════ */}
      {proofModal && (
        <Modal visible animationType="fade" transparent onRequestClose={() => setProofModal(null)}>
          <TouchableOpacity style={proof.overlay} activeOpacity={1} onPress={() => setProofModal(null)}>
            <TouchableOpacity style={proof.card} activeOpacity={1} onPress={() => {}}>
              <View style={proof.header}>
                <Text style={proof.title}>Bằng chứng chuyển khoản</Text>
                <TouchableOpacity onPress={() => setProofModal(null)}>
                  <X size={22} color={COLORS.text} />
                </TouchableOpacity>
              </View>
              {proofModal.image ? (
                <Image source={{ uri: proofModal.image }} style={proof.image} resizeMode="contain" />
              ) : null}
              {proofModal.note ? (
                <View style={proof.noteBox}>
                  <Text style={proof.noteLabel}>Ghi chú admin</Text>
                  <Text style={proof.noteText}>{proofModal.note}</Text>
                </View>
              ) : null}
              {!proofModal.image && !proofModal.note && (
                <Text style={proof.empty}>Không có bằng chứng</Text>
              )}
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      )}
    </SafeAreaView>
  );
};

// ─── styles ───────────────────────────────────────────────────────────────────
import { StyleSheet } from 'react-native';

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { color: COLORS.textSecondary, fontSize: FONT_SIZES.sm },
  header: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    ...SHADOWS.sm,
  },
  headerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.base,
    paddingBottom: SPACING.sm,
  },
  backBtn: { padding: 4, marginRight: 4 },
  headerTitle: { flex: 1, fontSize: FONT_SIZES.lg, fontWeight: FONT_WEIGHTS.bold, color: COLORS.text },
  eyeBtn: { padding: 4 },
  scroll: { paddingBottom: 32 },

  // Balance card
  balanceCard: { margin: 16, borderRadius: RADIUS.xl, padding: SPACING.lg },
  balanceTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  balanceRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  balanceLabel: { color: 'white', fontSize: FONT_SIZES.sm, fontWeight: '600' },
  refreshBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: RADIUS.full },
  refreshBtnText: { color: 'white', fontSize: FONT_SIZES.xs, fontWeight: '700' },
  balanceAmount: { color: 'white', fontSize: 32, fontWeight: '800', marginBottom: 4 },
  balanceStats: { flexDirection: 'row', paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.3)', gap: 8 },
  statItem: { flex: 1 },
  statBorder: { borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.3)', paddingLeft: 8 },
  statLabel: { color: 'rgba(255,255,255,0.8)', fontSize: FONT_SIZES.xs, marginBottom: 2 },
  statValue: { color: 'white', fontSize: FONT_SIZES.sm, fontWeight: '700' },

  // Quick actions
  quickActions: { flexDirection: 'row', paddingHorizontal: 16, gap: 12, marginBottom: 16 },
  actionBtn: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 6,
    borderWidth: 2,
    borderColor: COLORS.primary,
    ...SHADOWS.sm,
  },
  actionBtnSecondary: { borderColor: COLORS.border },
  actionBtnText: { fontSize: FONT_SIZES.sm, fontWeight: FONT_WEIGHTS.bold, color: COLORS.primary },
  actionBtnTextSecondary: { color: COLORS.textSecondary },

  // Section
  section: { marginHorizontal: 16, marginBottom: 16 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  sectionTitle: { fontSize: FONT_SIZES.base, fontWeight: FONT_WEIGHTS.bold, color: COLORS.text, marginBottom: 10 },
  editBtn: { backgroundColor: COLORS.text, borderRadius: RADIUS.md, paddingHorizontal: 14, paddingVertical: 6 },
  editBtnText: { color: 'white', fontSize: FONT_SIZES.sm, fontWeight: '600' },

  // Subscription card
  subCard: { backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: SPACING.base, ...SHADOWS.sm },
  subRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  subKey: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },
  subValue: { fontSize: FONT_SIZES.sm, fontWeight: '600', color: COLORS.text },
  subCompare: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: COLORS.border },
  subCompareRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  breakdown: { backgroundColor: '#F0FDF4', borderRadius: RADIUS.md, padding: 10, marginTop: 4 },
  breakdownTitle: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, fontWeight: '600', marginBottom: 6 },

  // Bank card
  bankCard: { backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: SPACING.base, ...SHADOWS.sm },
  bankRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  bankLabel: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },
  bankValue: { fontSize: FONT_SIZES.sm, fontWeight: '600', color: COLORS.text },
  bankEmpty: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: RADIUS.lg,
    padding: SPACING.base,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  bankEmptyText: { flex: 1, fontSize: FONT_SIZES.sm, color: '#92400E' },

  // Info box
  infoBox: { backgroundColor: '#F8FAFC', borderRadius: RADIUS.lg, padding: SPACING.base },
  infoItem: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginBottom: 4, lineHeight: 20 },

  // Tabs
  tabs: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginTop: 8,
  },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: COLORS.primary },
  tabText: { fontSize: FONT_SIZES.sm, fontWeight: '600', color: COLORS.textSecondary },
  tabTextActive: { color: COLORS.primary },
  tabContent: { paddingHorizontal: 16, paddingTop: 12 },

  // Empty
  empty: { alignItems: 'center', paddingVertical: 32, gap: 8 },
  emptyText: { fontSize: FONT_SIZES.sm, color: COLORS.textLight },
});

const txStyles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.base,
    marginBottom: 10,
    ...SHADOWS.sm,
  },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  iconWrap: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1 },
  label: { fontSize: FONT_SIZES.sm, fontWeight: FONT_WEIGHTS.semibold, color: COLORS.text },
  date: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, marginTop: 2 },
  desc: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, marginTop: 6 },
  amountCol: { alignItems: 'flex-end' },
  amount: { fontSize: FONT_SIZES.base, fontWeight: FONT_WEIGHTS.bold },
  statusBadge: { borderRadius: RADIUS.full, paddingHorizontal: 8, paddingVertical: 3, marginTop: 4 },
  statusText: { fontSize: 10, fontWeight: '700' },
  actionRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: COLORS.border },
  cancelBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.md, borderWidth: 1, borderColor: '#EF4444' },
  cancelBtnText: { fontSize: FONT_SIZES.sm, color: '#EF4444', fontWeight: '600' },
  proofBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.md, borderWidth: 1, borderColor: '#3B82F6' },
  proofBtnText: { fontSize: FONT_SIZES.sm, color: '#3B82F6', fontWeight: '600' },
  breakdown: { backgroundColor: '#F0FDF4', borderRadius: RADIUS.md, padding: 10, marginTop: 8 },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  breakdownTotal: { borderTopWidth: 1, borderTopColor: '#D1FAE5', paddingTop: 6, marginTop: 2 },
  bLabel: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, flex: 1 },
  bValue: { fontSize: FONT_SIZES.xs, color: COLORS.text, fontWeight: '600' },
});

const modal = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: { fontSize: FONT_SIZES.lg, fontWeight: FONT_WEIGHTS.bold, color: COLORS.text },
  body: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 },
  balanceBox: {
    backgroundColor: '#D1FAE5',
    borderRadius: RADIUS.lg,
    padding: SPACING.base,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  balanceLabel: { fontSize: FONT_SIZES.xs, color: '#065F46', fontWeight: '600' },
  balanceValue: { fontSize: 24, fontWeight: '800', color: '#065F46', marginVertical: 4 },
  balanceNote: { fontSize: FONT_SIZES.xs, color: '#6B7280' },
  field: { marginBottom: 16 },
  fieldHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  fieldLabel: { fontSize: FONT_SIZES.sm, fontWeight: '700', color: COLORS.text, marginBottom: 6 },
  fieldHint: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, marginTop: 6 },
  editLink: { fontSize: FONT_SIZES.xs, color: COLORS.primary, fontWeight: '600', textDecorationLine: 'underline' },
  input: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: FONT_SIZES.base,
    color: COLORS.text,
  },
  savedBank: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    padding: 12,
  },
  savedBankName: { fontSize: FONT_SIZES.sm, fontWeight: '700', color: COLORS.text },
  savedBankDetail: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginTop: 2 },
  errorBox: { backgroundColor: '#FEE2E2', borderRadius: RADIUS.lg, padding: 12, marginBottom: 12 },
  errorText: { fontSize: FONT_SIZES.sm, color: '#991B1B' },
  noteBox: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: RADIUS.lg,
    padding: 12,
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  noteText: { flex: 1, fontSize: FONT_SIZES.xs, color: '#92400E', lineHeight: 18 },
  btnRow: { flexDirection: 'row', gap: 12 },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#E5E7EB',
    borderRadius: RADIUS.lg,
    paddingVertical: 13,
    alignItems: 'center',
  },
  cancelBtnText: { fontSize: FONT_SIZES.base, fontWeight: '700', color: COLORS.text },
  submitBtn: {
    flex: 1,
    backgroundColor: '#111827',
    borderRadius: RADIUS.lg,
    paddingVertical: 13,
    alignItems: 'center',
  },
  submitBtnText: { fontSize: FONT_SIZES.base, fontWeight: '700', color: 'white' },
});

const proof = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 },
  card: { backgroundColor: COLORS.white, borderRadius: RADIUS.xl, overflow: 'hidden' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: { fontSize: FONT_SIZES.base, fontWeight: FONT_WEIGHTS.bold, color: COLORS.text },
  image: { width: '100%', height: 260 },
  noteBox: { padding: 16 },
  noteLabel: { fontSize: FONT_SIZES.xs, color: COLORS.textLight, marginBottom: 4 },
  noteText: { fontSize: FONT_SIZES.sm, color: COLORS.text },
  empty: { padding: 24, textAlign: 'center', color: COLORS.textSecondary },
});

export default SellerWalletScreen;
