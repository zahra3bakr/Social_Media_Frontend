import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import API, { BASE_URL } from '../../services/api';
import { Container, Row, Col, Nav, Card, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import '../../Sass/style.scss';

export const Search = () => {
    const [searchParams] = useSearchParams();
    const query = searchParams.get('q') || '';
    const [activeTab, setActiveTab] = useState('users');
    const [users, setUsers] = useState([]);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(false);

    const { user: currentUser } = useSelector((state) => state.auth);
    const currentUserId = currentUser?._id || currentUser?.id;

    useEffect(() => {
        if (query) {
            fetchResults();
        }
    }, [query, activeTab]);

    const fetchResults = async () => {
        setLoading(true);
        try {
            if (activeTab === 'users') {
                const { data } = await API.get(`/search/users?query=${query}`);
                setUsers(data.users);
            } else {
                const { data } = await API.get(`/search/posts?query=${query}`);
                setPosts(data.posts);
            }
        } catch (error) {
            console.error("Search error:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container className="py-4 search-page">
            <Row>
                <Col md={3}>
                    <Card className="shadow-sm border-0 mb-4 sticky-top" style={{ top: '80px' }}>
                        <Card.Body className="p-0">
                            <Nav variant="pills" className="flex-column p-2 side-menu">
                                <Nav.Item>
                                    <Nav.Link
                                        active={activeTab === 'users'}
                                        onClick={() => setActiveTab('users')}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        Users
                                    </Nav.Link>
                                </Nav.Item>
                                <Nav.Item>
                                    <Nav.Link
                                        active={activeTab === 'posts'}
                                        onClick={() => setActiveTab('posts')}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        Posts
                                    </Nav.Link>
                                </Nav.Item>
                            </Nav>
                        </Card.Body>
                    </Card>
                </Col>

                <Col md={9}>
                    <h4 className="mb-4">
                        Search results for: <span className="text-danger">"{query}"</span>
                    </h4>

                    {loading ? (
                        <div className="text-center py-5">
                            <Spinner animation="border" variant="danger" />
                        </div>
                    ) : (
                        <div className="results-container">
                            {activeTab === 'users' ? (
                                users.length > 0 ? (
                                    users.map(user => {
                                        const isMe = String(user._id) === String(currentUserId);
                                        const profileLink = isMe ? '/profile' : `/user-profile/${user._id}`;

                                        return (
                                            <Card key={user._id} className="mb-3 shadow-sm border-0 glass-card">
                                                <Card.Body className="d-flex align-items-center gap-3">
                                                    <img
                                                        src={user.profilePicture ? `${BASE_URL}${user.profilePicture}` : 'https://cdn-icons-png.flaticon.com/512/149/149071.png'}
                                                        alt={user.username}
                                                        className="rounded-circle"
                                                        style={{ width: '60px', height: '60px', objectFit: 'cover' }}
                                                    />
                                                    <div>
                                                        <h6 className="mb-0 fw-bold">{user.name || user.username}</h6>
                                                        <small className="text-muted">@{user.username}</small>
                                                    </div>
                                                    <Link to={profileLink} className="ms-auto btn btn-outline-danger btn-sm rounded-pill px-3">
                                                        View Profile
                                                    </Link>
                                                </Card.Body>
                                            </Card>
                                        );
                                    })
                                ) : (
                                    <div className="text-center py-5 text-muted">
                                        No users found matching "{query}"
                                    </div>
                                )
                            ) : (
                                posts.length > 0 ? (
                                    posts.map(post => (
                                        <Card key={post._id} className="mb-3 shadow-sm border-0 glass-card" style={{ cursor: 'pointer' }}>
                                            <Link to={`/post/${post._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                                <Card.Body>
                                                    <div className="d-flex align-items-center gap-2 mb-3">
                                                        <img
                                                            src={post.userId.profilePicture ? `${BASE_URL}${post.userId.profilePicture}` : 'https://cdn-icons-png.flaticon.com/512/149/149071.png'}
                                                            alt={post.userId.username}
                                                            className="rounded-circle"
                                                            style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                                                        />
                                                        <span className="fw-bold">@{post.userId.username}</span>
                                                        <small className="text-muted ms-auto">{new Date(post.createdAt).toLocaleDateString()}</small>
                                                    </div>
                                                    <p className="mb-0">{post.content}</p>
                                                    {post.tags && post.tags.length > 0 && (
                                                        <div className="mt-2">
                                                            {post.tags.map((tag, i) => (
                                                                <span key={i} className="text-primary me-2 small">#{tag}</span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </Card.Body>
                                            </Link>
                                        </Card>
                                    ))
                                ) : (
                                    <div className="text-center py-5 text-muted">
                                        No posts found matching "{query}"
                                    </div>
                                )
                            )}
                        </div>
                    )}
                </Col>
            </Row>
        </Container>
    );
};

