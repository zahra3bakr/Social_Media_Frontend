import API, { BASE_URL } from '../../services/api'
import React, { useEffect, useState, useRef } from 'react'
import { Button, Card, Col, Container, Row, Spinner, Alert, Modal, Form, Dropdown } from 'react-bootstrap'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { updateUser } from '../../redux/slices/authSlice'
import toast from 'react-hot-toast'

import { AiOutlineMail, AiOutlineCalendar, AiOutlineEdit, AiOutlineCamera } from "react-icons/ai";
import { GoHeart } from "react-icons/go";
import { FaRegComment } from "react-icons/fa6";
import { BsThreeDots } from "react-icons/bs";
import { IoClose } from "react-icons/io5";

export const Profile = () => {
    const [user , setUser] = useState(null)
    const [postsCount, setPostsCount] = useState(0)
    const [userPosts, setUserPosts] = useState([])
    const [loading , setLoading] = useState(true)
    const [error, setError] = useState(null)
    
    // Edit Modal States
    const [showEditModal, setShowEditModal] = useState(false)
    const [editLoading, setEditLoading] = useState(false)
    const [username, setUsername] = useState('')
    const [email, setEmail] = useState('')
    const [bio, setBio] = useState('')
    const [selectedFile, setSelectedFile] = useState(null)
    const [previewUrl, setPreviewUrl] = useState(null)

    // Followers/Following Lists States
    const [showFollowersModal, setShowFollowersModal] = useState(false)
    const [showFollowingModal, setShowFollowingModal] = useState(false)
    const [followersList, setFollowersList] = useState([])
    const [followingList, setFollowingList] = useState([])
    const [listLoading, setListLoading] = useState(false)

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

    // Post Management States
    const [showEditPostModal, setShowEditPostModal] = useState(false);
    const [editingPost, setEditingPost] = useState(null);
    const [editPostContent, setEditPostContent] = useState("");
    const [editPostLoading, setEditPostLoading] = useState(false);

    // Comment Edit States
    const [showEditCommentModal, setShowEditCommentModal] = useState(false);
    const [editingComment, setEditingComment] = useState(null);
    const [editCommentText, setEditCommentText] = useState("");
    const [editCommentLoading, setEditCommentLoading] = useState(false);
    const [editingCommentPostId, setEditingCommentPostId] = useState(null);

    const { isLoggedIn, user: currentUser } = useSelector((state) => state.auth)
    const navigate = useNavigate()
    const dispatch = useDispatch()
    const fileInputRef = useRef(null)

    // Normalize following IDs for reliable comparison
    const getFollowingIds = () => {
        if (!currentUser?.following) return [];
        return currentUser.following.map(fid => {
            if (typeof fid === 'string') return fid;
            if (fid?._id) return String(fid._id);
            return String(fid);
        });
    };

    // Check if user is following another user
    const checkIsFollowing = (targetId) => {
        return getFollowingIds().includes(String(targetId));
    };

    const getFollowButtonText = (targetId) => {
        if (checkIsFollowing(targetId)) return "Following";
        const amIFollowed = currentUser?.followers?.some(fid => {
            const idToCompare = typeof fid === 'object' ? (fid._id || fid.id) : fid;
            return String(idToCompare) === String(targetId);
        });
        return amIFollowed ? "Follow Back" : "Follow";
    };

    // Handle follow/unfollow
    const handleFollowToggle = async (targetId) => {
        try {
            const { data } = await API.post(`/users/follow/${targetId}`);
            if (data.success) {
                toast.success(data.message);
                const currentFollowingIds = getFollowingIds();
                let updatedFollowingIds;
                if (data.isFollowing) {
                    updatedFollowingIds = [...currentFollowingIds, String(targetId)];
                } else {
                    updatedFollowingIds = currentFollowingIds.filter(id => id !== String(targetId));
                }
                dispatch(updateUser({ ...currentUser, following: updatedFollowingIds }));
                
                // Refresh lists if modals are open
                if (showFollowersModal) fetchFollowers();
                if (showFollowingModal) fetchFollowing();
            }
        } catch (error) {
            toast.error("Action failed");
        }
    };

    useEffect(() => {
        if (!isLoggedIn) {
            navigate('/Login')
            return
        }

        // Only show initial loading if we don't have user data yet
        fetchProfile(!user)
    } , [isLoggedIn])

    // Fetch user data
    const fetchProfile = async (showLoading = false) => {
        if (showLoading) setLoading(true)
        setError(null)

        try {
            const response = await API.get('/users/profile')
            
            if (response.data.success) {
                setUser(response.data.user) 
                setPostsCount(response.data.postsCount || 0) 
                setUsername(response.data.user.username) 
                setEmail(response.data.user.email || '') 
                setBio(response.data.user.bio || '') 
            } else {
                setError(response.data.message || "Failed to load profile data")
            }
        } catch (error) {
            console.error("Error fetching profile:" , error)
            setError(error.response?.data?.message || "Internal Server Error. Please try again.")
        } finally {
            if (showLoading) setLoading(false)
        }

    }


    // when user update new profilePicture
    const handleFileChange = (e) => {
        const file = e.target.files[0]
        if (file) {
            setSelectedFile(file)
            setPreviewUrl(URL.createObjectURL(file))
        }
    }

    // update profile info
    const handleUpdate = async (e) => {
        e.preventDefault()
        setEditLoading(true)

        try {
            const formData = new FormData()
            // append -> add
            formData.append('username', username)
            formData.append('email', email)
            formData.append('bio', bio)
            if (selectedFile) {
                formData.append('profilePicture', selectedFile)
            }

            const response = await API.put('/users/profile/update', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            })

            if (response.data.success) {
                toast.success("Profile updated successfully!")
                setUser(response.data.user)
                dispatch(updateUser(response.data.user))
                setShowEditModal(false) 
                setSelectedFile(null) 
                setPreviewUrl(null)
            }
        } catch (error) {
            console.error("Update error:", error)
            toast.error(error.response?.data?.message || "Failed to update profile")
        } finally {
            setEditLoading(false)
        }
    }

    // remove profile picture
    const handleRemovePhoto = async () => {
        if (previewUrl || selectedFile) {
            setPreviewUrl(null); 
            setSelectedFile(null); 
            if (fileInputRef.current) fileInputRef.current.value = ""; 
            return;
        }

        // if not still saved
        if (user?.profilePicture) {
            if (window.confirm("Are you sure you want to remove your profile picture?")) {
                try {
                    const response = await API.delete('/users/profile/picture');
                    if (response.data.success) {
                        toast.success("Profile picture removed!");
                        setUser(response.data.user); 
                        dispatch(updateUser(response.data.user)); 
                    }
                } catch (error) {
                    toast.error("Failed to remove profile picture");
                }
            }
        }
    }

    // fetch followers list
    const fetchFollowers = async () => {
        setListLoading(true)
        try {
            const response = await API.get('/users/followers')
            if (response.data.success) {
                setFollowersList(response.data.followers) 
                setShowFollowersModal(true) 
            }
        } catch (error) {
            toast.error("Failed to load followers")
        } finally {
            setListLoading(false)
        }
    }

    // fetch following list
    const fetchFollowing = async () => {
        setListLoading(true)
        try {
            const response = await API.get('/users/following')
            if (response.data.success) {
                setFollowingList(response.data.following) 
                setShowFollowingModal(true) 
            }
        } catch (error) {
            toast.error("Failed to load following")
        } finally {
            setListLoading(false)
        }
    }

    // fetch current userProfile posts 
    const fetchUserPosts = async () => {
        try {
            const response = await API.get(`/posts?userId=${user?._id}`)
            if (response.data.success) {
                setUserPosts(response.data.posts)
            }
        } catch (error) {
            toast.error("Failed to load user's posts")
        }
    }

    const handleLike = async (postId) => {
        try {
            const { data } = await API.patch(`/posts/like/${postId}`)
            if (data.success) {
                setUserPosts(userPosts.map(post => {
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
                setUserPosts(userPosts.map(p => p._id === postId ? { ...p, commentsCount: (p.commentsCount || 0) + 1 } : p))
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
                setUserPosts(userPosts.map(p => p._id === postId ? { ...p, commentsCount: (p.commentsCount || 0) + 1 } : p))
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
                    setUserPosts(userPosts.map(p => p._id === postId ? { ...p, commentsCount: Math.max(0, (p.commentsCount || 0) - reduction) } : p));
                }
            } catch (error) {
                toast.error("Failed to delete comment");
            }
        }
    };

    const handleUpdateComment = (commentId, postId) => {
        const comment = postComments.find(c => c._id === commentId) || postComments.flatMap(c => c.replies || []).find(r => r._id === commentId);
        if (!comment) return;
        
        setEditingComment(comment);
        setEditCommentText(comment.text);
        setEditingCommentPostId(postId);
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
                fetchComments(editingCommentPostId);
            }
        } catch (error) {
            console.error("Error updating comment", error);
            toast.error("Failed to update comment.");
        } finally {
            setEditCommentLoading(false);
        }
    };

    const handleDeletePost = async (postId) => {
        if (window.confirm("Are you sure you want to delete this post?")) {
            try {
                const { data } = await API.delete(`/posts/delete/${postId}`);
                toast.success(data.message || "Post deleted successfully!");
                setUserPosts(userPosts.filter(p => p._id !== postId));
                setPostsCount(prev => prev - 1);
            } catch (error) {
                console.error("Error deleting post", error);
                toast.error("Failed to delete post.");
            }
        }
    };

    const handleShowEditPostModal = (post) => {
        setEditingPost(post);
        setEditPostContent(post.content);
        setShowEditPostModal(true);
    };

    const handleEditPostSubmit = async (e) => {
        e.preventDefault();
        if (!editPostContent.trim()) {
            toast.error("Post content cannot be empty!");
            return;
        }
        try {
            setEditPostLoading(true);
            const { data } = await API.put(`/posts/update/${editingPost._id}`, { content: editPostContent });
            if (data.success) {
                toast.success("Post updated successfully!");
                setUserPosts(userPosts.map(p => p._id === editingPost._id ? { ...p, content: editPostContent } : p));
                setShowEditPostModal(false);
            }
        } catch (error) {
            console.error("Error updating post", error);
            toast.error("Failed to update post.");
        } finally {
            setEditPostLoading(false);
        }
    };

    const getImageUrl = (path) => path ? `${BASE_URL}${path}` : null
    const formatDateShort = (dateString) => new Date(dateString).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })

    useEffect(() => {
        if (user) {
            fetchUserPosts()
        }
    }, [user])

    if (loading) {
        return <div className='text-center py-5'><Spinner animation='border' variant='danger'/></div>
    }

    if (error) {
        return (
            <Container className='py-5'>
                <Alert variant='danger' className='text-center'>
                    <h4>Error!</h4>
                    <p>{error}</p>
                    <Button variant='outline-danger' onClick={() => fetchProfile()}>Try Again</Button>
                </Alert>
            </Container>
        )
    }

  return (
    <div className='profile-wrapper'>
        <Container className='py-5'>
            <Row className='justify-content-center'>
                <Col md={10} lg={8}>
                    <Card className='profile-card'>
                        <div className='profile-cover'></div>

                        <Card.Body className='text-center position-relative'>
                            {/* Profile Picture */}
                            <div className='profile-avatar-container'>
                                <img src={user?.profilePicture ? `${BASE_URL}${user.profilePicture}` : 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} alt='Profile' className='profile-avatar-img'/>
                            </div>



                            <h2 className='profile-name'>{user?.username}</h2>

                            <p className='profile-email text-muted'>
                                <AiOutlineMail className='me-2'/> {user?.email}
                            </p>

                            <div className='profile-stats d-flex justify-content-center gap-4 my-4'>
                                <div className='text-center'>
                                    <h5 className='mb-0'>{postsCount}</h5>
                                    <small className='text-muted'>Posts</small>
                                </div>

                                <div className='text-center' onClick={fetchFollowers} style={{ cursor: 'pointer' }}>
                                    <h5 className='mb-0'>{user?.followers?.length || 0}</h5>
                                    <small className='text-muted'>Followers</small>
                                </div>

                                <div className='text-center' onClick={fetchFollowing} style={{ cursor: 'pointer' }}>
                                    <h5 className='mb-0'>{user?.following?.length || 0}</h5>
                                    <small className='text-muted'>Following</small>
                                </div>
                            </div>

                            <div className='profile-bio-section px-4 mb-4'>
                                <h5>About Me</h5>
                                <p className='bio-text'>
                                {user?.bio || 'No bio yet. Tell the world about yourself!'}
                                </p>
                            </div>

                            <div className='profile-footer d-flex flex-column flex-sm-row justify-content-between align-items-center px-4 gap-3'>
                                <span className='join-date'>
                                    <AiOutlineCalendar className='me-2'/> Joined: {user?.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long' }) : 'Recent'}
                                </span>

                                <Button className='glow-btn' onClick={() => setShowEditModal(true)}>
                                    <AiOutlineEdit className='me-2'/> Edit Profile
                                </Button>
                            </div>
                           
                        </Card.Body>
                    </Card>

                    {/* My Posts Section */}
                    <div className="mt-5">
                        <h4 className="fw-bold mb-4">My Posts</h4>
                        {userPosts.length === 0 ? (
                            <Card className="glass-card text-center p-5">
                                <p className="text-muted mb-0">You haven't posted anything yet.</p>
                            </Card>
                        ) : (
                            userPosts.map(post => (
                                <Card key={post._id} className="glass-card mb-4 post-card">
                                    <Card.Body>
                                        <div className='d-flex justify-content-between align-items-center mb-3'>
                                            <div className='d-flex align-items-center gap-3'>
                                                {user?.profilePicture ? (
                                                    <img src={`${BASE_URL}${user.profilePicture}`} alt="Avatar" className='rounded-circle' style={{ width: '40px', height: '40px', objectFit: 'cover' }} />
                                                ) : (
                                                    <div className='bg-primary text-white d-flex justify-content-center align-items-center rounded-circle' style={{ width: '40px', height: '40px', fontSize: '1rem', textTransform: 'uppercase' }}>
                                                        {user?.username?.charAt(0) || 'U'}
                                                    </div>
                                                )}
                                                <div>
                                                    <h6 className='mb-0 fw-bold'>{user?.username}</h6>
                                                    <small className='text-muted'>{formatDateShort(post.createdAt)}</small>
                                                </div>
                                            </div>
                                            <Dropdown align="end">
                                                <Dropdown.Toggle variant="link" className="p-0 text-muted border-0 no-caret">
                                                    <BsThreeDots className="fs-4" />
                                                </Dropdown.Toggle>
                                                <Dropdown.Menu>
                                                    <Dropdown.Item onClick={() => handleShowEditPostModal(post)}>Edit Post</Dropdown.Item>
                                                    <Dropdown.Item className="text-danger" onClick={() => handleDeletePost(post._id)}>Delete Post</Dropdown.Item>
                                                </Dropdown.Menu>
                                            </Dropdown>
                                        </div>
                                        <p>{post.content}</p>
                                        {post.image && (
                                            <div className="mb-3 rounded overflow-hidden">
                                                <img src={getImageUrl(post.image)} alt="Post content" className="img-fluid w-100" />
                                            </div>
                                        )}

                                        <hr />
                                        <div className='d-flex justify-content-around post-actions'>
                                            <div className="d-flex flex-column align-items-center">
                                                <Button className='action-btn like-btn' onClick={() => handleLike(post._id)}>
                                                    <GoHeart className="me-2" />
                                                    {post.likesCount || 0} Like{post.likesCount !== 1 ? 's' : ''}
                                                </Button>
                                                {(post.likesCount > 0) && (
                                                    <span className="text-muted small mt-1" style={{ cursor: 'pointer', fontSize: '0.75rem' }} onClick={() => fetchLikes(post._id)}>View who liked</span>
                                                )}
                                            </div>
                                            <Button className='action-btn comment-btn' style={{ height: 'fit-content' }} onClick={() => toggleComments(post._id)}>
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
                                                                        {String(comment.userId?._id || comment.userId) === String(user?._id || user?.id) && (
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
                                                                                    {String(reply.userId?._id || reply.userId) === String(user?._id || user?.id) && (
                                                                                        <Dropdown align="end">
                                                                                            <Dropdown.Toggle variant="link" className="p-0 text-muted border-0 no-caret">
                                                                                                <BsThreeDots style={{ fontSize: '1.1rem' }} />
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
                    </div>
                </Col>
            </Row>
        </Container>

        {/* Edit Profile Modal */}
        <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered size="lg">
            <Modal.Header closeButton className="border-0 pb-0">
                <Modal.Title className="fw-bold">Edit Profile</Modal.Title>
            </Modal.Header>
            <Modal.Body className="px-4 pb-4">
                <Form onSubmit={handleUpdate}>
                    <div className="text-center mb-4 position-relative">
                        <div className="mx-auto position-relative d-inline-block">
                            <img 
                                src={previewUrl || (user?.profilePicture ? `${BASE_URL}${user.profilePicture}` : 'https://cdn-icons-png.flaticon.com/512/149/149071.png')} 
                                alt="Preview" 
                                className="rounded-circle border border-4 border-white shadow"
                                style={{ width: '220px', height: '220px', objectFit: 'cover' }}
                            />


                            <div 
                                className="position-absolute bottom-0 end-0 bg-primary text-white rounded-circle d-flex justify-content-center align-items-center shadow-sm"
                                style={{ width: '40px', height: '40px', cursor: 'pointer', border: '3px solid white' }}
                                onClick={() => fileInputRef.current.click()}
                            >
                                <AiOutlineCamera size={20} />
                            </div>

                            {/* Delete Picture Button (X) */}
                            {(previewUrl || user?.profilePicture) && (
                                <div 
                                    className="position-absolute top-0 end-0 bg-danger text-white rounded-circle d-flex justify-content-center align-items-center shadow-sm"
                                    style={{ width: '35px', height: '35px', cursor: 'pointer', border: '3px solid white', transform: 'translate(10%, -10%)' }}
                                    onClick={handleRemovePhoto}
                                    title="Remove photo"
                                >
                                    <IoClose size={22} />
                                </div>
                            )}
                        </div>
                        <input 
                            type="file" 
                            hidden 
                            ref={fileInputRef} 
                            onChange={handleFileChange} 
                            accept="image/*"
                        />
                        <p className="mt-2 text-muted small">Click the camera icon to change photo</p>
                    </div>

                    <Form.Group className="mb-3">
                        <Form.Label className="fw-bold">Username</Form.Label>
                        <Form.Control 
                            type="text" 
                            placeholder="Enter username" 
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="rounded-pill px-3 py-2"
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label className="fw-bold">Email</Form.Label>
                        <Form.Control 
                            type="email" 
                            placeholder="Enter email" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="rounded-pill px-3 py-2"
                        />
                    </Form.Group>

                    <Form.Group className="mb-4">
                        <Form.Label className="fw-bold">Bio</Form.Label>
                        <Form.Control 
                            as="textarea" 
                            rows={3} 
                            placeholder="Tell us about yourself..." 
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            style={{ borderRadius: '15px' }}
                        />
                    </Form.Group>

                    <div className="d-grid gap-2">
                        <Button variant="primary" type="submit" className="glow-btn py-2" disabled={editLoading}>
                            {editLoading ? <Spinner animation="border" size="sm" /> : 'Save Changes'}
                        </Button>
                        <Button variant="light" className="rounded-pill py-2" onClick={() => setShowEditModal(false)}>
                            Cancel
                        </Button>
                    </div>
                </Form>
            </Modal.Body>
        </Modal>
        {/* Followers Modal */}
        <Modal show={showFollowersModal} onHide={() => setShowFollowersModal(false)} centered scrollable>
            <Modal.Header closeButton>
                <Modal.Title>Followers</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {listLoading ? (
                    <div className="text-center py-4"><Spinner animation="border" variant="primary" /></div>
                ) : followersList.length > 0 ? (
                    followersList.map(follower => (
                        <div key={follower._id} className="user-list-item d-flex align-items-center justify-content-between mb-3 p-2 border-bottom">
                            <div className="d-flex align-items-center" onClick={() => { setShowFollowersModal(false); navigate(`/user-profile/${follower._id}`); }} style={{ cursor: 'pointer' }}>
                                <img 
                                    src={follower.profilePicture ? `${BASE_URL}${follower.profilePicture}` : 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} 
                                    alt={follower.username} 
                                    className="rounded-circle me-3"
                                    style={{ width: '45px', height: '45px', objectFit: 'cover' }}
                                />
                                <div>
                                    <h6 className="mb-0">{follower.username}</h6>
                                    <small className="text-muted">{follower.email}</small>
                                </div>
                            </div>
                            <Button 
                                size="sm" 
                                variant={checkIsFollowing(follower._id) ? "outline-secondary" : "outline-primary"}
                                className="rounded-pill px-3 fw-bold"
                                onClick={() => handleFollowToggle(follower._id)}
                            >
                                {getFollowButtonText(follower._id)}
                            </Button>
                        </div>
                    ))
                ) : (
                    <p className="text-center text-muted py-4">No followers yet.</p>
                )}
            </Modal.Body>
        </Modal>

        {/* Following Modal */}
        <Modal show={showFollowingModal} onHide={() => setShowFollowingModal(false)} centered scrollable>
            <Modal.Header closeButton>
                <Modal.Title>Following</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {listLoading ? (
                    <div className="text-center py-4"><Spinner animation="border" variant="primary" /></div>
                ) : followingList.length > 0 ? (
                    followingList.map(followedUser => (
                        <div key={followedUser._id} className="user-list-item d-flex align-items-center justify-content-between mb-3 p-2 border-bottom">
                            <div className="d-flex align-items-center" onClick={() => { setShowFollowingModal(false); navigate(`/user-profile/${followedUser._id}`); }} style={{ cursor: 'pointer' }}>
                                <img 
                                    src={followedUser.profilePicture ? `${BASE_URL}${followedUser.profilePicture}` : 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} 
                                    alt={followedUser.username} 
                                    className="rounded-circle me-3"
                                    style={{ width: '45px', height: '45px', objectFit: 'cover' }}
                                />
                                <div>
                                    <h6 className="mb-0">{followedUser.username}</h6>
                                    <small className="text-muted">{followedUser.email}</small>
                                </div>
                            </div>
                            <Button 
                                size="sm" 
                                variant={checkIsFollowing(followedUser._id) ? "outline-secondary" : "outline-primary"}
                                className="rounded-pill px-3 fw-bold"
                                onClick={() => handleFollowToggle(followedUser._id)}
                            >
                                {getFollowButtonText(followedUser._id)}
                            </Button>
                        </div>
                    ))
                ) : (
                    <p className="text-center text-muted py-4">Not following anyone yet.</p>
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
                    <div className="likes-list">
                        {likesList.map(like => (
                            <div key={like._id} className="d-flex align-items-center gap-3 mb-3 pb-2 border-bottom">
                                {like.userId?.profilePicture ? (
                                    <img src={getImageUrl(like.userId.profilePicture)} alt="Avatar" className='rounded-circle' style={{ width: '40px', height: '40px', objectFit: 'cover' }} />
                                ) : (
                                    <div className='bg-primary text-white d-flex justify-content-center align-items-center rounded-circle' style={{ width: '40px', height: '40px', fontSize: '1rem', textTransform: 'uppercase' }}>
                                        {like.userId?.username?.charAt(0) || 'U'}
                                    </div>
                                )}
                                <span className="fw-bold">{like.userId?.username || 'Unknown User'}</span>
                            </div>
                        ))}
                    </div>
                )}
            </Modal.Body>
        </Modal>

        {/* Edit Post Modal */}
        <Modal show={showEditPostModal} onHide={() => setShowEditPostModal(false)} centered>
            <Modal.Header closeButton>
                <Modal.Title>Edit Post</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form onSubmit={handleEditPostSubmit}>
                    <Form.Group className="mb-3">
                        <Form.Control
                            as="textarea"
                            rows={4}
                            value={editPostContent}
                            onChange={(e) => setEditPostContent(e.target.value)}
                            className="border-0 rounded-3"
                            style={{ resize: 'none', backgroundColor: 'var(--input-bg)', color: 'var(--text-color)' }}
                        />
                    </Form.Group>
                    <div className="d-grid gap-2">
                        <Button variant="primary" type="submit" className="glow-btn py-2" disabled={editPostLoading}>
                            {editPostLoading ? <Spinner animation="border" size="sm" /> : 'Save Changes'}
                        </Button>
                        <Button variant="light" className="rounded-pill py-2" onClick={() => setShowEditPostModal(false)}>
                            Cancel
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
    </div>
  )
}



