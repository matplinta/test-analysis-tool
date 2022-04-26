import { Link, Outlet } from 'react-router-dom';
import { Navbar, Nav } from 'react-bootstrap';

import './MenuComponent.css';


let MenuComponent = () => {
    return(
        <>
            <Navbar className="navbar-style" variant="dark">
                <Nav className="me-auto">
                    <Link to="test-lines" className='nav-style link-style' >Test Lines</Link>
                    <Link to="my-test-lines" exact="true" className='nav-style link-style' >My Test Lines</Link>
                    <Link to="define-test-lines" exact="true" className='nav-style link-style' >Define Test Line</Link>
                    <Link to="switch-list" exact="true" className='nav-style link-style' >Switch List</Link>
                    <Link to="define-switch" exact="true" className='nav-style link-style' >Define Switch</Link>
                    <Link to="pdu-list" exact="true" className='nav-style link-style' >PDU List</Link>
                    <Link to="define-pdu" exact="true" className='nav-style link-style' >Define PDU</Link>
                </Nav>
            </Navbar>
            <Outlet />
        </>
    )
}

export default MenuComponent;