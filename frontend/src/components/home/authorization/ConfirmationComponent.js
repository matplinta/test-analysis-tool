import React, { useState, useEffect } from "react";
import Modal from 'react-bootstrap/Modal';
import { MdDoneOutline } from "react-icons/md";

let ConfirmationComponent = ({confirmationType, show, handleClose}) => {

    let modalTitle = confirmationType === "logout" ? 'Logout Confirmation' : 'Login Confirmation';
    let modalText = confirmationType === "logout" ? 'Logout success!' : 'Login success!';

    const centerModalContent = {textAlign: 'center'};
    const textStyle = {fontWeight: 'bold', fontSize: 'x-large'};

    return(
        <div>
            <Modal show={show} onHide={handleClose} size="sm" centered >
                <Modal.Header>
                <Modal.Title>{modalTitle}</Modal.Title>
                </Modal.Header>
                <Modal.Body style={centerModalContent}>
                    <MdDoneOutline size='200' />
                    <br/>
                    <p style={textStyle}>{modalText}</p>
                </Modal.Body>
            </Modal>
        </div>
    )
}

export default ConfirmationComponent;