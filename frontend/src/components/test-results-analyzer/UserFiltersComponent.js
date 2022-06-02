import { useState, useEffect, useRef } from 'react';
import { FilterMatchMode, FilterOperator } from 'primereact/api';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Button } from 'primereact/button';
import { confirmDialog } from 'primereact/confirmdialog';
import { VscExpandAll } from 'react-icons/vsc';

import UserFilterAddModal from './UserFilterAddModal';

import { getTestFilters, deleteTestFilter } from '../../services/test-results-analyzer/test-filters.service';
import Notify, { AlertTypes, Successes, Errors } from '../../services/Notify.js';

import 'react-toastify/dist/ReactToastify.css';
import './UserFiltersComponent.css';

let UserFiltersComponent = ({ type }) => {

    const [testFilters, setTestFilters] = useState([]);

    const [showForm, setShowForm] = useState(false);
    const handleFormClose = () => setShowForm(false);
    const handleFormShow = () => setShowForm(true);

    const [filters, setFilters] = useState({
        'name': { value: null, matchMode: FilterMatchMode.CONTAINS },
        'test_set_name': { value: null, matchMode: FilterMatchMode.CONTAINS },
        'branch': { value: null, matchMode: FilterMatchMode.CONTAINS },
        'description': { value: null, matchMode: FilterMatchMode.CONTAINS },
        'testline_type': { value: null, matchMode: FilterMatchMode.CONTAINS },
        'owners': { value: null, matchMode: FilterMatchMode.CONTAINS },
        'subscribers': { value: null, matchMode: FilterMatchMode.CONTAINS }
    })

    const [loading, setLoading] = useState(true);

    let fetchTestFilters = () => {
        setLoading(true);
        getTestFilters(type).then(
            (response) => {

                let parsedTestFilters = response.data.results.map((filter) => {
                    return {
                        "id": filter.id,
                        "name": filter.name,
                        "test_set_id": filter.test_set.id,
                        "test_set_name": filter.test_set.name,
                        "branch": filter.test_set.branch,
                        "test_lab_path": filter.test_set.test_lab_path,
                        "testline_type": filter.testline_type,
                        "owners": filter.owners.map(owner => owner.username).join(', '),
                        "subscribers": filter.subscribers.map(subscriber => subscriber.username).join(', '),
                        "description": filter.description,
                        "fail_message_type_groups": filter.fail_message_type_groups
                    }
                })
                setTestFilters(parsedTestFilters);
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

    let click = (id) => {
        console.log("klik" + id)
    }

    const failMessageGroupsBody = (rowData) => {
        // let groups = "";
        // for (let group of rowData.fail_message_type_groups) {
        //     groups += <span>group.name</span>;
        // }
        // return <span>{groups}</span>
        return <ul style={{ listStyleType: 'none' }}>{rowData.fail_message_type_groups.map(group => <li key={group.id}><VscExpandAll size='20' onClick={() => click(group.id)} />{group.name}</li>)}</ul>
    }

    useEffect(() => {
        fetchTestFilters();
    }, [type])

    return (
        <>
            <Button style={{ marginLeft: '5px', marginTop: '5px', fontWeight: 'bold' }} className="p-button-primary p-button-color p-button-sm" onClick={handleFormShow}>Add Regression Filter</Button>

            <DataTable value={testFilters} stripedRows responsiveLayout="scroll" size="small" className="table-style" editMode="row"
                showGridlines dataKey="id"
                filters={filters} filterDisplay="row" loading={loading}
                emptyMessage="No fail message types found."
                scrollHeight="calc(100vh - 220px)"
                resizableColumns columnResizeMode="fit">
                <Column field="name" header="Name" sortable filter filterPlaceholder="Search by name" style={{ width: '10%' }}></Column>
                <Column field="test_set_name" header="Test Set Name" sortable filter filterPlaceholder="Search by test set name" style={{ width: '23%' }}></Column>
                <Column field="branch" header="Branch" sortable filter filterPlaceholder="Search by branch" style={{ width: '8%' }}></Column>
                <Column field="testline_type" header="Test Line Type" sortable filter filterPlaceholder="Search by test line type" style={{ width: '20%' }}></Column>
                <Column field="owners" header="Owners" filter filterPlaceholder="Search by owner" style={{ width: '13%' }} />
                <Column field="subscribers" header="Subscribers" filter filterPlaceholder="Search by subscriber" style={{ width: '13%' }} />
                <Column field="description" header="Description" sortable filter filterPlaceholder="Search by description" style={{ width: '15%' }}></Column>
                <Column body={failMessageGroupsBody} header="Fail Message Groups" style={{ width: '15%' }}></Column>
                <Column body={removeButton} header="Remove" style={{ display: type === "owned" ? ' ' : 'none' }} />

            </DataTable>

            <UserFilterAddModal showForm={showForm} handleFormClose={handleTestSetFormCloseAndRefresh} handleFormShow={handleFormShow} />
        </>
    )
}

export default UserFiltersComponent;