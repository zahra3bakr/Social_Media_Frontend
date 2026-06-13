import { createContext , useState } from "react";

// sharing data between components without prop drilling
export const UserContext = createContext(null)

// receive any component as children
export function UserProvider ({children}){
    const [theme , setTheme] = useState('light')
    const [user, setUser] = useState(null)


    const toggleTheme = () => {
        // toggle between light and dark
        setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
    };

    // user data
    const updateUser = (newUserData) => {
        setUser((prevUser) => ({ ...prevUser, ...newUserData }));
    };

    return (
        <UserContext.Provider value={{ user, theme, toggleTheme, updateUser }}>
            {children}
        </UserContext.Provider>
    );
}