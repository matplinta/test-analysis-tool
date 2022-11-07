import { useState, useEffect, useRef } from 'react';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Link } from 'react-router-dom';
import { InputText } from 'primereact/inputtext';

import { getUserSummary } from '../../services/test-results-analyzer/statistics.service';
import Notify, { AlertTypes, Errors } from '../../services/Notify';
import LoginForm from './../home/authorization/LoginForm';
import './WelcomeComponent.css';

const WelcomeComponent = ({ setIsUserLoggedIn }) => {

    const [show, setShow] = useState(false);
    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);
    const [value1, setValue1] = useState('');

    const [showConfirmation, setShowConfirmation] = useState(false);
    const handleConfirmationClose = () => setShowConfirmation(false);
    const handleConfirmationShow = () => setShowConfirmation(true);


    const [showError, setShowError] = useState(false);
    const handleErrorClose = () => setShowError(false);
    const handleErrorShow = () => setShowError(true);

    let handleSuccess = () => {
        handleClose();
        handleConfirmationShow();
        setTimeout(
            () => {
                handleConfirmationClose();
                setIsUserLoggedIn(true);
            },
            1500
        );
    }

    let handleFail = () => {
        handleErrorShow();
        setTimeout(
            () => handleErrorClose(),
            1500
        );
    }

    const footer = (
        <span>
            <Button label="Save" icon="pi pi-check" />
            <Button label="Cancel" icon="pi pi-times" className="p-button-secondary ml-2" />
        </span>
    );

    return (
        <div className="welcomeContainer">
            <div className="loginBox">
            <Card title="Please login using your LDAP credentials" className="p-2" style={{width: '20rem'}}>
                <LoginForm handleSuccess={handleSuccess} handleFail={handleFail} handleClose={null} />
            </Card>
            </div>
        </div>

    )
}

export default WelcomeComponent;