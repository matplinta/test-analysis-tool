// Description: File is responsible for managing test instances objects
// HISTORY
// --------------------------------------------------------------------------
//   Date                    Author                     Bug                 List of changes
//  --------------------------------------------------------------------------


import React, { useEffect, useState } from "react";
import { Link, useLocation } from 'react-router-dom';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dropdown } from 'primereact/dropdown';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { ToggleButton } from 'primereact/togglebutton';
import { TriStateCheckbox } from 'primereact/tristatecheckbox';
import { Card } from 'primereact/card';
import { BsStopwatch } from 'react-icons/bs';
import { GoSync } from 'react-icons/go';

import { MdPauseCircle, MdPlayCircle } from 'react-icons/md';
import { getTestInstancesByQuery, postSetSuspensionStatusOnTestInstances, triggerSyncTestInstancesSuspendData, postSyncSuspensionStatusFromRP } from './../../services/test-results-analyzer/test-instances.service';
import { getBranches, getTestLineTypes, getTestEntities } from './../../services/test-results-analyzer/test-filters.service';
import Notify, { Successes, AlertTypes, Errors } from '../../services/Notify.js';


import './TestInstanceComponent.css';

let TestInstancesComponent = () => {

    const [testInstances, setTestInstances] = useState([]);
    const [branches, setBranches] = useState([]);
    const [testEntities, setTestEntities] = useState([]);
    const [testLinesTypes, setTestLinesTypes] = useState([]);
    const [selectedTestInstances, setSelectedTestInstances] = useState([]);


    const [totalRecords, setTotalRecords] = useState(0);

    const [loading, setLoading] = useState(true);
    const [sendSuspendButtonState, setSendSuspendButtonState] = useState(false);
    const [showDialog, setShowDialog] = useState(false);
    const handleDialogClose = () => setShowDialog(false);
    const handleDialogShow = () => setShowDialog(true);

    const location = useLocation();
    const state = location.state;

    let [stateLoading, setStateLoading] = useState(false);

    const [lazyParams, setLazyParams] = useState({
        first: 1,
        rows: 30,
        page: 1,
        sortField: null,
        sortOrder: null,
        filters: {
            "rp_id__in": { value: null, matchMode: 'equal' },
            'test_case_name__icontains': { value: null, matchMode: 'contains' },
            'test_set__test_lab_path__icontains': { value: null, matchMode: 'contains' },
            'test_set__branch__name__icontains': { value: null, matchMode: 'contains' },
            'testline_type__name__icontains': { value: null, matchMode: 'contains' },
            'test_set__test_set_name__icontains': { value: null, matchMode: 'contains' },
            'last_passing_logs__utecloud_run_id': { value: null, matchMode: 'contains' },
            'organization__name__icontains': { value: null, matchMode: 'contains' },
            'execution_suspended': { value: null, matchMode: 'equal' },
            'no_run_in_rp': { value: null, matchMode: 'equal' },
            'test_entity': { value: null, matchMode: 'equal' },
            'pass_ratio': { value: null, matchMode: 'equal' }
        }
    });

    let runStates = [{ label: 'NO RUN', value: true }, { label: "RUN", value: false }];

    let fetchTestInstancesByFilter = (lazyParams) => {
        setLoading(true);
        getTestInstancesByQuery(lazyParams).then(
            (response) => {
                if (response.data.results.length > 0) {
                    setTotalRecords(response.data.count);
                    setTestInstances(response.data.results);
                    setLoading(false);
                    setStateLoading(false);
                } else {
                    setTestInstances([]);
                    setLoading(false);
                    setStateLoading(false);
                }
            },
            (error) => {
                Notify.sendNotification(Errors.FETCH_TEST_INSTANCES, AlertTypes.error);
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

    let fetchTestEntities = () => {
        getTestEntities().then(
            (response) => {
                if (response.data.length > 0) {
                    let testEntities = response.data
                    setTestEntities(testEntities);
                }
            },
            (error) => {
                Notify.sendNotification(Errors.GET_TEST_ENTITIES, AlertTypes.error);
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

    const onPage = (event) => {
        event['page'] = event['page'] + 1;
        setLazyParams(event);
    }

    const onSort = (event) => {
        event['first'] = 1;
        event['page'] = 1;
        setLazyParams(event);
    }

    const onFilter = (event) => {
        event['first'] = 1;
        event['page'] = 1;
        setLazyParams(event);
    }

    const templateCurrentPageReport = {
        layout: 'FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown',
        'CurrentPageReport': (options) => {
            return (
                <span style={{ color: 'var(--text-color)', userSelect: 'none' }}>
                    of {options.totalPages} pages ({options.first} - {options.last} of {options.totalRecords} rows)
                </span>
            )
        }
    };

    let rpLinkBodyTemplate = (rowData) => {
        const rpUrl = "https://rep-portal.wroclaw.nsn-rdnet.net/reports/qc/?columns=suspended,m_path,test_set.name,name,status,last_passed.timestamp,test_lvl_area%2Csw_build&id=";
        const rpLink = rpUrl + rowData.rp_id;
        return (
            <a href={rpLink} target="_blank" rel="noreferrer" style={{ fontSize: '11px' }}> {rowData.rp_id} </a>
        )
    }

    let logLinkBodyTemplate = (rowData) => {
        if (rowData.last_passing_logs !== null) {
            return (
                <a href={rowData.last_passing_logs.url} target="_blank" rel="noreferrer" style={{ fontSize: '11px' }}>
                    {rowData.last_passing_logs.utecloud_run_id}
                </a>
            )
        }
    }

    let testRunsBodyTemplate = (rowData) => {
        if (rowData.id !== null) {
            return (
                <Link to={`/test-runs-by-test-instance?test_instance=${rowData.id}`}>
                    <span className="block text-lg">Link</span>
                </Link>
            )
        }
    }

    let passRatioBodyTemplate = (rowData) => {
        if (rowData.pass_ratio === null){
            return <span style={{ color: 'grey', fontWeight: 'bold', fontSize: '16px' }}>No testruns</span>
        } else {
            return <span style={{ color: 'MediumSeaGreen', fontWeight: 'bold', fontSize: '16px' }}>{rowData.pass_ratio}%</span>
        }
    }

    let noRunInRpBodyTemplate = (rowData) => {
        if (rowData.no_run_in_rp)
            return <span style={{ color: 'red', fontWeight: 'bold', fontSize: '15px' }}>NO RUN</span>
        else
            return <span style={{ color: 'green', fontWeight: 'bold', fontSize: '15px' }}>RUN</span>
    }

    let suspendedBodyTemplate = (rowData) => {
        if (rowData.execution_suspended)
            return <MdPauseCircle size='35' style={{ color: 'red' }} />
        else
            return <MdPlayCircle size='35' style={{ color: 'green' }} />
    }

    const suspendedFilter = (options) => {
        return <TriStateCheckbox value={options.value} onChange={(e) => options.filterApplyCallback(e.value)} />
    }

    const runTemplate = (option) => {
        if (option.value) {
            return <div style={{ color: 'red', fontWeight: 'bold', fontSize: '15px' }}>{option.label}</div>
        }
        else {
            return <div style={{ color: 'green', fontWeight: 'bold', fontSize: '15px' }}>{option.label}</div>
        }
    }

    const noRunInRpFilter = (options) => {
        return <Dropdown showClear
            style={{ maxWidth: '200px' }} panelClassName="panel-style" itemTemplate={runTemplate}
            value={options.value} options={runStates} onChange={(e) => options.filterApplyCallback(e.value)} />
    }

    const testLineTypeFilter = (options) => {
        return <Dropdown showClear
            style={{ maxWidth: '200px' }} panelClassName="panel-style"
            value={options.value} options={testLinesTypes} onChange={(e) => options.filterApplyCallback(e.value)} />
    }

    const branchTypeFilter = (options) => {
        return <Dropdown showClear
            style={{ maxWidth: '120px', fontSize: '5px' }} panelClassName="panel-style"
            value={options.value} options={branches} onChange={(e) => options.filterApplyCallback(e.value)} />
    }

    const testEntityTypeFilter = (options) => {
        return <Dropdown showClear
            style={{ maxWidth: '120px', fontSize: '5px' }} panelClassName="panel-style"
            value={options.value} options={testEntities} onChange={(e) => options.filterApplyCallback(e.value)} />
    }

    let saveFiltersFromState = () => {
        if (state !== null) {
            setStateLoading(true);
            for (const [key, value] of Object.entries(state)) {
                lazyParams.filters[key].value = value;
            }
        }
    }

    const selectSelectedTestInstances = (selectedTestInstancesValue) => {
        setSelectedTestInstances(selectedTestInstancesValue);
    }

    const setSuspensionStatusForSelectedTIs = () => {
        let rp_ids = selectedTestInstances.map((testInstance) => testInstance.rp_id)
        postSetSuspensionStatusOnTestInstances(rp_ids, sendSuspendButtonState).then(
            (response) => {
                Notify.sendNotification(Successes.TEST_INSTANCES_SUSPEND_STATE_SET, AlertTypes.success);
                fetchTestInstancesByFilter(lazyParams);
                handleDialogClose();
            }, (error) => {
                Notify.sendNotification(Errors.TEST_INSTANCES_SUSPEND_STATE_SET, AlertTypes.error);
            }
        )
    }

    const syncSuspensionStatusFromSelectedTIs = () => {
        let rp_ids = selectedTestInstances.map((testInstance) => testInstance.rp_id)
        postSyncSuspensionStatusFromRP(rp_ids).then(
            (response) => {
                Notify.sendNotification(Successes.TEST_INSTANCES_SYNC_SUSPEND_STATE, AlertTypes.success);
                fetchTestInstancesByFilter(lazyParams);
            }, (error) => {
                Notify.sendNotification(Errors.TEST_INSTANCES_SYNC_SUSPEND_STATE, AlertTypes.error);
            }
        )
    }

    const footer = (
        <div className="flex flex-wrap justify-content-end gap-2 ">
            <Button label="Send" icon="pi pi-check" className="p-button-success" onClick={setSuspensionStatusForSelectedTIs} />
            <Button label="Cancel" icon="pi pi-times" className="p-button-outlined p-button-secondary" onClick={handleDialogClose} />
        </div>
    );

    useEffect(() => {
        fetchBranches();
        fetchTestLines();
        fetchTestEntities();
        saveFiltersFromState();
    }, [])

    useEffect(() => {
        setSelectedTestInstances([]);
    }, [testInstances])

    useEffect(() => {
        fetchTestInstancesByFilter(lazyParams);
    }, [lazyParams])

    return (
        <>  
            <Button style={{ margin: '5px', fontWeight: 'bold', letterSpacing: '0' }} className="p-button-warning p-button-sm"
                onClick={handleDialogShow} disabled={selectedTestInstances.length === 0}>
                <BsStopwatch size='20' />
                <span style={{ marginLeft: '5px' }}>Set suspension status</span>
            </Button>
            <Button style={{ margin: '5px', fontWeight: 'bold', letterSpacing: '0' }} className="p-button-success p-button-sm"
                onClick={syncSuspensionStatusFromSelectedTIs} disabled={selectedTestInstances.length === 0}>
                <GoSync size='20' />
                <span style={{ marginLeft: '5px' }}>Sync suspension status from RP</span>
            </Button>
            {stateLoading === false ?
                <DataTable value={testInstances} paginator size="small"
                    lazy first={lazyParams.first} rows={lazyParams.rows} totalRecords={totalRecords} onPage={onPage}
                    onSort={onSort} sortField={lazyParams.sortField} sortOrder={lazyParams.sortOrder} removableSort
                    onFilter={onFilter} filters={lazyParams.filters} filterDelay={800} loading={loading}
                    showGridlines stripedRows rowHover
                    paginatorTemplate={templateCurrentPageReport}
                    dataKey="id"
                    rowsPerPageOptions={[10, 30, 50, 100]}
                    resizableColumns columnResizeMode="fit"
                    responsiveLayout="scroll" scrollHeight="calc(100vh - 210px)"
                    emptyMessage="No test instances found!"
                    className="test-instances-table"
                    filterDisplay="row"
                    selectionMode="checkbox" selection={selectedTestInstances} onSelectionChange={e => selectSelectedTestInstances(e.value)}
                >
                    <Column selectionMode="multiple" headerStyle={{ width: '3em' }}></Column>

                    <Column body={rpLinkBodyTemplate} columnKey="rp_id" header="RP id"
                        sortable sortField="rp_id"
                        filterField="rp_id__in" filter
                        showFilterMenuOptions={false} showClearButton={false} showFilterMenu={false}
                        style={{ fontSize: '11px', width: '4%' }} />

                    <Column field="test_case_name" columnKey="test_case_name" header="Test Case"
                        sortable
                        filterField="test_case_name__icontains"
                        showFilterMenu={false} filter showFilterMenuOptions={false} showClearButton={false}
                        style={{ fontSize: '11px', width: '14%' }} />

                    <Column field="test_set.test_set_name" columnKey="test_set.test_set_name" header="Test Set"
                        sortable sortField="test_set__test_set_name"
                        filterField="test_set__test_set_name__icontains"
                        filter showFilterMenuOptions={false} showClearButton={false} showFilterMenu={false}
                        style={{ fontSize: '11px', width: '14%' }} />

                    <Column field="test_set.test_lab_path" columnKey="test_set.test_lab_path" header="Test Lab Path"
                        sortable sortField="test_set__test_lab_path"
                        filterField="test_set__test_lab_path__icontains"
                        filter showFilterMenuOptions={false} showClearButton={false} showFilterMenu={false}
                        style={{ fontSize: '11px', width: '13%' }} />

                    <Column field="testline_type" columnKey="testline_type" header="Testline Type"
                        sortable sortField="testline_type__name"
                        filterField="testline_type__name__icontains"
                        filter showFilterMenuOptions={false} showClearButton={false} showFilterMenu={false}
                        filterElement={testLineTypeFilter}
                        style={{ fontSize: '11px', width: '10%', maxWidth: '11%' }} />

                    <Column field="test_set.branch" header="Branch"
                        sortable sortField="test_set__branch__name"
                        filterField="test_set__branch__name__icontains"
                        filter showFilterMenuOptions={false} showClearButton={false} showFilterMenu={false}
                        filterElement={branchTypeFilter}
                        style={{ fontSize: '11px', textAlign: 'center', width: '5%' }} />

                    <Column field="test_entity" header="Test Entity"
                        sortable sortField="test_entity"
                        filterField="test_entity"
                        filter showFilterMenuOptions={false} showClearButton={false} showFilterMenu={false}
                        filterElement={testEntityTypeFilter}
                        style={{ fontSize: '11px', textAlign: 'center', width: '5%' }} />

                    <Column field="last_passing_logs.build" columnKey="last_passing_logs.build" header="Last passing gNB"
                        style={{ fontSize: '11px', width: '10%' }} />

                    <Column field="last_passing_logs.airphone" columnKey="last_passing_logs.airphone" header="Last passing AP"
                        style={{ fontSize: '11px', width: '4%' }} />

                    <Column body={logLinkBodyTemplate} columnKey="last_passing_logs.url" header="Last Passing Logs"
                        style={{ fontSize: '11px', textAlign: 'center', width: '6%' }} />

                    <Column body={testRunsBodyTemplate} columnKey="id" header="Test Runs"
                        showFilterMenuOptions={false} showClearButton={false} showFilterMenu={false}
                        style={{ fontSize: '11px', textAlign: 'center', width: '4%' }} />

                    <Column body={passRatioBodyTemplate} columnKey="pass_ratio" header="Pass ratio"
                        sortable sortField="pass_ratio"
                        showFilterMenuOptions={false} showClearButton={false} showFilterMenu={false}
                        style={{ fontSize: '11px', textAlign: 'center', width: '3%' }} />

                    <Column body={noRunInRpBodyTemplate} columnKey="no_run_in_rp" header="RUN in RP in FB"
                        sortable sortField="no_run_in_rp"
                        filterField="no_run_in_rp" filterElement={noRunInRpFilter}
                        filter filterType="boolean"
                        showFilterMenuOptions={false} showClearButton={false} showFilterMenu={false}
                        style={{ fontSize: '11px', textAlign: 'center', width: '6%' }} />

                    <Column body={suspendedBodyTemplate} columnKey="execution_suspended" header="Suspended"
                        sortable sortField="execution_suspended"
                        filterField="execution_suspended" filterElement={suspendedFilter}
                        filter filterType="boolean"
                        showFilterMenuOptions={false} showClearButton={false} showFilterMenu={false}
                        style={{ fontSize: '11px', textAlign: 'center', width: '6%' }} />
                </DataTable > : null}
                <Dialog header="Suspend/Unsuspend test instances" visible={showDialog} className="ti-suspend-dialog" onHide={handleDialogClose}>
                        <Card title={"Selected Test Instances: " + selectedTestInstances.length} footer={footer} className="md:w-25rem px-2">
                            <div className="flex flex-column px-3">
                                <div className="flex ">
                                    <div className="flex flex-row flex-wrap">
                                        {selectedTestInstances.map((ti) => <div className="align-items-center justify-content-center" key={ti.id}> {rpLinkBodyTemplate(ti)}<span style={{fontSize: '11px'}}>, </span></div>)}
                                    </div>
                                </div>
                                <div className="flex flex-row align-items-center justify-content-center flex-wrap mt-3">
                                    <div className="flex-1 flex">
                                        <span style={{fontSize: '20px'}}>Suspension status</span>
                                    </div>
                                    <div className="flex-1 flex justify-content-end ">
                                        <ToggleButton onLabel="Suspend" offLabel="Unsuspend" onIcon="pi pi-stop-circle" offIcon="pi pi-step-forward" 
                                            checked={sendSuspendButtonState} onChange={(e) => setSendSuspendButtonState(e.value)} className="mr-2" />
                                    </div>
                                </div>
                            </div>
                        </Card>
                </Dialog>
        </>
    )
}

export default TestInstancesComponent;