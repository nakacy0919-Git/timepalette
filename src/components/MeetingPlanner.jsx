import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  CalendarDays,
  Clock3,
  Copy,
  Globe2,
  Link2,
  MapPin,
  Plus,
  Share2,
  Sun,
  Sunrise,
  Sunset,
  Moon,
  Users,
  X,
  ChevronDown,
Search,
Check,
} from 'lucide-react';


import {
  countryData,
} from './MapClock';

import {
  multiZoneCities,
} from './CompareClock';

// ==============================
// Country / City data helpers
// ==============================

// 地図データ側の英語名を、表示用の自然な国名に直す
const COUNTRY_NAME_ALIASES = {
  'Bosnia and Herz.': 'Bosnia and Herzegovina',
  'Central African Rep.': 'Central African Republic',
  'Dem. Rep. Congo': 'Democratic Republic of the Congo',
  'Dominican Rep.': 'Dominican Republic',
  'Eq. Guinea': 'Equatorial Guinea',
  'Macedonia': 'North Macedonia',
  'Marshall Is.': 'Marshall Islands',
  'Solomon Is.': 'Solomon Islands',
  'S. Sudan': 'South Sudan',
  'St. Vin. and Gren.': 'Saint Vincent and the Grenadines',
  'United States of America': 'United States',
};


// 都市名を英語表示するときの補正
const CITY_NAME_OVERRIDES = {
  'America/St_Johns': "St. John's",
  'America/Mexico_City': 'Mexico City',
  'America/Rio_Branco': 'Rio Branco',
  'America/Sao_Paulo': 'Sao Paulo',
  'America/Noronha': 'Fernando de Noronha',

  'Asia/Ulaanbaatar': 'Ulaanbaatar',
  'Asia/Yekaterinburg': 'Yekaterinburg',
  'Asia/Makassar': 'Bali / Central Indonesia',

  'Atlantic/Canary': 'Canary Islands',
  'Atlantic/Azores': 'Azores',

  'Pacific/Easter': 'Easter Island',
  'Pacific/Galapagos': 'Galapagos',
  'Pacific/Kiritimati': 'Kiritimati',
  'Pacific/Enderbury': 'Kanton Island',
  'Pacific/Kanton': 'Kanton Island',
  'Pacific/Pohnpei': 'Pohnpei',
  'Pacific/Chuuk': 'Chuuk',
};


// countryData を Meeting Planner 用の配列に変換
const COUNTRIES = Object.entries(countryData)
  .map(([key, data]) => ({
    key,
    nameEn:
      COUNTRY_NAME_ALIASES[key] || key,

    nameJa:
      data.ja,

    timeZone:
      data.tz,

    iso:
      data.iso || '',
  }))
  .sort((a, b) =>
    a.nameEn.localeCompare(b.nameEn)
  );


// keyから国情報をすぐ取得できるようにする
const COUNTRY_BY_KEY = Object.fromEntries(
  COUNTRIES.map((country) => [
    country.key,
    country,
  ])
);


// Time Zoneから都市名らしい文字列を作る
const humanizeZone = (timeZone) => {
  if (CITY_NAME_OVERRIDES[timeZone]) {
    return CITY_NAME_OVERRIDES[timeZone];
  }

  const last =
    timeZone.split('/').pop() || timeZone;

  return last.replace(/_/g, ' ');
};


// 選択した国に複数Time Zoneがある場合は都市一覧を返す
const getLocationChoices = (countryKey) => {
  const country = COUNTRY_BY_KEY[countryKey];

  if (!country) return [];

  const cities =
    multiZoneCities[countryKey];

  // 複数タイムゾーン国
  if (cities?.length) {
    return cities.map((city) => ({
      cityJa:
        city.fullName || city.name,
      cityEn:
        humanizeZone(city.tz),
      timeZone:
        city.tz,
    }));
  }

  // 通常の1タイムゾーン国
  return [
    {
      cityJa: '',
      cityEn: '',
      timeZone:
        country.timeZone,
    },
  ];
};


// 国 + 都市 / Time Zoneから1件のLocation情報を作成
const buildLocation = (
  countryKey,
  timeZone
) => {
  const country =
    COUNTRY_BY_KEY[countryKey];

  if (!country) return null;

  const choices =
    getLocationChoices(countryKey);

  const choice =
    choices.find(
      (item) =>
        item.timeZone === timeZone
    ) || choices[0];

  return {
    countryKey,
    iso:
  country.iso,

    countryEn:
      country.nameEn,

    countryJa:
      country.nameJa,

    cityEn:
      choice?.cityEn || '',

    cityJa:
      choice?.cityJa || '',

    timeZone:
      choice?.timeZone ||
      country.timeZone,
  };
};


// 一覧表の英語表示
const locationTitle = (location) => {
  if (location.cityEn) {
    return `${location.cityEn}, ${location.countryEn}`;
  }

  return location.countryEn;
};


// 一覧表の日本語表示
const locationSubtitle = (location) => {
  if (location.cityJa) {
    return `${location.cityJa}・${location.countryJa}`;
  }

  return location.countryJa;
};

const CountryFlag = ({
  iso,
  countryName,
  size = 'md',
}) => {
  const sizeClass =
    size === 'lg'
      ? 'w-10 h-7'
      : 'w-8 h-6';

  if (!iso) {
    return (
      <div
        className={`${sizeClass} rounded bg-slate-100 flex items-center justify-center`}
      >
        <Globe2
          size={16}
          className="text-slate-400"
        />
      </div>
    );
  }

  return (
    <img
      src={`https://flagcdn.com/w80/${iso.toLowerCase()}.png`}
      alt={`${countryName} flag`}
      className={`${sizeClass} object-cover rounded shadow-sm border border-slate-200`}
      loading="lazy"
    />
  );
};


