import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { BatteryCharging, Bot, GalleryHorizontal, Lock, ChevronDown, Cpu, Users, Home } from "lucide-react";
import { useMemo, useState } from "react";

type LinkType = {
  id: number;
  label: string;
  href?: string;
  icon: React.ReactNode;
  isUpcoming?: boolean;
  subItems?: LinkType[];
}

const links: LinkType[] = [
  {
    id: 1,
    label: "Inicio",
    icon: <Home className="w-5 h-5" />,
    href: "/",
    isUpcoming: false
  },
  {
    id: 2,
    label: "Makerspace",
    icon: <Bot className="w-5 h-5" />,
    href: "https://makers.rasuniandes.org",
    isUpcoming: false
  },
  {
    id: 3,
    label: "Miembros",
    icon: <Users className="w-5 h-5" />,
    href: "/members",
    // isUpcoming: true
  },
  {
    id: 4,
    label: "Herramientas",
    icon: <Cpu className="w-5 h-5" />,
    subItems: [
      {
        id: 31,
        label: "PCB Calculator",
        href: "/tools/pcb-calculator",
        icon: <GalleryHorizontal className="w-5 h-5" />
      },
      {
        id: 32,
        label: "ROS 2 Installer",
        href: "/tools/ros-installer",
        icon: <Bot className="w-5 h-5" />
      },
      {
        id: 33,
        label: "LiPo Estimator",
        href: "/tools/lipo-estimator",
        icon: <BatteryCharging className="w-5 h-5" />
      },
      {
        id: 34,
        label: "Resistor Decoder",
        href: "/tools/resistor-decoder",
        icon: <GalleryHorizontal className="w-5 h-5" />,
        isUpcoming: true
      }
    ]
  }
];

