import { useState } from 'react';
import { HelpCircle, CheckCircle, XCircle } from 'lucide-react';

export default function InteractiveQuiz({ quizData }) {
  const [selectedOption, setSelectedOption] = useState(null);

  if (!quizData) return null;

  const handleOptionClick = (index) => {
    if (selectedOption !== null) return; // 一度答えたら変更不可
    setSelectedOption(index);
  };

  const isCorrect = selectedOption === quizData.correctIndex;

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-6 md:p-10 rounded-3xl border border-indigo-100 shadow-sm relative overflow-hidden">
      <HelpCircle className="absolute -left-6 -top-6 text-indigo-200/40 w-40 h-40" />
      
      <div className="relative z-10 max-w-3xl mx-auto">
        <h3 className="text-xl md:text-2xl font-black text-indigo-800 mb-6 text-center">
          💡 {quizData.question}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {quizData.options.map((option, index) => {
            let buttonClass = "bg-white border-2 border-indigo-100 hover:border-indigo-300 text-slate-700";
            
            // 選択後の色分け
            if (selectedOption !== null) {
              if (index === quizData.correctIndex) {
                buttonClass = "bg-green-100 border-green-500 text-green-800 font-bold";
              } else if (index === selectedOption) {
                buttonClass = "bg-red-100 border-red-400 text-red-800";
              } else {
                buttonClass = "bg-white border-slate-100 text-slate-400 opacity-50";
              }
            }

            return (
              <button
                key={index}
                onClick={() => handleOptionClick(index)}
                disabled={selectedOption !== null}
                className={`p-4 rounded-2xl text-lg font-medium transition-all shadow-sm ${buttonClass}`}
              >
                {option}
              </button>
            );
          })}
        </div>

        {/* 解説エリア（選択後に表示） */}
        {selectedOption !== null && (
          <div className={`p-6 rounded-2xl flex gap-4 animate-in slide-in-from-bottom-4 fade-in duration-500 ${isCorrect ? 'bg-green-50 border border-green-200' : 'bg-orange-50 border border-orange-200'}`}>
            <div className="shrink-0 mt-1">
              {isCorrect ? (
                <CheckCircle className="w-10 h-10 text-green-500" />
              ) : (
                <XCircle className="w-10 h-10 text-red-500" />
              )}
            </div>
            <div>
              <p className={`text-xl font-black mb-2 ${isCorrect ? 'text-green-700' : 'text-red-600'}`}>
                {isCorrect ? "大正解！すごい！🎉" : "おしい！違うんだな〜😅"}
              </p>
              <p className="text-slate-700 font-medium leading-relaxed">
                {quizData.explanation}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}