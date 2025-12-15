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
  getDailyGoal,
} from "../utils/storage";

const screenWidth = Dimensions.get("window").width;

const CATEGORIES = {
  study: { label: "Ders Çalışma", color: "#3b82f6", emoji: "📚" },
  coding: { label: "Kodlama", color: "#8b5cf6", emoji: "💻" },
  project: { label: "Proje", color: "#ec4899", emoji: "🎯" },
  reading: { label: "Kitap Okuma", color: "#10b981", emoji: "📖" },
};

const DAY_NAMES = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];

export default function ReportsScreen() {
  const [todayTotal, setTodayTotal] = useState(0);
  const [allTimeTotal, setAllTimeTotal] = useState(0);
  const [totalDistractions, setTotalDistractions] = useState(0);
  const [weeklyData, setWeeklyData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [dailyGoal, setDailyGoal] = useState(120);

  // Extra Analytics
  const [averageSessionTime, setAverageSessionTime] = useState(0);
  const [mostProductiveDay, setMostProductiveDay] = useState(null);
  const [totalSessions, setTotalSessions] = useState(0);
  const [bestCategory, setBestCategory] = useState(null);

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      // Tüm seanslar
      const allSessions = await getSessions();
      const goal = await getDailyGoal();
      setDailyGoal(goal);

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

      // Toplam seans sayısı
      setTotalSessions(allSessions.length);

      // Ortalama seans süresi
      if (allSessions.length > 0) {
        const avgMinutes = Math.round(allTimeMinutes / allSessions.length);
        setAverageSessionTime(avgMinutes);
      }

      // Son 7 günün verileri ve en verimli gün
      const weekSessions = await getLastWeekSessions();
      const weekData = prepareWeeklyData(weekSessions);
      setWeeklyData(weekData);

      // En odaklı günü bul
      if (weekData.length > 0) {
        const maxDay = weekData.reduce((max, day) =>
          day.minutes > max.minutes ? day : max
        );
        if (maxDay.minutes > 0) {
          setMostProductiveDay(maxDay);
        }
      }

      // Kategorilere göre dağılım ve en iyi kategori
      const catData = prepareCategoryData(allSessions);
      setCategoryData(catData);

      if (catData.length > 0) {
        const maxCategory = catData.reduce((max, cat) =>
          cat.population > max.population ? cat : max
        );
        setBestCategory(maxCategory);
      }
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
        day: DAY_NAMES[date.getDay()],
        dayName: DAY_NAMES[date.getDay()],
        minutes: totalMinutes,
      });
    }

    return last7Days;
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
      emoji: CATEGORIES[key]?.emoji || "📊",
    }));

    return pieData;
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStatistics();
    setRefreshing(false);
  };

  const chartConfig = {
    backgroundColor: "#0f172a",
    backgroundGradientFrom: "#1e293b",
    backgroundGradientTo: "#0f172a",
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForLabels: {
      fontSize: 11,
      fontWeight: "bold",
    },
    propsForBackgroundLines: {
      strokeDasharray: "",
      stroke: "rgba(255, 255, 255, 0.1)",
    },
  };

  const getProgressPercentage = () => {
    return Math.min((todayTotal / dailyGoal) * 100, 100);
  };

  return (
    <LinearGradient
      colors={["#0f172a", "#1e293b", "#334155"]}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#3b82f6"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {allTimeTotal === 0 ? (
          // Boş Durum - Daha güzel
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateEmoji}>📊</Text>
            <Text style={styles.emptyStateTitle}>Henüz veri yok</Text>
            <Text style={styles.emptyStateText}>
              Zamanlayıcı ekranından ilk seansınızı başlatın ve odaklanma
              yolculuğunuza adım atın!
            </Text>
            <View style={styles.emptyStateCard}>
              <Text style={styles.emptyStateCardTitle}>💡 İpucu</Text>
              <Text style={styles.emptyStateCardText}>
                • 25 dakikalık seanslarla başlayın{"\n"}• Kategorinizi seçin
                {"\n"}• Düzenli molalar verin{"\n"}• Günlük hedefinize ulaşın
              </Text>
            </View>
          </View>
        ) : (
          <>
            {/* Bugünkü Progress */}
            <View style={styles.todayProgressCard}>
              <Text style={styles.todayProgressTitle}>📅 Bugünkü İlerleme</Text>
              <View style={styles.progressBarContainer}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${getProgressPercentage()}%` },
                  ]}
                />
              </View>
              <View style={styles.todayProgressStats}>
                <Text style={styles.todayProgressText}>
                  {todayTotal} / {dailyGoal} dakika
                </Text>
                <Text style={styles.todayProgressPercent}>
                  %{Math.round(getProgressPercentage())}
                </Text>
              </View>
              {getProgressPercentage() >= 100 && (
                <Text style={styles.congratsText}>
                  🏆 Tebrikler! Hedefe ulaştın!
                </Text>
              )}
            </View>

            {/* Ana İstatistikler - Grid Layout */}
            <View style={styles.statsGrid}>
              <View style={[styles.statCard, styles.statCardPrimary]}>
                <Text style={styles.statEmoji}>📚</Text>
                <Text style={styles.statLabel}>Tüm Zamanlar</Text>
                <Text style={styles.statValue}>{allTimeTotal}</Text>
                <Text style={styles.statUnit}>dakika</Text>
                <Text style={styles.statSubValue}>
                  {Math.floor(allTimeTotal / 60)}s {allTimeTotal % 60}dk
                </Text>
              </View>

              <View style={[styles.statCard, styles.statCardSuccess]}>
                <Text style={styles.statEmoji}>🎯</Text>
                <Text style={styles.statLabel}>Toplam Seans</Text>
                <Text style={styles.statValue}>{totalSessions}</Text>
                <Text style={styles.statUnit}>seans</Text>
                <Text style={styles.statSubValue}>
                  Ort. {averageSessionTime} dk
                </Text>
              </View>

              <View style={[styles.statCard, styles.statCardWarning]}>
                <Text style={styles.statEmoji}>⚠️</Text>
                <Text style={styles.statLabel}>Dikkat Dağınıklığı</Text>
                <Text style={styles.statValue}>{totalDistractions}</Text>
                <Text style={styles.statUnit}>kez</Text>
                {totalSessions > 0 && (
                  <Text style={styles.statSubValue}>
                    Ort. {(totalDistractions / totalSessions).toFixed(1)}/seans
                  </Text>
                )}
              </View>

              <View style={[styles.statCard, styles.statCardInfo]}>
                <Text style={styles.statEmoji}>⏱️</Text>
                <Text style={styles.statLabel}>Ort. Seans</Text>
                <Text style={styles.statValue}>{averageSessionTime}</Text>
                <Text style={styles.statUnit}>dakika</Text>
                <Text style={styles.statSubValue}>
                  {(averageSessionTime / 60).toFixed(1)} saat
                </Text>
              </View>
            </View>

            {/* Extra İçgörüler */}
            {(mostProductiveDay || bestCategory) && (
              <View style={styles.insightsSection}>
                <Text style={styles.sectionTitle}>✨ İçgörüler</Text>

                {mostProductiveDay && mostProductiveDay.minutes > 0 && (
                  <View style={styles.insightCard}>
                    <Text style={styles.insightIcon}>🏆</Text>
                    <View style={styles.insightContent}>
                      <Text style={styles.insightTitle}>En Odaklı Gün</Text>
                      <Text style={styles.insightText}>
                        {mostProductiveDay.dayName} -{" "}
                        {mostProductiveDay.minutes} dakika
                      </Text>
                    </View>
                  </View>
                )}

                {bestCategory && (
                  <View style={styles.insightCard}>
                    <Text style={styles.insightIcon}>{bestCategory.emoji}</Text>
                    <View style={styles.insightContent}>
                      <Text style={styles.insightTitle}>Favori Kategori</Text>
                      <Text style={styles.insightText}>
                        {bestCategory.name} - {bestCategory.population} dakika
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* Haftalık Grafik */}
            {weeklyData.length > 0 && (
              <View style={styles.chartContainer}>
                <Text style={styles.sectionTitle}>📈 Son 7 Gün</Text>
                <BarChart
                  data={{
                    labels: weeklyData.map((d) => d.day),
                    datasets: [
                      {
                        data: weeklyData.map((d) => Math.max(d.minutes, 1)),
                      },
                    ],
                  }}
                  width={screenWidth - 40}
                  height={240}
                  chartConfig={chartConfig}
                  style={styles.chart}
                  showValuesOnTopOfBars
                  fromZero
                  yAxisSuffix=" dk"
                  withInnerLines={true}
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
                  height={240}
                  chartConfig={chartConfig}
                  accessor="population"
                  backgroundColor="transparent"
                  paddingLeft="15"
                  style={styles.chart}
                  absolute
                />

                {/* Kategori Detayları */}
                <View style={styles.categoryDetails}>
                  {categoryData.map((cat, index) => (
                    <View key={index} style={styles.categoryDetailItem}>
                      <View style={styles.categoryDetailLeft}>
                        <Text style={styles.categoryDetailEmoji}>
                          {cat.emoji}
                        </Text>
                        <Text style={styles.categoryDetailName}>
                          {cat.name}
                        </Text>
                      </View>
                      <View style={styles.categoryDetailRight}>
                        <Text style={styles.categoryDetailValue}>
                          {cat.population} dk
                        </Text>
                        <Text style={styles.categoryDetailPercent}>
                          %{Math.round((cat.population / allTimeTotal) * 100)}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </>
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
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 16,
    textAlign: "center",
  },
  // Bugünkü Progress
  todayProgressCard: {
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: "rgba(59, 130, 246, 0.3)",
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  todayProgressTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 16,
  },
  progressBarContainer: {
    height: 14,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 7,
    overflow: "hidden",
    marginBottom: 12,
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#3b82f6",
    borderRadius: 7,
  },
  todayProgressStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  todayProgressText: {
    fontSize: 16,
    color: "#94a3b8",
    fontWeight: "600",
  },
  todayProgressPercent: {
    fontSize: 20,
    color: "#3b82f6",
    fontWeight: "bold",
  },
  congratsText: {
    fontSize: 16,
    color: "#10b981",
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 12,
  },
  // Stats Grid
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    width: "48%",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    borderWidth: 2,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  statCardPrimary: {
    borderColor: "rgba(59, 130, 246, 0.4)",
    shadowColor: "#3b82f6",
  },
  statCardSuccess: {
    borderColor: "rgba(16, 185, 129, 0.4)",
    shadowColor: "#10b981",
  },
  statCardWarning: {
    borderColor: "rgba(239, 68, 68, 0.4)",
    shadowColor: "#ef4444",
  },
  statCardInfo: {
    borderColor: "rgba(139, 92, 246, 0.4)",
    shadowColor: "#8b5cf6",
  },
  statEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 12,
    color: "#94a3b8",
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
  },
  statValue: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  statUnit: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "600",
  },
  statSubValue: {
    fontSize: 11,
    color: "#475569",
    marginTop: 4,
    textAlign: "center",
  },
  // Insights Section
  insightsSection: {
    marginBottom: 24,
  },
  insightCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "rgba(16, 185, 129, 0.3)",
    shadowColor: "#10b981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  insightIcon: {
    fontSize: 40,
    marginRight: 16,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  insightText: {
    fontSize: 14,
    color: "#94a3b8",
    fontWeight: "600",
  },
  // Charts
  chartContainer: {
    marginBottom: 30,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  // Category Details
  categoryDetails: {
    marginTop: 20,
    gap: 12,
  },
  categoryDetailItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    padding: 16,
  },
  categoryDetailLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  categoryDetailEmoji: {
    fontSize: 24,
  },
  categoryDetailName: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "600",
  },
  categoryDetailRight: {
    alignItems: "flex-end",
  },
  categoryDetailValue: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "bold",
  },
  categoryDetailPercent: {
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 2,
  },
  // Empty State
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyStateEmoji: {
    fontSize: 80,
    marginBottom: 20,
  },
  emptyStateTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 12,
  },
  emptyStateText: {
    fontSize: 16,
    color: "#94a3b8",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  emptyStateCard: {
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    borderRadius: 20,
    padding: 24,
    borderWidth: 2,
    borderColor: "rgba(59, 130, 246, 0.3)",
    width: "100%",
  },
  emptyStateCardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#3b82f6",
    marginBottom: 12,
    textAlign: "center",
  },
  emptyStateCardText: {
    fontSize: 14,
    color: "#94a3b8",
    lineHeight: 24,
  },
});
