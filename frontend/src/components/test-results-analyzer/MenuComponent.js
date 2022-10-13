import { Link, Outlet, useNavigate } from 'react-router-dom';
import { Menubar } from 'primereact/menubar';
import { VscRegex } from 'react-icons/vsc';
import { AiOutlineBarChart } from 'react-icons/ai';
import { FiFilter } from 'react-icons/fi';
import { HiOutlineDatabase } from 'react-icons/hi';
import { BiLayer } from 'react-icons/bi';

import logo_TRA from './../../assets/logo_TRA.png';

import GoToAdminComponent from './../home/GoToAdminComponent';
import LogoutComponent from './../home/authorization/LogoutComponent';
import LoginComponent from './../home/authorization/LoginComponent';

import './MenuComponent.css';


let MenuComponent = ({ isUserLoggedIn, setIsUserLoggedIn }) => {

    const navigate = useNavigate();

    const items = [
        {
            label: <span><HiOutlineDatabase size='20' style={{ marginBottom: '3px' }} /> Regression Test Runs</span>,
            command: () => { navigate('regression-test-runs') }
        },
        {
            label: <span><BiLayer size='20' style={{ marginBottom: '3px' }} /> Test Instances</span>,
            command: () => { navigate('test-instances') }
        },
        {
            label: <span><FiFilter size='20' style={{ marginBottom: '3px' }} /> Test Set Filters</span>,
            items: [{
                label: "All",
                command: () => { navigate('test-set-filters') },
            }, {
                label: "Subscribed",
                command: () => { navigate('subscribed-test-set-filters') },
            }, {
                label: "Owned",
                command: () => { navigate('owned-test-set-filters') },
            }, {
                label: "Prapare to branch off",
                command: () => { navigate('test-set-filters-branch-off') },
            }]
        },
        {
            label: <span><VscRegex size='20' style={{ marginBottom: '3px' }} /> Fail Messages</span>,
            items: [{
                label: <span>Fail Message Regex</span>,
                command: () => { navigate('fail-regex') }
            }, {
                label: <span>Fail Message Groups</span>,
                command: () => { navigate('fail-regex-groups') }
            }]
        },
        {
            label: <span><AiOutlineBarChart size='20' style={{ marginBottom: '3px' }} /> Statistics</span>,
            command: () => { navigate('statistics') }
        }
    ]

    const start =
        <Link to='/'>
            <img alt="TRA" src={logo_TRA} style={{ height: '20px', marginRight: '10px', marginBottom: '5px' }}></img>
        </Link>;

    const end = (
        <>
            <GoToAdminComponent />

            {isUserLoggedIn && <LogoutComponent setIsUserLoggedIn={setIsUserLoggedIn} />}
            {!isUserLoggedIn && <LoginComponent setIsUserLoggedIn={setIsUserLoggedIn} />}
        </>
    )

    return (
        <>

            <Menubar model={items} start={start} end={end} className="menu" style={{ height: '55px' }} />
            <Outlet />

        </>
    )
}

export default MenuComponent;