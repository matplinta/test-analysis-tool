// Description: File is responsible for showing list of saved Filter Sets as a selectable table
// HISTORY
// --------------------------------------------------------------------------
//   Date                    Author                     Bug                 List of changes
//  --------------------------------------------------------------------------


import { useEffect, useState } from "react"
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { FaRegTrashAlt } from 'react-icons/fa';
import { confirmDialog } from 'primereact/confirmdialog';
import { FilterMatchMode } from 'primereact/api';
import { SelectButton } from 'primereact/selectbutton';

import { useCurrentUser } from '../../services/CurrentUserContext';
import Notify, { AlertTypes, Errors, Successes } from '../../services/Notify.js';
import { deleteFilterSetsDetail, getFilterSetsDetail, getMyFilterSetsDetail } from './../../services/test-results-analyzer/statistics.service';

let FilterSetsTableComponent = ({ selectedFilterSet, selectFilterSet, reloadTestSetFilters, setReloadTestSetFilters }) => {

    const [filterSets, setFilterSets] = useState(null);

    const [loading, setLoading] = useState(true);

    const { currentUser, fetchCurrentUser } = useCurrentUser();

    const toggleOptions = ['My Filter Sets', 'All Filter Sets'];
    const [toggleValue, setToggleValue] = useState('My Filter Sets');

    const fetchFilterSets = () => {
        getFilterSetsDetail().then(
            (results) => {
                setFilterSets(results.data.results)
                setLoading(false);
                setReloadTestSetFilters(false);
            }, (error) => {
                setLoading(false);
                Notify.sendNotification(Errors.FETCH_FILTER_SETS, AlertTypes.error);
            })
    }

    const fetchMyFilterSets = () => {
        getMyFilterSetsDetail().then(
            (results) => {
                setFilterSets(results.data.results)
                setLoading(false);
                setReloadTestSetFilters(false);
            }, (error) => {
                setLoading(false);
                Notify.sendNotification(Errors.FETCH_FILTER_SETS, AlertTypes.error);
            })
    }

    let removeTestSet = (id) => {
        deleteFilterSetsDetail(id).then(
            (response) => {
                Notify.sendNotification(Successes.REMOVE_FAIL_MESSAGE_REGEX, AlertTypes.success);
                fetchFilterSets();
            },
            (error) => {
                Notify.sendNotification(Errors.REMOVE_FAIL_MESSAGE_REGEX, AlertTypes.error);
            }
        )
    }

    const confirmRemove = (rawData) => {
        confirmDialog({
            message: '\nAre you sure you want to remove Filter Set?',
            header: 'Confirmation',
            icon: 'pi pi-exclamation-triangle',
            accept: () => removeTestSet(rawData.id)
        });
    };

    let removeButton = (rowData) => {
        return (
            <Button className="p-button-danger p-button-sm" style={{ padding: '8px', height: '35px' }} onClick={() => confirmRemove(rowData)} disabled={!rowData.author.includes(currentUser)}>
                <FaRegTrashAlt size='20' />
            </Button>
        );
    }

    let selectFilterSetInTable = (filterSet) => {
        selectFilterSet(filterSet)
        // fetchFilterSets();
    }

    let fetchFilterSetsWrapper = (value) => {
        if (value === 'My Filter Sets') {
            fetchMyFilterSets();
        } else {
            fetchFilterSets();
        }
    }

    let onToggleValueChange = (value) => {
        setToggleValue(value);
        fetchFilterSetsWrapper(value);
    }

    useEffect(() => {
        fetchCurrentUser();
        fetchFilterSetsWrapper(toggleValue);
    }, [])

    useEffect(() => {
        fetchFilterSetsWrapper(toggleValue);
    }, [reloadTestSetFilters])

    return (
        <>
            <SelectButton value={toggleValue} options={toggleOptions} onChange={(e) => onToggleValueChange(e.value)}
                className="select-button-my-all ml-1 mb-3" />
            <DataTable value={filterSets} stripedRows responsiveLayout="scroll" showGridlines dataKey="id"
                size="small" className="fail-message-table"
                filterDisplay="row" loading={loading}
                globalFilterFields={['name', 'regex', 'author', 'description']}
                emptyMessage="No filter sets found."
                scrollHeight="calc(100vh - 220px)"
                resizableColumns columnResizeMode="fit"
                selectionMode="single" selection={selectedFilterSet}
                onSelectionChange={e => selectFilterSetInTable(e.value)}>

                <Column field="name" header="Name" sortable filter filterPlaceholder="Search by name" style={{ width: '70%' }} ></Column >
                <Column field="author" header="Author" sortable filter filterPlaceholder="Search by author" style={{ width: '30%' }} ></Column>
                <Column body={removeButton} header="Remove" style={{ textAlign: "center", minWidth: "60px" }} />

            </DataTable >
        </>
    )
}

export default FilterSetsTableComponent;