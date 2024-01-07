import React, { useState } from "react";
import { LogOut, UserCircle } from "lucide-react";

export default function LogoutUser({ logoutUser }) {
  const [show, setShow] = useState(false);
  const expandBtn = () => {
    setShow(!show);
  };
  return (
    <div
      className={`flex bg-gray-400 p-2 rounded ${show ? "gap-3" : ""}`}
      onMouseEnter={expandBtn}
      onMouseLeave={expandBtn}
    >
      <UserCircle className="text-white " />
      <span
        className={`trsansit-name font-bold text-white ${show ? "" : "hide"}`}
      >
        Abhilash
      </span>
      <LogOut
        className={`trsansit-icon cursor-pointer text-white ${
          show ? "" : "hide"
        }`}
        onClick={logoutUser}
      />
    </div>
  );
}
