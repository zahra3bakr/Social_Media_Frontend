import API, { BASE_URL } from '../../services/api'
import React, { useEffect, useState } from 'react'
import { Button, Card, Col, Container, Row, Spinner, Alert, Modal, Form } from 'react-bootstrap'
import { useParams, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { updateUser } from '../../redux/slices/authSlice'
import toast from 'react-hot-toast'
import { AiOutlineMail, AiOutlineCalendar } from "react-icons/ai";
import { GoHeart } from "react-icons/go";
import { FaRegComment } from "react-icons/fa6";

export const UserProfile = () => {
    const { id } = useParams()
    const [user , setUser] = useState(null)
    const [posts, setPosts] = useState([])
    const [loading , setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [followLoading, setFollowLoading] = useState(false)

    // Followers/Following Modal states
    const [showFollowersModal, setShowFollowersModal] = useState(false)
    const [showFollowingModal, setShowFollowingModal] = useState(false)

    // Post interaction states
    const [expandedPostId, setExpandedPostId] = useState(null)
    const [postComments, setPostComments] = useState([])
    const [fetchingComments, setFetchingComments] = useState(false)
    const [commentText, setCommentText] = useState('')
    const [replyText, setReplyText] = useState('')
    const [activeReplyId, setActiveReplyId] = useState(null)
    const [showLikesModal, setShowLikesModal] = useState(false)
    const [likesList, setLikesList] = useState([])
    const [fetchingLikes, setFetchingLikes] = useState(false)

    const { user: currentUser } = useSelector((state) => state.auth)
    const navigate = useNavigate()
    const dispatch = useDispatch()

    // Normalize following IDs to plain strings 
    const getFollowingIds = () => {
        if (!currentUser?.following) return [];
        return currentUser.following.map(fid => {
            if (typeof fid === 'string') return fid;
            if (fid?._id) return String(fid._id);
            return String(fid);
        });
    };

    const isFollowing = getFollowingIds().includes(String(id));

    const doesHeFollowMe = currentUser?.followers?.some(fid => {
        const idToCompare = typeof fid === 'object' ? (fid._id || fid.id) : fid;
        return String(idToCompare) === String(id);
    });

    const fetchMyProfile = async () => {
        try {
            const { data } = await API.get('/users/profile');
            if (data.success) {
                dispatch(updateUser(data.user));
            }
        } catch (error) {
            console.error("Error fetching my profile", error);
        }
    };

    useEffect(() => {
        const currentId = currentUser?._id || currentUser?.id;
        if (currentId && String(currentId) === String(id)) {
            navigate('/profile')
            return
        }
        fetchMyProfile()
        fetchUserProfile()
        fetchUserPosts()
    } , [id])

    const fetchUserProfile = async () => {
        setLoading(true)
        try {
            const response = await API.get(`/users/${id}`)
            if (response.data.success) setUser(response.data.user)
        } catch (error) {
            setError(error.response?.data?.message || "User not found")
        } finally {
            setLoading(false)
        }
    }

    const fetchUserPosts = async () => {
        try {
            const response = await API.get(`/posts?userId=${id}`)
            if (response.data.success) setPosts(response.data.posts)
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to load user posts.");
            console.error("Error fetching user posts:", error)
        }
    }

    const handleFollowToggle = async () => {
        setFollowLoading(true)
        try {
            const response = await API.post(`/users/follow/${id}`)
            if (response.data.success) {
                toast.success(response.data.message)
                const currentFollowingIds = getFollowingIds();
                let updatedFollowingIds;
                if (response.data.isFollowing) {
                    updatedFollowingIds = [...currentFollowingIds, String(id)];
                } else {
                    updatedFollowingIds = currentFollowingIds.filter(fid => fid !== String(id));
                }
                dispatch(updateUser({ ...currentUser, following: updatedFollowingIds }));
                fetchUserProfile()
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Action failed. Please try again.")
        } finally {
            setFollowLoading(false)
        }
    }

    const handleFollowFromModal = async (targetId) => {
        try {
            const response = await API.post(`/users/follow/${targetId}`)
            if (response.data.success) {
                toast.success(response.data.message)
                const currentFollowingIds = getFollowingIds();
                let updatedFollowingIds;
                if (response.data.isFollowing) {
                    updatedFollowingIds = [...currentFollowingIds, String(targetId)];
                } else {
                    updatedFollowingIds = currentFollowingIds.filter(fid => fid !== String(targetId));
                }
                dispatch(updateUser({ ...currentUser, following: updatedFollowingIds }));
                
                // If it's the user we are currently viewing, refresh their profile too
                if (String(targetId) === String(id)) {
                    fetchUserProfile();
                }
            }
        } catch (error) {
            toast.error("Action failed")
        }
    }

    // Post interaction handlers
    const handleLike = async (postId) => {
        try {
            const { data } = await API.patch(`/posts/like/${postId}`)
            if (data.success) {
                setPosts(posts.map(post => {
                    if (post._id === postId) {
                        const isLiked = data.message === 'Liked!'
                        return { ...post, likesCount: isLiked ? (post.likesCount || 0) + 1 : Math.max(0, (post.likesCount || 0) - 1) }
                    }
                    return post
                }))
            }
        } catch (error) {
            toast.error('Failed to like post')
        }
    }

    const fetchLikes = async (postId) => {
        try {
            setFetchingLikes(true)
            setShowLikesModal(true)
            const { data } = await API.get(`/posts/likes/${postId}`)
            if (data.success) setLikesList(data.likes)
        } catch (error) {
            toast.error('Failed to load likes')
        } finally {
            setFetchingLikes(false)
        }
    }

    const toggleComments = async (postId) => {
        if (expandedPostId === postId) {
            setExpandedPostId(null)
            setPostComments([])
            return
        }
        setExpandedPostId(postId)
        await fetchComments(postId)
    }

    const fetchComments = async (postId) => {
        try {
            setFetchingComments(true)
            const { data } = await API.get(`/posts/postcomment/${postId}`)
            if (data.success) setPostComments(data.comments)
        } catch (error) {
            toast.error('Failed to load comments')
        } finally {
            setFetchingComments(false)
        }
    }

    const submitComment = async (postId) => {
        if (!commentText.trim()) return
        try {
            const { data } = await API.post(`/posts/comment/${postId}`, { text: commentText })
            if (data.success) {
                toast.success('Comment added!')
                setCommentText('')
                fetchComments(postId)
                setPosts(posts.map(p => p._id === postId ? { ...p, commentsCount: (p.commentsCount || 0) + 1 } : p))
            }
        } catch (error) {
            toast.error('Failed to add comment')
        }
    }

    const submitReply = async (commentId, postId) => {
        if (!replyText.trim()) return
        try {
            const { data } = await API.post(`/posts/comment/${commentId}/reply`, { text: replyText })
            if (data.success) {
                toast.success('Reply added!')
                setReplyText('')
                setActiveReplyId(null)
                fetchComments(postId)
                setPosts(posts.map(p => p._id === postId ? { ...p, commentsCount: (p.commentsCount || 0) + 1 } : p))
            }
        } catch (error) {
            toast.error('Failed to add reply')
        }
    }

    const handleDeleteComment = async (commentId, postId, isReply = false) => {
        if (window.confirm("Are you sure you want to delete this comment?")) {
            try {
                const { data } = await API.delete(`/posts/comment/${commentId}`);
                if (data.success) {
                    toast.success(data.message);
                    fetchComments(postId);
                    const comment = postComments.find(c => c._id === commentId);
                    let reduction = 1;
                    if (!isReply && comment?.replies) reduction += comment.replies.length;
                    setPosts(posts.map(p => p._id === postId ? { ...p, commentsCount: Math.max(0, (p.commentsCount || 0) - reduction) } : p));
                }
            } catch (error) {
                toast.error("Failed to delete comment");
            }
        }
    };

    const handleUpdateComment = async (commentId, postId) => {
        const comment = postComments.find(c => c._id === commentId) || postComments.flatMap(c => c.replies || []).find(r => r._id === commentId);
        const newText = window.prompt("Edit your comment:", comment?.text || "");
        if (newText && newText.trim()) {
            try {
                const { data } = await API.put(`/posts/comment/${commentId}`, { text: newText });
                if (data.success) {
                    toast.success("Comment updated!");
                    fetchComments(postId);
                }
            } catch (error) {
                toast.error("Failed to update comment");
            }
        }
    };

    const getImageUrl = (pic) => pic ? `${BASE_URL}${pic}` : 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
    const formatDate = (dateString) => new Date(dateString).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    const formatDateShort = (dateString) => new Date(dateString).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

    if (loading) return <div className='text-center py-5'><Spinner animation='border' variant='danger'/></div>
    
    if (error) return (
        <Container className='py-5'>
            <Alert variant='danger' className='text-center'>
                <h4>User Not Found</h4>
                <p>{error}</p>
                <Button variant='outline-danger' onClick={() => navigate('/Home')}>Back to Home</Button>
            </Alert>
        </Container>
    )

    return (
        <div className='profile-wrapper'>
            <Container className='py-5'>
                <Row className='justify-content-center'>
                    <Col md={10} lg={8}>
                        <Card className='profile-card mb-4'>
                            <div className='profile-cover'></div>
                            <Card.Body className='text-center position-relative'>
                                <div className='profile-avatar-container'>
                                    <img src={getImageUrl(user?.profilePicture)} alt='Profile' className='profile-avatar-img'/>
                                </div>
                                <h2 className='profile-name'>{user?.username}</h2>
                                <p className='profile-email text-muted'><AiOutlineMail className='me-2'/> {user?.email}</p>

                                <div className='profile-stats d-flex justify-content-center gap-4 my-4'>
                                    <div className='text-center'>
                                        <h5 className='mb-0'>{posts.length}</h5>
                                        <small className='text-muted'>Posts</small>
                                    </div>
                                    <div className='text-center' style={{ cursor: 'pointer' }} onClick={() => setShowFollowersModal(true)}>
                                        <h5 className='mb-0'>{user?.followers?.length || 0}</h5>
                                        <small className='text-muted'>Followers</small>
                                    </div>
                                    <div className='text-center' style={{ cursor: 'pointer' }} onClick={() => setShowFollowingModal(true)}>
                                        <h5 className='mb-0'>{user?.following?.length || 0}</h5>
                                        <small className='text-muted'>Following</small>
                                    </div>
                                </div>

                                <div className='profile-bio-section px-4 mb-4'>
                                    <h5>About</h5>
                                    <p className='bio-text'>{user?.bio || 'No bio available.'}</p>
                                </div>

                                <div className='profile-footer d-flex justify-content-between align-items-center px-4'>
                                    <span className='join-date'>
                                        <AiOutlineCalendar className='me-2'/> Joined: {formatDate(user?.createdAt)}
                                    </span>
                                    <div className='d-flex gap-2'>
                                        <Button
                                            variant='outline-primary'
                                            className='rounded-pill px-4'
                                            onClick={() => navigate('/messages', { state: { openUserId: id, openUser: user } })}
                                        >
                                            💬 Message
                                        </Button>
                                        <Button 
                                            className={isFollowing ? 'btn-outline-danger rounded-pill px-4' : 'glow-btn'} 
                                            onClick={handleFollowToggle}
                                            disabled={followLoading}
                                        >
                                            {followLoading ? <Spinner animation="border" size="sm" /> : (isFollowing ? 'Unfollow' : (doesHeFollowMe ? 'Follow Back' : 'Follow'))}
                                        </Button>
                                    </div>
                                </div>
                            </Card.Body>
                        </Card>

                        {/* User's Posts */}
                        <h4 className="mb-4 fw-bold">Posts</h4>
                        {posts.length === 0 ? (
                            <p className="text-center text-muted">No posts shared yet.</p>
                        ) : (
                            posts.map(post => (
                                <Card key={post._id} className="glass-card mb-4 post-card">
                                    <Card.Body>
                                        <p>{post.content}</p>
                                        {post.image && (
                                            <img src={getImageUrl(post.image)} alt="Post" className="img-fluid rounded mb-3 w-100" />
                                        )}

                                        <hr />
                                        <div className='d-flex justify-content-around post-actions'>
                                            <div className="d-flex flex-column align-items-center">
                                                <Button className='action-btn' onClick={() => handleLike(post._id)}>
                                                    <GoHeart className="me-2" />
                                                    {post.likesCount || 0} Like{post.likesCount !== 1 ? 's' : ''}
                                                </Button>
                                                {post.likesCount > 0 && (
                                                    <span className="text-muted small mt-1" style={{ cursor: 'pointer', fontSize: '0.75rem' }} onClick={() => fetchLikes(post._id)}>View who liked</span>
                                                )}
                                            </div>
                                            <Button className='action-btn' style={{ height: 'fit-content' }} onClick={() => toggleComments(post._id)}>
                                                <FaRegComment className="me-2" />
                                                {post.commentsCount || 0} Comment{post.commentsCount !== 1 ? 's' : ''}
                                            </Button>
                                        </div>

                                        {/* Comments Section */}
                                        {expandedPostId === post._id && (
                                            <div className="mt-4 pt-3 border-top">
                                                <h6 className="fw-bold mb-3 text-muted">Comments</h6>
                                                <div className="d-flex gap-2 mb-4">
                                                    <Form.Control type="text" placeholder="Write a comment..." value={commentText} onChange={(e) => setCommentText(e.target.value)} className="rounded-pill border-0 px-3" style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-color)' }} />
                                                    <Button variant="primary" className="rounded-pill px-4" onClick={() => submitComment(post._id)}>Post</Button>
                                                </div>
                                                {fetchingComments ? (
                                                    <div className="text-center my-3"><Spinner animation="border" size="sm" /></div>
                                                ) : postComments.length === 0 ? (
                                                    <div className="text-center text-muted small my-3">No comments yet.</div>
                                                ) : (
                                                    postComments.map(comment => (
                                                        <div key={comment._id} className="mb-3">
                                                            <div className="d-flex gap-2 align-items-start">
                                                                {comment.userId?.profilePicture ? (
                                                                    <img src={getImageUrl(comment.userId.profilePicture)} alt="User" className="rounded-circle" style={{ width: '35px', height: '35px', objectFit: 'cover' }} />
                                                                ) : (
                                                                    <div className='bg-secondary text-white rounded-circle d-flex justify-content-center align-items-center' style={{ width: '35px', height: '35px', minWidth: '35px' }}>
                                                                        {comment.userId?.username?.charAt(0) || 'U'}
                                                                    </div>
                                                                )}
                                                                <div className="flex-grow-1">
                                                                    <div className="d-flex justify-content-between align-items-start">
                                                                        <div className="p-2 rounded-3" style={{ display: 'inline-block', maxWidth: '100%', backgroundColor: 'var(--input-bg)', color: 'var(--text-color)' }}>
                                                                            <span className="fw-bold d-block" style={{ fontSize: '0.9rem' }}>{comment.userId?.username || 'Unknown'}</span>
                                                                            <span style={{ fontSize: '0.9rem' }}>{comment.text}</span>
                                                                        </div>
                                                                        {String(comment.userId?._id || comment.userId) === String(currentUser?._id || currentUser?.id) && (
                                                                            <Dropdown align="end">
                                                                                <Dropdown.Toggle variant="link" className="p-0 text-muted border-0 no-caret">
                                                                                    <BsThreeDots style={{ fontSize: '0.8rem' }} />
                                                                                </Dropdown.Toggle>
                                                                                <Dropdown.Menu size="sm">
                                                                                    <Dropdown.Item onClick={() => handleUpdateComment(comment._id, post._id)} style={{ fontSize: '0.8rem' }}>Edit</Dropdown.Item>
                                                                                    <Dropdown.Item className="text-danger" onClick={() => handleDeleteComment(comment._id, post._id)} style={{ fontSize: '0.8rem' }}>Delete</Dropdown.Item>
                                                                                </Dropdown.Menu>
                                                                            </Dropdown>
                                                                        )}
                                                                    </div>
                                                                    <div className="d-flex gap-3 mt-1 ms-2" style={{ fontSize: '0.8rem' }}>
                                                                        <span className="text-muted">{formatDateShort(comment.createdAt)}</span>
                                                                        <span className="text-primary" style={{ cursor: 'pointer' }} onClick={() => setActiveReplyId(activeReplyId === comment._id ? null : comment._id)}>Reply</span>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {activeReplyId === comment._id && (
                                                                <div className="d-flex gap-2 mt-2 ms-5">
                                                                    <Form.Control size="sm" type="text" placeholder="Write a reply..." value={replyText} onChange={(e) => setReplyText(e.target.value)} className="rounded-pill border-0 px-3" style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-color)' }} />
                                                                    <Button size="sm" variant="secondary" className="rounded-pill px-3" onClick={() => submitReply(comment._id, post._id)}>Reply</Button>
                                                                </div>
                                                            )}

                                                            {comment.replies && comment.replies.length > 0 && (
                                                                <div className="mt-2 ms-5 border-start border-2 ps-3">
                                                                    {comment.replies.map(reply => (
                                                                        <div key={reply._id} className="d-flex gap-2 align-items-start mb-2">
                                                                            {reply.userId?.profilePicture ? (
                                                                                <img src={getImageUrl(reply.userId.profilePicture)} alt="User" className="rounded-circle" style={{ width: '30px', height: '30px', objectFit: 'cover' }} />
                                                                            ) : (
                                                                                <div className='bg-secondary text-white rounded-circle d-flex justify-content-center align-items-center' style={{ width: '30px', height: '30px', minWidth: '30px', fontSize: '0.8rem' }}>
                                                                                    {reply.userId?.username?.charAt(0) || 'U'}
                                                                                </div>
                                                                            )}
                                                                            <div className="flex-grow-1">
                                                                                <div className="d-flex justify-content-between align-items-start">
                                                                                    <div className="p-2 rounded-3" style={{ display: 'inline-block', backgroundColor: 'var(--input-bg)', color: 'var(--text-color)' }}>
                                                                                        <span className="fw-bold d-block" style={{ fontSize: '0.85rem' }}>{reply.userId?.username || 'Unknown'}</span>
                                                                                        <span style={{ fontSize: '0.85rem' }}>{reply.text}</span>
                                                                                    </div>
                                                                                    {String(reply.userId?._id || reply.userId) === String(currentUser?._id || currentUser?.id) && (
                                                                                        <Dropdown align="end">
                                                                                            <Dropdown.Toggle variant="link" className="p-0 text-muted border-0 no-caret">
                                                                                                <BsThreeDots style={{ fontSize: '0.7rem' }} />
                                                                                            </Dropdown.Toggle>
                                                                                            <Dropdown.Menu>
                                                                                                <Dropdown.Item onClick={() => handleUpdateComment(reply._id, post._id)} style={{ fontSize: '0.8rem' }}>Edit</Dropdown.Item>
                                                                                                <Dropdown.Item className="text-danger" onClick={() => handleDeleteComment(reply._id, post._id, true)} style={{ fontSize: '0.8rem' }}>Delete</Dropdown.Item>
                                                                                            </Dropdown.Menu>
                                                                                        </Dropdown>
                                                                                    )}
                                                                                </div>
                                                                                <div className="mt-1 ms-2" style={{ fontSize: '0.75rem' }}>
                                                                                    <span className="text-muted">{formatDateShort(reply.createdAt)}</span>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        )}
                                    </Card.Body>
                                </Card>
                            ))
                        )}
                    </Col>
                </Row>
            </Container>

            {/* Followers Modal */}
            <Modal show={showFollowersModal} onHide={() => setShowFollowersModal(false)} centered scrollable>
                <Modal.Header closeButton>
                    <Modal.Title>Followers ({user?.followers?.length || 0})</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {!user?.followers || user.followers.length === 0 ? (
                        <p className="text-center text-muted py-4">No followers yet.</p>
                    ) : (
                        user.followers.map(follower => (
                            <div key={follower._id} className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
                                <div className="d-flex align-items-center gap-3" style={{ cursor: 'pointer' }}
                                    onClick={() => { setShowFollowersModal(false); navigate(`/user-profile/${follower._id}`); }}>
                                    <img src={getImageUrl(follower.profilePicture)} alt={follower.username} className="rounded-circle" style={{ width: '45px', height: '45px', objectFit: 'cover' }} />
                                    <div>
                                        <h6 className="mb-0">{follower.username}</h6>
                                        <small className="text-muted">{follower.email}</small>
                                    </div>
                                </div>
                                {String(follower._id) !== String(currentUser?._id || currentUser?.id) && (
                                    <Button 
                                        size="sm" 
                                        variant={getFollowingIds().includes(String(follower._id)) ? "outline-secondary" : "outline-primary"}
                                        className="rounded-pill px-3 fw-bold"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleFollowFromModal(follower._id);
                                        }}
                                    >
                                        {getFollowingIds().includes(String(follower._id)) ? "Following" : (currentUser?.followers?.some(fid => String(typeof fid === 'object' ? (fid._id || fid.id) : fid) === String(follower._id)) ? "Follow Back" : "Follow")}
                                    </Button>
                                )}
                            </div>
                        ))
                    )}
                </Modal.Body>
            </Modal>

            {/* Following Modal */}
            <Modal show={showFollowingModal} onHide={() => setShowFollowingModal(false)} centered scrollable>
                <Modal.Header closeButton>
                    <Modal.Title>Following ({user?.following?.length || 0})</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {!user?.following || user.following.length === 0 ? (
                        <p className="text-center text-muted py-4">Not following anyone yet.</p>
                    ) : (
                        user.following.map(followed => (
                            <div key={followed._id} className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
                                <div className="d-flex align-items-center gap-3" style={{ cursor: 'pointer' }}
                                    onClick={() => { setShowFollowingModal(false); navigate(`/user-profile/${followed._id}`); }}>
                                    <img src={getImageUrl(followed.profilePicture)} alt={followed.username} className="rounded-circle" style={{ width: '45px', height: '45px', objectFit: 'cover' }} />
                                    <div>
                                        <h6 className="mb-0">{followed.username}</h6>
                                        <small className="text-muted">{followed.email}</small>
                                    </div>
                                </div>
                                {String(followed._id) !== String(currentUser?._id || currentUser?.id) && (
                                    <Button 
                                        size="sm" 
                                        variant={getFollowingIds().includes(String(followed._id)) ? "outline-secondary" : "outline-primary"}
                                        className="rounded-pill px-3 fw-bold"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleFollowFromModal(followed._id);
                                        }}
                                    >
                                        {getFollowingIds().includes(String(followed._id)) ? "Following" : (currentUser?.followers?.some(fid => String(typeof fid === 'object' ? (fid._id || fid.id) : fid) === String(followed._id)) ? "Follow Back" : "Follow")}
                                    </Button>
                                )}
                            </div>
                        ))
                    )}
                </Modal.Body>
            </Modal>

            {/* Likes Modal */}
            <Modal show={showLikesModal} onHide={() => setShowLikesModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Likes</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {fetchingLikes ? (
                        <div className="text-center my-4"><Spinner animation="border" variant="primary" /></div>
                    ) : likesList.length === 0 ? (
                        <div className="text-center text-muted my-4">No likes yet.</div>
                    ) : (
                        likesList.map(like => (
                            <div key={like._id} className="d-flex align-items-center gap-3 mb-3 pb-2 border-bottom">
                                {like.userId?.profilePicture ? (
                                    <img src={getImageUrl(like.userId.profilePicture)} alt="Avatar" className='rounded-circle' style={{ width: '40px', height: '40px', objectFit: 'cover' }} />
                                ) : (
                                    <div className='bg-primary text-white d-flex justify-content-center align-items-center rounded-circle' style={{ width: '40px', height: '40px', textTransform: 'uppercase' }}>
                                        {like.userId?.username?.charAt(0) || 'U'}
                                    </div>
                                )}
                                <span className="fw-bold">{like.userId?.username || 'Unknown User'}</span>
                            </div>
                        ))
                    )}
                </Modal.Body>
            </Modal>
        </div>
    )
}
