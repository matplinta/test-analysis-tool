import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { Menubar } from 'primereact/menubar';
import { VscRegex } from 'react-icons/vsc';
import { AiOutlineBarChart } from 'react-icons/ai';
import { FiFilter } from 'react-icons/fi';
import { HiOutlineDatabase } from 'react-icons/hi';
import { BiLayer } from 'react-icons/bi';
import { Badge } from 'primereact/badge';
import { Button } from 'primereact/button';
import { OverlayPanel } from 'primereact/overlaypanel';
import { DataScroller } from 'primereact/datascroller';

import logo_TRA from './../../assets/logo_TRA.png';

import GoToAdminComponent from './../home/GoToAdminComponent';
import LogoutComponent from './../home/authorization/LogoutComponent';
import LoginComponent from './../home/authorization/LoginComponent';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { useUserMessages } from '../../services/UserMessagesContext';

import Notify, { AlertTypes, Successes, Infos, Errors, Warnings } from '../../services/Notify.js';

import './MenuComponent.css';


let MenuComponent = ({ isUserLoggedIn, setIsUserLoggedIn }) => {

    const navigate = useNavigate();
    const op = useRef(null)

    const [selectedMessage, setSelectedMessage] = useState(null);
    const [unreadMsgs, setUnreadMsgs] = useState(null);
    const { messages, fetchUserMessages, updateUserMessages } = useUserMessages();

    let computeUnreadMsgs = (msgs) => {
        if (msgs !== null) {
            const unread = msgs.filter(msg => msg.read === false);
            return unread.length;
        }
        else return null

    }

    useEffect(() => {
        fetchUserMessages();
    }, [])

    useEffect(() => {
        setUnreadMsgs(computeUnreadMsgs(messages))
    }, [messages])


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
        <div style={{ display: 'flex' }}>
            <Button  className="p-button-sm p-button-primary" onClick={(e) => op.current.toggle(e)}>
                <i className="pi pi-bell p-overlay-badge" style={{fontSize: '1.5rem'}}>
                    {/* {unreadMsgs === null? null : <Badge value={unreadMsgs} severity="danger" ></Badge>} */}
                    {unreadMsgs === null || unreadMsgs === 0 ? null : <Badge value={unreadMsgs} severity="danger" ></Badge>}
                </i>
            </Button>
            <GoToAdminComponent />
            {isUserLoggedIn && <LogoutComponent setIsUserLoggedIn={setIsUserLoggedIn} />}
            {!isUserLoggedIn && <LoginComponent setIsUserLoggedIn={setIsUserLoggedIn} />}
        </div>
        </>
    )

    let readIcon = (rowData) => {
        if (rowData.read === true) {
            return (
                <i className="pi pi-check mx-3"></i>
            )
        }
        else {
            return (
                <i className="pi pi-circle-fill mx-3" style={{ color: 'var(--blue-500)', fontSize: '1.2rem' }}></i>
            );
        }
    }

    let dateTemplate = (date) => {
        return <div className="font-normal text-color-secondary" style={{fontSize: '0.8rem'}}>{date.replace('T', ' ').replace('Z', '')}</div>
    }

    let messageTemplate = (message, read) => {
        const charLimit = 140
        if (message.length > charLimit) {
            message = message.slice(0, charLimit) + '...'
        }
        return <div className={read ? 'inline' : 'inline font-bold'} style={{textAlign: 'left', width: '100%'}}>{message}</div>
    }

    let message_short_list = (msgs) => {
        return (
            <> 
                {msgs.slice(0, 5).map(({ id, message, read, user, date }) => (
                <div className="shortMsgItem p-2" key={id} onmouseover=""> 
                    <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
                    {messageTemplate(message, read)}
                    {dateTemplate(date)}
                    </div>
                    {read === false ? <i className="pi pi-circle-fill ml-2 inline" style={{ color: 'var(--blue-500)', fontSize: '1.2rem'}}></i> : null}
                </div>
            ))}
        </>
        )
    }

    return (
        <>

            <Menubar model={items} start={start} end={end} className="menu" style={{ height: '55px' }} />
            <Outlet />
            <OverlayPanel ref={op} style={{width: '450px'}} className="">
                
                {messages !== null ? message_short_list(messages) : null}
                <Button label="Show all messages" className="p-button-sm p-button-primary" style={{width: '100%'}} onClick={() => navigate("messages")}>
                </Button>
            </OverlayPanel>
        </>
    )
}

export default MenuComponent;