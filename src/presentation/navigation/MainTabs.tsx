/**
 * Main Bottom Tab Navigator
 * Each tab has its own stack for inner navigation
 * HomeTab | SearchTab | Wishlist | MessagesTab | ProfileTab
 */
import React from 'react';
import { StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Home, Search, Heart, MessageCircle, UserCircle } from 'lucide-react-native';
import type {
  MainTabParamList,
  HomeStackParamList,
  SearchStackParamList,
  MessagesStackParamList,
  ProfileStackParamList,
} from './types';

// Screens
import { HomeScreen } from '../screens/home/HomeScreen';
import { SearchScreen } from '../screens/search/SearchScreen';
import { WishlistScreen } from '../screens/wishlist/WishlistScreen';
import { MessagesScreen } from '../screens/messages/MessagesScreen';
import { ChatScreen } from '../screens/messages/ChatScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { EditProfileScreen } from '../screens/profile/EditProfileScreen';
import KycSubmitScreen from '../screens/profile/KycSubmitScreen';
import { ListingDetailScreen } from '../screens/listing/ListingDetailScreen';
import { OrdersScreen } from '../screens/orders/OrdersScreen';
import { OrderDetailScreen } from '../screens/orders/OrderDetailScreen';
import CreateOrderScreen from '../screens/orders/CreateOrderScreen';
import PaymentScreen from '../screens/orders/PaymentScreen';
import PaymentWebViewScreen from '../screens/orders/PaymentWebViewScreen';
import PaymentSuccessScreen from '../screens/orders/PaymentSuccessScreen';
import { NotificationsScreen } from '../screens/notifications/NotificationsScreen';
import { SettingsScreen } from '../screens/settings/SettingsScreen';
import { useMessageStore } from '../viewmodels/MessageStore';

import { COLORS, FONT_WEIGHTS, SHADOWS, SPACING, LAYOUT } from '../../config/theme';

const Tab = createBottomTabNavigator<MainTabParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const SearchStack = createNativeStackNavigator<SearchStackParamList>();
const MessagesStack = createNativeStackNavigator<MessagesStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();

const stackScreenOptions = { headerShown: false, animation: 'slide_from_right' as const };

// ─── Home Tab Stack ─────────────────────────────────────────────────────────
const HomeStackScreen: React.FC = () => (
  <HomeStack.Navigator screenOptions={stackScreenOptions}>
    <HomeStack.Screen name="Home" component={HomeScreen} />
    <HomeStack.Screen name="ListingDetail">
      {({ navigation, route }) => (
        <ListingDetailScreen
          listingId={route.params.listingId}
          onBack={() => navigation.goBack()}
          onChat={(sellerId) =>
            navigation.navigate('Chat', {
              participantName: 'Người bán',
              participantAvatar: undefined,
            })
          }
          onBuy={(listingId) => navigation.navigate('CreateOrder', { listingId })}
        />
      )}
    </HomeStack.Screen>
    <HomeStack.Screen name="CreateOrder" component={CreateOrderScreen} />
    <HomeStack.Screen name="Payment" component={PaymentScreen} />
    <HomeStack.Screen name="PaymentWebView" component={PaymentWebViewScreen} />
    <HomeStack.Screen name="PaymentSuccess" component={PaymentSuccessScreen} />
    <HomeStack.Screen name="Orders">
      {({ navigation }) => (
        <OrdersScreen
          onBack={() => navigation.goBack()}
          onOrderPress={(id) => navigation.navigate('OrderDetail', { orderId: id })}
        />
      )}
    </HomeStack.Screen>
    <HomeStack.Screen name="OrderDetail">
      {({ navigation, route }) => (
        <OrderDetailScreen
          orderId={route.params.orderId}
          onBack={() => navigation.goBack()}
        />
      )}
    </HomeStack.Screen>
    <HomeStack.Screen name="Chat">
      {({ navigation, route }) => (
        <ChatScreen
          conversationId={route.params.conversationId}
          participantName={route.params.participantName}
          participantAvatar={route.params.participantAvatar}
          listingTitle={route.params.listingTitle}
          listingImage={route.params.listingImage}
          onBack={() => navigation.goBack()}
        />
      )}
    </HomeStack.Screen>
    <HomeStack.Screen name="Notifications">
      {({ navigation }) => (
        <NotificationsScreen onBack={() => navigation.goBack()} />
      )}
    </HomeStack.Screen>
  </HomeStack.Navigator>
);

