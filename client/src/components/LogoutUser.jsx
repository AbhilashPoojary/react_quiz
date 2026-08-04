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
          className={`flex items-center bg-gray-400 p-2 rounded-[999px] overflow-hidden transition-[gap] duration-500 ease-out ${
            show ? "gap-3" : "gap-0"
          }`}
          onMouseEnter={expandBtn}
          onMouseLeave={expandBtn}
        >
          <UserCircle className="text-white shrink-0" />
          <span
            className={`text-elips trsansit-name font-bold text-white whitespace-nowrap transition-all duration-500 ease-out ${
              show
                ? "opacity-100 max-w-[160px] translate-x-0"
                : "opacity-0 max-w-0 -translate-x-2"
            }`}
          >
            {loggedinUser ? loggedinUser : name}
          </span>
          <LogOut
            className={`trsansit-icon cursor-pointer text-white shrink-0 transition-all duration-500 ease-out ${
              show
                ? "opacity-100 max-w-[24px] translate-x-0"
                : "opacity-0 max-w-0 translate-x-2"
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
