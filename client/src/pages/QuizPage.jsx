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
  totalQuestions,
  nextQuestion,
  recordAnswer,
  score,
  setScore,
  setQuizData,
  setQuizIndex,
  enableTimer,
  showAnswerFeedback,
  timerMode,
  totalDuration,
  timePerQuestion,
  quizIndex,
  timeConsumed,
  setTimeConsumed,
  finishQuizWithUnanswered,
}) {
  const navigate = useNavigate();
  const quitNow = () => {
    setScore(0);
    setEnableTimer(false);
    setQuizData([]);
    setQuizIndex(0);
    setTimeConsumed(0);
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
          totalQuestions={totalQuestions}
          quitNow={quitNow}
          nextQuestion={nextQuestion}
          recordAnswer={recordAnswer}
          setScore={setScore}
          score={score}
          enableTimer={enableTimer}
          showAnswerFeedback={showAnswerFeedback}
          timerMode={timerMode}
          totalDuration={totalDuration}
          timePerQuestion={timePerQuestion}
          quizIndex={quizIndex}
          timeConsumed={timeConsumed}
          setTimeConsumed={setTimeConsumed}
          finishQuizWithUnanswered={finishQuizWithUnanswered}
        />
      )}
    </>
  );
}
