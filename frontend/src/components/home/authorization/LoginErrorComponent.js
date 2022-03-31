import Modal from 'react-bootstrap/Modal';
import { BiError } from "react-icons/bi";

let LoginErrorComponent = ({show, handleClose}) => {

    const centerModalContent = {textAlign: 'center'};
    const textStyle = {fontWeight: 'bold', fontSize: 'x-large'};

    return(
        <div>
            <Modal show={show} onHide={handleClose} size="sm" centered >
                <Modal.Header>
                <Modal.Title>Error!</Modal.Title>
                </Modal.Header>
                <Modal.Body style={centerModalContent}>
                    <BiError size='150' />
                    <br/>
                    <p style={textStyle}>Error during login.</p>
                    <p style={textStyle}>Try again!</p>
                </Modal.Body>
            </Modal>
        </div>
    )
}

export default LoginErrorComponent;