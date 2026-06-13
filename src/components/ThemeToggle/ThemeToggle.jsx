import { useSelector, useDispatch } from 'react-redux';
import { toggleTheme, selectIsDarkMode } from '../../redux/slices/themeSlice';
import { Button } from 'react-bootstrap';
import { MdOutlineLightMode, MdOutlineDarkMode } from "react-icons/md";

// Toggle between light and dark
export const ThemeToggle = ({ size = '40px' }) => {
    const isDarkMode = useSelector(selectIsDarkMode); 
    const dispatch = useDispatch(); 

    return (
        <Button 
            variant="light" 
            onClick={() => dispatch(toggleTheme())}
            className="theme-toggle-btn rounded-circle border-2 d-flex align-items-center justify-content-center"
            style={{ 
                width: size, 
                height: size, 
                padding: '0',
                flexShrink: 0,
                border: 'none',
                backgroundColor: 'var(--input-bg)',
                color: 'var(--text-color)',
                transition: 'all 0.3s ease'
            }}
        >
            {isDarkMode ? <MdOutlineLightMode className="fs-4" /> : <MdOutlineDarkMode className="fs-4" />}
        </Button>
    );
};


