import { useState, useEffect } from 'react';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { MultiSelect } from 'primereact/multiselect';

import { getTestLineTypes, postTestSetFilter, getTestSetFilter, putTestSetFilter } from '../../services/test-results-analyzer/test-filters.service';
import { getFailMessageTypeGroups } from '../../services/test-results-analyzer/fail-message-type.service';
import AuthService from './../../services/auth.service.js';
import Notify, { AlertTypes, Successes, Errors } from '../../services/Notify.js';
import { useCurrentUser } from '../../services/CurrentUserContext';

import './UserFilterAddModal.css';

let UserFilterAddModal = ({ filterIdToEdit, showForm, handleFormClose, handleFormShow }) => {

    const [testLinesTypes, setTestLinesTypes] = useState([]);
    const [failMessageTypeGroups, setFailMessageTypeGroups] = useState([]);
    const [failMessageTypeGroupsList, setFailMessageTypeGroupsList] = useState([]);
    const [usersList, setUsersList] = useState([]);

    const { currentUser, fetchCurrentUser } = useCurrentUser();

    const [testSetName, setTestSetName] = useState("");
    const [testLabPath, setTestLabPath] = useState("");
    const [testLineType, setTestLineType] = useState(null);
    const [failMessageTypeGroup, setFailMessageTypeGroup] = useState(null);
    const [owners, setOwners] = useState(null);
    const [subscribers, setSubscribers] = useState(null);

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

    let handleTestSetNameChange = (e) => {
        setTestSetName(e.target.value);
    }

    let handleTestLabPathChange = (e) => {
        setTestLabPath(e.target.value);
    }

    let handleTestLineTypeChange = (e) => {
        setTestLineType(e.target.value);
    }

    let handleFailMessageTypeGroupsChange = (e) => {
        setFailMessageTypeGroup(e.target.value);
    }

    let handleOwnersChange = (e) => {
        setOwners(e.target.value);
    }

    let handleSubscribers = (e) => {
        setSubscribers(e.target.value);
    }

    let clearForm = () => {
        setTestSetName("");
        setTestLabPath("");
        setTestLineType(null);
        setFailMessageTypeGroup(null);
        setOwners(null);
        setSubscribers(null);
    }

    let handleFilterAdd = () => {
        let filterToAdd = {
            "test_set_name": "",
            "test_lab_path": "",
            "testline_type": null,
            "fail_message_type_groups": []
        }
        filterToAdd.testline_type = testLineType;
        filterToAdd.test_set_name = testSetName;
        filterToAdd.test_lab_path = testLabPath;
        filterToAdd.fail_message_type_groups = failMessageTypeGroupsList.filter(group => {
            let tmp = failMessageTypeGroup.includes(group.id);
            if (tmp === true) return { "id": group.id, "name": group.name }
        });

        postTestSetFilter(filterToAdd).then(
            (response) => {
                Notify.sendNotification(Successes.ADD_GLOBAL_FILTER_SUCCESS, AlertTypes.success);
                clearForm();
                handleFormClose();
            },
            (error) => {
                Notify.sendNotification(Errors.REMOVE_GLOBAL_FILTER_ERROR, AlertTypes.error);
            })
    }

    let handleFilterEdit = () => {
        let filterToEdit = {
            "test_set_name": "",
            "test_lab_path": "",
            "testline_type": null,
            "fail_message_type_groups": []
        }
        filterToEdit.testline_type = testLineType;
        filterToEdit.test_set_name = testSetName;
        filterToEdit.test_lab_path = testLabPath;
        filterToEdit.fail_message_type_groups = failMessageTypeGroupsList.filter(group => {
            let tmp = failMessageTypeGroup.includes(group.id);
            if (tmp === true) return { "id": group.id, "name": group.name }
        });

        putTestSetFilter(filterIdToEdit, filterToEdit).then(
            (response) => {
                Notify.sendNotification(Successes.TEST_SET_FILTER_EDITED, AlertTypes.success);
                clearForm();
                handleFormClose();
            },
            (error) => {
                Notify.sendNotification(Errors.TEST_SET_FILTER_EDITED, AlertTypes.error);
            })
    }

    let fetchFilterToEdit = (id) => {
        getTestSetFilter(id).then(
            (result) => {
                setTestSetName(result.data.test_set_name);
                setTestLabPath(result.data.test_lab_path);
                setTestLineType(result.data.testline_type);
                setFailMessageTypeGroup(result.data.fail_message_type_groups.map(group => group.id));
            }, (error) => {
                console.log("error fetching filter to edit")
            }
        )
    }

    useEffect(() => {
        fetchCurrentUser();
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
            <Dialog header={filterIdToEdit === null ? "Create Test Set Filter" : "Edit Test Set Filter"} visible={showForm} className="dialog-style" onHide={handleFormClose}>
                <div className="form-item">
                    <label>Test Set Name (from Reporting Portal and QC)</label>
                    <InputText value={testSetName} onChange={handleTestSetNameChange} style={{ width: "100%" }} />
                </div>
                <div className="form-item">
                    <label>Test Lab Path (from Reporting Portal and QC)</label>
                    <InputText value={testLabPath} onChange={handleTestLabPathChange} style={{ width: "100%" }} />
                </div>
                <div className="form-item">
                    <label>Test Line Type (from UTE Cloud)</label>
                    <br />
                    <Dropdown value={testLineType} options={testLinesTypes} onChange={handleTestLineTypeChange} style={{ width: "100%" }}
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

        </div >
    )
}

export default UserFilterAddModal;