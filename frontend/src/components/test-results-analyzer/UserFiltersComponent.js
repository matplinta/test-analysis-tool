import { useState, useEffect, useRef } from 'react';
import { FilterMatchMode, FilterOperator } from 'primereact/api';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Button } from 'primereact/button';
import { confirmDialog } from 'primereact/confirmdialog';

import UserFilterAddModal from './UserFilterAddModal';

import { getTestFilters, deleteTestFilter } from '../../services/test-results-analyzer/test-filters.service';
import Notify, { AlertTypes, Successes, Errors } from '../../services/Notify.js';

import 'react-toastify/dist/ReactToastify.css';
import './UserFiltersComponent.css';

let UserFiltersComponent = () => {

    const [testFilters, setTestFilters] = useState([]);

    const [showForm, setShowForm] = useState(false);
    const handleFormClose = () => setShowForm(false);
    const handleFormShow = () => setShowForm(true);

    const [filters, setFilters] = useState({
        'name': { value: null, matchMode: FilterMatchMode.CONTAINS },
        'test_set.name': { value: null, matchMode: FilterMatchMode.CONTAINS },
        'test_set.branch': { value: null, matchMode: FilterMatchMode.CONTAINS },
        'description': { value: null, matchMode: FilterMatchMode.CONTAINS },
        'testline_type': { value: null, matchMode: FilterMatchMode.CONTAINS },
        // 'owners': { value: null, matchMode: FilterMatchMode.CONTAINS }
    })

    const [loading, setLoading] = useState(true);


    let fetchTestFilters = () => {
        getTestFilters().then(
            (response) => {
                setTestFilters(response.data.results);
                setLoading(false);
            },
            (error) => {
                console.log(error);
                setLoading(false);
            }
        )
    }

    let removeUserFilter = (id) => {
        deleteTestFilter(id).then(
            (response) => {
                let testFiltersList = testFilters.map(testFilter => testFilter.id !== id)
                setTestFilters(testFiltersList);
                fetchTestFilters();
                Notify.sendNotification(Successes.REMOVE_GLOBAL_FILTER_SUCCESS, AlertTypes.success);

            },
            (error) => {
                Notify.sendNotification(Errors.REMOVE_GLOBAL_FILTER_ERROR, AlertTypes.error);
            })
    }

    const confirmRemove = (id) => {
        confirmDialog({
            message: 'Are you sure you want to remove test filter?',
            header: 'Confirmation',
            icon: 'pi pi-exclamation-triangle',
            accept: () => removeUserFilter(id)
        });
    };

    let handleTestSetFormCloseAndRefresh = () => {
        handleFormClose();
        fetchTestFilters();
        Notify.sendNotification(Successes.ADD_GLOBAL_FILTER_SUCCESS, AlertTypes.success);
    }

    let removeButton = (rowData) => {
        return (
            <Button icon="pi pi-times" className="p-button-primary p-button-sm" style={{ height: '30px', width: '30px' }} onClick={() => confirmRemove(rowData.id)} />
        );
    }

    const ownersListBody = (rowData) => {
        let owners = "";
        for (let owner of rowData.owners) {
            owners += owner.username + ', ';
        }
        return <span>{owners.slice(0, -2)}</span>
    }

    useEffect(() => {
        fetchTestFilters();
    }, [])

    return (
        <>
            <Button style={{ marginLeft: '5px', marginTop: '5px', fontWeight: 'bold' }} className="p-button-primary p-button-color p-button-sm" onClick={handleFormShow}>Add Glogal Filter</Button>

            <DataTable value={testFilters} stripedRows responsiveLayout="scroll" size="small" className="table-style" editMode="row"
                showGridlines dataKey="id"
                filters={filters} filterDisplay="row" loading={loading}
                emptyMessage="No fail message types found."
                scrollHeight="calc(100vh - 220px)"
                resizableColumns columnResizeMode="fit">
                <Column field="name" header="Name" sortable filter filterPlaceholder="Search by name" style={{ width: '15%' }}></Column>
                <Column field="test_set.name" header="Test Set Name" sortable filter filterPlaceholder="Search by test set name" style={{ width: '30%' }}></Column>
                <Column field="test_set.branch" header="Branch" sortable filter filterPlaceholder="Search by branch" style={{ width: '15%' }}></Column>
                <Column field="testline_type" header="Test Line Type" sortable filter filterPlaceholder="Search by test line type" style={{ width: '20%' }}></Column>
                <Column body={ownersListBody} header="Owners" style={{ width: '15%' }} />
                <Column body={removeButton} header="Remove" style={{ width: '5%' }} />

            </DataTable>

            <UserFilterAddModal showForm={showForm} handleFormClose={handleTestSetFormCloseAndRefresh} handleFormShow={handleFormShow} />
        </>
    )
}

export default UserFiltersComponent;