import { Link } from "react-router-dom";
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

import './GridApplications.css';

let GridApplications = () => {

    return(
        <Container>
            <Row>
                <Col className="title-grid">
                    <Link to="/" className='link-style' >
                    Management
                    </Link>
                </Col>
            </Row>
            <Row>
                <Col className="app-grid">
                    <Link to="/test-line-reservation-scheduler" className='link-style' >
                    Test Line Reservation Scheduler
                    </Link>
                </Col>
                <Col className="app-grid">
                    <Link to="/test-line-manager" className='link-style'>
                    Test Line Manager
                    </Link>
                </Col>
                <Col className="app-grid">
                    <Link to="/test-results-analyzer" className='link-style'>
                    Test Results Analyzer
                    </Link>
                </Col>
            </Row>
        </Container>
    )
}

export default GridApplications;