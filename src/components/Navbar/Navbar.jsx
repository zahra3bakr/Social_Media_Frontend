import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Navbar as BootstrapNavbar, Button, Container, Nav, Offcanvas, NavDropdown, Form, InputGroup, Badge } from 'react-bootstrap'
import { useSelector, useDispatch } from 'react-redux'
import { logout, switchAccount } from '../../redux/slices/authSlice'
import { selectIsDarkMode } from '../../redux/slices/themeSlice'
import { TbSocial } from "react-icons/tb";
import { AiOutlineLogin, AiOutlineLogout, AiOutlineSearch } from "react-icons/ai";
import API, { BASE_URL } from '../../services/api'

import { ThemeToggle } from '../ThemeToggle/ThemeToggle'

export const Navbar = () => {
    const navigate = useNavigate()
    const location = useLocation() // get current location
    const dispatch = useDispatch() // send action
    const isDarkMode = useSelector(selectIsDarkMode) // get data
    const { isLoggedIn, user, savedAccounts } = useSelector((state) => state.auth)
    const [searchTerm, setSearchTerm] = useState('')
    const [unreadCount, setUnreadCount] = useState(0)

    useEffect(() => {
        // If user is logged in, fetch unread notification count
        if (isLoggedIn) {
            fetchUnreadCount()
        }
    },
    // fixed in all pages 
    [isLoggedIn, location.pathname])

    // fetch unread notification count
    const fetchUnreadCount = async () => {
        try {
            const { data } = await API.get('/notifications');
            if (data.success) {
                //filter & Count the number of unread notifications(.length)
                const unread = data.notifications.filter(n => !n.isRead).length;
                setUnreadCount(unread);
            }
        } catch (error) {
            toast.error("Failed to load notifications");
        }
    }

    // handle search
    const handleSearch = (e) => {
        e.preventDefault()
        if (searchTerm.trim()) {
            // if search term is not empty 
            // encodeURIComponent to handle special characters(% & ? #)
            navigate(`/search?q=${encodeURIComponent(searchTerm)}`)
        }
    }

    const handleLogout = () => {
        dispatch(logout()) // state from authSlice
        navigate('/Login')
    }

    const handleSwitchAccount = (account) => {
        if (account.user._id === user?._id) return; // Already active
        dispatch(switchAccount(account));
        window.location.reload(); // full Reload for page 
    }

    const expand = "md";

    return (
        <BootstrapNavbar expand={expand} style={{ boxShadow: '0 4px 10px var(--border-color)', backgroundColor: 'var(--navbar-bg)' }} className="sticky-top custom-navbar" data-bs-theme={isDarkMode ? 'dark' : 'light'}>
            <Container>
                <BootstrapNavbar.Brand as={Link} to="/Home" style={{ fontWeight: 'bold', fontSize: '1.5rem' }}>
                    <TbSocial className='fs-1' style={{ color: '#dc3545' }} /> <span style={{ color: '#dc3545' }}>ConnectHub</span>
                </BootstrapNavbar.Brand>

                {isLoggedIn && (
                    <Form className="d-none d-md-flex mx-auto w-25" onSubmit={handleSearch}>
                        <InputGroup>
                            <Form.Control
                                type="search"
                                placeholder="Search..."
                                className="rounded-pill border-0 px-3"
                                style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-color)' }}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <Button variant="light" type="submit" className="rounded-pill ms-n5 bg-transparent border-0">
                                <AiOutlineSearch className="text-muted" />
                            </Button>
                        </InputGroup>
                    </Form>
                )}

                <BootstrapNavbar.Toggle aria-controls={`offcanvasNavbar-expand-${expand}`} />

                <BootstrapNavbar.Offcanvas
                    id={`offcanvasNavbar-expand-${expand}`}
                    aria-labelledby={`offcanvasNavbarLabel-expand-${expand}`}
                    placement="end"
                    style={{ backgroundColor: 'var(--navbar-bg)', color: 'var(--text-color)' }}
                >
                    <Offcanvas.Header closeButton data-bs-theme={isDarkMode ? 'dark' : 'light'}>
                        <Offcanvas.Title id={`offcanvasNavbarLabel-expand-${expand}`} style={{ fontWeight: 'bold' }}>
                            <TbSocial className='fs-2' style={{ color: '#dc3545' }} /> <span style={{ color: '#dc3545' }}>ConnectHub</span>
                        </Offcanvas.Title>
                    </Offcanvas.Header>

                    <Offcanvas.Body>
                        {isLoggedIn && (
                            <Form className="d-md-none mb-3" onSubmit={handleSearch}>
                                <InputGroup>
                                    <Form.Control
                                        type="search"
                                        placeholder="Search..."
                                        className="rounded-pill border-0 px-3"
                                        style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-color)' }}
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                    <Button variant="light" type="submit" className="rounded-pill bg-transparent border-0">
                                        <AiOutlineSearch className="text-muted" />
                                    </Button>
                                </InputGroup>
                            </Form>
                        )}
                        <Nav className="ms-auto align-items-md-center align-items-start gap-md-3" style={{ fontWeight: '600' }}>
                            <Nav.Link as={Link} to="/Home">Home</Nav.Link>

                            {isLoggedIn && (
                                <>
                                    <Nav.Link as={Link} to="/profile">Profile</Nav.Link>
                                    <Nav.Link as={Link} to="/messages">Messages</Nav.Link>
                                    <Nav.Link as={Link} to="/notifications" className="position-relative">
                                        Notifications
                                        {unreadCount > 0 && (
                                            <Badge 
                                                pill 
                                                bg="danger" 
                                                className="position-absolute translate-middle-y ms-1"
                                                style={{ fontSize: '0.6rem' }}
                                            >
                                                {unreadCount}
                                            </Badge>
                                        )}
                                    </Nav.Link>
                                </>
                            )}

                            <div className="d-md-none border-bottom w-100 my-2"></div>

                            <div className="ms-md-auto mt-3 mt-md-0 d-flex w-100 w-md-auto justify-content-start justify-content-md-end align-items-center gap-3">
                                <ThemeToggle />
                                
                                {isLoggedIn ? (
                                    <NavDropdown 
                                        title={
                                            <div className="d-flex align-items-center gap-2" style={{ display: 'inline-flex' }}>
                                                {user?.profilePicture ? (

                                                    // Display user's profile picture
                                                    <img src={`${BASE_URL}${user.profilePicture}`} alt="Avatar" className='rounded-circle border border-2 border-danger' style={{width: '40px', height: '40px', objectFit: 'cover'}} />
                                                ) : (
                                                    // Display user's initials
                                                    <div className='bg-primary text-white d-flex justify-content-center align-items-center rounded-circle border border-2 border-danger' style={{width: '40px', height: '40px', fontSize: '1.2rem', textTransform: 'uppercase'}}>
                                                        
                                                        {/* Display the first letter of the username */}
                                                        {user?.username?.charAt(0) || 'U'}
                                                    </div>
                                                )}
                                                <span className="d-md-none fw-bold ms-2" style={{ color: 'var(--text-color)' }}>{user?.username}</span>
                                            </div>
                                        } 
                                        id="accounts-dropdown"
                                        align={{ md: 'end' }}
                                        className="accounts-dropdown w-100"
                                    >
                                        <NavDropdown.Header className="fw-bold">Switch Accounts</NavDropdown.Header>
                                        {savedAccounts?.map((acc, index) => (
                                            <NavDropdown.Item 
                                                key={index} 
                                                onClick={() => handleSwitchAccount(acc)}
                                                className={acc.user._id === user?._id ? "bg-light" : ""}
                                                style={{ cursor: 'pointer' }}
                                            >
                                                <div className="d-flex align-items-center gap-3 py-1">
                                                    {acc.user.profilePicture ? (
                                                        <img src={`${BASE_URL}${acc.user.profilePicture}`} alt="Avatar" className='rounded-circle' style={{width: '35px', height: '35px', objectFit: 'cover'}} />
                                                    ) : (
                                                        <div className='bg-secondary text-white d-flex justify-content-center align-items-center rounded-circle' style={{width: '35px', height: '35px', fontSize: '1rem', textTransform: 'uppercase'}}>
                                                            {acc.user.username?.charAt(0) || 'U'}
                                                        </div>
                                                    )}
                                                    <span style={{fontWeight: acc.user._id === user?._id ? 'bold' : 'normal'}}>
                                                        {acc.user.username} {acc.user._id === user?._id && <span className="text-muted small">(Active)</span>}
                                                    </span>
                                                </div>
                                            </NavDropdown.Item>
                                        ))}
                                        <NavDropdown.Divider />
                                        <NavDropdown.Item as={Link} to="/Login">
                                            <span className="text-primary fw-bold px-2">+ Add existing account</span>
                                        </NavDropdown.Item>
                                        <NavDropdown.Item as={Link} to="/register">
                                            <span className="text-success fw-bold px-2">+ Add new account</span>
                                        </NavDropdown.Item>
                                        <NavDropdown.Item onClick={handleLogout}>
                                            <span className="text-danger fw-bold px-2"><AiOutlineLogout className='me-2 fs-5' /> Log out @{user?.username}</span>
                                        </NavDropdown.Item>
                                    </NavDropdown>
                                ) : (
                                    <Button as={Link} to="/Login" style={{ borderRadius: '50px', backgroundColor: '#c00000', border: 'none' }} className="w-100 w-md-auto">
                                        <AiOutlineLogin className='fs-3 d-flex justify-content-center align-items-center mx-auto' />
                                    </Button>
                                )}
                            </div>
                        </Nav>
                    </Offcanvas.Body>
                </BootstrapNavbar.Offcanvas>
            </Container>
        </BootstrapNavbar>
    )
}
