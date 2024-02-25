import React, { useEffect } from "react";
import Tooltip from "./Tooltip";
import Dropdown from "./Dropdown";
import InputCheckbox from "./InputCheckbox";
import InputText from "./InputText";
import ErrorNotification from "./ErrorNotification";

export default function QuizDetails({
  handleSubmit,
  name,
  error,
  setName,
  category,
  setCategoty,
  Categories,
  difficulty,
  setDifficulty,
  isOpen,
  enableTimer,
  setEnableTimer,
  referenceElementRef,
  handleTogglePopover,
  Popper,
  set,
}) {
  useEffect(() => {
    setName(JSON.parse(localStorage.getItem("currentUser"))?.user?.name);
  }, []);
  console.log(error);
  return (
    <form className="mt-3" onSubmit={handleSubmit}>
      <ErrorNotification error={error} />
      <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
        <InputText
          name="name"
          value={name}
          setValue={setName}
          label="User Name"
          placeholder="Please enter the name"
          type="text"
          disabled={true}
        />
        <div className="sm:col-span-2">
          <label
            htmlFor="category"
            className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
          >
            Category
          </label>
          <Dropdown data={Categories} setState={setCategoty} state={category} />
        </div>
        <div className="sm:col-span-2">
          <label
            htmlFor="difficulty"
            className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
          >
            Difficulty
          </label>
          <Dropdown
            data={[
              { category: "Easy", value: "easy" },
              { category: "Medium", value: "medium" },
              { category: "Hard", value: "hard" },
            ]}
            setState={setDifficulty}
            state={difficulty}
          />
        </div>
        <InputCheckbox
          Tooltip={Tooltip}
          Popper={Popper}
          handleTogglePopover={handleTogglePopover}
          referenceElementRef={referenceElementRef}
          isOpen={isOpen}
          message="Enable this for leaderboard"
          value={enableTimer}
          setValue={setEnableTimer}
          label="Enable timer"
          name="timer"
        />
        <div className="sm:col-span-2">
          <button
            type="submit"
            className="bg-red-600 hover:bg-red-800 transition duration-300 ease-in-out rounded p-3 text-white"
          >
            Start quiz
          </button>
        </div>
      </div>
    </form>
  );
}
