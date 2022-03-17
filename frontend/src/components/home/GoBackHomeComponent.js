import { Link, useLocation } from 'react-router-dom';
import { Button } from 'react-bootstrap';
import { TiArrowBackOutline } from 'react-icons/ti';


let GoBackHomeComponent = () => {
    const location = useLocation().pathname;
    const homeInActive = location === '/' ? false : true;
    return(
        <>
            {homeInActive === true && 
            <Button variant="outline-primary" size="sm" style={{textDecoration: 'unset'}}>
                <Link to="/" >
                    <TiArrowBackOutline size='20' /><span> Go Home </span>
                </Link>
            </Button>
            }
        </>
    )
}

export default GoBackHomeComponent;