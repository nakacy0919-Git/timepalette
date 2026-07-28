import { useState, useEffect, useMemo } from 'react';
import { ComposableMap, Geographies, Geography, ZoomableGroup, Marker } from 'react-simple-maps';
import { Home, Plus, X } from 'lucide-react';
import AnalogClock from './AnalogClock';

// ▼ 追加：作成した図鑑オーバーレイコンポーネントを読み込む
import CountryDetailOverlay from './CountryDetailOverlay';

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
  "United States of America": [
    { name: "NY", fullName: "New York", coordinates: [-74.006, 40.7128], tz: "America/New_York" }, 
    { name: "Chicago", fullName: "Chicago", coordinates: [-87.6298, 41.8781], tz: "America/Chicago" }, 
    { name: "Denver", fullName: "Denver", coordinates: [-104.9903, 39.7392], tz: "America/Denver" }, 
    { name: "LA", fullName: "Los Angeles", coordinates: [-118.2437, 34.0522], tz: "America/Los_Angeles" }, 
    { name: "Anchorage", fullName: "Anchorage", coordinates: [-149.9003, 61.2181], tz: "America/Anchorage" }, 
    { name: "Honolulu", fullName: "Honolulu", coordinates: [-157.8583, 21.3069], tz: "Pacific/Honolulu" } 
  ],
  "Canada": [
    { name: "St. John's", fullName: "St. John's", coordinates: [-52.7126, 47.5615], tz: "America/St_Johns" }, 
    { name: "Halifax", fullName: "Halifax", coordinates: [-63.5728, 44.6476], tz: "America/Halifax" }, 
    { name: "Toronto", fullName: "Toronto", coordinates: [-79.3832, 43.6532], tz: "America/Toronto" }, 
    { name: "Winnipeg", fullName: "Winnipeg", coordinates: [-97.1384, 49.8951], tz: "America/Winnipeg" }, 
    { name: "Edmonton", fullName: "Edmonton", coordinates: [-113.4909, 53.5444], tz: "America/Edmonton" }, 
    { name: "Vancouver", fullName: "Vancouver", coordinates: [-123.1207, 49.2827], tz: "America/Vancouver" } 
  ],
  "Mexico": [
    { name: "Cancun", fullName: "Cancun", coordinates: [-86.8515, 21.1619], tz: "America/Cancun" }, 
    { name: "Mexico City", fullName: "Mexico City", coordinates: [-99.1332, 19.4326], tz: "America/Mexico_City" }, 
    { name: "Mazatlan", fullName: "Mazatlan", coordinates: [-106.4246, 23.2494], tz: "America/Mazatlan" }, 
    { name: "Tijuana", fullName: "Tijuana", coordinates: [-117.0382, 32.5149], tz: "America/Tijuana" } 
  ],
  "Brazil": [
    { name: "Noronha", fullName: "Fernando de Noronha", coordinates: [-32.4227, -3.8403], tz: "America/Noronha" },
    { name: "Sao Paulo", fullName: "Sao Paulo", coordinates: [-46.6333, -23.5505], tz: "America/Sao_Paulo" }, 
    { name: "Manaus", fullName: "Manaus", coordinates: [-60.0217, -3.1190], tz: "America/Manaus" }, 
    { name: "Rio Branco", fullName: "Rio Branco", coordinates: [-67.8100, -9.9747], tz: "America/Rio_Branco" } 
  ],
  "Chile": [
    { name: "Santiago", fullName: "Santiago", coordinates: [-70.6693, -33.4489], tz: "America/Santiago" }, 
    { name: "Easter Island", fullName: "Easter Island", coordinates: [-109.3496, -27.1127], tz: "Pacific/Easter" } 
  ],
  "Ecuador": [
    { name: "Quito", fullName: "Quito", coordinates: [-78.4678, -0.1807], tz: "America/Guayaquil" }, 
    { name: "Galapagos", fullName: "Galapagos", coordinates: [-90.3118, -0.9538], tz: "Pacific/Galapagos" } 
  ],
  "Russia": [
    { name: "Kaliningrad", fullName: "Kaliningrad", coordinates: [20.4522, 54.7104], tz: "Europe/Kaliningrad" }, 
    { name: "Moscow", fullName: "Moscow", coordinates: [37.6173, 55.7558], tz: "Europe/Moscow" }, 
    { name: "Samara", fullName: "Samara", coordinates: [50.1018, 53.1959], tz: "Europe/Samara" }, 
    { name: "Yekaterinburg", fullName: "Yekaterinburg", coordinates: [60.5975, 56.8389], tz: "Asia/Yekaterinburg" }, 
    { name: "Omsk", fullName: "Omsk", coordinates: [73.3686, 54.9885], tz: "Asia/Omsk" }, 
    { name: "Novosibirsk", fullName: "Novosibirsk", coordinates: [82.9204, 55.0084], tz: "Asia/Novosibirsk" }, 
    { name: "Irkutsk", fullName: "Irkutsk", coordinates: [104.2806, 52.2870], tz: "Asia/Irkutsk" }, 
    { name: "Yakutsk", fullName: "Yakutsk", coordinates: [129.7330, 62.0397], tz: "Asia/Yakutsk" }, 
    { name: "Vladivostok", fullName: "Vladivostok", coordinates: [131.8869, 43.1198], tz: "Asia/Vladivostok" }, 
    { name: "Magadan", fullName: "Magadan", coordinates: [150.8011, 59.5612], tz: "Asia/Magadan" }, 
    { name: "Kamchatka", fullName: "Kamchatka", coordinates: [158.6510, 53.0368], tz: "Asia/Kamchatka" } 
  ],
  "Spain": [
    { name: "Madrid", fullName: "Madrid", coordinates: [-3.7038, 40.4168], tz: "Europe/Madrid" }, 
    { name: "Canary Is.", fullName: "Las Palmas", coordinates: [-15.4202, 28.1235], tz: "Atlantic/Canary" } 
  ],
  "Portugal": [
    { name: "Lisbon", fullName: "Lisbon", coordinates: [-9.1393, 38.7223], tz: "Europe/Lisbon" }, 
    { name: "Azores", fullName: "Ponta Delgada", coordinates: [-25.6687, 37.7412], tz: "Atlantic/Azores" } 
  ],
  "Australia": [
    { name: "Sydney", fullName: "Sydney", coordinates: [151.2093, -33.8688], tz: "Australia/Sydney" }, 
    { name: "Adelaide", fullName: "Adelaide", coordinates: [138.6007, -34.9285], tz: "Australia/Adelaide" }, 
    { name: "Perth", fullName: "Perth", coordinates: [115.8605, -31.9505], tz: "Australia/Perth" }, 
    { name: "Darwin", fullName: "Darwin", coordinates: [130.8456, -12.4634], tz: "Australia/Darwin" }, 
    { name: "Brisbane", fullName: "Brisbane", coordinates: [153.0251, -27.4698], tz: "Australia/Brisbane" } 
  ],
  "Indonesia": [
    { name: "Jakarta", fullName: "Jakarta", coordinates: [106.8229, -6.2088], tz: "Asia/Jakarta" }, 
    { name: "Bali", fullName: "Bali", coordinates: [115.1889, -8.4095], tz: "Asia/Makassar" }, 
    { name: "Jayapura", fullName: "Jayapura", coordinates: [140.7181, -2.5337], tz: "Asia/Jayapura" } 
  ],
  "Mongolia": [
    { name: "Hovd", fullName: "Hovd", coordinates: [91.6419, 48.0056], tz: "Asia/Hovd" }, 
    { name: "Ulaanbaatar", fullName: "Ulaanbaatar", coordinates: [106.9175, 47.9152], tz: "Asia/Ulaanbaatar" } 
  ],
  "Dem. Rep. Congo": [
    { name: "Kinshasa", fullName: "Kinshasa", coordinates: [15.2663, -4.4419], tz: "Africa/Kinshasa" }, 
    { name: "Lubumbashi", fullName: "Lubumbashi", coordinates: [27.4794, -11.6609], tz: "Africa/Lubumbashi" } 
  ],
  "Kiribati": [
    { name: "Tarawa", fullName: "Tarawa", coordinates: [173.0218, 1.4518], tz: "Pacific/Tarawa" }, 
    { name: "Kanton", fullName: "Kanton", coordinates: [-171.6738, -2.8105], tz: "Pacific/Enderbury" }, 
    { name: "Kiritimati", fullName: "Kiritimati", coordinates: [-157.4095, 1.8709], tz: "Pacific/Kiritimati" } 
  ],
  "Micronesia": [
    { name: "Chuuk", fullName: "Chuuk", coordinates: [151.8491, 7.4256], tz: "Pacific/Chuuk" },
    { name: "Pohnpei", fullName: "Pohnpei", coordinates: [158.2120, 6.8594], tz: "Pacific/Pohnpei" }
  ]
};

