import { Link, Outlet } from 'react-router-dom';
import { Navbar, Nav } from 'react-bootstrap';

import './MenuComponent.css';


let MenuComponent = () => {
    return(
        <>
            <Navbar className="navbar-style" variant="dark">
                <Nav className="me-auto">
                    <Link to="analyzed-test-runs" className='nav-style link-style' >Analized Test Runs</Link>
                    <Link to="waiting-test-runs" exact="true" className='nav-style link-style' >Waiting Test Runs</Link>
                    <Link to="user-filters" exact="true" className='nav-style link-style' >Define Filter</Link>
                </Nav>
            </Navbar>
            <Outlet />
        </>
    )
}

export default MenuComponent;