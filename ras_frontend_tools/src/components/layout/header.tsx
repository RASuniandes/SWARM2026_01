import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bell, Menu, User, LogOut, Settings, X } from "lucide-react";

const Header = ({
  setNavbarOpen,
  navbarOpen, 
}: {
  setNavbarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  navbarOpen: boolean
}) => {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const notificationRef = useRef<HTMLDivElement | null>(null);
  const profileRef = useRef<HTMLDivElement | null>(null);

  const navigate = useNavigate();

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(e.target as Node)
      ) {
        setIsNotificationsOpen(false);
      }

      if (
        profileRef.current &&
        !profileRef.current.contains(e.target as Node)
      ) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="fixed top-0 left-0 w-full h-16 flex items-center justify-between px-6 bg-slate-950 border-b border-slate-800 z-50">
      
      {/* Logo and Tagline */}
      <div className="flex items-center gap-2">
        <Link to="/" className="flex items-center gap-2">
          <img src="/ras_logo_black.png" alt="Logo" className="w-8 h-8" />
        </Link>
        <span className="hidden md:inline text-slate-400 text-sm font-light">
          Advancing technology for humanity
        </span>
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-4">

        {/* Notifications */}
        <div className="relative" ref={notificationRef}>
          {/* <button
            onClick={() => {
              setIsProfileOpen(false);
              setIsNotificationsOpen(!isNotificationsOpen);
            }}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition"
          >
            <Bell className="w-5 h-5 text-slate-300" />
          </button> */}

          {isNotificationsOpen && (
            <div className="absolute right-0 mt-3 w-72 bg-slate-900 border border-slate-800 rounded-xl shadow-xl">
              <div className="p-4 border-b border-slate-800">
                <h3 className="text-white font-semibold">Notifications</h3>
              </div>
              <div className="p-4 text-sm text-slate-400">
                No new notifications
              </div>
              <div className="p-3 border-t border-slate-800">
                <button
                  onClick={() => navigate("/notifications")}
                  className="w-full text-blue-400 hover:text-blue-300 text-sm font-medium"
                >
                  View all
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Profile */}
        <div className="relative" ref={profileRef}>
          {/* <button
            onClick={() => {
              setIsNotificationsOpen(false);
              setIsProfileOpen(!isProfileOpen);
            }}
            className="w-9 h-9 rounded-lg overflow-hidden bg-slate-800 flex items-center justify-center"
          >
            <User className="w-5 h-5 text-slate-300" />
          </button> */}

          {isProfileOpen && (
            <div className="absolute right-0 mt-3 w-60 bg-slate-900 border border-slate-800 rounded-xl shadow-xl">
              <div className="p-4 border-b border-slate-800">
                <p className="text-white text-sm font-medium">John Doe</p>
                <p className="text-slate-400 text-xs">john@email.com</p>
              </div>

              <div className="p-2">
                <button
                  onClick={() => navigate("/profile")}
                  className="flex items-center gap-3 w-full px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 rounded-lg transition"
                >
                  <User size={16} />
                  Profile
                </button>

                <button
                  onClick={() => navigate("/settings")}
                  className="flex items-center gap-3 w-full px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 rounded-lg transition"
                >
                  <Settings size={16} />
                  Settings
                </button>
              </div>

              <div className="p-2 border-t border-slate-800">
                <button
                  onClick={() => navigate("/login")}
                  className="flex items-center gap-3 w-full px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Mobile Menu */}
        <button
          onClick={() => setNavbarOpen(!navbarOpen)}
          className="lg:hidden p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition">
          {navbarOpen ? (
            <X className="w-5 h-5 text-slate-300" />
          ) : (
            <Menu className="w-5 h-5 text-slate-300" />
          )}
        </button>
      </div>
    </header>
  );
};

export default Header;