const SOUND_STORAGE_KEY =
  'timepalette_ui_sound_v1';

let audioContext = null;


function getAudioContext() {
  if (
    typeof window ===
    'undefined'
  ) {
    return null;
  }

  const AudioContextClass =
    window.AudioContext ||
    window.webkitAudioContext;

  if (
    !AudioContextClass
  ) {
    return null;
  }

  if (
    !audioContext
  ) {
    audioContext =
      new AudioContextClass();
  }

  return audioContext;
}


export function getUiSoundEnabled() {
  if (
    typeof window ===
    'undefined'
  ) {
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
  if (
    typeof window ===
    'undefined'
  ) {
    return;
  }

  try {
    window.localStorage.setItem(
      SOUND_STORAGE_KEY,
      enabled
        ? 'on'
        : 'off'
    );
  } catch {
    // Storageが使えない場合は無視
  }
}


function createTone(
  context,
  {
    start = 0,
    frequency = 440,
    endFrequency =
      frequency,
    duration = 0.12,
    gain = 0.012,
    type = 'sine',
    attack = 0.02,
  }
) {
  const now =
    context.currentTime +
    start;

  const oscillator =
    context.createOscillator();

  const gainNode =
    context.createGain();


  oscillator.type =
    type;


  oscillator.frequency
    .setValueAtTime(
      frequency,
      now
    );


  oscillator.frequency
    .exponentialRampToValueAtTime(
      Math.max(
        endFrequency,
        1
      ),
      now +
        duration
    );


  gainNode.gain
    .setValueAtTime(
      0.0001,
      now
    );


  gainNode.gain
    .exponentialRampToValueAtTime(
      gain,
      now +
        attack
    );


  gainNode.gain
    .exponentialRampToValueAtTime(
      0.0001,
      now +
        duration
    );


  oscillator.connect(
    gainNode
  );


  gainNode.connect(
    context.destination
  );


  oscillator.start(
    now
  );


  oscillator.stop(
    now +
      duration +
      0.03
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
          frequency:
            390,

          endFrequency:
            520,

          duration:
            0.08,

          gain:
            0.016,

          type:
            'sine',
        }
      );


      createTone(
        context,
        {
          start:
            0.045,

          frequency:
            520,

          endFrequency:
            620,

          duration:
            0.1,

          gain:
            0.011,

          type:
            'triangle',
        }
      );

      break;


    case 'back':

      createTone(
        context,
        {
          frequency:
            480,

          endFrequency:
            370,

          duration:
            0.09,

          gain:
            0.012,

          type:
            'sine',
        }
      );

      break;


    case 'success':

      /*
       * D major系の柔らかいチャイム。
       * 高音を抑えて、
       * 「ゲームの正解音」より
       * 心地よい通知音に寄せる。
       */

      createTone(
        context,
        {
          frequency:
            293.66,

          endFrequency:
            293.66,

          duration:
            0.22,

          gain:
            0.012,

          type:
            'sine',

          attack:
            0.028,
        }
      );


      createTone(
        context,
        {
          start:
            0.075,

          frequency:
            369.99,

          endFrequency:
            369.99,

          duration:
            0.24,

          gain:
            0.011,

          type:
            'sine',

          attack:
            0.03,
        }
      );


      createTone(
        context,
        {
          start:
            0.15,

          frequency:
            440,

          endFrequency:
            440,

          duration:
            0.3,

          gain:
            0.011,

          type:
            'triangle',

          attack:
            0.035,
        }
      );

      break;


    case 'tap':
    default:

      createTone(
        context,
        {
          frequency:
            470,

          endFrequency:
            530,

          duration:
            0.05,

          gain:
            0.008,

          type:
            'sine',
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

    return;
  }


  scheduleSound(
    context,
    sound
  );
}