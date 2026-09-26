import {
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
      playUiSound(
        'open'
      );

      navigateTo(
        'explore'
      );
    };

  const goJourney =
    () => {
      playUiSound(
        'tap'
      );

      setActiveTab(
        'home'
      );

      window.setTimeout(
        () => {
          document
            .getElementById(
              'journey'
            )
            ?.scrollIntoView({
              behavior:
                'smooth',
              block:
                'center',
            });
        },
        80
      );
    };

  const openTool =
    (toolId) => {
      playUiSound(
        'tap'
      );

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
              onExploreWorld={
                goExplore
              }
              onOpenTool={
                openTool
              }
            />
          );

        case 'explore':
          return (
            <ExploreWorld />
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
    activeTab === 'home' ||
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

        <MainHeader
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
        />

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