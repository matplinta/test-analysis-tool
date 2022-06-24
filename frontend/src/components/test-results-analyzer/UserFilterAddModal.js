import { useState, useEffect } from 'react';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Tooltip } from 'primereact/tooltip';
import { Badge } from 'primereact/badge'
import { FaPlus } from 'react-icons/fa';
import { MultiSelect } from 'primereact/multiselect';

import TestSetAddModal from './TestSetAddModal';

import { getTestSets, getTestLineTypes, postTestFilter, getTestFilter, putTestFilter } from '../../services/test-results-analyzer/test-filters.service';
import { getFailMessageTypeGroups } from '../../services/test-results-analyzer/fail-message-type.service';
import AuthService from './../../services/auth.service.js';
import Notify, { AlertTypes, Successes, Errors } from '../../services/Notify.js';
import { useCurrentUser } from '../../services/CurrentUserContext';

import './UserFilterAddModal.css';

let UserFilterAddModal = ({ filterIdToEdit, showForm, handleFormClose, handleFormShow }) => {

    const [testSets, setTestSets] = useState([]);
    const [testSetsOptions, setTestSetsOptions] = useState([]);
    const [testLinesTypes, setTestLinesTypes] = useState([]);
    const [failMessageTypeGroups, setFailMessageTypeGroups] = useState([]);
    const [failMessageTypeGroupsList, setFailMessageTypeGroupsList] = useState([]);
    const [usersList, setUsersList] = useState([]);

    const { currentUser, fetchCurrentUser } = useCurrentUser();

    const [filterName, setFilterName] = useState("");
    const [testLineType, setTestLineType] = useState(null);
    const [testSetId, setTestSetId] = useState(null);
    const [failMessageTypeGroup, setFailMessageTypeGroup] = useState(null);
    const [owners, setOwners] = useState(null);
    const [subscribers, setSubscribers] = useState(null);


    const [showTestSetForm, setShowTestSetForm] = useState(false);
    const handleTestSetFormClose = () => setShowTestSetForm(false);
    const handleTestSetFormShow = () => setShowTestSetForm(true);

    let fetchTestSets = () => {
        getTestSets().then(
            (response) => {
                if (response.data.results.length > 0) {
                    setTestSets(response.data.results);
                    const testSetsOptionsValue = response.data.results.map(item => {
                        return { label: item.branch + " " + item.name, value: item.id }
                    })
                    setTestSetsOptions(testSetsOptionsValue);
                }
            },
            (error) => {
                console.log(error);
            })
    }

    let fetchTestLines = () => {
        getTestLineTypes().then(
            (response) => {
                if (response.data.length > 0) {
                    const testLinesTypesValue = response.data.map(item => {
                        return { label: item.name, value: item.name }
                    })
                    setTestLinesTypes(testLinesTypesValue);
                }
            },
            (error) => {
                console.log(error)
            })
    }

    let fetchFailMessageTypeGroups = () => {
        getFailMessageTypeGroups().then(
            (response) => {
                if (response.data.length > 0) {
                    setFailMessageTypeGroupsList(response.data);
                    const failMessageTypeGroupsValue = response.data.map(item => {
                        return { label: item.name + ", Author: " + item.author, value: item.id }
                    })
                    setFailMessageTypeGroups(failMessageTypeGroupsValue);
                }
            },
            (error) => {
                console.log(error)
            })
    }

    let fetchUsers = () => {
        AuthService.getUsers().then(
            (response) => {
                if (response.data.length > 0) {
                    setUsersList(response.data);
                }
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

    let handleFailMessageTypeGroupsChange = (e) => {
        setFailMessageTypeGroup(e.target.value);
        console.log(failMessageTypeGroup)
    }

    let handleOwnersChange = (e) => {
        setOwners(e.target.value);
    }

    let handleSubscribers = (e) => {
        setSubscribers(e.target.value);
    }

    let clearForm = () => {
        setFilterName("");
        setTestLineType(null);
        setTestSetId(null);
        setFailMessageTypeGroup(null);
        setOwners(null);
        setSubscribers(null);
    }

    let handleFilterAdd = () => {
        let filterToAdd = {
            "name": "",
            "test_set": {
                "name": "",
                "test_lab_path": ""
            },
            "testline_type": null,
            "fail_message_type_groups": []
        }
        let testSetToAdd = testSets.find(item => item.id == testSetId);
        filterToAdd.name = filterName;
        filterToAdd.testline_type = testLineType;
        filterToAdd.test_set.name = testSetToAdd.name;
        filterToAdd.test_set.test_lab_path = testSetToAdd.test_lab_path;
        filterToAdd.fail_message_type_groups = failMessageTypeGroupsList.filter(group => {
            let tmp = failMessageTypeGroup.includes(group.id);
            if (tmp === true) return { "id": group.id, "name": group.name }
        });

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

    let handleFilterEdit = () => {
        let filterToEdit = {
            "name": "",
            "test_set": {
                "name": "",
                "test_lab_path": ""
            },
            "testline_type": null,
            "fail_message_type_groups": []
        }
        let testSetToAdd = testSets.find(item => item.id == testSetId);
        filterToEdit.name = filterName;
        filterToEdit.testline_type = testLineType;
        filterToEdit.test_set.name = testSetToAdd.name;
        filterToEdit.test_set.test_lab_path = testSetToAdd.test_lab_path;
        filterToEdit.fail_message_type_groups = failMessageTypeGroupsList.filter(group => {
            let tmp = failMessageTypeGroup.includes(group.id);
            if (tmp === true) return { "id": group.id, "name": group.name }
        });

        putTestFilter(filterIdToEdit, filterToEdit).then(
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

    let fetchFilterToEdit = (id) => {
        getTestFilter(id).then(
            (result) => {
                setFilterName(result.data.name);
                setTestLineType(result.data.testline_type);
                setTestSetId(result.data.test_set.id);
                setFailMessageTypeGroup(result.data.fail_message_type_groups.map(group => group.id));
            }, (error) => {
                console.log("error fetching filter to edit")
            }
        )
    }

    useEffect(() => {
        fetchCurrentUser();
        fetchTestSets();
        fetchTestLines();
        fetchFailMessageTypeGroups();
        fetchUsers();

        if (filterIdToEdit !== null) {
            fetchFilterToEdit(filterIdToEdit);
        } else {
            clearForm();
            // setOwners([currentUser.id]);
            // setSubscribers([currentUser.id]);
        }

    }, [filterIdToEdit, showForm])

    return (
        <div>
            <Dialog header={filterIdToEdit === null ? "Create user filter" : "Edit user filter"} visible={showForm} className="dialog-style" onHide={handleFormClose}>
                <div className="form-item">
                    <label>Filter Name</label>
                    <InputText value={filterName} onChange={handleFilterNameChange} style={{ width: "100%" }} />
                </div>
                <div className="form-item">
                    <label>Test Line Type</label>
                    <br />
                    <Dropdown value={testLineType} options={testLinesTypes} onChange={handleTestLineTypeChange} style={{ width: "100%" }}
                        optionLabel="label" filter showClear filterBy="label" />
                </div>
                <div className="form-item">
                    <label>Test Set</label>
                    <Tooltip target=".custom-target-icon" />
                    <FaPlus className="custom-target-icon add-icon" onClick={showAddTestSetForm} data-pr-tooltip="Click to add Test Set" />
                    <Dropdown value={testSetId} options={testSetsOptions} onChange={handleTestSetChange} style={{ width: "100%" }}
                        optionLabel="label" filter showClear filterBy="label" />
                </div>
                <div className="form-item">
                    <label>Fail Message Type Groups</label>
                    <br />
                    <MultiSelect value={failMessageTypeGroup} options={failMessageTypeGroups} onChange={handleFailMessageTypeGroupsChange} style={{ width: "100%" }}
                        optionLabel="label" filter showClear filterBy="label" />
                </div>
                <div className="form-item">
                    <label>Additional owners</label>
                    <br />
                    <MultiSelect value={owners} options={usersList} onChange={handleOwnersChange} style={{ width: "100%" }}
                        optionLabel="username" optionValue="id" filter showClear filterBy="username" />
                </div>
                <div className="form-item">
                    <label>Additional subscribers</label>
                    <br />
                    <MultiSelect value={subscribers} options={usersList} onChange={handleSubscribers} style={{ width: "100%" }}
                        optionLabel="username" optionValue="id" filter showClear filterBy="username" />
                </div>
                {filterIdToEdit === null ?
                    <div className="form-item">
                        <Button className="p-button-primary p-button-color" type="submit" onClick={handleFilterAdd}>
                            Add Filter
                        </Button>
                        <Button className="p-button-primary p-button-color" type="submit" onClick={clearForm}>
                            Clear Form
                        </Button>
                    </div>
                    : <div className="form-item">
                        <Button className="p-button-primary p-button-color" type="submit" onClick={handleFilterEdit}>
                            Save Filter
                        </Button>
                    </div>
                }
            </Dialog >

            <TestSetAddModal showTestSetForm={showTestSetForm} handleTestSetFormClose={handleTestSetFormCloseAndRefresh} />

        </div >
    )
}

export default UserFilterAddModal;