import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";

export default function WeatherScreen() {
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [cityQuery, setCityQuery] = useState("");
  const [units, setUnits] = useState("metric");
  const [favorites, setFavorites] = useState([]);
  const [isFavorite, setIsFavorite] = useState(false);

  // Hooks de Expo Router para navegación y parámetros
  const router = useRouter();
  const params = useLocalSearchParams();

  // Para el modo oscuro/claro
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";
  const theme = isDarkMode ? styles.darkTheme : styles.lightTheme;
  const gradientColors = isDarkMode ? ["#003973", "#232526"] : ["#4A90E2", "#007AFF"];

  useEffect(() => {
    // Si se recibe una ciudad como parámetro, buscarla. Si no, usar la ubicación.
    if (params.city) {
      fetchDataByCity(params.city);
    } else {
      fetchDataByLocation();
    }
  }, [params.city]);

  // Cargar favoritos y comprobar si la ciudad actual es favorita
  useFocusEffect(
    useCallback(() => {
      loadFavorites();
    }, [])
  );

  const fetchDataByLocation = async () => {
    try {
      setLoading(true);
      setError(null);
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setError("Permiso de ubicación denegado");
        setLoading(false);
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      fetchData(`lat=${location.coords.latitude}&lon=${location.coords.longitude}`);
    } catch (e) {
      setError("Error al obtener la ubicación");
      setLoading(false);
    }
  };

  const fetchDataByCity = async (city) => {
    if (!city || city.trim() === "") return;
    setLoading(true);
    setError(null);
    try {
      // Primero obtenemos las coordenadas de la ciudad
      const geoResponse = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=${process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY}`);
      const geoData = await geoResponse.json();
      if (!geoData || geoData.length === 0) {
        throw new Error("Ciudad no encontrada");
      }
      const { lat, lon } = geoData[0];
      fetchData(`lat=${lat}&lon=${lon}`);
    } catch (e) {
      setError(e.message);
      setLoading(false);
    }
  };

  const fetchData = async (locationQuery) => {
    if (!loading) setLoading(true);
    setError(null);
    try {
      const [weatherResponse, forecastResponse] = await Promise.all([
        fetch(`https://api.openweathermap.org/data/2.5/weather?${locationQuery}&appid=${process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY}&units=${units}&lang=es`),
        fetch(`https://api.openweathermap.org/data/2.5/forecast?${locationQuery}&appid=${process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY}&units=${units}&lang=es`),
      ]);

      const weatherData = await weatherResponse.json();
      const forecastData = await forecastResponse.json();

      if (!weatherResponse.ok) {
        throw new Error(weatherData.message || "Error al obtener datos del clima");
      }
      if (!forecastResponse.ok) {
        throw new Error(forecastData.message || "No se pudo obtener el pronóstico");
      }

      // Filtrar el pronóstico para obtener un dato por día (aprox. a mediodía)
      const dailyForecast = forecastData.list.filter(item => item.dt_txt.includes("12:00:00"));

      setWeather(weatherData);
      setForecast(dailyForecast);

      // Guardar la última ubicación para que el mapa funcione
      await AsyncStorage.setItem('lastLocation', JSON.stringify(weatherData.coord));

    } finally {
      setLoading(false);
    }
  };

  // --- Lógica de Favoritos ---
  const loadFavorites = async () => {
    try {
      const favsJson = await AsyncStorage.getItem('favorites');
      const favs = favsJson ? JSON.parse(favsJson) : [];
      setFavorites(favs);
      if (weather) {
        setIsFavorite(favs.includes(weather.name));
      }
    } catch (e) {
      console.error("Error cargando favoritos", e);
    }
  };

  const toggleFavorite = async () => {
    if (!weather) return;
    const newFavorites = isFavorite
      ? favorites.filter(fav => fav !== weather.name)
      : [...favorites, weather.name];

    setFavorites(newFavorites);
    setIsFavorite(!isFavorite);
    await AsyncStorage.setItem('favorites', JSON.stringify(newFavorites));
  };

  useEffect(() => {
    if (weather) {
      setIsFavorite(favorites.includes(weather.name));
    }
  }, [weather, favorites]);
  // --- Fin Lógica de Favoritos ---

  useEffect(() => {
    if (weather) {
      // Refrescar datos cuando cambian las unidades, pero no si es la carga inicial
      if (weather.coord?.lat && weather.coord?.lon) {
        fetchData(`lat=${weather.coord.lat}&lon=${weather.coord.lon}`);
      }
    }
  }, [units]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    if (params.city) {
      fetchDataByCity(params.city).finally(() => setRefreshing(false));
    } else {
      fetchDataByLocation().finally(() => setRefreshing(false));
    }
  }, [params.city]);

  const getWeatherIcon = (weatherMain) => {
    const iconMap = {
      Clear: "sunny",
      Clouds: "cloudy",
      Rain: "rainy",
      Snow: "snow",
      Thunderstorm: "thunderstorm",
      Drizzle: "rainy-outline",
    };
    return iconMap[weatherMain] || "partly-sunny";
  };

  const DetailBox = ({ icon, label, value }) => (
    <View style={[styles.detailBox, theme.detailBox]}>
      <Ionicons name={icon} size={24} color={theme.icon.color} style={styles.detailIcon} />
      <Text style={[styles.detailLabel, theme.text]}>{label}</Text>
      <Text style={[styles.detailValue, theme.text]}>{value}</Text>
    </View>
  );

  const ForecastItem = ({ item }) => (
    <View style={styles.forecastItem}>
      <Text style={[styles.forecastDay, theme.text]}>{new Date(item.dt * 1000).toLocaleDateString('es-ES', { weekday: 'short' })}</Text>
      <Ionicons name={getWeatherIcon(item.weather[0].main)} size={30} color={theme.icon.color} />
      <Text style={[styles.forecastTemp, theme.text]}>{Math.round(item.main.temp)}°</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={[{ marginTop: 10 }, theme.text]}>Obteniendo datos del clima...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={60} color="orange" />
        <Text style={[styles.errorText, { color: 'orange' }]}>{error}</Text>
      </View>
    );
  }

  if (!weather) {
    return (
      <View style={styles.centerContainer}>
        <Text style={theme.text}>Bienvenido. Actualiza para ver el clima.</Text>
      </View>
    );
  }

  return (
    <LinearGradient colors={gradientColors} style={styles.gradient}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.refreshControl.color}
          />
        }
        contentContainerStyle={styles.container}
      >
        <View style={styles.searchContainer}>
          <TextInput
            style={[styles.searchInput, theme.input]}
            placeholder="Buscar ciudad..."
            placeholderTextColor={theme.placeholder.color}
            value={cityQuery}
            onChangeText={setCityQuery}
            onSubmitEditing={() => fetchDataByCity(cityQuery)}
          />
          <TouchableOpacity onPress={() => fetchDataByCity(cityQuery)} style={styles.searchButton}>
            <Ionicons name="search" size={24} color={theme.icon.color} />
          </TouchableOpacity>
        </View>

        <View style={styles.unitsContainer}>
          <Text style={theme.text}>°C</Text>
          <TouchableOpacity onPress={() => setUnits(units === 'metric' ? 'imperial' : 'metric')}>
            <View style={[styles.switch, units === 'imperial' && styles.switchActive]}>
              <View style={[styles.switchHandle, units === 'imperial' && styles.switchHandleActive]} />
            </View>
          </TouchableOpacity>
          <Text style={theme.text}>°F</Text>
        </View>

        <View style={styles.mainInfoContainer}>
          <Ionicons
            name={getWeatherIcon(weather.weather[0]?.main)}
            size={120}
            color={theme.icon.color}
          />
          <View style={styles.cityContainer}>
            <Text style={[styles.city, theme.text]}>{weather.name}</Text>
            <TouchableOpacity onPress={toggleFavorite}>
              <Ionicons name={isFavorite ? "star" : "star-outline"} size={28} color={isFavorite ? "#FFD700" : theme.icon.color} />
            </TouchableOpacity>
          </View>
          <Text style={[styles.temperature, theme.text]}>
            {Math.round(weather.main.temp)}°{units === 'metric' ? 'C' : 'F'}
          </Text>
          <Text style={[styles.description, theme.text]}>
            {weather.weather[0]?.description}
          </Text>
        </View>

        {forecast && forecast.length > 0 && (
          <View style={styles.forecastContainer}>
            <Text style={[styles.sectionTitle, theme.text]}>Pronóstico 5 Días</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {forecast.map((item) => <ForecastItem key={item.dt} item={item} />)}
            </ScrollView>
          </View>
        )}

        <View style={styles.detailsGrid}>
          <DetailBox
            icon="thermometer-outline"
            label="Sensación"
            value={`${Math.round(weather.main.feels_like)}°`}
          />
          <DetailBox
            icon="water-outline"
            label="Humedad"
            value={`${weather.main.humidity}%`}
          />
          <DetailBox
            icon="flag-outline"
            label="Viento"
            value={`${weather.wind.speed} ${units === 'metric' ? 'm/s' : 'mph'}`}
          />
          <DetailBox
            icon="speedometer-outline"
            label="Presión"
            value={`${weather.main.pressure} hPa`}
          />
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  // THEMES
  lightTheme: {
    text: { color: '#000' },
    input: { backgroundColor: '#fff', color: '#000' },
    placeholder: { color: '#8e8e93' },
    icon: { color: '#000' },
    detailBox: { backgroundColor: 'rgba(0, 0, 0, 0.1)' },
    refreshControl: { color: '#000' },
  },
  darkTheme: {
    text: { color: '#fff' },
    input: { backgroundColor: 'rgba(255, 255, 255, 0.2)', color: '#fff' },
    placeholder: { color: '#E0E0E0' },
    icon: { color: '#fff' },
    detailBox: { backgroundColor: 'rgba(255, 255, 255, 0.2)' },
    refreshControl: { color: '#fff' },
  },
  // LAYOUT
  gradient: { flex: 1 },
  container: {
    flexGrow: 1,
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: '#f0f0f0' },
  // SEARCH & UNITS
  searchContainer: {
    flexDirection: 'row',
    width: '100%',
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    fontSize: 16,
  },
  searchButton: {
    padding: 12,
    marginLeft: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unitsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 10,
  },
  switch: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    justifyContent: 'center',
    padding: 2,
  },
  switchActive: {
    backgroundColor: '#34C759',
  },
  switchHandle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'white',
    transform: [{ translateX: 0 }],
  },
  switchHandleActive: {
    transform: [{ translateX: 20 }],
  },
  // MAIN INFO
  mainInfoContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  cityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  city: {
    fontSize: 34,
    fontWeight: "300",
  },

  temperature: {
    fontSize: 96,
    fontWeight: "200",
    marginVertical: 0,
  },
  description: {
    fontSize: 22,
    textTransform: "capitalize",
    fontWeight: "300",
  },
  errorText: { fontSize: 18, textAlign: "center", marginTop: 10 },
  // FORECAST
  forecastContainer: {
    width: '100%',
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  forecastItem: {
    alignItems: 'center',
    marginRight: 20,
    gap: 8,
  },
  forecastDay: { fontSize: 16, fontWeight: '500' },
  forecastTemp: { fontSize: 18, fontWeight: '300' },
  // DETAILS
  detailsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    width: "100%",
  },
  detailBox: { borderRadius: 15, padding: 15, alignItems: "center", width: "48%", marginBottom: 15 },
  detailIcon: { marginBottom: 5 },
  detailLabel: { fontSize: 14, fontWeight: "bold" },
  detailValue: { fontSize: 18, fontWeight: "300", marginTop: 5 },
});
