import {BookOpen} from 'lucide-react';

// The note must be derived from the CURRENT country, never hardcoded as Rwanda.
// Only country-specific language facts that have been reviewed are rendered.
const VERIFIED_COUNTRY_NOTES={
  kz:'カザフスタンではカザフ語が国家語で、ロシア語も公的に使用されています。',
  rw:'ルワンダではキニヤルワンダ語・英語・フランス語・スワヒリ語が公用語です。',
};

export default function CommunicationMission({countryCode,country={},languageName='英語'}){
  const iso=String(countryCode||'').trim().toLowerCase();
  const name=country.nameJa||country.nameEn||iso.toUpperCase();
  const fact=VERIFIED_COUNTRY_NOTES[iso];
  return <aside className="tp-language-country-note" aria-label={name+'のこと'}>
    <BookOpen size={17} className="shrink-0 text-violet-600" aria-hidden="true"/>
    <div className="min-w-0">
      <p className="tp-language-country-heading">{name}のこと</p>
      <p className="tp-language-country-text">
        {fact?fact+' ':''}このAdventureでは{languageName}を使ったあいさつや文化交流を練習します。
      </p>
    </div>
  </aside>;
}
