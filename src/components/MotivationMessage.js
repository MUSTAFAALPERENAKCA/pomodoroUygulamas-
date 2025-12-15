import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

export default function MotivationMessage({ sessions, streak, onDismiss }) {
  const [message, setMessage] = useState(null);
  const [icon, setIcon] = useState("💡");

  useEffect(() => {
    generateMessage();
  }, [sessions, streak]);

  const generateMessage = () => {
    if (!sessions || sessions.length === 0) {
      setMessage(null);
      return;
    }

    // Son 3 seansı analiz et
    const recentSessions = sessions.slice(0, 3);
    const avgDistractions =
      recentSessions.reduce((sum, s) => sum + (s.distractionCount || 0), 0) /
      recentSessions.length;
    const avgFocusScore =
      recentSessions.reduce((sum, s) => sum + (s.focusScore || 0), 0) /
      recentSessions.length;

    // Bugünkü seanslar
    const today = new Date().toDateString();
    const todaySessions = sessions.filter(
      (s) => new Date(s.date).toDateString() === today
    );
    const todayTotal = todaySessions.reduce(
      (sum, s) => sum + Math.floor(s.duration / 60),
      0
    );

    // Mesaj seç
    let selectedMessage = "";
    let selectedIcon = "💡";

    // Yüksek dikkat dağınıklığı
    if (avgDistractions > 3) {
      selectedMessage =
        "Dikkat dağınıklığın arttı. Daha sessiz bir ortam dene! 🤫";
      selectedIcon = "⚠️";
    }
    // Düşük odak skoru
    else if (avgFocusScore < 50 && avgFocusScore > 0) {
      selectedMessage =
        "Odaklanmanda zorluk yaşıyorsun. Kısa molalar vermeyi dene! ☕";
      selectedIcon = "💪";
    }
    // Rekor gün
    else if (todayTotal > 120) {
      selectedMessage = `Bugün rekor kırdın! ${todayTotal} dakika odaklandın! 🎉`;
      selectedIcon = "🏆";
    }
    // Aktif streak
    else if (streak >= 3) {
      selectedMessage = `🔥 ${streak} gün üst üste! İnanılmaz kararlılık!`;
      selectedIcon = "🔥";
    }
    // Mükemmel odak
    else if (avgFocusScore >= 90) {
      selectedMessage = "Odaklanman mükemmel! Böyle devam et! ⭐";
      selectedIcon = "🌟";
    }
    // İyi performans
    else if (avgFocusScore >= 70) {
      selectedMessage = "Harika gidiyorsun! Devam et! 💫";
      selectedIcon = "✨";
    }
    // Varsayılan motivasyon
    else {
      selectedMessage = "Her seans seni hedefe yaklaştırıyor! 🎯";
      selectedIcon = "🎯";
    }

    setMessage(selectedMessage);
    setIcon(selectedIcon);
  };

  if (!message) return null;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.icon}>{icon}</Text>
        <Text style={styles.message}>{message}</Text>
      </View>
      {onDismiss && (
        <TouchableOpacity onPress={onDismiss} style={styles.dismissButton}>
          <Text style={styles.dismissText}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "rgba(139, 92, 246, 0.1)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(139, 92, 246, 0.3)",
    shadowColor: "#8b5cf6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  content: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    fontSize: 28,
    marginRight: 12,
  },
  message: {
    flex: 1,
    fontSize: 14,
    color: "#fff",
    fontWeight: "600",
    lineHeight: 20,
  },
  dismissButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  dismissText: {
    fontSize: 16,
    color: "#94a3b8",
    fontWeight: "bold",
  },
});
