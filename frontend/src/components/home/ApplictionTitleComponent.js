import './ApplictionTitleComponent.css';

let ApplictionTitleComponent = ({ appName }) => {
    return (
        <header className="application-header">
            <p>{appName}</p>
        </header>
    )
}

export default ApplictionTitleComponent;