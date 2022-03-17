import React, { useState } from "react";
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';

import LoginForm from './LoginForm';

import './LoginComponent.css';


let LoginComponent = () => {

    const [show, setShow] = useState(false);

    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);

    return(
        <div>
            <Button variant="primary" size="sm" onClick={handleShow}>Login</Button>

            <Modal show={show} onHide={handleClose} aria-labelledby="contained-modal-title-vcenter" centered dialogClassName="modal-90w" >
                <Modal.Header closeButton>
                <Modal.Title>Log in using LDAP credentials!</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <LoginForm />
                </Modal.Body>
            </Modal>
        </div>
        
    )
}

export default LoginComponent;