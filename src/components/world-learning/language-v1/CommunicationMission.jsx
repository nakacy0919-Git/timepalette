import {BookOpen} from 'lucide-react';
import {getCountryLanguageNote} from '../../../utils/languageCountryNote.js';

export default function CommunicationMission({countryCode,country={},languageName='英語'}){
  const note=getCountryLanguageNote({countryCode,country,languageName});
  return <aside className="tp-language-country-note" aria-label={note.title}>
    <BookOpen size={17} className="shrink-0 text-violet-600" aria-hidden="true"/>
    <div className="min-w-0">
      <p className="tp-language-country-heading">{note.title}</p>
      <p className="tp-language-country-text">{note.text}</p>
    </div>
  </aside>;
}
