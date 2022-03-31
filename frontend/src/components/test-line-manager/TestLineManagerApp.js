import { Route, Routes, Navigate } from 'react-router-dom';
import { Redirect } from 'react-router'

import ApplictionTitleComponent from '../home/ApplictionTitleComponent';
import MenuComponent from './MenuComponent';
import TestLineListComponent from './TestLineListComponent';

let TestLineManagerApp = () => {
    return(
        <>
            <ApplictionTitleComponent appName="Test Line Manager" />
            <MenuComponent />
            <br/>
        </>
    )
}

export default TestLineManagerApp;