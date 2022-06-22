import { useState, useEffect, useRef } from 'react';
import { FilterMatchMode, FilterOperator } from 'primereact/api';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Button } from 'primereact/button';
import { confirmDialog } from 'primereact/confirmdialog';
import { VscExpandAll } from 'react-icons/vsc';
import { BiBell, BiBellOff, BiTrash } from 'react-icons/bi';
import { FiSettings } from 'react-icons/fi';

import UserFilterAddModal from './UserFilterAddModal';

import { getTestFilters, deleteTestFilter, getTestFilter, putTestFilter } from '../../services/test-results-analyzer/test-filters.service';
import Notify, { AlertTypes, Successes, Errors } from '../../services/Notify.js';
import AuthService from './../../services/auth.service.js';

import 'react-toastify/dist/ReactToastify.css';
import './UserFiltersComponent.css';

let UserFiltersComponent = ({ type }) => {

    const [testFilters, setTestFilters] = useState([]);

    const [filterIdToEdit, setFilterIdToEdit] = useState(null);

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
                // setTestFilters(testFiltersList);
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
            <Button className="p-button-primary p-button-sm" style={{ padding: '8px', height: '35px' }} onClick={() => confirmRemove(rowData.id)} >
                <BiTrash size='20' />
            </Button>
        );
    }

    const editFilter = (id) => {
        console.log(id)
        setFilterIdToEdit(id);
        handleFormShow();
    }

    const addFilter = () => {
        setFilterIdToEdit(null);
        handleFormShow();
    }

    let editButton = (rowData) => {
        return (
            <Button className="p-button-primary p-button-sm" style={{ padding: '8px', height: '35px' }} onClick={() => editFilter(rowData.id)} >
                <FiSettings size='20' />
            </Button>
        );
    }

    const subscribeFilter = (rowData) => {
        let filterToSubscribe = null;
        getTestFilter(rowData.id).then(
            (response) => {
                filterToSubscribe = response.data;

                filterToSubscribe.subscribers.push({
                    "username": AuthService.getCurrentUser().username
                })

                console.log(filterToSubscribe)

            }, (error) => {
                console.log("Error during editing")
            }
        )

    }

    const unsubscribeFilter = (rowData) => {
        let filterToSubscribe = null;
        getTestFilter(rowData.id).then(
            (response) => {
                filterToSubscribe = response.data;

                let newSubscribersList = [...filterToSubscribe.subscribers].filter(subscriber => subscriber.username !== AuthService.getCurrentUser().username)
                filterToSubscribe.subscribers = newSubscribersList;
                filterToSubscribe.fail_message_type_groups = []; // tymczasowe usuwa całkowicie grupy ale srawdza czy działa subskrybowanie

                putTestFilter(rowData.id, filterToSubscribe).then(
                    (response) => {
                        console.log("success")
                        fetchTestFilters();
                    }, (error) => {
                        console.log("Error during editing")
                    }
                )

            }, (error) => {
                console.log("Error during editing")
            }
        )
    }

    let subscribeOrUnsubscribedButton = (rowData) => {

        let currentUser = AuthService.getCurrentUser().username;
        if (rowData.subscribers.includes(currentUser)) {
            return (
                <Button className="p-button-primary p-button-sm" style={{ padding: '8px', height: '35px' }} onClick={() => unsubscribeFilter(rowData)} >
                    <div><BiBellOff size='20' /></div>
                </Button>
            );
        } else {
            return (
                <Button className="p-button-primary p-button-sm" style={{ padding: '8px', height: '35px' }} onClick={() => subscribeFilter(rowData)} >
                    <div><BiBell size='20' /></div>
                </Button>
            );
        }
    }

    let click = (id) => {
        console.log("klik" + id)
    }

    const failMessageGroupsBody = (rowData) => {
        return <ul style={{ listStyleType: 'none', margin: 0, padding: 0 }}>
            {rowData.fail_message_type_groups.map(group => <li key={group.id}><VscExpandAll size='20' onClick={() => click(group.id)} />{group.name}</li>)}
        </ul>
    }

    useEffect(() => {
        fetchTestFilters();
    }, [type])

    return (
        <>
            <Button style={{ marginLeft: '5px', marginTop: '5px', fontWeight: 'bold' }} className="p-button-primary p-button-color p-button-sm" onClick={addFilter}>Add Regression Filter</Button>

            <DataTable value={testFilters} stripedRows responsiveLayout="scroll" size="small" className="table-style" editMode="row"
                showGridlines dataKey="id"
                filters={filters} filterDisplay="row" loading={loading}
                emptyMessage="No fail message types found."
                scrollHeight="calc(100vh - 220px)"
                resizableColumns columnResizeMode="fit">
                <Column field="name" header="Name" sortable filter filterPlaceholder="Search by name"></Column>
                <Column field="test_set_name" header="Test Set Name" sortable filter filterPlaceholder="Search by test set name"></Column>
                <Column field="branch" header="Branch" sortable filter filterPlaceholder="Search by branch" ></Column>
                <Column field="testline_type" header="Test Line Type" sortable filter filterPlaceholder="Search by test line type" ></Column>
                <Column field="owners" header="Owners" filter filterPlaceholder="Search by owner" />
                <Column field="subscribers" header="Subscribers" filter filterPlaceholder="Search by subscriber" />
                <Column field="description" header="Description" sortable filter filterPlaceholder="Search by description"></Column>
                <Column body={failMessageGroupsBody} header="Fail Message Groups" ></Column>
                <Column body={subscribeOrUnsubscribedButton} header="Follow" style={{ textAlign: "center" }} />
                <Column body={editButton} header="Edit" style={{ display: type === "owned" ? ' ' : 'none', textAlign: "center", minWidth: "60px" }} />
                <Column body={removeButton} header="Remove" style={{ display: type === "owned" ? ' ' : 'none', textAlign: "center" }} />

            </DataTable>

            <UserFilterAddModal filterIdToEdit={filterIdToEdit} showForm={showForm} handleFormClose={handleTestSetFormCloseAndRefresh} handleFormShow={handleFormShow} />
        </>
    )
}

export default UserFiltersComponent;