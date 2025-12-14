import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  AppState,
  Alert,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Picker } from "@react-native-picker/picker";
import { saveSession } from "../utils/storage";

const CATEGORIES = [
  { label: "Ders Çalışma", value: "study", color: "#3b82f6" },
  { label: "Kodlama", value: "coding", color: "#8b5cf6" },
  { label: "Proje", value: "project", color: "#ec4899" },
  { label: "Kitap Okuma", value: "reading", color: "#10b981" },
];

export default function TimerScreen() {
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 dakika
  const [initialTime, setInitialTime] = useState(25);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("study");
  const [distractionCount, setDistractionCount] = useState(0);
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [showSummary, setShowSummary] = useState(false);
  const [lastSessionData, setLastSessionData] = useState(null);

  const intervalRef = useRef(null);
  const appState = useRef(AppState.currentState);

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

  // AppState ile dikkat dağınıklığı takibi
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
        Alert.alert(
          "Dikkat Dağınıklığı",
          "Uygulamadan ayrıldınız! Seans duraklatıldı.",
          [{ text: "Tamam" }]
        );
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [isRunning]);

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

  const handleSessionComplete = async () => {
    setIsRunning(false);
    const focusedTime = initialTime * 60 - timeLeft;
    const sessionData = {
      category: selectedCategory,
      duration: focusedTime,
      distractionCount,
      completed: timeLeft === 0,
    };

    try {
      await saveSession(sessionData);
      setLastSessionData(sessionData);
      setShowSummary(true);

      Alert.alert(
        "🎉 Tebrikler!",
        `Seans tamamlandı!\n\nKategori: ${
          CATEGORIES.find((c) => c.value === selectedCategory)?.label
        }\nSüre: ${Math.floor(
          focusedTime / 60
        )} dakika\nDikkat Dağınıklığı: ${distractionCount}`,
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

  return (
    <LinearGradient colors={["#1f2937", "#111827"]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Zamanlayıcı */}
        <View style={styles.timerSection}>
          <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
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
        </View>

        {/* Süre Ayarlama */}
        {!isRunning && !showSummary && (
          <View style={styles.timeAdjustSection}>
            <Text style={styles.sectionTitle}>Süre Ayarla</Text>
            <View style={styles.timeButtons}>
              <TouchableOpacity
                style={styles.timeButton}
                onPress={() => adjustTime(initialTime - 5)}
              >
                <Text style={styles.timeButtonText}>-5 dk</Text>
              </TouchableOpacity>
              <Text style={styles.timeValue}>{initialTime} dakika</Text>
              <TouchableOpacity
                style={styles.timeButton}
                onPress={() => adjustTime(initialTime + 5)}
              >
                <Text style={styles.timeButtonText}>+5 dk</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Kategori Seçimi */}
        {!isRunning && !showSummary && (
          <View style={styles.categorySection}>
            <Text style={styles.sectionTitle}>Kategori Seçin</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedCategory}
                onValueChange={(itemValue) => setSelectedCategory(itemValue)}
                style={styles.picker}
                dropdownIconColor="#fff"
              >
                {CATEGORIES.map((cat) => (
                  <Picker.Item
                    key={cat.value}
                    label={cat.label}
                    value={cat.value}
                    color="#000"
                  />
                ))}
              </Picker>
            </View>
          </View>
        )}

        {/* Dikkat Dağınıklığı Sayacı */}
        <View style={styles.distractionSection}>
          <Text style={styles.distractionLabel}>Dikkat Dağınıklığı</Text>
          <Text style={styles.distractionCount}>{distractionCount}</Text>
        </View>

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
  timerSection: {
    alignItems: "center",
    marginVertical: 30,
  },
  timerText: {
    fontSize: 72,
    fontWeight: "bold",
    color: "#fff",
    fontFamily: "monospace",
    textShadowColor: "rgba(99, 102, 241, 0.5)",
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 10,
  },
  progressBar: {
    width: "100%",
    height: 8,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 4,
    marginTop: 20,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  timeAdjustSection: {
    marginVertical: 20,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 15,
    textAlign: "center",
  },
  timeButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  timeButton: {
    backgroundColor: "#6366f1",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  timeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  timeValue: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  categorySection: {
    marginVertical: 20,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    padding: 20,
  },
  pickerContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 12,
    overflow: "hidden",
  },
  picker: {
    color: "#000",
  },
  distractionSection: {
    alignItems: "center",
    marginVertical: 20,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: "rgba(239, 68, 68, 0.3)",
  },
  distractionLabel: {
    fontSize: 16,
    color: "#ef4444",
    fontWeight: "bold",
    marginBottom: 8,
  },
  distractionCount: {
    fontSize: 48,
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
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  startButton: {
    backgroundColor: "#10b981",
  },
  pauseButton: {
    backgroundColor: "#f59e0b",
  },
  resetButton: {
    backgroundColor: "#6b7280",
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
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 16,
  },
  summaryCard: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: "rgba(99, 102, 241, 0.3)",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  summaryLabel: {
    fontSize: 16,
    color: "#9ca3af",
    fontWeight: "600",
  },
  summaryValue: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "bold",
  },
});
