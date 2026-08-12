import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import {
  BarChart3,
  Bell,
  CalendarDays,
  LogOut,
  Mail,
  Users,
} from "lucide-react";

const navLinkClass = ({ isActive }) =>
  `flex items-center gap-2 rounded px-3 py-2 text-sm font-medium transition ${
    isActive
      ? "bg-red-600 text-white"
      : "app-strong-text hover:bg-gray-100"
  }`;

export default function AdminLayout({ logoutUser }) {
  return (
    <div className="admin-layout grid gap-6 lg:grid-cols-[220px_1fr]">
      <aside className="admin-sidebar rounded border p-4">
        <h2 className="app-strong-text mb-4 text-lg font-bold">Admin</h2>
        <nav className="flex flex-col gap-2">
          <NavLink className={navLinkClass} to="/admin/dashboard">
            <BarChart3 size={18} />
            Dashboard
          </NavLink>
          <NavLink className={navLinkClass} to="/admin/events" end>
            <CalendarDays size={18} />
            Manage Events
          </NavLink>
          <NavLink className={navLinkClass} to="/admin/users" end>
            <Users size={18} />
            Users
          </NavLink>
          <NavLink className={navLinkClass} to="/admin/notifications" end>
            <Bell size={18} />
            Notifications
          </NavLink>
          <NavLink className={navLinkClass} to="/admin/email-templates">
            <Mail size={18} />
            Email Templates
          </NavLink>
          <button
            type="button"
            className="mt-2 flex items-center gap-2 rounded px-3 py-2 text-left text-sm font-medium text-red-600 transition hover:bg-red-50"
            onClick={logoutUser}
          >
            <LogOut size={18} />
            Logout
          </button>
        </nav>
      </aside>
      <section className="min-w-0">
        <Outlet />
      </section>
    </div>
  );
}
