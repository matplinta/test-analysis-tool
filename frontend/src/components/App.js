import { useState, useEffect } from 'react';
import { Route, Routes, BrowserRouter } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import axios from "axios";

import Notify from './../services/Notify';
import AuthService from './../services/auth.service.js';

import RegressionTestRuns from './test-results-analyzer/RegressionTestRuns';
import TestSetFiltersComponent from './test-results-analyzer/TestSetFiltersComponent';
import FailRegexTypesComponent from './test-results-analyzer/FailRegexTypesComponent';
import FailMessageTypeGroupNewComponent from './test-results-analyzer/FailMessageTypeGroupNewComponent';
import FailMessageTypeGroupComponent from './test-results-analyzer/FailMessageTypeGroupComponent';
import ChartsComponent from './test-results-analyzer/ChartsComponent';
import BranchOffComponent from './test-results-analyzer/BranchOffComponent';
import MenuComponent from './test-results-analyzer/MenuComponent';
import TestInstancesComponent from './test-results-analyzer/TestInstancesComponent';
import SummaryComponent from './test-results-analyzer/SummaryComponent';
import MessagesComponent from './test-results-analyzer/MessagesComponent';

import { CurrentUserProvider } from '../services/CurrentUserContext';
import { UserMessagesProvider } from '../services/UserMessagesContext';

import "primeflex/primeflex.css";
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
      <UserMessagesProvider>
        <BrowserRouter>
          <section>
            <Routes>
              <Route path="" element={<MenuComponent isUserLoggedIn={isUserLoggedIn} setIsUserLoggedIn={setIsUserLoggedIn} />} >
                <Route path="" element={<SummaryComponent />} />
                <Route index path="regression-test-runs" element={<RegressionTestRuns />} />
                <Route index path="test-instances" element={<TestInstancesComponent />} />
                <Route path="test-set-filters" element={<TestSetFiltersComponent type={'all'} />} />
                <Route path="subscribed-test-set-filters" element={<TestSetFiltersComponent type={'subscribed'} />} />
                <Route path="owned-test-set-filters" element={<TestSetFiltersComponent type={'owned'} />} />
                <Route path="test-set-filters-branch-off" element={<BranchOffComponent />} />
                <Route path="fail-regex" element={<FailRegexTypesComponent />} />
                <Route path="fail-regex-groups" element={<FailMessageTypeGroupNewComponent />} />
                <Route path="fail-regex-groups-detailed" element={<FailMessageTypeGroupComponent />} />
                <Route path="fail-regex-groups/:group" element={<FailMessageTypeGroupNewComponent />} />
                <Route path="statistics" element={<ChartsComponent />} />
                <Route path="messages" element={<MessagesComponent />} />
              </Route>
            </Routes>
            <ToastContainer autoClose={2500} />
          </section>
          <footer className="App-footer">
            <span style={{ marginRight: '10px', fontSize: 'small' }}>© 2022 </span>
          </footer>
        </BrowserRouter>
      </UserMessagesProvider>
    </CurrentUserProvider>
  );
}


export default App;
