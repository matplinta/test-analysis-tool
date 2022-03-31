import { useState, useEffect } from 'react';
import { Button } from 'react-bootstrap';
import { getTest } from '../../services/test';
import { getTestFilters } from '../../services/test-results-analyzer/test-filters.service';

let UserFiltersComponent = () => {

    const [testFilters, setTestFilters] = useState({});

    // let klikam = () => {
    //     console.log(klikam)
    //     getTest().then((res => console.log(res)))
    // }

    useEffect(() => {
        getTestFilters().then(
            (response) => {
                console.log(response.data)
                setTestFilters(response.data);
            },
            (error) => {
                console.log(error);
            }
        )
    }, [])

    return(
        <>
            <h1>sssss</h1>
            {/* <Button onClick={klikam}>Klik Test</Button> */}
        </>
    )
}

export default UserFiltersComponent;