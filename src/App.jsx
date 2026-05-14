import { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { selectIsDarkMode } from './redux/slices/themeSlice'
import { Route, Routes, Navigate } from 'react-router-dom'
import { Login } from './pages/Login/Login'
import { Register } from './pages/register/Register'
import { Home } from './pages/Home/Home'
import { ForgetPassword } from './pages/ForgetPassword/ForgetPassword'
import { ResetPassword } from './pages/ResetPassword/ResetPassword'
import { Navbar } from './components/Navbar/Navbar'
import { Profile } from './pages/Profile/Profile'
import { UserProfile } from './pages/Profile/UserProfile'
import { Messages } from './pages/Messages/Messages'
import { Search } from './pages/Search/Search'
import { PostDetails } from './pages/PostDetails/PostDetails'
import { Notifications } from './pages/Notifications/Notifications'
import { Toaster } from 'react-hot-toast'

function App() {
  const isDarkMode = useSelector(selectIsDarkMode)

  useEffect(() => {
    const theme = isDarkMode ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [isDarkMode])

  return (
    <div>
      <Toaster position="top-center" reverseOrder={false} />
      <Navbar />
      <Routes>
        <Route path='/' element={<Navigate to='/Login' replace />} />
        <Route path='/Login' element={<Login />} />
        <Route path='/Register' element={<Register />} />
        <Route path='/Home' element={<Home />} />
        <Route path='/forget-password' element={<ForgetPassword />} />
        <Route path='/reset-password/:token' element={<ResetPassword />} />
        <Route path='/profile' element={<Profile />} />
        <Route path='/user-profile/:id' element={<UserProfile />} />
        <Route path='/search' element={<Search />} />
        <Route path='/post/:id' element={<PostDetails />} />
        <Route path='/notifications' element={<Notifications />} />
        <Route path='/messages' element={<Messages />} />
      </Routes>
    </div>
  )
}

export default App
