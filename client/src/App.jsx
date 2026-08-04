import React, { useEffect, useRef, useState } from "react";
import apiClient from "./utils/apiClient";
import { Routes, Route } from "react-router-dom";
import LogoutUser from "./components/LogoutUser";
import "./styles.css";
import logo from "./assets/quiz-playground-logo.png";
import Home from "./pages/Home";
import QuizPage from "./pages/QuizPage";
import { shuffleArray } from "./utils/utilFunc";
import Result from "./pages/Result";
import { useNavigate } from "react-router-dom";
import AuthPage from "./pages/AuthPage";
import { useDispatch, useSelector } from "react-redux";
import { selectUserInfo, isReady } from "./slice/authSlice";
import { LOG_OUT } from "./slice/authSlice";
import { insertScoreCall } from "./slice/insertScoreSlice";
import Dashboard from "./pages/Dashboard";
import ErrorNotification from "./components/ErrorNotification";

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
  const [loggedinUser, setLoggedinUser] = useState("");
  const [timeConsumed, setTimeConsumed] = useState(0);
  const [sessionNotification, setSessionNotification] = useState({
    type: "info",
    message: "",
  });
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const scoreRef = useRef(score);
  const userInfo = useSelector(selectUserInfo);
  const readystate = useSelector(isReady);

  const requestQuestions = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/api/questions", {
        params: {
          amount: 10,
          category,
          difficulty,
          type: "multiple",
        },
      });
      setQuizData(response.data);
      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };
  const nextQuestion = () => {
    let storedUser = JSON.parse(localStorage.getItem("currentUser"));
    if (quizIndex + 1 < quizData.length) {
      setQuizIndex(quizIndex + 1);
    } else {
      const latestScore = scoreRef.current;
      if (enableTimer) {
        const obj = {
          name,
          category,
          difficulty,
          score: latestScore,
          totaltime: timeConsumed,
          profilePicture: storedUser?.user?.profilePicture,
          userId: storedUser?.user?._id,
        };
        console.log(obj);
        console.log(storedUser);
        dispatch(insertScoreCall(obj));
      }
      navigate("/result");
      setCategoty("");
      setDifficulty("");
    }
  };

  const logoutUser = async () => {
    try {
      await apiClient.post("/auth/logout");
    } catch (error) {
      console.error(error);
    }
    dispatch(LOG_OUT());
  };
  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  useEffect(() => {
    const savedSessionMessage = localStorage.getItem("sessionExpiredMessage");

    if (savedSessionMessage) {
      setSessionNotification({
        type: "info",
        message: savedSessionMessage,
      });
    }

    const handleSessionExpired = (event) => {
      const message = event?.detail?.message || savedSessionMessage || "";
      setSessionNotification({
        type: "info",
        message,
      });
    };

    window.addEventListener("session-expired", handleSessionExpired);

    return () => {
      window.removeEventListener("session-expired", handleSessionExpired);
    };
  }, []);

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
  useEffect(() => {
    setLoggedinUser(
      JSON.parse(localStorage.getItem("currentUser"))?.user?.name
    );
  }, []);
  return (
    <section
      className={`${
        !align ? "h-screen" : "mt-4"
      } flex-col flex  justify-center items-center`}
    >
      <ErrorNotification
        message={sessionNotification.message}
        type={sessionNotification.type}
        duration={2200}
        onHide={() => {
          localStorage.removeItem("sessionExpiredMessage");
          setSessionNotification({ type: "info", message: "" });
        }}
      />
      <main className="p-12 border rounded w-2/3 shadow-xl">
        <div className="m-auto w-full border-b pb-5 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
          <div className="col-start-2 justify-self-center">
            <img src={logo} alt="logo" className="m-auto" />
          </div>
          <div className="col-start-3 justify-self-end">
            <LogoutUser
              logoutUser={logoutUser}
              loggedinUser={loggedinUser}
              name={name}
            />
          </div>
        </div>
        <Routes>
          <Route path="/" element={<AuthPage setAlign={setAlign} />} />
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
                timeConsumed={timeConsumed}
                setTimeConsumed={setTimeConsumed}
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
                category={category}
                setCategoty={setCategoty}
                difficulty={difficulty}
                setDifficulty={setDifficulty}
              />
            }
          />
          <Route
            path="/dashboard"
            element={<Dashboard setAlign={setAlign} />}
          />
        </Routes>
      </main>
    </section>
  );
}

export default App;
