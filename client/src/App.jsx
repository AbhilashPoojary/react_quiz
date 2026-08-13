import React, { useEffect, useRef, useState } from "react";
import apiClient from "./utils/apiClient";
import { Routes, Route, Navigate } from "react-router-dom";
import LogoutUser from "./components/LogoutUser";
import ProtectedRoute from "./components/ProtectedRoute";
import PasswordExpiryAlert from "./components/PasswordExpiryAlert";
import AdminRoute from "./components/AdminRoute";
import AdminLayout from "./components/AdminLayout";
import "./styles.css";
import logo from "./assets/quiz-playground-logo.png";
import Home from "./pages/Home";
import QuizPage from "./pages/QuizPage";
import { shuffleArray } from "./utils/utilFunc";
import Result from "./pages/Result";
import { useLocation, useNavigate } from "react-router-dom";
import AuthPage from "./pages/AuthPage";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import ChangePassword from "./pages/ChangePassword";
import { useDispatch, useSelector } from "react-redux";
import { selectUserInfo, isReady } from "./slice/authSlice";
import { LOG_OUT } from "./slice/authSlice";
import { insertScoreCall } from "./slice/insertScoreSlice";
import Dashboard from "./pages/Dashboard";
import ErrorNotification from "./components/ErrorNotification";
import { applyTheme, getSavedTheme } from "./components/UserProfile";
import MyProfile from "./pages/MyProfile";
import Notifications from "./pages/Notifications";
import MyEvents from "./pages/MyEvents";
import EventQuiz from "./pages/EventQuiz";
import EventResult from "./pages/EventResult";
import QuizAnalysis from "./pages/QuizAnalysis";
import ChallengeCreate from "./pages/ChallengeCreate";
import ChallengeLanding from "./pages/ChallengeLanding";
import ChallengePlay from "./pages/ChallengePlay";
import ChallengeResult from "./pages/ChallengeResult";
import Unauthorized from "./pages/Unauthorized";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminEvents from "./pages/admin/AdminEvents";
import AdminCreateEvent from "./pages/admin/AdminCreateEvent";
import AdminEditEvent from "./pages/admin/AdminEditEvent";
import AdminQuestionBank from "./pages/admin/AdminQuestionBank";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminUserDetails from "./pages/admin/AdminUserDetails";
import AdminNotifications from "./pages/admin/AdminNotifications";
import AdminEmailTemplates from "./pages/admin/AdminEmailTemplates";
import AdminEmailTemplateDetails from "./pages/admin/AdminEmailTemplateDetails";

