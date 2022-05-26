import { useEffect, useState } from "react";

import { InputText } from 'primereact/inputtext';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';

import { postFailMessageTypeGroup } from './../../services/test-results-analyzer/fail-message-type.service';
import FailMessagesTableComponent from "./FailMessagesTableComponent";


const FailMessageGroupAddModal = ({ showForm, handleFormClose }) => {

    const [name, setName] = useState("");

    const [selectedFailMessageTypes, setSelectedFailMessageTypes] = useState([]);

    const handleFailMessageRegexGroupAdd = () => {
        let failMessageGroupToAdd = {
            "name": name,
            "fail_message_types": selectedFailMessageTypes
        }
        postFailMessageTypeGroup(failMessageGroupToAdd).then(
            (success) => {
                console.log("Success!")
                clearForm();
                handleFormClose();
            },
            (error) => {
                console.log("Error!")
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

    return (
        <div>
            <Dialog header="Create fail message regex group" visible={showForm} className="dialog-style" onHide={handleFormCloseAndClear}>
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

                <div className="form-item">
                    <Button className="p-button-primary p-button-color" type="submit" onClick={handleFailMessageRegexGroupAdd}>
                        Add Fail Message Group
                    </Button>
                    <Button className="p-button-primary p-button-color" type="submit" onClick={clearForm}>
                        Clear Form
                    </Button>
                </div>
            </Dialog >

        </div >
    )
}

export default FailMessageGroupAddModal;