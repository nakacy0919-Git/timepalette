import {
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  BookOpen,
  Clock3,
  CloudSun,
  Coins,
  Compass,
  Globe2,
  HeartHandshake,
  Languages,
  MapPin,
  Mountain,
  X,
} from 'lucide-react';

import DetailedAnalogClock
  from './DetailedAnalogClock';

import InteractiveQuiz
  from './InteractiveQuiz';

import LanguagePractice
  from './LanguagePractice';

import WorldMissionPanel
  from './world-learning/WorldMissionPanel';

import openingBackground
  from '../assets/opening/timepalette_opening_background.png';


const ADVENTURE_THEMES = [
  {
    primary: '#2563eb',
    secondary: '#7c3aed',
    soft: '#eff6ff',
  },
  {
    primary: '#059669',
    secondary: '#0891b2',
    soft: '#ecfdf5',
  },
  {
    primary: '#ea580c',
    secondary: '#db2777',
    soft: '#fff7ed',
  },
  {
    primary: '#7c3aed',
    secondary: '#2563eb',
    soft: '#f5f3ff',
  },
  {
    primary: '#dc2626',
    secondary: '#d97706',
    soft: '#fef2f2',
  },
];


function getAdventureTheme(
  iso
) {
  const value =
    String(iso || '')
      .split('')
      .reduce(
        (
          total,
          character
        ) =>
          total +
          character.charCodeAt(0),
        0
      );

  return ADVENTURE_THEMES[
    value %
      ADVENTURE_THEMES.length
  ];
}


function makeFlagEmoji(
  iso
) {
  const upper =
    String(
      iso || ''
    ).toUpperCase();

  if (
    !/^[A-Z]{2}$/.test(
      upper
    )
  ) {
    return '🌍';
  }

  return upper
    .split('')
    .map(
      (letter) =>
        String.fromCodePoint(
          127397 +
            letter.charCodeAt(0)
        )
    )
    .join('');
}


