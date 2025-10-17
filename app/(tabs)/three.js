import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View, useColorScheme } from 'react-native';
import MapView, { UrlTile } from 'react-native-maps';

const API_KEY = "2fbe121054b76cc0ae5f37cb61f5a94a";

export default function MapScreen() {
  const [region, setRegion] = useState(null);
  const [loading, setLoading] = useState(true);
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  const mapStyle = isDarkMode ? mapDarkStyle : [];

  useFocusEffect(
    useCallback(() => {
      const loadLastLocation = async () => {
        try {
          const locationJson = await AsyncStorage.getItem('lastLocation');
          if (locationJson) {
            const { latitude, longitude } = JSON.parse(locationJson);
            setRegion({
              latitude,
              longitude,
              latitudeDelta: 0.5,
              longitudeDelta: 0.5,
            });
          }
        } catch (e) {
          console.error("Failed to load location for map", e);
        } finally {
          setLoading(false);
        }
      };
      loadLastLocation();
    }, [])
  );

  if (loading) {
    return <ActivityIndicator style={styles.loader} size="large" />;
  }

  if (!region) {
    return (
      <View style={styles.loader}>
        <Text>Visita la pestaña 'Clima' para establecer una ubicación.</Text>
      </View>
    );
  }

  const cloudTileUrl = `https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=${API_KEY}`;

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={region}
        customMapStyle={mapStyle}
      >
        <UrlTile
          urlTemplate={cloudTileUrl}
          zIndex={1}
          opacity={0.6}
        />
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { width: '100%', height: '100%' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});

const mapDarkStyle = [ { "elementType": "geometry", "stylers": [ { "color": "#242f3e" } ] }, { "elementType": "labels.text.fill", "stylers": [ { "color": "#746855" } ] }, { "elementType": "labels.text.stroke", "stylers": [ { "color": "#242f3e" } ] }, { "featureType": "administrative.locality", "elementType": "labels.text.fill", "stylers": [ { "color": "#d59563" } ] }, { "featureType": "poi", "elementType": "labels.text.fill", "stylers": [ { "color": "#d59563" } ] }, { "featureType": "poi.park", "elementType": "geometry", "stylers": [ { "color": "#263c3f" } ] }, { "featureType": "poi.park", "elementType": "labels.text.fill", "stylers": [ { "color": "#6b9a76" } ] }, { "featureType": "road", "elementType": "geometry", "stylers": [ { "color": "#38414e" } ] }, { "featureType": "road", "elementType": "geometry.stroke", "stylers": [ { "color": "#212a37" } ] }, { "featureType": "road", "elementType": "labels.text.fill", "stylers": [ { "color": "#9ca5b3" } ] }, { "featureType": "road.highway", "elementType": "geometry", "stylers": [ { "color": "#746855" } ] }, { "featureType": "road.highway", "elementType": "geometry.stroke", "stylers": [ { "color": "#1f2835" } ] }, { "featureType": "road.highway", "elementType": "labels.text.fill", "stylers": [ { "color": "#f3d19c" } ] }, { "featureType": "transit", "elementType": "geometry", "stylers": [ { "color": "#2f3948" } ] }, { "featureType": "transit.station", "elementType": "labels.text.fill", "stylers": [ { "color": "#d59563" } ] }, { "featureType": "water", "elementType": "geometry", "stylers": [ { "color": "#17263c" } ] }, { "featureType": "water", "elementType": "labels.text.fill", "stylers": [ { "color": "#515c6d" } ] }, { "featureType": "water", "elementType": "labels.text.stroke", "stylers": [ { "color": "#17263c" } ] } ];