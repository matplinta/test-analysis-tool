import { useState } from 'react';
import Form from 'react-bootstrap/Form';
import { Button } from 'primereact/button';

import AuthService from "../../../services/auth.service.js";
import Notify, { AlertTypes, Errors, Successes } from '../../../services/Notify';

let LoginForm = ({ handleSuccess, handleFail, handleClose }) => {

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    let handleLoginClick = async (event) => {
        event.preventDefault();
        try {
            await AuthService.login(username, password).then(
                (response) => {
                    handleSuccess();
                },
                (error) => {
                    handleFail();
                    setUsername('');
                    setPassword('');
                })
        } catch (err) {
            Notify.sendNotification(Errors.LOGIN, AlertTypes.error);
        }
    }

    let handleInputChange = (event) => {
        if (event.target.type === "text") {
            setUsername(event.target.value);
        } else if (event.target.type === "password") {
            setPassword(event.target.value)
        } else {
            console.log("Field does not exist.")
        }
    }

    return (
        <Form onSubmit={handleLoginClick} onClose={handleClose}>
            <Form.Group className="mb-3" controlId="formBasicUsername">
                <Form.Label>Username</Form.Label>
                <Form.Control required value={username} onChange={handleInputChange} type="text" placeholder="Enter username" />
            </Form.Group>

            <Form.Group className="mb-3" controlId="formBasicPassword">
                <Form.Label>Password</Form.Label>
                <Form.Control required value={password} onChange={handleInputChange} type="password" placeholder="Enter password" />
            </Form.Group>
            <div style={{display: 'flex'}}>
                <Button label="Log in" className="p-button-primary" style={{ flex: '1'}} type="submit"></Button>
                {handleClose !== null ? <Button label="Cancel" className="p-button-primary" style={{float: 'right', flex: '1'}} type="submit" onClick={handleClose}></Button> : null}
            </div>
        </Form>
    )
}

export default LoginForm;