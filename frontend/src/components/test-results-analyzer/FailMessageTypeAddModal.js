import { useEffect, useState } from "react";

import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputTextarea } from 'primereact/inputtextarea';
import { SelectButton } from 'primereact/selectbutton';
import { Tag } from 'primereact/tag';
import { Tooltip } from 'primereact/tooltip';

import { postFailMessageType, getEnvIssueTypes } from './../../services/test-results-analyzer/fail-message-type.service';

import './FailMessageTypeAddModal.css';

const FailMessageTypeAddModal = ({ showForm, handleFormShow, handleFormClose }) => {

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
                console.log("Error");
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
                console.log("Success!")
                clearForm();
                handleFormClose();
            },
            (error) => {
                console.log("Error!")
            })
    }

    useEffect(() => {
        fetchEnvIssueTypes();
    }, [])

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
                    <SelectButton optionLabel="name" optionValue="name" className="issue-type-select-button" value={envIssueType} options={envIssueTypesList} onChange={(e) => setEnvIssueType(e.value)}></SelectButton>
                </div>
                <div className="form-item">
                    <label htmlFor="regex" className="block">Description</label>
                    <br />
                    <InputTextarea value={description} rows={2} onChange={(e) => setDescription(e.target.value)} autoResize style={{ width: "100%" }} />
                </div>

                <div className="form-item">
                    <Button className="p-button-primary p-button-color" type="submit" onClick={handleFailMessageRegexTypeAdd}>
                        Add Filter
                    </Button>
                    <Button className="p-button-primary p-button-color" type="submit" onClick={clearForm}>
                        Clear Form
                    </Button>
                </div>
            </Dialog >

        </div >
    )
}

export default FailMessageTypeAddModal;