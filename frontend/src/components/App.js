import { useState } from 'react';
import { Route, Routes, BrowserRouter } from 'react-router-dom';

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

import './App.css';


const App = () => {

  const [isUserLoggedIn, setIsUserLoggedIn] = useState(undefined);

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
              {isUserLoggedIn && <LogoutComponent setIsUserLoggedIn={setIsUserLoggedIn} /> }
              {!isUserLoggedIn && <LoginComponent setIsUserLoggedIn={setIsUserLoggedIn} /> }
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
            <Route path="test-results-analyzer" element={<TestResultsAnalyzerApp />} />
          </Routes>
        </section>
      </>
    </BrowserRouter>
  );
}


export default App;
