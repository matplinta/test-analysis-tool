import { Component } from 'react';
import { Route, Routes, BrowserRouter } from 'react-router-dom';

import NOKIA_LOGO_WHITE_50px from './../assets/NOKIA_LOGO_WHITE_50px.png';
import GoToAdminComponent from './home/GoToAdminComponent';
import GoBackHomeComponent from './home/GoBackHomeComponent';
import LoginLogoutComponent from './home/authorization/LoginLogoutComponent';
import GridApplications from './home/GridApplications';
import TestLineManagerApp from './test-line-manager/TestLineManagerApp';
import TestLineReservationSchedulerApp from './test-line-reservation-scheduler/TestLineReservationSchedulerApp';
import TestResultsAnalyzerApp from './test-results-analyzer/TestResultsAnalyzerApp';

import './App.css';


class App extends Component {
  render () {
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
                <LoginLogoutComponent />
                <GoToAdminComponent />
              </div>
            </div>
          </nav>
          <section>
            <Routes>
              <Route path="/" element={<GridApplications />} />
              <Route path="/test-line-reservation-scheduler" element={<TestLineReservationSchedulerApp />} />
              <Route path="/test-line-manager" element={<TestLineManagerApp />} />
              <Route path="/test-results-analyzer" element={<TestResultsAnalyzerApp />} />
            </Routes>
          </section>
        </>
      </BrowserRouter>
    );
  }
}

export default App;
