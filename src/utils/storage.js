import AsyncStorage from "@react-native-async-storage/async-storage";

const SESSIONS_KEY = "@focus_sessions";
const DAILY_GOAL_KEY = "@daily_goal";
const STREAK_KEY = "@streak_data";
const BADGES_KEY = "@badges";

// ============================================
// ODAK SKORU HESAPLAMA
// ============================================
// Algoritma: Başlangıç 100, her dikkat dağınıklığı -10, erken bitiş -15, min 0
export const calculateFocusScore = (distractionCount, completed) => {
  let score = 100;
  
  // Her dikkat dağınıklığı için -10
  score -= distractionCount * 10;
  
  // Seans erken bittiyse -15
  if (!completed) {
    score -= 15;
  }
  
  // Minimum 0
  return Math.max(0, score);
};

// ============================================
// SEANS YÖNETİMİ
// ============================================
// Seans kaydet (otomatik odak skoru hesaplama ile)
export const saveSession = async (session) => {
  try {
    const existingSessions = await getSessions();
    
    // Odak skorunu hesapla
    const focusScore = calculateFocusScore(
      session.distractionCount || 0,
      session.completed || false
    );
    
    const newSession = {
      id: Date.now().toString(),
      ...session,
      focusScore,
      date: new Date().toISOString(),
    };
    
    const updatedSessions = [newSession, ...existingSessions];
    await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(updatedSessions));
    
    // Streak'i güncelle
    await updateStreak();
    
    // Rozetleri kontrol et ve kilidi aç
    await checkAndUnlockBadges();
    
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
    await AsyncStorage.removeItem(STREAK_KEY);
    await AsyncStorage.removeItem(BADGES_KEY);
  } catch (error) {
    console.error("Veriler silinemedi:", error);
  }
};

// ============================================
// GÜNLÜK HEDEF
// ============================================
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

// ============================================
// STREAK (ARDIŞ IK GÜN) SİSTEMİ
// ============================================
// Streak verisi getir
export const getStreak = async () => {
  try {
    const streakData = await AsyncStorage.getItem(STREAK_KEY);
    if (streakData) {
      return JSON.parse(streakData);
    }
    return { current: 0, lastDate: null, best: 0 };
  } catch (error) {
    console.error("Streak getirilemedi:", error);
    return { current: 0, lastDate: null, best: 0 };
  }
};

// Streak'i güncelle (her seans kaydında çağrılır)
export const updateStreak = async () => {
  try {
    const dailyGoal = await getDailyGoal();
    const todaySessions = await getTodaySessions();
    const todayTotal = todaySessions.reduce(
      (sum, session) => sum + Math.floor(session.duration / 60),
      0
    );
    
    const streakData = await getStreak();
    const today = new Date().toDateString();
    
    // Bugün hedef tamamlandı mı?
    if (todayTotal >= dailyGoal) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayString = yesterday.toDateString();
      
      // Eğer dün de streak vardıysa devam ettir
      if (streakData.lastDate === yesterdayString || streakData.lastDate === today) {
        streakData.current = streakData.lastDate === today ? streakData.current : streakData.current + 1;
      } else if (streakData.lastDate === null) {
        // İlk streak
        streakData.current = 1;
      } else {
        // Streak kırıldı, yeniden başla
        streakData.current = 1;
      }
      
      streakData.lastDate = today;
      streakData.best = Math.max(streakData.best, streakData.current);
      
      await AsyncStorage.setItem(STREAK_KEY, JSON.stringify(streakData));
    }
    
    return streakData;
  } catch (error) {
    console.error("Streak güncellenemedi:", error);
    return { current: 0, lastDate: null, best: 0 };
  }
};

// ============================================
// ROZET SİSTEMİ
// ============================================
// Mevcut rozetler tanımı
const BADGE_DEFINITIONS = [
  {
    id: "first_5_sessions",
    name: "İlk Adım",
    description: "İlk 5 seansını tamamla",
    emoji: "🎯",
    requirement: "sessions",
    target: 5,
  },
  {
    id: "streak_3_days",
    name: "Kararlı",
    description: "3 gün üst üste hedefine ulaş",
    emoji: "🔥",
    requirement: "streak",
    target: 3,
  },
  {
    id: "perfect_focus",
    name: "Mükemmel Odak",
    description: "0 dikkat dağınıklığı ile bir seans tamamla",
    emoji: "💎",
    requirement: "zero_distraction",
    target: 1,
  },
];

// Rozetleri getir
export const getBadges = async () => {
  try {
    const badgesData = await AsyncStorage.getItem(BADGES_KEY);
    if (badgesData) {
      return JSON.parse(badgesData);
    }
    
    // İlk kez, tüm rozetleri kilitli olarak oluştur
    const initialBadges = BADGE_DEFINITIONS.map((badge) => ({
      ...badge,
      unlocked: false,
      unlockedDate: null,
      progress: 0,
    }));
    
    await AsyncStorage.setItem(BADGES_KEY, JSON.stringify(initialBadges));
    return initialBadges;
  } catch (error) {
    console.error("Rozetler getirilemedi:", error);
    return [];
  }
};

