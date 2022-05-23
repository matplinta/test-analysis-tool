import { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';

import { getFailMessageTypes } from '../../services/test-results-analyzer/fail-message-type.service';

const FailRegexTypesComponent = () => {

    const [failRegexTypes, setFailRegexTypes] = useState();

    let fetchTestFilters = () => {
        getFailMessageTypes().then(
            (response) => {
                console.log(response.data)
                setFailRegexTypes(response.data);
            },
            (error) => {
                console.log(error);
            }
        )
    }

    useEffect(() => {
        fetchTestFilters();
    }, [])

    return (
        <DataTable value={failRegexTypes} stripedRows responsiveLayout="scroll" size="small" className="table-style" editMode="row">
            <Column field="id" header="Id"></Column>
            <Column field="name" header="Name"></Column>
            <Column field="regex" header="Regex"></Column>
            <Column field="author" header="Author"></Column>
            <Column field="description" header="Description"></Column>
        </DataTable>
    )
}

export default FailRegexTypesComponent;