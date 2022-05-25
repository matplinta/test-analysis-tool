import { useState, useEffect, useRef } from 'react';

import { PickList } from 'primereact/picklist';

import { getFailMessageTypes } from '../../services/test-results-analyzer/fail-message-type.service';

let FailMessageTypeGroupComponent = () => {

    const [sourceFailRegexTypes, setSourceFailRegexTypes] = useState();

    // const [source, setSource] = useState([]);
    const [target, setTarget] = useState([]);

    const [loading, setLoading] = useState(true);

    let fetchTestFilters = () => {
        getFailMessageTypes().then(
            (response) => {
                console.log(response.data)
                setSourceFailRegexTypes(response.data);
                setLoading(false);
            },
            (error) => {
                console.log(error);
                setLoading(false);
            }
        )
    }

    const onChange = (event) => {
        setSourceFailRegexTypes(event.source);
        setTarget(event.target);
    }

    const itemTemplate = (item) => {
        return (
            <div className="product-item">
                <div className="product-list-detail">
                    <h5 className="mb-2">{item.name}</h5>
                    <i className="pi pi-tag product-category-icon"></i>
                    <span className="product-category">{item.name}</span>
                </div>
                <div className="product-list-action">
                    <h6 className="mb-2">${item.price}</h6>
                    <span className={`product-badge status-${item.regex.toLowerCase()}`}>{item.description}</span>
                </div>
            </div>
        );
    }

    useEffect(() => {
        fetchTestFilters();
    }, [])

    return (
        <div className="picklist-demo">
            <div className="card">
                <PickList source={sourceFailRegexTypes} target={target} itemTemplate={itemTemplate}
                    sourceHeader="Available" targetHeader="Selected"
                    sourceStyle={{ height: '342px' }} targetStyle={{ height: '342px' }}
                    onChange={onChange}></PickList>
            </div>
        </div>
    )
}

export default FailMessageTypeGroupComponent;