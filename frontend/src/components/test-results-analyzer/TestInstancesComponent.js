// Description: File is responsible for managing test instances objects
// HISTORY
// --------------------------------------------------------------------------
//   Date                    Author                     Bug                 List of changes
//  --------------------------------------------------------------------------


import React, { useEffect, useState } from "react";
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { TriStateCheckbox } from 'primereact/tristatecheckbox';
import { AiOutlineClose } from 'react-icons/ai';
import { GiCheckMark } from 'react-icons/gi';
import { MdBlock } from 'react-icons/md';
import { VscDebugStart } from 'react-icons/vsc';
import { FilterMatchMode, FilterOperator } from 'primereact/api';

import { getTestInstancesByQuery } from './../../services/test-results-analyzer/test-instances.service';
import { getBranches, getTestLineTypes } from './../../services/test-results-analyzer/test-filters.service';
import Notify, { AlertTypes, Successes, Errors, Warnings } from '../../services/Notify.js';


import './TestInstanceComponent.css';

let TestInstancesComponent = () => {

    const [testInstances, setTestInstances] = useState([]);
    const [branches, setBranches] = useState([]);
    const [testLinesTypes, setTestLinesTypes] = useState([]);

    const [loading, setLoading] = useState(true);

    const [first, setFirst] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [testInstancesCount, setTestInstancesCount] = useState(null);
    const [pagesCount, setPagesCount] = useState(null);
    const [rowsPerPage, setRowsPerPage] = useState(30);

    const [sortField, setSortField] = useState();
    const [sortOrder, setSortOrder] = useState();

    const [filterUrl, setFilterUrl] = useState("");

    const [pageInputTooltip, setPageInputTooltip] = useState('Press \'Enter\' key to go to this page.');

    // let [filters, setFilters] = useState({
    //     "rp_id": { constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
    //     "test_set__test_set_name": { constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
    //     "test_set__test_lab_path": { constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
    //     "test_set__branch__name": { value: null, matchMode: FilterMatchMode.CONTAINS },
    //     "test_set__testline_type__name": { constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
    //     'test_case_name': { constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
    //     "organization__name": { constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
    //     "execution_suspended": { constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }] },
    //     "no_run_in_rp": { constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }] }
    // })

    let [filters, setFilters] = useState({
        "rp_id": { value: null, matchMode: FilterMatchMode.CONTAINS },
        'test_set__test_set_name': { value: null, matchMode: FilterMatchMode.CONTAINS },
        'test_set__test_lab_path': { value: null, matchMode: FilterMatchMode.CONTAINS },
        'test_set.branch': { value: null, matchMode: FilterMatchMode.CONTAINS },
        'test_set__testline_type__name': { value: null, matchMode: FilterMatchMode.CONTAINS },
        'test_case_name': { value: null, matchMode: FilterMatchMode.CONTAINS },
        'organization__name': { value: null, matchMode: FilterMatchMode.CONTAINS },
        'execution_suspended': { value: null, matchMode: FilterMatchMode.EQUALS },
        'no_run_in_rp': { value: null, matchMode: FilterMatchMode.EQUALS }
    })

    let trueFalseStatuses = [
        { label: 'True', value: true },
        { label: 'False', value: false }
    ];

    let fetchTestInstancesByFilter = (filter, page, pageSize) => {
        setLoading(true);
        getTestInstancesByQuery(filter, page, pageSize).then(
            (response) => {
                if (response.data.results.length > 0) {
                    setTestInstances(response.data.results);
                    setTestInstancesCount(response.data.count);
                    setPagesCount(Math.round(response.data.count / rowsPerPage));
                    setCurrentPage(page);
                    setLoading(false);
                } else {
                    setTestInstances([]);
                    setTestInstancesCount(0);
                    setPagesCount(1);
                    setLoading(false);
                }
            },
            (error) => {
                console.log("Error during fetching test instances")
            }
        )
    }

    let fetchBranches = () => {
        getBranches().then(
            (response) => {
                if (response.data.length > 0) {
                    let branches = response.data.filter(branch => branch.name !== '');
                    let branchesParsed = branches.map(item => item.name);
                    setBranches(branchesParsed);
                }
            },
            (error) => {
                Notify.sendNotification(Errors.GET_BRANCHES, AlertTypes.error);
            }
        )
    }

    let fetchTestLines = () => {
        getTestLineTypes().then(
            (response) => {
                if (response.data.length > 0) {
                    const testLinesTypesValue = response.data.map(item => item.name);
                    setTestLinesTypes(testLinesTypesValue);
                }
            },
            (error) => {
                Notify.sendNotification(Errors.FETCH_TEST_LINES_LIST, AlertTypes.error);
            })
    }

    const onPageInputChange = (event) => {
        setCurrentPage(event.target.value);
    }

    let onPageChange = (event) => {
        setFirst(event.first);
        setCurrentPage(event.page);
        fetchTestInstancesByFilter(filterUrl, event.page + 1, rowsPerPage);
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
                setCurrentPage(page);
                fetchTestInstancesByFilter(filterUrl, page, rowsPerPage);
            }
        }
    }

    const onPagesPerRowChange = (e) => {
        setRowsPerPage(e.value);
        fetchTestInstancesByFilter(filterUrl, 1, e.value, rowsPerPage);
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

    let rpLinkBodyTemplate = (rowData) => {
        const rpUrl = "https://rep-portal.wroclaw.nsn-rdnet.net/reports/qc/?columns=suspended&m_path&test_set.name&name&status&last_passed.timestamp&test_lvl_area%2Csw_build&id=";
        const rpLink = rpUrl + rowData.rp_id;
        return (
            <a href={rpLink} style={{ fontSize: '11px' }}> {rowData.rp_id} </a>
        )
    }

    let logLinkBodyTemplate = (rowData) => {
        return (
            <a href={rowData} style={{ fontSize: '11px' }}>Logs</a>
        )
    }

    let noRunInRpBodyTemplate = (rowData) => {
        if (!rowData.no_run_in_rp)
            return <AiOutlineClose size='25' style={{ color: 'red' }} />
        else
            return <GiCheckMark size='25' style={{ color: 'green' }} />
    }

    let suspendedBodyTemplate = (rowData) => {
        if (rowData.execution_suspended)
            return <MdBlock size='25' style={{ color: 'red' }} />
        else
            return <VscDebugStart size='25' style={{ color: 'green' }} />
    }

    let refreshTestInstancesFetching = () => {
        if (filterUrl === "" && filterUrl !== null) {
            fetchTestInstancesByFilter("", currentPage, rowsPerPage);
        } else if (filterUrl !== "" && filterUrl !== null) {
            fetchTestInstancesByFilter(filterUrl, 1, rowsPerPage);
        }
    }

    const onStatusChange = (e, options) => {
        options.value = e.value;
        console.log("zmiana", e, options)
        // options.filterApplyCallback(e.value);
        // console.log(filters)
        // customFunction(e);
    }

    const customFunction = (value, filter) => {
        console.log("!!!!!!!!!!!!11")
        console.log(value, filter)
        console.log(filters)
    }


    const suspendedFilter = (options) => {
        return <Dropdown className="p-column-filter" placeholder="Any"
            value={options.value} options={trueFalseStatuses} onChange={(e) => onStatusChange(e, options)} />
    }

    const noRunInRpFilter = (options) => {
        return <Dropdown className="p-column-filter" placeholder="Any"
            value={options.value} options={trueFalseStatuses} onChange={(e) => onStatusChange(e, options)} />
    }

    const testLineTypeFilter = (options) => {
        return <Dropdown className="p-column-filter" placeholder="Any"
            value={options.value} options={testLinesTypes} onChange={(e) => onStatusChange(e, options)} />

    }

    const branchTypeFilter = (options) => {
        console.log(options)
        return <Dropdown className="p-column-filter" placeholder="Any"
            value={filters[options.field].value} options={branches} onChange={(e) => onStatusChange(e, options)} showClear />
    }

    useEffect(() => {
        fetchBranches();
        fetchTestLines();
        fetchTestInstancesByFilter(filterUrl, 1, rowsPerPage);
    }, [filterUrl, sortField, sortOrder])

    return (
        <>
            <DataTable value={testInstances} paginator size="small"
                showGridlines stripedRows rowHover responsiveLayout="scroll"
                pageCount={pagesCount} rows={rowsPerPage} first={first} totalRecords={testInstancesCount}
                onPage={(e) => onPageChange(e)}
                paginatorTemplate={templateCurrentPageReport}
                dataKey="id" loading={loading}
                rowsPerPageOptions={[10, 30, 50, 100]}
                scrollHeight="calc(100vh - 155px)"
                emptyMessage="No test instances found!"
                className="test-instances-table"
                // columnResizeMode="expand"
                columnResizeMode="fit" resizableColumns
                filters={filters} filterDisplay="menu"
            >

                <Column body={rpLinkBodyTemplate} columnKey="rp_id" header="RP id"
                    filterField="rp_id"
                    showFilterMenu={true} filter showFilterMenuOptions={false}
                    // onFilterApplyClick={customFunction}
                    style={{ fontSize: '11px' }} />

                <Column field="test_case_name" columnKey="test_case_name" header="Test Case"
                    sortField='rp_id' sortable
                    filterField="test_case_name"
                    showFilterMenu={true} filter showFilterMenuOptions={false}
                    // onFilterApplyClick={customFunction}
                    style={{ fontSize: '11px' }} />

                <Column field="test_set.test_set_name" columnKey="test_set.test_set_name" header="Test Set"
                    sortField='test_set.test_set_name' sortable
                    filterField="test_set__test_set_name"
                    showFilterMenu={true} filter showFilterMenuOptions={false}
                    // onFilterApplyClick={customFunction}
                    style={{ fontSize: '11px' }} />

                <Column field="test_set.testline_type" columnKey="test_set.testline_type" header="Testline Type"
                    sortField="test_set.testline_type" sortable
                    filterField="test_set__testline_type__name"
                    showFilterMenu={true} filter showFilterMenuOptions={false} filterElement={testLineTypeFilter}
                    // onFilterApplyClick={customFunction}
                    style={{ fontSize: '11px', minWidth: '200px' }} />

                <Column field="test_set.branch" header="Branch"
                    // sortField="test_set.branch" sortable
                    // filterField="test_set__branch__name"
                    // showFilterMenu={true} 
                    filter
                    // showFilterMenuOptions={false} 
                    filterElement={branchTypeFilter}
                    // onFilterApplyClick={customFunction}
                    style={{ fontSize: '11px', textAlign: 'center' }} />

                <Column field="test_set.test_lab_path" columnKey="test_set.test_lab_path" header="Test Lab Path"
                    sortField='test_set.test_lab_path' sortable
                    filterField="test_set__test_lab_path"
                    showFilterMenu={true} filter showFilterMenuOptions={false}
                    // onFilterApplyClick={customFunction}
                    style={{ fontSize: '11px' }} />

                <Column field="last_passing_logs.build" columnKey="last_passing_logs.build" header="Passed gNB"
                    sortField='last_passing_logs.build' sortable
                    filterField="last_passing_logs__build"
                    showFilterMenu={true} filter showFilterMenuOptions={false}
                    // onFilterApplyClick={customFunction}
                    style={{ fontSize: '11px' }} />

                <Column field="last_passing_logs.airphone" columnKey="last_passing_logs.airphone" header="Passed AP"
                    sortField='last_passing_logs.airphone' sortable
                    filterField="last_passing_logs__airphone"
                    showFilterMenu={true} filter showFilterMenuOptions={false}
                    // onFilterApplyClick={customFunction}
                    style={{ fontSize: '11px' }} />

                <Column body={logLinkBodyTemplate} columnKey="last_passing_logs.url" header="Passed"
                    style={{ fontSize: '11px', textAlign: 'center' }} />

                <Column body={noRunInRpBodyTemplate} columnKey="no_run_in_rp" header="No run in RP"
                    filterField="no_run_in_rp" filterElement={noRunInRpFilter}
                    filterType="boolian"
                    showFilterMenu={true} filter showFilterMenuOptions={false}
                    // onFilterApplyClick={customFunction}
                    style={{ fontSize: '11px', textAlign: 'center' }} />

                <Column body={suspendedBodyTemplate} columnKey="execution_suspended" header="Suspended"
                    filterField="execution_suspended" filterElement={suspendedFilter}
                    showFilterMenu={true} filter showFilterMenuOptions={false}
                    // onFilterApplyClick={customFunction}
                    filterType="boolian"
                    style={{ fontSize: '11px', textAlign: 'center' }} />
            </DataTable >
        </>
    )
}

export default TestInstancesComponent;