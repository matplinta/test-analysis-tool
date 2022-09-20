// Description: File is responsible for dialog to add/edit fail message group object
// HISTORY
// --------------------------------------------------------------------------
//   Date                    Author                     Bug                 List of changes
//  --------------------------------------------------------------------------

import { useEffect, useState } from "react";

import { InputText } from 'primereact/inputtext';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';

import FailMessagesTableComponent from "./FailMessagesTableComponent";

import { postFailMessageTypeGroup, putFailMessageTypeGroup } from './../../services/test-results-analyzer/fail-message-type.service';
import Notify, { AlertTypes, Errors, Successes } from '../../services/Notify';

const FailMessageGroupAddModal = ({ failMessageGroupToEdit, failMessageGroupToCopy, showForm, handleFormClose }) => {

    const [name, setName] = useState("");
    const [selectedFailMessageTypes, setSelectedFailMessageTypes] = useState([]);

    const handleFailMessageRegexGroupAdd = () => {
        let failMessageGroupToAdd = {
            "name": name,
            "fail_message_types": selectedFailMessageTypes
        }
        postFailMessageTypeGroup(failMessageGroupToAdd).then(
            (success) => {
                Notify.sendNotification(Successes.ADD_FAIL_MESSAGE_REGEX_GROUP, AlertTypes.success);
                clearForm();
                handleFormClose();
            },
            (error) => {
                Notify.sendNotification(Successes.ADD_FAIL_MESSAGE_REGEX_GROUP, AlertTypes.error);
            })
    }

    const handleFailMessageRegexGroupEdit = () => {
        let failMessageGroupToUpdate = {
            "name": name,
            "fail_message_types": selectedFailMessageTypes
        }
        putFailMessageTypeGroup(failMessageGroupToEdit.id, failMessageGroupToUpdate).then(
            (success) => {
                Notify.sendNotification(Successes.EDIT_FAIL_MESSAGE_REGEX_GROUP, AlertTypes.success);
                clearForm();
                handleFormClose();
            },
            (error) => {
                Notify.sendNotification(Errors.EDIT_FAIL_MESSAGE_REGEX_GROUP, AlertTypes.error);
            })
    }

    const clearForm = () => {
        setName("");
        setSelectedFailMessageTypes([]);
    }

    const handleFormCloseAndClear = () => {
        clearForm();
        handleFormClose();
    }

    const fetchFailMessageGroupToEdit = () => {
        setName(failMessageGroupToEdit.name);
        setSelectedFailMessageTypes(failMessageGroupToEdit.fail_message_types)
    }

    const fetchFailMessageGroupToCopy = () => {
        setName(failMessageGroupToCopy.name);
        setSelectedFailMessageTypes(failMessageGroupToCopy.fail_message_types)
    }

    const setDialogTitle = () => {
        if (failMessageGroupToCopy !== null) {
            return "Copy Fail Message Regex Group";
        }
        else if (failMessageGroupToEdit !== null) {
            return "Edit Fail Message Regex Group";
        } else {
            return "Create Fail Message Regex Group";
        }
    }

    const setFormButtons = () => {
        if (failMessageGroupToCopy !== null) {
            return <div className="form-item">
                <Button className="p-button-primary p-button-color" type="submit" onClick={handleFailMessageRegexGroupAdd}>
                    Copy Fail Message Group
                </Button>
            </div>
        }
        else if (failMessageGroupToEdit !== null) {
            return <div className="form-item">
                <Button className="p-button-primary p-button-color" type="submit" onClick={handleFailMessageRegexGroupAdd}>
                    Add Fail Message Group
                </Button>
                <Button className="p-button-primary p-button-color" type="submit" onClick={clearForm}>
                    Clear Form
                </Button>
            </div>
        } else {
            return <div className="form-item">
                <Button className="p-button-primary p-button-color" type="submit" onClick={handleFailMessageRegexGroupEdit}>
                    Save
                </Button>
            </div>
        }
    }

    useEffect(() => {
        if (failMessageGroupToEdit !== null) fetchFailMessageGroupToEdit();
        else if (failMessageGroupToCopy !== null) fetchFailMessageGroupToCopy();
        else clearForm();
    }, [failMessageGroupToEdit, failMessageGroupToCopy])

    return (
        <div>
            <Dialog header={setDialogTitle} visible={showForm} className="dialog-style" onHide={handleFormCloseAndClear}>
                <div className="form-item">
                    <label htmlFor="name" className="block">Fail Message Group Name</label>
                    <InputText id="name" value={name} onChange={(e) => setName(e.target.value)} style={{ width: "100%" }}
                        className="block" />
                </div>
                <div className="form-item">
                    <label htmlFor="name" className="block">Select Fail Message Regexes</label>

                    <FailMessagesTableComponent selectedFailMessageTypes={selectedFailMessageTypes}
                        setSelectedFailMessageTypes={setSelectedFailMessageTypes} />

                </div>

                {failMessageGroupToEdit === null ?
                    <div className="form-item">
                        <Button className="p-button-primary p-button-color" type="submit" onClick={handleFailMessageRegexGroupAdd}>
                            Add Fail Message Group
                        </Button>
                        {failMessageGroupToCopy === null ?
                            <Button className="p-button-primary p-button-color" type="submit" onClick={clearForm}>
                                Clear Form
                            </Button>
                            : null
                        }
                    </div>
                    :
                    <div className="form-item">
                        <Button className="p-button-primary p-button-color" type="submit" onClick={handleFailMessageRegexGroupEdit}>
                            Save
                        </Button>
                    </div>
                }
            </Dialog >

        </div >
    )
}

export default FailMessageGroupAddModal;