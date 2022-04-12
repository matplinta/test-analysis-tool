import { useState } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { Navbar, Nav } from 'react-bootstrap';
import { TabMenu } from 'primereact/tabmenu';
import { Button } from 'primereact/button';

import './MenuComponent.css';


let MenuComponent = () => {

    // const [activeIndex, setActiveIndex] = useState(1);

    // let history = createBrowserHistory();

    // const items = [
    //     { label: 'Analized Test Runs', icon: 'pi pi-fw pi-home', command: () => { this.navigateToPage('/analyzed-test-runs') } },
    //     { label: 'Waiting Test Runs', icon: 'pi pi-fw pi-calendar', command: () => { this.navigateToPage('/waiting-test-runs') } },
    //     { label: 'Define Filter', icon: 'pi pi-fw pi-pencil', command: () => { this.navigateToPage('/user-filters') } }
    // ];

    // navigateToPage = (path) => {
    //     this.props.history.push(path);
    // }

    return (
        <>
            <Navbar className="navbar-style" variant="dark">
                <Nav className="me-auto">
                    <Link to="analyzed-test-runs" className='nav-style link-style' >Analized Test Runs</Link>
                    <Link to="waiting-test-runs" exact="true" className='nav-style link-style' >Waiting Test Runs</Link>
                    <Link to="user-filters" exact="true" className='nav-style link-style' >Define Filter</Link>
                </Nav>
            </Navbar>
            <Outlet />

            {/* <div>
                <div className="card">
                    <TabMenu model={items} onTabChange={(e) => setActiveIndex(e.index)} >

                    </TabMenu>

                </div>
            </div> */}
        </>
    )
}

export default MenuComponent;