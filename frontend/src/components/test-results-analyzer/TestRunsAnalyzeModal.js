import { useEffect, useState } from "react";

import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputTextarea } from 'primereact/inputtextarea';
import { SelectButton } from 'primereact/selectbutton';
import { Tag } from 'primereact/tag';
import { Tooltip } from 'primereact/tooltip';

import { getEnvIssueTypes } from './../../services/test-results-analyzer/fail-message-type.service';

const TestRunsAnalyzeModal = ({ selectedRuns, showForm, handleFormShow, handleFormClose }) => {

    const [result, setResult] = useState(null);
    const [envIssueType, setEnvIssueType] = useState(null);
    const [comment, setComment] = useState("");

    const [resultsList, setResultsList] = useState([]);
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
        setResult(null);
        setEnvIssueType(null);
        setComment("");
    }

    const handleAnalyzeTestRun = () => {

    }

    useEffect(() => {
        fetchEnvIssueTypes();
    }, [])

    return (
        <div>
            <Dialog header="Analyze selected test runs" visible={showForm} className="dialog-style" onHide={handleFormClose}>
                <div className="form-item">
                    <label htmlFor="result" className="block">Result</label>
                    <SelectButton optionLabel="name" optionValue="name" className="issue-type-select-button" value={result} options={resultsList} onChange={(e) => setResult(e.value)}></SelectButton>
                </div>
                <div className="form-item">
                    <label htmlFor="envIssueType" className="block">Env Issue Type</label>
                    <SelectButton optionLabel="name" optionValue="name" className="issue-type-select-button" value={envIssueType} options={envIssueTypesList} onChange={(e) => setEnvIssueType(e.value)}></SelectButton>
                </div>
                <div className="form-item">
                    <label htmlFor="comment" className="block">Comment</label>
                    <br />
                    <InputTextarea id="comment" value={comment} rows={2} onChange={(e) => setComment(e.target.value)} autoResize className="block" style={{ width: "100%" }} />
                </div>

                <div className="form-item">
                    <Button className="p-button-primary p-button-color" type="submit" onClick={handleAnalyzeTestRun}>
                        Analyze Test Runs
                    </Button>
                    <Button className="p-button-primary p-button-color" type="submit" onClick={clearForm}>
                        Clear Form
                    </Button>
                </div>
            </Dialog >

        </div >
    )
}

export default TestRunsAnalyzeModal;