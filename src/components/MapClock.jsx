import { useState, useEffect } from 'react';
import { ComposableMap, Geographies, Geography, ZoomableGroup, Marker } from 'react-simple-maps';
import { Sunrise, Sun, Sunset, Moon, MoonStar } from 'lucide-react';

const geoUrl = "https://unpkg.com/world-atlas@2.0.2/countries-110m.json";

// 全世界対応版 countryData
const countryData = {
  "Afghanistan": { ja: "アフガニスタン", tz: "Asia/Kabul", iso: "af" },
  "Albania": { ja: "アルバニア", tz: "Europe/Tirane", iso: "al" },
  "Algeria": { ja: "アルジェリア", tz: "Africa/Algiers", iso: "dz" },
  "Andorra": { ja: "アンドラ", tz: "Europe/Andorra", iso: "ad" },
  "Angola": { ja: "アンゴラ", tz: "Africa/Luanda", iso: "ao" },
  "Antigua and Barbuda": { ja: "アンティグア・バーブーダ", tz: "America/Antigua", iso: "ag" },
  "Argentina": { ja: "アルゼンチン", tz: "America/Argentina/Buenos_Aires", iso: "ar" },
  "Armenia": { ja: "アルメニア", tz: "Asia/Yerevan", iso: "am" },
  "Australia": { ja: "オーストラリア", tz: "Australia/Sydney", iso: "au" },
  "Austria": { ja: "オーストリア", tz: "Europe/Vienna", iso: "at" },
  "Azerbaijan": { ja: "アゼルバイジャン", tz: "Asia/Baku", iso: "az" },
  "Bahamas": { ja: "バハマ", tz: "America/Nassau", iso: "bs" },
  "Bahrain": { ja: "バーレーン", tz: "Asia/Bahrain", iso: "bh" },
  "Bangladesh": { ja: "バングラデシュ", tz: "Asia/Dhaka", iso: "bd" },
  "Barbados": { ja: "バルバドス", tz: "America/Barbados", iso: "bb" },
  "Belarus": { ja: "ベラルーシ", tz: "Europe/Minsk", iso: "by" },
  "Belgium": { ja: "ベルギー", tz: "Europe/Brussels", iso: "be" },
  "Belize": { ja: "ベリーズ", tz: "America/Belize", iso: "bz" },
  "Benin": { ja: "ベナン", tz: "Africa/Porto-Novo", iso: "bj" },
  "Bhutan": { ja: "ブータン", tz: "Asia/Thimphu", iso: "bt" },
  "Bolivia": { ja: "ボリビア", tz: "America/La_Paz", iso: "bo" },
  "Bosnia and Herz.": { ja: "ボスニア・ヘルツェゴビナ", tz: "Europe/Sarajevo", iso: "ba" },
  "Botswana": { ja: "ボツワナ", tz: "Africa/Gaborone", iso: "bw" },
  "Brazil": { ja: "ブラジル", tz: "America/Sao_Paulo", iso: "br" },
  "Brunei": { ja: "ブルネイ", tz: "Asia/Brunei", iso: "bn" },
  "Bulgaria": { ja: "ブルガリア", tz: "Europe/Sofia", iso: "bg" },
  "Burkina Faso": { ja: "ブルキナファソ", tz: "Africa/Ouagadougou", iso: "bf" },
  "Burundi": { ja: "ブルンジ", tz: "Africa/Bujumbura", iso: "bi" },
  "Cambodia": { ja: "カンボジア", tz: "Asia/Phnom_Penh", iso: "kh" },
  "Cameroon": { ja: "カメルーン", tz: "Africa/Douala", iso: "cm" },
  "Canada": { ja: "カナダ", tz: "America/Toronto", iso: "ca" },
  "Cape Verde": { ja: "カーボベルデ", tz: "Atlantic/Cape_Verde", iso: "cv" },
  "Central African Rep.": { ja: "中央アフリカ共和国", tz: "Africa/Bangui", iso: "cf" },
  "Chad": { ja: "チャド", tz: "Africa/Ndjamena", iso: "td" },
  "Chile": { ja: "チリ", tz: "America/Santiago", iso: "cl" },
  "China": { ja: "中国", tz: "Asia/Shanghai", iso: "cn" },
  "Colombia": { ja: "コロンビア", tz: "America/Bogota", iso: "co" },
  "Comoros": { ja: "コモロ", tz: "Indian/Comoro", iso: "km" },
  "Congo": { ja: "コンゴ共和国", tz: "Africa/Brazzaville", iso: "cg" },
  "Dem. Rep. Congo": { ja: "コンゴ民主共和国", tz: "Africa/Kinshasa", iso: "cd" },
  "Costa Rica": { ja: "コスタリカ", tz: "America/Costa_Rica", iso: "cr" },
  "Croatia": { ja: "クロアチア", tz: "Europe/Zagreb", iso: "hr" },
  "Cuba": { ja: "キューバ", tz: "America/Havana", iso: "cu" },
  "Cyprus": { ja: "キプロス", tz: "Asia/Nicosia", iso: "cy" },
  "Czechia": { ja: "チェコ", tz: "Europe/Prague", iso: "cz" },
  "Denmark": { ja: "デンマーク", tz: "Europe/Copenhagen", iso: "dk" },
  "Djibouti": { ja: "ジブチ", tz: "Africa/Djibouti", iso: "dj" },
  "Dominica": { ja: "ドミニカ国", tz: "America/Dominica", iso: "dm" },
  "Dominican Rep.": { ja: "ドミニカ共和国", tz: "America/Santo_Domingo", iso: "do" },
  "Ecuador": { ja: "エクアドル", tz: "America/Guayaquil", iso: "ec" },
  "Egypt": { ja: "エジプト", tz: "Africa/Cairo", iso: "eg" },
  "El Salvador": { ja: "エルサルバドル", tz: "America/El_Salvador", iso: "sv" },
  "Eq. Guinea": { ja: "赤道ギニア", tz: "Africa/Malabo", iso: "gq" },
  "Eritrea": { ja: "エリトリア", tz: "Africa/Asmara", iso: "er" },
  "Estonia": { ja: "エストニア", tz: "Europe/Tallinn", iso: "ee" },
  "Eswatini": { ja: "エスワティニ", tz: "Africa/Mbabane", iso: "sz" },
  "Ethiopia": { ja: "エチオピア", tz: "Africa/Addis_Ababa", iso: "et" },
  "Fiji": { ja: "フィジー", tz: "Pacific/Fiji", iso: "fj" },
  "Finland": { ja: "フィンランド", tz: "Europe/Helsinki", iso: "fi" },
  "France": { ja: "フランス", tz: "Europe/Paris", iso: "fr" },
  "Gabon": { ja: "ガボン", tz: "Africa/Libreville", iso: "ga" },
  "Gambia": { ja: "ガンビア", tz: "Africa/Banjul", iso: "gm" },
  "Georgia": { ja: "ジョージア", tz: "Asia/Tbilisi", iso: "ge" },
  "Germany": { ja: "ドイツ", tz: "Europe/Berlin", iso: "de" },
  "Ghana": { ja: "ガーナ", tz: "Africa/Accra", iso: "gh" },
  "Greece": { ja: "ギリシャ", tz: "Europe/Athens", iso: "gr" },
  "Grenada": { ja: "グレナダ", tz: "America/Grenada", iso: "gd" },
  "Guatemala": { ja: "グアテマラ", tz: "America/Guatemala", iso: "gt" },
  "Guinea": { ja: "ギニア", tz: "Africa/Conakry", iso: "gn" },
  "Guinea-Bissau": { ja: "ギニアビサウ", tz: "Africa/Bissau", iso: "gw" },
  "Guyana": { ja: "ガイアナ", tz: "America/Guyana", iso: "gy" },
  "Haiti": { ja: "ハイチ", tz: "America/Port-au-Prince", iso: "ht" },
  "Honduras": { ja: "ホンジュラス", tz: "America/Tegucigalpa", iso: "hn" },
  "Hungary": { ja: "ハンガリー", tz: "Europe/Budapest", iso: "hu" },
  "Iceland": { ja: "アイスランド", tz: "Atlantic/Reykjavik", iso: "is" },
  "India": { ja: "インド", tz: "Asia/Kolkata", iso: "in" },
  "Indonesia": { ja: "インドネシア", tz: "Asia/Jakarta", iso: "id" },
  "Iran": { ja: "イラン", tz: "Asia/Tehran", iso: "ir" },
  "Iraq": { ja: "イラク", tz: "Asia/Baghdad", iso: "iq" },
  "Ireland": { ja: "アイルランド", tz: "Europe/Dublin", iso: "ie" },
  "Israel": { ja: "イスラエル", tz: "Asia/Jerusalem", iso: "il" },
  "Italy": { ja: "イタリア", tz: "Europe/Rome", iso: "it" },
  "Jamaica": { ja: "ジャマイカ", tz: "America/Jamaica", iso: "jm" },
  "Japan": { ja: "日本", tz: "Asia/Tokyo", iso: "jp" },
  "Jordan": { ja: "ヨルダン", tz: "Asia/Amman", iso: "jo" },
  "Kazakhstan": { ja: "カザフスタン", tz: "Asia/Almaty", iso: "kz" },
  "Kenya": { ja: "ケニア", tz: "Africa/Nairobi", iso: "ke" },
  "Kiribati": { ja: "キリバス", tz: "Pacific/Tarawa", iso: "ki" },
  "Kuwait": { ja: "クウェート", tz: "Asia/Kuwait", iso: "kw" },
  "Kyrgyzstan": { ja: "キルギス", tz: "Asia/Bishkek", iso: "kg" },
  "Laos": { ja: "ラオス", tz: "Asia/Vientiane", iso: "la" },
  "Latvia": { ja: "ラトビア", tz: "Europe/Riga", iso: "lv" },
  "Lebanon": { ja: "レバノン", tz: "Asia/Beirut", iso: "lb" },
  "Lesotho": { ja: "レソト", tz: "Africa/Maseru", iso: "ls" },
  "Liberia": { ja: "リベリア", tz: "Africa/Monrovia", iso: "lr" },
  "Libya": { ja: "リビア", tz: "Africa/Tripoli", iso: "ly" },
  "Liechtenstein": { ja: "リヒテンシュタイン", tz: "Europe/Vaduz", iso: "li" },
  "Lithuania": { ja: "リトアニア", tz: "Europe/Vilnius", iso: "lt" },
  "Luxembourg": { ja: "ルクセンブルク", tz: "Europe/Luxembourg", iso: "lu" },
  "Madagascar": { ja: "マダガスカル", tz: "Indian/Antananarivo", iso: "mg" },
  "Malawi": { ja: "マラウイ", tz: "Africa/Blantyre", iso: "mw" },
  "Malaysia": { ja: "マレーシア", tz: "Asia/Kuala_Lumpur", iso: "my" },
  "Maldives": { ja: "モルディブ", tz: "Indian/Maldives", iso: "mv" },
  "Mali": { ja: "マリ", tz: "Africa/Bamako", iso: "ml" },
  "Malta": { ja: "マルタ", tz: "Europe/Malta", iso: "mt" },
  "Marshall Is.": { ja: "マーシャル諸島", tz: "Pacific/Majuro", iso: "mh" },
  "Mauritania": { ja: "モーリタニア", tz: "Africa/Nouakchott", iso: "mr" },
  "Mauritius": { ja: "モーリシャス", tz: "Indian/Mauritius", iso: "mu" },
  "Mexico": { ja: "メキシコ", tz: "America/Mexico_City", iso: "mx" },
  "Micronesia": { ja: "ミクロネシア", tz: "Pacific/Pohnpei", iso: "fm" },
  "Moldova": { ja: "モルドバ", tz: "Europe/Chisinau", iso: "md" },
  "Monaco": { ja: "モナコ", tz: "Europe/Monaco", iso: "mc" },
  "Mongolia": { ja: "モンゴル", tz: "Asia/Ulaanbaatar", iso: "mn" },
  "Montenegro": { ja: "モンテネグロ", tz: "Europe/Podgorica", iso: "me" },
  "Morocco": { ja: "モロッコ", tz: "Africa/Casablanca", iso: "ma" },
  "Mozambique": { ja: "モザンビーク", tz: "Africa/Maputo", iso: "mz" },
  "Myanmar": { ja: "ミャンマー", tz: "Asia/Yangon", iso: "mm" },
  "Namibia": { ja: "ナミビア", tz: "Africa/Windhoek", iso: "na" },
  "Nauru": { ja: "ナウル", tz: "Pacific/Nauru", iso: "nr" },
  "Nepal": { ja: "ネパール", tz: "Asia/Kathmandu", iso: "np" },
  "Netherlands": { ja: "オランダ", tz: "Europe/Amsterdam", iso: "nl" },
  "New Zealand": { ja: "ニュージーランド", tz: "Pacific/Auckland", iso: "nz" },
  "Nicaragua": { ja: "ニカラグア", tz: "America/Managua", iso: "ni" },
  "Niger": { ja: "ニジェール", tz: "Africa/Niamey", iso: "ne" },
  "Nigeria": { ja: "ナイジェリア", tz: "Africa/Lagos", iso: "ng" },
  "North Korea": { ja: "北朝鮮", tz: "Asia/Pyongyang", iso: "kp" },
  "Macedonia": { ja: "北マケドニア", tz: "Europe/Skopje", iso: "mk" },
  "Norway": { ja: "ノルウェー", tz: "Europe/Oslo", iso: "no" },
  "Oman": { ja: "オマーン", tz: "Asia/Muscat", iso: "om" },
  "Pakistan": { ja: "パキスタン", tz: "Asia/Karachi", iso: "pk" },
  "Palau": { ja: "パラオ", tz: "Pacific/Palau", iso: "pw" },
  "Palestine": { ja: "パレスチナ", tz: "Asia/Gaza", iso: "ps" },
  "Panama": { ja: "パナマ", tz: "America/Panama", iso: "pa" },
  "Papua New Guinea": { ja: "パプアニューギニア", tz: "Pacific/Port_Moresby", iso: "pg" },
  "Paraguay": { ja: "パラグアイ", tz: "America/Asuncion", iso: "py" },
  "Peru": { ja: "ペルー", tz: "America/Lima", iso: "pe" },
  "Philippines": { ja: "フィリピン", tz: "Asia/Manila", iso: "ph" },
  "Poland": { ja: "ポーランド", tz: "Europe/Warsaw", iso: "pl" },
  "Portugal": { ja: "ポルトガル", tz: "Europe/Lisbon", iso: "pt" },
  "Qatar": { ja: "カタール", tz: "Asia/Qatar", iso: "qa" },
  "Romania": { ja: "ルーマニア", tz: "Europe/Bucharest", iso: "ro" },
  "Russia": { ja: "ロシア", tz: "Europe/Moscow", iso: "ru" },
  "Rwanda": { ja: "ルワンダ", tz: "Africa/Kigali", iso: "rw" },
  "Saint Kitts and Nevis": { ja: "セントクリストファー・ネイビス", tz: "America/St_Kitts", iso: "kn" },
  "Saint Lucia": { ja: "セントルシア", tz: "America/St_Lucia", iso: "lc" },
  "St. Vin. and Gren.": { ja: "セントビンセント・グレナディーン", tz: "America/St_Vincent", iso: "vc" },
  "Samoa": { ja: "サモア", tz: "Pacific/Apia", iso: "ws" },
  "San Marino": { ja: "サンマリノ", tz: "Europe/San_Marino", iso: "sm" },
  "Sao Tome and Principe": { ja: "サントメ・プリンシペ", tz: "Africa/Sao_Tome", iso: "st" },
  "Saudi Arabia": { ja: "サウジアラビア", tz: "Asia/Riyadh", iso: "sa" },
  "Senegal": { ja: "セネガル", tz: "Africa/Dakar", iso: "sn" },
  "Serbia": { ja: "セルビア", tz: "Europe/Belgrade", iso: "rs" },
  "Seychelles": { ja: "セーシェル", tz: "Indian/Mahe", iso: "sc" },
  "Sierra Leone": { ja: "シエラレオネ", tz: "Africa/Freetown", iso: "sl" },
  "Singapore": { ja: "シンガポール", tz: "Asia/Singapore", iso: "sg" },
  "Slovakia": { ja: "スロバキア", tz: "Europe/Bratislava", iso: "sk" },
  "Slovenia": { ja: "スロベニア", tz: "Europe/Ljubljana", iso: "si" },
  "Solomon Is.": { ja: "ソロモン諸島", tz: "Pacific/Guadalcanal", iso: "sb" },
  "Somalia": { ja: "ソマリア", tz: "Africa/Mogadishu", iso: "so" },
  "South Africa": { ja: "南アフリカ", tz: "Africa/Johannesburg", iso: "za" },
  "South Korea": { ja: "韓国", tz: "Asia/Seoul", iso: "kr" },
  "S. Sudan": { ja: "南スーダン", tz: "Africa/Juba", iso: "ss" },
  "Spain": { ja: "スペイン", tz: "Europe/Madrid", iso: "es" },
  "Sri Lanka": { ja: "スリランカ", tz: "Asia/Colombo", iso: "lk" },
  "Sudan": { ja: "スーダン", tz: "Africa/Khartoum", iso: "sd" },
  "Suriname": { ja: "スリナム", tz: "America/Paramaribo", iso: "sr" },
  "Sweden": { ja: "スウェーデン", tz: "Europe/Stockholm", iso: "se" },
  "Switzerland": { ja: "スイス", tz: "Europe/Zurich", iso: "ch" },
  "Syria": { ja: "シリア", tz: "Asia/Damascus", iso: "sy" },
  "Taiwan": { ja: "台湾", tz: "Asia/Taipei", iso: "tw" },
  "Tajikistan": { ja: "タジキスタン", tz: "Asia/Dushanbe", iso: "tj" },
  "Tanzania": { ja: "タンザニア", tz: "Africa/Dar_es_Salaam", iso: "tz" },
  "Thailand": { ja: "タイ", tz: "Asia/Bangkok", iso: "th" },
  "Timor-Leste": { ja: "東ティモール", tz: "Asia/Dili", iso: "tl" },
  "Togo": { ja: "トーゴ", tz: "Africa/Lome", iso: "tg" },
  "Tonga": { ja: "トンガ", tz: "Pacific/Tongatapu", iso: "to" },
  "Trinidad and Tobago": { ja: "トリニダード・トバゴ", tz: "America/Port_of_Spain", iso: "tt" },
  "Tunisia": { ja: "チュニジア", tz: "Africa/Tunis", iso: "tn" },
  "Turkey": { ja: "トルコ", tz: "Europe/Istanbul", iso: "tr" },
  "Turkmenistan": { ja: "トルクメニスタン", tz: "Asia/Ashgabat", iso: "tm" },
  "Tuvalu": { ja: "ツバル", tz: "Pacific/Funafuti", iso: "tv" },
  "Uganda": { ja: "ウガンダ", tz: "Africa/Kampala", iso: "ug" },
  "Ukraine": { ja: "ウクライナ", tz: "Europe/Kyiv", iso: "ua" },
  "United Arab Emirates": { ja: "UAE", tz: "Asia/Dubai", iso: "ae" },
  "United Kingdom": { ja: "イギリス", tz: "Europe/London", iso: "gb" },
  "United States of America": { ja: "アメリカ合衆国", tz: "America/New_York", iso: "us" },
  "Uruguay": { ja: "ウルグアイ", tz: "America/Montevideo", iso: "uy" },
  "Uzbekistan": { ja: "ウズベキスタン", tz: "Asia/Tashkent", iso: "uz" },
  "Vanuatu": { ja: "バヌアツ", tz: "Pacific/Efate", iso: "vu" },
  "Vatican": { ja: "バチカン", tz: "Europe/Vatican", iso: "va" },
  "Venezuela": { ja: "ベネズエラ", tz: "America/Caracas", iso: "ve" },
  "Vietnam": { ja: "ベトナム", tz: "Asia/Ho_Chi_Minh", iso: "vn" },
  "Yemen": { ja: "イエメン", tz: "Asia/Aden", iso: "ye" },
  "Zambia": { ja: "ザンビア", tz: "Africa/Lusaka", iso: "zm" },
  "Zimbabwe": { ja: "ジンバブエ", tz: "Africa/Harare", iso: "zw" }
};

