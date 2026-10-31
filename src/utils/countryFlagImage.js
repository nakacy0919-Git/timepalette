// PNG flags render consistently on Windows and iPads, unlike regional-indicator
// Unicode emoji, which some Windows fonts display as two-letter country codes.
// Images are requested directly by the user's browser from FlagCDN.
export function countryFlagImageUrl(countryCode){
  const iso=String(countryCode||'').trim().toLowerCase();
  return /^[a-z]{2}$/.test(iso)?'https://flagcdn.com/w80/'+iso+'.png':null;
}
