// Candidates only: these are NOT yet playable. Country/legal eligibility,
// speech recognition, voice availability and normalized scoring still require
// verification before enabling any future language in the public selector.
export const FUTURE_LANGUAGE_CANDIDATES = Object.freeze([
 {id:'ar',nameJa:'アラビア語',locale:'ar-EG',script:'Arabic'},
 {id:'ru',nameJa:'ロシア語',locale:'ru-RU',script:'Cyrillic'},
 {id:'sw',nameJa:'スワヒリ語',locale:'sw-KE',script:'Latin'},
 {id:'zh',nameJa:'中国語（標準中国語）',locale:'zh-CN',script:'Han'},
 {id:'ko',nameJa:'韓国語',locale:'ko-KR',script:'Hangul'},
 {id:'hi',nameJa:'ヒンディー語',locale:'hi-IN',script:'Devanagari'},
 {id:'ta',nameJa:'タミル語',locale:'ta-IN',script:'Tamil'},
 {id:'el',nameJa:'ギリシャ語',locale:'el-GR',script:'Greek'},
 {id:'tr',nameJa:'トルコ語',locale:'tr-TR',script:'Latin'},
 {id:'hr',nameJa:'クロアチア語',locale:'hr-HR',script:'Latin'},
 {id:'sr',nameJa:'セルビア語',locale:'sr-RS',script:'Cyrillic/Latin'},
 {id:'sq',nameJa:'アルバニア語',locale:'sq-AL',script:'Latin'},
 {id:'st',nameJa:'セソト語',locale:'st-ZA',script:'Latin'},
 {id:'xh',nameJa:'コサ語',locale:'xh-ZA',script:'Latin'},
 {id:'ss',nameJa:'スワティ語',locale:'ss-ZA',script:'Latin'},
 {id:'ve',nameJa:'ベンダ語',locale:'ve-ZA',script:'Latin'},
 {id:'tn',nameJa:'ツワナ語',locale:'tn-ZA',script:'Latin'},
].map(c=>Object.freeze({...c,status:'pending-device-and-linguistic-review'})));
