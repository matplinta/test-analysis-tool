import axios from "axios";

let GoToAdminComponent = () => {

    const adminApiUrl = axios.defaults.baseURL + "/admin/";
    return (
        <a href={adminApiUrl} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', color: 'white', textAlign: 'center' }}>
            <i className="pi pi-cog" style={{ marginBottom: '9px' }}></i>
            <span style={{ marginBottom: '9px' }}> Admin </span>
        </a>
    )
}

export default GoToAdminComponent;