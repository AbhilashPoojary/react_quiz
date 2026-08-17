import React from "react";
import he from "he";

export default function QuizOptions({
  quizData,
  checkAnswer,
  bg,
  disabled = false,
  danger = false,
}) {
  console.log(quizData.correct_answer);
  return (
    <div
      className={`quiz-options-panel mb-5 rounded border p-5 ${
        danger ? "quiz-options-danger" : ""
      }`}
    >
      <h3 className="app-strong-text text-center">
        {quizData?.question ? he.decode(quizData?.question) : "Loading..."}
      </h3>
      <span className="hidden">Please select an option first</span>
      <div className="my-5 grid grid-cols-1 gap-4 sm:mx-5 md:grid-cols-2">
        {quizData?.answers?.map((item, index) => (
          <button
            key={index}
            className={`${bg[index]?.bgc} ${bg[index]?.fgc} quiz-option-btn btn rounded p-2`}
            disabled={disabled}
            onClick={(e) => checkAnswer(item, index)}
          >
            {item ? he.decode(item) : "Loading..."}
          </button>
        ))}
      </div>
    </div>
  );
}
