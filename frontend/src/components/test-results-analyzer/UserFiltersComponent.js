import { useState, useEffect } from 'react';
import { Button, Table } from 'react-bootstrap';
import { getTest } from '../../services/test';
import { getTestFilters, getTestSets, deleteTestFilter } from '../../services/test-results-analyzer/test-filters.service';

import './UserFiltersComponent.css';

let UserFiltersComponent = () => {

    const [testFilters, setTestFilters] = useState([]);
    const [testSets, setTestSets] = useState([]);

    let addUserFilter = () => {
        // console.log(klikam)
        // getTest().then((res => console.log(res)))
    }

    let fetchTestSets = () => {
        getTestSets().then(
            (response) => {
                setTestSets(response.data.results)
                console.log(response.data.results);
            },
            (error) => {
                console.log(error);
            })
    }

    let fetchTestFilters = () => {
        getTestFilters().then(
            (response) => {
                console.log(response.data.results)
                setTestFilters(response.data.results);
            },
            (error) => {
                console.log(error);
            }
        )
    }

    let removeUserFilter = (id) => {
        console.log(id)
        deleteTestFilter(id).then(
            (response) => {
                let testFiltersList = testFilters.map(testFilter => testFilter.id !== id)
                setTestFilters(testFiltersList);
                console.log("Succesfully removed!");
            },
            (error) => {
                console.log(error);
            })
    }

    useEffect(() => {
        fetchTestSets();
        fetchTestFilters();
    }, [])

    let createTestFiltersList = (
        testFilters.map((item) => {
        return (
            <tr key={item.id}>
                <th>{item.name}</th>
                <th>{testSets.find(testSet => testSet.id === item.test_set).name}</th>
                <th>{testSets.find(testSet => testSet.id === item.test_set).test_lab_path}</th>
                <th>{testSets.find(testSet => testSet.id === item.test_set).branch}</th>
                <th>{item.testline_type}</th>
                <th><Button variant="danger" size="sm" onClick={() => removeUserFilter(item.id)}>Remove</Button></th>
            </tr>
    )})
    )

    return(
        <>
            <br/>
            <Button size="sm" style={{"marginLeft": '20px'}} onClick={addUserFilter}>Add user filter</Button>
            <Table striped bordered hover size="sm" className="table-style">
                <thead>
                    <tr>
                        <th>Filter Name</th>
                        <th>Test Set</th>
                        <th>Test Lab Path</th>
                        <th>Branch</th>
                        <th>Test Line Type</th>
                        <th>Remove</th>
                    </tr>
                </thead>
                <tbody>
                    {createTestFiltersList}
                </tbody>
            </Table>
        </>
    )
}

export default UserFiltersComponent;