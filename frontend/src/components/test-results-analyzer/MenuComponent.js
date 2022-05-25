import { Outlet, useNavigate } from 'react-router-dom';
import { Menubar } from 'primereact/menubar';
import { VscRegex } from 'react-icons/vsc';
import { FiFilter } from 'react-icons/fi';
import { HiOutlineDatabase } from 'react-icons/hi';

import logo_TRA from './../../assets/logo_TRA.png';

import './MenuComponent.css';


let MenuComponent = () => {

    const navigate = useNavigate();

    const items = [
        {
            label: <span><HiOutlineDatabase size='20' style={{ marginBottom: '3px' }} /> Regression Test Runs</span>,
            command: () => { navigate('regression-test-runs') }
        },
        {
            label: <span><FiFilter size='20' style={{ marginBottom: '3px' }} /> Regression Filter</span>,
            command: () => { navigate('regression-filters') }
        },
        {
            label: <span><VscRegex size='20' style={{ marginBottom: '3px' }} /> Fail Message Groups</span>,
            command: () => { navigate('fail-regex-groups') }
        },
        {
            label: <span><VscRegex size='20' style={{ marginBottom: '3px' }} /> Fail Message Regex</span>,
            command: () => { navigate('fail-regex') }
        }
    ]

    const start = <img alt="TRA" src={logo_TRA} style={{ height: '20px', marginRight: '10px', marginBottom: '5px' }}></img>;

    return (
        <>

            <Menubar model={items} start={start} className="menu" style={{ height: '55px' }} />
            <Outlet />

        </>
    )
}

export default MenuComponent;