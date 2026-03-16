import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MapPin, Navigation, AlertCircle } from 'lucide-react-native';
import tw from 'twrnc';
import { COLORS } from '../../../config/theme';
import { useLocation, LocationCoords } from '../../hooks/useLocation';
import Toast from 'react-native-toast-message';

// NOTE: Cần cài: npm install react-native-maps
// import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

interface LocationPickerScreenProps {
  initialLocation?: LocationCoords;
  onLocationSelected?: (location: LocationCoords) => void;
  onBack?: () => void;
}

export default function LocationPickerScreen({
  initialLocation,
  onLocationSelected,
  onBack,
}: LocationPickerScreenProps) {
  const { location, loading, getCurrentLocation, calculateDistance } = useLocation();
  const [selectedLocation, setSelectedLocation] = useState<LocationCoords | null>(
    initialLocation || null
  );

  useEffect(() => {
    if (!initialLocation) {
      getCurrentLocation();
    }
  }, [initialLocation]);

  const handleSelectCurrentLocation = async () => {
    const currentLoc = await getCurrentLocation();
    if (currentLoc) {
      setSelectedLocation(currentLoc);
      Toast.show({
        type: 'success',
        text1: 'Đã chọn vị trí hiện tại',
      });
    }
  };

  const handleConfirm = () => {
    if (selectedLocation && onLocationSelected) {
      onLocationSelected(selectedLocation);
      Toast.show({
        type: 'success',
        text1: 'Đã chọn vị trí',
      });
      onBack?.();
    }
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-white`}>
      {/* Header */}
      <View style={tw`px-4 py-3 border-b border-gray-200`}>
        <Text style={tw`text-xl font-bold text-gray-900`}>Chọn vị trí</Text>
        <Text style={tw`text-sm text-gray-500 mt-1`}>
          {selectedLocation
            ? `${selectedLocation.latitude.toFixed(6)}, ${selectedLocation.longitude.toFixed(6)}`
            : 'Chưa chọn vị trí'}
        </Text>
      </View>

      {/* Map Placeholder */}
      <View style={tw`flex-1 bg-gray-100 items-center justify-center`}>
        <AlertCircle size={64} color={COLORS.warning} />
        <Text style={tw`text-lg font-bold text-gray-900 mt-4 px-6 text-center`}>
          React Native Maps chưa được cài đặt
        </Text>
        <Text style={tw`text-sm text-gray-600 mt-2 px-6 text-center`}>
          Vui lòng cài đặt: npm install react-native-maps
        </Text>

        {/* 
        UNCOMMENT THIS AFTER INSTALLING react-native-maps:
        
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={{
            latitude: location?.latitude || 10.7769,
            longitude: location?.longitude || 106.7009,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
          onPress={(e) => setSelectedLocation(e.nativeEvent.coordinate)}
        >
          {selectedLocation && (
            <Marker
              coordinate={selectedLocation}
              title="Vị trí đã chọn"
              pinColor={COLORS.primary}
            />
          )}
          {location && !selectedLocation && (
            <Marker
              coordinate={location}
              title="Vị trí hiện tại"
              pinColor={COLORS.error}
            />
          )}
        </MapView>
        */}

        {/* Demo Location Info */}
        {location && (
          <View style={tw`bg-white rounded-xl p-4 mt-6 w-80`}>
            <Text style={tw`text-sm font-semibold text-gray-700 mb-2`}>
              Vị trí hiện tại (Mock)
            </Text>
            <Text style={tw`text-xs text-gray-600`}>
              Lat: {location.latitude.toFixed(6)}
            </Text>
            <Text style={tw`text-xs text-gray-600`}>
              Lon: {location.longitude.toFixed(6)}
            </Text>
            {location.accuracy && (
              <Text style={tw`text-xs text-gray-500 mt-1`}>
                Độ chính xác: ±{location.accuracy.toFixed(0)}m
              </Text>
            )}
          </View>
        )}
      </View>

      {/* Bottom Actions */}
      <View style={tw`px-4 py-3 border-t border-gray-200 bg-white gap-3`}>
        <TouchableOpacity
          style={[
            tw`rounded-xl py-3 flex-row items-center justify-center border-2 border-gray-300`,
          ]}
          onPress={handleSelectCurrentLocation}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.primary} />
          ) : (
            <>
              <Navigation size={20} color={COLORS.primary} />
              <Text style={tw`ml-2 text-base font-bold text-gray-700`}>
                Sử dụng vị trí hiện tại
              </Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            tw`rounded-xl py-4 items-center`,
            {
              backgroundColor: selectedLocation ? COLORS.primary : COLORS.textSecondary,
            },
          ]}
          onPress={handleConfirm}
          disabled={!selectedLocation}
        >
          <Text style={tw`text-white text-base font-bold`}>Xác nhận vị trí</Text>
        </TouchableOpacity>

        <TouchableOpacity style={tw`py-3 items-center`} onPress={onBack}>
          <Text style={tw`text-gray-600 text-base font-semibold`}>Hủy</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  map: {
    ...StyleSheet.absoluteFillObject,
  },
});
