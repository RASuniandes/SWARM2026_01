import ErrorPage from "./components/error/errorPage";
import Layout from "./components/layout/Layout";
import Root from "./pages/Home";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import PcbWidthCalculator from "./pages/pcbWidthCalculator/PcbWidthCalculator";
import LipoEstimator from "./pages/batteryEstimator/BatteryEstimator";
import MembersPage from "./pages/members/members";
export default function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <Layout />
          }

        >
          <Route path="" element={<Root />} />
          <Route path="members" element={<MembersPage />} />
          <Route path="tools/lipo-estimator" element={<LipoEstimator />} />
          <Route path="tools/pcb-calculator" element={<PcbWidthCalculator />} />
        </Route>
        <Route path="*" element={<ErrorPage />} />
      </Routes>
    </BrowserRouter>
  );
};