const CountrySelect = ({
  value,
  onChange,
  placeholder = 'Choose country...',
}) => {
  const [open, setOpen] =
    useState(false);

  const [search, setSearch] =
    useState('');

  const containerRef =
    useRef(null);

  const selectedCountry =
    COUNTRY_BY_KEY[value];


  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener(
      'mousedown',
      handleOutsideClick
    );

    return () => {
      document.removeEventListener(
        'mousedown',
        handleOutsideClick
      );
    };
  }, []);


  const filteredCountries =
    COUNTRIES.filter((country) => {
      const keyword =
        search
          .trim()
          .toLowerCase();

      if (!keyword) {
        return true;
      }

      return (
        country.nameEn
          .toLowerCase()
          .includes(keyword) ||
        country.nameJa
          .toLowerCase()
          .includes(keyword)
      );
    });


  const selectCountry = (countryKey) => {
    onChange(countryKey);
    setOpen(false);
    setSearch('');
  };


  return (
    <div
      ref={containerRef}
      className="relative w-full"
    >
      {/* Selected country */}

      <button
        type="button"
        onClick={() =>
          setOpen(
            (current) => !current
          )
        }
        className="w-full min-h-[50px] px-4 py-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between gap-3 text-left hover:border-blue-300 transition"
      >
        {selectedCountry ? (
          <div className="flex items-center gap-3 min-w-0">

            <CountryFlag
              iso={selectedCountry.iso}
              countryName={selectedCountry.nameEn}
            />

            <div className="min-w-0">

              <div className="font-black text-slate-800 truncate">
                {selectedCountry.nameEn}
              </div>

              <div className="text-xs text-slate-400 truncate">
                {selectedCountry.nameJa}
              </div>

            </div>

          </div>
        ) : (
          <span className="font-bold text-slate-600">
            {placeholder}
          </span>
        )}


        <ChevronDown
          size={18}
          className={`shrink-0 text-slate-400 transition-transform ${
            open
              ? 'rotate-180'
              : ''
          }`}
        />
      </button>


      {/* Dropdown */}

      {open && (

  <div
    className="fixed inset-0 z-[99999] bg-slate-900/30 backdrop-blur-[2px] flex items-center justify-center p-4"
    onClick={(event) => {
      if (
        event.target === event.currentTarget
      ) {
        setOpen(false);
        setSearch('');
      }
    }}
  >

    <div className="w-full max-w-2xl max-h-[78vh] bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col">

      {/* Header */}

      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">

        <div>

          <p className="text-xs font-black tracking-wider text-blue-500 uppercase">
            Select Location
          </p>

          <h3 className="text-xl font-black text-slate-900">
            Choose a country
          </h3>

        </div>


        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setSearch('');
          }}
          className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
        >
          <X size={20} />
        </button>

      </div>


      {/* Search */}

      <div className="p-4 border-b border-slate-100 bg-white">

        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100">

          <Search
            size={19}
            className="text-slate-400 shrink-0"
          />

          <input
            autoFocus
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Search country..."
            className="w-full bg-transparent outline-none text-base font-bold text-slate-700 placeholder:text-slate-400"
          />

        </div>

      </div>


      {/* Country list */}

      <div className="flex-1 overflow-y-auto p-3">

        {filteredCountries.map(
          (country) => {

            const selected =
              country.key === value;

            return (

              <button
                type="button"
                key={country.key}
                onClick={() =>
                  selectCountry(
                    country.key
                  )
                }
                className={`w-full px-4 py-3 rounded-2xl flex items-center gap-4 text-left transition mb-1 ${
                  selected
                    ? 'bg-blue-50 border border-blue-100'
                    : 'border border-transparent hover:bg-slate-50'
                }`}
              >

                <div className="w-12 flex justify-center shrink-0">

                  <CountryFlag
                    iso={country.iso}
                    countryName={country.nameEn}
                    size="lg"
                  />

                </div>


                <div className="flex-1 min-w-0">

                  <div className="font-black text-slate-900 text-base truncate">
                    {country.nameEn}
                  </div>

                  <div className="text-sm text-slate-400 truncate">
                    {country.nameJa}
                  </div>

                </div>


                {selected && (

                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">

                    <Check
                      size={17}
                    />

                  </div>

                )}

              </button>

            );

          }
        )}


        {filteredCountries.length === 0 && (

          <div className="py-16 text-center">

            <Globe2
              size={36}
              className="mx-auto text-slate-300 mb-3"
            />

            <p className="font-bold text-slate-500">
              No countries found
            </p>

          </div>

        )}

      </div>

    </div>

  </div>

)}

    </div>
  );
};

// ==============================
// Time Zone calculation helpers
// ==============================

// 指定Time Zoneの年月日・時分秒を取得
const getZonedParts = (
  date,
  timeZone
) => {
  const formatter =
    new Intl.DateTimeFormat(
      'en-US',
      {
        timeZone,

        year: 'numeric',
        month: '2-digit',
        day: '2-digit',

        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',

        hourCycle: 'h23',
      }
    );

  const parts =
    Object.fromEntries(
      formatter
        .formatToParts(date)
        .filter(
          (part) =>
            part.type !== 'literal'
        )
        .map((part) => [
          part.type,
          part.value,
        ])
    );

  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),

    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
  };
};


// UTCとの差を分単位で取得
const getOffsetMinutes = (
  date,
  timeZone
) => {
  const parts =
    getZonedParts(
      date,
      timeZone
    );

  const representedAsUtc =
    Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second
    );

  return Math.round(
    (
      representedAsUtc -
      date.getTime()
    ) /
      60000
  );
};


// 「2026-10-23 11:50 Japan」などを
// 正しいUTC時刻へ変換
const zonedDateTimeToUtc = (
  dateString,
  timeString,
  timeZone
) => {
  const [
    year,
    month,
    day,
  ] =
    dateString
      .split('-')
      .map(Number);

  const [
    hour,
    minute,
  ] =
    timeString
      .split(':')
      .map(Number);

  const wallClockAsUtc =
    Date.UTC(
      year,
      month - 1,
      day,
      hour,
      minute,
      0
    );

  let offset =
    getOffsetMinutes(
      new Date(
        wallClockAsUtc
      ),
      timeZone
    );

  let utc =
    wallClockAsUtc -
    offset * 60000;


  // DST切り替え付近の再補正
  const correctedOffset =
    getOffsetMinutes(
      new Date(utc),
      timeZone
    );

  if (
    correctedOffset !== offset
  ) {
    offset =
      correctedOffset;

    utc =
      wallClockAsUtc -
      offset * 60000;
  }

  return new Date(utc);
};


