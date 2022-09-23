import axios from "axios";
import { Link, useLocation } from 'react-router-dom';
import { Button } from 'primereact/button';

let GoToAdminComponent = () => {

    const adminApiUrl = axios.defaults.baseURL + "/admin/";
    return (
        <a href={adminApiUrl} target="_blank" style={{ textDecoration: 'none', color: 'white', textAlign: 'center' }}>
            <i className="pi pi-cog" style={{ marginBottom: '9px' }}></i>
            <span style={{ marginBottom: '9px' }}> Admin </span>
        </a>
    )
}

export default GoToAdminComponent;