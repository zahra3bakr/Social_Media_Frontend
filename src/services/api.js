import axios from "axios";

const API_URL = import.meta.env.MODE === 'development' 
    ? "http://localhost:8080/api" 
    : (import.meta.env.VITE_API_URL || "https://socialmediabackend-production-35d9.up.railway.app/api")
export const BASE_URL = API_URL.replace('/api', '')

const API = axios.create({
    baseURL: API_URL
})


API.interceptors.request.use((req) => {
    const token = localStorage.getItem('userToken')

    //prevent sending token for login/register requests 
    if (token) {
        req.headers.Authorization = `Bearer ${token}`
    }

    return req
})

export default API
