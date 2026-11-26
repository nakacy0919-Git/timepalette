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
    !audioContext || audioContext.state === 'closed'
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


    case 'wrong':
      createTone(context,{frequency:349.23,endFrequency:329.63,duration:0.2,gain:0.018,type:'sine'});
      createTone(context,{frequency:293.66,endFrequency:293.66,start:0.14,duration:0.24,gain:0.014,type:'sine'});
      break;

    case 'journeyReward':
      // Bright arcade fanfare with short metallic coin chimes.
      [523.25,659.25,783.99,1046.5].forEach((f,i)=>{createTone(context,{frequency:f,start:i*.105,duration:.42,gain:.042,type:'triangle',attack:.012});createTone(context,{frequency:f*2,start:i*.105,duration:.18,gain:.012,type:'sine',attack:.006});});
      [523.25,659.25,783.99].forEach(f=>createTone(context,{frequency:f,start:.45,duration:.62,gain:.023,type:'triangle'}));
      [1318.5,1568,2093,1568,2093].forEach((f,i)=>createTone(context,{frequency:f,start:.49+i*.09,duration:.13,gain:.027,attack:.006,type:'sine'}));
      break;
    case 'coin':
      [1046.5,1568,2093].forEach((f,i)=>createTone(context,{frequency:f,start:i*.07,duration:.22,gain:.032,attack:.008,type:'triangle'}));
      break;
    case 'diceRoll':
      [180,245,200,285,240,310,265,340].forEach((f,i)=>createTone(context,{frequency:f,endFrequency:f*.68,start:i*.15,duration:.07,gain:.028,attack:.005,type:'triangle'}));
      break;
    case 'diceReveal':
      [659.25,880,1174.66].forEach((f,i)=>createTone(context,{frequency:f,start:i*.08,duration:.28,gain:.036,type:'triangle',attack:.01}));
      break;
    case 'correct':
      // A short, clear two-note bell for an intermediate correct action.
      createTone(context,{frequency:587.33,start:0,duration:.3,gain:.045,attack:.012});
      createTone(context,{frequency:880,start:.085,duration:.36,gain:.038,attack:.014});
      break;

    case 'powerup':
      // Warm ascending D-major roll, resolving into a sustained chord.
      [146.83,185,220,293.66,369.99,440,587.33,739.99].forEach((frequency,index)=>{
        createTone(context,{frequency,endFrequency:frequency*1.015,start:index*.065,duration:.36,gain:.027,attack:.035,type:'sine'});
      });
      [293.66,369.99,440,587.33].forEach(frequency=>
        createTone(context,{frequency,start:.5,duration:.85,gain:.023,attack:.05,type:'sine'}));
      break;

    case 'success':
      // A smooth D-major bell arpeggio for mission completion.
      [587.33,739.99,880,1174.66].forEach((frequency,index)=>
        createTone(context,{frequency,start:index*.085,duration:.46,gain:index===3?.03:.043,attack:.014}));
      createTone(context,{frequency:293.66,start:0,duration:.58,gain:.018,attack:.018});
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


// Call from a pointer/keyboard gesture so delayed completion animations can
// play on Safari too. Muting remains an explicit, persistent user preference.
export function prepareUiSound(){
  if(!getUiSoundEnabled())return;
  try{
    const context=getAudioContext();
    if(context&&context.state!=='running')context.resume().catch(()=>{});
  }catch{/* Audio availability must never prevent an answer. */}
}

const lastPositiveSound=new Map();
export function playUiSound(sound='tap'){
  if(!getUiSoundEnabled())return;
  try{
    const context=getAudioContext();if(!context)return;
    const play=()=>{
      if(context.state!=='running')return;
      if(sound==='success'||sound==='correct'){
        const now=Date.now(),previous=lastPositiveSound.get(sound);
        if(previous!==undefined&&now-previous<100)return;
        lastPositiveSound.set(sound,now);
      }
      scheduleSound(context,sound);
    };
    if(context.state!=='running')context.resume().then(play).catch(()=>{});
    else play();
  }catch{/* Keep silent when the browser cannot provide audio. */}
}
