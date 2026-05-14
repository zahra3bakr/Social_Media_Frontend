import { useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { resetPassword } from "../../services/authService"
import { Button, Container, Form, InputGroup, Row, Col } from "react-bootstrap"
import toast from 'react-hot-toast'
import { VscEye, VscEyeClosed } from "react-icons/vsc"

export const ResetPassword = () => {
    const [password, setPassword] = useState('')
    const [isPassword, setIsPassword] = useState(true)
    const { token } = useParams()
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            await resetPassword(token, password)
            toast.success("Password reset successfully! You can now login.")
            navigate('/Login')
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to reset password!")
        }
    }

    return (
        <div className='hero-section'>
            <Container>
                <Row className="w-100 m-0">
                    <Col md={7} lg={5} className="d-flex align-items-center" style={{ minHeight: '100vh' }}>
                        <Form onSubmit={handleSubmit} className='auth-card w-100'>
                            <h2 className='text-center mb-4'>Reset Password</h2>

                            <Form.Group>
                                <Form.Label>New Password</Form.Label>
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
                            </Form.Group>

                            <Button type='submit' className='btn-reset w-100 mt-4 mb-3'>Save New Password</Button>
                        </Form>
                    </Col>
                </Row>
            </Container>
        </div>
    )
}
