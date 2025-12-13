import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  Vibration,
  Dimensions,
  Animated,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Circle } from "react-native-svg";

const DEFAULT_WORK_TIME = 25 * 60; // 25 minutes in seconds
const DEFAULT_SHORT_BREAK = 5 * 60; // 5 minutes in seconds
const DEFAULT_LONG_BREAK = 15 * 60; // 15 minutes in seconds

const THEMES = {
  vibrant: {
    work: ["#6366f1", "#8b5cf6", "#a855f7", "#ec4899"],
    shortBreak: ["#06b6d4", "#3b82f6", "#8b5cf6", "#06b6d4"],
    longBreak: ["#f59e0b", "#ef4444", "#ec4899", "#f59e0b"],
  },
  ocean: {
    work: ["#0ea5e9", "#06b6d4", "#14b8a6", "#06b6d4"],
    shortBreak: ["#06b6d4", "#0891b2", "#14b8a6", "#06b6d4"],
    longBreak: ["#10b981", "#14b8a6", "#06b6d4", "#10b981"],
  },
  sunset: {
    work: ["#f97316", "#fb923c", "#fbbf24", "#f59e0b"],
    shortBreak: ["#ec4899", "#f43f5e", "#fb7185", "#ec4899"],
    longBreak: ["#8b5cf6", "#a855f7", "#c026d3", "#8b5cf6"],
  },
  forest: {
    work: ["#22c55e", "#16a34a", "#15803d", "#22c55e"],
    shortBreak: ["#84cc16", "#65a30d", "#4d7c0f", "#84cc16"],
    longBreak: ["#10b981", "#059669", "#047857", "#10b981"],
  },
};

