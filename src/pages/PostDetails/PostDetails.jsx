import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Spinner, Form, Dropdown, Modal } from 'react-bootstrap';
import { GoHeart } from "react-icons/go";
import { FaRegComment, FaArrowLeft } from "react-icons/fa6";
import { BsThreeDots } from "react-icons/bs";
import { useSelector } from 'react-redux';
import API, { BASE_URL } from '../../services/api';
import toast from 'react-hot-toast';
import '../../Sass/style.scss';

export const PostDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [comments, setComments] = useState([]);
    const [fetchingComments, setFetchingComments] = useState(false);
    const [commentText, setCommentText] = useState("");
    const [replyText, setReplyText] = useState("");
    const [activeReplyId, setActiveReplyId] = useState(null);

    const { user: currentUser } = useSelector((state) => state.auth);

    // Edit Post States
    const [showEditModal, setShowEditModal] = useState(false);
    const [editContent, setEditContent] = useState("");
    const [editLoading, setEditLoading] = useState(false);

    // Edit Comment States
    const [showEditCommentModal, setShowEditCommentModal] = useState(false);
    const [editingComment, setEditingComment] = useState(null);
    const [editCommentText, setEditCommentText] = useState("");
    const [editCommentLoading, setEditCommentLoading] = useState(false);

    useEffect(() => {
        fetchPost();
        fetchComments();
    }, [id]);

    const fetchPost = async () => {
        try {
            setLoading(true);
            const { data } = await API.get(`/posts/${id}`);
            if (data.success) {
                setPost(data.post);
            }
        } catch (error) {
            console.error("Error fetching post:", error);
            toast.error("Post not found");
            navigate('/Home');
        } finally {
            setLoading(false);
        }
    };

    const fetchComments = async () => {
        try {
            setFetchingComments(true);
            const { data } = await API.get(`/posts/postcomment/${id}`);
            if (data.success) {
                setComments(data.comments);
            }
        } catch (error) {
            console.error("Error fetching comments:", error);
        } finally {
            setFetchingComments(false);
        }
    };

    const handleLike = async () => {
        try {
            const { data } = await API.patch(`/posts/like/${id}`);
            if (data.success) {
                const isLiked = data.message === "Liked!";
                setPost({
                    ...post,
                    likesCount: isLiked ? (post.likesCount || 0) + 1 : Math.max(0, (post.likesCount || 0) - 1)
                });
            }
        } catch (error) {
            toast.error("Failed to like post");
        }
    };

    const handleDeletePost = async () => {
        if (window.confirm("Are you sure you want to delete this post?")) {
            try {
                const { data } = await API.delete(`/posts/delete/${id}`);
                toast.success(data.message || "Post deleted successfully!");
                navigate('/Home');
            } catch (error) {
                console.error("Error deleting post", error);
                toast.error("Failed to delete post.");
            }
        }
    };

    const handleShowEditModal = () => {
        setEditContent(post.content);
        setShowEditModal(true);
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        if (!editContent.trim()) {
            toast.error("Post content cannot be empty!");
            return;
        }
        try {
            setEditLoading(true);
            const { data } = await API.put(`/posts/update/${id}`, { content: editContent });
            if (data.success) {
                toast.success("Post updated successfully!");
                setPost({ ...post, content: editContent });
                setShowEditModal(false);
            }
        } catch (error) {
            console.error("Error updating post", error);
            toast.error("Failed to update post.");
        } finally {
            setEditLoading(false);
        }
    };

    const submitComment = async (e) => {
        e.preventDefault();
        if (!commentText.trim()) return;
        try {
            const { data } = await API.post(`/posts/comment/${id}`, { text: commentText });
            if (data.success) {
                toast.success("Comment added!");
                setCommentText("");
                fetchComments();
                setPost({ ...post, commentsCount: (post.commentsCount || 0) + 1 });
            }
        } catch (error) {
            toast.error("Failed to add comment");
        }
    };

    const submitReply = async (commentId) => {
        if (!replyText.trim()) return;
        try {
            const { data } = await API.post(`/posts/comment/${commentId}/reply`, { text: replyText });
            if (data.success) {
                toast.success("Reply added!");
                setReplyText("");
                setActiveReplyId(null);
                fetchComments();
                setPost({ ...post, commentsCount: (post.commentsCount || 0) + 1 });
            }
        } catch (error) {
            toast.error("Failed to add reply");
        }
    };

    const handleDeleteComment = async (commentId, isReply = false) => {
        if (window.confirm("Are you sure you want to delete this comment?")) {
            try {
                const { data } = await API.delete(`/posts/comment/${commentId}`);
                if (data.success) {
                    toast.success(data.message);
                    const comment = comments.find(c => c._id === commentId);
                    let reduction = 1;
                    if (!isReply && comment?.replies) reduction += comment.replies.length;
                    
                    fetchComments();
                    setPost({ ...post, commentsCount: Math.max(0, (post.commentsCount || 0) - reduction) });
                }
            } catch (error) {
                toast.error("Failed to delete comment");
            }
        }
    };

    const handleUpdateComment = (commentId) => {
        const comment = comments.find(c => c._id === commentId) || comments.flatMap(c => c.replies || []).find(r => r._id === commentId);
        if (!comment) return;

        setEditingComment(comment);
        setEditCommentText(comment.text);
        setShowEditCommentModal(true);
    };

    const handleCommentEditSubmit = async (e) => {
        e.preventDefault();
        if (!editCommentText.trim()) {
            toast.error("Comment cannot be empty!");
            return;
        }
        try {
            setEditCommentLoading(true);
            const { data } = await API.put(`/posts/comment/${editingComment._id}`, { text: editCommentText });
            if (data.success) {
                toast.success("Comment updated!");
                setShowEditCommentModal(false);
                fetchComments();
            }
        } catch (error) {
            console.error("Error updating comment", error);
            toast.error("Failed to update comment.");
        } finally {
            setEditCommentLoading(false);
        }
    };

    const getImageUrl = (path) => path ? `${BASE_URL}${path}` : null;

    if (loading) return (
        <Container className="py-5 text-center">
            <Spinner animation="border" variant="danger" />
            <p className="mt-3 text-muted">Loading post...</p>
        </Container>
    );

    if (!post) return (
        <Container className="py-5 text-center">
            <h3 className="mb-4">Post not found</h3>
            <Button variant="danger" className="rounded-pill px-4" onClick={() => navigate('/Home')}>
                Go to Home Feed
            </Button>
        </Container>
    );

    return (
        <Container className="py-4">
            <Button variant="link" className="text-danger mb-3 p-0 d-flex align-items-center gap-2 text-decoration-none" onClick={() => navigate(-1)}>
                <FaArrowLeft /> Back
            </Button>
            <Row className="justify-content-center">
                <Col md={8}>
                    <Card className="glass-card mb-4 post-card">
                                <Card.Body>
                                    <div className="d-flex justify-content-between align-items-start mb-3">
                                        <div className="d-flex align-items-center gap-3">
                                            <img 
                                                src={post.userId?.profilePicture ? getImageUrl(post.userId.profilePicture) : 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} 
                                                alt="Avatar" 
                                                className="rounded-circle" 
                                                style={{ width: '50px', height: '50px', objectFit: 'cover' }} 
                                            />
                                            <div>
                                                <Link to={post.userId?._id ? `/user-profile/${post.userId._id}` : '#'} className="text-decoration-none" style={{ color: 'var(--text-color)' }}>
                                                    <h6 className="mb-0 fw-bold">{post.userId?.username}</h6>
                                                </Link>
                                                <small className="text-muted">{new Date(post.createdAt).toLocaleString()}</small>
                                            </div>
                                        </div>

                                        {currentUser?._id === post.userId?._id && (
                                            <Dropdown align="end">
                                                <Dropdown.Toggle variant="link" className="p-0 text-muted border-0 no-caret">
                                                    <BsThreeDots style={{ fontSize: '1.4rem' }} />
                                                </Dropdown.Toggle>
                                                <Dropdown.Menu>
                                                    <Dropdown.Item onClick={handleShowEditModal}>Edit Post</Dropdown.Item>
                                                    <Dropdown.Item className="text-danger" onClick={handleDeletePost}>Delete Post</Dropdown.Item>
                                                </Dropdown.Menu>
                                            </Dropdown>
                                        )}
                                    </div>

                                    <p className="fs-5">{post.content}</p>

                                    {post.image && (
                                        <img src={getImageUrl(post.image)} alt="Post" className="img-fluid rounded mb-3 w-100" />
                                    )}

                                    <hr />
                                    <div className="d-flex justify-content-around">
                                        <Button className="action-btn like-btn" onClick={handleLike}>
                                            <GoHeart className="me-2" />
                                            {post.likesCount || 0} Likes
                                        </Button>
                                        <Button className="action-btn comment-btn">
                                            <FaRegComment className="me-2" />
                                            {post.commentsCount || 0} Comments
                                        </Button>
                                    </div>
                                </Card.Body>
                            </Card>

                            <Card className="glass-card">
                                <Card.Body>
                                    <h5 className="fw-bold mb-4 text-muted">Comments</h5>
                                    <Form className="d-flex gap-2 mb-4" onSubmit={submitComment}>
                                        <Form.Control 
                                            placeholder="Write a comment..." 
                                            className="rounded-pill border-0 px-3"
                                            style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-color)' }}
                                            value={commentText}
                                            onChange={(e) => setCommentText(e.target.value)}
                                        />
                                        <Button type="submit" variant="danger" className="rounded-pill px-4">Post</Button>
                                    </Form>

                                    {fetchingComments ? (
                                        <div className="text-center py-3"><Spinner animation="border" size="sm" /></div>
                                    ) : comments.length === 0 ? (
                                        <p className="text-center text-muted">No comments yet.</p>
                                    ) : (
                                        comments.map(comment => (
                                            <div key={comment._id} className="mb-4">
                                                <div className="d-flex gap-2 align-items-start">
                                                    <img 
                                                        src={comment.userId?.profilePicture ? getImageUrl(comment.userId.profilePicture) : 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} 
                                                        className="rounded-circle" 
                                                        style={{ width: '35px', height: '35px', objectFit: 'cover' }} 
                                                    />
                                                    <div className="flex-grow-1">
                                                        <div className="d-flex justify-content-between align-items-start">
                                                            <div className="p-2 rounded-3" style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-color)', display: 'inline-block', maxWidth: '100%' }}>
                                                                <span className="fw-bold d-block small">@{comment.userId?.username}</span>
                                                                <p className="mb-0 small">{comment.text}</p>
                                                            </div>
                                                            {String(comment.userId?._id || comment.userId) === String(currentUser?._id || currentUser?.id) && (
                                                                <Dropdown align="end">
                                                                    <Dropdown.Toggle variant="link" className="p-0 text-muted border-0 no-caret">
                                                                        <BsThreeDots style={{ fontSize: '1.1rem' }} />
                                                                    </Dropdown.Toggle>
                                                                    <Dropdown.Menu size="sm">
                                                                        <Dropdown.Item onClick={() => handleUpdateComment(comment._id)} style={{ fontSize: '0.8rem' }}>Edit</Dropdown.Item>
                                                                        <Dropdown.Item className="text-danger" onClick={() => handleDeleteComment(comment._id)} style={{ fontSize: '0.8rem' }}>Delete</Dropdown.Item>
                                                                    </Dropdown.Menu>
                                                                </Dropdown>
                                                            )}
                                                        </div>
                                                        <div className="d-flex gap-3 mt-1 ms-2" style={{ fontSize: '0.75rem' }}>
                                                            <span className="text-muted">{new Date(comment.createdAt).toLocaleTimeString()}</span>
                                                            <span className="text-primary fw-bold" style={{ cursor: 'pointer' }} onClick={() => setActiveReplyId(activeReplyId === comment._id ? null : comment._id)}>Reply</span>
                                                        </div>

                                                        {/* Reply Input */}
                                                        {activeReplyId === comment._id && (
                                                            <div className="d-flex gap-2 mt-2">
                                                                <Form.Control 
                                                                    size="sm" 
                                                                    placeholder="Write a reply..." 
                                                                    className="rounded-pill border-0 px-3"
                                                                    style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-color)' }}
                                                                    value={replyText}
                                                                    onChange={(e) => setReplyText(e.target.value)}
                                                                />
                                                                <Button size="sm" variant="secondary" className="rounded-pill px-3" onClick={() => submitReply(comment._id)}>Reply</Button>
                                                            </div>
                                                        )}

                                                        {/* Replies List */}
                                                        {comment.replies && comment.replies.length > 0 && (
                                                            <div className="mt-2 ms-4 border-start ps-3">
                                                                {comment.replies.map(reply => (
                                                                    <div key={reply._id} className="d-flex gap-2 mb-2 align-items-start">
                                                                        <img 
                                                                            src={reply.userId?.profilePicture ? getImageUrl(reply.userId.profilePicture) : 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} 
                                                                            className="rounded-circle" 
                                                                            style={{ width: '25px', height: '25px', objectFit: 'cover' }} 
                                                                        />
                                                                        <div className="flex-grow-1">
                                                                            <div className="d-flex justify-content-between align-items-start">
                                                                                <div className="p-2 rounded-3" style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-color)', display: 'inline-block' }}>
                                                                                    <span className="fw-bold d-block" style={{ fontSize: '0.75rem' }}>@{reply.userId?.username}</span>
                                                                                    <p className="mb-0" style={{ fontSize: '0.75rem' }}>{reply.text}</p>
                                                                                </div>
                                                                                {String(reply.userId?._id || reply.userId) === String(currentUser?._id || currentUser?.id) && (
                                                                                    <Dropdown align="end">
                                                                                        <Dropdown.Toggle variant="link" className="p-0 text-muted border-0 no-caret">
                                                                                            <BsThreeDots style={{ fontSize: '1rem' }} />
                                                                                        </Dropdown.Toggle>
                                                                                        <Dropdown.Menu>
                                                                                            <Dropdown.Item onClick={() => handleUpdateComment(reply._id)} style={{ fontSize: '0.8rem' }}>Edit</Dropdown.Item>
                                                                                            <Dropdown.Item className="text-danger" onClick={() => handleDeleteComment(reply._id, true)} style={{ fontSize: '0.8rem' }}>Delete</Dropdown.Item>
                                                                                        </Dropdown.Menu>
                                                                                    </Dropdown>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </Card.Body>
                            </Card>
                </Col>
            </Row>

            {/* Edit Post Modal */}
            <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Edit Post</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleEditSubmit}>
                        <Form.Group className="mb-3">
                            <Form.Control
                                as="textarea"
                                rows={4}
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                className="border-0 rounded-3"
                                style={{ resize: 'none', backgroundColor: 'var(--input-bg)', color: 'var(--text-color)' }}
                            />
                        </Form.Group>
                        <div className="d-flex justify-content-end gap-2">
                            <Button variant="secondary" className="rounded-pill px-4" onClick={() => setShowEditModal(false)}>Cancel</Button>
                            <Button variant="primary" type="submit" className="glow-btn px-4" disabled={editLoading}>
                                {editLoading ? <Spinner animation="border" size="sm" /> : 'Save Changes'}
                            </Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>

            {/* Edit Comment Modal */}
            <Modal show={showEditCommentModal} onHide={() => setShowEditCommentModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Edit Comment</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleCommentEditSubmit}>
                        <Form.Group className="mb-3">
                            <Form.Control
                                as="textarea"
                                rows={3}
                                value={editCommentText}
                                onChange={(e) => setEditCommentText(e.target.value)}
                                className="border-0 rounded-3"
                                style={{ resize: 'none', backgroundColor: 'var(--input-bg)', color: 'var(--text-color)' }}
                            />
                        </Form.Group>
                        <div className="d-flex justify-content-end gap-2">
                            <Button variant="secondary" className="rounded-pill px-4" onClick={() => setShowEditCommentModal(false)}>Cancel</Button>
                            <Button variant="primary" type="submit" className="glow-btn px-4" disabled={editCommentLoading}>
                                {editCommentLoading ? <Spinner animation="border" size="sm" /> : 'Save Changes'}
                            </Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>
        </Container>
    );
};
