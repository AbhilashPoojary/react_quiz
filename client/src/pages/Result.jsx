import React, { useEffect, useState } from "react";
import Categories from "../data/Categories";
import { useNavigate } from "react-router-dom";
import Dropdown from "../components/Dropdown";

export default function Result({
  name,
  score,
  setScore,
  setEnableTimer,
  setQuizData,
  setQuizIndex,
  setAlign,
}) {
  const navigate = useNavigate();
  const redirectHome = () => {
    setAlign(false);
    setScore(0);
    setEnableTimer(false);
    setQuizData([]);
    setQuizIndex(0);
    navigate("/info");
  };
  useEffect(() => {
    setAlign(true);
  }, []);
  return (
    <div>
      <h1 className="text-center mt-10 border-b pb-10">
        Congratulations <span className="font-semibold">{name}</span> you have
        scored <span className="font-semibold">{score}</span>
      </h1>
      <div>
        <h1 className="mt-5">Leaderboards</h1>
        <div className="flex justify-between gap-5 mt-5">
          <div className="w-1/3 p-4 bg-white border border-gray-200 rounded shadow dark:bg-gray-800 dark:border-gray-700 text-center">
            <h1>100</h1>
            <img
              className="w-24 h-24 mb-3 rounded-full shadow-lg m-auto"
              src="https://images.pexels.com/photos/5490276/pexels-photo-5490276.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
              alt="Bonnie image"
            />
            <div className="flex justify-between">
              <p>Abhilash</p>
              <span>1 min 20sec</span>
            </div>
          </div>
          <div className="w-1/3 p-4 bg-white border border-gray-200 rounded shadow dark:bg-gray-800 dark:border-gray-700 text-center">
            <h1>100</h1>
            <img
              className="w-24 h-24 mb-3 rounded-full shadow-lg m-auto"
              src="https://images.pexels.com/photos/5490276/pexels-photo-5490276.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
              alt="Bonnie image"
            />
            <div className="flex justify-between">
              <p>Abhilash</p>
              <span>1 min 20sec</span>
            </div>
          </div>
          <div className="w-1/3 p-4 bg-white border border-gray-200 rounded shadow dark:bg-gray-800 dark:border-gray-700 text-center">
            <h1>100</h1>
            <img
              className="w-24 h-24 mb-3 rounded-full shadow-lg m-auto"
              src="https://images.pexels.com/photos/5490276/pexels-photo-5490276.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
              alt="Bonnie image"
            />
            <div className="flex justify-between">
              <p>Abhilash</p>
              <span>1 min 20sec</span>
            </div>
          </div>
          <div className="w-1/3 p-4 bg-white border border-gray-200 rounded shadow dark:bg-gray-800 dark:border-gray-700 text-center">
            <h1>100</h1>
            <img
              className="w-24 h-24 mb-3 rounded-full shadow-lg m-auto"
              src="https://images.pexels.com/photos/5490276/pexels-photo-5490276.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
              alt="Bonnie image"
            />
            <div className="flex justify-between">
              <p>Abhilash</p>
              <span>1 min 20sec</span>
            </div>
          </div>
        </div>
      </div>
      <div className="border-t mt-10">
        <div className="flex justify-between gap-2 mt-3">
          <h1 className="mt-5 w-2/4">Leaderboards category wise</h1>
          <div className="w-1/4">
            <Dropdown data={Categories} />
          </div>
          <div className="w-1/4">
            <Dropdown
              data={[
                { category: "Easy", value: "easy" },
                { category: "Medium", value: "medium" },
                { category: "Hard", value: "hard" },
              ]}
            />
          </div>
        </div>

        <div className="relative overflow-x-auto mt-2 border">
          <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
              <tr>
                <th scope="col" className="px-6 py-3">
                  Name
                </th>
                <th scope="col" className="px-6 py-3">
                  Category
                </th>
                <th scope="col" className="px-6 py-3">
                  Difficulty
                </th>
                <th scope="col" className="px-6 py-3">
                  Average time
                </th>
                <th scope="col" className="px-6 py-3">
                  Score
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                <th
                  scope="row"
                  className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white"
                >
                  Abhilash
                </th>
                <td className="px-6 py-4">Books</td>
                <td className="px-6 py-4">Easy</td>
                <td className="px-6 py-4">15sec</td>
                <td className="px-6 py-4">100</td>
              </tr>
              <tr className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                <th
                  scope="row"
                  className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white"
                >
                  Abhilash
                </th>
                <td className="px-6 py-4">Books</td>
                <td className="px-6 py-4">Easy</td>
                <td className="px-6 py-4">15sec</td>
                <td className="px-6 py-4">100</td>
              </tr>
              <tr className="bg-white dark:bg-gray-800">
                <th
                  scope="row"
                  className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white"
                >
                  Abhilash
                </th>
                <td className="px-6 py-4">Books</td>
                <td className="px-6 py-4">Easy</td>
                <td className="px-6 py-4">15sec</td>
                <td className="px-6 py-4">100</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div className="flex justify-end mt-10">
        <button
          className="bg-red-600 hover:bg-red-800 transition duration-300 ease-in-out rounded p-3 text-white"
          onClick={redirectHome}
        >
          Back to home
        </button>
      </div>
    </div>
  );
}
