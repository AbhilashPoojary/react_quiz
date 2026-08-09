import React from "react";
import he from "he";

export default function QuizOptions({ quizData, checkAnswer, bg }) {
  return (
    <div className="quiz-options-panel border rounded p-5 mb-5">
      <h3 className="app-strong-text text-center">
        {quizData?.question ? he.decode(quizData?.question) : "Loading..."}
      </h3>
      <span className="hidden">Please select an option first</span>
      <div className="my-5 grid grid-cols-1 gap-4 sm:mx-5 md:grid-cols-2">
        {quizData?.answers?.map((item, index) => (
          <button
            key={index}
            className={`${bg[index]?.bgc} ${bg[index]?.fgc} quiz-option-btn btn rounded p-2`}
            onClick={(e) => checkAnswer(item, index)}
          >
            {item ? he.decode(item) : "Loading..."}
          </button>
        ))}
      </div>
    </div>
  );
}
