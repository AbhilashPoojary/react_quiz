import React from "react";
import LoadingOverlay from "./LoadingOverlay";

export default function AuthLoadingOverlay({ show, message }) {
  return <LoadingOverlay show={show} message={message} />;
}
