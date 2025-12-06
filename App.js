import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  Vibration,
  Dimensions,
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
        return ["#667eea", "#764ba2", "#f093fb"];
      case "shortBreak":
        return ["#4facfe", "#00f2fe", "#43e97b"];
      case "longBreak":
        return ["#fa709a", "#fee140", "#30cfd0"];
      default:
        return ["#667eea", "#764ba2", "#f093fb"];
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

  return (
    <LinearGradient
      colors={gradientColors}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      locations={[0, 0.5, 1]}
    >
      <StatusBar style="light" />
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>{getSessionTitle()}</Text>
          <View style={styles.sessionBadge}>
            <Text style={styles.sessionBadgeText}>{sessionCount} Oturum</Text>
          </View>
        </View>

        <View style={styles.timerContainer}>
          <Svg width={280} height={280} style={styles.progressSvg}>
            {/* Background Circle */}
            <Circle
              cx={140}
              cy={140}
              r={130}
              stroke="rgba(255, 255, 255, 0.2)"
              strokeWidth={8}
              fill="transparent"
            />
            {/* Progress Circle */}
            <Circle
              cx={140}
              cy={140}
              r={130}
              stroke="rgba(255, 255, 255, 0.9)"
              strokeWidth={8}
              fill="transparent"
              strokeDasharray={`${2 * Math.PI * 130}`}
              strokeDashoffset={`${2 * Math.PI * 130 * (1 - progress / 100)}`}
              strokeLinecap="round"
              transform={`rotate(-90 140 140)`}
            />
          </Svg>
          <View style={styles.timerContent}>
            <Text style={styles.timer}>{formatTime(timeLeft)}</Text>
            <Text style={styles.timerLabel}>Kalan Süre</Text>
            <View style={styles.progressTextContainer}>
              <Text style={styles.progressText}>{Math.round(progress)}%</Text>
            </View>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          {!isRunning ? (
            <LinearGradient
              colors={["#fff", "#f5f5f5"]}
              style={[styles.button, styles.primaryButton]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <TouchableOpacity
                onPress={startTimer}
                activeOpacity={0.85}
                style={styles.buttonInner}
              >
                <Text style={styles.primaryButtonText}>▶ Başlat</Text>
              </TouchableOpacity>
            </LinearGradient>
          ) : (
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={pauseTimer}
              activeOpacity={0.8}
            >
              <Text style={styles.secondaryButtonText}>⏸ Duraklat</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.button, styles.resetButton]}
            onPress={resetTimer}
            activeOpacity={0.8}
          >
            <Text style={styles.resetButtonText}>↻ Sıfırla</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sessionButtonsContainer}>
          <Text style={styles.sessionButtonsTitle}>Oturum Seç</Text>
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
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.sessionButtonText,
                  sessionType === "work" && styles.activeSessionButtonText,
                ]}
              >
                ⚡ Çalışma
              </Text>
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
              activeOpacity={0.7}
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
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.sessionButtonText,
                  sessionType === "longBreak" && styles.activeSessionButtonText,
                ]}
              >
                🌴 Uzun Mola
              </Text>
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
    marginBottom: 48,
    width: "100%",
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#fff",
    textAlign: "center",
    marginBottom: 16,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 6,
    letterSpacing: 1,
  },
  sessionBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.5)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  sessionBadgeText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  timerContainer: {
    width: 280,
    height: 280,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 56,
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
    fontSize: 72,
    fontWeight: "800",
    color: "#fff",
    fontFamily: "monospace",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 8,
    letterSpacing: 3,
  },
  timerLabel: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.95)",
    marginTop: 8,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  progressTextContainer: {
    marginTop: 12,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  progressText: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.9)",
    fontWeight: "700",
    letterSpacing: 1,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 14,
    marginBottom: 48,
    width: "100%",
    justifyContent: "center",
  },
  button: {
    paddingHorizontal: 36,
    paddingVertical: 18,
    borderRadius: 32,
    minWidth: 130,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonInner: {
    width: "100%",
    alignItems: "center",
    paddingVertical: 18,
  },
  primaryButton: {
    flex: 1,
    borderWidth: 0,
    borderRadius: 32,
    overflow: "hidden",
  },
  primaryButtonText: {
    color: "#333",
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  secondaryButton: {
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    borderWidth: 2.5,
    borderColor: "#fff",
    flex: 1,
  },
  secondaryButtonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  resetButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.6)",
    paddingHorizontal: 28,
    minWidth: 110,
  },
  resetButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  sessionButtonsContainer: {
    width: "100%",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 24,
    padding: 20,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.2)",
    backdropFilter: "blur(10px)",
  },
  sessionButtonsTitle: {
    fontSize: 15,
    color: "rgba(255, 255, 255, 0.95)",
    marginBottom: 18,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  sessionButtons: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
    justifyContent: "center",
    width: "100%",
  },
  sessionButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.35)",
    minWidth: 110,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  activeSessionButton: {
    backgroundColor: "rgba(255, 255, 255, 0.4)",
    borderColor: "#fff",
    borderWidth: 2.5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  sessionButtonText: {
    color: "rgba(255, 255, 255, 0.95)",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  activeSessionButtonText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 15,
  },
});
