import React from "react";
import { useNavigate } from 'react-router-dom';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import { RiErrorWarningLine } from "react-icons/ri";

import AuthService from "../../../services/auth.service.js";
import Notify, { AlertTypes, Errors } from "../../../services/Notify.js";

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
                    Notify.sendNotification(Errors.LOGOUT, AlertTypes.error);
                })
        } catch (err) {
            Notify.sendNotification(Errors.LOGOUT, AlertTypes.error);
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
            </Form>
        </>
    )
}

export default LogoutComponent;