import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';

import LoginConfirmationComponent from './LoginConfirmationComponent';

let LoginForm = () => {

    let handleLoginClick = () => {
        // startTimeout(<LoginConfirmationComponent />, 200)
    }

    return(
        <Form>
            <Form.Group className="mb-3" controlId="formBasicUsername">
                <Form.Label>Username</Form.Label>
                <Form.Control type="username" placeholder="Enter username" />
            </Form.Group>

            <Form.Group className="mb-3" controlId="formBasicPassword">
                <Form.Label>Password</Form.Label>
                <Form.Control type="password" placeholder="Enter password" />
            </Form.Group>
            <Form.Group className="mb-3" controlId="formBasicCheckbox">
                <Form.Check type="checkbox" label="Remember my login on this" />
            </Form.Group>
            <Button variant="primary" type="submit" onSubmit={this.handleLoginClick}>
                Log in
            </Button>
            <Button variant="primary" type="submit">
                Cancel
            </Button>
        </Form>
    )
}

export default LoginForm;