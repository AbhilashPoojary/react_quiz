import React from "react";
import { Link } from "react-router-dom";

export default function Signin({ switchToSignUp, authenticate }) {
  return (
    <div className="form-container">
      <h2 className="my-4 text-center font-semibold text-xl">
        Sign in to the Quiz
      </h2>
      <form className="w-1/2 m-auto border p-10 rounded bg-gray-50">
        <div className="sm:col-span-2 mb-4">
          <label
            htmlFor="email"
            className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
          >
            Email
          </label>
          <input
            type="email"
            name="email"
            id="email"
            className="border border-gray-300 text-sm rounded block w-full p-2.5 outline-none"
            placeholder="Type your email"
          />
        </div>
        <div className="sm:col-span-2 mb-4">
          <label
            htmlFor="password"
            className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
          >
            Password
          </label>
          <input
            type="password"
            name="password"
            id="password"
            className="outline-none border border-gray-300 text-gray-900 text-sm rounded focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
            placeholder="Type your email"
          />
        </div>
      </form>
      <div className="flex justify-between w-1/2 m-auto items-center mt-4 flex-row-reverse">
        <button
          onClick={authenticate}
          className="bg-red-600 hover:bg-red-800 transition duration-300 ease-in-out rounded px-3 py-2 text-white"
        >
          Submit
        </button>
        <Link className="underline text-blue-500" onClick={switchToSignUp}>
          Register here
        </Link>
      </div>
    </div>
  );
}
