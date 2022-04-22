import { Button } from 'react-bootstrap';

let GoToAdminComponent = () => {
    return (
        <Button variant="outline-primary" size="sm" href="http://localhost:8000/admin/">
            Admin
        </Button>
    )
}

export default GoToAdminComponent;