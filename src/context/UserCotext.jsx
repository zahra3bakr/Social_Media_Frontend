import { createContext , useState } from "react";

export const UserContext = createContext(null)

export function UseProvider ({children}){
    const [theme , setTheme] = useState('light')

    
    const toggleTheme = () => {
        setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
    };

    const updateUser = (newUserData) => {
        setUser((prevUser) => ({ ...prevUser, ...newUserData }));
    };

    return (
        <UserContext.Provider value={{ user, theme, toggleTheme, updateUser }}>
            {children}
        </UserContext.Provider>
    );
}