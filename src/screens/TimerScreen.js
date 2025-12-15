import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  AppState,
  Alert,
  ScrollView,
  Modal,
  Animated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { saveSession, getDailyGoal, getTodaySessions, calculateFocusScore } from "../utils/storage";

const CATEGORIES = [
  { label: "Ders Çalışma", value: "study", color: "#3b82f6", emoji: "📚" },
  { label: "Kodlama", value: "coding", color: "#8b5cf6", emoji: "💻" },
  { label: "Proje", value: "project", color: "#ec4899", emoji: "🎯" },
  { label: "Kitap Okuma", value: "reading", color: "#10b981", emoji: "📖" },
];

const MOTIVATION_MESSAGES = [
  "Harika gidiyorsun! 🌟",
  "Odaklanman mükemmel! 🎯",
  "Süpersin! Devam et! 💪",
  "Bugün çok üretkensin! ⭐",
  "Hedefine yaklaşıyorsun! 🚀",
  "İnanılmaz konsantrasyon! 🔥",
];

export default function TimerScreen() {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [initialTime, setInitialTime] = useState(25);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("study");
  const [distractionCount, setDistractionCount] = useState(0);
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [showSummary, setShowSummary] = useState(false);
  const [lastSessionData, setLastSessionData] = useState(null);

  // Günlük hedef
  const [dailyGoal, setDailyGoal] = useState(120);
  const [todayTotal, setTodayTotal] = useState(0);

  // AppState için modal
  const [showResumeModal, setShowResumeModal] = useState(false);

  // Animasyon
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const intervalRef = useRef(null);
  const appState = useRef(AppState.currentState);

  // Günlük hedef ve bugünkü toplamı yükle
  useEffect(() => {
    loadDailyData();
  }, []);

  const loadDailyData = async () => {
    const goal = await getDailyGoal();
    setDailyGoal(goal);

    const todaySessions = await getTodaySessions();
    const total = todaySessions.reduce(
      (sum, session) => sum + Math.floor(session.duration / 60),
      0
    );
    setTodayTotal(total);
  };

  // Zamanlayıcı
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleSessionComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }

    return () => clearInterval(intervalRef.current);
  }, [isRunning, timeLeft]);

  // Timer aktifken pulse animasyonu
  useEffect(() => {
    if (isRunning) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRunning]);

  // AppState ile dikkat dağınıklığı takibi - GELİŞMİŞ VERSİYON
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (
        appState.current.match(/active/) &&
        nextAppState === "background" &&
        isRunning
      ) {
        // Uygulama arka plana alındı - Dikkat dağınıklığı!
        setDistractionCount((prev) => prev + 1);
        setIsRunning(false);
      }

      // Background'dan active'e döndüğünde ve timer duraklamışsa
      if (
        appState.current === "background" &&
        nextAppState === "active" &&
        !isRunning &&
        sessionStartTime &&
        timeLeft > 0
      ) {
        // Kullanıcıya seçenek sun
        setShowResumeModal(true);
      }

      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [isRunning, sessionStartTime, timeLeft]);

  const handleStart = () => {
    if (!sessionStartTime) {
      setSessionStartTime(Date.now());
    }
    setIsRunning(true);
    setShowSummary(false);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(initialTime * 60);
    setDistractionCount(0);
    setSessionStartTime(null);
    setShowSummary(false);
  };

  const handleResume = () => {
    setShowResumeModal(false);
    setIsRunning(true);
  };

  const handleEndSession = () => {
    setShowResumeModal(false);
    handleSessionComplete();
  };

  const handleSessionComplete = async () => {
    setIsRunning(false);
    const focusedTime = initialTime * 60 - timeLeft;
    const completed = timeLeft === 0;
    
    // Odak skorunu hesapla
    const focusScore = calculateFocusScore(distractionCount, completed);
    
    const sessionData = {
      category: selectedCategory,
      duration: focusedTime,
      distractionCount,
      completed,
      focusScore,
    };

    try {
      await saveSession(sessionData);
      setLastSessionData(sessionData);
      setShowSummary(true);

      // Bugünkü toplamı güncelle
      await loadDailyData();

      // Motivasyon mesajı
      const randomMessage =
        MOTIVATION_MESSAGES[
          Math.floor(Math.random() * MOTIVATION_MESSAGES.length)
        ];

      const categoryLabel = CATEGORIES.find(
        (c) => c.value === selectedCategory
      )?.label;
      const minutes = Math.floor(focusedTime / 60);

      Alert.alert(
        "🎉 Tebrikler!",
        `${randomMessage}\n\nKategori: ${categoryLabel}\nSüre: ${minutes} dakika\nDikkat Dağınıklığı: ${distractionCount}\nOdak Skoru: ${focusScore}/100`,
        [
          {
            text: "Tamam",
            onPress: () => {
              handleReset();
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert("Hata", "Seans kaydedilemedi!");
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const adjustTime = (minutes) => {
    if (!isRunning && minutes > 0 && minutes <= 120) {
      setInitialTime(minutes);
      setTimeLeft(minutes * 60);
    }
  };

  const getProgressPercentage = () => {
    return Math.min((todayTotal / dailyGoal) * 100, 100);
  };

  const getProgressMessage = () => {
    const percentage = getProgressPercentage();
    if (percentage >= 100) return "🏆 Günlük hedefe ulaştın!";
    if (percentage >= 75) return "⭐ Neredeyse tamam!";
    if (percentage >= 50) return "💪 Yarı yoldasın!";
    if (percentage >= 25) return "🚀 İyi başladın!";
    return "📊 Günlük Hedefin";
  };

  return (
    <LinearGradient
      colors={["#0f172a", "#1e293b", "#334155"]}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Günlük Hedef Progress */}
        {!isRunning && (
          <View style={styles.dailyGoalCard}>
            <Text style={styles.dailyGoalTitle}>{getProgressMessage()}</Text>
            <View style={styles.progressBarContainer}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${getProgressPercentage()}%` },
                ]}
              />
            </View>
            <Text style={styles.dailyGoalText}>
              {todayTotal} / {dailyGoal} dakika
            </Text>
          </View>
        )}

        {/* Zamanlayıcı - FOCUS MODE */}
        <Animated.View
          style={[
            styles.timerSection,
            isRunning && styles.timerSectionFocused,
            { transform: [{ scale: pulseAnim }] },
          ]}
        >
          <Text
            style={[styles.timerText, isRunning && styles.timerTextFocused]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {formatTime(timeLeft)}
          </Text>
          {isRunning && (
            <Text style={styles.focusModeLabel}>🎯 ODAKLANMA MODU</Text>
          )}
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${
                    ((initialTime * 60 - timeLeft) / (initialTime * 60)) * 100
                  }%`,
                  backgroundColor: CATEGORIES.find(
                    (c) => c.value === selectedCategory
                  )?.color,
                },
              ]}
            />
          </View>
        </Animated.View>

        {/* Süre Ayarlama - Sadece timer duruyorken göster */}
        {!isRunning && !showSummary && (
          <View style={styles.timeAdjustSection}>
            <Text style={styles.sectionTitle}>⏱️ Süre Ayarla</Text>
            <View style={styles.timeButtons}>
              <TouchableOpacity
                style={styles.timeButton}
                onPress={() => adjustTime(initialTime - 5)}
                disabled={initialTime <= 5}
              >
                <Text style={styles.timeButtonText}>-5 dk</Text>
              </TouchableOpacity>
              <Text style={styles.timeValue}>{initialTime} dakika</Text>
              <TouchableOpacity
                style={styles.timeButton}
                onPress={() => adjustTime(initialTime + 5)}
                disabled={initialTime >= 120}
              >
                <Text style={styles.timeButtonText}>+5 dk</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Kategori Seçimi - Sadece timer duruyorken göster */}
        {!isRunning && !showSummary && (
          <View style={styles.categorySection}>
            <Text style={styles.sectionTitle}>🎯 Kategori Seçin</Text>
            <View style={styles.categoryButtons}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.value}
                  style={[
                    styles.categoryButton,
                    selectedCategory === cat.value &&
                      styles.activeCategoryButton,
                    { borderColor: cat.color },
                  ]}
                  onPress={() => setSelectedCategory(cat.value)}
                >
                  <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                  <Text
                    style={[
                      styles.categoryButtonText,
                      selectedCategory === cat.value &&
                        styles.activeCategoryButtonText,
                    ]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Dikkat Dağınıklığı Sayacı */}
        {!isRunning && distractionCount > 0 && (
          <View style={styles.distractionSection}>
            <Text style={styles.distractionLabel}>⚠️ Dikkat Dağınıklığı</Text>
            <Text style={styles.distractionCount}>{distractionCount}</Text>
          </View>
        )}

        {/* Kontrol Butonları */}
        <View style={styles.buttonContainer}>
          {!isRunning ? (
            <TouchableOpacity
              style={[styles.button, styles.startButton]}
              onPress={handleStart}
            >
              <Text style={styles.buttonText}>▶️ Başlat</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.button, styles.pauseButton]}
              onPress={handlePause}
            >
              <Text style={styles.buttonText}>⏸️ Duraklat</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.button, styles.resetButton]}
            onPress={handleReset}
          >
            <Text style={styles.buttonText}>🔄 Sıfırla</Text>
          </TouchableOpacity>
        </View>

        {/* Seans Özeti */}
        {showSummary && lastSessionData && (
          <View style={styles.summarySection}>
            <Text style={styles.summaryTitle}>📊 Seans Özeti</Text>
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Kategori:</Text>
                <Text style={styles.summaryValue}>
                  {
                    CATEGORIES.find((c) => c.value === lastSessionData.category)
                      ?.emoji
                  }{" "}
                  {
                    CATEGORIES.find((c) => c.value === lastSessionData.category)
                      ?.label
                  }
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Süre:</Text>
                <Text style={styles.summaryValue}>
                  {Math.floor(lastSessionData.duration / 60)} dakika
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Dikkat Dağınıklığı:</Text>
                <Text style={styles.summaryValue}>
                  {lastSessionData.distractionCount}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Odak Skoru:</Text>
                <Text
                  style={[
                    styles.summaryValue,
                    styles.focusScoreText,
                    {
                      color:
                        lastSessionData.focusScore >= 80
                          ? "#10b981"
                          : lastSessionData.focusScore >= 50
                          ? "#f59e0b"
                          : "#ef4444",
                    },
                  ]}
                >
                  {lastSessionData.focusScore}/100
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Durum:</Text>
                <Text
                  style={[
                    styles.summaryValue,
                    {
                      color: lastSessionData.completed ? "#10b981" : "#f59e0b",
                    },
                  ]}
                >
                  {lastSessionData.completed
                    ? "✅ Tamamlandı"
                    : "⏸️ Duraklatıldı"}
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Resume Modal - Background'dan döndüğünde */}
      <Modal
        visible={showResumeModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowResumeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>⚠️ Dikkat Dağınıklığı</Text>
            <Text style={styles.modalText}>
              Uygulamadan ayrıldınız!{"\n"}Seansınıza devam etmek ister misiniz?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={handleResume}
              >
                <Text style={styles.modalButtonText}>▶️ Devam Et</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={handleEndSession}
              >
                <Text style={styles.modalButtonTextSecondary}>
                  ⏹️ Seansı Bitir
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  dailyGoalCard: {
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: "rgba(59, 130, 246, 0.3)",
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  dailyGoalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 12,
  },
  progressBarContainer: {
    height: 12,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 6,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#3b82f6",
    borderRadius: 6,
  },
  dailyGoalText: {
    fontSize: 14,
    color: "#94a3b8",
    textAlign: "center",
    fontWeight: "600",
  },
  timerSection: {
    alignItems: "center",
    marginVertical: 30,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 30,
    padding: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  timerSectionFocused: {
    backgroundColor: "rgba(59, 130, 246, 0.15)",
    borderWidth: 3,
    borderColor: "rgba(59, 130, 246, 0.5)",
  },
  timerText: {
    fontSize: 64,
    fontWeight: "bold",
    color: "#fff",
    fontFamily: "monospace",
    textShadowColor: "rgba(59, 130, 246, 0.8)",
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 12,
    letterSpacing: 4,
    includeFontPadding: false,
    textAlignVertical: "center",
  },
  timerTextFocused: {
    fontSize: 72,
    color: "#3b82f6",
    letterSpacing: 6,
  },
  focusModeLabel: {
    fontSize: 14,
    color: "#3b82f6",
    fontWeight: "bold",
    marginTop: 12,
    letterSpacing: 2,
  },
  progressBar: {
    width: "100%",
    height: 10,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 5,
    marginTop: 24,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 5,
  },
  timeAdjustSection: {
    marginVertical: 20,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 16,
    textAlign: "center",
  },
  timeButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  timeButton: {
    backgroundColor: "#3b82f6",
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 14,
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  timeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  timeValue: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },
  categorySection: {
    marginVertical: 20,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  categoryButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "center",
  },
  categoryButton: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 2,
    minWidth: "46%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  activeCategoryButton: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderWidth: 3,
    shadowOpacity: 0.4,
    elevation: 6,
  },
  categoryEmoji: {
    fontSize: 28,
    marginBottom: 6,
  },
  categoryButtonText: {
    color: "#94a3b8",
    fontSize: 14,
    fontWeight: "bold",
  },
  activeCategoryButtonText: {
    color: "#fff",
    fontSize: 15,
  },
  distractionSection: {
    alignItems: "center",
    marginVertical: 20,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderRadius: 20,
    padding: 24,
    borderWidth: 2,
    borderColor: "rgba(239, 68, 68, 0.4)",
    shadowColor: "#ef4444",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  distractionLabel: {
    fontSize: 16,
    color: "#ef4444",
    fontWeight: "bold",
    marginBottom: 8,
  },
  distractionCount: {
    fontSize: 56,
    fontWeight: "bold",
    color: "#ef4444",
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
    marginVertical: 20,
  },
  button: {
    flex: 1,
    paddingVertical: 18,
    borderRadius: 18,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  startButton: {
    backgroundColor: "#10b981",
  },
  pauseButton: {
    backgroundColor: "#f59e0b",
  },
  resetButton: {
    backgroundColor: "#64748b",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  summarySection: {
    marginVertical: 20,
  },
  summaryTitle: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 20,
  },
  summaryCard: {
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    borderRadius: 20,
    padding: 24,
    borderWidth: 2,
    borderColor: "rgba(59, 130, 246, 0.3)",
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  summaryLabel: {
    fontSize: 16,
    color: "#94a3b8",
    fontWeight: "600",
  },
  summaryValue: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "bold",
  },
  focusScoreText: {
    fontSize: 18,
    fontWeight: "900",
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#1e293b",
    borderRadius: 24,
    padding: 28,
    width: "100%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
    borderWidth: 2,
    borderColor: "rgba(239, 68, 68, 0.3)",
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 16,
  },
  modalText: {
    fontSize: 16,
    color: "#94a3b8",
    textAlign: "center",
    marginBottom: 28,
    lineHeight: 24,
  },
  modalButtons: {
    gap: 12,
  },
  modalButton: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  modalButtonPrimary: {
    backgroundColor: "#10b981",
    shadowColor: "#10b981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },
  modalButtonSecondary: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 2,
    borderColor: "#ef4444",
  },
  modalButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  modalButtonTextSecondary: {
    color: "#ef4444",
    fontSize: 18,
    fontWeight: "bold",
  },
});
