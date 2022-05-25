import { useState, useEffect, useRef } from 'react';
import { FilterMatchMode, FilterOperator } from 'primereact/api';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';

import FailMessageTypeAddModal from './FailMessageTypeAddModal';

import { getFailMessageTypes } from '../../services/test-results-analyzer/fail-message-type.service';


const FailRegexTypesComponent = () => {

    const [failRegexTypes, setFailRegexTypes] = useState();

    const [filters, setFilters] = useState({
        'name': { value: null, matchMode: FilterMatchMode.CONTAINS },
        'regex': { value: null, matchMode: FilterMatchMode.CONTAINS },
        'author': { value: null, matchMode: FilterMatchMode.CONTAINS },
        'env_issue_type': { value: null, matchMode: FilterMatchMode.CONTAINS },
        'description': { value: null, matchMode: FilterMatchMode.CONTAINS }
    })

    const [loading, setLoading] = useState(true);

    const [showForm, setShowForm] = useState(false);

    const handleFormClose = () => setShowForm(false);

    const handleFormShow = () => setShowForm(true);

    const handleTestSetFormCloseAndRefresh = () => {
        handleFormClose();
        fetchTestFilters();
    }

    let fetchTestFilters = () => {
        getFailMessageTypes().then(
            (response) => {
                console.log(response.data)
                setFailRegexTypes(response.data);
                setLoading(false);
            },
            (error) => {
                console.log(error);
                setLoading(false);
            }
        )
    }

    useEffect(() => {
        fetchTestFilters();
    }, [])

    return (
        <>
            <Button style={{ marginLeft: '5px', marginTop: '5px', fontWeight: 'bold' }} className="p-button-primary p-button-color p-button-sm" onClick={handleFormShow}>Add Fail Message Regex</Button>
            <DataTable value={failRegexTypes} stripedRows responsiveLayout="scroll" showGridlines dataKey="id"
                size="small" className="table-style"
                filters={filters} filterDisplay="row" loading={loading}
                globalFilterFields={['name', 'regex', 'author', 'description']}
                emptyMessage="No fail message types found."
                scrollHeight="calc(100vh - 230px)"
                resizableColumns columnResizeMode="fit">
                < Column field="name" header="Name" sortable filter filterPlaceholder="Search by name" style={{ width: '20%' }} ></Column >
                <Column field="regex" header="Regex" sortable filter filterPlaceholder="Search by regex" style={{ width: '35%' }} ></Column>
                <Column field="env_issue_type" header="Env Issue Type" sortable filter filterPlaceholder="Search by env issue tye" style={{ width: '15%' }} ></Column>
                <Column field="author" header="Author" sortable filter filterPlaceholder="Search by author" style={{ width: '15%' }}  ></Column>
                <Column field="description" header="Description" sortable filter filterPlaceholder="Search by description" style={{ width: '15%' }} ></Column>
            </DataTable >

            <FailMessageTypeAddModal showForm={showForm} handleFormClose={handleTestSetFormCloseAndRefresh} handleFormShow={handleFormShow} />
        </>
    )
}

export default FailRegexTypesComponent;