export default function Sidebar({
  navbarOpen,
  setNavbarOpen,
}: {
  navbarOpen: boolean;
  setNavbarOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const handleNavigation = (link: LinkType) => {
    if (link.isUpcoming || link.subItems) return;
    if (link.href) {
      if (link.href.startsWith("http")) {
        window.open(link.href, "_blank");
      } else {
        navigate(link.href);
      }
    }
    setNavbarOpen(false);
  };

  const isActive = useMemo(() => {
    return links.some(link => link.href === location.pathname);
  }, [location.pathname]);

  return (
    <>
      {/* Desktop Sidebar */}
      <div
        className="sidebar hidden lg:flex fixed left-0 top-16 h-[calc(100vh-64px)] text-white"
        style={{ zIndex: 40 }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(125% 125% at 50% 10%, #000000 40%, #0d1a36 100%)",
            zIndex: -1
          }}
        />

        <motion.div
          className="flex flex-col justify-between h-full overflow-hidden py-2.5"
          animate={{ width: isHovered ? 250 : 60 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
        >
          <div className="flex flex-col gap-1 overflow-y-auto px-2.5">
            {links.map((link) => (
              <div key={link.id}>
                <motion.div
                  initial={false}
                  whileHover={{ x: isHovered ? 4 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <button
                    onClick={() => {
                      if (link.subItems) {
                        setExpandedId(expandedId === link.id ? null : link.id);
                      } else {
                        handleNavigation(link);
                      }
                    }}
                    className={`
                      w-full flex items-center
                      ${isHovered ? "gap-3 px-3 justify-start" : "justify-center px-0"}
                      py-3 rounded-lg transition-colors min-w-0
                      ${!link.subItems && isActive
                        ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                        : "text-gray-400 hover:bg-amber-500/10 hover:text-amber-400"
                      }
                      ${link.isUpcoming ? "opacity-50 cursor-not-allowed hover:bg-transparent" : ""}
                    `}
                  >
                    <motion.div className="flex items-center justify-center w-6">
                      {link.icon}
                    </motion.div>

                    <AnimatePresence>
                      {isHovered && (
                        <motion.div
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: "auto" }}
                          exit={{ opacity: 0, width: 0 }}
                          transition={{ duration: 0.2 }}
                          className="flex items-center gap-2 min-w-0 flex-1"
                        >
                          <span className="text-sm font-medium whitespace-nowrap overflow-hidden">
                            {link.label}
                          </span>
                          {link.isUpcoming && (
                            <Lock size={16} className="opacity-60 flex-shrink-0" />
                          )}
                          {link.subItems && (
                            <ChevronDown
                              size={16}
                              className={`flex-shrink-0 transition-transform ${
                                expandedId === link.id ? "rotate-180" : ""
                              }`}
                            />
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </button>
                </motion.div>

                {/* Subitems */}
                {link.subItems && expandedId === link.id && isHovered && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-col gap-1 pl-4 mt-1"
                  >
                    {link.subItems.map((subItem) => (
                      <motion.div
                        key={subItem.id}
                        initial={false}
                        whileHover={{ x: 4 }}
                        transition={{ duration: 0.2 }}
                      >
                        <button
                          onClick={() => handleNavigation(subItem)}
                          className={`
                            w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm
                            ${subItem.href === location.pathname
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                              : "text-gray-400 hover:bg-amber-500/10 hover:text-amber-400"
                            }
                            ${subItem.isUpcoming ? "opacity-50 cursor-not-allowed hover:bg-transparent" : ""}
                          `}
                        >
                          <motion.div className="flex items-center justify-center w-4">
                            {subItem.icon}
                          </motion.div>
                          <span className="font-medium whitespace-nowrap overflow-hidden">
                            {subItem.label}
                          </span>
                          {subItem.isUpcoming && (
                            <Lock size={14} className="opacity-60 flex-shrink-0" />
                          )}
                        </button>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {navbarOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden fixed top-16 left-0 right-0 bg-slate-950 border-b border-amber-500/30 w-full"
            style={{ zIndex: 39 }}
          >
            <div className="flex flex-col gap-1 p-2.5">
              {links.map((link) => (
                <div key={link.id}>
                  <motion.button
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    onClick={() => {
                      if (link.subItems) {
                        setExpandedId(expandedId === link.id ? null : link.id);
                      } else {
                        handleNavigation(link);
                      }
                    }}
                    className={`
                      w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors
                      ${!link.subItems && isActive
                        ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                        : "text-gray-400 hover:bg-amber-500/10 hover:text-amber-400"
                      }
                      ${link.isUpcoming ? "opacity-50 cursor-not-allowed hover:bg-transparent" : ""}
                    `}
                  >
                    {link.icon}
                    <span className="text-sm font-medium flex-1 text-left">
                      {link.label}
                    </span>
                    {link.isUpcoming && <Lock size={16} className="opacity-60" />}
                    {link.subItems && (
                      <ChevronDown
                        size={16}
                        className={`transition-transform ${
                          expandedId === link.id ? "rotate-180" : ""
                        }`}
                      />
                    )}
                  </motion.button>

                  {/* Mobile Subitems */}
                  {link.subItems && expandedId === link.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="flex flex-col gap-1 pl-6 mt-1"
                    >
                      {link.subItems.map((subItem) => (
                        <motion.button
                          key={subItem.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ duration: 0.2 }}
                          onClick={() => handleNavigation(subItem)}
                          className={`
                            w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm
                            ${subItem.href === location.pathname
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                              : "text-gray-400 hover:bg-amber-500/10 hover:text-amber-400"
                            }
                            ${subItem.isUpcoming ? "opacity-50 cursor-not-allowed hover:bg-transparent" : ""}
                          `}
                        >
                          {subItem.icon}
                          <span className="text-sm font-medium flex-1 text-left">
                            {subItem.label}
                          </span>
                          {subItem.isUpcoming && <Lock size={14} className="opacity-60" />}
                        </motion.button>
                      ))}
                    </motion.div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
