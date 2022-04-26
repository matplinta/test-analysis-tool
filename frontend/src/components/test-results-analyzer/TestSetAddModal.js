import { useState } from 'react';

import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';

import { postTestSet } from '../../services/test-results-analyzer/test-filters.service';
import Notify, { AlertTypes, Successes, Errors } from '../../services/Notify.js';

let TestSetAddModal = ({ showTestSetForm, handleTestSetFormClose }) => {

    const [testSetName, setTestSetName] = useState("");
    const [testLabPath, setTestLabPath] = useState("");

    let handleTestSetNameChange = (e) => {
        setTestSetName(e.target.value);
    }

    let handleTestLabPathChange = (e) => {
        setTestLabPath(e.target.value);
    }

    let handleTestSetAdd = () => {
        let testSetToAdd = {
            "name": "",
            "test_lab_path": ""
        }

        testSetToAdd.name = testSetName;
        testSetToAdd.test_lab_path = testLabPath;

        postTestSet(testSetToAdd).then(
            (response) => {
                clearForm();
                handleTestSetFormClose();
                Notify.sendNotification(Successes.ADD_TEST_SET_SUCCESS, AlertTypes.success);
            },
            (error) => {
                console.log("Error!")
                Notify.sendNotification(Errors.ADD_TEST_SET_ERROR, AlertTypes.error);
            }
        )
    }

    let clearForm = () => {
        setTestSetName("");
        setTestLabPath("");
    }

    return (
        <Dialog header="Create test set" visible={showTestSetForm} className="dialog-style" onHide={handleTestSetFormClose}>
            <div className="form-item">
                <label>Test Set Name (from Reporting Portal)</label>
                <InputText value={testSetName} onChange={handleTestSetNameChange} style={{ width: "100%" }} placeholder="Test Set Name" />
            </div>
            <div className="form-item">
                <label>Test Lab Path (from Reporting Portal)</label>
                <InputText value={testLabPath} onChange={handleTestLabPathChange} style={{ width: "100%" }} placeholder="Test Set Name" />
            </div>
            <div className="form-item">
                <Button variant="primary" type="submit" onClick={handleTestSetAdd}>
                    Add Test Set
                </Button>
                <Button variant="primary" type="submit" onClick={clearForm}>
                    Clear Form
                </Button>
            </div>
        </Dialog>
    )
}

export default TestSetAddModal;