import { useState, useEffect, useRef } from 'react';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Link } from 'react-router-dom';

import { getUserSummary } from '../../services/test-results-analyzer/statistics.service';
import Notify, { AlertTypes, Errors } from '../../services/Notify';
import './SummaryComponent.css';

const SummaryComponent = () => {

    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(false);

    let fetchUserSummary = () => {
        setLoading(true)
        getUserSummary().then(
            (response) => {
                setSummary(response.data);
            },
            (error) => {
                Notify.sendNotification(Errors.FETCH_SUMMARY, AlertTypes.error);
            }
            )
        setLoading(false)
    }

    let generateCard = (title, value, description, size = 6, icon = "pi-shopping-cart", color = "blue", coloredDesc = "") => {
        return (
            <div className={`col-12 px-6 pb-6 md:col-6 lg:col-${size}`}>
                <div className="surface-card shadow-2 p-3 border-round">
                    <div className="flex justify-content-between mb-3">
                        <div>
                            <span className="block text-lg font-light mb-3">{title}</span>
                            <div className="text-900 font-medium text-xl">{value}</div>
                        </div>
                        <div className={`flex align-items-center justify-content-center bg-${color}-100 border-round`} style={{ width: '3rem', height: '3rem' }}>
                            <i className={`pi ${icon} text-${color}-500 text-2xl`}></i>
                        </div>
                    </div>
                    <span className="text-green-500 font-medium">{coloredDesc}</span>
                    <span className="text-500">{description}</span>
                </div>
            </div>
        )
    }

    let generateCardTestInstances = (title, value, description, size = 6, icon = "pi-shopping-cart", color = "blue", coloredDesc = "", state = null) => {

        return (
            <div className={`col-12 px-6 pb-6 md:col-6 lg:col-${size}`}>
                <div className="surface-card shadow-2 p-3 border-round">
                    <div className="flex justify-content-between mb-3">
                        <div>
                            <Link to='/test-instances' state={state}>
                                <span className="block text-lg font-light mb-3">{title}</span>
                            </Link>
                            <div className="text-900 font-medium text-xl">{value}</div>
                        </div>
                        <div className={`flex align-items-center justify-content-center bg-${color}-100 border-round`} style={{ width: '3rem', height: '3rem' }}>
                            <i className={`pi ${icon} text-${color}-500 text-2xl`}></i>
                        </div>
                    </div>
                    <span className="text-green-500 font-medium">{coloredDesc}</span>
                    <span className="text-500">{description}</span>
                </div>
            </div>
        )
    }

    let countPercent = (numeral, denominator) => {
        if (denominator === 0) {
            return 0
        }
        else
            return Math.round(numeral * 100 / denominator)
    }

    useEffect(() => {
        fetchUserSummary();
    }, [])

    return (
        <>
            {summary !== null && loading === false ?
                <div className="summarySurfaceBackground px-4 py-8 md:px-6 lg:px-8">
                    <div className="grid">
                        <div className={`col-12 px-6 pb-4 md:col-12 lg:col-12`}>
                            <h3>{`Summary of the latest FB's runs`}</h3>
                        </div>
                        {generateCard('Latest Feature Build', summary.current_fb, '', 3, "pi-bolt", "green")}
                        {generateCard('All test runs', summary.all_in_fb_count, '', 3, "pi-database", "blue")}
                        {generateCard('Test runs (passed / not analyzed / environment issue / failed / blocked)',
                            `${countPercent(summary.passed.count, summary.all_in_fb_count)}% / ` +
                            `${countPercent(summary.not_analyzed.count, summary.all_in_fb_count)}% / ` +
                            `${countPercent(summary.env_issues.count, summary.all_in_fb_count)}% / ` +
                            `${countPercent(summary.failed.count, summary.all_in_fb_count)}% / ` +
                            `${countPercent(summary.blocked.count, summary.all_in_fb_count)}%`,
                            '', 6, "pi-percentage", "indigo")}
                        {generateCardTestInstances('Suspended Test Instances',
                            `${summary.test_instances.suspended} (${countPercent(summary.test_instances.suspended, summary.test_instances.all)}%)`,
                            '', 6, "pi-ban", "red", "", { execution_suspended: true })}
                        {generateCardTestInstances('No Run Test Instances',
                            `${summary.test_instances.no_run} (${countPercent(summary.test_instances.no_run, summary.test_instances.all)}%)`,
                            '', 6, "pi-times-circle", "pink", "", { no_run_in_rp: true })}
                        {generateCard('Not Analyzed', summary.not_analyzed.count, summary.not_analyzed.top, 6, "pi-question-circle", "yellow",
                            `Top (${summary.not_analyzed.top_count_percent}%): `)}
                        {generateCard('Environment Issues', summary.env_issues.count, summary.env_issues.top, 6, "pi-undo", "purple",
                            `Top (${summary.env_issues.top_count_percent}%): `)}
                    </div>
                </div> :
                <div className="loader-container">
                    <div className="spinner"></div>
                </div>
            }
        </>
    )
}

export default SummaryComponent;