const multiZoneCities = {
  // --- 北米 ---
  "United States of America": [
    { name: "NY", fullName: "ニューヨーク", coordinates: [-74.006, 40.7128], tz: "America/New_York" }, 
    { name: "シカゴ", fullName: "シカゴ", coordinates: [-87.6298, 41.8781], tz: "America/Chicago" }, 
    { name: "デンバー", fullName: "デンバー", coordinates: [-104.9903, 39.7392], tz: "America/Denver" }, 
    { name: "LA", fullName: "ロサンゼルス", coordinates: [-118.2437, 34.0522], tz: "America/Los_Angeles" }, 
    { name: "アンカレッジ", fullName: "アンカレッジ", coordinates: [-149.9003, 61.2181], tz: "America/Anchorage" }, 
    { name: "ホノルル", fullName: "ホノルル", coordinates: [-157.8583, 21.3069], tz: "Pacific/Honolulu" } 
  ],
  "Canada": [
    { name: "セントジョンズ", fullName: "セントジョンズ", coordinates: [-52.7126, 47.5615], tz: "America/St_Johns" }, 
    { name: "ハリファックス", fullName: "ハリファックス", coordinates: [-63.5728, 44.6476], tz: "America/Halifax" }, 
    { name: "トロント", fullName: "トロント", coordinates: [-79.3832, 43.6532], tz: "America/Toronto" }, 
    { name: "ウィニペグ", fullName: "ウィニペグ", coordinates: [-97.1384, 49.8951], tz: "America/Winnipeg" }, 
    { name: "エドモントン", fullName: "エドモントン", coordinates: [-113.4909, 53.5444], tz: "America/Edmonton" }, 
    { name: "バンクーバー", fullName: "バンクーバー", coordinates: [-123.1207, 49.2827], tz: "America/Vancouver" } 
  ],
  "Mexico": [
    { name: "カンクン", fullName: "カンクン", coordinates: [-86.8515, 21.1619], tz: "America/Cancun" }, 
    { name: "メキシコシティ", fullName: "メキシコシティ", coordinates: [-99.1332, 19.4326], tz: "America/Mexico_City" }, 
    { name: "マサトラン", fullName: "マサトラン", coordinates: [-106.4246, 23.2494], tz: "America/Mazatlan" }, 
    { name: "ティフアナ", fullName: "ティフアナ", coordinates: [-117.0382, 32.5149], tz: "America/Tijuana" } 
  ],
  "Brazil": [
    { name: "ノローニャ", fullName: "フェルナンド・デ・ノローニャ", coordinates: [-32.4227, -3.8403], tz: "America/Noronha" },
    { name: "サンパウロ", fullName: "サンパウロ", coordinates: [-46.6333, -23.5505], tz: "America/Sao_Paulo" }, 
    { name: "マナウス", fullName: "マナウス", coordinates: [-60.0217, -3.1190], tz: "America/Manaus" }, 
    { name: "リオブランコ", fullName: "リオブランコ", coordinates: [-67.8100, -9.9747], tz: "America/Rio_Branco" } 
  ],
  "Chile": [
    { name: "サンティアゴ", fullName: "サンティアゴ", coordinates: [-70.6693, -33.4489], tz: "America/Santiago" }, 
    { name: "イースター島", fullName: "イースター島", coordinates: [-109.3496, -27.1127], tz: "Pacific/Easter" } 
  ],
  "Ecuador": [
    { name: "キト", fullName: "キト", coordinates: [-78.4678, -0.1807], tz: "America/Guayaquil" }, 
    { name: "ガラパゴス", fullName: "ガラパゴス", coordinates: [-90.3118, -0.9538], tz: "Pacific/Galapagos" } 
  ],
  "Russia": [
    { name: "カリーニングラード", fullName: "カリーニングラード", coordinates: [20.4522, 54.7104], tz: "Europe/Kaliningrad" }, 
    { name: "モスクワ", fullName: "モスクワ", coordinates: [37.6173, 55.7558], tz: "Europe/Moscow" }, 
    { name: "サマラ", fullName: "サマラ", coordinates: [50.1018, 53.1959], tz: "Europe/Samara" }, 
    { name: "エカテリンブルク", fullName: "エカテリンブルク", coordinates: [60.5975, 56.8389], tz: "Asia/Yekaterinburg" }, 
    { name: "オムスク", fullName: "オムスク", coordinates: [73.3686, 54.9885], tz: "Asia/Omsk" }, 
    { name: "ノボシビルスク", fullName: "ノボシビルスク", coordinates: [82.9204, 55.0084], tz: "Asia/Novosibirsk" }, 
    { name: "イルクーツク", fullName: "イルクーツク", coordinates: [104.2806, 52.2870], tz: "Asia/Irkutsk" }, 
    { name: "ヤクーツク", fullName: "ヤクーツク", coordinates: [129.7330, 62.0397], tz: "Asia/Yakutsk" }, 
    { name: "ウラジオ", fullName: "ウラジオストク", coordinates: [131.8869, 43.1198], tz: "Asia/Vladivostok" }, 
    { name: "マガダン", fullName: "マガダン", coordinates: [150.8011, 59.5612], tz: "Asia/Magadan" }, 
    { name: "カムチャツカ", fullName: "カムチャツカ", coordinates: [158.6510, 53.0368], tz: "Asia/Kamchatka" } 
  ],
  "Spain": [
    { name: "マドリード", fullName: "マドリード", coordinates: [-3.7038, 40.4168], tz: "Europe/Madrid" }, 
    { name: "カナリア諸島", fullName: "ラスパルマス", coordinates: [-15.4202, 28.1235], tz: "Atlantic/Canary" } 
  ],
  "Portugal": [
    { name: "リスボン", fullName: "リスボン", coordinates: [-9.1393, 38.7223], tz: "Europe/Lisbon" }, 
    { name: "アゾレス諸島", fullName: "ポンタ・デルガダ", coordinates: [-25.6687, 37.7412], tz: "Atlantic/Azores" } 
  ],
  "Australia": [
    { name: "シドニー", fullName: "シドニー", coordinates: [151.2093, -33.8688], tz: "Australia/Sydney" }, 
    { name: "アデレード", fullName: "アデレード", coordinates: [138.6007, -34.9285], tz: "Australia/Adelaide" }, 
    { name: "パース", fullName: "パース", coordinates: [115.8605, -31.9505], tz: "Australia/Perth" }, 
    { name: "ダーウィン", fullName: "ダーウィン", coordinates: [130.8456, -12.4634], tz: "Australia/Darwin" }, 
    { name: "ブリスベン", fullName: "ブリスベン", coordinates: [153.0251, -27.4698], tz: "Australia/Brisbane" } 
  ],
  "Indonesia": [
    { name: "ジャカルタ", fullName: "ジャカルタ", coordinates: [106.8229, -6.2088], tz: "Asia/Jakarta" }, 
    { name: "バリ", fullName: "バリ", coordinates: [115.1889, -8.4095], tz: "Asia/Makassar" }, 
    { name: "ジャヤプラ", fullName: "ジャヤプラ", coordinates: [140.7181, -2.5337], tz: "Asia/Jayapura" } 
  ],
  "Mongolia": [
    { name: "ホブド", fullName: "ホブド", coordinates: [91.6419, 48.0056], tz: "Asia/Hovd" }, 
    { name: "ウランバートル", fullName: "ウランバートル", coordinates: [106.9175, 47.9152], tz: "Asia/Ulaanbaatar" } 
  ],
  "Dem. Rep. Congo": [
    { name: "キンシャサ", fullName: "キンシャサ", coordinates: [15.2663, -4.4419], tz: "Africa/Kinshasa" }, 
    { name: "ルブンバシ", fullName: "ルブンバシ", coordinates: [27.4794, -11.6609], tz: "Africa/Lubumbashi" } 
  ],
  "Kiribati": [
    { name: "タラワ", fullName: "タラワ", coordinates: [173.0218, 1.4518], tz: "Pacific/Tarawa" }, 
    { name: "カントン島", fullName: "カントン島", coordinates: [-171.6738, -2.8105], tz: "Pacific/Enderbury" }, 
    { name: "キリスマス島", fullName: "キリスマス島", coordinates: [-157.4095, 1.8709], tz: "Pacific/Kiritimati" } 
  ],
  "Micronesia": [
    { name: "チューク", fullName: "チューク", coordinates: [151.8491, 7.4256], tz: "Pacific/Chuuk" },
    { name: "ポンペイ", fullName: "ポンペイ", coordinates: [158.2120, 6.8594], tz: "Pacific/Pohnpei" }
  ]
};

