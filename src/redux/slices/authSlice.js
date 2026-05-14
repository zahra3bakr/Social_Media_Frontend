import { createSlice } from '@reduxjs/toolkit';

// Check if user is already logged in from localStorage
const userToken = localStorage.getItem('userToken');
const userInfo = localStorage.getItem('userInfo');

// Get Saved Accounts Array
const savedAccountsStr = localStorage.getItem('savedAccounts');
let savedAccounts = [];
try {
    const rawAccounts = savedAccountsStr ? JSON.parse(savedAccountsStr) : [];
    // Ensure uniqueness by ID (check both _id and id)
    const uniqueMap = new Map();
    rawAccounts.forEach(acc => {
        const uid = acc.user?._id || acc.user?.id;
        if (uid) {
            uniqueMap.set(String(uid), acc);
        }
    });
    savedAccounts = Array.from(uniqueMap.values());
} catch (e) {
    savedAccounts = [];
}


let parsedUser = null;
try {
    parsedUser = userInfo ? JSON.parse(userInfo) : null;
} catch (e) {
    parsedUser = null;
}

// Ensure the current user is in savedAccounts if not already
if (parsedUser && userToken) {
    const currentId = String(parsedUser._id || parsedUser.id);
    const exists = savedAccounts.find(acc => String(acc.user?._id || acc.user?.id) === currentId);
    if (!exists) {
        savedAccounts.push({ token: userToken, user: parsedUser });
        localStorage.setItem('savedAccounts', JSON.stringify(savedAccounts));
    }
}

const initialState = {
    isLoggedIn: !!userToken,
    token: userToken || null,
    user: parsedUser,
    savedAccounts: savedAccounts, // array of { token, user }
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        loginSuccess: (state, action) => {
            const { token, user } = action.payload;
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

            // Also update this user in savedAccounts to ensure token/info is fresh
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
                        ...state.savedAccounts[existingIndex],
                        user: updatedUser
                    };
                } else {
                    // If not found (shouldn't happen), add it
                    state.savedAccounts.push({ token: state.token, user: updatedUser });
                }
                localStorage.setItem('savedAccounts', JSON.stringify(state.savedAccounts));
            }
        },


        logout: (state) => {

            // We keep the accounts in savedAccounts, just log out the active session
            state.isLoggedIn = false;
            state.token = null;
            state.user = null;
            
            localStorage.removeItem('userToken');
            localStorage.removeItem('userInfo');
        }
    }
});

export const { loginSuccess, logout, switchAccount, updateUser } = authSlice.actions;

export default authSlice.reducer;
