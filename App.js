import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  Vibration,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';

const WORK_TIME = 25 * 60; // 25 minutes in seconds
const SHORT_BREAK = 5 * 60; // 5 minutes in seconds
const LONG_BREAK = 15 * 60; // 15 minutes in seconds

export default function App() {
  const [timeLeft, setTimeLeft] = useState(WORK_TIME);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionType, setSessionType] = useState('work'); // 'work', 'shortBreak', 'longBreak'
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
      'Süre Doldu!',
      sessionType === 'work'
        ? 'Çalışma süresi tamamlandı. Mola zamanı!'
        : 'Mola süresi tamamlandı. Tekrar çalışmaya hazır mısın?',
      [
        {
          text: 'Tamam',
          onPress: () => {
            if (sessionType === 'work') {
              const nextBreak = sessionCount === 3 ? 'longBreak' : 'shortBreak';
              setSessionType(nextBreak);
              setTimeLeft(nextBreak === 'longBreak' ? LONG_BREAK : SHORT_BREAK);
              if (nextBreak === 'longBreak') {
                setSessionCount(0);
              } else {
                setSessionCount((prev) => prev + 1);
              }
            } else {
              setSessionType('work');
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
    if (sessionType === 'work') {
      setTimeLeft(WORK_TIME);
    } else if (sessionType === 'shortBreak') {
      setTimeLeft(SHORT_BREAK);
    } else {
      setTimeLeft(LONG_BREAK);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getSessionTitle = () => {
    switch (sessionType) {
      case 'work':
        return 'Çalışma Zamanı';
      case 'shortBreak':
        return 'Kısa Mola';
      case 'longBreak':
        return 'Uzun Mola';
      default:
        return 'Pomodoro';
    }
  };

  const getGradientColors = () => {
    switch (sessionType) {
      case 'work':
        return ['#ff6b6b', '#ee5a6f', '#c44569'];
      case 'shortBreak':
        return ['#4ecdc4', '#44a3a3', '#2d8a82'];
      case 'longBreak':
        return ['#95e1d3', '#6bcf9f', '#4ecdc4'];
      default:
        return ['#ff6b6b', '#ee5a6f', '#c44569'];
    }
  };

  const getProgress = () => {
    let totalTime;
    switch (sessionType) {
      case 'work':
        totalTime = WORK_TIME;
        break;
      case 'shortBreak':
        totalTime = SHORT_BREAK;
        break;
      case 'longBreak':
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
    >
      <StatusBar style="light" />
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>{getSessionTitle()}</Text>
          <View style={styles.sessionBadge}>
            <Text style={styles.sessionBadgeText}>
              {sessionCount} Oturum
            </Text>
          </View>
        </View>

        <View style={styles.timerContainer}>
          <View style={styles.progressRing}>
            <View
              style={[
                styles.progressFill,
                {
                  height: `${progress}%`,
                },
              ]}
            />
          </View>
          <View style={styles.timerContent}>
            <Text style={styles.timer}>{formatTime(timeLeft)}</Text>
            <Text style={styles.timerLabel}>Kalan Süre</Text>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          {!isRunning ? (
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={startTimer}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>▶ Başlat</Text>
            </TouchableOpacity>
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
                sessionType === 'work' && styles.activeSessionButton,
              ]}
              onPress={() => {
                if (!isRunning) {
                  setSessionType('work');
                  setTimeLeft(WORK_TIME);
                }
              }}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.sessionButtonText,
                  sessionType === 'work' && styles.activeSessionButtonText,
                ]}
              >
                ⚡ Çalışma
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.sessionButton,
                sessionType === 'shortBreak' && styles.activeSessionButton,
              ]}
              onPress={() => {
                if (!isRunning) {
                  setSessionType('shortBreak');
                  setTimeLeft(SHORT_BREAK);
                }
              }}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.sessionButtonText,
                  sessionType === 'shortBreak' && styles.activeSessionButtonText,
                ]}
              >
                ☕ Kısa Mola
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.sessionButton,
                sessionType === 'longBreak' && styles.activeSessionButton,
              ]}
              onPress={() => {
                if (!isRunning) {
                  setSessionType('longBreak');
                  setTimeLeft(LONG_BREAK);
                }
              }}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.sessionButtonText,
                  sessionType === 'longBreak' && styles.activeSessionButtonText,
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

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    width: '100%',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    letterSpacing: 0.5,
  },
  sessionBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  sessionBadgeText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  timerContainer: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 50,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  progressRing: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  progressFill: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderTopLeftRadius: 110,
    borderTopRightRadius: 110,
  },
  timerContent: {
    alignItems: 'center',
    zIndex: 1,
  },
  timer: {
    fontSize: 64,
    fontWeight: '700',
    color: '#fff',
    fontFamily: 'monospace',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    letterSpacing: 2,
  },
  timerLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 4,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 40,
    width: '100%',
    justifyContent: 'center',
  },
  button: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 30,
    minWidth: 120,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  primaryButton: {
    backgroundColor: '#fff',
    flex: 1,
  },
  primaryButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  secondaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 2,
    borderColor: '#fff',
    flex: 1,
  },
  secondaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  resetButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    paddingHorizontal: 24,
    minWidth: 100,
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  sessionButtonsContainer: {
    width: '100%',
    alignItems: 'center',
  },
  sessionButtonsTitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 16,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sessionButtons: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: '100%',
  },
  sessionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    minWidth: 100,
    alignItems: 'center',
  },
  activeSessionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    borderColor: '#fff',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  sessionButtonText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 13,
    fontWeight: '600',
  },
  activeSessionButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
});

