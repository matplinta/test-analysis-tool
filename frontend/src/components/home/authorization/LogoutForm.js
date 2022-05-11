import React from "react";
import { useNavigate } from 'react-router-dom';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import { RiErrorWarningLine } from "react-icons/ri";

import AuthService from "../../../services/auth.service.js";

import './LoginComponent.css';


let LogoutComponent = ({ handleSuccess }) => {

    const navigate = useNavigate();

    let handleLogoutClick = async (event) => {
        event.preventDefault();
        try {
            await AuthService.logout().then(
                (response) => {
                    handleSuccess();
                    navigate({ pathname: "" });
                },
                (error) => {
                    console.log(error)
                })
        } catch (err) {
            console.log(err);
        }
    }

    return (
        <>
            <Form className="text-center" onSubmit={handleLogoutClick}>
                <RiErrorWarningLine size='150' centered="true" />
                <h3><strong>Are you sure?</strong></h3>
                <p>You will be logged out.</p>
                <Button variant="primary" type="submit">
                    Logout
                </Button>
                <Button variant="primary" type="submit">
                    Cancel
                </Button>
            </Form>
        </>
    )
}

export default LogoutComponent;