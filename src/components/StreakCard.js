import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function StreakCard({ streak, todayProgress, dailyGoal }) {
  const progressPercentage = Math.min((todayProgress / dailyGoal) * 100, 100);
  const isGoalMet = todayProgress >= dailyGoal;

  const getFlameSize = () => {
    if (streak >= 7) return 48;
    if (streak >= 3) return 40;
    return 32;
  };

  const getMotivationMessage = () => {
    if (streak === 0) return "İlk streak'ini başlat!";
    if (streak === 1) return "Harika başlangıç! 🎯";
    if (streak >= 7) return "İnanılmaz! Devam et! 🚀";
    if (streak >= 3) return "Süper gidiyorsun! 💪";
    return "Devam et! 🔥";
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.flameContainer}>
          <Text style={[styles.flame, { fontSize: getFlameSize() }]}>🔥</Text>
          <View style={styles.streakBadge}>
            <Text style={styles.streakNumber}>{streak}</Text>
          </View>
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>Günlük Streak</Text>
          <Text style={styles.message}>{getMotivationMessage()}</Text>
        </View>
      </View>

      <View style={styles.progressSection}>
        <View style={styles.progressInfo}>
          <Text style={styles.progressLabel}>Bugünkü İlerleme</Text>
          <Text style={styles.progressValue}>
            {todayProgress} / {dailyGoal} dk
          </Text>
        </View>
        <View style={styles.progressBarContainer}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${progressPercentage}%`,
                backgroundColor: isGoalMet ? "#10b981" : "#3b82f6",
              },
            ]}
          />
        </View>
        {isGoalMet && (
          <Text style={styles.goalMetText}>🏆 Günlük hedef tamamlandı!</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "rgba(251, 146, 60, 0.1)",
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: "rgba(251, 146, 60, 0.3)",
    shadowColor: "#fb923c",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  flameContainer: {
    position: "relative",
    marginRight: 16,
  },
  flame: {
    fontSize: 32,
  },
  streakBadge: {
    position: "absolute",
    bottom: -4,
    right: -4,
    backgroundColor: "#fb923c",
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: "#0f172a",
  },
  streakNumber: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#fff",
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    color: "#fb923c",
    fontWeight: "600",
  },
  progressSection: {
    marginTop: 8,
  },
  progressInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 13,
    color: "#94a3b8",
    fontWeight: "600",
  },
  progressValue: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "bold",
  },
  progressBarContainer: {
    height: 10,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 5,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 5,
  },
  goalMetText: {
    fontSize: 13,
    color: "#10b981",
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 8,
  },
});
