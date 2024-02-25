import React, { useState, useEffect } from "react";
import { LogOut, UserCircle } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { LOG_OUT, loading } from "../slice/authSlice";
import { selectUserInfo, isReady } from "../slice/authSlice";

export default function LogoutUser({ logoutUser, name }) {
  const dispatch = useDispatch();
  const [show, setShow] = useState(false);
  const [loggedinUser, setLoggedinUser] = useState();
  const currentUser = useSelector(selectUserInfo);
  const readystate = useSelector(isReady);
  const expandBtn = () => {
    setShow(!show);
  };
  useEffect(() => {
    const fetchUser = () => {
      try {
        const currentUser = JSON.parse(localStorage.getItem("currentUser"));
        const userName = currentUser?.user?.name;
        setLoggedinUser(userName);
      } catch (error) {
        console.error("Error fetching user data", error);
      }
    };
    fetchUser();
  }, [readystate]);
  return (
    <>
      {loggedinUser ? (
        <div
          className={`flex bg-gray-400 p-2 rounded ${show ? "gap-3" : ""}`}
          onMouseEnter={expandBtn}
          onMouseLeave={expandBtn}
        >
          <UserCircle className="text-white " />
          <span
            className={`text-elips trsansit-name font-bold text-white ${
              show ? "" : "hide"
            }`}
          >
            {loggedinUser ? loggedinUser : name}
          </span>
          <LogOut
            className={`trsansit-icon cursor-pointer text-white ${
              show ? "" : "hide"
            }`}
            onClick={() => logoutUser()}
          />
        </div>
      ) : (
        ""
      )}
    </>
  );
}
