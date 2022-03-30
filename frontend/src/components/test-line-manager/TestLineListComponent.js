import { useEffect, useState } from "react";
import axios from 'axios';

let TestLineListComponent = () => {

    const [testLineList, setTestLineList] = useState([]);

    useEffect(() => {
        const fetchTestLineList = async () => {
            try {
                const {testLineList: response} = await axios.get('../../../data/TestLinesList.json');
                setTestLineList(response);
            } catch (error) {
                console.log(error.message);
            }
        }
        fetchTestLineList();
    }, []);

    return (
        <>
            <h1>Test Lines</h1>
        </>
    )
}

export default TestLineListComponent;