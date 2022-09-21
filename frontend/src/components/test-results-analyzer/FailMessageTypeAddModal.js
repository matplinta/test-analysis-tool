// Description: File is responsible for managing form to add/edit fail message type regex
// HISTORY
// --------------------------------------------------------------------------
//   Date                    Author                     Bug                 List of changes
//  --------------------------------------------------------------------------

import { useEffect, useState } from "react";

import { InputText } from 'primereact/inputtext';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputTextarea } from 'primereact/inputtextarea';
import { SelectButton } from 'primereact/selectbutton';

import { postFailMessageType, getEnvIssueTypes, putFailMessageType } from './../../services/test-results-analyzer/fail-message-type.service';
import Notify, { AlertTypes, Successes, Errors, Warnings } from '../../services/Notify.js';

import './FailMessageTypeAddModal.css';

const FailMessageTypeAddModal = ({ failMessageToEdit, showForm, handleFormClose }) => {

    const [name, setName] = useState('');
    const [regex, setRegex] = useState('');
    const [description, setDescription] = useState('');
    const [envIssueType, setEnvIssueType] = useState(null);

    const [envIssueTypesList, setEnvIssueTypesList] = useState([]);

    const fetchEnvIssueTypes = () => {
        getEnvIssueTypes().then(
            (response) => {
                let data = response.data.filter(item => item.name !== "");
                setEnvIssueTypesList(data);
            },
            (error) => {
                Notify.sendNotification(Errors.FETCH_FAIL_MESSAGE_REGEX, AlertTypes.error);
            })
    }

    const clearForm = () => {
        setName('');
        setRegex('');
        setDescription('');
        setEnvIssueType(null);
    }

    const handleFailMessageRegexTypeAdd = () => {
        let failMessgeRegexTypeToAdd = {
            'name': name,
            'regex': regex,
            'description': description,
            'env_issue_type': envIssueType
        }
        postFailMessageType(failMessgeRegexTypeToAdd).then(
            (success) => {
                Notify.sendNotification(Successes.ADD_FAIL_MESSAGE_REGEX, AlertTypes.success)
                clearForm();
                handleFormClose();
            },
            (error) => {
                Notify.sendNotification(Errors.ADD_FAIL_MESSAGE_REGEX, AlertTypes.error)
            })
    }

    const handleFailMessageRegexTypeEdit = () => {
        let failMessageRegexTypeToEdit = {
            'name': name,
            'regex': regex,
            'description': description,
            'env_issue_type': envIssueType
        }
        putFailMessageType(failMessageToEdit.id, failMessageRegexTypeToEdit).then(
            (success) => {
                Notify.sendNotification(Successes.EDIT_FAIL_MESSAGE_REGEX, AlertTypes.success)
                clearForm();
                handleFormClose();
            },
            (error) => {
                Notify.sendNotification(Errors.EDIT_FAIL_MESSAGE_REGEX, AlertTypes.error)
            })
    }


    let fetchFailMesageToEdit = () => {
        setName(failMessageToEdit.name);
        setRegex(failMessageToEdit.regex);
        setEnvIssueType(failMessageToEdit.env_issue_type);
        setDescription(failMessageToEdit.description);
    }

    let selectEnvIssueType = (type) => {
        setEnvIssueType(type)
    }

    useEffect(() => {
        fetchEnvIssueTypes();
        if (failMessageToEdit !== null) fetchFailMesageToEdit();
        else clearForm();
    }, [failMessageToEdit])

    return (
        <div>
            <Dialog header="Create fail message regex type" visible={showForm} className="dialog-style" onHide={handleFormClose}>
                <div className="form-item">
                    <label htmlFor="name" className="block">Fail Message Name</label>
                    <InputText id="name" value={name} onChange={(e) => setName(e.target.value)} style={{ width: "100%" }}
                        className="block" />
                </div>
                <div className="form-item">
                    <label htmlFor="regex" className="block">Fail Message Regex</label>
                    <br />
                    <InputTextarea id="regex" value={regex} rows={2} onChange={(e) => setRegex(e.target.value)} autoResize className="block" style={{ width: "100%" }} />
                </div>
                <div className="form-item">
                    <label htmlFor="envIssueType" className="block">Env Issue Type</label>
                    <SelectButton optionLabel="name" optionValue="name" className="issue-type-select-button" value={envIssueType} options={envIssueTypesList} onChange={(e) => selectEnvIssueType(e.value)}></SelectButton>
                </div>
                <div className="form-item">
                    <label htmlFor="regex" className="block">Description</label>
                    <br />
                    <InputTextarea value={description} rows={2} onChange={(e) => setDescription(e.target.value)} autoResize style={{ width: "100%" }} />
                </div>

                {failMessageToEdit === null ?
                    <div className="form-item">
                        <Button className="p-button-primary" type="submit" onClick={handleFailMessageRegexTypeAdd}>
                            Add Regex
                        </Button>
                        <Button className="p-button-primary" type="submit" onClick={clearForm}>
                            Clear Form
                        </Button>
                    </div>
                    :
                    <div className="form-item">
                        <Button className="p-button-primary" type="submit" onClick={handleFailMessageRegexTypeEdit}>
                            Save Regex
                        </Button>
                    </div>
                }
            </Dialog >

        </div >
    )
}

export default FailMessageTypeAddModal;