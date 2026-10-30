import {
  X,
} from 'lucide-react';

import {
  createPortal,
} from 'react-dom';
import {lazy,Suspense,useEffect} from 'react';

const PlaceAdventure=lazy(()=>import('./place-v1/PlaceAdventure'));
import {getPlaceAdventurePackage} from '../../utils/geography197.js';


export default function PlaceAdventureLauncher({
  open,
  onClose,
  learningLevel,
  countryCode = 'rw',
  onProgressChange,
}) {
  useEffect(()=>{if(!open)return;const previous=document.body.style.overflow;document.body.style.overflow='hidden';return()=>{document.body.style.overflow=previous;};},[open]);
  if (
    !open ||
    typeof document ===
      'undefined'
  ) {
    return null;
  }


  const curriculum = getPlaceAdventurePackage(countryCode);
  if(!curriculum)return null;
  return createPortal(
    <div
      className="
        fixed
        inset-0
        z-[12000]
        overflow-hidden
        bg-slate-100
      "
    >
      <button
        type="button"
        onClick={
          onClose
        }
        aria-label="Place Adventureを閉じる"
        className="
          fixed
          right-2
          top-2
          z-[13000]
          flex
          h-9
          w-9
          items-center
          justify-center
          rounded-full
          border
          border-white/60
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


      <Suspense fallback={<p role="status" className="p-10 text-center font-bold">地図を読み込み中…</p>}>
      <PlaceAdventure
        key={countryCode}
        packageData={curriculum}
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
      </Suspense>
    </div>,
    document.body
  );
}