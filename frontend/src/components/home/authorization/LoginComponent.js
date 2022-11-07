import React, { useState } from "react";
import { Button } from 'primereact/button';
import Modal from 'react-bootstrap/Modal';

import LoginForm from './LoginForm';
import ConfirmationComponent from './ConfirmationComponent';
import LoginErrorComponent from './LoginErrorComponent';

import './LoginComponent.css';


let LoginComponent = ({ setIsUserLoggedIn }) => {

    const [show, setShow] = useState(false);
    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);

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

    return (
        <div style={{ display: 'inline' }}>
            <Button className="p-button-primary" onClick={handleShow}>Login</Button>
            <Modal show={show} onHide={handleClose} aria-labelledby="contained-modal-title-vcenter" centered dialogClassName="modal-90w" >
                <Modal.Header closeButton>
                    <Modal.Title>Log in using LDAP credentials!</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <LoginForm handleSuccess={handleSuccess} handleFail={handleFail} handleClose={handleClose} />
                </Modal.Body>
            </Modal>

            <ConfirmationComponent confirmationType='login' show={showConfirmation} handleClose={handleConfirmationClose} />
            <LoginErrorComponent show={showError} handleClose={handleErrorClose} />
        </div>

    )
}

export default LoginComponent;