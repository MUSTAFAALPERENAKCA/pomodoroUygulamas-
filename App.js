import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import TimerScreen from "./src/screens/TimerScreen";
import ReportsScreen from "./src/screens/ReportsScreen";
import { StatusBar } from "expo-status-bar";

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;

            if (route.name === "Zamanlayıcı") {
              iconName = focused ? "timer" : "timer-outline";
            } else if (route.name === "Raporlar") {
              iconName = focused ? "stats-chart" : "stats-chart-outline";
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: "#6366f1",
          tabBarInactiveTintColor: "gray",
          tabBarStyle: {
            backgroundColor: "#1f2937",
            borderTopColor: "#374151",
            paddingBottom: 8,
            height: 60,
          },
          headerStyle: {
            backgroundColor: "#1f2937",
          },
          headerTintColor: "#fff",
          headerTitleStyle: {
            fontWeight: "bold",
          },
        })}
      >
        <Tab.Screen
          name="Zamanlayıcı"
          component={TimerScreen}
          options={{ title: "Odaklanma Seansı" }}
        />
        <Tab.Screen
          name="Raporlar"
          component={ReportsScreen}
          options={{ title: "İstatistikler ve Raporlar" }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