// 大陸判定関数
const getRegion = (tz, engName) => {
  if (!tz) return "Worldwide";
  if (tz.startsWith("Africa/")) return "Africa";
  if (tz.startsWith("Asia/")) return "Asia";
  if (tz.startsWith("Europe/")) return "Europe";
  if (tz.startsWith("Australia/") || tz.startsWith("Pacific/")) return "Australia/Pacific";
  if (tz.startsWith("America/")) {
    const southAmerica = ["Argentina", "Bolivia", "Brazil", "Chile", "Colombia", "Ecuador", "Guyana", "Paraguay", "Peru", "Suriname", "Uruguay", "Venezuela"];
    if (southAmerica.includes(engName)) return "South America";
    return "North America";
  }
  return "Worldwide";
};

// リスト表示用にデータを展開してA-Zソートする処理
const generateSortedLocations = () => {
  const list = [];
  Object.keys(countryData).forEach(countryEng => {
    const data = countryData[countryEng];
    if (multiZoneCities[countryEng]) {
      multiZoneCities[countryEng].forEach(city => {
        list.push({ country: countryEng, city: city.fullName, tz: city.tz, iso: data.iso, region: getRegion(city.tz, countryEng) });
      });
    } else {
      const cityExtracted = data.tz.split('/').pop().replace(/_/g, ' ');
      list.push({ country: countryEng, city: cityExtracted, tz: data.tz, iso: data.iso, region: getRegion(data.tz, countryEng) });
    }
  });

  return list.sort((a, b) => {
    if (a.country < b.country) return -1;
    if (a.country > b.country) return 1;
    return a.city.localeCompare(b.city);
  });
};