export default function App() {
  const [workTime, setWorkTime] = useState(DEFAULT_WORK_TIME);
  const [shortBreakTime, setShortBreakTime] = useState(DEFAULT_SHORT_BREAK);
  const [longBreakTime, setLongBreakTime] = useState(DEFAULT_LONG_BREAK);
  const [timeLeft, setTimeLeft] = useState(DEFAULT_WORK_TIME);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionType, setSessionType] = useState("work"); // 'work', 'shortBreak', 'longBreak'
  const [sessionCount, setSessionCount] = useState(0);
  const [dailyPomodoros, setDailyPomodoros] = useState(0);
  const [weeklyPomodoros, setWeeklyPomodoros] = useState(0);
  const [dailyGoal, setDailyGoal] = useState(8);
  const [showStats, setShowStats] = useState(false);
  const [lastCompletedDate, setLastCompletedDate] = useState(null);
  const [lastSessionTime, setLastSessionTime] = useState(null);
  const [lastSessionType, setLastSessionType] = useState(null);
  const [currentTheme, setCurrentTheme] = useState("vibrant");
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [autoStartBreaks, setAutoStartBreaks] = useState(false);
  const [autoStartPomodoros, setAutoStartPomodoros] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const intervalRef = useRef(null);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleTimerComplete();
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

  // Günlük pomodoro sayısını sıfırla (yeni gün başladığında)
  useEffect(() => {
    const today = new Date().toDateString();
    if (lastCompletedDate !== today) {
      setDailyPomodoros(0);
      setLastCompletedDate(today);
    }
  }, []);

  const getMotivationalMessage = () => {
    const messages = [
      "Harika iş çıkardın! 🎉",
      "Mükemmel! Devam et! 💪",
      "Süpersin! 🌟",
      "Çok iyi gidiyorsun! 🚀",
      "Harika! Sen bir şampiyonsun! 🏆",
      "İnanılmaz! Devam et! ⭐",
      "Odaklanman muhteşem! 🎯",
      "Başarılısın! 💫",
      "Verimli bir oturumdu! 📈",
      "Kendini geliştiriyorsun! 🌱",
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  const getBreakMessage = () => {
    const messages = [
      "Mola süresi tamamlandı. Tekrar çalışmaya hazır mısın? 💪",
      "Dinlendin mi? Hadi devam edelim! 🚀",
      "Mola bitti! Yeni bir oturuma hazır ol! ⚡",
      "Enerji doldu! Başlayalım! 🔋",
      "Mükemmel! Şimdi tekrar odaklanma zamanı! 🎯",
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  const handleTimerComplete = () => {
    if (vibrationEnabled) {
      Vibration.vibrate([500, 200, 500]);
    }

    if (sessionType === "work") {
      const newDailyCount = dailyPomodoros + 1;
      setDailyPomodoros(newDailyCount);
      setWeeklyPomodoros((prev) => prev + 1);
      const today = new Date().toDateString();
      setLastCompletedDate(today);
    }

    // Son oturum bilgilerini kaydet
    const now = new Date();
    setLastSessionTime(
      now.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })
    );
    setLastSessionType(sessionType);

    const motivationalMsg =
      sessionType === "work" ? getMotivationalMessage() : "";
    const message =
      sessionType === "work"
        ? `${motivationalMsg}\n\nÇalışma süresi tamamlandı. Mola zamanı!`
        : "Mola süresi tamamlandı. Tekrar çalışmaya hazır mısın?";

    Alert.alert("Süre Doldu!", message, [
      {
        text: "Tamam",
        onPress: () => {
          if (sessionType === "work") {
            const nextBreak = sessionCount === 3 ? "longBreak" : "shortBreak";
            setSessionType(nextBreak);
            setTimeLeft(
              nextBreak === "longBreak" ? longBreakTime : shortBreakTime
            );
            if (nextBreak === "longBreak") {
              setSessionCount(0);
            } else {
              setSessionCount((prev) => prev + 1);
            }
          } else {
            setSessionType("work");
            setTimeLeft(workTime);
          }
          setIsRunning(false);
        },
      },
    ]);
  };

  const startTimer = () => {
    setIsRunning(true);
  };

  const pauseTimer = () => {
    setIsRunning(false);
  };

  const quickStart = (type, time) => {
    setSessionType(type);
    setTimeLeft(time);
    setIsRunning(true);
  };

  const resetTimer = () => {
    setIsRunning(false);
    if (sessionType === "work") {
      setTimeLeft(workTime);
    } else if (sessionType === "shortBreak") {
      setTimeLeft(shortBreakTime);
    } else {
      setTimeLeft(longBreakTime);
    }
  };

  const adjustTime = (type, increment) => {
    const newValue =
      increment > 0
        ? Math.min(60 * 60, increment) // max 60 dakika
        : Math.max(1 * 60, increment); // min 1 dakika

    if (type === "work") {
      setWorkTime(newValue);
      if (sessionType === "work" && !isRunning) {
        setTimeLeft(newValue);
      }
    } else if (type === "shortBreak") {
      setShortBreakTime(newValue);
      if (sessionType === "shortBreak" && !isRunning) {
        setTimeLeft(newValue);
      }
    } else if (type === "longBreak") {
      setLongBreakTime(newValue);
      if (sessionType === "longBreak" && !isRunning) {
        setTimeLeft(newValue);
      }
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const getSessionTitle = () => {
    switch (sessionType) {
      case "work":
        return "Çalışma Zamanı";
      case "shortBreak":
        return "Kısa Mola";
      case "longBreak":
        return "Uzun Mola";
      default:
        return "Pomodoro";
    }
  };

  const getGradientColors = () => {
    const theme = THEMES[currentTheme];
    switch (sessionType) {
      case "work":
        return theme.work;
      case "shortBreak":
        return theme.shortBreak;
      case "longBreak":
        return theme.longBreak;
      default:
        return theme.work;
    }
  };

  const getProgress = () => {
    let totalTime;
    switch (sessionType) {
      case "work":
        totalTime = workTime;
        break;
      case "shortBreak":
        totalTime = shortBreakTime;
        break;
      case "longBreak":
        totalTime = longBreakTime;
        break;
      default:
        totalTime = workTime;
    }
    return ((totalTime - timeLeft) / totalTime) * 100;
  };

  const getGoalProgress = () => {
    return Math.min((dailyPomodoros / dailyGoal) * 100, 100);
  };

  const adjustDailyGoal = (increment) => {
    const newGoal = dailyGoal + increment;
    if (newGoal >= 1 && newGoal <= 20) {
      setDailyGoal(newGoal);
    }
  };

  const progress = getProgress();
  const gradientColors = getGradientColors();

  const handleButtonPress = (callback) => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    callback();
  };

  return (
    <LinearGradient
      colors={gradientColors}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      locations={[0, 0.3, 0.7, 1]}
    >
      <StatusBar style="light" />
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity
              style={[styles.statsButton, styles.leftButton]}
              onPress={() => setShowThemeSelector(!showThemeSelector)}
              activeOpacity={0.7}
            >
              <Text style={styles.statsButtonText}>
                {showThemeSelector ? "✕" : "🎨"}
              </Text>
            </TouchableOpacity>
            <Text style={styles.title}>{getSessionTitle()}</Text>
            <TouchableOpacity
              style={styles.statsButton}
              onPress={() => setShowStats(!showStats)}
              activeOpacity={0.7}
            >
              <Text style={styles.statsButtonText}>
                {showStats ? "✕" : "📊"}
              </Text>
            </TouchableOpacity>
          </View>

          {showThemeSelector ? (
            <View style={styles.statsContainer}>
              <Text style={styles.themeSelectorTitle}>🎨 Tema Seç</Text>
              <View style={styles.themeGrid}>
                {Object.keys(THEMES).map((themeName) => (
                  <TouchableOpacity
                    key={themeName}
                    style={[
                      styles.themeButton,
                      currentTheme === themeName && styles.activeThemeButton,
                    ]}
                    onPress={() => setCurrentTheme(themeName)}
                    activeOpacity={0.7}
                  >
                    <LinearGradient
                      colors={THEMES[themeName].work}
                      style={styles.themePreview}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    />
                    <Text style={styles.themeButtonText}>
                      {themeName === "vibrant"
                        ? "🌈 Canlı"
                        : themeName === "ocean"
                        ? "🌊 Okyanus"
                        : themeName === "sunset"
                        ? "🌅 Gün Batımı"
                        : "🌲 Orman"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : showStats ? (
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Günlük Pomodoro</Text>
                <Text style={styles.statValue}>{dailyPomodoros}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Günlük Hedef</Text>
                <Text style={styles.statValue}>{dailyGoal}</Text>
              </View>
              <View style={styles.goalProgressContainer}>
                <View style={styles.goalProgressBar}>
                  <View
                    style={[
                      styles.goalProgressFill,
                      { width: `${getGoalProgress()}%` },
                    ]}
                  />
                </View>
                <Text style={styles.goalProgressText}>
                  {Math.round(getGoalProgress())}% Tamamlandı
                </Text>
              </View>
              {dailyPomodoros >= dailyGoal && (
                <Text style={styles.goalAchievedText}>
                  🎉 Günlük hedefe ulaştın! Harika iş!
                </Text>
              )}
            </View>
          ) : (
            <View style={styles.sessionBadge}>
              <Text style={styles.sessionBadgeText}>
                🎯 {sessionCount} Oturum Tamamlandı
              </Text>
              <Text style={styles.dailyPomodorosText}>
                📈 Bugün: {dailyPomodoros} Pomodoro
              </Text>
            </View>
          )}
        </View>

        <Animated.View
          style={[
            styles.timerContainer,
            {
              transform: [{ scale: pulseAnim }],
            },
          ]}
        >
          <Svg width={300} height={300} style={styles.progressSvg}>
            {/* Outer Glow Circle */}
            <Circle
              cx={150}
              cy={150}
              r={145}
              stroke="rgba(255, 255, 255, 0.15)"
              strokeWidth={12}
              fill="transparent"
            />
            {/* Background Circle */}
            <Circle
              cx={150}
              cy={150}
              r={135}
              stroke="rgba(255, 255, 255, 0.25)"
              strokeWidth={10}
              fill="transparent"
            />
            {/* Progress Circle */}
            <Circle
              cx={150}
              cy={150}
              r={135}
              stroke="rgba(255, 255, 255, 0.95)"
              strokeWidth={10}
              fill="transparent"
              strokeDasharray={`${2 * Math.PI * 135}`}
              strokeDashoffset={`${2 * Math.PI * 135 * (1 - progress / 100)}`}
              strokeLinecap="round"
              transform={`rotate(-90 150 150)`}
            />
          </Svg>
          <View style={styles.timerContent}>
            <Text style={styles.timer}>{formatTime(timeLeft)}</Text>
            <Text style={styles.timerLabel}>Kalan Süre</Text>
            <View style={styles.progressTextContainer}>
              <Text style={styles.progressText}>
                {Math.round(progress)}% Tamamlandı
              </Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View
          style={[
            styles.buttonContainer,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {!isRunning ? (
            <LinearGradient
              colors={["#ffffff", "#f8f9fa", "#e9ecef"]}
              style={[styles.button, styles.primaryButton]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <TouchableOpacity
                onPress={() => handleButtonPress(startTimer)}
                activeOpacity={0.9}
                style={styles.buttonInner}
              >
                <Text style={styles.primaryButtonText}>▶️ Başlat</Text>
              </TouchableOpacity>
            </LinearGradient>
          ) : (
            <LinearGradient
              colors={["rgba(255, 255, 255, 0.3)", "rgba(255, 255, 255, 0.2)"]}
              style={[styles.button, styles.secondaryButton]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <TouchableOpacity
                onPress={() => handleButtonPress(pauseTimer)}
                activeOpacity={0.85}
                style={styles.buttonInner}
              >
                <Text style={styles.secondaryButtonText}>⏸️ Duraklat</Text>
              </TouchableOpacity>
            </LinearGradient>
          )}
          <TouchableOpacity
            style={[styles.button, styles.resetButton]}
            onPress={() => handleButtonPress(resetTimer)}
            activeOpacity={0.8}
          >
            <Text style={styles.resetButtonText}>🔄 Sıfırla</Text>
          </TouchableOpacity>
        </Animated.View>

        <View style={styles.sessionButtonsContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sessionButtonsTitle}>📋 Oturum Seç</Text>
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={() => setShowSettings(!showSettings)}
              activeOpacity={0.7}
            >
              <Text style={styles.settingsButtonText}>
                {showSettings ? "✕" : "⚙️"}
              </Text>
            </TouchableOpacity>
          </View>

          {showSettings ? (
            <View style={styles.settingsPanel}>
              <View style={styles.timeAdjustRow}>
                <Text style={styles.timeAdjustLabel}>⚡ Çalışma</Text>
                <View style={styles.timeAdjustControls}>
                  <TouchableOpacity
                    style={styles.timeAdjustButton}
                    onPress={() => adjustTime("work", workTime - 5 * 60)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.timeAdjustButtonText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.timeAdjustValue}>
                    {Math.floor(workTime / 60)} dk
                  </Text>
                  <TouchableOpacity
                    style={styles.timeAdjustButton}
                    onPress={() => adjustTime("work", workTime + 5 * 60)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.timeAdjustButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.timeAdjustRow}>
                <Text style={styles.timeAdjustLabel}>☕ Kısa Mola</Text>
                <View style={styles.timeAdjustControls}>
                  <TouchableOpacity
                    style={styles.timeAdjustButton}
                    onPress={() =>
                      adjustTime("shortBreak", shortBreakTime - 1 * 60)
                    }
                    activeOpacity={0.7}
                  >
                    <Text style={styles.timeAdjustButtonText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.timeAdjustValue}>
                    {Math.floor(shortBreakTime / 60)} dk
                  </Text>
                  <TouchableOpacity
                    style={styles.timeAdjustButton}
                    onPress={() =>
                      adjustTime("shortBreak", shortBreakTime + 1 * 60)
                    }
                    activeOpacity={0.7}
                  >
                    <Text style={styles.timeAdjustButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.timeAdjustRow}>
                <Text style={styles.timeAdjustLabel}>🌴 Uzun Mola</Text>
                <View style={styles.timeAdjustControls}>
                  <TouchableOpacity
                    style={styles.timeAdjustButton}
                    onPress={() =>
                      adjustTime("longBreak", longBreakTime - 5 * 60)
                    }
                    activeOpacity={0.7}
                  >
                    <Text style={styles.timeAdjustButtonText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.timeAdjustValue}>
                    {Math.floor(longBreakTime / 60)} dk
                  </Text>
                  <TouchableOpacity
                    style={styles.timeAdjustButton}
                    onPress={() =>
                      adjustTime("longBreak", longBreakTime + 5 * 60)
                    }
                    activeOpacity={0.7}
                  >
                    <Text style={styles.timeAdjustButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ) : null}

          <View style={styles.sessionButtons}>
            <TouchableOpacity
              style={[
                styles.sessionButton,
                sessionType === "work" && styles.activeSessionButton,
              ]}
              onPress={() => {
                if (!isRunning) {
                  setSessionType("work");
                  setTimeLeft(workTime);
                }
              }}
              activeOpacity={0.75}
            >
              <LinearGradient
                colors={
                  sessionType === "work"
                    ? ["rgba(255, 255, 255, 0.5)", "rgba(255, 255, 255, 0.35)"]
                    : ["rgba(255, 255, 255, 0.2)", "rgba(255, 255, 255, 0.15)"]
                }
                style={styles.sessionButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text
                  style={[
                    styles.sessionButtonText,
                    sessionType === "work" && styles.activeSessionButtonText,
                  ]}
                >
                  ⚡ Çalışma
                </Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.sessionButton,
                sessionType === "shortBreak" && styles.activeSessionButton,
              ]}
              onPress={() => {
                if (!isRunning) {
                  setSessionType("shortBreak");
                  setTimeLeft(shortBreakTime);
                }
              }}
              activeOpacity={0.75}
            >
              <LinearGradient
                colors={
                  sessionType === "shortBreak"
                    ? ["rgba(255, 255, 255, 0.5)", "rgba(255, 255, 255, 0.35)"]
                    : ["rgba(255, 255, 255, 0.2)", "rgba(255, 255, 255, 0.15)"]
                }
                style={styles.sessionButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text
                  style={[
                    styles.sessionButtonText,
                    sessionType === "shortBreak" &&
                      styles.activeSessionButtonText,
                  ]}
                >
                  ☕ Kısa Mola
                </Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.sessionButton,
                sessionType === "longBreak" && styles.activeSessionButton,
              ]}
              onPress={() => {
                if (!isRunning) {
                  setSessionType("longBreak");
                  setTimeLeft(longBreakTime);
                }
              }}
              activeOpacity={0.75}
            >
              <LinearGradient
                colors={
                  sessionType === "longBreak"
                    ? ["rgba(255, 255, 255, 0.5)", "rgba(255, 255, 255, 0.35)"]
                    : ["rgba(255, 255, 255, 0.2)", "rgba(255, 255, 255, 0.15)"]
                }
                style={styles.sessionButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text
                  style={[
                    styles.sessionButtonText,
                    sessionType === "longBreak" &&
                      styles.activeSessionButtonText,
                  ]}
                >
                  🌴 Uzun Mola
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </LinearGradient>
  );
}

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    alignItems: "center",
    padding: 32,
    width: "100%",
    maxWidth: 420,
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
    width: "100%",
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    marginBottom: 20,
    position: "relative",
  },
  title: {
    fontSize: 36,
    fontWeight: "900",
    color: "#fff",
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.4)",
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 10,
    letterSpacing: 1.5,
    flex: 1,
  },
  statsButton: {
    position: "absolute",
    right: 0,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.4)",
  },
  leftButton: {
    left: 0,
    right: "auto",
  },
  statsButtonText: {
    fontSize: 20,
    color: "#fff",
  },
  themeSelectorTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#fff",
    textAlign: "center",
    marginBottom: 16,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  themeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "center",
  },
  themeButton: {
    width: "45%",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 16,
    padding: 12,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  activeThemeButton: {
    borderColor: "#fff",
    borderWidth: 3,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
  },
  themePreview: {
    width: "100%",
    height: 50,
    borderRadius: 12,
    marginBottom: 8,
  },
  themeButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
  },
  statsContainer: {
    width: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 24,
    padding: 20,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  statItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  statLabel: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 16,
    fontWeight: "700",
  },
  statValue: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "900",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  goalProgressContainer: {
    marginTop: 8,
  },
  goalProgressBar: {
    height: 12,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 6,
    overflow: "hidden",
    marginBottom: 8,
  },
  goalProgressFill: {
    height: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 6,
    shadowColor: "#fff",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 3,
  },
  goalProgressText: {
    color: "rgba(255, 255, 255, 0.95)",
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },
  goalAchievedText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
    textAlign: "center",
    marginTop: 12,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  sessionBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.4)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    alignItems: "center",
  },
  sessionBadgeText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  dailyPomodorosText: {
    color: "rgba(255, 255, 255, 0.95)",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  timerContainer: {
    width: 300,
    height: 300,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 50,
    position: "relative",
  },
  progressSvg: {
    position: "absolute",
    transform: [{ rotate: "0deg" }],
  },
  timerContent: {
    alignItems: "center",
    zIndex: 10,
  },
  timer: {
    fontSize: 78,
    fontWeight: "900",
    color: "#fff",
    fontFamily: "monospace",
    textShadowColor: "rgba(0, 0, 0, 0.4)",
    textShadowOffset: { width: 0, height: 6 },
    textShadowRadius: 12,
    letterSpacing: 4,
  },
  timerLabel: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.98)",
    marginTop: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 2.5,
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  progressTextContainer: {
    marginTop: 16,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.4)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  progressText: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.95)",
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 40,
    width: "100%",
    justifyContent: "center",
  },
  button: {
    paddingHorizontal: 32,
    paddingVertical: 20,
    borderRadius: 36,
    minWidth: 140,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  buttonInner: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButton: {
    flex: 1,
    borderWidth: 0,
    borderRadius: 36,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 12,
  },
  primaryButtonText: {
    color: "#1a1a1a",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 1,
    textShadowColor: "rgba(255, 255, 255, 0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  secondaryButton: {
    borderWidth: 3,
    borderColor: "rgba(255, 255, 255, 0.9)",
    flex: 1,
    borderRadius: 36,
    overflow: "hidden",
    shadowColor: "#fff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  secondaryButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 1,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  resetButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderWidth: 2.5,
    borderColor: "rgba(255, 255, 255, 0.7)",
    paddingHorizontal: 24,
    minWidth: 120,
    borderRadius: 36,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  resetButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.8,
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  sessionButtonsContainer: {
    width: "100%",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 32,
    padding: 24,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  sessionButtonsTitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.98)",
    marginBottom: 20,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 2,
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  sessionButtons: {
    flexDirection: "row",
    gap: 12,
    flexWrap: "wrap",
    justifyContent: "center",
    width: "100%",
  },
  sessionButton: {
    paddingHorizontal: 0,
    paddingVertical: 0,
    borderRadius: 32,
    borderWidth: 2.5,
    borderColor: "rgba(255, 255, 255, 0.4)",
    minWidth: 115,
    alignItems: "center",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  activeSessionButton: {
    borderColor: "rgba(255, 255, 255, 0.9)",
    borderWidth: 3,
    shadowColor: "#fff",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  sessionButtonGradient: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 32,
    width: "100%",
    alignItems: "center",
  },
  sessionButtonText: {
    color: "rgba(255, 255, 255, 0.95)",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.8,
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  activeSessionButtonText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 16,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  appVersion: {
    marginTop: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 20,
    alignSelf: "center",
  },
  appVersionText: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
});
