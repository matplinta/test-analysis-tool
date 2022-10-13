import { useState, useEffect } from 'react';
import { FilterMatchMode } from 'primereact/api';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';

import { getFailMessageTypes } from '../../services/test-results-analyzer/fail-message-type.service';

import './FailMessagesTableComponent.css';

const FailMessagesTableComponent = ({ selectedFailMessageTypes, setSelectedFailMessageTypes }) => {

    const [failRegexTypes, setFailRegexTypes] = useState();

    const [filters] = useState({
        'name': { value: null, matchMode: FilterMatchMode.CONTAINS },
        'regex': { value: null, matchMode: FilterMatchMode.CONTAINS },
        'author': { value: null, matchMode: FilterMatchMode.CONTAINS },
        'env_issue_type': { value: null, matchMode: FilterMatchMode.CONTAINS },
        'description': { value: null, matchMode: FilterMatchMode.CONTAINS }
    })

    const [loading, setLoading] = useState(true);

    let fetchTestSetFilters = () => {
        getFailMessageTypes().then(
            (response) => {
                setFailRegexTypes(response.data);
                setLoading(false);
            },
            (error) => {
                setLoading(false);
            }
        )
    }

    useEffect(() => {
        fetchTestSetFilters();
    }, [])

    return (
        <>
            <DataTable value={failRegexTypes} stripedRows responsiveLayout="scroll" showGridlines dataKey="id"
                size="small" className="fail-message-table"
                filters={filters} filterDisplay="row" loading={loading}
                globalFilterFields={['name', 'regex', 'author', 'description']}
                emptyMessage="No fail message types found."
                scrollHeight="50vh"
                resizableColumns columnResizeMode="fit"
                selection={selectedFailMessageTypes} onSelectionChange={e => setSelectedFailMessageTypes(e.value)}>

                <Column selectionMode="multiple"></Column>
                <Column field="name" header="Name" sortable filter filterPlaceholder="Search by name" style={{ width: '20%' }} ></Column >
                <Column field="regex" header="Regex" sortable filter filterPlaceholder="Search by regex" style={{ width: '35%' }} ></Column>
                <Column field="env_issue_type" header="Env Issue Type" sortable filter filterPlaceholder="Search by env issue tye" style={{ width: '15%' }} ></Column>
                <Column field="author" header="Author" sortable filter filterPlaceholder="Search by author" style={{ width: '15%' }}  ></Column>
                <Column field="description" header="Description" sortable filter filterPlaceholder="Search by description" style={{ width: '15%' }} ></Column>
            </DataTable >
        </>
    )
}

export default FailMessagesTableComponent;