// 日付を1日進める
const addDays = (
  dateString,
  days
) => {
  const date =
    new Date(
      `${dateString}T00:00:00Z`
    );

  date.setUTCDate(
    date.getUTCDate() +
      days
  );

  return date
    .toISOString()
    .slice(0, 10);
};


// HH:MM を「分」に変換
const minutesFromClock = (
  value
) => {
  const [
    hour,
    minute,
  ] =
    value
      .split(':')
      .map(Number);

  return (
    hour * 60 +
    minute
  );
};


// Date parts → YYYY-MM-DD
const dateKeyFromParts = (
  parts
) =>
  `${parts.year}-${String(
    parts.month
  ).padStart(
    2,
    '0'
  )}-${String(
    parts.day
  ).padStart(
    2,
    '0'
  )}`;


// 日本の今日の日付
const getTodayInTokyo = () =>
  dateKeyFromParts(
    getZonedParts(
      new Date(),
      'Asia/Tokyo'
    )
  );


// 24時間表記
const formatClock = (
  date,
  timeZone
) =>
  new Intl.DateTimeFormat(
    'en-GB',
    {
      timeZone,

      hour: '2-digit',
      minute: '2-digit',

      hourCycle: 'h23',
    }
  ).format(date);


// 日付表示
const formatDate = (
  date,
  timeZone
) =>
  new Intl.DateTimeFormat(
    'en-US',
    {
      timeZone,

      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }
  ).format(date);


// 時差表示
const formatDifference = (
  minutes
) => {
  if (minutes === 0) {
    return 'BASE';
  }

  const sign =
    minutes > 0
      ? '+'
      : '−';

  const absolute =
    Math.abs(minutes);

  const hours =
    Math.floor(
      absolute / 60
    );

  const mins =
    absolute % 60;


  if (
    hours &&
    mins
  ) {
    return `${sign}${hours}h ${mins}m`;
  }

  if (hours) {
    return `${sign}${hours}h`;
  }

  return `${sign}${mins}m`;
};
// ==============================
// Day relation / visual helpers
// ==============================

const getDayRelation = (
  date,
  timeZone,
  baseDateKey
) => {
  const localKey =
    dateKeyFromParts(
      getZonedParts(
        date,
        timeZone
      )
    );

  const localMidnight =
    Date.parse(
      `${localKey}T00:00:00Z`
    );

  const baseMidnight =
    Date.parse(
      `${baseDateKey}T00:00:00Z`
    );

  const difference =
    Math.round(
      (
        localMidnight -
        baseMidnight
      ) /
        86400000
    );


  if (difference < 0) {
    return {
      label: 'Previous day',
      ja: '前日',
      tone:
        'bg-rose-50 text-rose-600 border-rose-200',
    };
  }


  if (difference > 0) {
    return {
      label: 'Next day',
      ja: '翌日',
      tone:
        'bg-violet-50 text-violet-600 border-violet-200',
    };
  }


  return {
    label: 'Same day',
    ja: '同日',
    tone:
      'bg-slate-50 text-slate-500 border-slate-200',
  };
};


// 時間帯ごとの表示
const getDayPart = (
  hour
) => {
  if (
    hour >= 5 &&
    hour < 9
  ) {
    return {
      label:
        'Early morning',

      icon:
        Sunrise,

      tone:
        'text-orange-500 bg-orange-50',
    };
  }


  if (
    hour >= 9 &&
    hour < 12
  ) {
    return {
      label:
        'Morning',

      icon:
        Sun,

      tone:
        'text-amber-500 bg-amber-50',
    };
  }


  if (
    hour >= 12 &&
    hour < 17
  ) {
    return {
      label:
        'Daytime',

      icon:
        Sun,

      tone:
        'text-yellow-600 bg-yellow-50',
    };
  }


  if (
    hour >= 17 &&
    hour < 20
  ) {
    return {
      label:
        'Evening',

      icon:
        Sunset,

      tone:
        'text-orange-600 bg-orange-50',
    };
  }


  return {
    label:
      'Night',

    icon:
      Moon,

    tone:
      'text-indigo-500 bg-indigo-50',
  };
};


// ==============================
// Share URL helpers
// ==============================

// JSONをURLに入れられる文字列に変換
const encodePayload = (
  payload
) => {
  const bytes =
    new TextEncoder()
      .encode(
        JSON.stringify(
          payload
        )
      );

  let binary = '';


  bytes.forEach(
    (byte) => {
      binary +=
        String.fromCharCode(
          byte
        );
    }
  );


  return btoa(binary)
    .replace(
      /\+/g,
      '-'
    )
    .replace(
      /\//g,
      '_'
    )
    .replace(
      /=+$/g,
      ''
    );
};


// URL文字列をJSONへ戻す
const decodePayload = (
  encoded
) => {
  try {
    const padded =
      encoded
        .replace(
          /-/g,
          '+'
        )
        .replace(
          /_/g,
          '/'
        ) +
      '='.repeat(
        (
          4 -
          (
            encoded.length %
            4
          )
        ) %
          4
      );


    const binary =
      atob(padded);


    const bytes =
      Uint8Array.from(
        binary,
        (character) =>
          character.charCodeAt(
            0
          )
      );


    return JSON.parse(
      new TextDecoder()
        .decode(bytes)
    );
  } catch (error) {
    console.error(
      'Failed to decode meeting link:',
      error
    );

    return null;
  }
};


