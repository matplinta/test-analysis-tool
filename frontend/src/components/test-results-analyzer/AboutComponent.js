import { useState, useEffect, useRef } from 'react';
import { Card } from 'primereact/card';

import about_banner from './../../assets/about_banner.jpg';

const AboutComponent = () => {

    const header = (
        <img alt="Card" src={about_banner} />
    );

    return (
        <>
            <div className="p-2">
                <div className="card">
                    <Card title="About the tool" header={header}>
                        <p className="m-2">
                            Test Results Analyzer is an internal, convenience tool developed in order to facilitate ET test reporting and errors analysis. Main objective of the tool is to specify groups of fail message regexes by which test runs gathered from Reporting Portal will be analyzed, then the system automatically analizes test runs. This kind of process is especially useful when dealing with long-existing environmental issues, which hinder regression scheduling. 
                            <br></br>Addional features include:
                            <ul>
                                <li>
                                    Regression view - a dynamic view with only the test runs that you are interested in, selected based on subscribed Test Sets
                                </li>
                                <li>
                                    Test Instances view - a dynamic view with only the test instances that you are interested in, selected based on subscribed Test Sets
                                </li>
                                <li>
                                    Statistics view - get a chart or excel file with statistics of number of occurrences of particular errors of your tests
                                </li>
                            </ul>
                            It is worth mentioning that this tool is a wraparoud solution based on Reporting Portal, and is in no way supposed to replace that tool. 
                            <br/>
                            <br/>
                            <h5>New issues or improvement ideas can be issued on this <a href='https://jiradc.ext.net.com/projects/KRKAUTO/issues/'>JIRA</a>.</h5>
                            <h5>Learning materials are located <a href='https://.sharepoint.com/:f:/s/SC4G_FZM_PET/Ekksuo_ruaVDhGnAdVgePgABrq7P8IdCBXuRZk-z0POc2Q?e=gltYOf'>here</a>.</h5>
                        </p>
                    </Card>
                </div>
            </div>
        </>
    )
}

export default AboutComponent;