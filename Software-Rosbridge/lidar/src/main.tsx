import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Menu from './routes/menu/menu.tsx'
import ControllerView from './routes/controller/controller.tsx'
import ErrorPage from './components/errorPage.tsx'
import LidarView from './routes/lidarView/lidarView.tsx'

const router = createBrowserRouter([
  {
    path: '/',
    element: <Menu />,
    errorElement: <ErrorPage />,
  },
  {
    path: '/lidar',
    element: <LidarView />
  }, 
  {
    path: '/controller',
    element: <ControllerView />
  }
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
