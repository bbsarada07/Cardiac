import { createAudioPlayer, setAudioModeAsync, AudioPlayer } from 'expo-audio';

class AudioService {
  private sounds: { [key: string]: AudioPlayer | null } = {
    critical: null,
    caution: null,
    normal: null,
  };

  /**
   * Pre-loads the sound assets for zero-latency playback using expo-audio.
   * Note: Expects critical.mp3, caution.mp3, and normal.mp3 in assets/sounds/
   */
  async loadSounds() {
    try {
      // Configure audio mode for high-priority clinical alerts
      // expo-audio uses setAudioModeAsync as a top-level export
      await setAudioModeAsync({
        playsInSilentMode: true,
        shouldPlayInBackground: true,
        interruptionMode: 'duckOthers',
      });

      // NOTE: static require() calls must be resolvable at build time.
      // We comment these out until the user provides the actual MP3 files to avoid Metro errors.
      /*
      try {
        this.sounds.critical = createAudioPlayer(require('../../assets/sounds/critical.mp3'));
      } catch (e) { console.warn("AudioService: critical.mp3 not found"); }

      try {
        this.sounds.caution = createAudioPlayer(require('../../assets/sounds/caution.mp3'));
      } catch (e) { console.warn("AudioService: caution.mp3 not found"); }

      try {
        this.sounds.normal = createAudioPlayer(require('../../assets/sounds/normal.mp3'));
      } catch (e) { console.warn("AudioService: normal.mp3 not found"); }
      */
      
    } catch (error) {
      console.error("AudioService initialization error:", error);
    }
  }

  async playCritical() {
    if (this.sounds.critical) {
      this.stopAll();
      (this.sounds.critical as any).looping = true;
      this.sounds.critical.seekTo(0);
      this.sounds.critical.play();
    }
  }

  async playCaution() {
    if (this.sounds.caution) {
      this.sounds.caution.seekTo(0);
      this.sounds.caution.play();
    }
  }

  async playNormal() {
    if (this.sounds.normal) {
      this.sounds.normal.seekTo(0);
      this.sounds.normal.play();
    }
  }

  stopAll() {
    try {
      if (this.sounds.critical) this.sounds.critical.pause();
      if (this.sounds.caution) this.sounds.caution.pause();
      if (this.sounds.normal) this.sounds.normal.pause();
    } catch (e) {
      // Ignore
    }
  }
}

export default new AudioService();
