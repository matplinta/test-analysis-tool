import { useEffect, useState } from "react";

import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputTextarea } from 'primereact/inputtextarea';
import { SelectButton } from 'primereact/selectbutton';
import { Tag } from 'primereact/tag';

import { getEnvIssueTypes } from './../../services/test-results-analyzer/fail-message-type.service';
import { postTestRun } from "../../services/test-results-analyzer/test-runs.service";
import Notify, { AlertTypes, Errors, Successes } from '../../services/Notify.js';


const TestRunsAnalyzeModal = ({ selectedTestRuns, showForm, handleFormClose }) => {

    const [envIssueType, setEnvIssueType] = useState(null);
    const [comment, setComment] = useState("");

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