import { useState, useEffect } from 'react';
import { ComposableMap, Geographies, Geography, ZoomableGroup, Marker } from 'react-simple-maps';
import { Sunrise, Sun, Sunset, Moon, MoonStar, ArrowRightLeft } from 'lucide-react';

const geoUrl = "https://unpkg.com/world-atlas@2.0.2/countries-110m.json";

// 全世界対応版 countryData
const countryData = {
  "Afghanistan": { ja: "アフガニスタン", tz: "Asia/Kabul" },
  "Albania": { ja: "アルバニア", tz: "Europe/Tirane" },
  "Algeria": { ja: "アルジェリア", tz: "Africa/Algiers" },
  "Andorra": { ja: "アンドラ", tz: "Europe/Andorra" },
  "Angola": { ja: "アンゴラ", tz: "Africa/Luanda" },
  "Antigua and Barbuda": { ja: "アンティグア・バーブーダ", tz: "America/Antigua" },
  "Argentina": { ja: "アルゼンチン", tz: "America/Argentina/Buenos_Aires" },
  "Armenia": { ja: "アルメニア", tz: "Asia/Yerevan" },
  "Australia": { ja: "オーストラリア", tz: "Australia/Sydney" },
  "Austria": { ja: "オーストリア", tz: "Europe/Vienna" },
  "Azerbaijan": { ja: "アゼルバイジャン", tz: "Asia/Baku" },
  "Bahamas": { ja: "バハマ", tz: "America/Nassau" },
  "Bahrain": { ja: "バーレーン", tz: "Asia/Bahrain" },
  "Bangladesh": { ja: "バングラデシュ", tz: "Asia/Dhaka" },
  "Barbados": { ja: "バルバドス", tz: "America/Barbados" },
  "Belarus": { ja: "ベラルーシ", tz: "Europe/Minsk" },
  "Belgium": { ja: "ベルギー", tz: "Europe/Brussels" },
  "Belize": { ja: "ベリーズ", tz: "America/Belize" },
  "Benin": { ja: "ベナン", tz: "Africa/Porto-Novo" },
  "Bhutan": { ja: "ブータン", tz: "Asia/Thimphu" },
  "Bolivia": { ja: "ボリビア", tz: "America/La_Paz" },
  "Bosnia and Herz.": { ja: "ボスニア・ヘルツェゴビナ", tz: "Europe/Sarajevo" },
  "Botswana": { ja: "ボツワナ", tz: "Africa/Gaborone" },
  "Brazil": { ja: "ブラジル", tz: "America/Sao_Paulo" },
  "Brunei": { ja: "ブルネイ", tz: "Asia/Brunei" },
  "Bulgaria": { ja: "ブルガリア", tz: "Europe/Sofia" },
  "Burkina Faso": { ja: "ブルキナファソ", tz: "Africa/Ouagadougou" },
  "Burundi": { ja: "ブルンジ", tz: "Africa/Bujumbura" },
  "Cambodia": { ja: "カンボジア", tz: "Asia/Phnom_Penh" },
  "Cameroon": { ja: "カメルーン", tz: "Africa/Douala" },
  "Canada": { ja: "カナダ", tz: "America/Toronto" },
  "Cape Verde": { ja: "カーボベルデ", tz: "Atlantic/Cape_Verde" },
  "Central African Rep.": { ja: "中央アフリカ共和国", tz: "Africa/Bangui" },
  "Chad": { ja: "チャド", tz: "Africa/Ndjamena" },
  "Chile": { ja: "チリ", tz: "America/Santiago" },
  "China": { ja: "中国", tz: "Asia/Shanghai" },
  "Colombia": { ja: "コロンビア", tz: "America/Bogota" },
  "Comoros": { ja: "コモロ", tz: "Indian/Comoro" },
  "Congo": { ja: "コンゴ共和国", tz: "Africa/Brazzaville" },
  "Dem. Rep. Congo": { ja: "コンゴ民主共和国", tz: "Africa/Kinshasa" },
  "Costa Rica": { ja: "コスタリカ", tz: "America/Costa_Rica" },
  "Croatia": { ja: "クロアチア", tz: "Europe/Zagreb" },
  "Cuba": { ja: "キューバ", tz: "America/Havana" },
  "Cyprus": { ja: "キプロス", tz: "Asia/Nicosia" },
  "Czechia": { ja: "チェコ", tz: "Europe/Prague" },
  "Denmark": { ja: "デンマーク", tz: "Europe/Copenhagen" },
  "Djibouti": { ja: "ジブチ", tz: "Africa/Djibouti" },
  "Dominica": { ja: "ドミニカ国", tz: "America/Dominica" },
  "Dominican Rep.": { ja: "ドミニカ共和国", tz: "America/Santo_Domingo" },
  "Ecuador": { ja: "エクアドル", tz: "America/Guayaquil" },
  "Egypt": { ja: "エジプト", tz: "Africa/Cairo" },
  "El Salvador": { ja: "エルサルバドル", tz: "America/El_Salvador" },
  "Eq. Guinea": { ja: "赤道ギニア", tz: "Africa/Malabo" },
  "Eritrea": { ja: "エリトリア", tz: "Africa/Asmara" },
  "Estonia": { ja: "エストニア", tz: "Europe/Tallinn" },
  "Eswatini": { ja: "エスワティニ", tz: "Africa/Mbabane" },
  "Ethiopia": { ja: "エチオピア", tz: "Africa/Addis_Ababa" },
  "Fiji": { ja: "フィジー", tz: "Pacific/Fiji" },
  "Finland": { ja: "フィンランド", tz: "Europe/Helsinki" },
  "France": { ja: "フランス", tz: "Europe/Paris" },
  "Gabon": { ja: "ガボン", tz: "Africa/Libreville" },
  "Gambia": { ja: "ガンビア", tz: "Africa/Banjul" },
  "Georgia": { ja: "ジョージア", tz: "Asia/Tbilisi" },
  "Germany": { ja: "ドイツ", tz: "Europe/Berlin" },
  "Ghana": { ja: "ガーナ", tz: "Africa/Accra" },
  "Greece": { ja: "ギリシャ", tz: "Europe/Athens" },
  "Grenada": { ja: "グレナダ", tz: "America/Grenada" },
  "Guatemala": { ja: "グアテマラ", tz: "America/Guatemala" },
  "Guinea": { ja: "ギニア", tz: "Africa/Conakry" },
  "Guinea-Bissau": { ja: "ギニアビサウ", tz: "Africa/Bissau" },
  "Guyana": { ja: "ガイアナ", tz: "America/Guyana" },
  "Haiti": { ja: "ハイチ", tz: "America/Port-au-Prince" },
  "Honduras": { ja: "ホンジュラス", tz: "America/Tegucigalpa" },
  "Hungary": { ja: "ハンガリー", tz: "Europe/Budapest" },
  "Iceland": { ja: "アイスランド", tz: "Atlantic/Reykjavik" },
  "India": { ja: "インド", tz: "Asia/Kolkata" },
  "Indonesia": { ja: "インドネシア", tz: "Asia/Jakarta" },
  "Iran": { ja: "イラン", tz: "Asia/Tehran" },
  "Iraq": { ja: "イラク", tz: "Asia/Baghdad" },
  "Ireland": { ja: "アイルランド", tz: "Europe/Dublin" },
  "Israel": { ja: "イスラエル", tz: "Asia/Jerusalem" },
  "Italy": { ja: "イタリア", tz: "Europe/Rome" },
  "Jamaica": { ja: "ジャマイカ", tz: "America/Jamaica" },
  "Japan": { ja: "日本", tz: "Asia/Tokyo" },
  "Jordan": { ja: "ヨルダン", tz: "Asia/Amman" },
  "Kazakhstan": { ja: "カザフスタン", tz: "Asia/Almaty" },
  "Kenya": { ja: "ケニア", tz: "Africa/Nairobi" },
  "Kiribati": { ja: "キリバス", tz: "Pacific/Tarawa" },
  "Kuwait": { ja: "クウェート", tz: "Asia/Kuwait" },
  "Kyrgyzstan": { ja: "キルギス", tz: "Asia/Bishkek" },
  "Laos": { ja: "ラオス", tz: "Asia/Vientiane" },
  "Latvia": { ja: "ラトビア", tz: "Europe/Riga" },
  "Lebanon": { ja: "レバノン", tz: "Asia/Beirut" },
  "Lesotho": { ja: "レソト", tz: "Africa/Maseru" },
  "Liberia": { ja: "リベリア", tz: "Africa/Monrovia" },
  "Libya": { ja: "リビア", tz: "Africa/Tripoli" },
  "Liechtenstein": { ja: "リヒテンシュタイン", tz: "Europe/Vaduz" },
  "Lithuania": { ja: "リトアニア", tz: "Europe/Vilnius" },
  "Luxembourg": { ja: "ルクセンブルク", tz: "Europe/Luxembourg" },
  "Madagascar": { ja: "マダガスカル", tz: "Indian/Antananarivo" },
  "Malawi": { ja: "マラウイ", tz: "Africa/Blantyre" },
  "Malaysia": { ja: "マレーシア", tz: "Asia/Kuala_Lumpur" },
  "Maldives": { ja: "モルディブ", tz: "Indian/Maldives" },
  "Mali": { ja: "マリ", tz: "Africa/Bamako" },
  "Malta": { ja: "マルタ", tz: "Europe/Malta" },
  "Marshall Is.": { ja: "マーシャル諸島", tz: "Pacific/Majuro" },
  "Mauritania": { ja: "モーリタニア", tz: "Africa/Nouakchott" },
  "Mauritius": { ja: "モーリシャス", tz: "Indian/Mauritius" },
  "Mexico": { ja: "メキシコ", tz: "America/Mexico_City" },
  "Micronesia": { ja: "ミクロネシア", tz: "Pacific/Pohnpei" },
  "Moldova": { ja: "モルドバ", tz: "Europe/Chisinau" },
  "Monaco": { ja: "モナコ", tz: "Europe/Monaco" },
  "Mongolia": { ja: "モンゴル", tz: "Asia/Ulaanbaatar" },
  "Montenegro": { ja: "モンテネグロ", tz: "Europe/Podgorica" },
  "Morocco": { ja: "モロッコ", tz: "Africa/Casablanca" },
  "Mozambique": { ja: "モザンビーク", tz: "Africa/Maputo" },
  "Myanmar": { ja: "ミャンマー", tz: "Asia/Yangon" },
  "Namibia": { ja: "ナミビア", tz: "Africa/Windhoek" },
  "Nauru": { ja: "ナウル", tz: "Pacific/Nauru" },
  "Nepal": { ja: "ネパール", tz: "Asia/Kathmandu" },
  "Netherlands": { ja: "オランダ", tz: "Europe/Amsterdam" },
  "New Zealand": { ja: "ニュージーランド", tz: "Pacific/Auckland" },
  "Nicaragua": { ja: "ニカラグア", tz: "America/Managua" },
  "Niger": { ja: "ニジェール", tz: "Africa/Niamey" },
  "Nigeria": { ja: "ナイジェリア", tz: "Africa/Lagos" },
  "North Korea": { ja: "北朝鮮", tz: "Asia/Pyongyang" },
  "Macedonia": { ja: "北マケドニア", tz: "Europe/Skopje" },
  "Norway": { ja: "ノルウェー", tz: "Europe/Oslo" },
  "Oman": { ja: "オマーン", tz: "Asia/Muscat" },
  "Pakistan": { ja: "パキスタン", tz: "Asia/Karachi" },
  "Palau": { ja: "パラオ", tz: "Pacific/Palau" },
  "Palestine": { ja: "パレスチナ", tz: "Asia/Gaza" },
  "Panama": { ja: "パナマ", tz: "America/Panama" },
  "Papua New Guinea": { ja: "パプアニューギニア", tz: "Pacific/Port_Moresby" },
  "Paraguay": { ja: "パラグアイ", tz: "America/Asuncion" },
  "Peru": { ja: "ペルー", tz: "America/Lima" },
  "Philippines": { ja: "フィリピン", tz: "Asia/Manila" },
  "Poland": { ja: "ポーランド", tz: "Europe/Warsaw" },
  "Portugal": { ja: "ポルトガル", tz: "Europe/Lisbon" },
  "Qatar": { ja: "カタール", tz: "Asia/Qatar" },
  "Romania": { ja: "ルーマニア", tz: "Europe/Bucharest" },
  "Russia": { ja: "ロシア", tz: "Europe/Moscow" },
  "Rwanda": { ja: "ルワンダ", tz: "Africa/Kigali" },
  "Saint Kitts and Nevis": { ja: "セントクリストファー・ネイビス", tz: "America/St_Kitts" },
  "Saint Lucia": { ja: "セントルシア", tz: "America/St_Lucia" },
  "St. Vin. and Gren.": { ja: "セントビンセント・グレナディーン", tz: "America/St_Vincent" },
  "Samoa": { ja: "サモア", tz: "Pacific/Apia" },
  "San Marino": { ja: "サンマリノ", tz: "Europe/San_Marino" },
  "Sao Tome and Principe": { ja: "サントメ・プリンシペ", tz: "Africa/Sao_Tome" },
  "Saudi Arabia": { ja: "サウジアラビア", tz: "Asia/Riyadh" },
  "Senegal": { ja: "セネガル", tz: "Africa/Dakar" },
  "Serbia": { ja: "セルビア", tz: "Europe/Belgrade" },
  "Seychelles": { ja: "セーシェル", tz: "Indian/Mahe" },
  "Sierra Leone": { ja: "シエラレオネ", tz: "Africa/Freetown" },
  "Singapore": { ja: "シンガポール", tz: "Asia/Singapore" },
  "Slovakia": { ja: "スロバキア", tz: "Europe/Bratislava" },
  "Slovenia": { ja: "スロベニア", tz: "Europe/Ljubljana" },
  "Solomon Is.": { ja: "ソロモン諸島", tz: "Pacific/Guadalcanal" },
  "Somalia": { ja: "ソマリア", tz: "Africa/Mogadishu" },
  "South Africa": { ja: "南アフリカ", tz: "Africa/Johannesburg" },
  "South Korea": { ja: "韓国", tz: "Asia/Seoul" },
  "S. Sudan": { ja: "南スーダン", tz: "Africa/Juba" },
  "Spain": { ja: "スペイン", tz: "Europe/Madrid" },
  "Sri Lanka": { ja: "スリランカ", tz: "Asia/Colombo" },
  "Sudan": { ja: "スーダン", tz: "Africa/Khartoum" },
  "Suriname": { ja: "スリナム", tz: "America/Paramaribo" },
  "Sweden": { ja: "スウェーデン", tz: "Europe/Stockholm" },
  "Switzerland": { ja: "スイス", tz: "Europe/Zurich" },
  "Syria": { ja: "シリア", tz: "Asia/Damascus" },
  "Taiwan": { ja: "台湾", tz: "Asia/Taipei" },
  "Tajikistan": { ja: "タジキスタン", tz: "Asia/Dushanbe" },
  "Tanzania": { ja: "タンザニア", tz: "Africa/Dar_es_Salaam" },
  "Thailand": { ja: "タイ", tz: "Asia/Bangkok" },
  "Timor-Leste": { ja: "東ティモール", tz: "Asia/Dili" },
  "Togo": { ja: "トーゴ", tz: "Africa/Lome" },
  "Tonga": { ja: "トンガ", tz: "Pacific/Tongatapu" },
  "Trinidad and Tobago": { ja: "トリニダード・トバゴ", tz: "America/Port_of_Spain" },
  "Tunisia": { ja: "チュニジア", tz: "Africa/Tunis" },
  "Turkey": { ja: "トルコ", tz: "Europe/Istanbul" },
  "Turkmenistan": { ja: "トルクメニスタン", tz: "Asia/Ashgabat" },
  "Tuvalu": { ja: "ツバル", tz: "Pacific/Funafuti" },
  "Uganda": { ja: "ウガンダ", tz: "Africa/Kampala" },
  "Ukraine": { ja: "ウクライナ", tz: "Europe/Kyiv" },
  "United Arab Emirates": { ja: "UAE", tz: "Asia/Dubai" },
  "United Kingdom": { ja: "イギリス", tz: "Europe/London" },
  "United States of America": { ja: "アメリカ合衆国", tz: "America/New_York" },
  "Uruguay": { ja: "ウルグアイ", tz: "America/Montevideo" },
  "Uzbekistan": { ja: "ウズベキスタン", tz: "Asia/Tashkent" },
  "Vanuatu": { ja: "バヌアツ", tz: "Pacific/Efate" },
  "Vatican": { ja: "バチカン", tz: "Europe/Vatican" },
  "Venezuela": { ja: "ベネズエラ", tz: "America/Caracas" },
  "Vietnam": { ja: "ベトナム", tz: "Asia/Ho_Chi_Minh" },
  "Yemen": { ja: "イエメン", tz: "Asia/Aden" },
  "Zambia": { ja: "ザンビア", tz: "Africa/Lusaka" },
  "Zimbabwe": { ja: "ジンバブエ", tz: "Africa/Harare" }
};

