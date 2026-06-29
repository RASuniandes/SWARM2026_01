import React, { useState, useRef } from "react";
import { Outlet } from "react-router-dom";
import Header from "./header";
import { motion } from "framer-motion";
import Bubbles from "./bubbles";
import Sidebar from "./sidebar";


const Layout = () => {
  const [navbarOpen, setNavbarOpen] = useState<boolean>(false);
  const [disableHeader, setDisableHeader] = useState(false);
  const navContainerRef = useRef(null);

  return (
    <>
      <div className="relative min-h-screen w-screen flex flex-col">
        {/* Background */}
        <div
          className="absolute inset-0 z-0"
          style={{
            background: "radial-gradient(125% 125% at 50% 10%, #000000 40%, #0d1a36 100%)",
          }}
        />

        {/* Top Nav */}

          <div
            ref={navContainerRef}
            className="w-full overflow-hidden transition-[max-height] duration-300 ease-in-out border-b border-amber-500/30"
          >
            <Header setNavbarOpen={setNavbarOpen} navbarOpen={navbarOpen} />
          </div>


        <motion.div className="relative flex-1 w-full flex overflow-hidden">
          {/* Left sidebar */}
          <Sidebar navbarOpen={navbarOpen} setNavbarOpen={setNavbarOpen} />

          {/* Main content area */}
          <div className="mt-16 text-white relative flex flex-col items-center w-full overflow-hidden lg:ml-0">
            <div className="relative w-full h-full overflow-y-auto scrollbar-hide scroll-smooth overflow-x-hidden">
              <Outlet />
            </div>
          </div>
        </motion.div>
      </div>

      <Bubbles />
    </>
  );
};

export default Layout;
