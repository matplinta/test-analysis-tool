import { useState, useEffect } from 'react';
import { Route, Routes, BrowserRouter } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import axios from "axios";

import Notify from './../services/Notify';
import AuthService from './../services/auth.service.js';

import NOKIA_LOGO_WHITE_50px from './../assets/NOKIA_LOGO_WHITE_50px.png';
import GridApplications from './home/GridApplications';
import TestLineManagerApp from './test-line-manager/TestLineManagerApp';
import TestLineReservationSchedulerApp from './test-line-reservation-scheduler/TestLineReservationSchedulerApp';
import TestResultsAnalyzerApp from './test-results-analyzer/TestResultsAnalyzerApp';
import TestLineListComponent from './test-line-manager/TestLineListComponent';
import MyTestLineComponentList from './test-line-manager/MyTestLineComponentList';
import RegressionTestRuns from './test-results-analyzer/RegressionTestRuns';
import TestSetFiltersComponent from './test-results-analyzer/TestSetFiltersComponent';
import CommonMenuComponent from './home/CommonMenuComponent';
import FailRegexTypesComponent from './test-results-analyzer/FailRegexTypesComponent';
import FailMessageTypeGroupNewComponent from './test-results-analyzer/FailMessageTypeGroupNewComponent';
import FailMessageTypeGroupComponent from './test-results-analyzer/FailMessageTypeGroupComponent';
import ChartsComponent from './test-results-analyzer/ChartsComponent';
import BranchOffComponent from './test-results-analyzer/BranchOffComponent';

import { CurrentUserProvider } from '../services/CurrentUserContext';

import './App.css';



const App = () => {

  const [isUserLoggedIn, setIsUserLoggedIn] = useState(undefined);

  if (window.location.origin === "http://localhost:3000" || window.location.origin === "http://127.0.0.1:3000") {
    axios.defaults.baseURL = "http://127.0.0.1:8000";
  } else {
    axios.defaults.baseURL = window.location.origin;
  }

  useEffect(() => {
    Notify.notifications.subscribe((alert) => alert instanceof Function && alert());
    setIsUserLoggedIn(AuthService.checkUserLoggedIn());
  }, [])

  return (
    <CurrentUserProvider>
      <BrowserRouter>
        <>
          <header className="App-header">
            <img src={NOKIA_LOGO_WHITE_50px} className="App-logo" alt="-logo" />
          </header>

          <nav>
            <CommonMenuComponent isUserLoggedIn={isUserLoggedIn} setIsUserLoggedIn={setIsUserLoggedIn} />
          </nav>
          <section>
            <Routes>
              <Route index element={<GridApplications isUserLoggedIn={isUserLoggedIn} />} />
              <Route path="test-line-reservation-scheduler" element={<TestLineReservationSchedulerApp />} />
              <Route path="test-line-manager" element={<TestLineManagerApp />} >
                <Route index element={<TestLineListComponent />} />
                <Route path="test-lines" element={<TestLineListComponent />} />
                <Route path="my-test-lines" element={<MyTestLineComponentList />} />
              </Route>
              <Route path="test-results-analyzer" element={<TestResultsAnalyzerApp />} >
                <Route index path="regression-test-runs" element={<RegressionTestRuns />} />
                <Route path="test-set-filters" element={<TestSetFiltersComponent type={'all'} />} />
                <Route path="subscribed-test-set-filters" element={<TestSetFiltersComponent type={'subscribed'} />} />
                <Route path="owned-test-set-filters" element={<TestSetFiltersComponent type={'owned'} />} />
                <Route path="test-set-filters-branch-off" element={<BranchOffComponent />} />
                <Route path="fail-regex" element={<FailRegexTypesComponent />} />
                <Route path="fail-regex-groups" element={<FailMessageTypeGroupNewComponent />} />
                <Route path="fail-regex-groups-detailed" element={<FailMessageTypeGroupComponent />} />
                <Route path="fail-regex-groups/:group" element={<FailMessageTypeGroupNewComponent />} />
                <Route path="statistics" element={<ChartsComponent />} />
              </Route>
            </Routes>
            <ToastContainer autoClose={2500} />
          </section>
        </>
      </BrowserRouter>
    </CurrentUserProvider>
  );
}


export default App;
