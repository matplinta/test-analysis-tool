import { useState, useEffect } from 'react';

import { FilterMatchMode, FilterOperator } from 'primereact/api';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'react-bootstrap';

import { getTestRuns, getTestRunsUsingFilter } from './../../services/test-results-analyzer/test-runs.service';

let TestRunTableComponent = ({ filterUrl }) => {

    const [testRuns, setTestRuns] = useState([]);

    let fetchTestRuns = (page) => {
        console.log("tuuuuuuuuuuuuuu1")
        getTestRuns(page).then(
            (response) => {
                if (response.data.results.length > 0) {
                    setTestRuns(response.data.results);
                }
            },
            (error) => {
                console.log(error);
            })
    }

    let fetchTestRunsByFilter = (filter, page) => {
        console.log("tuuuuuuuuuuuuuu2")
        getTestRunsUsingFilter(filter, page).then(
            (response) => {
                if (response.data.results.length > 0) {
                    setTestRuns(response.data.results);
                }
            },
            (error) => {
                console.log(error);
            })
    }

    let logLinkBodyTemplate = (rowData) => {
        return (
            <Button variant="link" href={rowData.log_file_url} style={{ fontSize: '12px' }}>Logs</Button>
        )
    }

    let parseDate = (dateToParse) => {
        return Date.parse(dateToParse);
    }

    let startDateBodyTemplate = (rowData) => {
        return <p>{parseDate(rowData.start_time)}</p>
    }

    useEffect(
        () => {
            console.log(filterUrl)
            fetchTestRunsByFilter(filterUrl, 1);
        }, [filterUrl]
    )

    return (
        <div className="datatable-doc-demo">
            <div className="card">
                <DataTable value={testRuns} paginator className="p-datatable-test-runs" rows={10} size="small"
                    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown" rowsPerPageOptions={[10, 25, 50]}
                    dataKey="id" rowHover filterDisplay="menu" responsiveLayout="scroll">
                    <Column field="rp_id" header="RP id" sortable filter filterPlaceholder="Search by test case name" style={{ maxWidth: '100px', fontSize: '12px' }} />
                    <Column field="test_instance.test_set.name" header="Test Set" sortable filter filterPlaceholder="Search by test case name" style={{ maxWidth: '100px', fontSize: '12px' }} />

                    <Column field="test_instance.test_case_name" header="Test Case" sortable filter filterPlaceholder="Search by test case name" style={{ maxWidth: '100px', fontSize: '12px' }} />
                    {/* <Column field="test_instance.test_set.test_lab_path" header="Lab Path" sortable filter filterPlaceholder="Search by test case name" style={{ maxWidth: '100px', fontSize: '12px' }} /> */}
                    {/* <Column field="test_instance.test_set.branch" header="Branch" sortable filter filterPlaceholder="Search by test case name" style={{ maxWidth: '100px', fontSize: '12px' }} /> */}
                    {/* <Column field="testline_type" header="Testline Type" sortable filter filterPlaceholder="Search by build" style={{ maxWidth: '100px', fontSize: '12px' }} /> */}
                    {/* <Column field="test_line" header="Testline" sortable filter filterPlaceholder="Search by build" style={{ maxWidth: '100px', fontSize: '12px' }} /> */}
                    <Column field="builds" header="Build" sortable filter filterPlaceholder="Search by build" style={{ maxWidth: '160px', fontSize: '12px' }} />
                    <Column field="fb" header="FB" sortable filter filterPlaceholder="Search by build" style={{ maxWidth: '100px', fontSize: '12px' }} />
                    <Column body={logLinkBodyTemplate} header="Logs" sortable filter filterPlaceholder="Search by build" style={{ maxWidth: '100px', fontSize: '12px' }} />
                    {/* <Column body={startDateBodyTemplate} header="Start time" sortable filter filterPlaceholder="Search by build" style={{ maxWidth: '100px', fontSize: '12px' }} /> */}
                    {/* <Column field="end_time" header="End time" sortable filter filterPlaceholder="Search by build" style={{ maxWidth: '100px', fontSize: '12px' }} /> */}
                    <Column field="env_issue_type" header="Env issue type" sortable filter filterPlaceholder="Search by build" style={{ maxWidth: '100px', fontSize: '12px' }} />
                    <Column field="comment" header="Comment" sortable filter filterPlaceholder="Search by build" style={{ maxWidth: '100px', fontSize: '12px' }} />
                    {/* <Column field="fail_message" header="Fail Message" sortable filter filterPlaceholder="Search by build" style={{ maxWidth: '100px', fontSize: '12px' }} /> */}
                    <Column field="analyzed_by" header="Analyzed by" sortable filter filterPlaceholder="Search by build" style={{ maxWidth: '100px', fontSize: '12px' }} />
                    <Column field="result" header="Result" sortable filter filterPlaceholder="Search by result" style={{ maxWidth: '100px', fontSize: '12px' }} />
                </DataTable>
            </div>
        </div>
    )
}

export default TestRunTableComponent;