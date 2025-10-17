import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useColorScheme } from "react-native";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: isDarkMode ? "#4A90E2" : "#007AFF",
        tabBarInactiveTintColor: isDarkMode ? "#888" : "#8e8e93",
        tabBarStyle: {
          backgroundColor: isDarkMode ? "#1e1e1e" : "#fff",
        },
        headerStyle: { backgroundColor: isDarkMode ? "#1e1e1e" : "#fff" },
        headerTintColor: isDarkMode ? "#fff" : "#000",
        headerTitleStyle: { fontWeight: "bold" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Clima",
          tabBarIcon: ({ color, size }) => <Ionicons name="partly-sunny" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="two"
        options={{
          title: "Información",
          tabBarIcon: ({ color, size }) => <Ionicons name="information-circle" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="three"
        options={{
          title: "Mapa",
          tabBarIcon: ({ color, size }) => <Ionicons name="map" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
