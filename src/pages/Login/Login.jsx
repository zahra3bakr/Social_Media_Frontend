import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useDispatch } from "react-redux"
import { loginSuccess } from "../../redux/slices/authSlice"
import { login } from "../../services/authService"
import { Button, Container, Form, InputGroup, Row, Col } from "react-bootstrap"
import { VscEye, VscEyeClosed } from "react-icons/vsc"
import toast from 'react-hot-toast'



export const Login = () => {
    // State Hooks
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [isPassword, setIsPassword] = useState(true) 
    const navigate = useNavigate()
    const dispatch = useDispatch() // send actions to the store

    const handleSubmit = async (e) => {
        e.preventDefault() // prevent from reloading

        try {
            // api call
            const data = await login({ email, password })

            if (data.token) {
                dispatch(loginSuccess({ token: data.token, user: data.user }))

                toast.success('Welcome Back!')

                navigate('/Home')
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Login Failed!")
        }
    }

    return (
        <div className='hero-section'>
            <Container>
                <Row className="w-100 m-0">
                    <Col md={7} lg={5} className="d-flex align-items-center" style={{ minHeight: '100vh' }}>
                        <Form onSubmit={handleSubmit} className='auth-card w-100'>
                            <h2 className='text-center'>Login</h2>

                            <Form.Group>
                                <Form.Label>Email</Form.Label>
                                <Form.Control
                                    type='email'
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </Form.Group>

                            <Form.Group>
                                <Form.Label>Password</Form.Label>
                                <InputGroup className="position-relative">
                                    <Form.Control
                                        type={isPassword ? 'password' : 'text'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        style={{ borderRadius: '50px', paddingRight: '45px' }}
                                    />
                                    <InputGroup.Text
                                        onClick={() => setIsPassword((prev) => !prev)}
                                        className='fs-5'
                                        style={{ 
                                            position: 'absolute', 
                                            right: '15px', 
                                            top: '12px', 
                                            zIndex: 10,
                                            cursor: 'pointer', 
                                            backgroundColor: 'transparent', 
                                            border: 'none', 
                                            color: '#666' 
                                        }}
                                    >
                                        {isPassword ? <VscEye /> : <VscEyeClosed />}
                                    </InputGroup.Text>
                                </InputGroup>
                                <div className="text-start mt-2 ms-3 my-4">
                                    <Link style={{ color: '#c00000', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 'bold' }} to='/forget-password'>Forget Password?</Link>
                                </div>
                            </Form.Group>

                            <Button type='submit' className='btn-login w-100 mt-2 mb-3'>Login</Button>

                            <p className='text-center mb-0' style={{ fontSize: '0.9rem', color: '#666' }}>
                                New user? <Link style={{ color: '#c00000', textDecoration: 'none', fontWeight: 'bold' }} to='/Register'>Create an account</Link>
                            </p>
                        </Form>
                    </Col>
                </Row>
            </Container>
        </div>
    )
}
