import axios from "axios";
import { Link, useLocation } from 'react-router-dom';
import { Button } from 'primereact/button';

let GoToAdminComponent = () => {

    const adminApiUrl = axios.defaults.baseURL + "/admin/";
    return (
        <Button className="p-button-text p-button-sm p-button-secondary" style={{ borderColor: 'lightgrey', height: '35px' }}>
            <a href={adminApiUrl} style={{ textDecoration: 'none' }}>
                <i className="pi pi-cog"></i>
                <span> Admin </span>
            </a>
        </Button>
    )
}

export default GoToAdminComponent;