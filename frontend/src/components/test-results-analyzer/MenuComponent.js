import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { Menubar } from 'primereact/menubar';
import { VscRegex } from 'react-icons/vsc';
import { AiOutlineBarChart } from 'react-icons/ai';
import { FiFilter } from 'react-icons/fi';
import { HiOutlineDatabase } from 'react-icons/hi';
import { BiLayer } from 'react-icons/bi';
import { MdOutlineHelpOutline } from 'react-icons/md';
import { Badge } from 'primereact/badge';
import { Button } from 'primereact/button';
import { OverlayPanel } from 'primereact/overlaypanel';
import { DataScroller } from 'primereact/datascroller';
import AuthService from './../../services/auth.service.js';
import GoToAdminComponent from './../home/GoToAdminComponent';
import LogoutComponent from './../home/authorization/LogoutComponent';
import LoginComponent from './../home/authorization/LoginComponent';
import { useUserMessages } from '../../services/UserMessagesContext';

import logo_TRA from './../../assets/logo_TRA.png';
import searching_outline from './../../assets/searching_outline.png';

import './MenuComponent.css';


let MenuComponent = ({ isUserLoggedIn, setIsUserLoggedIn }) => {

    const navigate = useNavigate();
    const op = useRef(null)
    const opUser = useRef(null)

    const [username, setUsername] = useState(null);
    const [unreadMsgs, setUnreadMsgs] = useState(null);
    const { messages, fetchUserMessages, updateUserMessages } = useUserMessages();

    let computeUnreadMsgs = (msgs) => {
        if (msgs !== null) {
            const unread = msgs.filter(msg => msg.read === false);
            return unread.length;
        }
        else return null

    }

    let markAsReadMessage = (selMsg) => {
        if (selMsg !== null && selMsg.read === false) {
            selMsg.read = true
            updateUserMessages(selMsg)
        }
    } 

    useEffect(() => {
        if (isUserLoggedIn === true) {
            fetchUserMessages();
            setUsername(AuthService.getCurrentUser().username);

        }
    }, [isUserLoggedIn])

    useEffect(() => {
        setUnreadMsgs(computeUnreadMsgs(messages))
    }, [messages])


    const items = [
        {
            label: <span><HiOutlineDatabase size='20' style={{ marginBottom: '3px' }} /> Regression Test Runs</span>,
            command: () => { navigate('regression-test-runs') },
            // url: 'regression-test-runs'
        },
        {
            label: <span><BiLayer size='20' style={{ marginBottom: '3px' }} /> Test Instances</span>,
            command: () => { navigate('test-instances') },
            // url: 'test-instances'
        },
        {
            label: <span><FiFilter size='20' style={{ marginBottom: '3px' }} /> Test Set Filters</span>,
            items: [{
                label: "All",
                command: () => { navigate('test-set-filters') },
                // url: 'test-set-filters',
            }, {
                label: "Subscribed",
                command: () => { navigate('subscribed-test-set-filters') },
                // url: 'subscribed-test-set-filters',
            }, {
                label: "Owned",
                command: () => { navigate('owned-test-set-filters') },
                // url: 'owned-test-set-filters',
            }, {
                label: "Prapare to branch off",
                command: () => { navigate('test-set-filters-branch-off') },
                // url: 'test-set-filters-branch-off',
            }]
        },
        {
            label: <span><VscRegex size='20' style={{ marginBottom: '3px' }} /> Fail Messages</span>,
            items: [{
                label: <span>Fail Message Regexes</span>,
                command: () => { navigate('fail-regex') },
                // url: 'fail-regex',
            }, {
                label: <span>Fail Message Groups</span>,
                command: () => { navigate('fail-regex-groups') },
                // url: 'fail-regex-groups',
            }]
        },
        {
            label: <span><AiOutlineBarChart size='20' style={{ marginBottom: '3px' }} /> Statistics</span>,
            command: () => { navigate('statistics') },
            // url: 'statistics'
        },
        {
            label: <span><MdOutlineHelpOutline size='20' style={{ marginBottom: '3px' }} /> About</span>,
            command: () => { navigate('about') },
            // url: 'about'
        }
    ]

    const start =
        <Link to='/'>
            <div>
                <img alt="TRA" src={searching_outline} style={{ height: '30px', marginBottom: '3px', marginRight: '5px', filter: 'brightness(0) invert(1)' }}></img>
                <img alt="TRA" src={logo_TRA} style={{ height: '20px', marginRight: '5px', marginBottom: '5px' }}></img>
            </div>
        </Link>;


    const end = (
        <>
        <div style={{ display: 'flex' }}>
            {isUserLoggedIn && 
            <Button  className="p-button-sm p-button-primary" onClick={(e) => op.current.toggle(e)}>
                <i className="pi pi-bell p-overlay-badge" style={{fontSize: '1.5rem'}}>
                    {unreadMsgs === null || unreadMsgs === 0 ? null : <Badge value={unreadMsgs} severity="danger" ></Badge>}
                </i>
            </Button>}
            <GoToAdminComponent />
            {/* {isUserLoggedIn && <LogoutComponent setIsUserLoggedIn={setIsUserLoggedIn} username={username} />} */}
            {isUserLoggedIn && 
            <Button  icon="pi pi-user" label={username} className="p-button-primary" onClick={(e) => opUser.current.toggle(e)}>
            </Button>}
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

    let dateTemplate = (date, read) => {
        return <div 
            className={read ? "font-normal text-color-secondary" : "font-bold text-blue-500 "} 
            style={{fontSize: '0.7rem'}}>{date.replace('T', ' ').replace('Z', '')}
        </div>
    }

    let messageTemplate = (message, read) => {
        const charLimit = 140
        if (message.length > charLimit) {
            message = message.slice(0, charLimit) + '...'
        }
        return <div className={read ? '' : 'font-bold'} style={{textAlign: 'left', width: '100%'}}>{message}</div>
    }

    let message_short_list = (msgs) => {
        return (
            <> 
                {msgs.slice(0, 4).map(({ id, message, read, user, date }) => (
                <div className="shortMsgItem p-2" key={id}> 
                    <div className='msgAndDate'>
                    {messageTemplate(message, read)}
                    {dateTemplate(date, read)}
                    </div>
                    {read === false ? <div className='circle' onClick={() => markAsReadMessage({ id, message, read, user, date })}>
                        <i className="pi pi-circle-fill mx-2" style={{ color: 'var(--blue-500)', fontSize: '1.2rem'}}></i>
                        </div> : null}
                </div>
            ))}
        </>
        )
    }

    return (
        <>

            <Menubar model={isUserLoggedIn ? items : null} start={start} end={end} className="menu" style={{ height: '55px' }} />
            <Outlet />
            <OverlayPanel ref={op} style={{width: '500px'}} className="msgOverlay">
                
                {messages !== null ? message_short_list(messages) : null}
                <Button label="Show all messages" className="p-button-sm p-button-primary" style={{width: '100%'}} onClick={(e) => {
                    op.current.hide(e)
                    navigate("messages")
                }}>
                </Button>
            </OverlayPanel>
            <OverlayPanel ref={opUser}  className="userOverlay">
                 <LogoutComponent setIsUserLoggedIn={setIsUserLoggedIn} parentOverlay={opUser}/>
            </OverlayPanel>
        </>
    )
}

export default MenuComponent;