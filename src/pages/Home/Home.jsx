import React, { useState, useEffect, useRef } from 'react';
import { Button, Card, Col, Container, Row, Form, Spinner, Modal, Dropdown } from 'react-bootstrap';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { updateUser } from '../../redux/slices/authSlice';
import { FaHome, FaRegImage, FaReply } from "react-icons/fa";
import { GoHeart } from "react-icons/go";
import { FaRegComment } from "react-icons/fa6";
import { FaRegCircleUser } from "react-icons/fa6";
import { BsThreeDots } from "react-icons/bs";
import API, { BASE_URL } from '../../services/api';
import toast from 'react-hot-toast';

export const Home = () => {
  // Posts
  const [posts, setPosts] = useState([]);
  const [content, setContent] = useState("");
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchingPosts, setFetchingPosts] = useState(true);
  const [suggestedUsers, setSuggestedUsers] = useState([]);

  // Comments
  const [expandedPostId, setExpandedPostId] = useState(null);
  const [postComments, setPostComments] = useState([]);
  const [fetchingComments, setFetchingComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [replyText, setReplyText] = useState("");
  const [activeReplyId, setActiveReplyId] = useState(null);

  // Likes Modal
  const [showLikesModal, setShowLikesModal] = useState(false);
  const [likesList, setLikesList] = useState([]);
  const [fetchingLikes, setFetchingLikes] = useState(false);

  // Edit Post States
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  // Edit Comment States
  const [showEditCommentModal, setShowEditCommentModal] = useState(false);
  const [editingComment, setEditingComment] = useState(null);
  const [editCommentText, setEditCommentText] = useState("");
  const [editCommentLoading, setEditCommentLoading] = useState(false);
  const [editingCommentPostId, setEditingCommentPostId] = useState(null);

  const fileInputRef = useRef(null); // when user clicks on the image upload button, this ref will be triggered
  const navigate = useNavigate();
  const location = useLocation(); // get active item 
  const dispatch = useDispatch();
  const { user: currentUser } = useSelector((state) => state.auth);
  const currentUserId = currentUser?._id || currentUser?.id; // get user id from redux store

  // for coparison of following ids 
  // flow -> 
  const getFollowingIds = () => {
    if (!currentUser?.following) return [];
    return currentUser.following.map(id => {
      if (typeof id === 'string') return id;
      if (id?._id) return String(id._id);
      return String(id);
    });
  };

  const checkIsFollowing = (targetUserId) => {
    if (!targetUserId) return false;
    return getFollowingIds().includes(String(targetUserId));
  };

  // for follow & follow back button
  const getFollowButtonText = (targetUserId) => {
    if (checkIsFollowing(targetUserId)) return "Following";
    const amIFollowed = currentUser?.followers?.some(fid => {
      const idToCompare = typeof fid === 'object' ? (fid._id || fid.id) : fid;
      return String(idToCompare) === String(targetUserId);
    });
    return amIFollowed ? "Follow Back" : "Follow";
  };

  const handleFollow = async (targetId) => {
    if (!targetId) return;
    try {
      const { data } = await API.post(`/users/follow/${targetId}`);
      if (data.success) {
        toast.success(data.message);

        // Keep following as plain string IDs for consistent comparison
        const currentFollowingIds = getFollowingIds();
        let updatedFollowingIds;
        if (data.isFollowing) {
          // Add if not already there
          updatedFollowingIds = currentFollowingIds.includes(String(targetId))
            ? currentFollowingIds
            : [...currentFollowingIds, String(targetId)];
        } else {
          // Remove
          updatedFollowingIds = currentFollowingIds.filter(id => id !== String(targetId));
        }
        dispatch(updateUser({ ...currentUser, following: updatedFollowingIds }));
        fetchSuggestedUsers();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Action failed");
    }
  };

  const fetchMyProfile = async () => {
    try {
      const { data } = await API.get('/users/profile');
      if (data.success) {
        dispatch(updateUser(data.user)); // update redux
      }
    } catch (error) {
      console.error("Error fetching my profile", error);
    }
  };

  // fetch all posts
  useEffect(() => {
    fetchMyProfile();
    fetchPosts();
    fetchSuggestedUsers();
  }, [] );
  // [] -> runs only once

  const fetchSuggestedUsers = async () => {
    try {
      const { data } = await API.get('/users/suggestions');
      if (data.success) setSuggestedUsers(data.users);
    } catch (error) {
      console.error("Error fetching suggestions", error);
    }
  };

  const fetchPosts = async () => {
    try {
      setFetchingPosts(true);
      const { data } = await API.get('/posts');
      if (data.success) {
        setPosts(data.posts);
      }
    } catch (error) {
      console.error("Error fetching posts", error);
      toast.error(error.response?.data?.message || "Failed to load posts.");
    } finally {
      setFetchingPosts(false);
    }
  };

  // create post
  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() && !image) {
      toast.error("Post cannot be empty!");
      return;
    }

    try {
      setLoading(true);
      // sending image with text in post
      const formData = new FormData();
      formData.append("content", content);
      if (image) {
        formData.append("image", image);
      }

      const { data } = await API.post('/posts/create', formData);
      if (data.success) {
        toast.success("Post created successfully!");
        setContent("");
        setImage(null);

        // clear file input -> if user likes to upload another image
        if (fileInputRef.current) fileInputRef.current.value = "";
        fetchPosts();
      }
    } catch (error) {
      console.error("Error creating post", error);
      toast.error(error.response?.data?.message || "Failed to create post.");
    } finally {
      setLoading(false);
    }
  };

  // Photo/Video btn -> trigger file input click
  const handleImageClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Store the selected image in state when user selects a file from the file input
  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  // like or unlike the post -> toggle
  const handleLike = async (postId) => {
    try {
      const { data } = await API.patch(`/posts/like/${postId}`);
      if (data.success) {
        // Optimistic Update -> update immediately in UI
        setPosts(posts.map(post => {
          if (post._id === postId) {
            const isLiked = data.message === "Liked!";
            return {
              ...post,
              // Match.max() -> to not goes negative
              likesCount: isLiked ? (post.likesCount || 0) + 1 : Math.max(0, (post.likesCount || 0) - 1), 
            };
          }
          return post;
        }));
      }
    } catch (error) {
      console.error("Error toggling like", error);
      toast.error("Failed to like post");
    }
  };

  // View who liked the post & open the modal
  const fetchLikes = async (postId) => {
    try {
      setFetchingLikes(true);
      setShowLikesModal(true);
      const { data } = await API.get(`/posts/likes/${postId}`);
      if (data.success) {
        setLikesList(data.likes); // store likes in likesList state
      }
    } catch (error) {
      console.error("Error fetching likes", error);
      toast.error("Failed to load likes.");
    } finally {
      setFetchingLikes(false);
    }
  };

  // if comments opened pls close it & otherwise
  const toggleComments = async (postId) => {
    if (expandedPostId === postId) {
      setExpandedPostId(null); // close it
      setPostComments([]); // clear comments
      return;
    }
    setExpandedPostId(postId);
    await fetchComments(postId);
  };

  const fetchComments = async (postId) => {
    try {
      setFetchingComments(true); // Set loading state
      const { data } = await API.get(`/posts/postcomment/${postId}`);
      if (data.success) {
        setPostComments(data.comments); // store comments in postComments state
      }
    } catch (error) {
      console.error("Error fetching comments", error);
      toast.error("Failed to load comments.");
    } finally {
      setFetchingComments(false); // Reset loading state
    }
  };

  const submitComment = async (postId) => {
    if (!commentText.trim()) return; // empty comments
    try {
      const { data } = await API.post(`/posts/comment/${postId}`, { text: commentText });
      if (data.success) {
        toast.success("Comment added!");
        setCommentText(""); // clear inputs
        fetchComments(postId); // Refresh comments

        // +1 commentsCount in UI
        setPosts(posts.map(p => p._id === postId ? { ...p, commentsCount: (p.commentsCount || 0) + 1 } : p));
      }
    } catch (error) {
      console.error("Error adding comment", error);
      toast.error("Failed to add comment.");
    }
  };

  const submitReply = async (commentId, postId) => {
    if (!replyText.trim()) return; // empty replies
    try {
      const { data } = await API.post(`/posts/comment/${commentId}/reply`, { text: replyText });
      if (data.success) {
        toast.success("Reply added!");
        setReplyText(""); // clear inputs
        setActiveReplyId(null); // clear active reply
        fetchComments(postId); // Refresh comments to show new reply

        // +1 commentsCount in UI
        setPosts(posts.map(p => p._id === postId ? { ...p, commentsCount: (p.commentsCount || 0) + 1 } : p));
      }
    } catch (error) {
      console.error("Error adding reply", error);
      toast.error("Failed to add reply.");
    }
  };

  const handleDeleteComment = async (commentId, postId, isReply = false) => {
    if (window.confirm("Are you sure you want to delete this comment?")) {
      try {
        const { data } = await API.delete(`/posts/comment/${commentId}`);
        if (data.success) {
          toast.success(data.message);
          fetchComments(postId);
          // Approximate refresh of count (parent + replies if parent deleted)
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

  const handleUpdateComment = (commentId, postId) => {
    // Find the parent comment if not search by flatMap
    const comment = postComments.find(c => c._id === commentId) || postComments.flatMap(c => c.replies || []).find(r => r._id === commentId);
    if (!comment) return;
    
    setEditingComment(comment); // store the current comment
    setEditCommentText(comment.text); // store the old text
    setEditingCommentPostId(postId); // store the post id 
    setShowEditCommentModal(true); // open the modal
  };

  const handleCommentEditSubmit = async (e) => {
    e.preventDefault(); // prevent page reload 
    if (!editCommentText.trim()) {
      toast.error("Comment cannot be empty!");
      return;
    }
    try {
      setEditCommentLoading(true);
      const { data } = await API.put(`/posts/comment/${editingComment._id}`, { text: editCommentText });
      if (data.success) {
          toast.success("Comment updated!");
          setShowEditCommentModal(false); // close Modal
          fetchComments(editingCommentPostId); // refresh comments
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
        setPosts(posts.filter(p => p._id !== postId));
      } catch (error) {
        console.error("Error deleting post", error);
        toast.error("Failed to delete post.");
      }
    }
  };

  const handleShowEditModal = (post) => {
    setEditingPost(post); // store in edeitingPost state
    setEditContent(post.content); // put old content in editContent state
    setShowEditModal(true); // open Modal
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editContent.trim()) {
      toast.error("Post content cannot be empty!");
      return;
    }
    try {
      setEditLoading(true);
      const { data } = await API.put(`/posts/update/${editingPost._id}`, { content: editContent });
      if (data.success) {
        toast.success("Post updated successfully!");
        setPosts(posts.map(p => p._id === editingPost._id ? { ...p, content: editContent } : p)); // update UI
        setShowEditModal(false);
      }
    } catch (error) {
      console.error("Error updating post", error);
      toast.error("Failed to update post.");
    } finally {
      setEditLoading(false);
    }
  };

  // Helper functions -> for formatting time & image
  const formatDate = (dateString) => {
    // take dataString from backend & make from it Date 
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    // convert Date to readable format date
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    // image URL
    return `${BASE_URL}${imagePath}`;
  };
 
  return (
    <div className='home-wrapper'>
      <Container>
        <Row className='py-4'>
          {/* Left Sidebar */}
          <Col md={3} className='d-none d-md-block'>
            <Card className='glass-card sticky-sidebar'>
              <Card.Body>
                <ul className='side-menu'>
                  <li className={location.pathname === '/Home' ? 'active' : ''} onClick={() => navigate('/Home')} style={{ cursor: 'pointer' }}>
                    <FaHome /> <span>Home</span>
                  </li>
                   <li onClick={() => navigate('/profile')} style={{ cursor: 'pointer' }}>
                    <FaRegCircleUser /> <span>Profile</span>
                  </li>
                  <li onClick={() => navigate('/messages')} style={{ cursor: 'pointer' }}>
                    <FaRegComment /> <span>Messages</span>
                  </li>
                  <li onClick={() => navigate('/notifications')} style={{ cursor: 'pointer' }}>
                    <GoHeart /> <span>Notifications</span>
                  </li>
                </ul>
              </Card.Body>
            </Card>
          </Col>

          {/* Middle Column - Feed */}
          <Col md={6}>
            {/* Create Post */}
            <Card className='glass-card mb-4 create-post-card'>
              <Card.Body>
                <Form onSubmit={handlePostSubmit}>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    placeholder="What's on your mind?"
                    className="post-input mb-3"
                    value={content}
                    // when user types in textarea update content state
                    onChange={(e) => setContent(e.target.value)}
                  />

                  {image && (
                    <div className="mb-3 text-success small fw-bold">
                      Selected Image: {image.name}
                    </div>
                  )}

                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    ref={fileInputRef}
                    onChange={handleImageChange}
                  />

                  <div className='d-flex justify-content-between align-items-center'>
                    <Button variant="light" className="text-muted d-flex align-items-center gap-2 rounded-pill px-3" onClick={handleImageClick}>
                      <FaRegImage className="text-success" /> Photo/Video
                    </Button>
                    <Button variant='primary' type="submit" className='glow-btn px-4' disabled={loading}>
                      {loading ? <Spinner animation="border" size="sm" /> : 'Post'}
                    </Button>
                  </div>
                </Form>
              </Card.Body>
            </Card>

            {/* Posts List */}
            {fetchingPosts ? (
              <div className="text-center my-5">
                <Spinner animation="border" variant="primary" />
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center text-muted my-5">
                No posts yet. Be the first to share something!
              </div>
            ) : (
              posts.map(post => (
                <Card className='glass-card mb-4 post-card' key={post._id}>
                  <Card.Body>
                    <div className='d-flex justify-content-between align-items-center mb-3'>
                      <div className='d-flex align-items-center gap-3' style={{ cursor: 'pointer' }} onClick={() => post.userId?._id && navigate(`/user-profile/${post.userId._id}`)}>
                        {post.userId?.profilePicture ? (
                          <img src={getImageUrl(post.userId.profilePicture)} alt="Avatar" className='rounded-circle' style={{ width: '45px', height: '45px', objectFit: 'cover' }} />
                        ) : (
                          <div className='user-avatar bg-primary text-white d-flex justify-content-center align-items-center rounded-circle' style={{ width: '45px', height: '45px', fontSize: '1.2rem', textTransform: 'uppercase' }}>
                            {post.userId?.username?.charAt(0) || 'U'}
                          </div>
                        )}
                        <div>
                          <h6 className='mb-0 fw-bold'>{post.userId?.username || 'Unknown User'}</h6>
                          <small className='text-muted'>{formatDate(post.createdAt)}</small>
                        </div>
                      </div>
                      
                      <div className="d-flex align-items-center gap-2">
                        {currentUser?._id !== post.userId?._id ? (
                          <Button 
                            size="sm" 
                            variant={checkIsFollowing(post.userId?._id) ? "outline-secondary" : "outline-primary"} 
                            className="rounded-pill px-3 fw-bold"
                            onClick={(e) => {
                              // stop click navigate 
                              e.stopPropagation();
                              handleFollow(post.userId?._id);
                            }}
                          >
                            {getFollowButtonText(post.userId?._id)}
                          </Button>
                        ) : (
                          <Dropdown align="end">
                            <Dropdown.Toggle variant="link" className="p-0 text-muted border-0 no-caret">
                              <BsThreeDots className="fs-4" />
                            </Dropdown.Toggle>
                            <Dropdown.Menu>
                              <Dropdown.Item onClick={() => handleShowEditModal(post)}>Edit Post</Dropdown.Item>
                              <Dropdown.Item className="text-danger" onClick={() => handleDeletePost(post._id)}>Delete Post</Dropdown.Item>
                            </Dropdown.Menu>
                          </Dropdown>
                        )}
                      </div>
                    </div>

                    <div onClick={() => navigate(`/post/${post._id}`)} style={{ cursor: 'pointer' }}>
                      <p>{post.content}</p>

                      {post.image && (
                        <div className="mb-3 rounded overflow-hidden">
                          <img src={getImageUrl(post.image)} alt="Post content" className="img-fluid w-100" />
                        </div>
                      )}
                    </div>

                    <hr />
                    <div className='d-flex justify-content-around post-actions position-relative'>
                      <div className="d-flex flex-column align-items-center">
                        <Button className='action-btn like-btn' onClick={() => handleLike(post._id)}>
                          <GoHeart className="me-2" />
                          {post.likesCount || 0} Like{(post.likesCount !== 1) ? 's' : ''}
                        </Button>
                        {(post?.likesCount > 0) && (
                          <span
                            className="text-muted small mt-1 text-decoration-underline"
                            style={{ cursor: 'pointer', fontSize: '0.75rem' }}
                            onClick={() => fetchLikes(post._id)}
                          >
                            View who liked
                          </span>
                        )}
                      </div>
                      <Button className='action-btn comment-btn' onClick={() => toggleComments(post._id)} style={{ height: 'fit-content' }}>
                        <FaRegComment className="me-2" />
                        {post.commentsCount || 0} Comment{(post.commentsCount !== 1) ? 's' : ''}
                      </Button>
                    </div>

                    {/* Comments Section */}
                    {expandedPostId === post._id && (
                      <div className="mt-4 pt-3 border-top">
                        <h6 className="fw-bold mb-3 text-muted">Comments</h6>

                        {/* Create Comment Input */}
                        <div className="d-flex gap-2 mb-4">
                          <Form.Control
                            type="text"
                            placeholder="Write a comment..."
                            value={commentText}
                            // update text comment 
                            onChange={(e) => setCommentText(e.target.value)}
                            className="rounded-pill border-0 px-3"
                            style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-color)' }}
                          />
                          <Button variant="primary" className="rounded-pill px-4" onClick={() => submitComment(post._id)}>Post</Button>
                        </div>

                        {fetchingComments ? (
                          <div className="text-center my-3"><Spinner animation="border" size="sm" /></div>
                        ) : postComments.length === 0 ? (
                          <div className="text-center text-muted small my-3">No comments yet.</div>
                        ) : (
                          postComments.map(comment => (
                            <div key={comment._id} className="mb-3">
                              {/* Main Comment */}
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
                                    {String(comment.userId?._id || comment.userId) === String(currentUserId) && (
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
                                    <span className="text-muted">{formatDate(comment.createdAt)}</span>
                                    <span className="text-primary" style={{ cursor: 'pointer' }}

                                    // close / open reply input 
                                    onClick={() => setActiveReplyId(activeReplyId === comment._id ? null : comment._id)}>Reply</span>
                                  </div>
                                </div>
                              </div>

                              {/* Reply Input */}
                              {activeReplyId === comment._id && (
                                <div className="d-flex gap-2 mt-2 ms-5">
                                  <Form.Control
                                    size="sm"
                                    type="text"
                                    placeholder="Write a reply..."
                                    value={replyText}

                                    // update reply text
                                    onChange={(e) => setReplyText(e.target.value)}
                                    className="rounded-pill border-0 px-3"
                                    style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-color)' }}
                                  />
                                  <Button size="sm" variant="secondary" className="rounded-pill px-3" 

                                  // add reply 
                                  onClick={() => submitReply(comment._id, post._id)}>Reply</Button>
                                </div>
                              )}

                              {/* Replies List */}
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
                                          <div className="p-2 rounded-3" style={{ display: 'inline-block', maxWidth: '100%', backgroundColor: 'var(--input-bg)', color: 'var(--text-color)' }}>
                                            <span className="fw-bold d-block" style={{ fontSize: '0.85rem' }}>{reply.userId?.username || 'Unknown'}</span>
                                            <span style={{ fontSize: '0.85rem' }}>{reply.text}</span>
                                          </div>
                                          {String(reply.userId?._id || reply.userId) === String(currentUserId) && (
                                            <Dropdown align="end">
                                              <Dropdown.Toggle variant="link" className="p-0 text-muted border-0 no-caret">
                                                <BsThreeDots style={{ fontSize: '0.9rem' }} />
                                              </Dropdown.Toggle>
                                              <Dropdown.Menu>
                                                <Dropdown.Item onClick={() => handleUpdateComment(reply._id, post._id)} style={{ fontSize: '0.8rem' }}>Edit</Dropdown.Item>
                                                <Dropdown.Item className="text-danger" onClick={() => handleDeleteComment(reply._id, post._id, true, comment._id)} style={{ fontSize: '0.8rem' }}>Delete</Dropdown.Item>
                                              </Dropdown.Menu>
                                            </Dropdown>
                                          )}
                                        </div>
                                        <div className="mt-1 ms-2" style={{ fontSize: '0.75rem' }}>
                                          <span className="text-muted">{formatDate(reply.createdAt)}</span>
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

          {/* Right Sidebar - Suggestions */}
          <Col md={3} className='d-none d-lg-block'>
            <Card className='glass-card sticky-sidebar'>
              <Card.Body>
                <h6 className='fw-bold mb-3 text-muted'>Suggested for you</h6>
                {suggestedUsers.length === 0 ? (
                  <p className="text-muted small text-center">No suggestions right now.</p>
                ) : (
                  suggestedUsers.map(sugUser => (
                    <div key={sugUser._id} className='suggestion-item d-flex align-items-center justify-content-between mb-3'>
                      <div
                        className='d-flex align-items-center gap-2'
                        style={{ cursor: 'pointer' }}
                        onClick={() => navigate(`/user-profile/${sugUser._id}`)}
                      >
                        {sugUser.profilePicture ? (
                          <img
                            src={getImageUrl(sugUser.profilePicture)}
                            alt={sugUser.username}
                            className='rounded-circle'
                            style={{ width: '35px', height: '35px', objectFit: 'cover' }}
                          />
                        ) : (
                          <div
                            className='bg-primary text-white rounded-circle d-flex justify-content-center align-items-center fw-bold'
                            style={{ width: '35px', height: '35px', fontSize: '0.9rem', textTransform: 'uppercase', flexShrink: 0 }}
                          >
                            {sugUser.username?.charAt(0) || 'U'}
                          </div>
                        )}
                        <span className='fw-semibold' style={{ fontSize: '0.9rem' }}>{sugUser.username}</span>
                      </div>
                      <Button
                        size="sm"
                        variant={checkIsFollowing(sugUser._id) ? "outline-secondary" : "outline-primary"}
                        className="rounded-pill px-3 fw-bold"
                        onClick={() => handleFollow(sugUser._id)}
                      >
                        {getFollowButtonText(sugUser._id)}
                      </Button>
                    </div>
                  ))
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Likes Modal */}
      <Modal show={showLikesModal} 

      // close like modal 
      onHide={() => setShowLikesModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Likes</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {fetchingLikes ? (
            <div className="text-center my-4">
              <Spinner animation="border" variant="primary" />
            </div>
          ) : likesList.length === 0 ? (
            <div className="text-center text-muted my-4">
              No likes yet.
            </div>
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
      <Modal show={showEditModal} 
      
      // close edit post modal
      onHide={() => setShowEditModal(false)} centered>
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

                // update editContent of post
                onChange={(e) => setEditContent(e.target.value)}
                className="border-0 rounded-3"
                style={{ resize: 'none', backgroundColor: 'var(--input-bg)', color: 'var(--text-color)' }}
              />
            </Form.Group>
            <div className="d-flex justify-content-end">
              <Button variant="secondary" className="me-2 rounded-pill px-4" 

              // canvel for post edit
              onClick={() => setShowEditModal(false)}>Cancel</Button>
              <Button variant="primary" type="submit" className="glow-btn px-4" disabled={editLoading}>
                {editLoading ? <Spinner animation="border" size="sm" /> : 'Save Changes'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
      {/* Edit Comment Modal */}
      <Modal show={showEditCommentModal} 

      // close edit comment modal
      onHide={() => setShowEditCommentModal(false)} centered>
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

                // update editCommentText of comment
                onChange={(e) => setEditCommentText(e.target.value)}
                className="border-0 rounded-3"
                style={{ resize: 'none', backgroundColor: 'var(--input-bg)', color: 'var(--text-color)' }}
              />
            </Form.Group>
            <div className="d-flex justify-content-end">
              <Button variant="secondary" className="me-2 rounded-pill px-4" onClick={() => setShowEditCommentModal(false)}>Cancel</Button>
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
