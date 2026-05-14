import { useState } from "react"
import { Button, Container, Form, Row, Col } from "react-bootstrap"
import { Link } from "react-router-dom"
import { forgetPassword } from "../../services/authService"
import toast from 'react-hot-toast'

export const ForgetPassword = () => {
    const [email, setEmail] = useState('')
    const [message, setMessage] = useState('')

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            await forgetPassword(email)
            setMessage("Password reset email sent! Check your inbox.")
            toast.success("Password reset email sent!")
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to send email!")
        }
    }

    return (
        <div className='hero-section'>
            <Container>
                <Row className="w-100 m-0">
                    <Col md={7} lg={5} className="d-flex align-items-center" style={{ minHeight: '100vh' }}>
                        <Form onSubmit={handleSubmit} className='auth-card w-100'>
                            <h2 className='text-center mb-4'>Forget Password</h2>
                            
                            {message && <div className="alert alert-success text-center" style={{ borderRadius: '50px' }}>{message}</div>}

                            <Form.Group>
                                <Form.Label>Email</Form.Label>
                                <Form.Control
                                    type='email'
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </Form.Group>

                            <Button type='submit' className='btn-forget w-100 mt-4 mb-3'>Send Reset Link</Button>

                        </Form>
                    </Col>
                </Row>
            </Container>
        </div>
    )
}
