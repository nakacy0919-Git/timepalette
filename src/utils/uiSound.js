const SOUND_STORAGE_KEY =
  'timepalette_ui_sound_v1';

let audioContext = null;

function getAudioContext() {
  if (typeof window === 'undefined') {
    return null;
  }

  const AudioContextClass =
    window.AudioContext ||
    window.webkitAudioContext;

  if (!AudioContextClass) {
    return null;
  }

  if (!audioContext) {
    audioContext =
      new AudioContextClass();
  }

  return audioContext;
}

export function getUiSoundEnabled() {
  if (typeof window === 'undefined') {
    return true;
  }

  try {
    return (
      window.localStorage.getItem(
        SOUND_STORAGE_KEY
      ) !== 'off'
    );
  } catch {
    return true;
  }
}

export function setUiSoundEnabled(
  enabled
) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(
      SOUND_STORAGE_KEY,
      enabled ? 'on' : 'off'
    );
  } catch {
    // Ignore storage errors.
  }
}

function createTone(
  context,
  {
    start = 0,
    frequency = 520,
    endFrequency = frequency,
    duration = 0.05,
    gain = 0.02,
    type = 'sine',
  }
) {
  const now =
    context.currentTime +
    start;

  const oscillator =
    context.createOscillator();

  const gainNode =
    context.createGain();

  oscillator.type = type;

  oscillator.frequency.setValueAtTime(
    frequency,
    now
  );

  oscillator.frequency.exponentialRampToValueAtTime(
    Math.max(
      endFrequency,
      1
    ),
    now + duration
  );

  gainNode.gain.setValueAtTime(
    0.0001,
    now
  );

  gainNode.gain.exponentialRampToValueAtTime(
    gain,
    now + 0.008
  );

  gainNode.gain.exponentialRampToValueAtTime(
    0.0001,
    now + duration
  );

  oscillator.connect(
    gainNode
  );

  gainNode.connect(
    context.destination
  );

  oscillator.start(now);

  oscillator.stop(
    now +
      duration +
      0.02
  );
}

function scheduleSound(
  context,
  sound
) {
  switch (sound) {
    case 'open':
      createTone(
        context,
        {
          frequency: 420,
          endFrequency: 620,
          duration: 0.07,
          gain: 0.022,
          type: 'sine',
        }
      );

      createTone(
        context,
        {
          start: 0.045,
          frequency: 620,
          endFrequency: 820,
          duration: 0.08,
          gain: 0.015,
          type: 'triangle',
        }
      );
      break;

    case 'back':
      createTone(
        context,
        {
          frequency: 560,
          endFrequency: 410,
          duration: 0.075,
          gain: 0.016,
          type: 'sine',
        }
      );
      break;

    case 'success':
      createTone(
        context,
        {
          frequency: 523,
          endFrequency: 523,
          duration: 0.08,
          gain: 0.018,
        }
      );

      createTone(
        context,
        {
          start: 0.06,
          frequency: 659,
          endFrequency: 659,
          duration: 0.09,
          gain: 0.018,
        }
      );

      createTone(
        context,
        {
          start: 0.12,
          frequency: 784,
          endFrequency: 784,
          duration: 0.11,
          gain: 0.02,
        }
      );
      break;

    case 'tap':
    default:
      createTone(
        context,
        {
          frequency: 520,
          endFrequency: 610,
          duration: 0.045,
          gain: 0.012,
          type: 'sine',
        }
      );
      break;
  }
}

export function playUiSound(
  sound = 'tap'
) {
  if (
    !getUiSoundEnabled()
  ) {
    return;
  }

  const context =
    getAudioContext();

  if (!context) {
    return;
  }

  if (
    context.state ===
    'suspended'
  ) {
    context
      .resume()
      .then(() => {
        scheduleSound(
          context,
          sound
        );
      })
      .catch(() => {});
  } else {
    scheduleSound(
      context,
      sound
    );
  }
}