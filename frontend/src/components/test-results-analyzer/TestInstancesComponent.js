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
import { AiOutlineClose } from 'react-icons/ai';
import { GiCheckMark } from 'react-icons/gi';
import { MdBlock } from 'react-icons/md';
import { VscDebugStart } from 'react-icons/vsc';

import { getTestInstancesByQuery } from './../../services/test-results-analyzer/test-instances.service';

import './TestInstanceComponent.css';

let TestInstancesComponent = () => {

    const [testInstances, setTestInstances] = useState([]);

    const [loading, setLoading] = useState(true);

    const [first, setFirst] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [testInstancesCount, setTestInstancesCount] = useState(null);
    const [pagesCount, setPagesCount] = useState(null);
    const [rowsPerPage, setRowsPerPage] = useState(30);

    const [sortField, setSortField] = useState();
    const [sortOrder, setSortOrder] = useState();

    const [filterUrl, setFilterUrl] = useState();

    const [pageInputTooltip, setPageInputTooltip] = useState('Press \'Enter\' key to go to this page.');

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
        if (!rowData)
            return <AiOutlineClose size='25' style={{ color: 'red' }} />
        else
            return <GiCheckMark size='25' style={{ color: 'green' }} />
    }

    let suspendedBodyTemplate = (rowData) => {
        if (!rowData)
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

    useEffect(() => {
        refreshTestInstancesFetching();
    }, [filterUrl, sortField, sortOrder])

    return (
        <DataTable value={testInstances} lazy paginator size="small" stripedRows
            pageCount={pagesCount} rows={rowsPerPage} first={first} totalRecords={testInstancesCount} onPage={(e) => onPageChange(e)}
            paginatorTemplate={templateCurrentPageReport} showGridlines
            dataKey="id" rowHover loading={loading}
            rowsPerPageOptions={[10, 30, 50, 100]}
            reorderableColumns={true}
            resizableColumns columnResizeMode="expand"
            scrollHeight="calc(100vh - 150px)"
            emptyMessage="No test instances found!"
            className="test-instances-table">

            <Column body={rpLinkBodyTemplate} columnKey="rp_id" header="RP id" sortField='rp_id' sortable style={{ fontSize: '11px', minWidth: '80px' }} />
            <Column field="test_case_name" header="Test Case" style={{ fontSize: '11px', minWidth: '230px' }} />
            <Column field="test_set.test_set_name" header="Test Case" sortable style={{ fontSize: '11px', minWidth: '200px' }} />
            <Column field="test_set.testline_type" header="Testline Type" sortable style={{ fontSize: '11px', minWidth: '200px' }} />
            <Column field="test_set.branch" header="Branch" sortable style={{ fontSize: '11px' }} />
            <Column field="test_set.test_lab_path" header="Test Lab Path" sortable style={{ fontSize: '11px', minWidth: '230px' }} />
            <Column field="last_passing_logs.build" header="Passed gNB" style={{ fontSize: '11px', minWidth: '120px' }} />
            <Column field="last_passing_logs.airphone" header="Passed AP" style={{ fontSize: '11px', minWidth: '80px' }} />
            <Column body={logLinkBodyTemplate} columnKey="last_passing_logs.url" header="Passed" style={{ fontSize: '11px', textAlign: 'center' }} />
            <Column body={noRunInRpBodyTemplate} columnKey="no_run_in_rp" header="Done in RP" style={{ fontSize: '11px', textAlign: 'center' }} />
            <Column body={suspendedBodyTemplate} columnKey="execution_suspended" header="Suspended" style={{ fontSize: '11px', textAlign: 'center' }} />
        </DataTable>
    )
}

export default TestInstancesComponent;