import {
  CheckCircle2,
  Mic2,
  Sparkles,
} from 'lucide-react';

import {
  useEffect,
  useState,
} from 'react';


const EMPTY = {
  step: 0,
  total: 1,
  accuracy: null,
  passed: 0,
  note: '右のSpeech Studioで練習しよう',
};


export default function CommunicationMission({
  mission,
}) {
  const [
    state,
    setState,
  ] = useState(
    EMPTY
  );


  useEffect(
    () => {
      setState(
        EMPTY
      );


      const handler =
        (
          event
        ) => {
          if (
            event?.detail?.missionId !==
            mission?.id
          ) {
            return;
          }


          setState({
            step:
              Number(
                event.detail.step ??
                0
              ),

            total:
              Math.max(
                1,
                Number(
                  event.detail.total ??
                  1
                )
              ),

            accuracy:
              Number.isFinite(
                event.detail.accuracy
              )
                ? event.detail.accuracy
                : null,

            passed:
              Number(
                event.detail.passed ??
                0
              ),

            note:
              event.detail.note ??
              '',
          });
        };


      window.addEventListener(
        'tp-language-speech-progress',
        handler
      );


      return () =>
        window.removeEventListener(
          'tp-language-speech-progress',
          handler
        );
    },
    [
      mission?.id,
    ]
  );


  const percent =
    Math.round(
      state.passed /
      state.total *
      100
    );


  return (
    <div
      className="
        flex
        h-full
        min-h-0
        flex-col
      "
    >
      <div
        className="
          rounded-2xl
          border
          border-violet-100
          bg-violet-50
          p-4
        "
      >
        <div
          className="
            flex
            items-center
            gap-2
          "
        >
          <Mic2
            size={17}
            className="
              text-violet-600
            "
          />

          <p
            className="
              text-[11px]
              font-black
              tracking-[0.14em]
              text-violet-500
            "
          >
            SPEECH MISSION
          </p>
        </div>

        <p
          className="
            mt-2
            text-[17px]
            font-black
            leading-7
            text-violet-950
          "
        >
          {
            mission
              ?.speech
              ?.goal ??
            mission?.action
          }
        </p>
      </div>


      <div
        className="
          mt-3
          grid
          grid-cols-3
          gap-2
        "
      >
        {
          [
            [
              '🎧',
              '聞く',
            ],
            [
              '🎙️',
              '話す',
            ],
            [
              '✅',
              '80%+',
            ],
          ].map(
            (
              [
                icon,
                label,
              ]
            ) => (
              <div
                key={
                  label
                }
                className="
                  rounded-xl
                  border
                  border-slate-200
                  bg-white
                  px-2
                  py-3
                  text-center
                "
              >
                <p
                  className="
                    text-xl
                  "
                >
                  {
                    icon
                  }
                </p>

                <p
                  className="
                    mt-1
                    text-[12px]
                    font-black
                    text-slate-700
                  "
                >
                  {
                    label
                  }
                </p>
              </div>
            )
          )
        }
      </div>


      <div
        className="
          mt-4
          rounded-2xl
          border
          border-blue-100
          bg-blue-50
          p-3
        "
      >
        <p
          className="
            text-[9px]
            font-black
            tracking-[0.12em]
            text-blue-500
          "
        >
          RWANDA LANGUAGE NOTE
        </p>

        <p
          className="
            mt-1
            text-[12px]
            font-bold
            leading-6
            text-blue-900
          "
        >
          ルワンダではKinyarwandaが広く使われ、
          English・French・Kiswahiliも公用語です。
          このAdventureではオンライン交流に使う
          Englishを練習します。
        </p>
      </div>


      <div
        className="
          mt-auto
          rounded-2xl
          bg-slate-950
          p-4
          text-white
        "
      >
        <div
          className="
            flex
            items-center
            justify-between
            gap-3
          "
        >
          <div>
            <p
              className="
                text-[9px]
                font-black
                tracking-[0.14em]
                text-violet-300
              "
            >
              MISSION PROGRESS
            </p>

            <p
              className="
                mt-1
                text-sm
                font-black
              "
            >
              {
                state.passed
              }
              {' / '}
              {
                state.total
              }
              {' '}
              PASS
            </p>
          </div>

          {
            state.accuracy !==
            null
              ? (
                <div
                  className="
                    text-right
                  "
                >
                  <p
                    className="
                      text-[9px]
                      font-black
                      text-white/40
                    "
                  >
                    LAST
                  </p>

                  <p
                    className={`
                      text-2xl
                      font-black

                      ${
                        state.accuracy >=
                        80
                          ? 'text-emerald-300'
                          : 'text-orange-300'
                      }
                    `}
                  >
                    {
                      state.accuracy
                    }%
                  </p>
                </div>
              )
              : (
                <Sparkles
                  size={20}
                  className="
                    text-fuchsia-300
                  "
                />
              )
          }
        </div>


        <div
          className="
            mt-3
            h-2
            overflow-hidden
            rounded-full
            bg-white/10
          "
        >
          <div
            className="
              h-full
              rounded-full
              bg-gradient-to-r
              from-violet-400
              to-fuchsia-400
              transition-all
            "
            style={{
              width:
                `${percent}%`,
            }}
          />
        </div>


        {
          state.note && (
            <div
              className="
                mt-2
                flex
                items-start
                gap-2
              "
            >
              <CheckCircle2
                size={14}
                className="
                  mt-0.5
                  shrink-0
                  text-emerald-300
                "
              />

              <p
                className="
                  text-[10px]
                  font-bold
                  leading-4
                  text-white/55
                "
              >
                {
                  state.note
                }
              </p>
            </div>
          )
        }
      </div>
    </div>
  );
}
