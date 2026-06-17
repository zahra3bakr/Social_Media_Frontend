import { createSlice } from '@reduxjs/toolkit';

// read data from localStorage
const userToken = localStorage.getItem('userToken');
const userInfo = localStorage.getItem('userInfo');

// savedAccounts (switch accounts)
const savedAccountsStr = localStorage.getItem('savedAccounts');
let savedAccounts = [];
try {
    const rawAccounts = savedAccountsStr ? JSON.parse(savedAccountsStr) : []; // parse text to array

    // remove duplicates by id for each account
    const uniqueMap = new Map();
    rawAccounts.forEach(acc => {
        const uid = acc.user?._id || acc.user?.id; // get id

        // check if id already exists
        if (uid) {
            uniqueMap.set(String(uid), acc);
        }
    });

    // convert map to array
    savedAccounts = Array.from(uniqueMap.values());
} catch (e) {
    savedAccounts = [];
}

// savedAccounts for single user
let parsedUser = null;
try {
    parsedUser = userInfo ? JSON.parse(userInfo) : null;
} catch (e) {
    parsedUser = null;
}

// check the current user is in savedAccounts 
if (parsedUser && userToken) {
    const currentId = String(parsedUser._id || parsedUser.id);
    const exists = savedAccounts.find(acc => String(acc.user?._id || acc.user?.id) === currentId);
    if (!exists) {
        // add current user
        savedAccounts.push({ token: userToken, user: parsedUser });
        localStorage.setItem('savedAccounts', JSON.stringify(savedAccounts));
    }
}

const initialState = {
    isLoggedIn: !!userToken, // convert any value to boolean
    token: userToken || null,
    user: parsedUser,
    savedAccounts: savedAccounts, 
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        loginSuccess: (state, action) => {
            const { token, user } = action.payload; // recieved from api
            state.isLoggedIn = true;
            state.token = token;
            state.user = user;
            
            localStorage.setItem('userToken', token);
            localStorage.setItem('userInfo', JSON.stringify(user));

            // Update or Add in savedAccounts
            const userId = String(user._id || user.id);
            const existingIndex = state.savedAccounts.findIndex(acc => String(acc.user?._id || acc.user?.id) === userId);
            
            if (existingIndex >= 0) {  
                state.savedAccounts[existingIndex] = { token, user };
            } else {
                state.savedAccounts.push({ token, user });
            }
            
            localStorage.setItem('savedAccounts', JSON.stringify(state.savedAccounts));
        },
        switchAccount: (state, action) => {
            const { token, user } = action.payload;
            state.isLoggedIn = true;
            state.token = token;
            state.user = user;
            
            localStorage.setItem('userToken', token);
            localStorage.setItem('userInfo', JSON.stringify(user));

            // update user in savedAccounts to ensure data is fresh
            const userId = String(user._id || user.id);
            const existingIndex = state.savedAccounts.findIndex(acc => String(acc.user?._id || acc.user?.id) === userId);
            if (existingIndex >= 0) {
                state.savedAccounts[existingIndex] = { token, user };
                localStorage.setItem('savedAccounts', JSON.stringify(state.savedAccounts));
            }
        },
        updateUser: (state, action) => {
            const updatedUser = action.payload;
            state.user = updatedUser;
            localStorage.setItem('userInfo', JSON.stringify(updatedUser));
            
            // Update in savedAccounts as well
            if (state.savedAccounts) {
                const userId = String(updatedUser._id || updatedUser.id);
                const existingIndex = state.savedAccounts.findIndex(acc => String(acc.user?._id || acc.user?.id) === userId);
                if (existingIndex >= 0) {
                    state.savedAccounts[existingIndex] = {
                        // change only user not token 
                        ...state.savedAccounts[existingIndex],
                        user: updatedUser
                    };
                } else {
                    state.savedAccounts.push({ token: state.token, user: updatedUser });
                }
                localStorage.setItem('savedAccounts', JSON.stringify(state.savedAccounts));
            }
        },


        // we keep savedAccounts so other accounts still work
        logout: (state) => {
            state.isLoggedIn = false;
            state.token = null;
            state.user = null;
            
            localStorage.removeItem('userToken');
            localStorage.removeItem('userInfo');
        } ,

        removeAccount: (state,action) => {
            state.savedAccounts = state.savedAccounts.filter(
                acc => acc.user._id !== action.payload
            )

            localStorage.setItem('savedAccounts', JSON.stringify(state.savedAccounts));
        }
    }
});

export const { loginSuccess, logout, switchAccount, updateUser , removeAccount} = authSlice.actions;

export default authSlice.reducer;
