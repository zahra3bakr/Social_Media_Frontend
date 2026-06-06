import API from "./api"

export const login = async (userData) => {
    const response = await API.post('/auth/login' , userData)
    return response.data
}

export const register = async (userData) => {
    const response = await API.post('/auth/register' , userData)
    return response.data
}

export const forgetPassword = async (email) => {
    const response = await API.post('/auth/forgetPassword' , { email })
    return response.data
}   

export const resetPassword = async (token, password) => {
    const response = await API.put(`/auth/resetPassword/${token}` , { password })
    return response.data
}
