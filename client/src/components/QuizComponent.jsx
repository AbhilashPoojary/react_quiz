import React, { useState, useEffect } from "react";
import QuizOptions from "../components/QuizOptions";

export default function QuizComponent({
  quizData,
  name,
  quitNow,
  score,
  setScore,
  nextQuestion,
  enableTimer,
  quizIndex,
}) {
  const [bg, setBg] = useState([
    { bgc: "bg-gray-200", fgc: "text-inherit" },
    { bgc: "bg-gray-200", fgc: "text-inherit" },
    { bgc: "bg-gray-200", fgc: "text-inherit" },
    { bgc: "bg-gray-200", fgc: "text-inherit" },
  ]);
  const [timeConsumed, setTimeConsumed] = useState(0);
  const [counter, setCounter] = useState(20);
  const [totalCounter, setTotalCounter] = useState(0);

  const checkAnswer = (item, index) => {
    let updatedBg = [...bg];
    if (item === quizData.correct_answer) {
      setScore((score += 10));
      updatedBg[index] = { bgc: "bg-green-600", fgc: "text-white" };
    } else {
      updatedBg[index] = { bgc: "bg-red-600", fgc: "text-white" };
      const correctIndex = quizData?.correctAnswerIndex;
      updatedBg[correctIndex] = { bgc: "bg-green-600", fgc: "text-white" };
    }
    setBg(updatedBg);
    setTimeConsumed((prevstate) => prevstate + (20 - counter));
    setTimeout(() => {
      nextQuestion();
      // setTotalCounter(timeConsumed);
      setCounter(20);
      setBg([
        { bgc: "bg-gray-200", fgc: "text-inherit" },
        { bgc: "bg-gray-200", fgc: "text-inherit" },
        { bgc: "bg-gray-200", fgc: "text-inherit" },
        { bgc: "bg-gray-200", fgc: "text-inherit" },
      ]);
    }, 500);
  };

  useEffect(() => {
    if (enableTimer) {
      const timer =
        counter > 0 && setInterval(() => setCounter(counter - 1), 1000);

      if (counter === 0) {
        setBg((prevBg) => {
          const updatedBg = [...prevBg];
          let correctIndex = quizData?.correctAnswerIndex;
          updatedBg[correctIndex] = { bgc: "bg-green-600", fgc: "text-white" };
          return updatedBg;
        });
        setTimeConsumed((prevstate) => prevstate + 20);

        setTimeout(() => {
          // setTotalCounter(timeConsumed);
          setBg([
            { bgc: "bg-gray-200", fgc: "text-inherit" },
            { bgc: "bg-gray-200", fgc: "text-inherit" },
            { bgc: "bg-gray-200", fgc: "text-inherit" },
            { bgc: "bg-gray-200", fgc: "text-inherit" },
          ]);
          nextQuestion();
          setCounter(20);
        }, 500);
      }
      return () => clearInterval(timer);
    }
  }, [counter]);

  return (
    <div>
      <div className="flex justify-between border-b py-5">
        <span className="font-semibold text-lg">{quizData?.category}</span>
        <h1 className="font-semibold text-lg">{name}</h1>
        <span className="font-semibold text-lg">Score: {score}</span>
      </div>
      <div>
        <div>
          <div className="flex justify-between items-center">
            <h1 className="py-5">Question {quizIndex + 1}:</h1>
            <span>{enableTimer && counter}</span>
          </div>
          <QuizOptions quizData={quizData} checkAnswer={checkAnswer} bg={bg} />
          <div className="flex justify-between">
            <span>
              Total time consumed {enableTimer && timeConsumed} seconds
            </span>
            <div>
              <button
                className="bg-red-600 hover:bg-red-800 transition duration-300 ease-in-out rounded p-3 text-white"
                onClick={quitNow}
              >
                Quit now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
