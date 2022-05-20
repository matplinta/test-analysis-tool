import React, { useState } from "react";
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';

import ConfirmationComponent from './ConfirmationComponent';
import LogoutForm from './LogoutForm';

import './LoginComponent.css';

let LogoutComponent = ({ setIsUserLoggedIn }) => {

    const [show, setShow] = useState(false);

    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);

    const [showConfirmation, setShowConfirmation] = useState(false);

    const handleConfirmationClose = () => setShowConfirmation(false);
    const handleConfirmationShow = () => setShowConfirmation(true);

    let handleSuccess = () => {
        handleClose();
        handleConfirmationShow();
        setTimeout(
            () => {
                handleConfirmationClose();
                setIsUserLoggedIn(false);
            },
            1500
        );

    }

    return (
        <div>
            <Button size="sm" style={{ "marginLeft": '20px', height: '35px' }} className="p-button-primary p-button-color" onClick={handleShow}>Logout</Button>

            <Modal show={show} onHide={handleClose} size="sm" centered >
                <Modal.Header closeButton>
                    <Modal.Title>Logout</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <LogoutForm handleSuccess={handleSuccess} />
                </Modal.Body>
            </Modal>

            <ConfirmationComponent confirmationType='logout' show={showConfirmation} handleClose={handleConfirmationClose} />
        </div>

    )
}

export default LogoutComponent;