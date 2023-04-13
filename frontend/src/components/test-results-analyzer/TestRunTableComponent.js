import { useState, useEffect } from 'react';

import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { MultiSelect } from 'primereact/multiselect';
import { Dropdown } from 'primereact/dropdown';

import TestRunsAnalyzeModal from './TestRunsAnalyzeModal';

import { getTestRunsUsingFilter } from './../../services/test-results-analyzer/test-runs.service';
import Notify, { AlertTypes, Infos, Errors, Warnings } from '../../services/Notify.js';

import './TestRunTableComponent.css';

let TestRunTableComponent = ({ filterUrl, onSortColumn, sortField, sortOrder }) => {

    const [testRuns, setTestRuns] = useState([]);
    const [selectedTestRuns, setSelectedTestRuns] = useState(null);
    const [first, setFirst] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);

    const [testRunsCount, setTestRunsCount] = useState(null);
    const [pagesCount, setPagesCount] = useState(null);

    const columns = [
        { field: 'test_instance.test_set.test_set_name', header: 'Test Set' },
        { field: 'test_instance.test_set.test_lab_path', header: 'Test Lab Path' },
        { field: 'test_line', header: 'Testline' },
        { field: 'test_suite', header: 'Test Suite' },
        { field: 'organization', header: 'Organization' },
        { field: 'start_time', header: 'Start time' },
        { field: 'end_time', header: 'End time' },
        { field: 'analyzed_by', header: 'Analyzed by' },
        { field: 'fb', header: 'FB' },
        { field: 'airphone', header: 'AirPhone' },
        { field: 'comment', header: 'Comment' },
        { field: 'env_issue_type', header: 'Env issue type' },
        { field: 'exec_trigger', header: 'Execution Trigger' },
        { field: 'log_file_url_ext', header: 'Logs mirror' }
    ];

    const [selectedColumns, setSelectedColumns] = useState([]);

    const [loading, setLoading] = useState(false);

    const [rowsPerPage, setRowsPerPage] = useState(30);

    const [pageInputTooltip, setPageInputTooltip] = useState('Press \'Enter\' key to go to this page.');

    const [showForm, setShowForm] = useState(false);

    const handleFormClose = () => setShowForm(false);

    const handleFormShow = () => setShowForm(true);

    const onPageInputChange = (event) => {
        setCurrentPage(event.target.value);
    }

    let onPageChange = (event) => {
        setFirst(event.first)
        // setLazyParams(event);
        setCurrentPage(event.page);
        fetchTestRunsByFilter(filterUrl, event.page + 1, rowsPerPage);
        window.scrollTo(0, 0);
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
                // setLazyParams(event);
                setCurrentPage(page);
                fetchTestRunsByFilter(filterUrl, page, rowsPerPage);
            }
        }
    }

    const onPagesPerRowChange = (e) => {
        setRowsPerPage(e.value);
        fetchTestRunsByFilter(filterUrl, 1, e.value, rowsPerPage);
        setCurrentPage(1);
    }

    const templateCurrentPageReport = {
        layout: 'FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown',
        'CurrentPageReport': (options) => {
            return (
                <>
                    <span className="p-mx-3" style={{ color: 'var(--text-color)', userSelect: 'none' }}>
                        Go to <InputText size="2" className="p-ml-1" value={currentPage} tooltip={pageInputTooltip}
                            onKeyDown={(e) => onPageInputKeyDown(e, options)} onChange={onPageInputChange} />
                    </span>
                    <span style={{ color: 'var(--text-color)', userSelect: 'none' }}>
                        of {options.totalPages} pages ({options.first} - {options.last} of {options.totalRecords} rows)
                    </span>
                </>
            )
        },
        'RowsPerPageDropdown': (options) => {
            return (
                <>
                    <span className="p-mx-1" style={{ color: 'var(--text-color)', userSelect: 'none', paddingLeft: '15px' }}> Items per page: </span>
                    <Dropdown value={rowsPerPage} options={options.options} onChange={(e) => onPagesPerRowChange(e)} appendTo={document.body} style={{ justifyContent: 'right' }} />
                </>
            );
        }
    };

    let fetchTestRunsByFilter = (filter, page, pageSize) => {
        setLoading(true);
        getTestRunsUsingFilter(filter, page, pageSize).then(
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
        return rowData.log_file_url ? (
            <a href={rowData.log_file_url} target="_blank" style={{ fontSize: '11px' }}>Logs</a>
        ) : null
    }

    let logExtLinkBodyTemplate = (rowData) => {
        return rowData.log_file_url_ext ? (
            <a href={rowData.log_file_url_ext} target="_blank" style={{ fontSize: '11px' }}>Logs mirror</a>
        ) : null
    }

    let rpLinkBodyTemplate = (rowData) => {
        const rpUrl = "https://rep-portal.wroclaw.nsn-rdnet.net/reports/test-runs/?columns=no,qc_test_set,test_case.name,hyperlink_set.test_logs_url,test_col.name,start,result,qc_test_instance.id,test_line,test_col.testline_type,builds,test_col.ute_version,qc_test_instance.organization,qc_test_instance.feature,fail_message&id=";
        const rpLink = rpUrl + rowData.rp_id;
        return (
            <a href={rpLink} style={{ fontSize: '11px' }} target="_blank"> {rowData.rp_id} </a>
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

    const handleGenerateRPUrl = () => {
        let rpUrl = "https://rep-portal.wroclaw.nsn-rdnet.net/reports/test-runs/?columns=no,qc_test_set,test_case.name,hyperlink_set.test_logs_url,test_col.name,start,result,qc_test_instance.id,test_line,test_col.testline_type,builds,test_col.ute_version,qc_test_instance.organization,qc_test_instance.feature,fail_message&id=";
        if (selectedTestRuns.length > 0) {
            for (let run of selectedTestRuns) {
                rpUrl += run.rp_id + ',';
            }
            navigator.clipboard.writeText(rpUrl.slice(0, -1))
            Notify.sendNotification(Infos.RP_URL_COPIED, AlertTypes.info);
            setSelectedTestRuns([]);
        } else {
            Notify.sendNotification(Warnings.RP_URL_No_RUN_SELECTED, AlertTypes.warn);
        }
    }

    const handleAnalizeTestRuns = () => {
        if (selectedTestRuns.length > 0) {
            handleFormShow();
        } else {
            Notify.sendNotification(Warnings.RP_URL_No_RUN_SELECTED, AlertTypes.warn);
        }
    }

    const header = (
        <div style={{ textAlign: 'left', alignContent: 'center', display: 'flex' }} className="flex flex-row">
            <div className='flex-grow-1 flex'>
                <MultiSelect value={selectedColumns} options={columns} maxSelectedLabels={8} display="chip" optionLabel="header" onChange={onColumnToggle} showSelectAll={true} style={{ width: '100%', marginRight: '2px' }}
                    placeholder="Select additional columns to show" />
            </div>
            <div className='flex-none flex'>
                <Button style={{ marginRight: '2px', marginLeft: '2px', fontWeight: 'bold' }} className="p-button-info p-button-sm" onClick={handleGenerateRPUrl}>
                    Generate RP URL
                </Button>
            </div>
            <div className='flex-none flex'>
                <Button style={{ marginRight: '2px', marginLeft: '2px', fontWeight: 'bold' }} className="p-button-help p-button-sm" onClick={handleAnalizeTestRuns}>
                    Analyze Test Runs As Env Issue
                </Button>
            </div>

        </div>

    );

    const defineSortFieldNameByField = (field) => {
        return field.replaceAll('.', '__');
    }

    const columnComponents = selectedColumns.map(col => {
        if (col.field === 'start_time') {
            return <Column key={col.field} body={startDateBodyTemplate} header={col.header} columnKey={col.field} sortField={col.field} sortable style={{ fontSize: '11px' }} />;
        } 
        else if (col.field === 'end_time') {
            return <Column key={col.field} body={endDateBodyTemplate} header={col.header} columnKey={col.field} sortField={col.field} sortable style={{ fontSize: '11px' }} />;
        } 
        else if (col.field === 'fail_message') {
            return <Column key={col.field} field={col.field} header={col.header} sortField={defineSortFieldNameByField(col.field)} sortable style={{ fontSize: '11px', minWidth: '450px' }} />;
        } 
        else if (col.field === 'airphone') {
            return <Column key={col.field} field={col.field} header={col.header} sortField={defineSortFieldNameByField(col.field)} sortable style={{ fontSize: '11px', minWidth: '50px' }} />;
        } 
        else if (col.field === 'log_file_url_ext') {
            return <Column key={col.field} body={logExtLinkBodyTemplate} columnKey={col.field} header={col.header} sortField={defineSortFieldNameByField(col.field)} style={{ fontSize: '11px', minWidth: '80px' }} />;
        } 
        else if (col.field === 'exec_trigger') {
            return <Column key={col.field} field={col.field} header={col.header} sortField={defineSortFieldNameByField(col.field)} sortable style={{ fontSize: '11px', minWidth: '80px' }} />;
        } 
        else {
            return <Column key={col.field} field={col.field} header={col.header} sortField={defineSortFieldNameByField(col.field)} sortable style={{ fontSize: '11px', minWidth: '150px' }} />;
        }
    });

    let refreshTestRunsFetching = () => {
        if (filterUrl === "" && filterUrl !== null) {
            fetchTestRunsByFilter("", currentPage, rowsPerPage);
        } else if (filterUrl !== "" && filterUrl !== null) {
            fetchTestRunsByFilter(filterUrl, 1, rowsPerPage);
        }
    }

    const handleFormCloseAndRefresh = () => {
        handleFormClose();
        refreshTestRunsFetching();
    }

    useEffect(
        () => {
            refreshTestRunsFetching();
        }, [filterUrl, sortField, sortOrder]
    )

    return (
        <>
            <DataTable value={testRuns} lazy paginator size="small" stripedRows
                rows={rowsPerPage} first={first} totalRecords={testRunsCount} onPage={(e) => onPageChange(e)}
                paginatorTemplate={templateCurrentPageReport} header={header} showGridlines
                dataKey="id" rowHover loading={loading}
                rowsPerPageOptions={[10, 30, 50, 100]}
                reorderableColumns={true}
                resizableColumns columnResizeMode="expand" 
                emptyMessage="No test runs found! Please change your selected filters."
                sortField={sortField} sortOrder={sortOrder} onSort={onSortColumn} removableSort 
                selection={selectedTestRuns} onSelectionChange={e => setSelectedTestRuns(e.value)}
                className="test-runs-table">

                <Column selectionMode="multiple" headerStyle={{ textAlign: 'center' }}></Column>
                <Column body={rpLinkBodyTemplate} columnKey="rp_id" header="RP id" sortField='rp_id' sortable style={{ fontSize: '11px', minWidth: '80px' }} />
                <Column field="test_instance.test_case_name" header="Test Case" sortField={defineSortFieldNameByField("test_instance.test_case_name")} sortable style={{ fontSize: '11px', minWidth: '200px', maxWidth: '400px' }} />
                <Column field="test_instance.test_set.branch" header="Branch" sortField={defineSortFieldNameByField("test_instance.test_set.branch")} sortable style={{ fontSize: '11px', minWidth: "80px" }} />
                <Column field="testline_type" header="Testline Type" sortable style={{ fontSize: '11px', minWidth: '170px' }} />
                <Column field="builds" header="Build" sortable style={{ fontSize: '11px', minWidth: '120px' }} />
                <Column body={resultBodyTemplate} columnKey="result" header="Result" sortField="result" sortable style={{ fontSize: '11px', minWidth: "145px" }} />
                <Column body={logLinkBodyTemplate} columnKey="log_file_url" header="Logs" style={{ fontSize: '11px', minWidth: '80px' }} />
                <Column field="fail_message" header="Fail message" style={{ fontSize: '11px', minWidth: "120px" }} />
                {columnComponents}
            </DataTable>

            <TestRunsAnalyzeModal selectedTestRuns={selectedTestRuns} showForm={showForm} handleFormClose={handleFormCloseAndRefresh} />
        </>
    )
}

export default TestRunTableComponent;