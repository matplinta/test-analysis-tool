import { useState, useEffect } from 'react';
import { Button, Table, Modal, Form } from 'react-bootstrap';

import { getTestFilters, getTestSets, getTestLineTypes } from '../../services/test-results-analyzer/test-filters.service';

let UserFilterAddModal = ({showForm, handleFormClose, handleFormShow}) => {

    const [testSets, setTestSets] = useState([]);
    const [testLinesTypes, settestLinesTypes] = useState([]);

    const [filterName, setFilterName] = useState('');

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

    let fetchTestLines = () => {
        getTestLineTypes().then(
            (response) => {
                settestLinesTypes(response.data.results);
            },
            (error) => {
                console.log(error)
            })
    }

    let handleInputChange = () => {

    }

    let handleFilterAdd = () => {

    }
    
    useEffect(() => {
        fetchTestSets();
        fetchTestLines();
    }, [])

    return(
        <div>

            <Modal show={showForm} onHide={handleFormClose} aria-labelledby="contained-modal-title-vcenter" centered dialogClassName="modal-90w" >
                <Modal.Header closeButton>
                <Modal.Title>Create user filter</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleFilterAdd} onClose={handleFormClose}>
                        <Form.Group className="mb-3" controlId="formBasicUsername">
                            <Form.Label>Filter Name</Form.Label>
                            <Form.Control required value={filterName} onChange={handleInputChange} type="filterName" placeholder="Enter filter name" />
                        </Form.Group>

                        <Form.Group className="mb-3" controlId="formBasicUsername">
                            <Form.Label>Test Line Type</Form.Label>
                            <Form.Select>
                                {testLinesTypes.map(testLineType => <option key={testLineType.name}>{testLineType.name}</option>)}
                            </Form.Select>
                        </Form.Group>

                        <Form.Group className="mb-3" controlId="formBasicUsername">
                            <Form.Label>Test Line Type</Form.Label>
                            <Form.Select>
                                {testLinesTypes.map(testLineType => <option key={testLineType.name}>{testLineType.name}</option>)}
                            </Form.Select>
                        </Form.Group>

                        {/* <Form.Group className="mb-3" controlId="formBasicCheckbox">
                            <Form.Check type="checkbox" label="Remember my login on this" />
                        </Form.Group> */}

                        <Button variant="primary" type="submit">
                            Add filter
                        </Button>
                    </Form>
                </Modal.Body>
            </Modal>

        </div>
    )
}

export default UserFilterAddModal;