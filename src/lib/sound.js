export const playNotificationSound = (soundPath = "/sounds/notification-1.wav") => {
  try {
    console.log(`🔔 Playing sound: ${soundPath}`);
    const audio = new Audio(soundPath);
    audio.play().catch((error) => {
      console.warn("Audio playback failed:", error);
    });
  } catch (error) {
    console.error("Error initializing audio:", error);
  }
};
