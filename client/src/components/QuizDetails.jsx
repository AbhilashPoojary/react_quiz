import React, { useEffect, useState } from "react";
import Tooltip from "./Tooltip";
import Dropdown from "./Dropdown";
import InputCheckbox from "./InputCheckbox";
import InputText from "./InputText";
import ErrorNotification from "./ErrorNotification";
import { CustomCheckbox } from "./CustomSelectionControls";

export default function QuizDetails({
  handleSubmit,
  name,
  error,
  setName,
  category,
  setCategoty,
  Categories,
  difficulty,
  questionType,
  questionCount,
  setDifficulty,
  setQuestionType,
  setQuestionCount,
  isOpen,
  setIsOpen,
  enableTimer,
  setEnableTimer,
  showAnswerFeedback = true,
  setShowAnswerFeedback,
  formErrors = {},
  nameRules,
  setFormErrors,
  referenceElementRef,
  handleTogglePopover,
  Popper,
  set,
  duration = 5000,
  onHide,
  onChallenge,
}) {
  const [loggedInUserName, setLoggedInUserName] = useState("");

  useEffect(() => {
    const currentUserName = JSON.parse(localStorage.getItem("currentUser"))
      ?.user?.name;

    if (currentUserName) {
      setLoggedInUserName(currentUserName);
      setName(currentUserName);
    }
  }, []);

  return (
    <form className="mt-3" onSubmit={handleSubmit}>
      <ErrorNotification error={error} duration={duration} onHide={onHide} />
      <div className="grid gap-4 sm:grid-cols-2 sm:gap-4">
        {loggedInUserName ? (
          <div className="sm:col-span-2 mb-1">
            <p className="app-muted-text text-sm font-medium text-gray-600">
              Welcome back,
            </p>
            <h2 className="app-strong-text text-xl font-semibold text-gray-900">
              {loggedInUserName}
            </h2>
          </div>
        ) : (
          <InputText
            name="name"
            value={name}
            setValue={(value) => {
              setName(value);
              setFormErrors?.((prev) => ({ ...prev, name: "" }));
            }}
            label="User Name"
            placeholder="Please enter the name"
            type="text"
            required
            rules={nameRules}
            error={formErrors.name}
            onValidate={(message) =>
              setFormErrors?.((prev) => ({ ...prev, name: message }))
            }
          />
        )}
        <div className="sm:col-span-2">
          <label
            htmlFor="category"
            className="app-label block mb-2 text-sm font-medium text-gray-900"
          >
            Category
            <span className="text-red-600"> *</span>
          </label>
          <Dropdown
            data={Categories}
            setState={(value) => {
              setCategoty(value);
              setFormErrors?.((prev) => ({ ...prev, category: "" }));
            }}
            state={category}
            dropdownId="quiz-category"
          />
          {formErrors.category && (
            <p className="mt-1 text-sm text-red-600">{formErrors.category}</p>
          )}
        </div>
        <div className="sm:col-span-2">
          <label
            htmlFor="difficulty"
            className="app-label block mb-2 text-sm font-medium text-gray-900"
          >
            Difficulty
            <span className="text-red-600"> *</span>
          </label>
          <Dropdown
            data={[
              { category: "Easy", value: "easy" },
              { category: "Medium", value: "medium" },
              { category: "Hard", value: "hard" },
            ]}
            setState={(value) => {
              setDifficulty(value);
              setFormErrors?.((prev) => ({ ...prev, difficulty: "" }));
            }}
            state={difficulty}
            dropdownId="quiz-difficulty"
          />
          {formErrors.difficulty && (
            <p className="mt-1 text-sm text-red-600">
              {formErrors.difficulty}
            </p>
          )}
        </div>
        <div className="sm:col-span-2">
          <label
            htmlFor="questionType"
            className="app-label block mb-2 text-sm font-medium text-gray-900"
          >
            Question Type
            <span className="text-red-600"> *</span>
          </label>
          <Dropdown
            data={[
              { category: "Select", value: "" },
              { category: "Multiple Choice", value: "multiple" },
              { category: "True / False", value: "boolean" },
            ]}
            setState={(value) => {
              setQuestionType(value);
              setFormErrors?.((prev) => ({ ...prev, questionType: "" }));
            }}
            state={questionType}
            dropdownId="quiz-question-type"
          />
          {formErrors.questionType && (
            <p className="mt-1 text-sm text-red-600">
              {formErrors.questionType}
            </p>
          )}
        </div>
        <div className="sm:col-span-2">
          <label
            htmlFor="questionCount"
            className="app-label block mb-2 text-sm font-medium text-gray-900"
          >
            Number of Questions
            <span className="text-red-600"> *</span>
          </label>
          <Dropdown
            data={[
              { category: "10", value: 10 },
              { category: "15", value: 15 },
              { category: "20", value: 20 },
              { category: "25", value: 25 },
            ]}
            setState={(value) => {
              setQuestionCount(value);
              setFormErrors?.((prev) => ({ ...prev, questionCount: "" }));
            }}
            state={questionCount}
            dropdownId="quiz-question-count"
          />
          {formErrors.questionCount && (
            <p className="mt-1 text-sm text-red-600">
              {formErrors.questionCount}
            </p>
          )}
        </div>
        <InputCheckbox
          Tooltip={Tooltip}
          Popper={Popper}
          handleTogglePopover={handleTogglePopover}
          referenceElementRef={referenceElementRef}
          isOpen={isOpen}
          setIsOpen={setIsOpen}
          message="Enable countdown timer"
          value={enableTimer}
          setValue={setEnableTimer}
          label="Timed Quiz"
          name="timer"
        />
        <div className="flex items-start">
          <CustomCheckbox
            checked={showAnswerFeedback}
            label="Show Answer Feedback"
            name="answerFeedback"
            onChange={setShowAnswerFeedback}
          />
        </div>
        <div className="grid gap-3 sm:col-span-2 sm:grid-cols-2">
          <button
            type="submit"
            className="w-full bg-red-600 hover:bg-red-800 transition duration-300 ease-in-out rounded p-3 text-white"
          >
            Start Quiz
          </button>
          {onChallenge && (
            <button
              type="button"
              className="analysis-outline-button w-full rounded border border-red-600 p-3 text-red-600 transition duration-300 ease-in-out"
              onClick={onChallenge}
            >
              Challenge a Friend
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
