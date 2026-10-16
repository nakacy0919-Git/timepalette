import TimeMissionGame
  from '../TimeMissionGame';

import TimeZoneExpressMission
  from './TimeZoneExpressMission';

import WorldLifeDetectiveMission
  from './WorldLifeDetectiveMission';


export default function TimeMissionRouter({
  mission,
  onComplete,
  alreadyCompleted,
}) {
  if (
    mission?.type ===
    'time-zone-express'
  ) {
    return (
      <TimeZoneExpressMission
        mission={mission}
        onComplete={onComplete}
        alreadyCompleted={alreadyCompleted}
      />
    );
  }


  if (
    mission?.type ===
    'world-life-detective'
  ) {
    return (
      <WorldLifeDetectiveMission
        mission={mission}
        onComplete={onComplete}
        alreadyCompleted={alreadyCompleted}
      />
    );
  }


  return (
    <TimeMissionGame
      mission={mission}
      onComplete={onComplete}
      alreadyCompleted={alreadyCompleted}
    />
  );
}