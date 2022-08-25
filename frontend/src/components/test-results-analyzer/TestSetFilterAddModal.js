// Description: File is responsible for add/edit form to managr test set filter object
// HISTORY
// --------------------------------------------------------------------------
//   Date                    Author                     Bug                 List of changes
//  --------------------------------------------------------------------------


import { useState, useEffect } from 'react';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { MultiSelect } from 'primereact/multiselect';
import { Checkbox } from 'primereact/checkbox';

import { getTestLineTypes, postTestSetFilter, getTestSetFilter, putTestSetFilter } from '../../services/test-results-analyzer/test-filters.service';
import { getFailMessageTypeGroups } from '../../services/test-results-analyzer/fail-message-type.service';
import AuthService from '../../services/auth.service.js';
import Notify, { AlertTypes, Successes, Errors, Warnings } from '../../services/Notify.js';
import { useCurrentUser } from '../../services/CurrentUserContext';

import './TestSetFilterAddModal.css';

let TestSetFilterAddModal = ({ filterIdToEdit, showForm, handleFormClose, handleFormShow }) => {

    const [testLinesTypes, setTestLinesTypes] = useState([]);
    const [selectedFailMessageTypeGroup, setSelectedFailMessageTypeGroup] = useState([]);
    const [failMessageTypeGroupsList, setFailMessageTypeGroupsList] = useState([]);
    const [usersList, setUsersList] = useState([]);

    const { currentUser, fetchCurrentUser } = useCurrentUser();

    const [testSetName, setTestSetName] = useState("");
    const [testLabPath, setTestLabPath] = useState("");
    const [testLineType, setTestLineType] = useState([]);
    const [owners, setOwners] = useState([]);
    const [subscribers, setSubscribers] = useState([]);
    const [isOwnedByMe, setIsOwnedByMe] = useState(true);
    const [isSubscribedByMe, setIsSubscribedByMe] = useState(true);

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
                Notify.sendNotification(Errors.FETCH_TEST_LINES_LIST, AlertTypes.error);
            })
    }

    let fetchFailMessageTypeGroups = () => {
        getFailMessageTypeGroups().then(
            (response) => {
                if (response.data.length > 0) {
                    const failMessageTypeGroupsValue = response.data.map(item => {
                        return { name: item.name + ", Author: " + item.author, id: item.id }
                    })
                    setFailMessageTypeGroupsList(failMessageTypeGroupsValue);
                }
            },
            (error) => {
                Notify.sendNotification(Errors.FETCH_FAIL_MESSAGE_GROUPS_LIST, AlertTypes.error);
            })
    }

    let fetchUsers = () => {
        console.log("uzytkownik ", currentUser)
        AuthService.getUsers().then(
            (response) => {
                if (response.data.length > 0) {
                    setUsersList(response.data.filter(user => user.username !== currentUser & user.username !== "autoanalyzer"))
                }
            },
            (error) => {
                Notify.sendNotification(Errors.FETCH_USERS_LIST, AlertTypes.error);
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
        setSelectedFailMessageTypeGroup(e.target.value)
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
        setSelectedFailMessageTypeGroup([]);
        setOwners([]);
        setSubscribers([]);
    }

    let handleFilterAdd = () => {
        let filterToAdd = {
            "test_set_name": "",
            "test_lab_path": "",
            "testline_type": null,
            "fail_message_type_groups": [],
            "owners": [],
            "subscribers": []
        }
        filterToAdd.testline_type = testLineType;
        filterToAdd.test_set_name = testSetName;
        filterToAdd.test_lab_path = testLabPath;

        filterToAdd.fail_message_type_groups = failMessageTypeGroupsList.filter(group => {
            let tmp = selectedFailMessageTypeGroup.includes(group.id);
            if (tmp === true) return group
        }).map(mapGroup => ({ "id": mapGroup.id }));

        filterToAdd.owners = owners.map(owner => ({ "username": owner }))
        filterToAdd.owners.push({ "username": currentUser });

        filterToAdd.subscribers = subscribers.map(subscriber => ({ "username": subscriber }));
        if (isSubscribedByMe) filterToAdd.subscribers.push({ "username": currentUser });

        console.log(filterToAdd)

        postTestSetFilter(filterToAdd).then(
            (response) => {
                Notify.sendNotification(Successes.ADD_TEST_SET_FILTER, AlertTypes.success);
                clearForm();
                handleFormClose();
            },
            (error) => {
                Notify.sendNotification(Errors.ADD_TEST_SET_FILTER, AlertTypes.error);
            })
    }

    let handleFilterEdit = () => {
        let filterToEdit = {
            "test_set_name": "",
            "test_lab_path": "",
            "testline_type": null,
            "fail_message_type_groups": [],
            "owners": [],
            "subscribers": []
        }
        filterToEdit.testline_type = testLineType;
        filterToEdit.test_set_name = testSetName;
        filterToEdit.test_lab_path = testLabPath;

        filterToEdit.fail_message_type_groups = failMessageTypeGroupsList.filter(group => {
            let tmp = selectedFailMessageTypeGroup.includes(group.id);
            if (tmp === true) return group
        }).map(mapGroup => ({ "id": mapGroup.id }));

        filterToEdit.owners = owners.map(owner => ({ "username": owner }))
        if (isOwnedByMe) filterToEdit.owners.push({ "username": currentUser })

        filterToEdit.subscribers = subscribers.map(subscriber => ({ "username": subscriber }))
        if (isSubscribedByMe) filterToEdit.subscribers.push({ "username": currentUser })

        if (filterToEdit.owners.length === 0)
            Notify.sendNotification(Warnings.EDIT_TEST_SET_FILTER_ANY_OWNER, AlertTypes.warn);
        else {
            putTestSetFilter(filterIdToEdit, filterToEdit).then(
                (response) => {
                    Notify.sendNotification(Successes.EDIT_TEST_SET_FILTER, AlertTypes.success);
                    clearForm();
                    handleFormClose();
                },
                (error) => {
                    Notify.sendNotification(Errors.EDIT_TEST_SET_FILTER, AlertTypes.error);
                })
        }

    }

    let fetchFilterToEdit = (id) => {
        getTestSetFilter(id).then(
            (result) => {
                setTestSetName(result.data.test_set_name);
                setTestLabPath(result.data.test_lab_path);
                setTestLineType(result.data.testline_type);
                if (result.data.fail_message_type_groups.length !== 0)
                    setSelectedFailMessageTypeGroup(result.data.fail_message_type_groups.map(group => group.id));
                if (result.data.owners.length !== 0)
                    setOwners(result.data.owners.filter(owner => owner.username !== currentUser).map(owner => owner.username))
                if (result.data.subscribers.length !== 0)
                    setSubscribers(result.data.subscribers.filter(subscriber => subscriber.username !== currentUser).map(subscriber => subscriber.username))
            }, (error) => {
                Notify.sendNotification(Errors.FETCH_EDIT_TEST_SET_FILTER, AlertTypes.error);
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
                    <MultiSelect value={selectedFailMessageTypeGroup} options={failMessageTypeGroupsList} onChange={handleFailMessageTypeGroupsChange} style={{ width: "100%" }}
                        optionLabel="name" optionValue="id" filter showClear filterBy="label" />
                </div>
                <div className="form-item">
                    {filterIdToEdit !== null ?
                        <Checkbox inputId="isOwned" onChange={e => setIsOwnedByMe(e.checked)} checked={isOwnedByMe}></Checkbox>
                        :
                        <Checkbox inputId="isOwned" onChange={e => setIsOwnedByMe(e.checked)} checked={isOwnedByMe} disabled></Checkbox>
                    }
                    <label htmlFor="isOwned" className="p-checkbox-label" style={{ marginLeft: '7px' }}> Owned by me</label>
                </div>
                <div className="form-item">
                    <label>Additional owners</label>
                    <br />
                    <MultiSelect value={owners} options={usersList} onChange={handleOwnersChange} style={{ width: "100%" }}
                        optionLabel="username" optionValue="username" filter showClear filterBy="username" />
                </div>
                <div className="form-item">
                    <Checkbox inputId="isSubscribed" onChange={e => setIsSubscribedByMe(e.checked)} checked={isSubscribedByMe}></Checkbox>
                    <label htmlFor="isSubscribed" className="p-checkbox-label" style={{ marginLeft: '7px' }}> Subscribed my me</label>
                </div>
                <div className="form-item">
                    <label>Additional subscribers</label>
                    <br />
                    <MultiSelect value={subscribers} options={usersList} onChange={handleSubscribers} style={{ width: "100%" }}
                        optionLabel="username" optionValue="username" filter showClear filterBy="username" />
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

export default TestSetFilterAddModal;