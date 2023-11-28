import { useEffect, useState } from "react";

import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { InputTextarea } from 'primereact/inputtextarea';
import { SelectButton } from 'primereact/selectbutton';
import { ToggleButton } from 'primereact/togglebutton';
import { getEnvIssueTypes } from './../../services/test-results-analyzer/fail-message-type.service';
import { postTestRun } from "../../services/test-results-analyzer/test-runs.service";
import Notify, { AlertTypes, Errors, Successes } from '../../services/Notify.js';


const TestRunsAnalyzeModal = ({ selectedTestRuns, showForm, handleFormClose }) => {

    const [envIssueType, setEnvIssueType] = useState(null);
    const [result, setResult] = useState("environment issue");

    const allResults = [
        {name: "Environment Issue", value: "environment issue"},
        {name: "Failed", value: "failed"},
    ]

    const [comment, setComment] = useState("");
    const [pronto, setPronto] = useState("");
    const [sendToQc, setSendToQc] = useState(false);

    const [envIssueTypesList, setEnvIssueTypesList] = useState([]);

    const fetchEnvIssueTypes = () => {
        getEnvIssueTypes().then(
            (response) => {
                let data = response.data.filter(item => item.name !== "");
                setEnvIssueTypesList(data);
            },
            (error) => {
                Notify.sendNotification(Errors.FETCH_ENV_ISSUE_TYPES, AlertTypes.error);
            })
    }

    const clearForm = () => {
        setResult("environment issue");
        setEnvIssueType(null);
        setComment("");
        setPronto("");
    }

    const handleAnalyzeTestRun = () => {
        let testRunToUpdate = {
            'rp_ids': selectedTestRuns.map(run => run.rp_id),
            'comment': comment,
            'pronto': pronto,
            'result': result,
            'send_to_qc': sendToQc,
            'env_issue_type': envIssueType
        }
        postTestRun(testRunToUpdate).then(
            (success) => {
                clearForm();
                handleFormCloseAndRefresh();
                Notify.sendNotification(Successes.ANALYSE_TEST_RUN, AlertTypes.success);
            },
            (error) => {
                Notify.sendNotification(Errors.ANALYSE_TEST_RUN, AlertTypes.error);
            })
    }

    const handleFormCloseAndRefresh = () => {
        handleFormClose();
        clearForm();
    }

    useEffect(() => {
        fetchEnvIssueTypes();
    }, [])

    return (
        <div>
            <Dialog header="Analyze selected test runs" visible={showForm} className="dialog-style" onHide={handleFormCloseAndRefresh}>
                <div className="form-item">
                    <label htmlFor="result" className="block">Result</label>
                    <SelectButton className="issue-type-select-button" optionLabel="name" value={result} options={allResults} onChange={(e) => setResult(e.value)}></SelectButton>
                </div>
                <div className="form-item">
                    <label htmlFor="envIssueType" className="block">Env Issue Type</label>
                    <SelectButton disabled={result === "failed"} optionLabel="name" optionValue="name" className="issue-type-select-button" value={envIssueType} options={envIssueTypesList} onChange={(e) => setEnvIssueType(e.value)}></SelectButton>
                </div>
                <div className="form-item">
                    <label htmlFor="sendToQc" className="block">Send to QC?</label>
                    <ToggleButton checked={sendToQc} onChange={(e) => setSendToQc(e.value)} className="w-8rem" />
                </div>
                <div className="form-item">
                    <label htmlFor="comment" className="block">Comment</label>
                    <InputTextarea id="comment" value={comment} rows={2} onChange={(e) => setComment(e.target.value)} autoResize className="block" style={{ width: "100%" }} />
                </div>
                <div className="form-item">
                    <label htmlFor="pronto" className="block">Pronto</label>
                    <InputTextarea id="pronto" disabled={result !== "failed"} value={pronto} rows={1} onChange={(e) => setPronto(e.target.value)} autoResize className="block" style={{ width: "100%" }} />
                </div>

                <div className="form-item">
                    <Button className="p-button-primary " type="submit" onClick={handleAnalyzeTestRun}>
                        Analyze Test Runs
                    </Button>
                    <Button className="p-button-primary " type="submit" onClick={clearForm}>
                        Clear Form
                    </Button>
                </div>
            </Dialog >

        </div >
    )
}

export default TestRunsAnalyzeModal;