// Description: File is responsible for automatioc form generation for managing filters list
// HISTORY
// --------------------------------------------------------------------------
//   Date                    Author                     Bug                 List of changes
//  --------------------------------------------------------------------------


import { React } from 'react';

import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { InputTextarea } from 'primereact/inputtextarea';
import { VscClose } from 'react-icons/vsc';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { ScrollPanel } from 'primereact/scrollpanel';

const FilterListFormComponent = ({ filters, filterFields, onFilterChange, removeFilter, onFilterValueChange }) => {

    return (
        <ScrollPanel style={{ width: '99%', height: '300px' }}>
            <div className="mt-1">
                {filters.map((item, index) => {
                    return (
                        <Row key={index} id={index} className="mb-2">
                            <Col xl={3} className="pr-0">
                                <Dropdown value={item.field} options={filterFields} onChange={(e) => onFilterChange(item, index, e)}
                                    placeholder="Select filter" style={{ width: '100%' }} />
                            </Col>
                            <Col xl={8} className="pr-0">
                                <InputTextarea value={item.value} onChange={(e) => onFilterValueChange(item, index, e)} rows={1}
                                    autoResize={true}
                                    cols={30} placeholder="Provide value" style={{ width: '100%', height: '50px' }} />
                            </Col>
                            <Col xl={1}>
                                <Button className="p-button-primary p-button-sm" onClick={() => removeFilter(item, index)}
                                    style={{ padding: '5px', height: '47px' }} >
                                    <VscClose size='40' />
                                </Button>
                            </Col>
                        </Row>
                    );
                })}

            </div>
        </ScrollPanel>
    )
}

export default FilterListFormComponent;