// ─── Search Tab Stack ───────────────────────────────────────────────────────
const SearchStackScreen: React.FC = () => (
  <SearchStack.Navigator screenOptions={stackScreenOptions}>
    <SearchStack.Screen name="Search">
      {({ navigation }) => (
        <SearchScreen
          onListingPress={(id) => navigation.navigate('ListingDetail', { listingId: id })}
        />
      )}
    </SearchStack.Screen>
    <SearchStack.Screen name="ListingDetail">
      {({ navigation, route }) => (
        <ListingDetailScreen
          listingId={route.params.listingId}
          onBack={() => navigation.goBack()}
          onChat={(sellerId) =>
            navigation.navigate('Chat', {
              participantName: 'Người bán',
              participantAvatar: undefined,
            })
          }
          onBuy={(listingId) => navigation.navigate('CreateOrder', { listingId })}
        />
      )}
    </SearchStack.Screen>
    <SearchStack.Screen name="CreateOrder" component={CreateOrderScreen} />
    <SearchStack.Screen name="Payment" component={PaymentScreen} />
    <SearchStack.Screen name="PaymentWebView" component={PaymentWebViewScreen} />
    <SearchStack.Screen name="PaymentSuccess" component={PaymentSuccessScreen} />
    <SearchStack.Screen name="Orders">
      {({ navigation }) => (
        <OrdersScreen
          onBack={() => navigation.goBack()}
          onOrderPress={(id) => navigation.navigate('OrderDetail', { orderId: id })}
        />
      )}
    </SearchStack.Screen>
    <SearchStack.Screen name="OrderDetail">
      {({ navigation, route }) => (
        <OrderDetailScreen
          orderId={route.params.orderId}
          onBack={() => navigation.goBack()}
        />
      )}
    </SearchStack.Screen>
    <SearchStack.Screen name="Chat">
      {({ navigation, route }) => (
        <ChatScreen
          conversationId={route.params.conversationId}
          participantName={route.params.participantName}
          participantAvatar={route.params.participantAvatar}
          listingTitle={route.params.listingTitle}
          listingImage={route.params.listingImage}
          onBack={() => navigation.goBack()}
        />
      )}
    </SearchStack.Screen>
  </SearchStack.Navigator>
);

// ─── Messages Tab Stack ─────────────────────────────────────────────────────
const MessagesStackScreen: React.FC = () => (
  <MessagesStack.Navigator screenOptions={stackScreenOptions}>
    <MessagesStack.Screen name="Messages">
      {({ navigation }) => (
        <MessagesScreen
          onConversationPress={(convId, name) =>
            navigation.navigate('Chat', {
              conversationId: convId,
              participantName: name,
            })
          }
        />
      )}
    </MessagesStack.Screen>
    <MessagesStack.Screen name="Chat">
      {({ navigation, route }) => (
        <ChatScreen
          conversationId={route.params.conversationId}
          participantName={route.params.participantName}
          participantAvatar={route.params.participantAvatar}
          listingTitle={route.params.listingTitle}
          listingImage={route.params.listingImage}
          onBack={() => navigation.goBack()}
        />
      )}
    </MessagesStack.Screen>
  </MessagesStack.Navigator>
);

// ─── Profile Tab Stack ──────────────────────────────────────────────────────
interface ProfileStackScreenProps {
  onLogout: () => void;
}

