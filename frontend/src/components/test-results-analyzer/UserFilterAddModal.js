import { useState, useEffect } from 'react';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Tooltip } from 'primereact/tooltip';
import { Badge } from 'primereact/badge'
import { FaPlus } from 'react-icons/fa';

import TestSetAddModal from './TestSetAddModal';

import { getTestFilters, getTestSets, getTestLineTypes, postTestFilter } from '../../services/test-results-analyzer/test-filters.service';
import Notify, { AlertTypes, Successes, Errors } from '../../services/Notify.js';

import './UserFilterAddModal.css';

let UserFilterAddModal = ({ showForm, handleFormClose, handleFormShow }) => {

    const [testSets, setTestSets] = useState([]);
    const [testSetsOptions, setTestSetsOptions] = useState([]);
    const [testLinesTypes, setTestLinesTypes] = useState([]);

    const [filterName, setFilterName] = useState("");
    const [testLineType, setTestLineType] = useState(null);
    const [testSetId, setTestSetId] = useState(null);

    const [showTestSetForm, setShowTestSetForm] = useState(false);
    const handleTestSetFormClose = () => setShowTestSetForm(false);
    const handleTestSetFormShow = () => setShowTestSetForm(true);

    let fetchTestSets = () => {
        getTestSets().then(
            (response) => {
                setTestSets(response.data.results);
                setTestSetsOptions((response.data.results.map(item => {
                    return { label: item.branch + " " + item.name, value: item.id }
                })))
                console.log(response.data.results);
            },
            (error) => {
                console.log(error);
            })
    }

    let fetchTestLines = () => {
        getTestLineTypes().then(
            (response) => {
                setTestLinesTypes(response.data.results.map(item => {
                    return { label: item.name, value: item.name }
                }))
            },
            (error) => {
                console.log(error)
            })
    }

    let handleFilterNameChange = (e) => {
        setFilterName(e.target.value);
    }

    let handleTestLineTypeChange = (e) => {
        setTestLineType(e.target.value);
    }

    let handleTestSetChange = (e) => {
        setTestSetId(e.target.value);
    }

    let clearForm = () => {
        setFilterName("");
        setTestLineType("");
        setTestSetId(null);
    }

    let handleFilterAdd = () => {
        let filterToAdd = {
            "name": "",
            "test_set": {
                "name": "",
                "test_lab_path": ""
            },
            "testline_type": null
        }
        let testSetToAdd = testSets.find(item => item.id == testSetId);
        filterToAdd.name = filterName;
        filterToAdd.testline_type = testLineType;
        filterToAdd.test_set.name = testSetToAdd.name;
        filterToAdd.test_set.test_lab_path = testSetToAdd.test_lab_path;

        postTestFilter(filterToAdd).then(
            (response) => {
                console.log("Success!")
                clearForm();
                handleFormClose();
            },
            (error) => {
                console.log("Error!")
            })
    }

    let showAddTestSetForm = () => {
        handleTestSetFormShow(true);
    }

    let handleTestSetFormCloseAndRefresh = () => {
        handleTestSetFormClose();
        fetchTestSets();
    }

    useEffect(() => {
        fetchTestSets();
        fetchTestLines();
    }, [])

    return (
        <div>
            <Dialog header="Create user filter" visible={showForm} className="dialog-style" onHide={handleFormClose}>
                <div className="form-item">
                    <label>Filter Name</label>
                    <InputText value={filterName} onChange={handleFilterNameChange} style={{ width: "100%" }} placeholder="Filter Name" />
                </div>
                <div className="form-item">
                    <label>Test Line Type</label>
                    <br />
                    <Dropdown value={testLineType} options={testLinesTypes} onChange={handleTestLineTypeChange} style={{ width: "100%" }}
                        optionLabel="label" filter showClear filterBy="label" placeholder="Select Test Line Type" />
                </div>
                <div className="form-item">
                    <label>Test Set</label>
                    <Tooltip target=".custom-target-icon" />
                    <FaPlus className="custom-target-icon add-icon" onClick={showAddTestSetForm} data-pr-tooltip="Click to add Test Set" />
                    <Dropdown value={testSetId} options={testSetsOptions} onChange={handleTestSetChange} style={{ width: "100%" }}
                        optionLabel="label" filter showClear filterBy="label" placeholder="Select Test Set" />
                </div>
                <div className="form-item">
                    <Button variant="primary" className="p-button-color" type="submit" onClick={handleFilterAdd}>
                        Add Filter
                    </Button>
                    <Button variant="primary" className="p-button-color" type="submit" onClick={clearForm}>
                        Clear Form
                    </Button>
                </div>
            </Dialog >

            <TestSetAddModal showTestSetForm={showTestSetForm} handleTestSetFormClose={handleTestSetFormCloseAndRefresh} />

        </div >
    )
}

export default UserFilterAddModal;