import { useState, useEffect } from 'react';

import { FilterMatchMode, FilterOperator } from 'primereact/api';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'react-bootstrap';

import { getTestRuns, getTestRunsUsingFilter } from './../../services/test-results-analyzer/test-runs.service';
import Notify, { AlertTypes, Successes, Errors } from '../../services/Notify.js';


let TestRunTableComponent = ({ filterUrl }) => {

    const [testRuns, setTestRuns] = useState([]);
    const [firstPage, setFirstPage] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);

    const [testRunsCount, setTestRunsCount] = useState(null);
    const [pagesCount, setPagesCount] = useState(null);

    const [loading, setLoading] = useState(false);
    const [lazyParams, setLazyParams] = useState({
        first: 0,
        rows: 10,
        page: 1,
        sortField: null,
        sortOrder: null,
        filters: {}
    });

    const rowsPerPage = 5;

    let fetchTestRunsByFilter = (filter, page) => {
        setLoading(true);
        getTestRunsUsingFilter(filter, page).then(
            (response) => {
                if (response.data.results.length > 0) {
                    setTestRuns(response.data.results);
                    setTestRunsCount(response.data.count);
                    setPagesCount(Math.round(response.data.count / rowsPerPage));
                    setLoading(false);
                    setCurrentPage(1);
                }
            },
            (error) => {
                Notify.sendNotification(Errors.GET_TEST_RUNS, AlertTypes.error);
                setLoading(true);
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

    let onPageChange = (e) => {
        setFirstPage(e.first)
        setLazyParams(e);
        setCurrentPage(e.page + 1);
    }

    // const convertUrl = (paramsEntry) => {
    //     let serverUrl = "";
    //     for (let key in paramsEntry) {
    //         if (!paramsEntry[key].indexOf(',')) {
    //             let valueArray = paramsEntry[key].split(',');
    //             for (let value of valueArray) {
    //                 serverUrl += key + "=" + value + "&";
    //             }
    //         } else {
    //             serverUrl += key + "=" + paramsEntry[key] + "&"
    //         }
    //     }

    //     return serverUrl.slice(0, -1);
    // }

    useEffect(
        () => {
            if (filterUrl !== "") {
                fetchTestRunsByFilter(filterUrl, currentPage);
            } else {
                fetchTestRunsByFilter("", currentPage);
            }
        }, [filterUrl]
    )

    return (
        <div className="datatable-doc-demo">
            <div className="card">
                <DataTable value={testRuns} lazy paginator className="p-datatable-test-runs" pageCount={pagesCount} rows={10} first={firstPage} totalRecords={testRunsCount} size="small" onPage={(e) => onPageChange(e)}
                    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport"
                    dataKey="id" rowHover responsiveLayout="scroll" loading={loading}>
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