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

            if (route.name === "Timer") {
              iconName = focused ? "timer" : "timer-outline";
            } else if (route.name === "Reports") {
              iconName = focused ? "stats-chart" : "stats-chart-outline";
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: "#3b82f6",
          tabBarInactiveTintColor: "#94a3b8",
          tabBarStyle: {
            backgroundColor: "#0f172a",
            borderTopColor: "#1e293b",
            paddingBottom: 8,
            height: 67,
            elevation: 0,
            shadowOpacity: 0,
          },
          headerStyle: {
            backgroundColor: "#0f172a",
            elevation: 0,
            shadowOpacity: 0,
          },
          headerTintColor: "#fff",
          headerTitleStyle: {
            fontWeight: "bold",
            fontSize: 18,
          },
        })}
      >
        <Tab.Screen
          name="Timer"
          component={TimerScreen}
          options={{
            title: "FocusFlow",
            tabBarLabel: "Odaklanma",
          }}
        />
        <Tab.Screen
          name="Reports"
          component={ReportsScreen}
          options={{
            title: "İstatistikler",
            tabBarLabel: "Raporlar",
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
