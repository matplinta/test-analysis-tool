import { Menubar } from 'primereact/menubar';

import GoBackHomeComponent from './GoBackHomeComponent';
import GoToAdminComponent from './GoToAdminComponent';
import LogoutComponent from './authorization/LogoutComponent';
import LoginComponent from './authorization/LoginComponent';

let CommonMenuComponent = ({ isUserLoggedIn, setIsUserLoggedIn }) => {

    const start = <>
        <GoBackHomeComponent />
        <GoToAdminComponent />
    </>;

    const end = (
        <>
            {isUserLoggedIn && <LogoutComponent setIsUserLoggedIn={setIsUserLoggedIn} />}
            {!isUserLoggedIn && <LoginComponent setIsUserLoggedIn={setIsUserLoggedIn} />}
        </>
    )

    return (
        <Menubar start={start} end={end} className="menu" style={{ backgroundColor: 'white', height: '40px' }} />
    )
}

export default CommonMenuComponent;