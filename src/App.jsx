import {
  lazy,
  Suspense,
  useRef,
  useState,
} from 'react';

import Timer
  from './components/Timer';

import MapClock
  from './components/MapClock';

import Stopwatch
  from './components/Stopwatch';

import MeetingPlanner
  from './components/MeetingPlanner';

import LanguagePractice
  from './components/LanguagePractice';

import OpeningSplash
  from './components/opening/OpeningSplash';

import ThemeMusicController
  from './components/audio/ThemeMusicController';

import MainHeader
  from './components/navigation/MainHeader';

import WorldAdventureHome
  from './components/world-learning/WorldAdventureHome';

import ExploreWorld
  from './components/world-learning/ExploreWorld';

import langData
  from './data/languages_a.json';

import {
  markOpeningSeen,
  shouldShowOpening,
} from './utils/openingStorage';

import {
  playUiSound,
} from './utils/uiSound';

const WorldGameHub = lazy(() => import('./components/world-games/WorldGameHub.jsx'));

const Placeholder = ({
  title,
}) => (
  <div className="flex min-h-[65vh] w-full flex-col items-center justify-center bg-white">

    <div className="mb-5 text-sm font-bold tracking-[0.18em] text-slate-300">
      COMING SOON
    </div>

    <h2 className="text-3xl font-semibold tracking-tight text-slate-800">
      {title}
    </h2>

    <p className="mt-3 text-sm text-slate-500">
      現在開発中です。
    </p>

  </div>
);

function hasMeetingLink() {
  return (
    typeof window !==
      'undefined' &&
    window.location.hash.includes(
      'meeting='
    )
  );
}

export default function App() {
  const [initialGameMode,setInitialGameMode]=useState(null);
  const [initialShowJourney,setInitialShowJourney]=useState(false);
  const themeMusicRef =
    useRef(null);

  const [
    showOpening,
    setShowOpening,
  ] = useState(() => {
    if (
      hasMeetingLink()
    ) {
      return false;
    }

    return shouldShowOpening();
  });

  const [
    activeTab,
    setActiveTab,
  ] = useState(() => {
    if (
      hasMeetingLink()
    ) {
      return 'timeDiff';
    }

    return 'home';
  });

  const closeOpening =
    () => {
      markOpeningSeen();

      setShowOpening(
        false
      );
    };

  const navigateTo =
    (nextTab) => {
      if (
        activeTab ===
          'home' &&
        nextTab !==
          'home'
      ) {
        themeMusicRef.current
          ?.fadeOut({
            duration: 800,
            reset: true,
          });
      }

      setActiveTab(
        nextTab
      );

      window.setTimeout(
        () => {
          window.scrollTo({
            top: 0,
            behavior:
              'smooth',
          });
        },
        30
      );
    };

  const goHome =
    () => {
      playUiSound(
        'back'
      );

      setActiveTab(
        'home'
      );

      window.setTimeout(
        () => {
          window.scrollTo({
            top: 0,
            behavior:
              'smooth',
          });
        },
        40
      );
    };

  const goExplore =
    () => {
      setInitialShowJourney(false);
      playUiSound(
        'open'
      );

      navigateTo(
        'explore'
      );
    };

  const goJourney = () => {playUiSound('tap');setInitialShowJourney(true);navigateTo('explore');};

  const openGame = mode => {setInitialGameMode(mode);playUiSound('tap');navigateTo('worldGames');};

  const openTool =
    (toolId) => {
      playUiSound(
        'tap'
      );

      if(toolId==='worldGames')setInitialGameMode(null);
      navigateTo(
        toolId
      );
    };

  const renderContent =
    () => {
      switch (
        activeTab
      ) {
        case 'home':
          return (
            <WorldAdventureHome
              onOpenGame={openGame}
              onExploreWorld={
                goExplore
              }
              onOpenTool={
                openTool
              }
            />
          );

        case 'worldGames':
          return <Suspense fallback={<div role="status" className="p-8 text-center">World Gamesを読み込み中…</div>}><WorldGameHub key={initialGameMode||'default'} initialMode={initialGameMode} onBackHome={goHome}/></Suspense>;

        case 'explore':
          return (
            <ExploreWorld onBackHome={goHome} initialShowJourney={initialShowJourney} onDismissJourney={()=>setInitialShowJourney(false)}/>
          );

        case 'timer':
          return (
            <Timer />
          );

        case 'stopwatch':
          return (
            <Stopwatch />
          );

        case 'mapClock':
          return (
            <MapClock
              isAmPm={
                false
              }
            />
          );

        case 'timeDiff':
          return (
            <MeetingPlanner />
          );

        case 'myClock':
          return (
            <Placeholder
              title="My Clock"
            />
          );

        case 'language':
          return (
            <LanguagePractice
              countryCode="au"
              languageKey="english"
              languageData={
                langData
              }
            />
          );

        default:
          return (
            <WorldAdventureHome
              onOpenGame={openGame}
              onExploreWorld={
                goExplore
              }
              onOpenTool={
                openTool
              }
            />
          );
      }
    };

  const isFullWidth =
    activeTab === 'home' || activeTab === 'worldGames' ||
    activeTab ===
      'explore';

  const showThemeControl =
    showOpening ||
    activeTab === 'home';

  return (
    <>
      <ThemeMusicController
        ref={
          themeMusicRef
        }
        visible={
          showThemeControl
        }
      />

      {showOpening && (
        <OpeningSplash
          onComplete={
            closeOpening
          }
        />
      )}

      <div className="min-h-screen bg-slate-100 font-sans">

        {!isFullWidth&&<MainHeader
          activeTab={
            activeTab
          }
          onAdventure={
            goHome
          }
          onExplore={
            goExplore
          }
          onJourney={
            goJourney
          }
          onSelectTool={
            openTool
          }
        />}

        <main
          className={
            isFullWidth
              ? 'w-full'
              : 'mx-auto min-h-[calc(100vh-68px)] w-full max-w-[1400px] p-4 md:p-6'
          }
        >
          {renderContent()}
        </main>

      </div>
    </>
  );
}