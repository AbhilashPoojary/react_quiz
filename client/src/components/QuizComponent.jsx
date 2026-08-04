import React, { useState, useEffect } from "react";
import QuizOptions from "../components/QuizOptions";
import ConfirmPopup from "./ConfirmPopup";

export default function QuizComponent({
  quizData,
  name,
  quitNow,
  score,
  setScore,
  nextQuestion,
  enableTimer,
  quizIndex,
  timeConsumed,
  setTimeConsumed,
}) {
  const [bg, setBg] = useState([
    { bgc: "bg-gray-200", fgc: "text-inherit" },
    { bgc: "bg-gray-200", fgc: "text-inherit" },
    { bgc: "bg-gray-200", fgc: "text-inherit" },
    { bgc: "bg-gray-200", fgc: "text-inherit" },
  ]);

  const [counter, setCounter] = useState(20);
  const [showConfirm, setShowConfirm] = useState(false);
  console.log(quizData.correct_answer);
  const checkAnswer = (item, index) => {
    let updatedBg = [...bg];
    if (item === quizData.correct_answer) {
      setScore((prevScore) => prevScore + 10);
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
    if (!enableTimer) {
      return undefined;
    }

    const timer =
      counter > 0 && setInterval(() => setCounter((prev) => prev - 1), 1000);

    if (counter === 0) {
      setBg((prevBg) => {
        const updatedBg = [...prevBg];
        let correctIndex = quizData?.correctAnswerIndex;
        updatedBg[correctIndex] = { bgc: "bg-green-600", fgc: "text-white" };
        return updatedBg;
      });
      setTimeConsumed((prevstate) => prevstate + 20);

      setTimeout(() => {
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
  }, [counter, enableTimer, nextQuestion, quizData, setTimeConsumed]);

  const handleQuitConfirm = () => {
    setShowConfirm(false);
    quitNow();
  };

  return (
    <div>
      <ConfirmPopup
        open={showConfirm}
        title="Quit quiz?"
        body="Are you sure you want to quit the quiz? Your current progress will be reset."
        confirmText="Quit"
        cancelText="Cancel"
        onConfirm={handleQuitConfirm}
        onCancel={() => setShowConfirm(false)}
      />
      <div className="flex flex-col items-center border-b py-5 md:flex-row md:justify-between lg:flex-row lg:justify-between">
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
                onClick={() => setShowConfirm(true)}
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
