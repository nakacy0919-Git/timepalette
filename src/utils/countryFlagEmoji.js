// ISO 3166-1 alpha-2 regional indicator symbols. This avoids missing country
// icons in datasets that do not provide a flagEmoji field.
export function flagEmojiFromCode(countryCode){
  const iso=String(countryCode||'').trim().toLowerCase();
  if(!/^[a-z]{2}$/.test(iso))return '🌍';
  return String.fromCodePoint(...[...iso.toUpperCase()].map(letter=>127397+letter.charCodeAt(0)));
}
