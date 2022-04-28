import { useState, useEffect } from 'react';
import { Route, Routes, BrowserRouter } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import axios from "axios";

import Notify from './../services/Notify';
import AuthService from './../services/auth.service.js';

import NOKIA_LOGO_WHITE_50px from './../assets/NOKIA_LOGO_WHITE_50px.png';
import GoToAdminComponent from './home/GoToAdminComponent';
import GoBackHomeComponent from './home/GoBackHomeComponent';
import GridApplications from './home/GridApplications';
import TestLineManagerApp from './test-line-manager/TestLineManagerApp';
import TestLineReservationSchedulerApp from './test-line-reservation-scheduler/TestLineReservationSchedulerApp';
import TestResultsAnalyzerApp from './test-results-analyzer/TestResultsAnalyzerApp';
import TestLineListComponent from './test-line-manager/TestLineListComponent';
import MyTestLineComponentList from './test-line-manager/MyTestLineComponentList';
import LoginComponent from './home/authorization/LoginComponent';
import LogoutComponent from './home/authorization/LogoutComponent';
import RegressionTestRuns from './test-results-analyzer/RegressionTestRuns';
import UserFiltersComponent from './test-results-analyzer/UserFiltersComponent';

import './App.css';


const App = () => {

  const [isUserLoggedIn, setIsUserLoggedIn] = useState(undefined);

  useEffect(() => {
    if (window.location.origin === "http://localhost:3000") {
      console.log("localhost")
      axios.defaults.baseURL = "http://127.0.0.1:8000";
    } else {
      console.log("nie localhost")
      axios.defaults.baseURL = window.location.origin;
    }

    Notify.notifications.subscribe((alert) => alert instanceof Function && alert());
    setIsUserLoggedIn(AuthService.checkUserLoggedIn());
  }, [])

  return (
    <BrowserRouter>
      <>
        <header className="App-header">
          <img src={NOKIA_LOGO_WHITE_50px} className="App-logo" alt="-logo" />
        </header>
        <nav>
          <div className="buttons-container">
            <div className="back-button-div">
              <GoBackHomeComponent />
            </div>
            <div className="buttons-div">
              {isUserLoggedIn && <LogoutComponent setIsUserLoggedIn={setIsUserLoggedIn} />}
              {!isUserLoggedIn && <LoginComponent setIsUserLoggedIn={setIsUserLoggedIn} />}
              <GoToAdminComponent />
            </div>
          </div>
        </nav>
        <section>
          <Routes>
            <Route index element={<GridApplications />} />
            <Route path="test-line-reservation-scheduler" element={<TestLineReservationSchedulerApp />} />
            <Route path="test-line-manager" element={<TestLineManagerApp />} >
              <Route index element={<TestLineListComponent />} />
              <Route path="test-lines" element={<TestLineListComponent />} />
              <Route path="my-test-lines" element={<MyTestLineComponentList />} />
            </Route>
            <Route path="test-results-analyzer" element={<TestResultsAnalyzerApp />} >
              <Route index path="regression-test-runs" element={<RegressionTestRuns />} />
              <Route path="user-filters" index element={<UserFiltersComponent />} />
            </Route>
          </Routes>
          <ToastContainer autoClose={2500} />
        </section>
      </>
    </BrowserRouter>
  );
}


export default App;
