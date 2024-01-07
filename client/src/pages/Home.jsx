import React, { useState, useRef } from "react";
import quizMaze from "../assets/homeimage.jpg";
import Categories from "../data/Categories";
import { useNavigate } from "react-router-dom";
import { Popper } from "react-popper";
import QuizDetails from "../components/QuizDetails";
export default function Home({
  requestQuestions,
  name,
  difficulty,
  category,
  enableTimer,
  setCategoty,
  setDifficulty,
  setEnableTimer,
  setName,
}) {
  const referenceElementRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const handleSubmit = (e) => {
    e.preventDefault();
    if (name === "" || name === null) {
      setError("Please enter the name of person");
      setTimeout(() => {
        setError("");
      }, 1000);
      return false;
    }
    requestQuestions();
    navigate("/quiz");
  };
  const handleTogglePopover = () => {
    setIsOpen(!isOpen);
  };
  return (
    <div className="flex">
      <div className="w-1/2">
        <h1 className="font-medium text-2xl">Quiz Settings</h1>
        <QuizDetails
          name={name}
          error={error}
          setName={setName}
          category={category}
          difficulty={difficulty}
          Categories={Categories}
          setCategoty={setCategoty}
          setDifficulty={setDifficulty}
          enableTimer={enableTimer}
          setEnableTimer={setEnableTimer}
          Popper={Popper}
          referenceElementRef={referenceElementRef}
          isOpen={isOpen}
          setIsOpen={setIsOpen}
          handleSubmit={handleSubmit}
          handleTogglePopover={handleTogglePopover}
        />
      </div>
      <div className="w-1/2 flex items-center justify-center ">
        <img className="rounded custom-quiz-image" src={quizMaze} alt="maze" />
      </div>
    </div>
  );
}