function App() {
  const [name, setName] = useState("");
  const [category, setCategoty] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [questionType, setQuestionType] = useState("");
  const [questionCount, setQuestionCount] = useState(0);
  const [enableTimer, setEnableTimer] = useState(false);
  const [timerMode, setTimerMode] = useState("PER_QUESTION");
  const [totalDuration, setTotalDuration] = useState(null);
  const [timePerQuestion, setTimePerQuestion] = useState(20);
  const [quizData, setQuizData] = useState([]);
  const [quizIndex, setQuizIndex] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState([]);
  const [loading, setLoading] = useState(false);
  const [score, setScore] = useState(0);
  const [align, setAlign] = useState(false);
  const [loggedinUser, setLoggedinUser] = useState("");
  const [timeConsumed, setTimeConsumed] = useState(0);
  const [answerAnalysis, setAnswerAnalysis] = useState([]);
  const [lastAttemptId, setLastAttemptId] = useState("");
  const [sessionNotification, setSessionNotification] = useState({
    type: "info",
    message: "",
  });
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const scoreRef = useRef(score);
  const timeConsumedRef = useRef(timeConsumed);
  const answerAnalysisRef = useRef(answerAnalysis);
  const userInfo = useSelector(selectUserInfo);
  const readystate = useSelector(isReady);
  const isAuthPage = location.pathname === "/" || location.pathname === "/login";

  useEffect(() => {
    applyTheme(getSavedTheme());
  }, []);

  const requestQuestions = async () => {
    try {
      setLoading(true);
      setQuizData([]);
      setScore(0);
      setTimeConsumed(0);
      setAnswerAnalysis([]);
      answerAnalysisRef.current = [];
      setLastAttemptId("");
      const response = await apiClient.get("/api/questions", {
        params: {
          amount: questionCount,
          category,
          difficulty,
          type: questionType,
        },
      });
      const questions = Array.isArray(response.data) ? response.data : [];

      if (questions.length === 0) {
        return {
          success: false,
          message:
            "No questions were found for these settings. Please try another category, difficulty, or question type.",
        };
      }

      setQuizData(questions);
      setQuizIndex(0);
      setCurrentQuestion([]);

      return { success: true };
    } catch (error) {
      console.error(error);
      const status = error?.response?.status;
      const serverMessage = error?.response?.data?.error;
      const message =
        status === 500
          ? "Questions could not be loaded right now. Please try again in a moment."
          : serverMessage ||
            "Unable to load questions. Please check your connection and try again.";

      return {
        success: false,
        message,
      };
    } finally {
      setLoading(false);
    }
  };
  const recordAnswer = (selectedAnswer = "") => {
    const question = quizData[quizIndex];

    if (!question) {
      return;
    }

    const isCorrect = selectedAnswer === question.correct_answer;
    const options =
      currentQuestion?.answers?.length > 0
        ? currentQuestion.answers
        : [question.correct_answer, ...(question.incorrect_answers || [])];

    const nextAnswers = [
      ...answerAnalysisRef.current,
      {
        question: question.question,
        options,
        selectedAnswer,
        correctAnswer: question.correct_answer,
        isCorrect,
        category: question.category || category,
        difficulty: question.difficulty || difficulty,
        pointsEarned: isCorrect ? 10 : 0,
      },
    ];

    answerAnalysisRef.current = nextAnswers;
    setAnswerAnalysis(nextAnswers);
  };

  const buildAnswerAnalysisItem = (question, selectedAnswer = "", index = quizIndex) => {
    const isCorrect = selectedAnswer === question.correct_answer;
    const options =
      index === quizIndex && currentQuestion?.answers?.length > 0
        ? currentQuestion.answers
        : [question.correct_answer, ...(question.incorrect_answers || [])];

    return {
      question: question.question,
      options,
      selectedAnswer,
      correctAnswer: question.correct_answer,
      isCorrect,
      category: question.category || category,
      difficulty: question.difficulty || difficulty,
      pointsEarned: isCorrect ? 10 : 0,
    };
  };

  const finishQuiz = async ({ answersOverride, timeTaken } = {}) => {
    const storedUser = JSON.parse(localStorage.getItem("currentUser"));
    const finalAnswers = answersOverride || answerAnalysisRef.current;
    const latestScore = finalAnswers.reduce(
      (sum, item) => sum + (item.isCorrect ? 10 : 0),
      0
    );
    const latestTimeConsumed =
      timeTaken === undefined ? timeConsumedRef.current : timeTaken;
    const completedQuestionCount = quizData.length || Number(questionCount);
    const maxScore = completedQuestionCount * 10;
    const correctAnswers = Math.round(latestScore / 10);
    const wrongAnswers = Math.max(0, completedQuestionCount - correctAnswers);
    const accuracy = completedQuestionCount
      ? (correctAnswers / completedQuestionCount) * 100
      : 0;
    const averageTimePerQuestion = completedQuestionCount
      ? latestTimeConsumed / completedQuestionCount
      : 0;
    const scorePercentage = maxScore ? (latestScore / maxScore) * 100 : 0;
    const obj = {
      name,
      category,
      difficulty,
      score: latestScore,
      maxScore,
      correctAnswers,
      wrongAnswers,
      accuracy,
      questionCount: completedQuestionCount,
      totaltime: latestTimeConsumed,
      timeTaken: latestTimeConsumed,
      averageTimePerQuestion,
      scorePercentage,
      profilePicture: storedUser?.user?.profilePicture,
      userId: storedUser?.user?._id,
      answers: finalAnswers,
    };

    setScore(latestScore);
    setTimeConsumed(latestTimeConsumed);
    answerAnalysisRef.current = finalAnswers;
    setAnswerAnalysis(finalAnswers);

    try {
      const savedAttempt = await dispatch(insertScoreCall(obj)).unwrap();
      setLastAttemptId(savedAttempt?._id || "");
      navigate("/result", {
        state: { attemptId: savedAttempt?._id || "" },
      });
    } catch (error) {
      console.error(error);
      navigate("/result");
    }
    setCategoty("");
    setDifficulty("");
    setQuestionType("");
  };

  const finishQuizWithUnanswered = async (timeTaken) => {
    const answeredCount = answerAnalysisRef.current.length;
    const unansweredAnswers = quizData
      .slice(answeredCount)
      .map((question, offset) =>
        buildAnswerAnalysisItem(question, "", answeredCount + offset)
      );
    await finishQuiz({
      answersOverride: [...answerAnalysisRef.current, ...unansweredAnswers],
      timeTaken,
    });
  };

  const nextQuestion = async () => {
    if (quizIndex + 1 < quizData.length) {
      setQuizIndex(quizIndex + 1);
    } else {
      await finishQuiz();
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
    timeConsumedRef.current = timeConsumed;
  }, [timeConsumed]);

  useEffect(() => {
    answerAnalysisRef.current = answerAnalysis;
  }, [answerAnalysis]);

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
        answers: shuffledAnswers,
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
        !align ? "min-h-screen" : "min-h-screen py-4"
      } flex flex-col items-center justify-center px-3 sm:px-4`}
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
      <PasswordExpiryAlert />
      <main className="w-full max-w-6xl rounded border p-4 shadow-xl sm:p-6 lg:p-10 xl:p-8">
        <div
          className={`m-auto flex w-full items-center gap-3 border-b pb-4 sm:gap-4 sm:pb-5 ${
            isAuthPage ? "justify-center" : "justify-between"
          }`}
        >
          <div className="justify-self-start">
            {isAuthPage ? (
              <img
                src={logo}
                alt="logo"
                className="m-auto max-h-14 max-w-[180px] sm:max-h-none sm:max-w-none"
              />
            ) : (
              <button
                aria-label="Go to quiz setup"
                className="block focus:outline-none"
                type="button"
                onClick={() => navigate("/info")}
              >
                <img
                  src={logo}
                  alt="logo"
                  className="m-auto max-h-14 max-w-[180px] sm:max-h-none sm:max-w-none"
                />
              </button>
            )}
          </div>
          {!isAuthPage && (
            <div className="justify-self-end">
              <LogoutUser
                logoutUser={logoutUser}
                loggedinUser={loggedinUser}
                name={name}
              />
            </div>
          )}
        </div>
        <Routes>
          <Route path="/" element={<AuthPage setAlign={setAlign} />} />
          <Route path="/login" element={<AuthPage setAlign={setAlign} />} />
          <Route
            path="/forgot-password"
            element={<ForgotPassword setAlign={setAlign} />}
          />
          <Route
            path="/reset-password/:token"
            element={<ResetPassword setAlign={setAlign} />}
          />
          <Route
            path="/change-password"
            element={
              <ProtectedRoute>
                <ChangePassword setAlign={setAlign} />
              </ProtectedRoute>
            }
          />
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route
            path="/info"
            element={
              <ProtectedRoute>
                <Home
                  requestQuestions={requestQuestions}
                  name={name}
                  category={category}
                  enableTimer={enableTimer}
                  difficulty={difficulty}
                  questionCount={questionCount}
                  setCategoty={setCategoty}
                  setDifficulty={setDifficulty}
                  questionType={questionType}
                  setQuestionType={setQuestionType}
                  setQuestionCount={setQuestionCount}
                  setEnableTimer={setEnableTimer}
                  timerMode={timerMode}
                  setTimerMode={setTimerMode}
                  totalDuration={totalDuration}
                  setTotalDuration={setTotalDuration}
                  timePerQuestion={timePerQuestion}
                  setTimePerQuestion={setTimePerQuestion}
                  setName={setName}
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/quiz"
            element={
              <ProtectedRoute>
                <QuizPage
                  quizData={quizData}
                  name={name}
                  loading={loading}
                  currentQuestion={currentQuestion}
                  totalQuestions={quizData.length}
                  nextQuestion={nextQuestion}
                  recordAnswer={recordAnswer}
                  setScore={setScore}
                  score={score}
                  setQuizData={setQuizData}
                  quizIndex={quizIndex}
                  setQuizIndex={setQuizIndex}
                  enableTimer={enableTimer}
                  timerMode={timerMode}
                  totalDuration={totalDuration}
                  timePerQuestion={timePerQuestion}
                  setEnableTimer={setEnableTimer}
                  timeConsumed={timeConsumed}
                  setTimeConsumed={setTimeConsumed}
                  finishQuizWithUnanswered={finishQuizWithUnanswered}
                  lastAttemptId={lastAttemptId}
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/result"
            element={
              <ProtectedRoute>
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
                  questionCount={questionCount}
                  timeConsumed={timeConsumed}
                  setTimeConsumed={setTimeConsumed}
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/quiz-analysis/:attemptId"
            element={
              <ProtectedRoute>
                <QuizAnalysis setAlign={setAlign} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/challenge/create"
            element={
              <ProtectedRoute>
                <ChallengeCreate setAlign={setAlign} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/challenge/:code"
            element={
              <ProtectedRoute>
                <ChallengeLanding setAlign={setAlign} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/challenge/:code/play"
            element={
              <ProtectedRoute>
                <ChallengePlay setAlign={setAlign} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/challenge/:code/results"
            element={
              <ProtectedRoute>
                <ChallengeResult setAlign={setAlign} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard setAlign={setAlign} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <MyProfile setAlign={setAlign} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <Notifications setAlign={setAlign} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/events"
            element={
              <ProtectedRoute>
                <MyEvents setAlign={setAlign} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/events/:id/play"
            element={
              <ProtectedRoute>
                <EventQuiz setAlign={setAlign} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/events/:id/result"
            element={
              <ProtectedRoute>
                <EventResult setAlign={setAlign} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminLayout logoutUser={logoutUser} />
              </AdminRoute>
            }
          >
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="events" element={<AdminEvents />} />
            <Route path="question-bank" element={<AdminQuestionBank />} />
            <Route path="events/create" element={<AdminCreateEvent />} />
            <Route path="events/:id/edit" element={<AdminEditEvent />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="users/:userId" element={<AdminUserDetails />} />
            <Route path="notifications" element={<AdminNotifications />} />
            <Route path="email-templates" element={<AdminEmailTemplates />} />
            <Route
              path="email-templates/:templateId"
              element={<AdminEmailTemplateDetails mode="view" />}
            />
            <Route
              path="email-templates/:templateId/edit"
              element={<AdminEmailTemplateDetails mode="edit" />}
            />
          </Route>
        </Routes>
      </main>
    </section>
  );
}

export default App;
