// Description: File is responsible for managing view to perform Branch off procedure
// HISTORY
// --------------------------------------------------------------------------
//   Date                    Author                     Bug                 List of changes
//  --------------------------------------------------------------------------

import { useState, useEffect } from 'react';
import { FilterMatchMode } from 'primereact/api';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { RiGitBranchFill } from 'react-icons/ri';

import { getTestSetFiltersBranched, getBranches } from './../../services/test-results-analyzer/test-filters.service';
import Notify, { AlertTypes, Errors } from '../../services/Notify.js';
import BranchOffModal from './BranchOffModal';

const BranchOffComponent = () => {

    const [testFilters, setTestSetFilters] = useState([]);
    const [selectedTestFilters, setSelectedTestFilters] = useState([]);

    const [branches, setBranches] = useState([]);
    const [selectedBranch, setSelectedBranch] = useState(null);

    const [showForm, setShowForm] = useState(false);
    const handleFormClose = () => setShowForm(false);
    const handleFormShow = () => setShowForm(true);

    const [filters] = useState({
        'test_set_name': { value: null, matchMode: FilterMatchMode.CONTAINS },
        'test_lab_path': { value: null, matchMode: FilterMatchMode.CONTAINS },
        'branch': { value: null, matchMode: FilterMatchMode.CONTAINS },
        'description': { value: null, matchMode: FilterMatchMode.CONTAINS },
        'testline_type': { value: null, matchMode: FilterMatchMode.CONTAINS },
        'owners': { value: null, matchMode: FilterMatchMode.CONTAINS },
        'subscribers': { value: null, matchMode: FilterMatchMode.CONTAINS }
    })

    const [loading, setLoading] = useState(true);

    let fetchBranches = () => {
        getBranches().then(
            (response) => {
                console.log(response)
                let branchesTmp = response.data.filter(branch => branch.name !== 'Trunk' && branch.name !== '')
                let branchesParsed = branchesTmp.map(branch => ({ "name": branch.name, "value": branch.name }))
                setBranches(branchesParsed);
            },
            (error) => {
                Notify.sendNotification(Errors.GET_BRANCHES, AlertTypes.error);
            }
        )
    }

    let fetchTestSetFiltersBranched = (branch) => {
        setLoading(true);
        getTestSetFiltersBranched(branch).then(
            (response) => {
                console.log(response)
                let parsedTestSetFilters = response.data.map((filter) => {
                    return {
                        "id": filter.id,
                        "test_set_name": filter.test_set_name,
                        "test_lab_path": filter.test_lab_path,
                        "branch": filter.branch,
                        "testline_type": filter.testline_type,
                        "owners": filter.owners.map(owner => owner.username).join(', '),
                        "subscribers": filter.subscribers.map(subscriber => subscriber.username).join(', '),
                        "description": filter.description,
                        "fail_message_type_groups": filter.fail_message_type_groups
                    }
                })
                setTestSetFilters(parsedTestSetFilters);
                setLoading(false);
            },
            (error) => {
                console.log(error);
                setLoading(false);
            }
        )
    }

    const selectSelectedTestFilters = (selectedTestFiltersValue) => {
        setSelectedTestFilters(selectedTestFiltersValue);
    }

    const onBranchChange = (e) => {
        setSelectedBranch(e.value)
        fetchTestSetFiltersBranched(e.value);
        setSelectedTestFilters([]);
    }

    const makeBranchOff = () => {
        handleFormShow();
    }

    const handleBranchOffFormClose = () => {
        handleFormClose();
        fetchTestSetFiltersBranched(selectedBranch);
    }

    useEffect(() => {
        fetchBranches();
    }, [])

    return (
        <>
            <Dropdown value={selectedBranch} options={branches} onChange={onBranchChange} optionLabel="name" optionValue="value"
                placeholder="Select old Branch" style={{ marginLeft: "5px", marginTop: "5px" }} />

            {(selectedBranch !== null && selectedTestFilters.length !== 0) ?
                < Button style={{ marginLeft: '5px', fontWeight: 'bold', height: '46px', marginBottom: '3px' }}
                    className="p-button-success  p-button-sm" onClick={makeBranchOff}>
                    <RiGitBranchFill size='20' />  Perform Branch Off
                </Button>
                :
                < Button style={{ marginLeft: '5px', fontWeight: 'bold', height: '46px', marginBottom: '3px' }}
                    className="p-button-success  p-button-sm" onClick={makeBranchOff} disabled>
                    <RiGitBranchFill size='20' />  Perform Branch Off
                </Button>
            }

            {selectedBranch !== null ?
                <>
                    <p style={{ fontWeight: 'bold', marginLeft: '7px', marginTop: '12px', marginBottom: '4px' }}>
                        Select Test Set Filters for Branch Off and next click above button Perform Branch Off:
                    </p>
                    <DataTable value={testFilters} stripedRows responsiveLayout="scroll" size="small" className="table-style" editMode="row"
                        showGridlines dataKey="id"
                        filters={filters} filterDisplay="row" loading={loading}
                        emptyMessage="No fail message types found."
                        scrollHeight="calc(100vh - 190px)"
                        resizableColumns columnResizeMode="fit"
                        selectionMode="checkbox" selection={selectedTestFilters} onSelectionChange={e => selectSelectedTestFilters(e.value)}>
                        <Column selectionMode="multiple" headerStyle={{ width: '3em' }}></Column>
                        <Column field="test_set_name" header="Test Set Name" sortable filter filterPlaceholder="Search by test set name"></Column>
                        <Column field="test_lab_path" header="Test Lab Path" sortable filter filterPlaceholder="Search by test lab path"></Column>
                        <Column field="branch" header="Branch" sortable filter filterPlaceholder="Search by branch" ></Column>
                        <Column field="testline_type" header="Testline Type" sortable filter filterPlaceholder="Search by testline type" ></Column>
                        <Column field="owners" header="Owners" filter filterPlaceholder="Search by owner" />
                        <Column field="subscribers" header="Subscribers" filter filterPlaceholder="Search by subscriber" />
                        <Column field="description" header="Description" sortable filter filterPlaceholder="Search by description"></Column>
                    </DataTable>
                </>
                : null
            }

            <BranchOffModal selectedTestSetFilters={selectedTestFilters} showForm={showForm} handleFormClose={handleBranchOffFormClose} oldBranch={selectedBranch} />
        </>
    )
}

export default BranchOffComponent;