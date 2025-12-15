import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

export default function BadgeCard({ badge, onPress }) {
  const { emoji, name, description, unlocked, progress, target } = badge;

  return (
    <TouchableOpacity
      style={[styles.container, unlocked && styles.containerUnlocked]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!unlocked}
    >
      <View style={styles.emojiContainer}>
        <Text style={[styles.emoji, !unlocked && styles.emojiLocked]}>
          {unlocked ? emoji : "🔒"}
        </Text>
      </View>
      
      <View style={styles.content}>
        <Text style={[styles.name, unlocked && styles.nameUnlocked]}>
          {name}
        </Text>
        <Text style={styles.description}>{description}</Text>
        
        {!unlocked && progress !== undefined && target !== undefined && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${(progress / target) * 100}%` },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {progress}/{target}
            </Text>
          </View>
        )}
        
        {unlocked && (
          <Text style={styles.unlockedText}>✅ Kilidi Açıldı!</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(100, 116, 139, 0.3)",
  },
  containerUnlocked: {
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    borderColor: "rgba(59, 130, 246, 0.5)",
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  emojiContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  emoji: {
    fontSize: 32,
  },
  emojiLocked: {
    opacity: 0.4,
  },
  content: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#94a3b8",
    marginBottom: 4,
  },
  nameUnlocked: {
    color: "#fff",
  },
  description: {
    fontSize: 13,
    color: "#64748b",
    marginBottom: 8,
  },
  progressContainer: {
    marginTop: 4,
  },
  progressBar: {
    height: 6,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 4,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#3b82f6",
    borderRadius: 3,
  },
  progressText: {
    fontSize: 11,
    color: "#64748b",
    fontWeight: "600",
  },
  unlockedText: {
    fontSize: 12,
    color: "#10b981",
    fontWeight: "bold",
    marginTop: 4,
  },
});
