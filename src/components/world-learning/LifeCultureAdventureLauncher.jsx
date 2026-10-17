import {
  X,
} from 'lucide-react';

import {
  createPortal,
} from 'react-dom';

import LifeCultureAdventure
  from './life-culture-v1/LifeCultureAdventure';


export default function LifeCultureAdventureLauncher({
  open,
  onClose,
  learningLevel,
  countryCode = 'rw',
  onProgressChange,
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
        overflow-y-auto
        bg-orange-50
      "
    >
      <button
        type="button"
        onClick={
          onClose
        }
        aria-label="Life & Culture Adventureを閉じる"
        className="
          fixed
          right-5
          top-5
          z-[13000]
          flex
          h-12
          w-12
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


      <LifeCultureAdventure
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
