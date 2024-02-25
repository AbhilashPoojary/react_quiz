import React from "react";
import he from "he";

export default function QuizOptions({ quizData, checkAnswer, bg }) {
  return (
    <div className="border rounded p-5 mb-5">
      <h3 className="text-center">
        {quizData?.question ? he.decode(quizData?.question) : "Loading..."}
      </h3>
      <span className="hidden">Please select an option first</span>
      <div className="grid  grid-row-1 gap-4 my-5 mx-5 md:grid-cols-2 lg:grid-cols-2">
        {quizData?.answers?.map((item, index) => (
          <button
            key={index}
            className={`${bg[index]?.bgc} ${bg[index]?.fgc} btn rounded p-2`}
            onClick={(e) => checkAnswer(item, index)}
          >
            {item ? he.decode(item) : "Loading..."}
          </button>
        ))}
      </div>
    </div>
  );
}
