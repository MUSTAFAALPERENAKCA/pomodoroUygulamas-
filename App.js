import React, { useEffect, useRef } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import TimerScreen from "./src/screens/TimerScreen";
import ReportsScreen from "./src/screens/ReportsScreen";
import { StatusBar } from "expo-status-bar";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

const Tab = createBottomTabNavigator();

// Bildirim handler'ı - Bildirimler uygulamada görünsün
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function App() {
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    // Bildirim izinlerini al
    registerForPushNotificationsAsync();

    // Bildirim geldiğinde
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log("Bildirim alındı:", notification);
      });

    // Bildirime tıklandığında
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log("Bildirime tıklandı:", response);
        // Uygulama otomatik olarak açılır
      });

    return () => {
      Notifications.removeNotificationSubscription(
        notificationListener.current
      );
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

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

// Bildirim izinlerini al
async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#3b82f6",
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    alert("Bildirim izni verilmedi!");
    return;
  }

  return token;
}
