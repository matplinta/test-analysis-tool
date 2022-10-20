import axios from "axios";
import { Link, useLocation } from 'react-router-dom';
import { Button } from 'primereact/button';

let GoToAdminComponent = () => {

    const adminApiUrl = axios.defaults.baseURL + "/admin/";

    const openAdminInNewTab = () => {
        window.open(adminApiUrl, '_blank');
    }
    return (

        <Button icon="pi pi-cog" label="Admin" className="p-button-primary" onClick={openAdminInNewTab}>
        </Button>
    )
}

export default GoToAdminComponent;