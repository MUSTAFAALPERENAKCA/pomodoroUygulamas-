import AsyncStorage from "@react-native-async-storage/async-storage";

const SESSIONS_KEY = "@focus_sessions";
const DAILY_GOAL_KEY = "@daily_goal";

// Seans kaydet
export const saveSession = async (session) => {
  try {
    const existingSessions = await getSessions();
    const newSession = {
      id: Date.now().toString(),
      ...session,
      date: new Date().toISOString(),
    };
    const updatedSessions = [newSession, ...existingSessions];
    await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(updatedSessions));
    return newSession;
  } catch (error) {
    console.error("Seans kaydedilemedi:", error);
    throw error;
  }
};

// Tüm seansları getir
export const getSessions = async () => {
  try {
    const sessions = await AsyncStorage.getItem(SESSIONS_KEY);
    return sessions ? JSON.parse(sessions) : [];
  } catch (error) {
    console.error("Seanslar getirilemedi:", error);
    return [];
  }
};

// Bugünkü seansları getir
export const getTodaySessions = async () => {
  try {
    const sessions = await getSessions();
    const today = new Date().toDateString();
    return sessions.filter((session) => {
      const sessionDate = new Date(session.date).toDateString();
      return sessionDate === today;
    });
  } catch (error) {
    console.error("Bugünkü seanslar getirilemedi:", error);
    return [];
  }
};

// Son 7 günün seanslarını getir
export const getLastWeekSessions = async () => {
  try {
    const sessions = await getSessions();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    return sessions.filter((session) => {
      const sessionDate = new Date(session.date);
      return sessionDate >= sevenDaysAgo;
    });
  } catch (error) {
    console.error("Son 7 günün seansları getirilemedi:", error);
    return [];
  }
};

// Tüm verileri sil (test için)
export const clearAllSessions = async () => {
  try {
    await AsyncStorage.removeItem(SESSIONS_KEY);
  } catch (error) {
    console.error("Veriler silinemedi:", error);
  }
};

// Günlük hedef kaydet (dakika cinsinden)
export const saveDailyGoal = async (minutes) => {
  try {
    await AsyncStorage.setItem(DAILY_GOAL_KEY, minutes.toString());
  } catch (error) {
    console.error("Günlük hedef kaydedilemedi:", error);
  }
};

// Günlük hedef getir
export const getDailyGoal = async () => {
  try {
    const goal = await AsyncStorage.getItem(DAILY_GOAL_KEY);
    return goal ? parseInt(goal, 10) : 120; // Varsayılan 120 dakika (2 saat)
  } catch (error) {
    console.error("Günlük hedef getirilemedi:", error);
    return 120;
  }
};
