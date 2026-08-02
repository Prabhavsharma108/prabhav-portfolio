/**
 * Simple Global Audio Manager for background music
 */

let bgMusicAudio = null;
let isMuted = false;
let bgMusicStarted = false;

// Initialize background music
export const initAudio = () => {
    if (typeof window === 'undefined') return;

    // Sync muted state from localStorage (same key as AudioManager context)
    const savedMuted = localStorage.getItem('audio_muted');
    isMuted = savedMuted === 'true';

    if (!bgMusicAudio) {
        bgMusicAudio = new Audio('/sounds/amb-bed.mp3');
        // 'metadata' rather than 'auto': this runs on the first user gesture,
        // so the track only needs to start streaming, not arrive whole. The
        // bandwidth belongs to the 3D scene until it's actually asked for.
        bgMusicAudio.preload = 'metadata';
        bgMusicAudio.loop = true;
        bgMusicAudio.volume = 0.3;
        bgMusicAudio.muted = isMuted;
    }
};

export const playBackgroundMusic = () => {
    initAudio();
    bgMusicStarted = true;
    if (bgMusicAudio && bgMusicAudio.paused) {
        // Only play if not muted and it's currently paused
        bgMusicAudio.play().catch((err) => {
            console.warn('Audio play failed/blocked by browser:', err);
        });
    }
};

export const pauseBackgroundMusic = () => {
    if (bgMusicAudio && !bgMusicAudio.paused) {
        bgMusicAudio.pause();
    }
};

export const toggleMute = () => {
    isMuted = !isMuted;
    if (bgMusicAudio) {
        bgMusicAudio.muted = isMuted;
    }
    return isMuted;
};

export const getIsMuted = () => isMuted;

export const setMusicVolume = (vol) => {
    if (bgMusicAudio) {
        bgMusicAudio.volume = Math.max(0, Math.min(1, vol));
        // Auto-unmute if user drags slider up
        if (vol > 0 && isMuted) {
            isMuted = false;
            bgMusicAudio.muted = false;
        }

        // Ensure playback continues if we unmute, ONLY if the music has actually been requested to start
        if (vol > 0 && bgMusicAudio.paused && bgMusicStarted) {
            bgMusicAudio.play().catch(e => console.warn(e));
        }
    }
    // Dispatch event so UI sliders can stay in sync if changed programmatically
    window.dispatchEvent(new CustomEvent('musicVolumeChanged', { detail: vol }));
};

export const getMusicVolume = () => {
    return bgMusicAudio ? bgMusicAudio.volume : 0.3;
};
