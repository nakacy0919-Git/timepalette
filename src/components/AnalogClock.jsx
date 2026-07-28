import { useState, useEffect } from 'react';

export default function AnalogClock({ timeZone, onClick }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  let hours = 0, minutes = 0, seconds = 0;
  try {
    const tzTime = new Date(time.toLocaleString('en-US', { timeZone }));
    hours = tzTime.getHours();
    minutes = tzTime.getMinutes();
    seconds = tzTime.getSeconds();
  } catch (e) {
    // fallback
  }

  const isNight = hours < 6 || hours >= 18;
  const secondDeg = seconds * 6;
  const minuteDeg = minutes * 6 + seconds * 0.1;
  const hourDeg = (hours % 12) * 30 + minutes * 0.5;

  return (
    <div 
      onClick={onClick}
      className={`relative w-full h-full rounded-full border-[3px] shadow-md cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl flex items-center justify-center
        ${isNight ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'}`}
    >
      {[...Array(12)].map((_, i) => (
        <div
          key={i}
          className="absolute w-full h-full text-center font-bold text-xs sm:text-sm"
          style={{ transform: `rotate(${(i + 1) * 30}deg)` }}
        >
          <span
            className={`inline-block mt-1 sm:mt-1.5 ${isNight ? 'text-gray-300' : 'text-gray-700'}`}
            style={{ transform: `rotate(${-(i + 1) * 30}deg)` }}
          >
            {i + 1}
          </span>
        </div>
      ))}

      {/* 短針 */}
      <div
        className={`absolute w-1.5 h-[25%] rounded-full origin-bottom bottom-1/2 z-10 ${isNight ? 'bg-gray-100' : 'bg-slate-800'}`}
        style={{ transform: `rotate(${hourDeg}deg)` }}
      ></div>

      {/* 長針 */}
      <div
        className={`absolute w-1 h-[35%] rounded-full origin-bottom bottom-1/2 z-20 ${isNight ? 'bg-gray-300' : 'bg-slate-600'}`}
        style={{ transform: `rotate(${minuteDeg}deg)` }}
      ></div>

      {/* 秒針 */}
      <div
        className="absolute w-0.5 h-[40%] bg-red-500 rounded-full origin-bottom bottom-1/2 z-30"
        style={{ transform: `rotate(${secondDeg}deg)` }}
      ></div>

      {/* 中心のドット */}
      <div className="absolute w-2.5 h-2.5 bg-red-500 rounded-full z-40 shadow-sm"></div>
    </div>
  );
}