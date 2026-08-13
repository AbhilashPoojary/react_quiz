import React, { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  Check,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Moon,
  Bell,
  Trophy,
  Palette,
  Sun,
  User,
  UserCircle,
} from "lucide-react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { selectUserInfo, selectUserRole } from "../slice/authSlice";
import apiClient from "../utils/apiClient";

const THEME_STORAGE_KEY = "theme";
const DEFAULT_THEME = "light";

export function applyTheme(theme) {
  const selectedTheme = theme === "dark" ? "dark" : DEFAULT_THEME;
  document.documentElement.setAttribute("data-theme", selectedTheme);
  localStorage.setItem(THEME_STORAGE_KEY, selectedTheme);
}

export function getSavedTheme() {
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  return savedTheme === "dark" ? "dark" : DEFAULT_THEME;
}

export default function UserProfile({ logoutUser, loggedinUser, name }) {
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const currentUserName = useSelector(selectUserInfo);
  const userRole = useSelector(selectUserRole);
  const [isOpen, setIsOpen] = useState(false);
  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const [isRecentOpen, setIsRecentOpen] = useState(false);
  const [theme, setTheme] = useState(DEFAULT_THEME);
  const [unreadCount, setUnreadCount] = useState(0);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const userName = currentUserName || loggedinUser || name;
  const isAdmin = userRole === "ADMIN";

  useEffect(() => {
    const savedTheme = getSavedTheme();
    setTheme(savedTheme);
    applyTheme(savedTheme);
  }, []);

  useEffect(() => {
    const loadUnreadCount = async () => {
      try {
        const [countResponse, notificationsResponse] = await Promise.all([
          apiClient.get("/api/notifications/unread-count"),
          apiClient.get("/api/notifications"),
        ]);
        setUnreadCount(countResponse.data.count || 0);
        setRecentNotifications((notificationsResponse.data || []).slice(0, 3));
      } catch (error) {
        setUnreadCount(0);
        setRecentNotifications([]);
      }
    };

    if (userName) {
      loadUnreadCount();
    }
  }, [userName, isOpen]);

  useEffect(() => {
    const closeDropdown = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    const closeOnEscape = (event) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", closeDropdown);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("mousedown", closeDropdown);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  const handleThemeChange = (selectedTheme) => {
    setTheme(selectedTheme);
    applyTheme(selectedTheme);
  };

  const handleProfileClick = () => {
    setIsOpen(false);
    navigate("/profile");
  };

  const handleAdminDashboardClick = () => {
    setIsOpen(false);
    navigate("/admin/dashboard");
  };

  const handleQuizSetupClick = () => {
    setIsOpen(false);
    navigate("/info");
  };

  const handleNotificationsClick = () => {
    setIsOpen(false);
    navigate("/notifications");
  };

  const handleMyEventsClick = () => {
    setIsOpen(false);
    navigate("/events");
  };

  const handleLogout = () => {
    setIsOpen(false);
    logoutUser();
  };

  if (!userName) {
    return null;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="relative rounded-full border p-2 text-red-600 transition hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500"
          aria-label={`${unreadCount} unread notifications`}
          onClick={() => setIsOpen((prevState) => !prevState)}
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-red-600 px-1 text-center text-[10px] font-bold leading-5 text-white ring-2 ring-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
        <button
          type="button"
          className="flex items-center gap-2 rounded-full bg-gray-400 p-2 text-white transition duration-300 ease-in-out hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          aria-haspopup="menu"
          aria-expanded={isOpen}
          aria-label="Open user profile menu"
          onClick={() => setIsOpen((prevState) => !prevState)}
        >
          <UserCircle className="shrink-0" size={24} />
          <span className="hidden max-w-[120px] truncate text-sm font-bold sm:inline">
            {userName}
          </span>
          <ChevronDown
            className={`shrink-0 transition-transform duration-300 ${
              isOpen ? "rotate-180" : ""
            }`}
            size={16}
          />
        </button>
      </div>

      <div
        className={`user-profile-menu absolute right-0 z-20 mt-2 w-[min(15rem,calc(100vw-2rem))] origin-top-right rounded border py-2 shadow-lg transition-all duration-200 ease-out ${
          isOpen
            ? "visible translate-y-0 scale-100 opacity-100"
            : "invisible -translate-y-2 scale-95 opacity-0"
        }`}
        role="menu"
        aria-label="User profile menu"
      >
        <div className="user-profile-menu-section border-b px-4 py-2">
          <p className="user-profile-muted text-xs">Signed in as</p>
          <p className="truncate text-sm font-semibold">{userName}</p>
        </div>

        {isAdmin && (
          <button
            type="button"
            className="user-profile-menu-item flex w-full items-center gap-3 px-4 py-2 text-left text-sm transition focus:outline-none"
            role="menuitem"
            onClick={handleAdminDashboardClick}
          >
            <LayoutDashboard size={17} />
            <span>Admin Dashboard</span>
          </button>
        )}

        <button
          type="button"
          className="user-profile-menu-item flex w-full items-center gap-3 px-4 py-2 text-left text-sm transition focus:outline-none"
          role="menuitem"
          onClick={handleProfileClick}
        >
          <User size={17} />
          <span>My Profile</span>
        </button>

        <button
          type="button"
          className="user-profile-menu-item flex w-full items-center gap-3 px-4 py-2 text-left text-sm transition focus:outline-none"
          role="menuitem"
          onClick={handleQuizSetupClick}
        >
          <ClipboardList size={17} />
          <span>Quiz Setup</span>
        </button>

        <div className="user-profile-menu-section border-b">
          <button
            type="button"
            className="user-profile-menu-item flex w-full items-center justify-between px-4 py-2 text-left text-sm transition focus:outline-none"
            aria-expanded={isRecentOpen}
            onClick={() => setIsRecentOpen((prevState) => !prevState)}
          >
            <span className="flex items-center gap-3">
              <span className="relative">
                <Bell size={17} />
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-red-600" />
                )}
              </span>
              <span>Notifications</span>
              {unreadCount > 0 && (
                <span className="rounded-full bg-red-600 px-2 py-0.5 text-xs text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </span>
            <ChevronDown
              className={`transition-transform duration-200 ${
                isRecentOpen ? "rotate-180" : ""
              }`}
              size={15}
            />
          </button>
          <div
            className={`overflow-hidden px-4 transition-all duration-200 ease-out ${
              isRecentOpen ? "max-h-72 pb-2 opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            {recentNotifications.length > 0 ? (
              <div className="space-y-2">
                {recentNotifications.map((item) => (
                  <button
                    className="block w-full rounded p-2 text-left text-xs transition hover:bg-gray-100"
                    key={item._id}
                    type="button"
                    onClick={handleNotificationsClick}
                  >
                    <span className="app-strong-text block truncate font-semibold">
                      {item.title}
                    </span>
                    <span className="app-muted-text block truncate">
                      {item.message}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="app-muted-text px-2 py-2 text-xs">
                No recent notifications.
              </p>
            )}
            <button
              type="button"
              className="mt-2 w-full rounded border border-red-600 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50"
              onClick={handleNotificationsClick}
            >
              View all notifications
            </button>
          </div>
        </div>

        <button
          type="button"
          className="user-profile-menu-item flex w-full items-center gap-3 px-4 py-2 text-left text-sm transition focus:outline-none"
          role="menuitem"
          onClick={handleMyEventsClick}
        >
          <Trophy size={17} />
          <span>My Events</span>
        </button>

        <button
          type="button"
          className="user-profile-menu-item flex w-full items-center justify-between px-4 py-2 text-left text-sm transition focus:outline-none"
          role="menuitem"
          aria-expanded={isThemeOpen}
          onClick={() => setIsThemeOpen((prevState) => !prevState)}
        >
          <span className="flex items-center gap-3">
            <Palette size={17} />
            <span>Theme</span>
          </span>
          <ChevronDown
            className={`transition-transform duration-200 ${
              isThemeOpen ? "rotate-180" : ""
            }`}
            size={15}
          />
        </button>

        <div
          className={`overflow-hidden transition-all duration-200 ease-out ${
            isThemeOpen ? "max-h-24 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <button
            type="button"
            className={`user-profile-menu-item flex w-full items-center gap-3 px-4 py-2 pl-8 text-left text-sm transition focus:outline-none ${
              theme === "light" ? "font-semibold text-red-600" : ""
            }`}
            role="menuitemradio"
            aria-checked={theme === "light"}
            onClick={() => handleThemeChange("light")}
          >
            <Sun size={17} />
            <span className="flex flex-1 items-center justify-between">
              Light
              {theme === "light" && <Check size={15} aria-hidden="true" />}
            </span>
          </button>

          <button
            type="button"
            className={`user-profile-menu-item flex w-full items-center gap-3 px-4 py-2 pl-8 text-left text-sm transition focus:outline-none ${
              theme === "dark" ? "font-semibold text-red-600" : ""
            }`}
            role="menuitemradio"
            aria-checked={theme === "dark"}
            onClick={() => handleThemeChange("dark")}
          >
            <Moon size={17} />
            <span className="flex flex-1 items-center justify-between">
              Dark
              {theme === "dark" && <Check size={15} aria-hidden="true" />}
            </span>
          </button>
        </div>

        <button
          type="button"
          className="user-profile-menu-item user-profile-logout mt-1 flex w-full items-center gap-3 border-t px-4 py-2 pt-3 text-left text-sm text-red-600 transition focus:outline-none"
          role="menuitem"
          onClick={handleLogout}
        >
          <LogOut size={17} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
