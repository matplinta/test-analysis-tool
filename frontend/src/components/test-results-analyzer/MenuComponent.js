import { useState } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { Navbar, Nav } from 'react-bootstrap';
import { TabMenu } from 'primereact/tabmenu';
import { Button } from 'primereact/button';
import { Menubar } from 'primereact/menubar';

import logo_TRA from './../../assets/logo_TRA.png';

import './MenuComponent.css';


let MenuComponent = () => {

    const items = [
        {
            label: <Link to="regression-test-runs" className="menu-item">Regression Test Runs</Link>,
            icon: 'pi pi-database'
        },
        {
            label: <Link to="regression-filters" className="menu-item" >Regression Filter</Link>,
            icon: 'pi pi-filter'
        }
    ]

    const start = <img alt="..." src={logo_TRA} style={{ height: '20px', marginRight: '10px' }}></img>;

    return (
        <>

            <Menubar model={items} start={start} className="menu" />
            <Outlet />

        </>
    )
}

export default MenuComponent;