// Description: File is responsible for managing view to test set filters operations
// HISTORY
// --------------------------------------------------------------------------
//   Date                    Author                     Bug                 List of changes
//  --------------------------------------------------------------------------

import { useState, useEffect } from 'react';
import { FilterMatchMode } from 'primereact/api';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Button } from 'primereact/button';
import { confirmDialog, ConfirmDialog } from 'primereact/confirmdialog';
import { VscExpandAll } from 'react-icons/vsc';
import { BiBell, BiBellOff, BiTrash } from 'react-icons/bi';
import { MdAddCircle } from 'react-icons/md';
import { BiEdit } from 'react-icons/bi';

import UserFilterAddModal from './TestSetFilterAddModal';
import {
    postSubscribeBatch, postUnsubscribeBatch, getTestSetFilters,
    postTestSetFilterSubscribe, postTestSetFilterUnsubscribe, deleteTestSetFilterBatch
} from '../../services/test-results-analyzer/test-filters.service';
import Notify, { AlertTypes, Successes, Errors } from '../../services/Notify.js';
import { useCurrentUser } from '../../services/CurrentUserContext';


import 'react-toastify/dist/ReactToastify.css';
import './TestSetFiltersComponent.css';

let TestSetFiltersComponent = ({ type }) => {

    const { currentUser, fetchCurrentUser } = useCurrentUser();

    const [testFilters, setTestSetFilters] = useState([]);

    const [selectedTestFilters, setSelectedTestFilters] = useState([]);

    const [filterIdToEdit, setFilterIdToEdit] = useState(null);

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

    let fetchTestSetFilters = () => {
        setLoading(true);
        getTestSetFilters(type).then(
            (response) => {

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

    let handleTestSetFormCloseAndRefresh = () => {
        handleFormClose();
        fetchTestSetFilters();

    }

    const editFilter = (id) => {
        setFilterIdToEdit(id);
        handleFormShow();
    }

    const addFilter = () => {
        setFilterIdToEdit(null);
        handleFormShow();
    }

    let editButton = (rowData) => {
        return (
            <Button className="p-button-warning p-button-sm" style={{ padding: '8px', height: '35px' }} onClick={() => editFilter(rowData.id)} >
                <BiEdit size='20' />
            </Button>
        );
    }

    const subscribeFilter = (rowData) => {
        postTestSetFilterSubscribe(rowData.id).then(
            (response) => {
                let testFiltersTmp = testFilters.map(testFilter => {
                    if (testFilter.id === rowData.id) {
                        if (testFilter.subscribers === "")
                            testFilter.subscribers += currentUser;
                        else testFilter.subscribers += ', ' + currentUser;
                    }
                    return testFilter;
                })
                setTestSetFilters(testFiltersTmp);
                Notify.sendNotification(Successes.TEST_SET_FILTER_SUBSCRIBED, AlertTypes.success);

            }, (error) => {
                Notify.sendNotification(Errors.TEST_SET_FILTER_SUBSCRIBED, AlertTypes.error);
            }
        )

    }

    const unsubscribeFilter = (rowData) => {
        postTestSetFilterUnsubscribe(rowData.id).then(
            (response) => {
                let testFiltersTmp = testFilters.map(testFilter => {
                    if (testFilter.id === rowData.id) {
                        let subscribersTmp = testFilter.subscribers;
                        subscribersTmp = subscribersTmp.replace(currentUser, ',').replace(', ,', '').replace(', ,,', '');
                        if (subscribersTmp === ',') subscribersTmp = subscribersTmp.replace(',', '');
                        testFilter.subscribers = subscribersTmp;
                    }
                    return testFilter;
                })
                setTestSetFilters(testFiltersTmp);
                Notify.sendNotification(Successes.TEST_SET_FILTER_UNSUBSCRIBED, AlertTypes.success);

            }, (error) => {
                Notify.sendNotification(Errors.TEST_SET_FILTER_UNSUBSCRIBED, AlertTypes.error);
            }
        )

    }

    let subscribeOrUnsubscribedButton = (rowData) => {
        if (rowData.subscribers.includes(currentUser)) {
            return (
                <Button className="p-button-secondary p-button-sm" style={{ padding: '8px', height: '35px' }} onClick={() => unsubscribeFilter(rowData)} >
                    <div><BiBellOff size='20' /></div>
                </Button>
            );
        } else {
            return (
                <Button className="p-button-info p-button-sm" style={{ padding: '8px', height: '35px' }} onClick={() => subscribeFilter(rowData)} >
                    <div><BiBell size='20' /></div>
                </Button>
            );
        }
    }

    const failMessageGroupsBody = (rowData) => {
        return <ul style={{ listStyleType: 'none', margin: 0, padding: 0 }}>
            {rowData.fail_message_type_groups.map(group =>
                <li key={group.id}><VscExpandAll size='20' />
                    <a href={`fail-regex-groups/${group.id}`} target="_blanc">{group.name}</a>
                </li>
            )}
        </ul >
    }

    const selectSelectedTestFilters = (selectedTestFiltersValue) => {
        setSelectedTestFilters(selectedTestFiltersValue);
    }

    const sunscribeSelectedTestFilters = () => {
        postSubscribeBatch(selectedTestFilters.map((testFilter) => ({ "id": testFilter.id }))).then(
            (response) => {
                setSelectedTestFilters([]);
                fetchTestSetFilters(type);
                Notify.sendNotification(Successes.TEST_SET_FILTERS_SUBSCRIBED, AlertTypes.success);
            }, (error) => {
                Notify.sendNotification(Errors.TEST_SET_FILTERS_SUBSCRIBED, AlertTypes.error);
            }
        )
    }

    const unsunscribeSelectedTestFilters = () => {
        postUnsubscribeBatch(selectedTestFilters.map((testFilter) => ({ "id": testFilter.id }))).then(
            (response) => {
                setSelectedTestFilters([]);
                fetchTestSetFilters(type);
                Notify.sendNotification(Successes.TEST_SET_FILTERS_UNSUBSCRIBED, AlertTypes.success);
            }, (error) => {
                Notify.sendNotification(Errors.TEST_SET_FILTERS_UNSUBSCRIBED, AlertTypes.error);
            }
        )
    }

    const confirmRemove = () => {
        confirmDialog({
            message: '\nAre you sure you want to remove selected Test Set Filters?',
            header: 'Confirmation',
            icon: 'pi pi-exclamation-triangle',
            accept: () => deleteSelectedTestFilters()
        });
    };

    const deleteSelectedTestFilters = () => {
        deleteTestSetFilterBatch(selectedTestFilters.map((testFilter) => ({ "id": testFilter.id }))).then(
            (response) => {
                setSelectedTestFilters([]);
                fetchTestSetFilters(type);
                Notify.sendNotification(Successes.TEST_SET_FILTERS_DELETED, AlertTypes.success);
            }, (error) => {
                Notify.sendNotification(Errors.TEST_SET_FILTERS_DELETED, AlertTypes.error);
            }
        )
    }

    useEffect(() => {
        fetchCurrentUser();
        fetchTestSetFilters();
    }, [type])

    return (
        <>
            <Button style={{ marginLeft: '5px', marginTop: '5px', fontWeight: 'bold' }} className="p-button-success p-button-sm" onClick={addFilter}>
                <MdAddCircle size='20' />
                <span style={{ marginLeft: '5px' }}>Add Regression Filter</span>
            </Button>
            {type !== "subscribed" ?
                <Button style={{ marginLeft: '5px', marginTop: '5px', fontWeight: 'bold' }} className="p-button-info p-button-sm" onClick={sunscribeSelectedTestFilters}>
                    <BiBell size='20' />
                    <span style={{ marginLeft: '5px' }}>Subscribe selected</span>
                </Button>
                : null
            }
            <Button style={{ marginLeft: '5px', marginTop: '5px', fontWeight: 'bold' }} className="p-button-secondary p-button-sm" onClick={unsunscribeSelectedTestFilters}>
                <BiBellOff size='20' />
                <span style={{ marginLeft: '5px' }}>Unsubscribe selected</span>
            </Button>
            {type === "owned" ?
                <Button style={{ marginLeft: '5px', marginTop: '5px', fontWeight: 'bold' }} className="p-button-danger p-button-sm" onClick={confirmRemove}>
                    <BiTrash size='20' />
                    <span style={{ marginLeft: '5px' }}>Remove selected</span>
                </Button>
                : null
            }

            <DataTable value={testFilters} stripedRows responsiveLayout="scroll" size="small" className="table-style" editMode="row"
                showGridlines dataKey="id"
                filters={filters} filterDisplay="row" loading={loading}
                emptyMessage="No fail message types found."
                scrollHeight="calc(100vh - 150px)"
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
                <Column body={failMessageGroupsBody} header="Fail Message Groups" ></Column>
                <Column body={subscribeOrUnsubscribedButton} header="Subscribe" style={{ textAlign: "center" }} />
                <Column body={editButton} header="Edit" style={{ display: type === "owned" ? ' ' : 'none', textAlign: "center", minWidth: "60px" }} />

            </DataTable>

            <UserFilterAddModal filterIdToEdit={filterIdToEdit} showForm={showForm} handleFormClose={handleTestSetFormCloseAndRefresh} handleFormShow={handleFormShow} />
            <ConfirmDialog />
        </>
    )
}

export default TestSetFiltersComponent;