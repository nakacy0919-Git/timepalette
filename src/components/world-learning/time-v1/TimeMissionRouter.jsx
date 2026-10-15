import TimeMissionGame
  from '../TimeMissionGame';

import TimeZoneExpressMission
  from './TimeZoneExpressMission';

import WorldLifeDetectiveMission
  from './WorldLifeDetectiveMission';

import {
  ClockTowerRescueMission,
  PhotoTimeDetectiveMission,
  SoundTimeDetectiveMission,
  TimeOrderRaceMission,
  GlobalMeetingPlannerMission,
  TimeMasterFinalMission,
} from './TimeArcadeMissions';


import SeasonTimeShiftMission
  from './SeasonTimeShiftMission';


import SchoolOverlapPlannerMission
  from './SchoolOverlapPlannerMission';


import TimeTravelerFinalMission
  from './TimeTravelerFinalMission';


export default function TimeMissionRouter({
  mission,
  onComplete,
  alreadyCompleted,
}) {

  if (
    mission?.type ===
    'time-traveler-final'
  ) {
    return (
      <TimeTravelerFinalMission
        mission={mission}
        onComplete={onComplete}
        alreadyCompleted={alreadyCompleted}
      />
    );
  }


  if (
    mission?.type ===
    'school-overlap-planner'
  ) {
    return (
      <SchoolOverlapPlannerMission
        mission={mission}
        onComplete={onComplete}
        alreadyCompleted={alreadyCompleted}
      />
    );
  }


  if (
    mission?.type ===
    'season-time-shift'
  ) {
    return (
      <SeasonTimeShiftMission
        mission={mission}
        onComplete={onComplete}
        alreadyCompleted={alreadyCompleted}
      />
    );
  }


  if (
    mission?.type ===
    'sound-time-detective-v2'
  ) {
    return (
      <SoundTimeDetectiveMission
        mission={mission}
        onComplete={onComplete}
        alreadyCompleted={alreadyCompleted}
      />
    );
  }

  const props = {
    mission,
    onComplete,
    alreadyCompleted,
  };

  switch (mission?.type) {
    case 'time-zone-express':
      return <TimeZoneExpressMission {...props} />;

    case 'clock-tower-rescue':
      return <ClockTowerRescueMission {...props} />;

    case 'photo-time-detective':
      return <PhotoTimeDetectiveMission {...props} />;

    case 'sound-time-detective':
      return <SoundTimeDetectiveMission {...props} />;

    case 'time-order-race':
      return <TimeOrderRaceMission {...props} />;

    case 'global-meeting-planner':
      return <GlobalMeetingPlannerMission {...props} />;

    case 'time-master-final':
      return <TimeMasterFinalMission {...props} />;

    case 'world-life-detective':
      return <WorldLifeDetectiveMission {...props} />;

    default:
      return <TimeMissionGame {...props} />;
  }
}