import React from "react";
import { useNavigate } from "react-router-dom";
// import Spinner from "../components/Spinner";
import SkeletonLoading from "../components/SkeletonLoading";
import QuizComponent from "../components/QuizComponent";

export default function QuizPage({
  setEnableTimer,
  name,
  loading,
  currentQuestion,
  nextQuestion,
  score,
  setScore,
  setQuizData,
  setQuizIndex,
  enableTimer,
  quizIndex,
  timeConsumed,
  setTimeConsumed,
}) {
  const navigate = useNavigate();
  const quitNow = () => {
    setScore(0);
    setEnableTimer(false);
    setQuizData([]);
    setQuizIndex(0);
    navigate("/info");
  };
  return (
    <>
      {loading ? (
        <SkeletonLoading />
      ) : (
        <QuizComponent
          quizData={currentQuestion}
          name={name}
          quitNow={quitNow}
          nextQuestion={nextQuestion}
          setScore={setScore}
          score={score}
          enableTimer={enableTimer}
          quizIndex={quizIndex}
          timeConsumed={timeConsumed}
          setTimeConsumed={setTimeConsumed}
        />
      )}
    </>
  );
}
