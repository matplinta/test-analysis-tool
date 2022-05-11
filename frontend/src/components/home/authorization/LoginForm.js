import { useState } from 'react';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';

import AuthService from "../../../services/auth.service.js";

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
            console.log(err);
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

            {/* <Form.Group className="mb-3" controlId="formBasicCheckbox">
                <Form.Check type="checkbox" label="Remember my login on this" />
            </Form.Group> */}

            <Button variant="primary" type="submit">
                Log in
            </Button>
            <Button variant="primary" type="submit" onClick={handleClose}>
                Cancel
            </Button>
        </Form>
    )
}

export default LoginForm;