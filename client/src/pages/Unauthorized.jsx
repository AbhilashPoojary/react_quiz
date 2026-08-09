import React from "react";
import { Link } from "react-router-dom";

export default function Unauthorized() {
  return (
    <div className="py-12 text-center">
      <h1 className="app-strong-text mb-3 text-2xl font-bold">Unauthorized</h1>
      <p className="app-muted-text mb-6">
        You do not have permission to access this page.
      </p>
      <Link
        className="inline-block rounded bg-red-600 px-4 py-2 text-white transition hover:bg-red-800"
        to="/info"
      >
        Go to Quiz Setup
      </Link>
    </div>
  );
}
