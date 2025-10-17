import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { Appearance, ScrollView, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from "react-native";

export default function InfoScreen() {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const theme = isDarkMode ? styles.darkTheme : styles.lightTheme;
  const router = useRouter();

  const [favorites, setFavorites] = useState([]);

  const setScheme = (scheme) => {
    Appearance.setColorScheme(scheme);
  };

  useFocusEffect(
    useCallback(() => {
      loadFavorites();
    }, [])
  );

  const loadFavorites = async () => {
    const favsJson = await AsyncStorage.getItem('favorites');
    setFavorites(favsJson ? JSON.parse(favsJson) : []);
  };

  const removeFavorite = async (cityToRemove) => {
    const newFavorites = favorites.filter(fav => fav !== cityToRemove);
    setFavorites(newFavorites);
    await AsyncStorage.setItem('favorites', JSON.stringify(newFavorites));
  };

  const navigateToCity = (city) => {
    router.push({ pathname: '/', params: { city } });
  };

  return (
    <ScrollView style={[styles.container, theme.container]}>
      <View style={[styles.card, theme.card]}>
        <Text style={[styles.title, theme.text]}>🌤️ App del Clima</Text>
        <Text style={[styles.description, theme.text]}>
          Aplicación desarrollada con React Native y Expo que muestra el clima actual basado en tu ubicación geográfica.
        </Text>

        <Text style={[styles.sectionTitle, theme.text]}>Características</Text>
        <Text style={[styles.feature, theme.text]}>• Clima en tiempo real y pronóstico</Text>
        <Text style={[styles.feature, theme.text]}>• Búsqueda por ciudad</Text>
        <Text style={[styles.feature, theme.text]}>• Unidades Celsius/Fahrenheit</Text>
        <Text style={[styles.feature, theme.text]}>• Soporte para modo claro/oscuro</Text>

        <Text style={[styles.sectionTitle, theme.text]}>Tecnologías</Text>
        <Text style={[styles.tech, theme.text]}>React Native, Expo, OpenWeatherMap API</Text>
      </View>

      <View style={[styles.card, theme.card]}>
        <Text style={[styles.sectionTitle, theme.text]}>Ubicaciones Favoritas</Text>
        {favorites.length > 0 ? (
          favorites.map(city => (
            <View key={city} style={styles.favoriteItem}>
              <TouchableOpacity onPress={() => navigateToCity(city)} style={styles.favoriteCity}>
                <Text style={[styles.favoriteText, theme.text]}>{city}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => removeFavorite(city)}>
                <Ionicons name="trash-outline" size={22} color="#ff3b30" />
              </TouchableOpacity>
            </View>
          ))
        ) : (
          <Text style={theme.text}>
            Aún no tienes ubicaciones favoritas. ¡Agrega una desde la pantalla del clima!
          </Text>
        )}
      </View>

      <View style={[styles.card, theme.card]}>
        <Text style={[styles.sectionTitle, theme.text]}>Apariencia</Text>
        <View style={styles.themeSelector}>
          <TouchableOpacity onPress={() => setScheme('light')} style={[styles.themeButton, !isDarkMode && styles.themeButtonActive]}>
            <Ionicons name="sunny" size={20} color={!isDarkMode ? '#007AFF' : theme.text.color} />
            <Text style={[styles.themeButtonText, !isDarkMode && styles.themeButtonTextActive]}>Claro</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setScheme('dark')} style={[styles.themeButton, isDarkMode && styles.themeButtonActive]}>
            <Ionicons name="moon" size={20} color={isDarkMode ? '#007AFF' : theme.text.color} />
            <Text style={[styles.themeButtonText, isDarkMode && styles.themeButtonTextActive]}>Oscuro</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  lightTheme: {
    container: { backgroundColor: '#f0f2f5' },
    card: { backgroundColor: '#fff' },
    text: { color: '#000' },
  },
  darkTheme: {
    container: { backgroundColor: '#121212' },
    card: { backgroundColor: '#1e1e1e' },
    text: { color: '#fff' },
  },
  container: { flex: 1 },
  card: {
    margin: 20,
    padding: 20,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 15 },
  description: { fontSize: 16, lineHeight: 24, marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", marginTop: 15, marginBottom: 10 },
  feature: { fontSize: 16, marginBottom: 8, lineHeight: 22 },
  tech: { fontSize: 16, fontStyle: "italic" },
  themeSelector: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 10 },
  themeButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 20, gap: 8 },
  themeButtonActive: { backgroundColor: '#007AFF30' },
  themeButtonText: { fontSize: 16 },
  themeButtonTextActive: { color: '#007AFF', fontWeight: 'bold' },
  favoriteItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc3',
  },
  favoriteCity: { flex: 1 },
  favoriteText: { fontSize: 18 },
});
