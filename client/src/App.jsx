import React, { useEffect, useState } from "react";
import axios from "axios";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LogoutUser from "./components/LogoutUser";
import "./styles.css";
import logo from "./assets/quiz-playground-logo.png";
import Home from "./pages/Home";
import QuizPage from "./pages/QuizPage";
import { shuffleArray } from "./utils/utilFunc";
import Result from "./pages/Result";
import { useNavigate } from "react-router-dom";
import AuthPage from "./pages/AuthPage";

function App() {
  const [name, setName] = useState("");
  const [category, setCategoty] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [enableTimer, setEnableTimer] = useState(false);
  const [quizData, setQuizData] = useState([]);
  const [quizIndex, setQuizIndex] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState([]);
  const [loading, setLoading] = useState(false);
  const [score, setScore] = useState(0);
  const [align, setAlign] = useState(false);
  const navigate = useNavigate();

  const requestQuestions = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `https://opentdb.com/api.php?amount=10&category=${category}&difficulty=${difficulty}&type=multiple`
      );
      setQuizData(response.data.results);
      setLoading(false);
    } catch (error) {
      console.error(error);
    }
  };
  const nextQuestion = () => {
    console.log("quizIndex----", quizIndex);
    console.log("quizData.length - 1----", quizData.length);
    if (quizIndex + 1 < quizData.length) {
      setQuizIndex(quizIndex + 1);
    } else {
      navigate("/result");
    }
  };

  const logoutUser = () => {
    navigate("/");
  };
  useEffect(() => {
    if (quizData.length > 0) {
      let answers = [
        quizData[quizIndex].correct_answer,
        ...quizData[quizIndex].incorrect_answers,
      ];
      let colors = ["bg-gray-200", "bg-gray-200", "bg-gray-200", "bg-gray-200"];
      const shuffledAnswers = shuffleArray(answers);
      const correctAnswerIndex = shuffledAnswers.indexOf(
        quizData[quizIndex].correct_answer
      );
      setCurrentQuestion({
        ...quizData[quizIndex],
        bgColors: colors,
        answers,
        correctAnswerIndex,
      });
    }
  }, [quizData, quizIndex]);
  console.log(enableTimer);
  return (
    <section
      className={`${
        !align ? "h-screen" : "mt-4"
      } flex-col flex  justify-center items-center`}
    >
      <main className="py-5 px-10 border rounded w-2/3 shadow-xl">
        <div className="m-auto w-full flex border-b pb-5 justify-between items-center">
          <img src={logo} alt="logo" />
          <LogoutUser logoutUser={logoutUser} />
        </div>
        <Routes>
          <Route path="/" element={<AuthPage />} />
          <Route
            path="/info"
            element={
              <Home
                requestQuestions={requestQuestions}
                name={name}
                category={category}
                enableTimer={enableTimer}
                difficulty={difficulty}
                setCategoty={setCategoty}
                setDifficulty={setDifficulty}
                setEnableTimer={setEnableTimer}
                setName={setName}
              />
            }
          />
          <Route
            path="/quiz"
            element={
              <QuizPage
                quizData={quizData}
                name={name}
                loading={loading}
                currentQuestion={currentQuestion}
                nextQuestion={nextQuestion}
                setScore={setScore}
                score={score}
                setQuizData={setQuizData}
                quizIndex={quizIndex}
                setQuizIndex={setQuizIndex}
                enableTimer={enableTimer}
                setEnableTimer={setEnableTimer}
              />
            }
          />
          <Route
            path="/result"
            element={
              <Result
                name={name}
                score={score}
                setScore={setScore}
                setQuizData={setQuizData}
                setQuizIndex={setQuizIndex}
                setEnableTimer={setEnableTimer}
                setAlign={setAlign}
              />
            }
          />
          <Route path="/auth" element={<AuthPage />} />
        </Routes>
      </main>
    </section>
  );
}

export default App;
