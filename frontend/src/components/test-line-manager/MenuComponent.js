import { Link, Outlet } from 'react-router-dom';
import { Navbar, Container, Nav } from 'react-bootstrap';

import './MenuComponent.css';


let MenuComponent = () => {
    return(
        <>
            <Navbar className="navbar-style" variant="dark">
                <Nav className="me-auto">
                    <Nav.Link className="nav-style">
                        <Link to="test-lines" className='link-style' >Test Lines</Link>
                    </Nav.Link>
                    <Nav.Link className="nav-style">
                        <Link to="my-test-lines" exact="true" className='link-style' >My Test Lines</Link>
                    </Nav.Link>
                    <Nav.Link className="nav-style">
                        <Link to="define-test-lines" exact="true" className='link-style' >Define Test Line</Link>
                    </Nav.Link>
                    <Nav.Link className="nav-style">
                        <Link to="switch-list" exact="true" className='link-style' >Switch List</Link>
                    </Nav.Link>
                    <Nav.Link className="nav-style">
                        <Link to="define-switch" exact="true" className='link-style' >Define Switch</Link>
                    </Nav.Link>
                    <Nav.Link className="nav-style">
                        <Link to="pdu-list" exact="true" className='link-style' >PDU List</Link>
                    </Nav.Link>
                    <Nav.Link className="nav-style">
                        <Link to="define-pdu" exact="true" className='link-style' >Define PDU</Link>
                    </Nav.Link>
                </Nav>
            </Navbar>
            <Outlet />
        </>
    )
}

export default MenuComponent;