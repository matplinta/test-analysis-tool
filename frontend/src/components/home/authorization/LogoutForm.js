import React from "react";
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import { RiErrorWarningLine } from "react-icons/ri";

import './LoginComponent.css';


let LogoutComponent = () => {

    return(
        <Form className="text-center">
            <RiErrorWarningLine size='150' centered />
            <h3><strong>Are you sure?</strong></h3>
            <p>You will be logged out.</p>
            <Button variant="primary" type="submit">
                Logout
            </Button>
            <Button variant="primary" type="submit">
                Cancel
            </Button>
        </Form>
        
    )
}

export default LogoutComponent;