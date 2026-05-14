import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, ListGroup, Spinner, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { GoHeart } from "react-icons/go";
import { FaRegComment, FaUserPlus, FaEnvelope } from "react-icons/fa6";
import API from '../../services/api';
import toast from 'react-hot-toast';
import '../../Sass/style.scss';

export const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchNotifications();
        markAsRead();
    }, []);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const { data } = await API.get('/notifications');
            if (data.success) {
                setNotifications(data.notifications);
            }
        } catch (error) {
            console.error("Error fetching notifications:", error);
            toast.error("Failed to load notifications");
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async () => {
        try {
            await API.patch('/notifications/read');
        } catch (error) {
            console.error("Error marking as read:", error);
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'like': return <GoHeart className="text-danger" />;
            case 'comment': return <FaRegComment className="text-primary" />;
            case 'follow': return <FaUserPlus className="text-success" />;
            case 'message': return <FaEnvelope className="text-info" />;
            case 'reply': return <FaRegComment className="text-warning" />;
            default: return null;
        }
    };

    const getMessage = (notif) => {
        const sender = notif.senderId?.username || 'Someone';
        switch (notif.type) {
            case 'like': return <span><b>@{sender}</b> liked your post</span>;
            case 'comment': return <span><b>@{sender}</b> commented on your post</span>;
            case 'follow': return <span><b>@{sender}</b> started following you</span>;
            case 'message': return <span><b>@{sender}</b> sent you a message</span>;
            case 'reply': return <span><b>@{sender}</b> replied to your comment</span>;
            default: return 'New notification';
        }
    };

    const handleNotificationClick = (notif) => {
        const targetId = notif.postId?._id || notif.postId;
        if (targetId && (notif.type === 'like' || notif.type === 'comment' || notif.type === 'reply')) {
            navigate(`/post/${targetId}`);
        } else if (notif.type === 'follow') {
            const senderId = notif.senderId?._id || notif.senderId;
            if (senderId) navigate(`/user-profile/${senderId}`);
        } else if (notif.type === 'message') {
            navigate('/messages');
        }
    };

    const getImageUrl = (path) => path ? `${import.meta.env.VITE_API_URL}${path}` : 'https://cdn-icons-png.flaticon.com/512/149/149071.png';

    return (
        <Container className="py-4">
            <Row className="justify-content-center">
                <Col md={8}>
                    <Card className="glass-card border-0 shadow-sm">
                        <Card.Body className="p-0">
                            <div className="p-4 border-bottom d-flex justify-content-between align-items-center">
                                <h4 className="mb-0 fw-bold">Notifications</h4>
                                <Button variant="link" className="text-danger text-decoration-none p-0" onClick={fetchNotifications}>Refresh</Button>
                            </div>
                            
                            {loading ? (
                                <div className="text-center py-5">
                                    <Spinner animation="border" variant="danger" />
                                </div>
                            ) : notifications.length === 0 ? (
                                <div className="text-center py-5 text-muted">
                                    <h5 className="mt-3">No notifications yet</h5>
                                    <p>When someone interacts with you, you'll see it here.</p>
                                </div>
                            ) : (
                                <ListGroup variant="flush">
                                    {notifications.map(notif => (
                                        <ListGroup.Item 
                                            key={notif._id} 
                                            className={`p-3 border-0 border-bottom d-flex align-items-center gap-3 notification-item ${notif.isRead ? '' : 'unread'}`}
                                            onClick={() => handleNotificationClick(notif)}
                                            style={{ cursor: 'pointer', transition: 'background 0.2s' }}
                                        >
                                            <div className="position-relative">
                                                <img 
                                                    src={getImageUrl(notif.senderId?.profilePicture)} 
                                                    alt="Sender" 
                                                    className="rounded-circle"
                                                    style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                                                />
                                                <div className="position-absolute bottom-0 end-0 bg-white rounded-circle p-1 shadow-sm d-flex align-items-center justify-content-center" style={{ width: '22px', height: '22px' }}>
                                                    {getIcon(notif.type)}
                                                </div>
                                            </div>
                                            <div className="flex-grow-1">
                                                <div className="d-flex justify-content-between">
                                                    <p className="mb-0">{getMessage(notif)}</p>
                                                    <small className="text-muted">{new Date(notif.createdAt).toLocaleDateString()}</small>
                                                </div>
                                                {notif.postId && (
                                                    <small className="text-muted d-block text-truncate mt-1" style={{ maxWidth: '300px' }}>
                                                        "{notif.postId.content}"
                                                    </small>
                                                )}
                                            </div>
                                            {!notif.isRead && <div className="bg-danger rounded-circle" style={{ width: '10px', height: '10px' }}></div>}
                                        </ListGroup.Item>
                                    ))}
                                </ListGroup>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};
