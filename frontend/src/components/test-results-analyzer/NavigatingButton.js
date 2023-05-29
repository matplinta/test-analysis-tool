import { useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';


const NavigatingButton = ({navigatePath, children, className, disabled=false, ...props}) => {

    const navigate = useNavigate();

    const handleMouseDown = (event) => {
        if (event.button === 0) {
            //left mouse button clicked
            navigate(navigatePath)
        } 
    };  

    if (disabled) {
        return (
            <Button disabled className={className} {...props} >{children}</Button>
        )
    } else {
        return (
            <a href={navigatePath} target="_blank" rel="noopener noreferrer" onMouseDown={handleMouseDown} >
                <Button className={className} {...props}>{children}</Button>
            </a>
        );
    }
    
}

export default NavigatingButton;