const getTimeIcon = (hour) => {
  if (hour >= 5 && hour < 10) return <Sunrise className="text-orange-400" size={40} />;
  if (hour >= 10 && hour < 16) return <Sun className="text-yellow-500" size={40} />;
  if (hour >= 16 && hour < 19) return <Sunset className="text-orange-500" size={40} />;
  if (hour >= 19 && hour < 24) return <Moon className="text-indigo-500" size={40} />;
  return <MoonStar className="text-slate-700" size={40} />;
};

export default function MapClock({ isAmPm }) {
  const [selectedLocation, setSelectedLocation] = useState({ name: "日本", tz: "Asia/Tokyo", engName: "Japan", iso: "jp" });
  const [cityTime, setCityTime] = useState("");
  const [cityDate, setCityDate] = useState("");
  const [currentHour, setCurrentHour] = useState(12);

  useEffect(() => {
    const updateTime = () => {
      try {
        const now = new Date();
        const timeFormatter = new Intl.DateTimeFormat('ja-JP', {
          timeZone: selectedLocation.tz,
          hour: '2-digit', minute: '2-digit', second: '2-digit',
          hour12: isAmPm
        });
        const dateFormatter = new Intl.DateTimeFormat('ja-JP', {
          timeZone: selectedLocation.tz, year: 'numeric', month: 'short', day: 'numeric', weekday: 'short'
        });

        setCityTime(timeFormatter.format(now));
        setCityDate(dateFormatter.format(now));

        const targetTime = new Date(now.toLocaleString('en-US', { timeZone: selectedLocation.tz }));
        setCurrentHour(targetTime.getHours());
      } catch (e) {
        setCityTime("--:--:--");
      }
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [selectedLocation, isAmPm]);

  const handleCountryClick = (geo) => {
    const engName = geo.properties.name;
    const data = countryData[engName];
    if (data) {
      setSelectedLocation({ name: data.ja, tz: data.tz, engName, iso: data.iso });
    } else {
      setSelectedLocation({ name: engName + " (UTC)", tz: "UTC", engName, iso: "" });
    }
  };

  const handleCityClick = (city, engName, e) => {
    e.stopPropagation();
    const data = countryData[engName];
    setSelectedLocation({ name: `${data.ja} (${city.fullName})`, tz: city.tz, engName, iso: data?.iso || "" });
  };

  return (
    <div className="flex flex-col w-full h-full">
      <div className="w-full bg-white border border-blue-100 rounded-2xl shadow-sm p-6 mb-4 flex items-center justify-center gap-8">
        <div className="flex flex-col items-end">
          
          {/* 国名と国旗を横並びで表示（国旗サイズを w-20 に拡大） */}
          <div className="flex items-center gap-4 mb-2">
            {selectedLocation.iso && (
              <img 
                src={`https://flagcdn.com/w160/${selectedLocation.iso}.png`} 
                alt="flag" 
                className="w-20 h-auto rounded shadow-sm border border-gray-200" 
              />
            )}
            <h2 className="text-4xl font-bold text-gray-800">{selectedLocation.name}</h2>
          </div>
          
          <span className="text-gray-500 font-medium text-lg">{cityDate}</span>
        </div>
        
        <div className="bg-blue-50 p-4 rounded-full shadow-inner">
          {getTimeIcon(currentHour)}
        </div>

        <div className="text-6xl font-black text-gray-800 tracking-wider font-mono tabular-nums">
          {cityTime}
        </div>
      </div>

      <div className="flex-1 w-full bg-[#f0f9ff] rounded-2xl border-2 border-blue-100 overflow-hidden shadow-inner min-h-[500px]">
        <ComposableMap 
          projection="geoEquirectangular" 
          projectionConfig={{ scale: 150, center: [0, 0] }} 
          width={1000} 
          height={500} 
          style={{ width: "100%", height: "100%" }}
        >
          <ZoomableGroup zoom={1} minZoom={1} maxZoom={8}>
            <Geographies geography={geoUrl}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const engName = geo.properties.name;
                  const data = countryData[engName];
                  const isSelected = selectedLocation.engName === engName;

                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      onClick={() => handleCountryClick(geo)}
                      fill={isSelected ? "#3b82f6" : "#cbd5e1"}
                      stroke="#ffffff"
                      strokeWidth={0.5}
                      style={{
                        default: { outline: "none" },
                        hover: { fill: "#60a5fa", outline: "none", cursor: "pointer" },
                        pressed: { outline: "none" },
                      }}
                    />
                  );
                })
              }
            </Geographies>

            {multiZoneCities[selectedLocation.engName] && multiZoneCities[selectedLocation.engName].map((city, idx) => {
              const isSelectedCity = selectedLocation.name.includes(city.fullName);
              
              return (
                <Marker key={idx} coordinates={city.coordinates} onClick={(e) => handleCityClick(city, selectedLocation.engName, e)}>
                  <circle 
                    r={isSelectedCity ? 6 : 4} 
                    fill={isSelectedCity ? "#ef4444" : "#fca5a5"} 
                    stroke="#fff" 
                    strokeWidth={1.5} 
                    className="cursor-pointer transition-all hover:scale-150 hover:fill-red-500"
                  >
                    <title>{city.fullName}</title>
                  </circle>
                  
                  {isSelectedCity && (
                    <text 
                      textAnchor="middle" 
                      y={-12} 
                      style={{ fontFamily: "sans-serif", fontSize: "14px", fill: "#1e293b", fontWeight: "900", stroke: "#ffffff", strokeWidth: 3, paintOrder: "stroke" }}
                    >
                      {city.name}
                    </text>
                  )}
                </Marker>
              );
            })}
          </ZoomableGroup>
        </ComposableMap>
      </div>
      <p className="text-gray-500 text-sm mt-3 text-center font-medium">※時差が複数ある国（アメリカ、ロシアなど）を選択すると赤いピンが表示され、都市ごとの時刻を確認できます。</p>
    </div>
  );
}