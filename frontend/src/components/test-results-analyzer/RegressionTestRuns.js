import { useState, useEffect } from 'react';

import { Card } from 'primereact/card';
import { ScrollPanel } from 'primereact/scrollpanel';
import { Checkbox } from 'primereact/checkbox';
import { MultiStateCheckbox } from 'primereact/multistatecheckbox';
import { Tree } from 'primereact/tree';

import { getTestFilters } from '../../services/test-results-analyzer/test-filters.service';

import './RegressionTestRuns.css'
import { Button } from 'primereact/button';

let RegressionTestRuns = () => {

    const [testFilters, setTestFilters] = useState([]);
    const [selectedTestFilters, setSelectedTestFilters] = useState([]);

    const [nodes, setNodes] = useState([]);
    const [expandedKeys, setExpandedKeys] = useState({});

    const [selectedKeys3, setSelectedKeys3] = useState(null);

    let fetchTestFilters = () => {
        getTestFilters().then(
            (response) => {
                if (nodes.length === 0) {
                    let filters = {
                        key: 'regression_filters',
                        label: 'Regression filters',
                        data: 'Regression Filters',
                        children: []
                    }

                    const filterChildren = response.data.results.map((item, index) => {
                        return { key: item.name + index, label: item.name, data: item.name, children: [] }
                    })
                    filters.children = filterChildren;

                    let nodesTmp = [...nodes];
                    nodesTmp.push(filters);
                    setNodes(nodesTmp)

                    const testFiltersParsed = response.data.results.map((item) => {
                        return { name: item.name, key: item.id }
                    });

                    setTestFilters(testFiltersParsed);
                    setSelectedTestFilters(testFiltersParsed);
                }

            },
            (error) => {
                console.log(error);
            }
        )
    }

    const onTestFilterChange = (e) => {
        let _selectedFilters = [...selectedTestFilters];

        if (e.checked) {
            _selectedFilters.push(e.value);
        }
        else {
            for (let i = 0; i < _selectedFilters.length; i++) {
                const selectedFilter = _selectedFilters[i];

                if (selectedFilter.key === e.value.key) {
                    _selectedFilters.splice(i, 1);
                    break;
                }
            }
        }
        setSelectedTestFilters(_selectedFilters);
    }

    const searchTestRuns = () => {
        console.log(selectedKeys3)
    }

    const testFiltersCheckboxList = (
        <div>
            <Tree value={nodes} expandedKeys={expandedKeys} selectionMode="checkbox" selectionKeys={selectedKeys3} onSelectionChange={e => setSelectedKeys3(e.value)} />
            <br />
            <Button onClick={searchTestRuns}>Search</Button>
        </div>
    )

    const onTestFilterAllChange = (e) => {

    }

    // const testFiltersAllCheckbox = (
    // <div className="p-field-checkbox p-m-0">
    //     <MultiStateCheckbox value={value} options={options} optionValue="value" onChange={(e) => setValue(e.value)} />
    //     <label>{value}</label>
    // </div>
    // )

    useEffect(() => {
        fetchTestFilters();
    }, [])

    return (

        <div className="wrapper">
            <aside>
                {/* <ScrollPanel style={{ width: '100%', height: '70vh' }} className="custombar1">
                    <p><strong>Filters</strong></p>
                    <div> */}
                {/* {testFiltersAllCheckbox} */}
                {testFiltersCheckboxList}
                {/* </div> */}
                {/* </ScrollPanel> */}


            </aside>
            <main>
                <Card>
                    <p>Lorem ipsum, dolor sit amet consectetur adipisicing elit. Repellendus consectetur quas sunt magnam eos dolores molestias fugit! Consectetur aperiam, neque minus facere, tempora nobis doloribus dolores quo sed esse rerum?</p>
                    <p>Lorem ipsum, dolor sit amet consectetur adipisicing elit. Repellendus consectetur quas sunt magnam eos dolores molestias fugit! Consectetur aperiam, neque minus facere, tempora nobis doloribus dolores quo sed esse rerum?</p>
                    <p>Lorem ipsum, dolor sit amet consectetur adipisicing elit. Repellendus consectetur quas sunt magnam eos dolores molestias fugit! Consectetur aperiam, neque minus facere, tempora nobis doloribus dolores quo sed esse rerum?</p>
                    <p>Lorem ipsum, dolor sit amet consectetur adipisicing elit. Repellendus consectetur quas sunt magnam eos dolores molestias fugit! Consectetur aperiam, neque minus facere, tempora nobis doloribus dolores quo sed esse rerum?</p>
                    <p>Lorem ipsum, dolor sit amet consectetur adipisicing elit. Repellendus consectetur quas sunt magnam eos dolores molestias fugit! Consectetur aperiam, neque minus facere, tempora nobis doloribus dolores quo sed esse rerum?</p>
                    <p>Lorem ipsum, dolor sit amet consectetur adipisicing elit. Repellendus consectetur quas sunt magnam eos dolores molestias fugit! Consectetur aperiam, neque minus facere, tempora nobis doloribus dolores quo sed esse rerum?</p>
                    <p>Lorem ipsum, dolor sit amet consectetur adipisicing elit. Repellendus consectetur quas sunt magnam eos dolores molestias fugit! Consectetur aperiam, neque minus facere, tempora nobis doloribus dolores quo sed esse rerum?</p>
                    <p>Lorem ipsum, dolor sit amet consectetur adipisicing elit. Repellendus consectetur quas sunt magnam eos dolores molestias fugit! Consectetur aperiam, neque minus facere, tempora nobis doloribus dolores quo sed esse rerum?</p>
                    <p>Lorem ipsum, dolor sit amet consectetur adipisicing elit. Repellendus consectetur quas sunt magnam eos dolores molestias fugit! Consectetur aperiam, neque minus facere, tempora nobis doloribus dolores quo sed esse rerum?</p>
                    <p>Lorem ipsum, dolor sit amet consectetur adipisicing elit. Repellendus consectetur quas sunt magnam eos dolores molestias fugit! Consectetur aperiam, neque minus facere, tempora nobis doloribus dolores quo sed esse rerum?</p>
                    <p>Lorem ipsum, dolor sit amet consectetur adipisicing elit. Repellendus consectetur quas sunt magnam eos dolores molestias fugit! Consectetur aperiam, neque minus facere, tempora nobis doloribus dolores quo sed esse rerum?</p>
                    <p>Lorem ipsum, dolor sit amet consectetur adipisicing elit. Repellendus consectetur quas sunt magnam eos dolores molestias fugit! Consectetur aperiam, neque minus facere, tempora nobis doloribus dolores quo sed esse rerum?</p>
                    <p>Lorem ipsum, dolor sit amet consectetur adipisicing elit. Repellendus consectetur quas sunt magnam eos dolores molestias fugit! Consectetur aperiam, neque minus facere, tempora nobis doloribus dolores quo sed esse rerum?</p>
                    <p>Lorem ipsum, dolor sit amet consectetur adipisicing elit. Repellendus consectetur quas sunt magnam eos dolores molestias fugit! Consectetur aperiam, neque minus facere, tempora nobis doloribus dolores quo sed esse rerum?</p>
                    <p>Lorem ipsum, dolor sit amet consectetur adipisicing elit. Repellendus consectetur quas sunt magnam eos dolores molestias fugit! Consectetur aperiam, neque minus facere, tempora nobis doloribus dolores quo sed esse rerum?</p>
                    <p>Lorem ipsum, dolor sit amet consectetur adipisicing elit. Repellendus consectetur quas sunt magnam eos dolores molestias fugit! Consectetur aperiam, neque minus facere, tempora nobis doloribus dolores quo sed esse rerum?</p>
                    <p>Lorem ipsum, dolor sit amet consectetur adipisicing elit. Repellendus consectetur quas sunt magnam eos dolores molestias fugit! Consectetur aperiam, neque minus facere, tempora nobis doloribus dolores quo sed esse rerum?</p>
                    <p>Lorem ipsum, dolor sit amet consectetur adipisicing elit. Repellendus consectetur quas sunt magnam eos dolores molestias fugit! Consectetur aperiam, neque minus facere, tempora nobis doloribus dolores quo sed esse rerum?</p>
                    <p>Lorem ipsum, dolor sit amet consectetur adipisicing elit. Repellendus consectetur quas sunt magnam eos dolores molestias fugit! Consectetur aperiam, neque minus facere, tempora nobis doloribus dolores quo sed esse rerum?</p>
                    <p>Lorem ipsum, dolor sit amet consectetur adipisicing elit. Repellendus consectetur quas sunt magnam eos dolores molestias fugit! Consectetur aperiam, neque minus facere, tempora nobis doloribus dolores quo sed esse rerum?</p>
                    <p>Lorem ipsum, dolor sit amet consectetur adipisicing elit. Repellendus consectetur quas sunt magnam eos dolores molestias fugit! Consectetur aperiam, neque minus facere, tempora nobis doloribus dolores quo sed esse rerum?</p>
                    <p>Lorem ipsum, dolor sit amet consectetur adipisicing elit. Repellendus consectetur quas sunt magnam eos dolores molestias fugit! Consectetur aperiam, neque minus facere, tempora nobis doloribus dolores quo sed esse rerum?</p>
                    <p>Lorem ipsum, dolor sit amet consectetur adipisicing elit. Repellendus consectetur quas sunt magnam eos dolores molestias fugit! Consectetur aperiam, neque minus facere, tempora nobis doloribus dolores quo sed esse rerum?</p>
                    <p>Lorem ipsum, dolor sit amet consectetur adipisicing elit. Repellendus consectetur quas sunt magnam eos dolores molestias fugit! Consectetur aperiam, neque minus facere, tempora nobis doloribus dolores quo sed esse rerum?</p>
                    <p>Lorem ipsum, dolor sit amet consectetur adipisicing elit. Repellendus consectetur quas sunt magnam eos dolores molestias fugit! Consectetur aperiam, neque minus facere, tempora nobis doloribus dolores quo sed esse rerum?</p>
                    <p>Lorem ipsum, dolor sit amet consectetur adipisicing elit. Repellendus consectetur quas sunt magnam eos dolores molestias fugit! Consectetur aperiam, neque minus facere, tempora nobis doloribus dolores quo sed esse rerum?</p>
                    <p>Lorem ipsum, dolor sit amet consectetur adipisicing elit. Repellendus consectetur quas sunt magnam eos dolores molestias fugit! Consectetur aperiam, neque minus facere, tempora nobis doloribus dolores quo sed esse rerum?</p>
                    <p>Lorem ipsum, dolor sit amet consectetur adipisicing elit. Repellendus consectetur quas sunt magnam eos dolores molestias fugit! Consectetur aperiam, neque minus facere, tempora nobis doloribus dolores quo sed esse rerum?</p>
                    <p>Lorem ipsum, dolor sit amet consectetur adipisicing elit. Repellendus consectetur quas sunt magnam eos dolores molestias fugit! Consectetur aperiam, neque minus facere, tempora nobis doloribus dolores quo sed esse rerum?</p>
                    <p>Lorem ipsum, dolor sit amet consectetur adipisicing elit. Repellendus consectetur quas sunt magnam eos dolores molestias fugit! Consectetur aperiam, neque minus facere, tempora nobis doloribus dolores quo sed esse rerum?</p>
                    <p>Lorem ipsum, dolor sit amet consectetur adipisicing elit. Repellendus consectetur quas sunt magnam eos dolores molestias fugit! Consectetur aperiam, neque minus facere, tempora nobis doloribus dolores quo sed esse rerum?</p>
                    <p>Lorem ipsum, dolor sit amet consectetur adipisicing elit. Repellendus consectetur quas sunt magnam eos dolores molestias fugit! Consectetur aperiam, neque minus facere, tempora nobis doloribus dolores quo sed esse rerum?</p>
                    <p>Lorem ipsum, dolor sit amet consectetur adipisicing elit. Repellendus consectetur quas sunt magnam eos dolores molestias fugit! Consectetur aperiam, neque minus facere, tempora nobis doloribus dolores quo sed esse rerum?</p>
                    <p>Lorem ipsum, dolor sit amet consectetur adipisicing elit. Repellendus consectetur quas sunt magnam eos dolores molestias fugit! Consectetur aperiam, neque minus facere, tempora nobis doloribus dolores quo sed esse rerum?</p>
                    <p>Lorem ipsum, dolor sit amet consectetur adipisicing elit. Repellendus consectetur quas sunt magnam eos dolores molestias fugit! Consectetur aperiam, neque minus facere, tempora nobis doloribus dolores quo sed esse rerum?</p>
                    <p>Lorem ipsum, dolor sit amet consectetur adipisicing elit. Repellendus consectetur quas sunt magnam eos dolores molestias fugit! Consectetur aperiam, neque minus facere, tempora nobis doloribus dolores quo sed esse rerum?</p>
                    <p>Lorem ipsum, dolor sit amet consectetur adipisicing elit. Repellendus consectetur quas sunt magnam eos dolores molestias fugit! Consectetur aperiam, neque minus facere, tempora nobis doloribus dolores quo sed esse rerum?</p>
                    <p>Lorem ipsum, dolor sit amet consectetur adipisicing elit. Repellendus consectetur quas sunt magnam eos dolores molestias fugit! Consectetur aperiam, neque minus facere, tempora nobis doloribus dolores quo sed esse rerum?</p>
                    <p>Lorem ipsum, dolor sit amet consectetur adipisicing elit. Repellendus consectetur quas sunt magnam eos dolores molestias fugit! Consectetur aperiam, neque minus facere, tempora nobis doloribus dolores quo sed esse rerum?</p>
                    <p>Lorem ipsum, dolor sit amet consectetur adipisicing elit. Repellendus consectetur quas sunt magnam eos dolores molestias fugit! Consectetur aperiam, neque minus facere, tempora nobis doloribus dolores quo sed esse rerum?</p>
                </Card>

            </main>
        </div >



    )
}

export default RegressionTestRuns;