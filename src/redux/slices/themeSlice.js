import { createSlice } from '@reduxjs/toolkit';

const getInitialTheme = () => {
  // Check if user has previously chosen a theme
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) {
    return savedTheme === 'dark';
  }
  // Default to system preference if no saved theme
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

const initialState = {
  isDarkMode: getInitialTheme(),
};

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    // Toggle between light and dark
    toggleTheme: (state) => {
      state.isDarkMode = !state.isDarkMode; // !-> boolean value
      localStorage.setItem('theme', state.isDarkMode ? 'dark' : 'light'); 
    },

    // Set the theme
    setTheme: (state, action) => {
      state.isDarkMode = action.payload === 'dark';
    }
  },
});

export const { toggleTheme, setTheme } = themeSlice.actions;

//  Selector -> get data 
export const selectIsDarkMode = (state) => state.theme.isDarkMode;

export default themeSlice.reducer;
