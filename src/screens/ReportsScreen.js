import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  RefreshControl,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BarChart, PieChart } from "react-native-chart-kit";
import {
  getSessions,
  getTodaySessions,
  getLastWeekSessions,
} from "../utils/storage";

const screenWidth = Dimensions.get("window").width;

const CATEGORIES = {
  study: { label: "Ders Çalışma", color: "#3b82f6" },
  coding: { label: "Kodlama", color: "#8b5cf6" },
  project: { label: "Proje", color: "#ec4899" },
  reading: { label: "Kitap Okuma", color: "#10b981" },
};

export default function ReportsScreen() {
  const [todayTotal, setTodayTotal] = useState(0);
  const [allTimeTotal, setAllTimeTotal] = useState(0);
  const [totalDistractions, setTotalDistractions] = useState(0);
  const [weeklyData, setWeeklyData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      // Tüm seanslar
      const allSessions = await getSessions();

      // Bugünkü seanslar
      const todaySessions = await getTodaySessions();
      const todayMinutes = todaySessions.reduce(
        (sum, session) => sum + Math.floor(session.duration / 60),
        0
      );
      setTodayTotal(todayMinutes);

      // Tüm zamanların toplamı
      const allTimeMinutes = allSessions.reduce(
        (sum, session) => sum + Math.floor(session.duration / 60),
        0
      );
      setAllTimeTotal(allTimeMinutes);

      // Toplam dikkat dağınıklığı
      const distractions = allSessions.reduce(
        (sum, session) => sum + (session.distractionCount || 0),
        0
      );
      setTotalDistractions(distractions);

      // Son 7 günün verileri
      prepareWeeklyData(await getLastWeekSessions());

      // Kategorilere göre dağılım
      prepareCategoryData(allSessions);
    } catch (error) {
      console.error("İstatistikler yüklenemedi:", error);
    }
  };

  const prepareWeeklyData = (sessions) => {
    const last7Days = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateString = date.toDateString();

      const dayData = sessions.filter(
        (session) => new Date(session.date).toDateString() === dateString
      );

      const totalMinutes = dayData.reduce(
        (sum, session) => sum + Math.floor(session.duration / 60),
        0
      );

      last7Days.push({
        date: date.getDate(),
        day: ["Pz", "Pt", "Sa", "Ça", "Pe", "Cu", "Ct"][date.getDay()],
        minutes: totalMinutes,
      });
    }

    setWeeklyData(last7Days);
  };

  const prepareCategoryData = (sessions) => {
    const categoryTotals = {};

    sessions.forEach((session) => {
      const category = session.category;
      if (!categoryTotals[category]) {
        categoryTotals[category] = 0;
      }
      categoryTotals[category] += Math.floor(session.duration / 60);
    });

    const pieData = Object.keys(categoryTotals).map((key) => ({
      name: CATEGORIES[key]?.label || key,
      population: categoryTotals[key],
      color: CATEGORIES[key]?.color || "#6b7280",
      legendFontColor: "#fff",
      legendFontSize: 12,
    }));

    setCategoryData(pieData);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStatistics();
    setRefreshing(false);
  };

  const chartConfig = {
    backgroundColor: "#1f2937",
    backgroundGradientFrom: "#1f2937",
    backgroundGradientTo: "#111827",
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForLabels: {
      fontSize: 12,
      fontWeight: "bold",
    },
  };

  return (
    <LinearGradient colors={["#1f2937", "#111827"]} style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Genel İstatistikler */}
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>📊 Genel İstatistikler</Text>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Bugün Toplam Odaklanma</Text>
            <Text style={styles.statValue}>{todayTotal} dakika</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Tüm Zamanlar Toplam</Text>
            <Text style={styles.statValue}>{allTimeTotal} dakika</Text>
            <Text style={styles.statSubValue}>
              {Math.floor(allTimeTotal / 60)} saat {allTimeTotal % 60} dakika
            </Text>
          </View>

          <View style={[styles.statCard, styles.distractionCard]}>
            <Text style={styles.statLabel}>Toplam Dikkat Dağınıklığı</Text>
            <Text style={[styles.statValue, { color: "#ef4444" }]}>
              {totalDistractions}
            </Text>
          </View>
        </View>

        {/* Haftalık Grafik */}
        {weeklyData.length > 0 && (
          <View style={styles.chartContainer}>
            <Text style={styles.sectionTitle}>📈 Son 7 Gün</Text>
            <BarChart
              data={{
                labels: weeklyData.map((d) => d.day),
                datasets: [
                  {
                    data: weeklyData.map((d) => d.minutes || 0.1),
                  },
                ],
              }}
              width={screenWidth - 40}
              height={220}
              chartConfig={chartConfig}
              style={styles.chart}
              showValuesOnTopOfBars
              fromZero
              yAxisSuffix=" dk"
            />
          </View>
        )}

        {/* Kategori Dağılımı */}
        {categoryData.length > 0 && (
          <View style={styles.chartContainer}>
            <Text style={styles.sectionTitle}>
              🎯 Kategorilere Göre Dağılım
            </Text>
            <PieChart
              data={categoryData}
              width={screenWidth - 40}
              height={220}
              chartConfig={chartConfig}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              style={styles.chart}
              absolute
            />
          </View>
        )}

        {/* Boş Durum */}
        {allTimeTotal === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>📊 Henüz veri yok</Text>
            <Text style={styles.emptyStateSubText}>
              Zamanlayıcı ekranından ilk seansınızı başlatın!
            </Text>
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 16,
    textAlign: "center",
  },
  statsContainer: {
    marginBottom: 30,
  },
  statCard: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "rgba(99, 102, 241, 0.3)",
  },
  distractionCard: {
    borderColor: "rgba(239, 68, 68, 0.3)",
    backgroundColor: "rgba(239, 68, 68, 0.05)",
  },
  statLabel: {
    fontSize: 14,
    color: "#9ca3af",
    fontWeight: "600",
    marginBottom: 8,
  },
  statValue: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
  },
  statSubValue: {
    fontSize: 14,
    color: "#9ca3af",
    marginTop: 4,
  },
  chartContainer: {
    marginBottom: 30,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    padding: 16,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 12,
  },
  emptyStateSubText: {
    fontSize: 16,
    color: "#9ca3af",
    textAlign: "center",
  },
});
