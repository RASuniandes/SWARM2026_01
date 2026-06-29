import { useMemo } from "react"
import { Link } from "react-router-dom";
import './menu.css'
export default function Menu() {

  const items = useMemo(() => [
    {
      name: "Lidar View",
      path: "/lidar",
      icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" color="#000000" fill="none">
            <circle cx="12" cy="11" r="2" stroke="#141B34" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M4 17.001C2.74418 15.3295 2 13.2516 2 11C2 5.47715 6.47715 1 12 1C17.5228 1 22 5.47715 22 11C22 13.2516 21.2558 15.3295 20 17.001" stroke="#141B34" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M7.52779 15C6.57771 13.9385 6 12.5367 6 11C6 7.68629 8.68629 5 12 5C15.3137 5 18 7.68629 18 11C18 12.5367 17.4223 13.9385 16.4722 15" stroke="#141B34" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M9.95154 17.8759C10.7222 16.758 11.1076 16.199 11.6078 16.0553C11.8644 15.9816 12.1356 15.9816 12.3922 16.0553C12.8924 16.199 13.2778 16.758 14.0485 17.8759C15.074 19.3633 15.5867 20.1071 15.488 20.727C15.4379 21.0414 15.2938 21.3315 15.076 21.5565C14.6465 22 13.7643 22 12 22C10.2357 22 9.35352 22 8.92399 21.5565C8.70617 21.3315 8.56205 21.0414 8.512 20.727C8.4133 20.1071 8.92605 19.3633 9.95154 17.8759Z" stroke="#141B34" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    },
    {
      name: "Controlar MK",
      path: "/controller",
      icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" color="#000000" fill="none">
            <path d="M2.5 12C2.5 7.52166 2.5 5.28249 3.89124 3.89124C5.28249 2.5 7.52166 2.5 12 2.5C16.4783 2.5 18.7175 2.5 20.1088 3.89124C21.5 5.28249 21.5 7.52166 21.5 12C21.5 16.4783 21.5 18.7175 20.1088 20.1088C18.7175 21.5 16.4783 21.5 12 21.5C7.52166 21.5 5.28249 21.5 3.89124 20.1088C2.5 18.7175 2.5 16.4783 2.5 12Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"></path>
            <path d="M10 15.5C10 16.3284 9.32843 17 8.5 17C7.67157 17 7 16.3284 7 15.5C7 14.6716 7.67157 14 8.5 14C9.32843 14 10 14.6716 10 15.5Z" stroke="currentColor" strokeWidth="1.5"></path>
            <path d="M17 8.5C17 7.67157 16.3284 7 15.5 7C14.6716 7 14 7.67157 14 8.5C14 9.32843 14.6716 10 15.5 10C16.3284 10 17 9.32843 17 8.5Z" stroke="currentColor" strokeWidth="1.5"></path>
            <path d="M8.5 14V7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"></path>
            <path d="M15.5 10V17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"></path>
        </svg>
    }
  ], []);
  return <>

    <div className="menu">
      {items.map((item, index) => (
        <Link key={index} to={item.path} style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="menuItem">
            <div className="menuImage">
              {item.icon}
            </div>
            <div className="menuText">
            {item.name}
          </div>

          </div>
          </Link>
      ))}
    </div>
  </>
}