const ProfileStackScreen: React.FC<ProfileStackScreenProps> = ({ onLogout }) => (
  <ProfileStack.Navigator screenOptions={stackScreenOptions}>
    <ProfileStack.Screen name="Profile">
      {({ navigation }) => (
        <ProfileScreen
          onLogout={onLogout}
          onEditProfile={() => navigation.navigate('EditProfile')}
          onKycVerification={() => navigation.navigate('KycVerification')}
          onOrders={() => navigation.navigate('Orders')}
          onNotifications={() => navigation.navigate('Notifications')}
          onSettings={() => navigation.navigate('Settings')}
        />
      )}
    </ProfileStack.Screen>
    <ProfileStack.Screen name="EditProfile">
      {({ navigation }) => (
        <EditProfileScreen
          onBack={() => navigation.goBack()}
          onSave={() => navigation.goBack()}
        />
      )}
    </ProfileStack.Screen>
    <ProfileStack.Screen name="KycVerification">
      {({ navigation }) => (
        <KycSubmitScreen onBack={() => navigation.goBack()} />
      )}
    </ProfileStack.Screen>
    <ProfileStack.Screen name="Orders">
      {({ navigation }) => (
        <OrdersScreen
          onBack={() => navigation.goBack()}
          onOrderPress={(id) => navigation.navigate('OrderDetail', { orderId: id })}
        />
      )}
    </ProfileStack.Screen>
    <ProfileStack.Screen name="OrderDetail">
      {({ navigation, route }) => (
        <OrderDetailScreen
          orderId={route.params.orderId}
          onBack={() => navigation.goBack()}
        />
      )}
    </ProfileStack.Screen>
    <ProfileStack.Screen name="Notifications">
      {({ navigation }) => (
        <NotificationsScreen onBack={() => navigation.goBack()} />
      )}
    </ProfileStack.Screen>
    <ProfileStack.Screen name="Settings">
      {({ navigation }) => (
        <SettingsScreen onBack={() => navigation.goBack()} />
      )}
    </ProfileStack.Screen>
  </ProfileStack.Navigator>
);

// ─── Main Tabs ──────────────────────────────────────────────────────────────
interface MainTabsProps {
  onLogout: () => void;
}

export const MainTabs: React.FC<MainTabsProps> = ({ onLogout }) => {
  const { conversations, getConversations } = useMessageStore();

  React.useEffect(() => {
    getConversations();
  }, [getConversations]);

  const unreadCount = conversations.reduce((total, conversation) => total + (conversation.unreadCount || 0), 0);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textLight,
        tabBarLabelStyle: styles.tabLabel,
        tabBarStyle: styles.tabBar,
        tabBarItemStyle: styles.tabItem,
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStackScreen}
        options={{
          tabBarLabel: 'Trang chủ',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />

      <Tab.Screen
        name="SearchTab"
        component={SearchStackScreen}
        options={{
          tabBarLabel: 'Tìm kiếm',
          tabBarIcon: ({ color, size }) => <Search size={size} color={color} />,
        }}
      />

      <Tab.Screen
        name="Wishlist"
        component={WishlistScreen}
        options={{
          tabBarLabel: 'Yêu thích',
          tabBarIcon: ({ color, size }) => <Heart size={size} color={color} />,
        }}
      />

      <Tab.Screen
        name="MessagesTab"
        component={MessagesStackScreen}
        options={{
          tabBarLabel: 'Tin nhắn',
          tabBarIcon: ({ color, size }) => <MessageCircle size={size} color={color} />,
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
        }}
      />

      <Tab.Screen
        name="ProfileTab"
        options={{
          tabBarLabel: 'Tài khoản',
          tabBarIcon: ({ color, size }) => <UserCircle size={size} color={color} />,
        }}
      >
        {() => <ProfileStackScreen onLogout={onLogout} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    height: LAYOUT.tabBarHeight + (Platform.OS === 'ios' ? 20 : 0),
    paddingTop: SPACING.xs,
    ...SHADOWS.sm,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: FONT_WEIGHTS.medium,
    marginBottom: Platform.OS === 'ios' ? 0 : SPACING.xs,
  },
  tabItem: {
    paddingVertical: 4,
  },
});

export default MainTabs;
