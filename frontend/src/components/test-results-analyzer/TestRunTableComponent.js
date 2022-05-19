import { useState, useEffect } from 'react';

import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'react-bootstrap';
import { InputText } from 'primereact/inputtext';
import { MultiSelect } from 'primereact/multiselect';

import { getTestRunsUsingFilter } from './../../services/test-results-analyzer/test-runs.service';
import Notify, { AlertTypes, Successes, Errors } from '../../services/Notify.js';

import './TestRunTableComponent.css';


let TestRunTableComponent = ({ filterUrl, onSortColumn, sortField, sortOrder }) => {

    const [testRuns, setTestRuns] = useState([]);
    const [first, setFirst] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);

    const [testRunsCount, setTestRunsCount] = useState(null);
    const [pagesCount, setPagesCount] = useState(null);

    const columns = [
        // { field: 'id', header: 'ID' },
        // { field: 'rp_id', header: 'RP ID' },
        // { field: 'fb', header: 'FB' },
        // { field: 'test_instance.test_case_name', header: 'Test Case' },
        // { field: 'test_instance.test_set.branch', header: 'Branch' },
        { field: 'test_instance.test_set.name', header: 'Test Set Name' },
        { field: 'test_instance.test_set.test_lab_path', header: 'Test Lab Path' },
        // { field: 'testline_type', header: 'Test Line Type' },
        { field: 'test_line', header: 'Test Line' },
        { field: 'test_suite', header: 'Test Suite' },
        { field: 'organization', header: 'Organization' },
        // { field: 'result', header: 'Result' },
        // { field: 'env_issue_type', header: 'Env Issue Type' },
        // { field: 'comment', header: 'Comment' },
        // { field: 'builds', header: 'Builds' },
        // { field: 'log_file_url', header: 'Logs' },
        { field: 'start_time', header: 'Start time' },
        { field: 'end_time', header: 'End time' },
        { field: 'analyzed_by', header: 'Analyzed by' },
        { field: 'fail_message', header: 'Fail Message' }
    ];

    const [selectedColumns, setSelectedColumns] = useState([]);

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
        if (event.key === 'Enter') {
            const page = parseInt(currentPage);
            if (page < 0 || page > options.totalPages) {
                setPageInputTooltip(`Value must be between 1 and ${options.totalPages}.`);
            }
            else {
                const first = currentPage ? options.rows * (page - 1) : 0;
                setFirst(first);
                setPageInputTooltip('Press \'Enter\' key to go to this page.');
                setLazyParams(event);
                setCurrentPage(page);
                fetchTestRunsByFilter(filterUrl, page);
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
                    <span style={{ color: 'var(--text-color)', userSelect: 'none', textAlign: 'center' }}>
                        of {options.totalPages} pages ({options.first} - {options.last} of {options.totalRecords} rows)
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
            <Button variant="link" href={rowData.log_file_url} style={{ fontSize: '11px' }}>Logs</Button>
        )
    }

    let resultBodyTemplate = (rowData) => {
        let resultCssName = "result-badge result-" + rowData.result.replace(' ', '-');
        return <span className={resultCssName}>{rowData.result}</span>;
    }

    let startDateBodyTemplate = (rowData) => {
        return <span>{rowData.start_time.replace('T', ' ').replace('Z', '')}</span>
    }

    let endDateBodyTemplate = (rowData) => {
        return <span>{rowData.end_time.replace('T', ' ').replace('Z', '')}</span>
    }

    const onColumnToggle = (event) => {
        let selectedColumns = event.value;
        let orderedSelectedColumns = columns.filter(col => selectedColumns.some(sCol => sCol.field === col.field));
        setSelectedColumns(orderedSelectedColumns);
    }

    const header = (
        <div style={{ textAlign: 'left' }}>
            <MultiSelect value={selectedColumns} options={columns} display="chip" optionLabel="header" onChange={onColumnToggle} showSelectAll={false} style={{ width: '70%' }}
                placeholder="Select additional columns to show" />
        </div>
    );

    const defineSortFieldNameByField = (field) => {
        return field.replaceAll('.', '__');
    }

    const columnComponents = selectedColumns.map(col => {
        if (col.field === 'start_time') {
            return <Column key={col.field} body={startDateBodyTemplate} header={col.header} sortField={col.field} sortable style={{ fontSize: '11px' }} />;
        } else if (col.field === 'end_time') {
            return <Column key={col.field} body={endDateBodyTemplate} header={col.header} sortField={col.field} sortable style={{ fontSize: '11px' }} />;
        } else {
            return <Column key={col.field} field={col.field} header={col.header} sortField={defineSortFieldNameByField(col.field)} sortable style={{ fontSize: '11px' }} />;
        }
    });

    useEffect(
        () => {
            if (filterUrl === "" && filterUrl !== null) {
                fetchTestRunsByFilter("", currentPage);
            } else if (filterUrl !== "" && filterUrl !== null) {
                fetchTestRunsByFilter(filterUrl, 1);
            }
        }, [filterUrl, sortField, sortOrder]
    )

    return (
        <DataTable value={testRuns} lazy paginator size="small" stripedRows
            pageCount={pagesCount} rows={10} first={first} totalRecords={testRunsCount} onPage={(e) => onPageChange(e)}
            paginatorTemplate={templateCurrentPageReport} header={header} showGridlines
            dataKey="id" rowHover responsiveLayout="scroll" loading={loading}
            resizableColumns columnResizeMode="expand"
            emptyMessage="No test runs found! Please change your selected filters."
            sortField={sortField} sortOrder={sortOrder} onSort={onSortColumn} >

            <Column field="rp_id" header="RP id" sortField='rp_id' sortable style={{ fontSize: '11px' }} />
            <Column field="test_instance.test_case_name" header="Test Case" sortField={defineSortFieldNameByField("test_instance.test_case_name")} sortable style={{ fontSize: '11px' }} />
            <Column field="test_instance.test_set.branch" header="Branch" sortField={defineSortFieldNameByField("test_instance.test_set.branch")} sortable style={{ fontSize: '11px' }} />
            <Column field="testline_type" header="Testline Type" sortable style={{ fontSize: '11px' }} />
            <Column field="builds" header="Build" sortable style={{ fontSize: '11px' }} />
            <Column body={resultBodyTemplate} header="Result" sortField="result" sortable style={{ fontSize: '11px' }} />
            <Column body={logLinkBodyTemplate} header="Logs" style={{ fontSize: '11px' }} />
            <Column field="fb" header="FB" sortable style={{ fontSize: '11px' }} />
            <Column field="env_issue_type" header="Env issue type" sortable style={{ fontSize: '11px' }} />
            <Column field="comment" header="Comment" sortable style={{ fontSize: '11px' }} />
            {columnComponents}
        </DataTable>
    )
}

export default TestRunTableComponent;