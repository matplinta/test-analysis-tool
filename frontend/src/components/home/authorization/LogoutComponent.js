import React, { useState } from "react";
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';

import LogoutForm from './LogoutForm';

import './LoginComponent.css';

let LogoutComponent = () => {

    const [show, setShow] = useState(false);

    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);

    return(
        <div>
            <Button variant="primary" size="sm" onClick={handleShow}>Logout</Button>

            <Modal show={show} onHide={handleClose} size="sm" centered >
                <Modal.Header closeButton>
                <Modal.Title>Logout</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <LogoutForm />
                </Modal.Body>
            </Modal>

        </div>
        
    )
}

export default LogoutComponent;