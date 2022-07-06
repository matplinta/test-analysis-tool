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
import { postTestRun } from "../../services/test-results-analyzer/test-runs.service";

const TestRunsAnalyzeModal = ({ selectedTestRuns, showForm, handleFormClose }) => {

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
        let testRunToUpdate = {
            'rp_ids': selectedTestRuns.map(run => run.rp_id),
            'comment': comment,
            'result': "environment issue",
            'env_issue_type': envIssueType
        }
        console.log(testRunToUpdate)
        postTestRun(testRunToUpdate).then(
            (success) => {
                console.log("Success!")
                clearForm();
                handleFormCloseAndRefresh();
            },
            (error) => {
                console.log("Error!")
            })
    }

    const handleFormCloseAndRefresh = () => {
        handleFormClose();
        clearForm();
    }

    useEffect(() => {
        console.log("otwieram okno")
        fetchEnvIssueTypes();
        console.log(selectedTestRuns)
    }, [])

    return (
        <div>
            <Dialog header="Analyze selected test runs" visible={showForm} className="dialog-style" onHide={handleFormCloseAndRefresh}>
                <div className="form-item">
                    <label htmlFor="result" className="block">Result</label>
                    <br />
                    <Tag value="Environment issue" style={{ fontSize: 'medium' }}></Tag>
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