// 国内で時差が異なる国の全タイムゾーン網羅版データ
const multiZoneCities = {
  // --- 北米 ---
  "United States of America": [
    { name: "NY", fullName: "ニューヨーク", coordinates: [-74.006, 40.7128], tz: "America/New_York" }, // 東部標準時
    { name: "シカゴ", fullName: "シカゴ", coordinates: [-87.6298, 41.8781], tz: "America/Chicago" }, // 中部標準時
    { name: "デンバー", fullName: "デンバー", coordinates: [-104.9903, 39.7392], tz: "America/Denver" }, // 山岳部標準時
    { name: "LA", fullName: "ロサンゼルス", coordinates: [-118.2437, 34.0522], tz: "America/Los_Angeles" }, // 太平洋標準時
    { name: "アンカレッジ", fullName: "アンカレッジ", coordinates: [-149.9003, 61.2181], tz: "America/Anchorage" }, // アラスカ標準時
    { name: "ホノルル", fullName: "ホノルル", coordinates: [-157.8583, 21.3069], tz: "Pacific/Honolulu" } // ハワイ・アリューシャン標準時
  ],
  "Canada": [
    { name: "セントジョンズ", fullName: "セントジョンズ", coordinates: [-52.7126, 47.5615], tz: "America/St_Johns" }, // ニューファンドランド標準時
    { name: "ハリファックス", fullName: "ハリファックス", coordinates: [-63.5728, 44.6476], tz: "America/Halifax" }, // 大西洋標準時
    { name: "トロント", fullName: "トロント", coordinates: [-79.3832, 43.6532], tz: "America/Toronto" }, // 東部標準時
    { name: "ウィニペグ", fullName: "ウィニペグ", coordinates: [-97.1384, 49.8951], tz: "America/Winnipeg" }, // 中部標準時
    { name: "エドモントン", fullName: "エドモントン", coordinates: [-113.4909, 53.5444], tz: "America/Edmonton" }, // 山岳部標準時
    { name: "バンクーバー", fullName: "バンクーバー", coordinates: [-123.1207, 49.2827], tz: "America/Vancouver" } // 太平洋標準時
  ],
  "Mexico": [
    { name: "カンクン", fullName: "カンクン", coordinates: [-86.8515, 21.1619], tz: "America/Cancun" }, // 南東部
    { name: "メキシコシティ", fullName: "メキシコシティ", coordinates: [-99.1332, 19.4326], tz: "America/Mexico_City" }, // 中部
    { name: "マサトラン", fullName: "マサトラン", coordinates: [-106.4246, 23.2494], tz: "America/Mazatlan" }, // 太平洋
    { name: "ティフアナ", fullName: "ティフアナ", coordinates: [-117.0382, 32.5149], tz: "America/Tijuana" } // 北西部
  ],

  // --- 南米 ---
  "Brazil": [
    { name: "ノローニャ", fullName: "フェルナンド・デ・ノローニャ", coordinates: [-32.4227, -3.8403], tz: "America/Noronha" },
    { name: "サンパウロ", fullName: "サンパウロ", coordinates: [-46.6333, -23.5505], tz: "America/Sao_Paulo" }, // ブラジリア時間
    { name: "マナウス", fullName: "マナウス", coordinates: [-60.0217, -3.1190], tz: "America/Manaus" }, // アマゾン時間
    { name: "リオブランコ", fullName: "リオブランコ", coordinates: [-67.8100, -9.9747], tz: "America/Rio_Branco" } // アクレ時間
  ],
  "Chile": [
    { name: "サンティアゴ", fullName: "サンティアゴ", coordinates: [-70.6693, -33.4489], tz: "America/Santiago" }, // 本土
    { name: "イースター島", fullName: "イースター島", coordinates: [-109.3496, -27.1127], tz: "Pacific/Easter" } // 離島
  ],
  "Ecuador": [
    { name: "キト", fullName: "キト", coordinates: [-78.4678, -0.1807], tz: "America/Guayaquil" }, // 本土
    { name: "ガラパゴス", fullName: "ガラパゴス", coordinates: [-90.3118, -0.9538], tz: "Pacific/Galapagos" } // 離島
  ],

  // --- ヨーロッパ・ロシア ---
  "Russia": [
    { name: "カリーニングラード", fullName: "カリーニングラード", coordinates: [20.4522, 54.7104], tz: "Europe/Kaliningrad" }, // UTC+2
    { name: "モスクワ", fullName: "モスクワ", coordinates: [37.6173, 55.7558], tz: "Europe/Moscow" }, // UTC+3
    { name: "サマラ", fullName: "サマラ", coordinates: [50.1018, 53.1959], tz: "Europe/Samara" }, // UTC+4
    { name: "エカテリンブルク", fullName: "エカテリンブルク", coordinates: [60.5975, 56.8389], tz: "Asia/Yekaterinburg" }, // UTC+5
    { name: "オムスク", fullName: "オムスク", coordinates: [73.3686, 54.9885], tz: "Asia/Omsk" }, // UTC+6
    { name: "ノボシビルスク", fullName: "ノボシビルスク", coordinates: [82.9204, 55.0084], tz: "Asia/Novosibirsk" }, // UTC+7
    { name: "イルクーツク", fullName: "イルクーツク", coordinates: [104.2806, 52.2870], tz: "Asia/Irkutsk" }, // UTC+8
    { name: "ヤクーツク", fullName: "ヤクーツク", coordinates: [129.7330, 62.0397], tz: "Asia/Yakutsk" }, // UTC+9
    { name: "ウラジオ", fullName: "ウラジオストク", coordinates: [131.8869, 43.1198], tz: "Asia/Vladivostok" }, // UTC+10
    { name: "マガダン", fullName: "マガダン", coordinates: [150.8011, 59.5612], tz: "Asia/Magadan" }, // UTC+11
    { name: "カムチャツカ", fullName: "カムチャツカ", coordinates: [158.6510, 53.0368], tz: "Asia/Kamchatka" } // UTC+12
  ],
  "Spain": [
    { name: "マドリード", fullName: "マドリード", coordinates: [-3.7038, 40.4168], tz: "Europe/Madrid" }, // 本土
    { name: "カナリア諸島", fullName: "ラスパルマス", coordinates: [-15.4202, 28.1235], tz: "Atlantic/Canary" } // 離島
  ],
  "Portugal": [
    { name: "リスボン", fullName: "リスボン", coordinates: [-9.1393, 38.7223], tz: "Europe/Lisbon" }, // 本土
    { name: "アゾレス諸島", fullName: "ポンタ・デルガダ", coordinates: [-25.6687, 37.7412], tz: "Atlantic/Azores" } // 離島
  ],

  // --- オセアニア・アジア ---
  "Australia": [
    { name: "シドニー", fullName: "シドニー", coordinates: [151.2093, -33.8688], tz: "Australia/Sydney" }, // 東部
    { name: "アデレード", fullName: "アデレード", coordinates: [138.6007, -34.9285], tz: "Australia/Adelaide" }, // 中部
    { name: "パース", fullName: "パース", coordinates: [115.8605, -31.9505], tz: "Australia/Perth" }, // 西部
    { name: "ダーウィン", fullName: "ダーウィン", coordinates: [130.8456, -12.4634], tz: "Australia/Darwin" }, // 北部（サマータイムなし）
    { name: "ブリスベン", fullName: "ブリスベン", coordinates: [153.0251, -27.4698], tz: "Australia/Brisbane" } // クイーンズランド（サマータイムなし）
  ],
  "Indonesia": [
    { name: "ジャカルタ", fullName: "ジャカルタ", coordinates: [106.8229, -6.2088], tz: "Asia/Jakarta" }, // 西部
    { name: "バリ", fullName: "バリ", coordinates: [115.1889, -8.4095], tz: "Asia/Makassar" }, // 中部
    { name: "ジャヤプラ", fullName: "ジャヤプラ", coordinates: [140.7181, -2.5337], tz: "Asia/Jayapura" } // 東部
  ],
  "Mongolia": [
    { name: "ホブド", fullName: "ホブド", coordinates: [91.6419, 48.0056], tz: "Asia/Hovd" }, // 西部
    { name: "ウランバートル", fullName: "ウランバートル", coordinates: [106.9175, 47.9152], tz: "Asia/Ulaanbaatar" } // 東部
  ],
  
  // --- アフリカ ---
  "Dem. Rep. Congo": [
    { name: "キンシャサ", fullName: "キンシャサ", coordinates: [15.2663, -4.4419], tz: "Africa/Kinshasa" }, // 西部
    { name: "ルブンバシ", fullName: "ルブンバシ", coordinates: [27.4794, -11.6609], tz: "Africa/Lubumbashi" } // 東部
  ],
  
  // --- 太平洋の島国（広大な海域にまたがる国） ---
  "Kiribati": [
    { name: "タラワ", fullName: "タラワ", coordinates: [173.0218, 1.4518], tz: "Pacific/Tarawa" }, // ギルバート諸島
    { name: "カントン島", fullName: "カントン島", coordinates: [-171.6738, -2.8105], tz: "Pacific/Enderbury" }, // フェニックス諸島
    { name: "キリスマス島", fullName: "キリスマス島", coordinates: [-157.4095, 1.8709], tz: "Pacific/Kiritimati" } // ライン諸島（日付変更線の最も東）
  ],
  "Micronesia": [
    { name: "チューク", fullName: "チューク", coordinates: [151.8491, 7.4256], tz: "Pacific/Chuuk" },
    { name: "ポンペイ", fullName: "ポンペイ", coordinates: [158.2120, 6.8594], tz: "Pacific/Pohnpei" }
  ]
};

