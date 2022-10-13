// Description: File is responsible for managing form to perform Branch off procedure
// HISTORY
// --------------------------------------------------------------------------
//   Date                    Author                     Bug                 List of changes
//  --------------------------------------------------------------------------

import { useEffect, useState } from "react";

import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { SelectButton } from 'primereact/selectbutton';
import { Checkbox } from 'primereact/checkbox';

import { getBranches, postBranchOff } from './../../services/test-results-analyzer/test-filters.service';
import Notify, { AlertTypes, Successes, Errors, Warnings } from '../../services/Notify.js';


const BranchOffModal = ({ selectedTestSetFilters, showForm, handleFormClose, oldBranch }) => {

    const [branches, setBranches] = useState([]);
    const [selectedBranch, setSelectedBranch] = useState(null);

    const [isRemoveOldFiltersSet, setIsRemoveOldFiltersSet] = useState(false);
    const [isUnsubscribeOldFiltersSet, setIsUnsubscribeOldFiltersSet] = useState(false);

    let fetchBranches = () => {
        getBranches().then(
            (response) => {
                console.log(oldBranch)
                let branchesTmp = response.data.filter(branch => branch.name !== 'Trunk' && branch.name !== '' && branch.name !== oldBranch)
                let branchesParsed = branchesTmp.map(branch => ({ "name": branch.name, "value": branch.name }))
                setBranches(branchesParsed);
            },
            (error) => {
                Notify.sendNotification(Errors.GET_BRANCHES, AlertTypes.error);
            }
        )
    }

    const clearForm = () => {
        setSelectedBranch(null);
        setIsRemoveOldFiltersSet(false);
        setIsUnsubscribeOldFiltersSet(false);
    }

    const handlePerformBranchOff = () => {
        let branchOffData = {
            "new_branch": selectedBranch,
            "unsubscribe": isUnsubscribeOldFiltersSet,
            "delete": isRemoveOldFiltersSet,
            "testsetfilters": selectedTestSetFilters
        }

        if (selectedBranch !== null) {
            postBranchOff(branchOffData).then(
                (success) => {
                    clearForm();
                    handleFormCloseAndRefresh();
                    Notify.sendNotification(Successes.BRANCH_OFF, AlertTypes.success);
                },
                (error) => {
                    Notify.sendNotification(Errors.BRANCH_OFF, AlertTypes.error);
                })
        } else {
            Notify.sendNotification(Warnings.BRANCH_OFF, AlertTypes.warning)
        }

    }

    const handleFormCloseAndRefresh = () => {
        handleFormClose();
        clearForm();
    }

    useEffect(() => {
        fetchBranches();
    }, [oldBranch])

    return (
        <div>
            <Dialog header="Perform Branch Off" visible={showForm} className="dialog-style" onHide={handleFormCloseAndRefresh}>
                <div className="form-item">
                    <label htmlFor="newBranchName" className="block">Select new branch</label>
                    <SelectButton optionLabel="name" optionValue="value" value={selectedBranch} options={branches} onChange={(e) => setSelectedBranch(e.value)}></SelectButton>
                </div>
                <div className="form-item">
                    <Checkbox inputId="isRemoveOldFiltersSet" onChange={e => setIsRemoveOldFiltersSet(e.checked)} checked={isRemoveOldFiltersSet}></Checkbox>
                    <label htmlFor="isRemoveOldFiltersSet" className="p-checkbox-label" style={{ marginLeft: '7px' }}> Remove Test Set Filters with old branch</label>
                </div>
                <div className="form-item">
                    <Checkbox inputId="unsubscribeOldFiltersSet" onChange={e => setIsUnsubscribeOldFiltersSet(e.checked)} checked={isUnsubscribeOldFiltersSet}></Checkbox>
                    <label htmlFor="unsubscribeOldFiltersSet" className="p-checkbox-label" style={{ marginLeft: '7px' }}> Unsubscribe Test Set Filters with old branch</label>
                </div>

                <div className="form-item">
                    <Button className="p-button-primary " type="submit" onClick={handlePerformBranchOff}>
                        Perform Branch Off
                    </Button>
                    <Button className="p-button-primary " type="submit" onClick={clearForm}>
                        Clear Form
                    </Button>
                </div>
            </Dialog >

        </div >
    )
}

export default BranchOffModal;