// ホーム画面のデフォルト時計
const defaultClocks = [
  { id: 'home', city: 'Nagoya / Tokyo', tz: 'Asia/Tokyo', iso: 'jp', isHome: true },
  { id: 'ny', city: 'New York', tz: 'America/New_York', iso: 'us' },
  { id: 'lon', city: 'London', tz: 'Europe/London', iso: 'gb' }
];

export default function MapClock({ isAmPm }) {
  const [personalClocks, setPersonalClocks] = useState(() => {
    const saved = localStorage.getItem('timepalette_clocks');
    return saved ? JSON.parse(saved) : defaultClocks;
  });
  const [isAddMode, setIsAddMode] = useState(false);
  const [activeRegion, setActiveRegion] = useState('Worldwide');
  const regions = ['Worldwide', 'Africa', 'North America', 'South America', 'Asia', 'Australia/Pacific', 'Europe'];
  
  const [currentTime, setCurrentTime] = useState(new Date());

  // ▼ 追加：図鑑オーバーレイを開くための状態管理
  const [detailIso, setDetailIso] = useState(null);

  const allLocationsList = useMemo(() => generateSortedLocations(), []);
  
  const filteredList = useMemo(() => {
    if (activeRegion === 'Worldwide') return allLocationsList;
    return allLocationsList.filter(loc => loc.region === activeRegion);
  }, [activeRegion, allLocationsList]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    localStorage.setItem('timepalette_clocks', JSON.stringify(personalClocks));
  }, [personalClocks]);

  const formatTime = (tz, formatStyle) => {
    try {
      if (formatStyle === 'list') {
        return new Intl.DateTimeFormat('en-US', { timeZone: tz, weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: isAmPm }).format(currentTime).replace(',', '');
      }
      if (formatStyle === 'personal') {
        return new Intl.DateTimeFormat('en-US', { timeZone: tz, weekday: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: isAmPm }).format(currentTime).replace(',', '');
      }
    } catch(e) {
      return "--:--";
    }
  };

  const handleMapClick = (engName, cityData = null) => {
    const data = countryData[engName];
    if (!data) return;

    // 通常時は図鑑オーバーレイを開く
    if (!isAddMode) {
      setDetailIso(data.iso);
      return;
    }

    // 「追加する」モードでは従来どおり時計を追加する
    const newCityName = cityData ? cityData.fullName : data.tz.split('/').pop().replace(/_/g, ' ');
    const newTz = cityData ? cityData.tz : data.tz;

    if (!personalClocks.find(c => c.tz === newTz)) {
      const newClock = {
        id: Date.now().toString(),
        city: newCityName,
        tz: newTz,
        iso: data.iso
      };
      setPersonalClocks([...personalClocks, newClock]);
    }
    setIsAddMode(false);
  };

  const removeClock = (id) => {
    setPersonalClocks(personalClocks.filter(c => c.id !== id));
  };

  // 画面上部の時計・日付表示用の関数
  const [headerTime, setHeaderTime] = useState("");
  const [headerDate, setHeaderDate] = useState("");
  // 選択中のエリア情報（デフォルトはローカルストレージの1番目か東京）
  const selectedHeaderLocation = personalClocks[0] || defaultClocks[0];

  useEffect(() => {
    try {
      const timeFormatter = new Intl.DateTimeFormat('ja-JP', {
        timeZone: selectedHeaderLocation.tz,
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: isAmPm
      });
      const dateFormatter = new Intl.DateTimeFormat('ja-JP', {
        timeZone: selectedHeaderLocation.tz, year: 'numeric', month: 'long', day: 'numeric', weekday: 'short'
      });
      setHeaderTime(timeFormatter.format(currentTime));
      setHeaderDate(dateFormatter.format(currentTime));
    } catch (e) {
      setHeaderTime("--:--:--");
    }
  }, [currentTime, selectedHeaderLocation, isAmPm]);

  return (
    <div className="flex flex-col w-full h-full gap-6 relative">
      
      {/* --- 上部：My Cities (Personal World Clock) --- */}
      <div className="w-full bg-white border border-gray-200 rounded-3xl shadow-sm p-6 relative">
        <div className="flex justify-between items-end mb-6 border-b pb-2">
          <h2 className="text-xl font-bold text-gray-800">My Cities (Personal World Clock)</h2>
          {isAddMode && <span className="text-sm font-bold text-blue-500 animate-pulse">地図から追加したい都市を選択してください...</span>}
        </div>

        <div className="flex flex-wrap gap-8 items-start">
          {personalClocks.map(clock => (
            <div 
              key={clock.id} 
              onClick={() => clock.iso && setDetailIso(clock.iso)}
              onKeyDown={(e) => {
                if ((e.key === 'Enter' || e.key === ' ') && clock.iso) {
                  e.preventDefault();
                  setDetailIso(clock.iso);
                }
              }}
              role="button"
              tabIndex={0}
              className="flex flex-col items-center group relative min-w-[140px] p-2 rounded-2xl cursor-pointer hover:bg-blue-50 transition-colors focus:outline-none focus:ring-4 focus:ring-blue-100"
            >
              {!clock.isHome && (
                <button onClick={(e) => { e.stopPropagation(); removeClock(clock.id); }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-red-600 shadow-md">
                  <X size={14} />
                </button>
              )}
              
              <div className="w-28 h-28 mb-4">
                <AnalogClock timeZone={clock.tz} />
              </div>
              
              <div className="flex items-center gap-2 mb-1">
                {clock.iso && <img src={`https://flagcdn.com/w20/${clock.iso}.png`} alt="flag" className="w-5 shadow-sm border border-gray-100 rounded-sm" />}
                <span className="font-bold text-lg text-gray-800">{clock.city}</span>
              </div>
              
              <div className="text-gray-500 text-sm flex items-center gap-1 font-mono">
                {clock.isHome && <Home size={14} className="text-blue-500 mb-0.5" />}
                {formatTime(clock.tz, 'personal')}
              </div>
            </div>
          ))}

          <button 
            onClick={() => setIsAddMode(!isAddMode)} 
            className={`w-28 h-28 rounded-full border-4 border-dashed flex flex-col items-center justify-center transition-all ${isAddMode ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-gray-200 bg-gray-50 text-gray-400 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-500'}`}
          >
            <Plus size={32} className="mb-1" />
            <span className="text-xs font-bold">{isAddMode ? 'キャンセル' : '追加する'}</span>
          </button>
        </div>
      </div>

      {/* --- 中段：世界地図 --- */}
      <div className={`flex-1 w-full bg-[#f0f9ff] rounded-3xl border-4 overflow-hidden shadow-inner min-h-[450px] transition-colors ${isAddMode ? 'border-blue-400 cursor-crosshair ring-4 ring-blue-100' : 'border-blue-100'}`}>
        <ComposableMap projection="geoEquirectangular" projectionConfig={{ scale: 150, center: [0, 0] }} width={1000} height={450} style={{ width: "100%", height: "100%" }}>
          <ZoomableGroup zoom={1} minZoom={1} maxZoom={8}>
            <Geographies geography={geoUrl}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const engName = geo.properties.name;
                  const hasData = !!countryData[engName];

                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      onClick={() => handleMapClick(engName)}
                      fill={hasData ? "#cbd5e1" : "#e2e8f0"}
                      stroke="#ffffff"
                      strokeWidth={0.5}
                      style={{
                        default: { outline: "none" },
                        hover: { fill: isAddMode && hasData ? "#60a5fa" : "#94a3b8", outline: "none" },
                        pressed: { outline: "none" },
                      }}
                    />
                  );
                })
              }
            </Geographies>

            {Object.keys(multiZoneCities).map(engName => (
              multiZoneCities[engName].map((city, idx) => (
                <Marker key={`${engName}-${idx}`} coordinates={city.coordinates} onClick={(e) => { e.stopPropagation(); handleMapClick(engName, city); }}>
                  <circle r={4} fill="#fca5a5" stroke="#fff" strokeWidth={1.5} className="transition-all hover:scale-150 hover:fill-red-500">
                    <title>{city.fullName}</title>
                  </circle>
                </Marker>
              ))
            ))}
          </ZoomableGroup>
        </ComposableMap>
      </div>

      {/* --- 下段：大陸別フィルタ & 世界時計リスト (4カラム A-Z) --- */}
      <div className="w-full bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="bg-[#3b82f6] text-white px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="font-bold text-xl">Current Local Times Around the World</h3>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="font-bold opacity-80 mr-2">Popular Lists:</span>
            {regions.map(region => (
              <button 
                key={region}
                onClick={() => setActiveRegion(region)}
                className={`px-3 py-1 rounded-full transition-colors ${activeRegion === region ? 'bg-white text-blue-600 font-bold shadow-sm' : 'hover:bg-blue-400 hover:bg-opacity-50 text-blue-50'}`}
              >
                {region}
              </button>
            ))}
          </div>
        </div>
        
        <div className="p-6 bg-slate-50">
          <div className="columns-1 sm:columns-2 lg:columns-4 gap-6 space-y-4">
            {filteredList.map((loc, idx) => (
              <div 
                key={`${loc.iso}-${loc.city}-${idx}`} 
                onClick={() => loc.iso && setDetailIso(loc.iso)}
                onKeyDown={(e) => {
                  if ((e.key === 'Enter' || e.key === ' ') && loc.iso) {
                    e.preventDefault();
                    setDetailIso(loc.iso);
                  }
                }}
                role="button"
                tabIndex={0}
                className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg shadow-sm break-inside-avoid hover:border-blue-300 hover:bg-blue-50 hover:shadow-md transition-all cursor-pointer focus:outline-none focus:ring-4 focus:ring-blue-100"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  {loc.iso ? (
                    <img 
                      src={`https://flagcdn.com/w40/${loc.iso}.png`} 
                      alt="flag" 
                      className="w-8 h-auto rounded-sm shadow-sm border border-gray-200 shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-5 bg-gray-200 rounded-sm shrink-0"></div>
                  )}
                  <span className="font-bold text-blue-700 hover:underline truncate text-sm">
                    {loc.country}, {loc.city}
                  </span>
                </div>
                <div className="font-mono text-gray-700 font-bold text-sm shrink-0 ml-2">
                  {formatTime(loc.tz, 'list')}
                </div>
              </div>
            ))}
          </div>
          
          {filteredList.length === 0 && (
            <div className="text-center text-gray-400 py-10 font-bold">
              このエリアに該当する都市データがありません。
            </div>
          )}
        </div>
      </div>

      {/* ▼ 追加：図鑑オーバーレイの呼び出し部分 */}
      {detailIso && (
        <CountryDetailOverlay 
          iso={detailIso} 
          onClose={() => setDetailIso(null)} 
        />
      )}

    </div>
  );
}