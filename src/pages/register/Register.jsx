import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register } from '../../services/authService'
import { Button, Container, Form, Row, Col, InputGroup } from 'react-bootstrap'
import { VscEye, VscEyeClosed } from 'react-icons/vsc'
import toast from 'react-hot-toast'
import { useDispatch } from "react-redux"
import { loginSuccess } from "../../redux/slices/authSlice"

export const Register = () => {
    const [formData , setFormData] = useState({username: '' , email: '' , password: ''})
    const [isPassword , setIsPassword] = useState(true)
    const navigate = useNavigate()
    const dispatch = useDispatch()

    // put inputs in one object (the diff that not in login)
    const handleChange = (e) => setFormData({...formData , [e.target.name]: e.target.value})

    const handleSubmit = async (e) => {
        e.preventDefault()

        try {
            const data = await register(formData)

            dispatch(loginSuccess({ token: data.token, user: data.user }))

            toast.success("Account Created Successfully! Welcome 🎉")
            navigate('/Home')

        } catch (error) {
            toast.error(error.response?.data?.message || "Registration Failed!")
        }
    }

  return (
    <>
        <div className='hero-section'>
            <Container>
                <Row className="w-100 m-0">
                    <Col md={7} lg={5} className="d-flex align-items-center" style={{ minHeight: '100vh' }}>
                        <Form onSubmit={handleSubmit} className='auth-card w-100'>
                            <h2 className='text-center'>Create New<br/>Account</h2>

                            <Form.Group>
                                <Form.Label>Name</Form.Label>
                                <Form.Control
                                    name='username'
                                    onChange={handleChange}
                                    required
                                />
                            </Form.Group>

                            <Form.Group>
                                <Form.Label>Email</Form.Label>
                                <Form.Control
                                    name='email'
                                    type='email'
                                    onChange={handleChange}
                                    required
                                />
                            </Form.Group>

                            <Form.Group>
                                <Form.Label>Password</Form.Label>
                                <InputGroup className="position-relative">
                                    <Form.Control
                                        name='password'
                                        type={isPassword ? 'password' : 'text'}
                                        onChange={handleChange}
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
                            </Form.Group>

                            <Button type='submit' className='btn-register w-100 mt-2 mb-3'>Sign Up</Button>

                            <p className='text-center mb-0' style={{ fontSize: '0.9rem', color: '#666' }}> 
                                Already Registered? <Link style={{ color: '#c00000', textDecoration: 'none', fontWeight: 'bold' }} to='/Login'>Login</Link>
                            </p>
                        </Form>
                    </Col>
                </Row>
            </Container>
        </div>
    </>
  )
}