// Rozet kilidini aç
export const unlockBadge = async (badgeId) => {
  try {
    const badges = await getBadges();
    const badgeIndex = badges.findIndex((b) => b.id === badgeId);
    
    if (badgeIndex !== -1 && !badges[badgeIndex].unlocked) {
      badges[badgeIndex].unlocked = true;
      badges[badgeIndex].unlockedDate = new Date().toISOString();
      await AsyncStorage.setItem(BADGES_KEY, JSON.stringify(badges));
      return badges[badgeIndex];
    }
    
    return null;
  } catch (error) {
    console.error("Rozet kilidi açılamadı:", error);
    return null;
  }
};

// Rozetleri kontrol et ve otomatik kilidi aç
export const checkAndUnlockBadges = async () => {
  try {
    const badges = await getBadges();
    const sessions = await getSessions();
    const streakData = await getStreak();
    const newlyUnlocked = [];
    
    // İlk 5 seans rozeti
    const first5Badge = badges.find((b) => b.id === "first_5_sessions");
    if (first5Badge && !first5Badge.unlocked && sessions.length >= 5) {
      const unlocked = await unlockBadge("first_5_sessions");
      if (unlocked) newlyUnlocked.push(unlocked);
    }
    
    // 3 gün streak rozeti
    const streak3Badge = badges.find((b) => b.id === "streak_3_days");
    if (streak3Badge && !streak3Badge.unlocked && streakData.current >= 3) {
      const unlocked = await unlockBadge("streak_3_days");
      if (unlocked) newlyUnlocked.push(unlocked);
    }
    
    // 0 dikkat dağınıklığı rozeti
    const perfectBadge = badges.find((b) => b.id === "perfect_focus");
    const hasPerfectSession = sessions.some(
      (s) => s.distractionCount === 0 && s.completed
    );
    if (perfectBadge && !perfectBadge.unlocked && hasPerfectSession) {
      const unlocked = await unlockBadge("perfect_focus");
      if (unlocked) newlyUnlocked.push(unlocked);
    }
    
    // Progress güncelle
    const updatedBadges = await getBadges();
    updatedBadges.forEach((badge) => {
      if (badge.id === "first_5_sessions") {
        badge.progress = Math.min(sessions.length, badge.target);
      } else if (badge.id === "streak_3_days") {
        badge.progress = Math.min(streakData.current, badge.target);
      } else if (badge.id === "perfect_focus") {
        badge.progress = hasPerfectSession ? 1 : 0;
      }
    });
    await AsyncStorage.setItem(BADGES_KEY, JSON.stringify(updatedBadges));
    
    return newlyUnlocked;
  } catch (error) {
    console.error("Rozetler kontrol edilemedi:", error);
    return [];
  }
};

// ============================================
// VERİMLİ SAAT ANALİZİ
// ============================================
// En verimli saati bul (en az dikkat dağınıklığı olan saat)
export const getMostProductiveHour = async () => {
  try {
    const sessions = await getSessions();
    
    if (sessions.length === 0) {
      return null;
    }
    
    // Saatlere göre grupla
    const hourlyData = {};
    
    sessions.forEach((session) => {
      const sessionDate = new Date(session.date);
      const hour = sessionDate.getHours();
      
      if (!hourlyData[hour]) {
        hourlyData[hour] = {
          totalSessions: 0,
          totalDistractions: 0,
          totalDuration: 0,
        };
      }
      
      hourlyData[hour].totalSessions += 1;
      hourlyData[hour].totalDistractions += session.distractionCount || 0;
      hourlyData[hour].totalDuration += session.duration || 0;
    });
    
    // En az ortalama dikkat dağınıklığı olan saati bul
    let bestHour = null;
    let lowestAvgDistraction = Infinity;
    
    Object.keys(hourlyData).forEach((hour) => {
      const data = hourlyData[hour];
      const avgDistraction = data.totalDistractions / data.totalSessions;
      
      // En az 3 seans olmalı (güvenilir veri için)
      if (data.totalSessions >= 3 && avgDistraction < lowestAvgDistraction) {
        lowestAvgDistraction = avgDistraction;
        bestHour = parseInt(hour);
      }
    });
    
    if (bestHour !== null) {
      const endHour = (bestHour + 2) % 24; // 2 saatlik aralık
      return {
        startHour: bestHour,
        endHour: endHour,
        avgDistraction: lowestAvgDistraction.toFixed(1),
        sessionCount: hourlyData[bestHour].totalSessions,
      };
    }
    
    return null;
  } catch (error) {
    console.error("En verimli saat hesaplanamadı:", error);
    return null;
  }
};