export default function CountryDetailOverlay({
  iso,
  fileLetter,
  onClose,
}) {
  const [
    countryData,
    setCountryData,
  ] = useState(null);

  const [
    languageData,
    setLanguageData,
  ] = useState(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState(false);

  const [
    lang,
    setLanguage,
  ] = useState('ja');

  const topRef =
    useRef(null);


  useEffect(() => {
    const fetchData =
      async () => {
        try {
          setLoading(true);
          setError(false);

          const dataFileLetter =
            fileLetter
              ?.toLowerCase();

          if (!dataFileLetter) {
            throw new Error(
              `国データのファイル判定に失敗しました: ${iso}`
            );
          }

          const dataModule =
            await import(
              `../data/countries_${dataFileLetter}.json`
            );

          const data =
            dataModule.default
              ? dataModule.default[
                  iso
                ]
              : dataModule[
                  iso
                ];

          if (!data) {
            throw new Error(
              '基本データが見つかりません'
            );
          }

          setCountryData(
            data
          );

          try {
            const langModule =
              await import(
                `../data/languages_${dataFileLetter}.json`
              );

            setLanguageData(
              langModule.default ||
                langModule
            );
          } catch (
            langError
          ) {
            console.log(
              `languages_${dataFileLetter}.json はまだありません:`,
              langError
            );

            setLanguageData(
              null
            );
          }
        } catch (loadError) {
          console.error(
            'データの読み込みに失敗しました:',
            loadError
          );

          setError(true);
        } finally {
          setLoading(false);
        }
      };

    fetchData();
  }, [
    iso,
    fileLetter,
  ]);


  useEffect(() => {
    if (
      loading ||
      !topRef.current
    ) {
      return undefined;
    }

    const timer =
      window.setTimeout(
        () => {
          topRef.current
            ?.scrollIntoView({
              behavior: 'auto',
              block: 'start',
            });
        },
        80
      );

    return () =>
      window.clearTimeout(
        timer
      );
  }, [
    loading,
    iso,
  ]);


  const handleBackdropClick =
    (event) => {
      if (
        event.target ===
        event.currentTarget
      ) {
        onClose();
      }
    };


  const t =
    (
      jaText,
      enText
    ) => {
      if (
        lang === 'en' &&
        enText
      ) {
        return enText;
      }

      return (
        jaText ||
        enText ||
        ''
      );
    };


  const theme =
    getAdventureTheme(
      iso
    );

  const flagEmoji =
    makeFlagEmoji(
      iso
    );

  const languages =
    countryData
      ?.languages ?? [];

  const languageLabel =
    languages
      .map(
        (language) =>
          t(
            language
              ?.nameJa,
            language
              ?.nameEn
          )
      )
      .filter(Boolean)
      .slice(0, 3)
      .join(' / ');


  return (
    <div
      className="
        fixed
        inset-0
        z-[9999]
        overflow-y-auto
        bg-slate-950/85
        p-2
        backdrop-blur-md
        md:p-6
      "
      onClick={
        handleBackdropClick
      }
    >

      {/* GLOBAL BACKGROUND */}
      <div
        className="
          pointer-events-none
          fixed
          inset-0
          bg-cover
          bg-center
          opacity-[0.16]
        "
        style={{
          backgroundImage:
            `url(${openingBackground})`,
        }}
      />

      <div className="pointer-events-none fixed inset-0 bg-gradient-to-b from-slate-950/45 via-slate-950/65 to-slate-950/90" />

      <div
        ref={
          topRef
        }
        className="
          pointer-events-none
          absolute
          left-0
          top-0
          h-1
          w-full
          opacity-0
        "
      />


      {/* MAIN SHELL */}
      <div
        className="
          relative
          z-10
          mx-auto
          mb-12
          mt-1
          w-full
          max-w-[1500px]
          overflow-hidden
          rounded-[32px]
          bg-[#f7f6f2]/95
          shadow-[0_35px_120px_rgba(0,0,0,0.45)]
          backdrop-blur-xl
          md:mt-4
        "
      >

        {/* TOP CONTROLS */}
        <div className="absolute right-4 top-4 z-[80] flex items-center gap-2 md:right-7 md:top-7">

          <div className="flex rounded-full border border-white/40 bg-white/85 p-1 shadow-lg backdrop-blur-xl">

            <button
              type="button"
              onClick={() =>
                setLanguage(
                  'ja'
                )
              }
              className={`
                rounded-full
                px-3
                py-1.5
                text-xs
                font-bold
                transition
                ${
                  lang === 'ja'
                    ? 'bg-slate-950 text-white'
                    : 'text-slate-500 hover:bg-white'
                }
              `}
            >
              日本語
            </button>

            <button
              type="button"
              onClick={() =>
                setLanguage(
                  'en'
                )
              }
              className={`
                rounded-full
                px-3
                py-1.5
                text-xs
                font-bold
                transition
                ${
                  lang === 'en'
                    ? 'bg-slate-950 text-white'
                    : 'text-slate-500 hover:bg-white'
                }
              `}
            >
              English
            </button>

          </div>

          <button
            type="button"
            onClick={
              onClose
            }
            className="
              flex
              h-11
              w-11
              items-center
              justify-center
              rounded-full
              border
              border-white/40
              bg-white/90
              text-slate-800
              shadow-lg
              backdrop-blur-xl
              transition
              hover:scale-105
              hover:bg-white
            "
            aria-label="Close"
          >
            <X
              size={21}
            />
          </button>

        </div>


        {loading ? (

          <div className="flex min-h-[70vh] flex-col items-center justify-center">

            <div
              className="
                h-16
                w-16
                animate-spin
                rounded-full
                border-4
                border-blue-100
                border-t-blue-600
              "
            />

            <p className="mt-5 text-sm font-black tracking-[0.15em] text-blue-600">
              OPENING WORLD...
            </p>

          </div>

        ) : error ? (

          <div className="flex min-h-[60vh] flex-col items-center justify-center p-8 text-center">

            <div className="text-7xl">
              🌍
            </div>

            <h2 className="mt-5 text-2xl font-black text-slate-800">
              Data not found
            </h2>

            <button
              type="button"
              onClick={
                onClose
              }
              className="mt-6 rounded-2xl bg-slate-950 px-6 py-3 font-bold text-white"
            >
              Close
            </button>

          </div>

        ) : (

          <div>

            {/* =====================================================
                COUNTRY HERO
                V2: 情報だけ。ここにはCTAを置かない。
            ====================================================== */}
            <section
              className="
                relative
                min-h-[360px]
                overflow-hidden
                text-white
              "
              style={{
                backgroundImage:
                  `
                  linear-gradient(
                    115deg,
                    ${theme.primary}ee 0%,
                    ${theme.secondary}dd 48%,
                    #0f172acc 100%
                  ),
                  url(${openingBackground})
                  `,
                backgroundSize:
                  'cover',
                backgroundPosition:
                  'center',
              }}
            >

              {countryData.flagUrl && (
                <img
                  src={
                    countryData.flagUrl
                  }
                  alt=""
                  aria-hidden="true"
                  className="
                    absolute
                    -bottom-10
                    right-[-5%]
                    h-[90%]
                    w-auto
                    rotate-[-6deg]
                    object-cover
                    opacity-[0.08]
                    blur-[1px]
                  "
                />
              )}

              <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_25%,rgba(255,255,255,0.22),transparent_30%)]" />

              <div
                className="
                  relative
                  z-10
                  flex
                  min-h-[360px]
                  flex-col
                  justify-end
                  px-6
                  pb-16
                  pt-24
                  md:px-10
                  md:pb-20
                  lg:px-14
                "
              >

                <div className="max-w-5xl">

                  <div className="mb-5 flex flex-wrap items-center gap-3">

                    <span className="rounded-full border border-white/25 bg-white/10 px-4 py-2 text-[10px] font-black tracking-[0.2em] backdrop-blur">
                      COUNTRY ADVENTURE
                    </span>

                    <span className="rounded-full border border-white/20 bg-slate-950/20 px-4 py-2 text-[10px] font-black tracking-[0.18em] backdrop-blur">
                      {iso.toUpperCase()}
                    </span>

                  </div>

                  <div className="flex flex-col gap-5 sm:flex-row sm:items-center">

                    {countryData.flagUrl ? (
                      <img
                        src={
                          countryData.flagUrl
                        }
                        alt={`${countryData.nameEn} flag`}
                        className="
                          h-auto
                          w-28
                          rounded-xl
                          object-cover
                          shadow-[0_18px_50px_rgba(0,0,0,0.35)]
                          ring-2
                          ring-white/30
                          md:w-36
                        "
                      />
                    ) : (
                      <div className="text-7xl">
                        {
                          flagEmoji
                        }
                      </div>
                    )}

                    <div>

                      <h1 className="text-4xl font-black tracking-[-0.04em] drop-shadow-xl md:text-6xl lg:text-7xl">
                        {
                          countryData.nameEn
                        }
                      </h1>

                      <p className="mt-1 text-xl font-bold text-white/70 md:text-2xl">
                        {
                          countryData.nameJa
                        }
                      </p>

                    </div>

                  </div>

                  <p className="mt-5 max-w-3xl text-base font-semibold leading-7 text-white/85 md:text-lg">
                    「
                    {t(
                      countryData.subtitle,
                      countryData.subtitleEn ||
                        countryData.subtitle
                    )}
                    」
                  </p>

                  <div className="mt-6 flex flex-wrap gap-2.5">

                    <div className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 backdrop-blur">
                      <MapPin
                        size={15}
                      />
                      <span className="text-[10px] font-bold text-white/60">
                        CAPITAL
                      </span>
                      <span className="text-xs font-black sm:text-sm">
                        {t(
                          countryData.capitalJa,
                          countryData.capitalEn
                        )}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 backdrop-blur">
                      <Clock3
                        size={15}
                      />
                      <span className="text-[10px] font-bold text-white/60">
                        TIME
                      </span>
                      <span className="text-xs font-black sm:text-sm">
                        {
                          countryData.timeZone
                        }
                      </span>
                    </div>

                    {languageLabel && (
                      <div className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 backdrop-blur">
                        <Languages
                          size={15}
                        />
                        <span className="text-[10px] font-bold text-white/60">
                          LANGUAGE
                        </span>
                        <span className="text-xs font-black sm:text-sm">
                          {
                            languageLabel
                          }
                        </span>
                      </div>
                    )}

                  </div>

                </div>

              </div>

            </section>


            {/* =====================================================
                WORLD ADVENTURE V2
                Heroに重ね、最初の選択をすぐ見せる。
            ====================================================== */}
            <section
              className="
                relative
                z-20
                -mt-12
                scroll-mt-4
                px-4
                pb-10
                md:-mt-14
                md:px-7
                lg:px-10
              "
            >

              <WorldMissionPanel
                countryCode={
                  iso
                }
                fileLetter={
                  fileLetter
                }
                countryNameEn={
                  countryData.nameEn
                }
                countryNameJa={
                  countryData.nameJa
                }
                flagUrl={
                  countryData.flagUrl
                }
              />

            </section>


            {/* =====================================================
                COUNTRY DISCOVERY
            ====================================================== */}
            <section
              className="
                border-t
                border-slate-200
                bg-white/75
                px-5
                py-12
                md:px-9
                lg:px-12
              "
            >

              <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">

                <div>

                  <div className="flex items-center gap-2">
                    <Compass
                      size={18}
                      style={{
                        color:
                          theme.primary,
                      }}
                    />
                    <p
                      className="text-[10px] font-black tracking-[0.2em]"
                      style={{
                        color:
                          theme.primary,
                      }}
                    >
                      COUNTRY DISCOVERY
                    </p>
                  </div>

                  <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
                    もっと、この国を知ろう。
                  </h2>

                  <p className="mt-3 max-w-2xl text-sm font-medium leading-7 text-slate-500">
                    Missionで気になったことを、
                    地図・時間・ことば・気候からさらに確かめられます。
                  </p>

                </div>

                <div className="text-5xl">
                  {
                    flagEmoji
                  }
                </div>

              </div>


              {/* INFO CARDS */}
              <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">

                <div
                  className="rounded-2xl p-4"
                  style={{
                    backgroundColor:
                      theme.soft,
                  }}
                >
                  <Coins className="text-amber-500" />
                  <p className="mt-4 text-[9px] font-black tracking-[0.15em] text-slate-400">
                    CURRENCY
                  </p>
                  <p className="mt-1 font-black text-slate-800">
                    {countryData.currency
                      ? `${t(
                          countryData.currency.nameJa,
                          countryData.currency.nameEn
                        )} ${countryData.currency.symbol || ''}`
                      : '—'}
                  </p>
                </div>

                <div
                  className="rounded-2xl p-4"
                  style={{
                    backgroundColor:
                      theme.soft,
                  }}
                >
                  <Languages className="text-emerald-600" />
                  <p className="mt-4 text-[9px] font-black tracking-[0.15em] text-slate-400">
                    LANGUAGE
                  </p>
                  <p className="mt-1 line-clamp-2 font-black text-slate-800">
                    {
                      languageLabel ||
                      '—'
                    }
                  </p>
                </div>

                <div
                  className="rounded-2xl p-4"
                  style={{
                    backgroundColor:
                      theme.soft,
                  }}
                >
                  <Mountain className="text-stone-600" />
                  <p className="mt-4 text-[9px] font-black tracking-[0.15em] text-slate-400">
                    ELEVATION
                  </p>
                  <p className="mt-1 line-clamp-2 font-black text-slate-800">
                    {t(
                      countryData.elevation,
                      countryData.elevationEn ||
                        countryData.elevation
                    ) || '—'}
                  </p>
                </div>

                <div
                  className="rounded-2xl p-4"
                  style={{
                    backgroundColor:
                      theme.soft,
                  }}
                >
                  <CloudSun className="text-sky-600" />
                  <p className="mt-4 text-[9px] font-black tracking-[0.15em] text-slate-400">
                    CLIMATE
                  </p>
                  <p className="mt-1 line-clamp-2 font-black text-slate-800">
                    {t(
                      countryData.weather
                        ?.summary,
                      countryData.weather
                        ?.summaryEn ||
                        countryData.weather
                          ?.summary
                    ) || '—'}
                  </p>
                </div>

              </div>


              {/* MAP + TIME */}
              <div className="mt-7 grid grid-cols-1 gap-6 lg:grid-cols-2">

                <div className="relative h-[420px] overflow-hidden rounded-[28px] border border-slate-200 bg-slate-100 shadow-sm">

                  <div className="absolute left-5 top-5 z-10 flex items-center gap-2 rounded-full bg-white/95 px-4 py-2 text-sm font-black text-slate-800 shadow-lg backdrop-blur">
                    <Globe2
                      size={17}
                      style={{
                        color:
                          theme.primary,
                      }}
                    />
                    MAP
                  </div>

                  <iframe
                    title={`${countryData.nameEn} map`}
                    width="100%"
                    height="100%"
                    className="bg-slate-100"
                    style={{
                      border: 0,
                    }}
                    loading="lazy"
                    allowFullScreen
                    tabIndex="-1"
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(
                      countryData.mapQuery
                    )}&t=m&z=5&output=embed&hl=${lang}`}
                  />

                </div>

                <div className="flex min-h-[420px] flex-col justify-between rounded-[28px] border border-slate-200 bg-slate-950 p-6 text-white shadow-sm md:p-8">

                  <div>
                    <div className="flex items-center gap-2 text-blue-300">
                      <Clock3
                        size={18}
                      />
                      <p className="text-[10px] font-black tracking-[0.2em]">
                        LOCAL TIME
                      </p>
                    </div>

                    <h3 className="mt-3 text-3xl font-black">
                      {t(
                        countryData.capitalJa,
                        countryData.capitalEn
                      )}
                    </h3>

                    <p className="mt-2 font-mono text-sm text-white/45">
                      {
                        countryData.timeZone
                      }
                    </p>
                  </div>

                  <div className="flex flex-1 items-center justify-center py-6">
                    <DetailedAnalogClock
                      timeZone={
                        countryData.timeZone
                      }
                    />
                  </div>

                  <p className="text-center text-xs font-bold leading-6 text-white/45">
                    日本との時差を考えながら、
                    TIME Missionにも挑戦してみよう。
                  </p>

                </div>

              </div>

            </section>


            {/* =====================================================
                CULTURE & HERITAGE
            ====================================================== */}
            {(
              countryData
                .heritage
                ?.length > 0 ||
              countryData
                .culture
                ?.length > 0
            ) && (
              <section className="border-t border-slate-200 px-5 py-12 md:px-9 lg:px-12">

                <div className="flex items-center gap-2">
                  <BookOpen
                    size={18}
                    className="text-orange-500"
                  />
                  <p className="text-[10px] font-black tracking-[0.2em] text-orange-500">
                    CULTURE & HERITAGE
                  </p>
                </div>

                <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                  見どころ・文化
                </h2>

                <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">

                  {countryData
                    .heritage
                    ?.map(
                      (item) => (
                        <div
                          key={
                            item.id
                          }
                          className="group overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
                        >
                          <div className="relative h-52 overflow-hidden">
                            <img
                              src={
                                item.image
                              }
                              alt={
                                item.title
                              }
                              className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                            />
                            <span className="absolute left-4 top-4 rounded-full bg-blue-600 px-3 py-1.5 text-[9px] font-black tracking-wide text-white shadow">
                              {t(
                                item.category,
                                item.categoryEn ||
                                  item.category
                              )}
                            </span>
                          </div>

                          <div className="p-5">
                            <h3 className="text-lg font-black text-slate-900">
                              {t(
                                item.title,
                                item.titleEn ||
                                  item.title
                              )}
                            </h3>
                            <p className="mt-3 text-sm font-medium leading-6 text-slate-500">
                              {t(
                                item.description,
                                item.descriptionEn ||
                                  item.description
                              )}
                            </p>
                          </div>
                        </div>
                      )
                    )}

                  {countryData
                    .culture
                    ?.map(
                      (item) => (
                        <div
                          key={
                            item.id
                          }
                          className="group overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
                        >
                          <div className="relative h-52 overflow-hidden">
                            <img
                              src={
                                item.image
                              }
                              alt={
                                item.title
                              }
                              className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                            />
                            <span className="absolute left-4 top-4 rounded-full bg-orange-500 px-3 py-1.5 text-[9px] font-black tracking-wide text-white shadow">
                              {t(
                                item.category,
                                item.categoryEn ||
                                  item.category
                              )}
                            </span>
                          </div>

                          <div className="p-5">
                            <h3 className="text-lg font-black text-slate-900">
                              {t(
                                item.title,
                                item.titleEn ||
                                  item.title
                              )}
                            </h3>
                            <p className="mt-3 text-sm font-medium leading-6 text-slate-500">
                              {t(
                                item.description,
                                item.descriptionEn ||
                                  item.description
                              )}
                            </p>
                          </div>
                        </div>
                      )
                    )}

                </div>

              </section>
            )}


            {/* =====================================================
                JAPAN CONNECTION
            ====================================================== */}
            {countryData
              .japanConnection && (
              <section className="border-t border-slate-200 px-5 py-12 md:px-9 lg:px-12">

                <div className="relative overflow-hidden rounded-[30px] border border-rose-100 bg-gradient-to-br from-rose-50 via-white to-orange-50 p-7 shadow-sm md:p-10">

                  <HeartHandshake className="absolute -bottom-10 -right-8 h-56 w-56 text-rose-100" />

                  <div className="relative z-10">
                    <p className="text-[10px] font-black tracking-[0.2em] text-rose-500">
                      JAPAN CONNECTION
                    </p>

                    <h2 className="mt-3 flex items-center gap-3 text-3xl font-black text-slate-950">
                      🇯🇵
                      {t(
                        countryData
                          .japanConnection
                          .title,
                        countryData
                          .japanConnection
                          .titleEn ||
                          countryData
                            .japanConnection
                            .title
                      )}
                    </h2>

                    <p className="mt-6 max-w-4xl text-base font-medium leading-8 text-slate-600 md:text-lg">
                      {t(
                        countryData
                          .japanConnection
                          .text,
                        countryData
                          .japanConnection
                          .textEn ||
                          countryData
                            .japanConnection
                            .text
                      )}
                    </p>
                  </div>

                </div>

              </section>
            )}


            {/* =====================================================
                EXTRA PRACTICE
            ====================================================== */}
            {(
              countryData.quiz ||
              (
                languageData &&
                languageData[
                  iso
                ]
              )
            ) && (
              <section className="border-t border-slate-200 bg-slate-50/80 px-5 py-12 md:px-9 lg:px-12">

                <div className="mb-8">
                  <p className="text-[10px] font-black tracking-[0.2em] text-slate-400">
                    EXTRA PRACTICE
                  </p>
                  <h2 className="mt-3 text-3xl font-black text-slate-950">
                    もっと練習する
                  </h2>
                </div>

                {countryData.quiz && (
                  <div className="rounded-[28px] bg-white p-5 shadow-sm md:p-8">
                    <InteractiveQuiz
                      quizData={
                        countryData.quiz
                      }
                      lang={
                        lang
                      }
                    />
                  </div>
                )}

                {languageData &&
                  languageData[
                    iso
                  ] && (
                  <div className="mt-8 rounded-[28px] bg-white p-5 shadow-sm md:p-8">
                    <LanguagePractice
                      countryCode={
                        iso
                      }
                      languageData={
                        languageData
                      }
                    />
                  </div>
                )}

              </section>
            )}

          </div>
        )}

      </div>

    </div>
  );
}