// URLの #meeting=... を読み取る
const parseSharedMeeting = () => {
  if (
    typeof window ===
    'undefined'
  ) {
    return null;
  }


  const match =
    window.location.hash.match(
      /(?:^#|&)meeting=([^&]+)/
    );


  if (!match) {
    return null;
  }


  return decodePayload(
    match[1]
  );
};


// 共有URLから読み込んだLocationを正規化
const normalizeSharedLocation = (
  location
) => {
  const rebuilt =
    buildLocation(
      location.countryKey,
      location.timeZone
    );


  if (rebuilt) {
    return rebuilt;
  }


  return {
    countryKey:
      location.countryKey ||
      'Unknown',

      iso:
  location.iso ||
  COUNTRY_BY_KEY[
    location.countryKey
  ]?.iso ||
  '',

    countryEn:
      location.countryEn ||
      location.countryKey ||
      'Unknown',

    countryJa:
      location.countryJa ||
      '',

    cityEn:
      location.cityEn ||
      '',

    cityJa:
      location.cityJa ||
      '',

    timeZone:
      location.timeZone ||
      'UTC',
  };
};


// ==============================
// Main component
// ==============================

export default function MeetingPlanner() {

  // 共有リンクから開かれたか確認
  const sharedMeeting =
    useMemo(
      () =>
        parseSharedMeeting(),
      []
    );


  // Session名
  const [
    sessionName,
    setSessionName,
  ] =
    useState(
      sharedMeeting?.name ||
      'International Online Session'
    );


  // 日付
  const [
    date,
    setDate,
  ] =
    useState(
      sharedMeeting?.date ||
      getTodayInTokyo()
    );


  // 開始時間
  const [
    startTime,
    setStartTime,
  ] =
    useState(
      sharedMeeting?.start ||
      '10:00'
    );


  // 終了時間
  const [
    endTime,
    setEndTime,
  ] =
    useState(
      sharedMeeting?.end ||
      '11:00'
    );


  // 基準国
  const [
    baseCountryKey,
    setBaseCountryKey,
  ] =
    useState(
      sharedMeeting
        ?.base
        ?.countryKey ||
      'Japan'
    );


  // 基準都市 / Time Zone
  const [
    baseTimeZone,
    setBaseTimeZone,
  ] =
    useState(
      sharedMeeting
        ?.base
        ?.timeZone ||
      'Asia/Tokyo'
    );


  // 参加地点
  const [
    locations,
    setLocations,
  ] =
    useState(
      (
        sharedMeeting
          ?.locations ||
        []
      ).map(
        normalizeSharedLocation
      )
    );


  // 新規追加用の国
  const [
    addCountryKey,
    setAddCountryKey,
  ] =
    useState('');


  // 新規追加用Time Zone
  const [
    addTimeZone,
    setAddTimeZone,
  ] =
    useState('');


  // setup / timetable
  const [
    mode,
    setMode,
  ] =
    useState(
      sharedMeeting
        ? 'timetable'
        : 'setup'
    );


  // 共有リンク閲覧モード
  const [
    sharedView,
    setSharedView,
  ] =
    useState(
      Boolean(
        sharedMeeting
      )
    );


  // Share modal
  const [
    shareOpen,
    setShareOpen,
  ] =
    useState(false);


  // Copy表示
  const [
    copyStatus,
    setCopyStatus,
  ] =
    useState('');


  // ==============================
  // Base location
  // ==============================

  const baseChoices =
    getLocationChoices(
      baseCountryKey
    );


  const baseLocation =
    buildLocation(
      baseCountryKey,
      baseTimeZone
    ) ||
    buildLocation(
      'Japan',
      'Asia/Tokyo'
    );


  // ==============================
  // Add location
  // ==============================

  const addChoices =
    addCountryKey
      ? getLocationChoices(
          addCountryKey
        )
      : [];
        // ==============================
  // Build timetable
  // ==============================

  const timetable =
    useMemo(() => {

      // 基準地点の開始時間をUTCへ変換
      const startUtc =
        zonedDateTimeToUtc(
          date,
          startTime,
          baseLocation.timeZone
        );


      // 終了時間が開始時間より前なら
      // 日をまたぐSessionとして翌日にする
      const endDate =
        minutesFromClock(
          endTime
        ) <=
        minutesFromClock(
          startTime
        )
          ? addDays(
              date,
              1
            )
          : date;


      // 基準地点の終了時間をUTCへ変換
      const endUtc =
        zonedDateTimeToUtc(
          endDate,
          endTime,
          baseLocation.timeZone
        );


      // 基準地点の「日付」
      const baseDateKey =
        dateKeyFromParts(
          getZonedParts(
            startUtc,
            baseLocation.timeZone
          )
        );


      // 基準地点のUTC差
      const baseOffset =
        getOffsetMinutes(
          startUtc,
          baseLocation.timeZone
        );


      // 基準地点 + 参加地点
      const allLocations = [
  {
    ...baseLocation,

    iso:
      baseLocation.iso ||
      COUNTRY_BY_KEY[
        baseLocation.countryKey
      ]?.iso ||
      '',

    isBase: true,
  },

  ...locations.map(
    (location) => ({
      ...location,

      iso:
        location.iso ||
        COUNTRY_BY_KEY[
          location.countryKey
        ]?.iso ||
        '',

      isBase: false,
    })
  ),
];


      // 各地点の時刻を計算
      return allLocations.map(
        (location) => {

          const startParts =
            getZonedParts(
              startUtc,
              location.timeZone
            );


          const localOffset =
            getOffsetMinutes(
              startUtc,
              location.timeZone
            );


          return {
            ...location,

            // 開始時刻
            startLabel:
              formatClock(
                startUtc,
                location.timeZone
              ),

            // 終了時刻
            endLabel:
              formatClock(
                endUtc,
                location.timeZone
              ),

            // 現地日付
            dateLabel:
              formatDate(
                startUtc,
                location.timeZone
              ),

            // 基準地点との時差
            differenceMinutes:
              localOffset -
              baseOffset,

            // 前日 / 同日 / 翌日
            dayRelation:
              getDayRelation(
                startUtc,
                location.timeZone,
                baseDateKey
              ),

            // 朝 / 昼 / 夕方 / 夜
            dayPart:
              getDayPart(
                startParts.hour
              ),
          };
        }
      );

    }, [
      date,
      startTime,
      endTime,
      baseLocation.countryKey,
      baseLocation.timeZone,
      locations,
    ]);


  // ==============================
  // Viewer local time
  // ==============================

  // 共有URLを開いた先生自身の
  // ブラウザの現地時刻
  const viewerLocal =
    useMemo(() => {

      if (!sharedMeeting) {
        return null;
      }


      try {
        const viewerTimeZone =
          Intl
            .DateTimeFormat()
            .resolvedOptions()
            .timeZone;


        const startUtc =
          zonedDateTimeToUtc(
            date,
            startTime,
            baseLocation.timeZone
          );


        const endDate =
          minutesFromClock(
            endTime
          ) <=
          minutesFromClock(
            startTime
          )
            ? addDays(
                date,
                1
              )
            : date;


        const endUtc =
          zonedDateTimeToUtc(
            endDate,
            endTime,
            baseLocation.timeZone
          );


        return {
          timeZone:
            viewerTimeZone,

          start:
            formatClock(
              startUtc,
              viewerTimeZone
            ),

          end:
            formatClock(
              endUtc,
              viewerTimeZone
            ),

          date:
            formatDate(
              startUtc,
              viewerTimeZone
            ),
        };

      } catch {
        return null;
      }

    }, [
      sharedMeeting,
      date,
      startTime,
      endTime,
      baseLocation.timeZone,
    ]);


  // ==============================
  // Event handlers
  // ==============================

  const handleBaseCountryChange = (
    countryKey
  ) => {

    setBaseCountryKey(
      countryKey
    );


    const choices =
      getLocationChoices(
        countryKey
      );


    // 国を変更したら
    // その国の最初の都市を自動選択
    if (choices[0]) {
      setBaseTimeZone(
        choices[0].timeZone
      );
    }
  };


  const handleAddCountryChange = (
    countryKey
  ) => {

    setAddCountryKey(
      countryKey
    );


    const choices =
      getLocationChoices(
        countryKey
      );


    setAddTimeZone(
      choices[0]
        ?.timeZone ||
      ''
    );
  };


  // ==============================
  // Add participating location
  // ==============================

  const addLocation = () => {

    if (
      !addCountryKey ||
      !addTimeZone ||
      locations.length >= 30
    ) {
      return;
    }


    const location =
      buildLocation(
        addCountryKey,
        addTimeZone
      );


    if (!location) {
      return;
    }


    // 同じ国・都市がすでにあるか
    const duplicate =
      locations.some(
        (item) =>
          item.countryKey ===
            location.countryKey &&
          item.timeZone ===
            location.timeZone
      );


    // Base locationと同じか
    const sameAsBase =
      baseLocation.countryKey ===
        location.countryKey &&
      baseLocation.timeZone ===
        location.timeZone;


    if (
      !duplicate &&
      !sameAsBase
    ) {

      setLocations(
        (current) => [
          ...current,
          location,
        ]
      );
    }


    // Add欄をリセット
    setAddCountryKey('');
    setAddTimeZone('');
  };


  // ==============================
  // Remove location
  // ==============================

  const removeLocation = (
    index
  ) => {

    setLocations(
      (current) =>
        current.filter(
          (
            _,
            itemIndex
          ) =>
            itemIndex !==
            index
        )
    );
  };


  // ==============================
  // Build serverless share URL
  // ==============================

  const buildShareUrl = () => {

    const payload = {

      // Version
      v: 1,


      // Session
      name:
        sessionName.trim() ||
        'International Online Session',

      date,

      start:
        startTime,

      end:
        endTime,


      // Base location
      base: {
        countryKey:
          baseLocation.countryKey,

        timeZone:
          baseLocation.timeZone,
      },


      // Participating locations
      locations:
  locations.map(
    (location) => ({
      countryKey:
        location.countryKey,

      iso:
        location.iso ||
        COUNTRY_BY_KEY[
          location.countryKey
        ]?.iso ||
        '',

      timeZone:
        location.timeZone,

      countryEn:
        location.countryEn,

      countryJa:
        location.countryJa,

      cityEn:
        location.cityEn,

      cityJa:
        location.cityJa,
    })
  ),
    };


    // 現在のURLを取得
    const url =
      new URL(
        window.location.href
      );


    // #meeting=xxxx の形で保存
    url.hash =
      `meeting=${encodePayload(
        payload
      )}`;


    return url.toString();
  };


  // ==============================
  // Copy share link
  // ==============================

  const copyShareLink =
    async () => {

      const url =
        buildShareUrl();


      try {

        await navigator
          .clipboard
          .writeText(
            url
          );


        setCopyStatus(
          'Copied!'
        );


        setTimeout(
          () =>
            setCopyStatus(
              ''
            ),
          1800
        );

      } catch {

        // Clipboard APIが使えない場合
        window.prompt(
          'Copy this link:',
          url
        );
      }
    };


  // ==============================
  // Native Share
  // ==============================

  const shareMeeting =
    async () => {

      const url =
        buildShareUrl();


      // iPhone / iPad / Androidなど
      // Web Share API対応時
      if (
        navigator.share
      ) {

        try {

          await navigator.share(
            {
              title:
                sessionName,

              text:
                `${sessionName} - International Meeting Timetable`,

              url,
            }
          );


          return;

        } catch (
          error
        ) {

          // ユーザーが共有画面を閉じた場合
          if (
            error?.name ===
            'AbortError'
          ) {
            return;
          }
        }
      }


      // PCなどShare APIがない場合はCopy
      await copyShareLink();
    };


  // ==============================
  // Exit shared view
  // ==============================

  const exitSharedView = () => {

    // URLの #meeting=... を削除
    window.history
      .replaceState(
        null,
        '',
        `${window.location.pathname}${window.location.search}`
      );


    setSharedView(false);

    setMode(
      'setup'
    );
  };
    // ==============================
  // UI
  // ==============================

  return (
    <div className="w-full h-full overflow-y-auto pb-10">

      <div className="max-w-6xl mx-auto space-y-5">

        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">

          {/* ==============================
              Header
          ============================== */}

          <div className="px-6 md:px-8 py-6 border-b border-slate-100 bg-gradient-to-r from-blue-50 via-white to-indigo-50">

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">

              <div className="flex items-center gap-3">

                <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md">
                  <Globe2 size={24} />
                </div>

                <div>

                  <h1 className="text-2xl md:text-3xl font-black text-slate-900">
                    International Meeting Planner
                  </h1>

                  <p className="text-slate-500 font-medium">
                    各国・各都市のオンライン交流時間を一つの表で確認・共有
                  </p>

                </div>

              </div>


              {/* Edit / Timetable switch */}

              
            </div>


            {/* Step indicator */}

            <div className="mt-6 grid grid-cols-3 gap-2 max-w-2xl">

              {[
                [
                  '1',
                  'Pick date & locations',
                ],

                [
                  '2',
                  'View timetable',
                ],

                [
                  '3',
                  'Share link',
                ],
              ].map(
                (
                  [
                    number,
                    label,
                  ],
                  index
                ) => {

                  const active =
                    sharedView
                      ? index <= 2
                      : mode ===
                          'timetable'
                        ? index <= 1
                        : index === 0;


                  return (
                    <div
                      key={
                        number
                      }
                      className="flex items-center gap-2 min-w-0"
                    >

                      <div
                        className={`w-7 h-7 shrink-0 rounded-full flex items-center justify-center text-xs font-black ${
                          active
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-200 text-slate-500'
                        }`}
                      >
                        {number}
                      </div>


                      <span
                        className={`hidden sm:block text-xs md:text-sm font-bold truncate ${
                          active
                            ? 'text-slate-700'
                            : 'text-slate-400'
                        }`}
                      >
                        {label}
                      </span>

                    </div>
                  );
                }
              )}

            </div>

          </div>


          {/* ==============================
              Viewer Local Time
          ============================== */}

          {sharedView &&
            viewerLocal && (

              <div className="mx-6 md:mx-8 mt-6 p-4 rounded-2xl bg-blue-50 border border-blue-100 flex flex-col md:flex-row md:items-center justify-between gap-3">

                <div>

                  <p className="text-xs font-black tracking-wider text-blue-500 uppercase">
                    Your browser&apos;s local time
                  </p>


                  <p className="font-black text-slate-800 text-lg">

                    {viewerLocal.start}

                    {' – '}

                    {viewerLocal.end}

                    {' '}

                    <span className="text-sm text-slate-500 font-bold">
                      {
                        viewerLocal.date
                      }
                    </span>

                  </p>

                </div>


                <span className="font-mono text-xs font-bold text-blue-600 bg-white px-3 py-2 rounded-xl border border-blue-100">
                  {
                    viewerLocal.timeZone
                  }
                </span>

              </div>
            )}


          {/* ==============================
              SETUP MODE
          ============================== */}

          {!sharedView &&
          mode === 'setup' ? (

            <div className="p-6 md:p-8 space-y-8">


              {/* ==============================
                  1. Session
              ============================== */}

              <section>

                <div className="flex items-center gap-2 mb-4">

                  <CalendarDays
                    className="text-blue-500"
                    size={20}
                  />

                  <h2 className="font-black text-slate-800 text-lg">
                    1. Session
                  </h2>

                </div>


                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">


                  {/* Session name */}

                  <label className="md:col-span-2 lg:col-span-4">

                    <span className="block text-xs font-bold text-slate-500 mb-1.5">
                      Session name
                    </span>


                    <input
                      value={
                        sessionName
                      }
                      onChange={(
                        event
                      ) =>
                        setSessionName(
                          event
                            .target
                            .value
                        )
                      }
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
                      placeholder="Global Classroom Vol.155"
                    />

                  </label>


                  {/* Date */}

                  <label>

                    <span className="block text-xs font-bold text-slate-500 mb-1.5">
                      Date
                    </span>


                    <input
                      type="date"
                      value={date}
                      onChange={(
                        event
                      ) =>
                        setDate(
                          event
                            .target
                            .value
                        )
                      }
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 font-bold text-slate-800"
                    />

                  </label>


                  {/* Start */}

                  <label>

                    <span className="block text-xs font-bold text-slate-500 mb-1.5">
                      Start
                    </span>


                    <input
                      type="time"
                      value={
                        startTime
                      }
                      onChange={(
                        event
                      ) =>
                        setStartTime(
                          event
                            .target
                            .value
                        )
                      }
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 font-bold text-slate-800"
                    />

                  </label>


                  {/* End */}

                  <label>

                    <span className="block text-xs font-bold text-slate-500 mb-1.5">
                      End
                    </span>


                    <input
                      type="time"
                      value={
                        endTime
                      }
                      onChange={(
                        event
                      ) =>
                        setEndTime(
                          event
                            .target
                            .value
                        )
                      }
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 font-bold text-slate-800"
                    />

                  </label>


                  {/* DST info */}

                  <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 flex items-center gap-2 text-slate-600">

                    <Clock3
                      size={18}
                    />

                    <span className="text-sm font-bold">
                      DST auto-adjusted
                    </span>

                  </div>

                </div>

              </section>


              {/* ==============================
                  2. Base Location
              ============================== */}

              <section className="pt-2 border-t border-slate-100">

                <div className="flex items-center gap-2 mb-4 mt-5">

                  <MapPin
                    className="text-blue-500"
                    size={20}
                  />

                  <h2 className="font-black text-slate-800 text-lg">
                    2. Base location
                  </h2>

                </div>


                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">


                  {/* Country */}

                  <CountrySelect
  value={baseCountryKey}
  onChange={
    handleBaseCountryChange
  }
/>


                  {/* City / Time zone */}

                  <select
                    value={
                      baseTimeZone
                    }
                    onChange={(
                      event
                    ) =>
                      setBaseTimeZone(
                        event
                          .target
                          .value
                      )
                    }
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white font-bold text-slate-800"
                  >

                    {baseChoices.map(
                      (
                        choice
                      ) => (

                        <option
                          key={
                            choice.timeZone
                          }
                          value={
                            choice.timeZone
                          }
                        >

                          {choice.cityEn
                            ? `${choice.cityEn} / ${choice.cityJa}`
                            : `Single time zone · ${choice.timeZone}`}

                        </option>

                      )
                    )}

                  </select>

                </div>

              </section>


              {/* ==============================
                  3. Participating Locations
              ============================== */}

              <section className="pt-2 border-t border-slate-100">

                <div className="flex items-center justify-between gap-3 mb-4 mt-5">

                  <div className="flex items-center gap-2">

                    <Users
                      className="text-blue-500"
                      size={20}
                    />

                    <h2 className="font-black text-slate-800 text-lg">
                      3. Participating locations
                    </h2>

                  </div>


                  <span className="text-xs font-black text-slate-400 bg-slate-100 px-3 py-1.5 rounded-full">
                    {
                      locations.length
                    }{' '}
                    / 30
                  </span>

                </div>


                {/* Add box */}

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3">


                  {/* Country */}

                  <CountrySelect
  value={addCountryKey}
  onChange={
    handleAddCountryChange
  }
  placeholder="Choose country..."
/>

                  {/* City */}

                  <select
                    value={
                      addTimeZone
                    }
                    onChange={(
                      event
                    ) =>
                      setAddTimeZone(
                        event
                          .target
                          .value
                      )
                    }
                    disabled={
                      !addCountryKey
                    }
                    className="px-4 py-3 rounded-xl border border-slate-200 bg-white font-bold text-slate-800 disabled:bg-slate-100 disabled:text-slate-400"
                  >

                    {!addCountryKey && (
                      <option value="">
                        Choose city / zone...
                      </option>
                    )}


                    {addChoices.map(
                      (
                        choice
                      ) => (

                        <option
                          key={
                            choice.timeZone
                          }
                          value={
                            choice.timeZone
                          }
                        >

                          {choice.cityEn
                            ? `${choice.cityEn} / ${choice.cityJa}`
                            : `Single time zone · ${choice.timeZone}`}

                        </option>

                      )
                    )}

                  </select>


                  {/* Add button */}

                  <button
                    onClick={
                      addLocation
                    }
                    disabled={
                      !addCountryKey ||
                      !addTimeZone ||
                      locations.length >=
                        30
                    }
                    className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black flex items-center justify-center gap-2 disabled:bg-slate-300 disabled:cursor-not-allowed"
                  >

                    <Plus
                      size={18}
                    />

                    Add

                  </button>

                </div>


                {/* Selected Locations */}

                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">

                  {locations.map(
                    (
                      location,
                      index
                    ) => (

                      <div
                        key={`${location.countryKey}-${location.timeZone}`}
                        className="bg-white rounded-2xl border border-slate-200 px-4 py-3 flex items-center gap-3 shadow-sm"
                      >

                        <div className="w-12 shrink-0 flex items-center justify-center">

  <CountryFlag
    iso={location.iso}
    countryName={location.countryEn}
    size="lg"
  />

</div>


                        <div className="min-w-0 flex-1">

                          <p className="font-black text-slate-800 truncate">

                            {
                              locationTitle(
                                location
                              )
                            }

                          </p>


                          <p className="text-xs text-slate-500 font-medium truncate">

                            {
                              locationSubtitle(
                                location
                              )
                            }

                            {' · '}

                            {
                              location.timeZone
                            }

                          </p>

                        </div>


                        <button
                          onClick={() =>
                            removeLocation(
                              index
                            )
                          }
                          className="p-2 rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50"
                          title="Remove"
                        >

                          <X
                            size={18}
                          />

                        </button>

                      </div>

                    )
                  )}


                  {locations.length ===
                    0 && (

                    <div className="md:col-span-2 py-8 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">

                      <Globe2
                        size={28}
                        className="mx-auto mb-2 opacity-60"
                      />

                      <p className="font-bold">
                        Add participating countries or cities above.
                      </p>

                    </div>

                  )}

                </div>

              </section>


              {/* Show timetable */}

              <div className="flex justify-end pt-2">

                <button
                  onClick={() =>
                    setMode(
                      'timetable'
                    )
                  }
                  className="px-7 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-lg shadow-md flex items-center gap-2"
                >

                  <Globe2
                    size={20}
                  />

                  Show Timetable

                </button>

              </div>

            </div>

          ) : (

            /* ==============================
                TIMETABLE MODE
            ============================== */

            <div className="p-6 md:p-8">


              {/* Timetable title */}

              <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 mb-6">

                <div>

                  <p className="text-xs font-black tracking-[0.18em] text-blue-500 uppercase mb-2">
                    International Session
                  </p>


                  <h2 className="text-2xl md:text-3xl font-black text-slate-900">

                    {sessionName}

                  </h2>


                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-bold text-slate-500">

                    <span className="flex items-center gap-1.5">

                      <CalendarDays
                        size={16}
                      />

                      {date}

                    </span>


                    <span className="flex items-center gap-1.5">

                      <Clock3
                        size={16}
                      />

                      {startTime}

                      {' – '}

                      {endTime}

                      {' ('}

                      {
                        locationTitle(
                          baseLocation
                        )
                      }

                      {')'}

                    </span>


                    <span className="flex items-center gap-1.5">

                      <Users
                        size={16}
                      />

                      {
                        timetable.length
                      }

                      {' locations'}

                    </span>

                  </div>

                </div>


                <div className="flex flex-wrap gap-2">

                  {sharedView ? (

                    <button
                      onClick={
                        exitSharedView
                      }
                      className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-50"
                    >
                      Edit a copy
                    </button>

                  ) : (

                    <button
                      onClick={() =>
                        setMode(
                          'setup'
                        )
                      }
                      className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-50"
                    >
                      Edit locations
                    </button>

                  )}


                  <button
                    onClick={() =>
                      setShareOpen(
                        true
                      )
                    }
                    className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black flex items-center gap-2 shadow-sm"
                  >

                    <Link2
                      size={18}
                    />

                    Share

                  </button>

                </div>

              </div>


              {/* ==============================
                  Timetable
              ============================== */}

              <div className="overflow-x-auto rounded-2xl border border-slate-200">

                <table className="w-full min-w-[780px] bg-white">

                  <thead>

                    <tr className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">

                      <th className="px-5 py-3 font-black">
                        Location
                      </th>

                      <th className="px-5 py-3 font-black">
                        Local date
                      </th>

                      <th className="px-5 py-3 font-black">
                        Local time
                      </th>

                      <th className="px-5 py-3 font-black">
                        Day part
                      </th>

                      <th className="px-5 py-3 font-black">
                        Difference
                      </th>

                    </tr>

                  </thead>


                  <tbody className="divide-y divide-slate-100">

                    {timetable.map(
                      (row) => {

                        const DayIcon =
                          row.dayPart.icon;


                        return (

                          <tr
                            key={`${row.countryKey}-${row.timeZone}-${row.isBase ? 'base' : 'guest'}`}
                            className={
                              row.isBase
                                ? 'bg-blue-50/60'
                                : 'hover:bg-slate-50/70'
                            }
                          >


                            {/* Location */}

                            <td className="px-5 py-4">

                              <div className="flex items-center gap-3">

                                <div className="w-12 shrink-0 flex items-center justify-center">

  <CountryFlag
    iso={row.iso}
    countryName={row.countryEn}
    size="lg"
  />

</div>


                                <div>

                                  <p className="font-black text-slate-900">

                                    {
                                      locationTitle(
                                        row
                                      )
                                    }


                                    {row.isBase && (

                                      <span className="ml-2 text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full">
                                        BASE
                                      </span>

                                    )}

                                  </p>


                                  <p className="text-xs text-slate-500 font-medium">

                                    {
                                      locationSubtitle(
                                        row
                                      )
                                    }

                                  </p>

                                </div>

                              </div>

                            </td>


                            {/* Date */}

                            <td className="px-5 py-4">

                              <p className="font-bold text-slate-700">

                                {
                                  row.dateLabel
                                }

                              </p>


                              <span
                                className={`inline-flex mt-1 text-[10px] font-black px-2 py-0.5 rounded-full border ${row.dayRelation.tone}`}
                              >

                                {
                                  row.dayRelation.label
                                }

                                {' / '}

                                {
                                  row.dayRelation.ja
                                }

                              </span>

                            </td>


                            {/* Time */}

                            <td className="px-5 py-4">

                              <div className="text-2xl font-black text-slate-900 tabular-nums whitespace-nowrap">

                                {
                                  row.startLabel
                                }

                                {' – '}

                                {
                                  row.endLabel
                                }

                              </div>


                              <div className="text-[11px] font-mono text-slate-400 mt-1">

                                {
                                  row.timeZone
                                }

                              </div>

                            </td>


                            {/* Day part */}

                            <td className="px-5 py-4">

                              <span
                                className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-black ${row.dayPart.tone}`}
                              >

                                <DayIcon
                                  size={17}
                                />

                                {
                                  row.dayPart.label
                                }

                              </span>

                            </td>


                            {/* Difference */}

                            <td className="px-5 py-4">

                              <span
                                className={`text-lg font-black ${
                                  row.isBase
                                    ? 'text-blue-600'
                                    : 'text-slate-700'
                                }`}
                              >

                                {
                                  formatDifference(
                                    row.differenceMinutes
                                  )
                                }

                              </span>

                            </td>

                          </tr>

                        );

                      }
                    )}

                  </tbody>

                </table>

              </div>


              {/* DST note */}

              <div className="mt-4 p-4 bg-amber-50 border border-amber-100 rounded-2xl text-sm text-amber-800 font-medium">

                時差は固定値ではなく、指定した日付と各都市の
                IANA Time Zone
                から計算しています。

                サマータイム（DST）がある地域も指定日に合わせて自動計算されます。

              </div>

            </div>

          )}

        </section>

      </div>


      {/* ==============================
          SHARE MODAL
      ============================== */}

      {shareOpen && (

        <div
          className="fixed inset-0 z-[99999] bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={(
            event
          ) => {

            if (
              event.target ===
              event.currentTarget
            ) {

              setShareOpen(
                false
              );

            }

          }}
        >

          <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden">


            {/* Modal header */}

            <div className="p-6 border-b border-slate-100 flex items-center justify-between">

              <div>

                <p className="text-xs font-black tracking-wider text-blue-500 uppercase">
                  Serverless Share Link
                </p>


                <h3 className="text-xl font-black text-slate-900 mt-1">
                  Share this timetable
                </h3>

              </div>


              <button
                onClick={() =>
                  setShareOpen(
                    false
                  )
                }
                className="p-2 rounded-full hover:bg-slate-100 text-slate-500"
              >

                <X
                  size={22}
                />

              </button>

            </div>


            {/* Modal content */}

            <div className="p-6 space-y-4">


              <p className="text-sm leading-relaxed text-slate-600 font-medium">

                セッション日時・国・都市・タイムゾーンをURL内に保存します。

                データベースや外部保存サーバーは使いません。

              </p>


              {/* URL preview */}

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 break-all text-xs font-mono text-slate-500 max-h-32 overflow-y-auto">

                {
                  buildShareUrl()
                }

              </div>


              {/* Buttons */}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">


                <button
                  onClick={
                    copyShareLink
                  }
                  className="px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black flex items-center justify-center gap-2"
                >

                  <Copy
                    size={18}
                  />

                  {
                    copyStatus ||
                    'Copy Link'
                  }

                </button>


                <button
                  onClick={
                    shareMeeting
                  }
                  className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black flex items-center justify-center gap-2"
                >

                  <Share2
                    size={18}
                  />

                  Share

                </button>

              </div>


              <p className="text-xs text-slate-400 font-medium">

                ※ URLを知っている人は内容を閲覧できます。

                生徒名・パスワードなどの個人情報や秘密情報は入力しないでください。

              </p>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}