const getTimeIcon = (hour) => {
  if (hour >= 5 && hour < 10) return <Sunrise className="text-orange-400" size={32} />;
  if (hour >= 10 && hour < 16) return <Sun className="text-yellow-500" size={32} />;
  if (hour >= 16 && hour < 19) return <Sunset className="text-orange-500" size={32} />;
  if (hour >= 19 && hour < 24) return <Moon className="text-indigo-500" size={32} />;
  return <MoonStar className="text-slate-700" size={32} />;
};

export default function CompareClock({ isAmPm }) {
  const [countryA, setCountryA] = useState({ name: "日本", tz: "Asia/Tokyo", engName: "Japan" });
  const [countryB, setCountryB] = useState({ name: "アメリカ合衆国", tz: "America/New_York", engName: "United States of America" });
  
  // 初期設定として国Aを選択状態（枠を青く）する
  const [nextUpdate, setNextUpdate] = useState('A');
  
  const [timeA, setTimeA] = useState("");
  const [timeB, setTimeB] = useState("");
  const [hourA, setHourA] = useState(12);
  const [hourB, setHourB] = useState(12);
  const [diffText, setDiffText] = useState("");

  useEffect(() => {
    const updateTime = () => {
      try {
        const now = new Date();
        const options = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: isAmPm };

        setTimeA(new Intl.DateTimeFormat('ja-JP', { timeZone: countryA.tz, ...options }).format(now));
        setTimeB(new Intl.DateTimeFormat('ja-JP', { timeZone: countryB.tz, ...options }).format(now));

        const tA = new Date(now.toLocaleString('en-US', { timeZone: countryA.tz }));
        const tB = new Date(now.toLocaleString('en-US', { timeZone: countryB.tz }));
        
        setHourA(tA.getHours());
        setHourB(tB.getHours());

        const diffHours = Math.round((tB - tA) / (1000 * 60 * 60));
        if (diffHours === 0) setDiffText("時差なし");
        else if (diffHours > 0) setDiffText(`右が +${diffHours}時間 進んでいます`);
        else setDiffText(`右が ${Math.abs(diffHours)}時間 遅れています`);
      } catch (e) {
        setTimeA("--:--:--"); setTimeB("--:--:--");
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [countryA, countryB, isAmPm]);

  const handleCountryClick = (geo) => {
    const engName = geo.properties.name;
    const data = countryData[engName];
    
    // 自動でA→Bと切り替わる機能を削除し、選択されている方のパネルだけを更新
    if (nextUpdate === 'A') {
      if (data) setCountryA({ name: data.ja, tz: data.tz, engName });
      else setCountryA({ name: engName, tz: "UTC", engName });
    } else {
      if (data) setCountryB({ name: data.ja, tz: data.tz, engName });
      else setCountryB({ name: engName, tz: "UTC", engName });
    }
  };

  const handleCityClick = (city, engName, target, e) => {
    e.stopPropagation();
    const newName = `${countryData[engName].ja} (${city.fullName})`;
    
    // 都市ピンのクリックも、自動切替を削除
    if (target === 'A') {
      setCountryA({ name: newName, tz: city.tz, engName });
    } else {
      setCountryB({ name: newName, tz: city.tz, engName });
    }
  };

  const activeMultiZones = [];
  if (multiZoneCities[countryA.engName]) activeMultiZones.push({ engName: countryA.engName, cities: multiZoneCities[countryA.engName], target: 'A' });
  if (multiZoneCities[countryB.engName] && countryA.engName !== countryB.engName) activeMultiZones.push({ engName: countryB.engName, cities: multiZoneCities[countryB.engName], target: 'B' });

  return (
    <div className="flex flex-col w-full h-full">
      <div className="w-full mb-4 flex items-center justify-between gap-4">
        
        {/* パネルに onClick を追加し、カーソルをポインターに変更 */}
        <div 
          onClick={() => setNextUpdate('A')}
          className={`cursor-pointer flex-1 bg-white rounded-2xl p-4 flex items-center justify-between shadow-sm border-2 transition-all ${nextUpdate === 'A' ? 'border-blue-500 ring-4 ring-blue-100' : 'border-gray-200 hover:border-blue-300 opacity-90'}`}
        >
          <div>
            <div className={`text-xs font-bold mb-1 ${nextUpdate === 'A' ? 'text-blue-500' : 'text-gray-400'}`}>
              国 A {nextUpdate === 'A' && '(選択中)'}
            </div>
            <h2 className="text-xl font-bold text-gray-800">{countryA.name}</h2>
          </div>
          <div className="flex items-center gap-4">
            {getTimeIcon(hourA)}
            <div className="text-4xl font-black text-gray-800 font-mono tabular-nums">{timeA}</div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center bg-blue-50 px-6 py-3 rounded-full border border-blue-200 shadow-sm whitespace-nowrap">
          <ArrowRightLeft className="text-blue-500 mb-1" size={20} />
          <span className="font-bold text-blue-700 text-sm">{diffText}</span>
        </div>

        {/* パネルに onClick を追加し、カーソルをポインターに変更 */}
        <div 
          onClick={() => setNextUpdate('B')}
          className={`cursor-pointer flex-1 bg-white rounded-2xl p-4 flex items-center justify-between shadow-sm border-2 transition-all ${nextUpdate === 'B' ? 'border-orange-500 ring-4 ring-orange-100' : 'border-gray-200 hover:border-orange-300 opacity-90'}`}
        >
          <div className="flex items-center gap-4">
            <div className="text-4xl font-black text-gray-800 font-mono tabular-nums">{timeB}</div>
            {getTimeIcon(hourB)}
          </div>
          <div className="text-right">
            <div className={`text-xs font-bold mb-1 ${nextUpdate === 'B' ? 'text-orange-500' : 'text-gray-400'}`}>
              {nextUpdate === 'B' && '(選択中) '}国 B
            </div>
            <h2 className="text-xl font-bold text-gray-800">{countryB.name}</h2>
          </div>
        </div>
      </div>

      <div className="flex-1 w-full bg-[#f0f9ff] rounded-2xl border-2 border-blue-100 overflow-hidden shadow-inner min-h-[450px]">
        <ComposableMap 
          projection="geoEquirectangular" 
          projectionConfig={{ scale: 150, center: [0, 0] }} 
          width={1000} 
          height={450} 
          style={{ width: "100%", height: "100%" }}
        >
          <ZoomableGroup zoom={1} minZoom={1} maxZoom={8}>
            <Geographies geography={geoUrl}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const engName = geo.properties.name;
                  const isA = countryA.engName === engName;
                  const isB = countryB.engName === engName;
                  
                  let fillColor = "#cbd5e1";
                  if (isA) fillColor = "#3b82f6"; // 青
                  if (isB) fillColor = "#f59e0b"; // オレンジ
                  if (isA && isB) fillColor = "#10b981"; // 重なった場合は緑

                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      onClick={() => handleCountryClick(geo)}
                      fill={fillColor}
                      stroke="#ffffff"
                      strokeWidth={0.5}
                      style={{
                        default: { outline: "none" },
                        hover: { fill: "#94a3b8", outline: "none", cursor: "pointer" },
                        pressed: { outline: "none" },
                      }}
                    />
                  );
                })
              }
            </Geographies>

            {/* 選択された国A・Bの都市ピンを表示 */}
            {activeMultiZones.flatMap(group => 
              group.cities.map((city, idx) => {
                // AのピンかBのピンかで、選択状態と色を出し分ける
                const isSelectedCity = group.target === 'A' 
                  ? countryA.name.includes(city.fullName) 
                  : countryB.name.includes(city.fullName);
                
                const activeColor = group.target === 'A' ? "#3b82f6" : "#f59e0b"; // 青 or オレンジ
                const inactiveColor = group.target === 'A' ? "#93c5fd" : "#fcd34d"; // 薄い青 or 薄いオレンジ

                return (
                  <Marker key={`${group.target}-${idx}`} coordinates={city.coordinates} onClick={(e) => handleCityClick(city, group.engName, group.target, e)}>
                    <circle 
                      r={isSelectedCity ? 6 : 4} 
                      fill={isSelectedCity ? activeColor : inactiveColor} 
                      stroke="#fff" 
                      strokeWidth={1.5} 
                      className="cursor-pointer transition-all hover:scale-150"
                    >
                      <title>{city.fullName}</title>
                    </circle>
                    
                    {/* 選択されている都市のみ、名前を地図上に表示 */}
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
              })
            )}
          </ZoomableGroup>
        </ComposableMap>
      </div>
    </div>
  );
}