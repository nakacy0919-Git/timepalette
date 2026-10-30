import {
  X,
} from 'lucide-react';

import {
  createPortal,
} from 'react-dom';

import LanguageAdventure
  from './language-v1/LanguageAdventure';


export default function LanguageAdventureLauncher({
  open,
  onClose,
  learningLevel,
  countryCode = 'rw',
  onProgressChange,
  creatorMissionCount = 0,
  onOpenCreatorMissions,
}) {
  if (
    !open ||
    typeof document ===
      'undefined'
  ) {
    return null;
  }


  return createPortal(
    <div
      className="
        fixed
        inset-0
        z-[12000]
        h-[100dvh]
        overflow-hidden
        bg-slate-100
      "
    >
      <button
        type="button"
        onClick={
          onClose
        }
        aria-label="Language Adventureを閉じる"
        className="
          fixed
          right-2
          top-2
          z-[13000]
          flex
          h-10
          w-10
          items-center
          justify-center
          rounded-full
          border
          border-white/50
          bg-slate-950/90
          text-white
          shadow-2xl
          backdrop-blur-xl
          transition
          hover:scale-105
          hover:bg-slate-800
        "
      >
        <X
          size={22}
        />
      </button>


      {creatorMissionCount > 0 && (
        <button
          type="button"
          onClick={onOpenCreatorMissions}
          className="fixed bottom-5 right-5 z-[13000] rounded-2xl bg-emerald-700 px-5 py-3 text-sm font-black text-white shadow-2xl hover:bg-emerald-600"
        >
          先生の公開ミッション（{creatorMissionCount}問）を見る
        </button>
      )}

      <LanguageAdventure
        initialLevel={
          learningLevel
        }
        countryCode={
          countryCode
        }
        onProgressChange={
          onProgressChange
        }
      />
    </div>,
    document.body
  );
}
