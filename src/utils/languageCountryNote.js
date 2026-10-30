// Locale-aware cultural prompt for the current country.
// Reviewed country-specific facts are deliberately sparse; never reuse Rwanda's note globally.
const countryLanguageFacts=Object.freeze({
  kz:'カザフスタンではカザフ語が国家語で、ロシア語も公的に使用されています。',
  rw:'ルワンダではキニヤルワンダ語・英語・フランス語・スワヒリ語が公用語です。',
});
export function getCountryLanguageNote({countryCode,country={},languageName='英語'}={}){
  const iso=String(countryCode||'').trim().toLowerCase();
  const countryName=country.nameJa||country.nameEn||iso.toUpperCase();
  const introduction=countryLanguageFacts[iso]||'';
  return {
    title:countryName+'のこと',
    text:(introduction?introduction+' ':'')+
      'このAdventureでは'+languageName+'を使ったあいさつや文化交流を練習します。',
  };
}
