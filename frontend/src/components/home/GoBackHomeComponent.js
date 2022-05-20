import { Link, useLocation } from 'react-router-dom';
import { Button } from 'primereact/button';
import { TiArrowBackOutline } from 'react-icons/ti';


let GoBackHomeComponent = () => {
    const location = useLocation().pathname;
    const homeInActive = location === '/' ? false : true;
    return (
        <>
            {homeInActive === true &&
                <Button className="p-button-text p-button-sm p-button-secondary"
                    style={{ borderColor: 'lightgrey', height: '35px', marginRight: '5px' }}>
                    <Link to="/" style={{ textDecoration: 'none' }}>
                        <i className="pi pi-home"></i><span> Go Home </span>
                    </Link>
                </Button>
            }
        </>
    )
}

export default GoBackHomeComponent;