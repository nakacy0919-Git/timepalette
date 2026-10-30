import {normalizeSpeechText} from './multilingualSpeechText.js';

const LANGUAGE_NAMES=Object.freeze({
  en:'英語',es:'スペイン語',fr:'フランス語',pt:'ポルトガル語',de:'ドイツ語',
  it:'イタリア語',nl:'オランダ語',ms:'マレー語',sv:'スウェーデン語',ro:'ルーマニア語',
});
const SAMPLE_PHRASES=Object.freeze({
  en:'Hello',es:'Hola',fr:'Bonjour',pt:'Olá',de:'Hallo',
  it:'Ciao',nl:'Hallo',ms:'Helo',sv:'Hej',ro:'Bună',
});
export const SPEECH_PASS_SCORE=80;
export const getSpeechLanguageName=(locale='en-US')=>LANGUAGE_NAMES[String(locale).split('-')[0].toLowerCase()]||String(locale);
export const getSpeechDiagnosticPhrase=(locale='en-US')=>SAMPLE_PHRASES[String(locale).split('-')[0].toLowerCase()]||'Hello';

// Deliberately share the exact word-level Accuracy calculation with the missions.
// Matching a phrase does NOT prove that all browser speech features or vocabulary work.
export function calculateSpeechAccuracy(target,transcript){
  const a=normalizeSpeechText(target).split(' ').filter(Boolean);
  const b=normalizeSpeechText(transcript).split(' ').filter(Boolean);
  if(!a.length||!b.length)return 0;
  let previous=Array.from({length:b.length+1},(_,i)=>i);
  for(let i=1;i<=a.length;i++){
    const next=[i];
    for(let j=1;j<=b.length;j++){
      next[j]=Math.min(next[j-1]+1,previous[j]+1,previous[j-1]+(a[i-1]===b[j-1]?0:1));
    }
    previous=next;
  }
  return Math.max(0,Math.round((1-previous[b.length]/Math.max(a.length,b.length))*100));
}
export function evaluateSpeechDiagnostic(expected,transcript){
  const recognized=Boolean(normalizeSpeechText(transcript));
  const accuracy=recognized?calculateSpeechAccuracy(expected,transcript):0;
  return {recognized,accuracy,matched:recognized&&accuracy>=SPEECH_PASS_SCORE,
    status:!recognized?'no-transcript':accuracy>=SPEECH_PASS_SCORE?'matched':'mismatch'};
}
export function getSpeechRecognitionErrorMessage(code,locale='en-US'){
  const lang=getSpeechLanguageName(locale);
  switch(code){
    case 'not-allowed':
    case 'service-not-allowed':
      return 'マイクまたは音声認識の使用が許可されていません。端末・ブラウザーの設定を確認してください。';
    case 'audio-capture':
      return 'マイクの音声を取得できません。端末の入力設定とマイクを確認してください。';
    case 'network':
      return '音声認識サービスに接続できません。インターネット接続を確認してください。';
    case 'language-not-supported':
    case 'language-unavailable':
      return 'この端末・ブラウザーでは'+lang+'（'+locale+'）の音声認識が利用できない可能性があります。';
    case 'no-speech':
      return '音声が検出されませんでした。マイクに向かってもう一度話してください。';
    case 'no-match':
      return lang+'として文字起こしできませんでした。もう一度はっきり話してください。';
    case 'unsupported':
      return 'このブラウザーでは音声認識APIを利用できません。SafariやChromeなどの対応ブラウザーで開いてください。';
    case 'insecure-context':
      return '音声認識にはHTTPSまたはlocalhostの安全な接続が必要です。';
    case 'aborted':
      return '音声認識を中断しました。';
    default:
      return '音声認識エラー（'+String(code||'unknown')+'）。端末・ブラウザーの設定を確認してください。';
  }
}
