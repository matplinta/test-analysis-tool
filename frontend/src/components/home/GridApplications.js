import { NavLink } from "react-router-dom";
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

import './GridApplications.css';

let GridApplications = () => {

    return(
        <Container>
            <Row>
                <Col className="title-grid">
                    <NavLink to="/" className='link-style' >
                    Management
                    </NavLink>
                </Col>
            </Row>
            <Row>
                <Col className="app-grid">
                    <NavLink to="/test-line-reservation-scheduler" className='link-style' >
                    Test Line Reservation Scheduler
                    </NavLink>
                </Col>
                <Col className="app-grid">
                    <NavLink to="/test-line-manager" className='link-style'>
                    Test Line Manager
                    </NavLink>
                </Col>
                <Col className="app-grid">
                    <NavLink to="/test-results-analyzer" className='link-style'>
                    Test Results Analyzer
                    </NavLink>
                </Col>
            </Row>
        </Container>
    )
}

export default GridApplications;