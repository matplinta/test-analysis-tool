import { useState, useEffect } from 'react';

import { Card } from 'primereact/card';
import { ScrollPanel } from 'primereact/scrollpanel';
import { Checkbox } from 'primereact/checkbox';

import { getTestFilters } from '../../services/test-results-analyzer/test-filters.service';

import './RegressionTestRuns.css'

let RegressionTestRuns = () => {

    const [testFilters, setTestFilters] = useState([]);
    const [selectedTestFilters, setSelectedTestFilters] = useState([]);

    let fetchTestFilters = () => {
        getTestFilters().then(
            (response) => {
                const testFiltersParsed = response.data.results.map(item => {
                    return { name: item.name, key: item.id }
                });
                setTestFilters(testFiltersParsed);
                setSelectedTestFilters(testFiltersParsed);
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

    const testFiltersCheckboxList = (
        testFilters.map((filter) => {
            return (

                <div key={filter.key} className="p-field-checkbox">
                    <Checkbox inputId={filter.key} name="regression-filter" value={filter} onChange={onTestFilterChange} checked={selectedTestFilters.some((item) => item.key === filter.key)} />
                    <label htmlFor={filter.key}>{filter.name}</label>
                </div>

            )
        })
    )


    useEffect(() => {
        fetchTestFilters();
    }, [])

    return (

        <div className="wrapper">
            <aside>
                <ScrollPanel style={{ width: '100%', height: '70vh' }} className="custombar1">
                    <p><strong>Filters</strong></p>
                    <div>
                        {testFiltersCheckboxList}
                    </div>
                </ScrollPanel>


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