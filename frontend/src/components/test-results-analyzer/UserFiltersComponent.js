import { useState, useEffect, useRef } from 'react';
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

    let fetchTestFilters = () => {
        getTestFilters().then(
            (response) => {
                setTestFilters(response.data.results);
            },
            (error) => {
                console.log(error);
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

    let removeButton = (rowData) => {
        return (
            <Button icon="pi pi-times" className="p-button-sm" onClick={() => confirmRemove(rowData.id)} />
        );
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

    useEffect(() => {
        fetchTestFilters();
    }, [])

    return (
        <>
            <br />
            <Button size="sm" style={{ "marginLeft": '20px' }} className="p-button-color" onClick={handleFormShow}>Add Glogal Filter</Button>

            <DataTable value={testFilters} stripedRows responsiveLayout="scroll" size="small" className="table-style" editMode="row">
                <Column field="name" header="Name" sortable></Column>
                <Column field="test_set.name" header="Test Set Name" sortable></Column>
                <Column field="test_set.branch" header="Branch" sortable></Column>
                <Column field="testline_type" header="Test Line Type" sortable></Column>
                <Column body={removeButton} header="Remove" />

            </DataTable>

            <UserFilterAddModal showForm={showForm} handleFormClose={handleTestSetFormCloseAndRefresh} handleFormShow={handleFormShow} />
        </>
    )
}

export default UserFiltersComponent;