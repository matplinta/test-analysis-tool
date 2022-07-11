import { useEffect, useState } from "react"
import { Divider } from 'primereact/divider';
import { Card } from 'primereact/card';
import { Splitter, SplitterPanel } from 'primereact/splitter';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { InputTextarea } from 'primereact/inputtextarea';
import { VscClose } from 'react-icons/vsc';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dialog } from 'primereact/dialog';

import { getFilterFields, getFilterSets } from './../../services/test-results-analyzer/statistics.service';


let ChartsComponent = () => {

    const [filtersetName, setFiltersetName] = useState("");
    const [filterFields, setFilterFields] = useState(null);
    const [filterSets, setFilterSets] = useState(null);
    const [selectedFilterSet, setSelectedFilterSet] = useState(null);

    const [selectedFilterFields, setSelectedFilterFields] = useState([]);
    const [unselectedFilterFields, setUnselectedFilterFields] = useState([]);

    const [loading, setLoading] = useState(true);

    const filterTemplate = {
        filter_set: filtersetName,
        field: "",
        value: ""
    }

    const [filters, setFilters] = useState([filterTemplate]);

    const [displayAlert, setDisplayAlert] = useState(false)

    const addFilter = () => {
        setFilters([...filters, filterTemplate])
    }

    const fetchFilterFields = () => {
        getFilterFields().then(
            (results) => {
                console.log(results)
                setFilterFields(results.data);
                setUnselectedFilterFields(results.data);
            }, (error) => {

            })
    }

    const fetchFilterSets = () => {
        getFilterSets().then(
            (results) => {
                console.log(results)
                setFilterSets(results.data.results)
                setLoading(false);
            }, (error) => {
                setLoading(false);
            })
    }

    const onFilterChange = (item, index, e) => {

        if (selectedFilterFields.filter(selectedFilter => selectedFilter.field.id === e.value.id).length > 0) {
            setDisplayAlert(true)
        } else {
            let tmp = [...filters]
            tmp[index].field = e.value;
            setFilters(tmp)
            let unselectedfilterFieldsList = [...unselectedFilterFields].filter(item => item.id !== e.value.id);
            let selectedfilterFieldsList = [...selectedFilterFields];
            selectedfilterFieldsList.push(item);

            setUnselectedFilterFields(unselectedfilterFieldsList)
            setSelectedFilterFields(selectedfilterFieldsList);
        }

    }

    const onFilterValueChange = (item, index, e) => {
        let tmp = [...filters]
        tmp[index].value = e.target.value;
        setFilters(tmp)
    }

    const removeFilter = (item, index) => {
        let tmp = [...filters];
        tmp.splice(index, 1);
        setFilters(tmp);

        if (item.field.id !== undefined) {
            let selectedfilterFieldsList = [...selectedFilterFields].filter(selectedFilter => selectedFilter.field.id !== item.field.id);
            let unselectedfilterFieldsList = [...unselectedFilterFields]
            unselectedfilterFieldsList.push(item);
            setUnselectedFilterFields(unselectedfilterFieldsList)
            setSelectedFilterFields(selectedfilterFieldsList);
        }

    }

    const setFiltersetNameOnFiltersList = (e) => {
        setFiltersetName(e.target.value)
        let tmp = [...filters];
        tmp = tmp.map(filter => {
            return {
                filter_set: e.target.value,
                field: filter.field,
                value: filter.value
            }
        })
        setFilters(tmp);
    }

    const selectFilterSet = (filterSet) => {
        console.log(filterSet)
        setSelectedFilterSet(filterSet)
    }

    const saveFilterSet = () => {

    }

    const generateChart = () => {

    }

    const clearFilterSet = () => {

    }

    useEffect(() => {
        fetchFilterFields();
        fetchFilterSets();
    }, [])

    return (
        <>
            <div style={{ display: 'flex', marginTop: '5px', marginLeft: '3px', marginRight: '3px' }}>
                <Card style={{ width: '50%' }}>
                    <Container style={{ padding: '2px' }}>

                        <Row style={{ paddingLeft: '8px' }}>
                            <Col style={{ padding: '2px' }}>
                                <label htmlFor="name" className="block">Filterset Name</label>
                                <InputText id="name" value={filtersetName} onChange={setFiltersetNameOnFiltersList} style={{ width: "99%", marginBottom: '5px' }} className="block" />
                            </Col>
                        </Row>

                        Filters
                        {filters.map((item, index) => {
                            return (
                                <Row key={index} id={index} style={{ paddingLeft: '8px' }}>
                                    <Col xl={5} style={{ padding: '2px' }}>
                                        <Dropdown value={item.field} options={filterFields} onChange={(e) => onFilterChange(item, index, e)} optionLabel="name" placeholder="Select filter" style={{ width: '100%' }} />
                                    </Col>
                                    <Col xl={6} style={{ padding: '2px' }}>
                                        <InputTextarea value={item.value} onChange={(e) => onFilterValueChange(item, index, e)} rows={1} cols={30} autoResize placeholder="Provide value" style={{ width: '100%' }} />
                                    </Col>
                                    <Col xl={'auto'} style={{ padding: '2px' }}>
                                        <Button className="p-button-primary p-button-sm" onClick={() => removeFilter(item, index)} style={{ padding: '5px', height: '47px', marginBottom: '3px' }} >
                                            <VscClose size='30' />
                                        </Button>
                                    </Col>

                                </Row>
                            );
                        })}

                        <Row style={{ paddingLeft: '8px' }}>
                            <Col style={{ padding: '2px' }}>
                                <Button icon="pi pi-plus" className="p-button-rounded" aria-label="Filter" onClick={addFilter} style={{ marginTop: '5px', marginBottom: '7px' }} />
                            </Col>
                        </Row>

                        <Row style={{ paddingLeft: '8px' }}>
                            <Col style={{ padding: '2px' }}>
                                <Button className="p-button-primary p-button-color" type="submit" onClick={saveFilterSet}>Save Filter Set</Button>
                                <Button className="p-button-primary p-button-color" type="submit" onClick={generateChart}>Generate Chart</Button>
                                <Button className="p-button-primary p-button-color" type="submit" onClick={clearFilterSet}>Clear Filter Set</Button>
                            </Col>
                        </Row>
                    </Container>


                </Card>
                <Divider layout="vertical"></Divider>
                <Card style={{ width: '50%' }}>
                    <DataTable value={filterSets} stripedRows responsiveLayout="scroll" showGridlines dataKey="id"
                        size="small" className="fail-message-table"
                        filters={filters} filterDisplay="row" loading={loading}
                        globalFilterFields={['name', 'regex', 'author', 'description']}
                        emptyMessage="No fail message types found."
                        scrollHeight="50vh"
                        resizableColumns columnResizeMode="fit"
                        selectionMode="single" selection={selectedFilterSet} onSelectionChange={e => selectFilterSet(e.value)}>

                        <Column field="name" header="Name" sortable filter filterPlaceholder="Search by name" style={{ width: '70%' }} ></Column >
                        <Column field="author" header="Author" sortable filter filterPlaceholder="Search by author" style={{ width: '30%' }} ></Column>
                    </DataTable >
                </Card>
            </div >

            <Dialog header="Selected field has already been used!" visible={displayAlert} onHide={() => setDisplayAlert(false)} dismissableMask={true} style={{ width: '30vw' }}>
                <br />
                <p>Filter field value can be selected only once in this form. Please add value to selected before if you want to define next value for this filter or select another filter field.</p>
            </Dialog>
        </>
    )
}

export default ChartsComponent;