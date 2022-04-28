import { useState, useEffect } from 'react';

import { FilterMatchMode, FilterOperator } from 'primereact/api';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'react-bootstrap';
import { Ripple } from 'primereact/ripple';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { classNames } from 'primereact/utils';

import { getTestRuns, getTestRunsUsingFilter } from './../../services/test-results-analyzer/test-runs.service';
import Notify, { AlertTypes, Successes, Errors } from '../../services/Notify.js';


let TestRunTableComponent = ({ filterUrl }) => {

    const [testRuns, setTestRuns] = useState([]);
    const [first, setFirst] = useState(0);
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

    const [pageInputTooltip, setPageInputTooltip] = useState('Press \'Enter\' key to go to this page.');

    const onPageInputChange = (event) => {
        setCurrentPage(event.target.value);
    }

    let onPageChange = (event) => {
        setFirst(event.first)
        setLazyParams(event);
        setCurrentPage(event.page);
        fetchTestRunsByFilter(filterUrl, event.page + 1);
    }

    const onPageInputKeyDown = (event, options) => {
        console.log(currentPage)
        if (event.key === 'Enter') {
            const page = parseInt(currentPage);
            if (page < 0 || page > options.totalPages) {
                setPageInputTooltip(`Value must be between 1 and ${options.totalPages}.`);
            }
            else {
                const first = currentPage ? options.rows * (page - 1) : 0;
                setFirst(first);
                setPageInputTooltip('Press \'Enter\' key to go to this page.');
                onPageChange(event);
            }
        }
    }

    const templateCurrentPageReport = {
        layout: 'FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport',
        'CurrentPageReport': (options) => {
            return (
                <>
                    <span className="p-mx-3" style={{ color: 'var(--text-color)', userSelect: 'none' }}>
                        Go to <InputText size="2" className="p-ml-1" value={currentPage} tooltip={pageInputTooltip}
                            onKeyDown={(e) => onPageInputKeyDown(e, options)} onChange={onPageInputChange} />
                    </span>
                    <span style={{ color: 'var(--text-color)', userSelect: 'none', width: '120px', textAlign: 'center' }}>
                        {options.first} - {options.last} of {options.totalRecords}
                    </span>
                </>
            )
        }
    };

    let fetchTestRunsByFilter = (filter, page) => {
        setLoading(true);
        getTestRunsUsingFilter(filter, page).then(
            (response) => {
                if (response.data.results.length > 0) {
                    setTestRuns(response.data.results);
                    setTestRunsCount(response.data.count);
                    setPagesCount(Math.round(response.data.count / rowsPerPage));
                    setCurrentPage(page);
                    setLoading(false);
                } else {
                    setTestRuns([]);
                    setTestRunsCount(0);
                    setPagesCount(1);
                    setLoading(false);
                }

            },
            (error) => {
                Notify.sendNotification(Errors.GET_TEST_RUNS, AlertTypes.error);
                setLoading(false);
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
            if (filterUrl === "" && filterUrl !== null) {
                fetchTestRunsByFilter("", currentPage);
            } else if (filterUrl !== "" && filterUrl !== null) {
                fetchTestRunsByFilter(filterUrl, currentPage);
            }
        }, [filterUrl]
    )

    return (
        <div className="datatable-doc-demo">
            <div className="card">
                <DataTable value={testRuns} lazy paginator className="p-datatable-test-runs" size="small" stripedRows
                    pageCount={pagesCount} rows={10} first={first} totalRecords={testRunsCount} onPage={(e) => onPageChange(e)}
                    paginatorTemplate={templateCurrentPageReport}
                    dataKey="id" rowHover responsiveLayout="scroll" loading={loading}
                    emptyMessage="No test runs found! Please change your selected filters.">
                    <Column field="rp_id" header="RP id" sortable style={{ maxWidth: '100px', fontSize: '12px' }} />
                    <Column field="test_instance.test_set.name" header="Test Set" sortable style={{ maxWidth: '100px', fontSize: '12px' }} />

                    <Column field="test_instance.test_case_name" header="Test Case" sortable style={{ maxWidth: '100px', fontSize: '12px' }} />
                    {/* <Column field="test_instance.test_set.test_lab_path" header="Lab Path" sortable filter filterPlaceholder="Search by test case name" style={{ maxWidth: '100px', fontSize: '12px' }} /> */}
                    {/* <Column field="test_instance.test_set.branch" header="Branch" sortable filter filterPlaceholder="Search by test case name" style={{ maxWidth: '100px', fontSize: '12px' }} /> */}
                    {/* <Column field="testline_type" header="Testline Type" sortable filter filterPlaceholder="Search by build" style={{ maxWidth: '100px', fontSize: '12px' }} /> */}
                    {/* <Column field="test_line" header="Testline" sortable filter filterPlaceholder="Search by build" style={{ maxWidth: '100px', fontSize: '12px' }} /> */}
                    <Column field="builds" header="Build" sortable style={{ maxWidth: '160px', fontSize: '12px' }} />
                    <Column field="fb" header="FB" sortable style={{ maxWidth: '100px', fontSize: '12px' }} />
                    <Column body={logLinkBodyTemplate} header="Logs" style={{ maxWidth: '100px', fontSize: '12px' }} />
                    {/* <Column body={startDateBodyTemplate} header="Start time" sortable filter filterPlaceholder="Search by build" style={{ maxWidth: '100px', fontSize: '12px' }} /> */}
                    {/* <Column field="end_time" header="End time" sortable filter filterPlaceholder="Search by build" style={{ maxWidth: '100px', fontSize: '12px' }} /> */}
                    <Column field="env_issue_type" header="Env issue type" sortable style={{ maxWidth: '100px', fontSize: '12px' }} />
                    <Column field="comment" header="Comment" sortable style={{ maxWidth: '100px', fontSize: '12px' }} />
                    {/* <Column field="fail_message" header="Fail Message" sortable filter filterPlaceholder="Search by build" style={{ maxWidth: '100px', fontSize: '12px' }} /> */}
                    <Column field="analyzed_by" header="Analyzed by" sortable style={{ maxWidth: '100px', fontSize: '12px' }} />
                    <Column field="result" header="Result" sortable style={{ maxWidth: '100px', fontSize: '12px' }} />
                </DataTable>
            </div>
        </div>
    )
}

export default TestRunTableComponent;