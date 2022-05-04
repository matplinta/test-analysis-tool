import axios from "axios";

import { Button } from 'react-bootstrap';

let GoToAdminComponent = () => {

    const adminApiUrl = axios.defaults.baseURL + "/admin/";
    return (
        <Button variant="outline-primary" size="sm" href={adminApiUrl}>
            Admin
        </Button>
    )
}

export default GoToAdminComponent;