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

const WORK_TIME = 25 * 60; // 25 minutes in seconds
const SHORT_BREAK = 5 * 60; // 5 minutes in seconds
const LONG_BREAK = 15 * 60; // 15 minutes in seconds

export default function App() {
  const [timeLeft, setTimeLeft] = useState(WORK_TIME);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionType, setSessionType] = useState("work"); // 'work', 'shortBreak', 'longBreak'
  const [sessionCount, setSessionCount] = useState(0);
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

  const handleTimerComplete = () => {
    Vibration.vibrate([500, 200, 500]);
    Alert.alert(
      "Süre Doldu!",
      sessionType === "work"
        ? "Çalışma süresi tamamlandı. Mola zamanı!"
        : "Mola süresi tamamlandı. Tekrar çalışmaya hazır mısın?",
      [
        {
          text: "Tamam",
          onPress: () => {
            if (sessionType === "work") {
              const nextBreak = sessionCount === 3 ? "longBreak" : "shortBreak";
              setSessionType(nextBreak);
              setTimeLeft(nextBreak === "longBreak" ? LONG_BREAK : SHORT_BREAK);
              if (nextBreak === "longBreak") {
                setSessionCount(0);
              } else {
                setSessionCount((prev) => prev + 1);
              }
            } else {
              setSessionType("work");
              setTimeLeft(WORK_TIME);
            }
            setIsRunning(false);
          },
        },
      ]
    );
  };

  const startTimer = () => {
    setIsRunning(true);
  };

  const pauseTimer = () => {
    setIsRunning(false);
  };

  const resetTimer = () => {
    setIsRunning(false);
    if (sessionType === "work") {
      setTimeLeft(WORK_TIME);
    } else if (sessionType === "shortBreak") {
      setTimeLeft(SHORT_BREAK);
    } else {
      setTimeLeft(LONG_BREAK);
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
    switch (sessionType) {
      case "work":
        return ["#6366f1", "#8b5cf6", "#a855f7", "#ec4899"];
      case "shortBreak":
        return ["#06b6d4", "#3b82f6", "#8b5cf6", "#06b6d4"];
      case "longBreak":
        return ["#f59e0b", "#ef4444", "#ec4899", "#f59e0b"];
      default:
        return ["#6366f1", "#8b5cf6", "#a855f7", "#ec4899"];
    }
  };

  const getProgress = () => {
    let totalTime;
    switch (sessionType) {
      case "work":
        totalTime = WORK_TIME;
        break;
      case "shortBreak":
        totalTime = SHORT_BREAK;
        break;
      case "longBreak":
        totalTime = LONG_BREAK;
        break;
      default:
        totalTime = WORK_TIME;
    }
    return ((totalTime - timeLeft) / totalTime) * 100;
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
          <Text style={styles.title}>{getSessionTitle()}</Text>
          <View style={styles.sessionBadge}>
            <Text style={styles.sessionBadgeText}>
              🎯 {sessionCount} Oturum Tamamlandı
            </Text>
          </View>
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
          <Text style={styles.sessionButtonsTitle}>📋 Oturum Seç</Text>
          <View style={styles.sessionButtons}>
            <TouchableOpacity
              style={[
                styles.sessionButton,
                sessionType === "work" && styles.activeSessionButton,
              ]}
              onPress={() => {
                if (!isRunning) {
                  setSessionType("work");
                  setTimeLeft(WORK_TIME);
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
                  setTimeLeft(SHORT_BREAK);
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
                  setTimeLeft(LONG_BREAK);
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
  title: {
    fontSize: 36,
    fontWeight: "900",
    color: "#fff",
    textAlign: "center",
    marginBottom: 20,
    textShadowColor: "rgba(0, 0, 0, 0.4)",
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 10,
    letterSpacing: 1.5,
  },
  sessionBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.4)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  sessionBadgeText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.8,
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
});
