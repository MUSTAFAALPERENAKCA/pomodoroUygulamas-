import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  Vibration,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

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

  const getBackgroundColor = () => {
    switch (sessionType) {
      case 'work':
        return '#e74c3c';
      case 'shortBreak':
        return '#3498db';
      case 'longBreak':
        return '#2ecc71';
      default:
        return '#e74c3c';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: getBackgroundColor() }]}>
      <StatusBar style="light" />
      <View style={styles.content}>
        <Text style={styles.title}>{getSessionTitle()}</Text>
        <Text style={styles.timer}>{formatTime(timeLeft)}</Text>
        <Text style={styles.sessionInfo}>
          Tamamlanan Oturum: {sessionCount}
        </Text>

        <View style={styles.buttonContainer}>
          {!isRunning ? (
            <TouchableOpacity style={styles.button} onPress={startTimer}>
              <Text style={styles.buttonText}>Başlat</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.button} onPress={pauseTimer}>
              <Text style={styles.buttonText}>Duraklat</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.button} onPress={resetTimer}>
            <Text style={styles.buttonText}>Sıfırla</Text>
          </TouchableOpacity>
        </View>

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
          >
            <Text style={styles.sessionButtonText}>Çalışma</Text>
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
          >
            <Text style={styles.sessionButtonText}>Kısa Mola</Text>
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
          >
            <Text style={styles.sessionButtonText}>Uzun Mola</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  timer: {
    fontSize: 80,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
    fontFamily: 'monospace',
  },
  sessionInfo: {
    fontSize: 18,
    color: '#fff',
    marginBottom: 40,
    opacity: 0.9,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 40,
  },
  button: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#fff',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  sessionButtons: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  sessionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  activeSessionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderColor: '#fff',
    borderWidth: 2,
  },
  sessionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

