import React, { useEffect, useRef, useState } from 'react'
import API, { BASE_URL } from '../../services/api'
import { useSelector } from 'react-redux'
import { useLocation } from 'react-router-dom'
import { Modal, Button, Form, Dropdown, Spinner } from 'react-bootstrap'
import { FiSend } from 'react-icons/fi'
import { BsThreeDots } from 'react-icons/bs'
import { toast } from 'react-hot-toast'
import '../../Sass/style.scss'

export const Messages = () => {
    const [messages, setMessages] = useState([])
    const [conversations, setConversations] = useState([])
    const [selectedConv, setSelectedConv] = useState(null)
    const [selectedUser, setSelectedUser] = useState(null)
    const [newMessage, setNewMessage] = useState("") 
    const [search, setSearch] = useState("")
    const [searchedUsers, setSearchedUsers] = useState([])
    const messagesEndRef = useRef(null) // ref to scroll to bottom of messages

    // Edit Message States
    const [showEditModal, setShowEditModal] = useState(false)
    const [editingMessage, setEditingMessage] = useState(null)
    const [editMessageText, setEditMessageText] = useState("")
    const [editLoading, setEditLoading] = useState(false)

    // get current user from Redux store
    const { user: currentUser } = useSelector((state) => state.auth)
    const currentUserId = currentUser?._id || currentUser?.id

    // get currentNavigate data 
    const location = useLocation()

    useEffect(() => {
        // fetch all conversations 
        fetchConversations()
    }, [])  

    // Fetch users when searching globally
    useEffect(() => {
        if (!search.trim()) {
            // if search is empty, clear the searched users
            setSearchedUsers([])
            return
        }

        // debounce API calls while typing
        const delayDebounceFn = setTimeout(async () => {
            try {
                const { data } = await API.get(`/search/users?query=${search}`)

                // filter out the current user from the search results
                if (data.success) {
                    setSearchedUsers(data.users.filter(u => String(u._id) !== String(currentUserId)))
                }
            } catch (error) {
                console.error("Failed to search users")
            }
        }, 300)

        // clean old timeout if search changes before 300ms 
        return () => clearTimeout(delayDebounceFn)
    }, [search, currentUserId])


    // start chat with a user from search results 
    const startChatWithUser = (user) => {
        // check if this conversation already exists
        const existingConv = conversations.find(c => 
            c.participants.some(p => String(p._id) === String(user._id))
        );
        if (existingConv) {
            fetchMessages(existingConv);
        } else {
            // No conversation exists yet, so open an empty chat panel
            setSelectedUser(user); 
            setSelectedConv(null); 
            fetchMessagesByUserId(user._id); 
        }
        setSearch(""); 
    }

    // Auto-open chat when navigated from UserProfile
    useEffect(() => {
        const { openUserId, openUser } = location.state || {}
        if (openUserId && openUser) {
            setSelectedUser(openUser)
            fetchMessagesByUserId(openUserId)

            // Clear the state so refresh doesn't re-trigger 
            window.history.replaceState({}, document.title)
        }
    }, [location.state])

    // scroll for last message when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    // fetch all conversations for sidebar
    const fetchConversations = async () => {
        try {
            const { data } = await API.get('/messages/conversations')
            setConversations(data) 
        } catch (error) {
            toast.error("Failed to load conversations")
        }
    }

    // fetch messages for selected conversation
    const fetchMessages = async (conv) => {
        // find the other participantId
        const otherUser = conv.participants.find(p => p._id !== currentUserId) || conv.participants[0]
        try {
            const { data } = await API.get(`/messages/${otherUser._id}`)
            setMessages(data) 
            setSelectedUser(otherUser) 
            setSelectedConv(conv) 
        } catch (error) {
            toast.error("Failed to load messages for this conversation")
        }
    }

    // Called when opening chat directly from UserProfile 
    const fetchMessagesByUserId = async (userId) => {
        try {
            const { data } = await API.get(`/messages/${userId}`)
            setMessages(data) 
        } catch (error) {
            toast.error("Failed to load messages for this conversation")
        }
    }

    // sending new message 
    const handleSendMessage = async (e) => {
        e.preventDefault()

        // validation - no empty messages & must select a chat
        if (!newMessage.trim() || !selectedUser) return

        try {
            const { data } = await API.post(`/messages/send/${selectedUser._id}`, { message: newMessage })
            if (data.success) {
                setMessages(prev => [...prev, data.newMessage])
                setNewMessage("")
                fetchConversations() 
            }
        } catch (error) {
            toast.error("Failed to send message")
        }
    }

    // edit message 
    const handleEditMessage = (msg) => {
        setEditingMessage(msg) 
        setEditMessageText(msg.message) 
        setShowEditModal(true)
    }

    // after editing message & click save changes
    const handleUpdateSubmit = async (e) => {
        e.preventDefault()
        // validation - no empty messages
        if (!editMessageText.trim()) return

        try {
            setEditLoading(true)
            const { data } = await API.put(`/messages/update/${editingMessage._id}`, { message: editMessageText })
            if (data.success) {
                toast.success("Message updated!")
                //map & update the new message instead of the old one 
                setMessages(prev => prev.map(m => m._id === editingMessage._id ? data.updatedMessage : m))
                setShowEditModal(false) 
                fetchConversations() 
            }
        } catch (error) {
            toast.error("Failed to update message")
        } finally {
            setEditLoading(false)
        }
    }

    // delete single message
    const handleDeleteMessage = async (msgId) => {
        // confirm delete action 
        if (!window.confirm("Are you sure you want to delete this message?")) return
        try {
            const { data } = await API.delete(`/messages/delete/${msgId}`)
            if (data.success) {
                toast.success("Message deleted!")
                setMessages(prev => prev.filter(m => m._id !== msgId)) // remove deleted message from UI
                fetchConversations() 
            }
        } catch (error) {
            toast.error("Failed to delete message")
        }
    }

    // delete entire conversation
    const handleDeleteConversation = async () => {
        if (!selectedConv) return
        if (!window.confirm("Are you sure you want to delete the entire conversation? This cannot be undone.")) return

        try {
            const { data } = await API.delete(`/messages/conversation/delete/${selectedConv._id}`)
            if (data.success) {
                toast.success("Conversation deleted!")
                setSelectedUser(null) 
                setSelectedConv(null) 
                setMessages([]) 
                fetchConversations() 
            }
        } catch (error) {
            toast.error("Failed to delete conversation")
        }
    }

    // enter -> send message (without shift + enter) 
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSendMessage(e) // call send message function
        }
    }

    const formatTime = (dateStr) => {
        if (!dateStr) return '' 
        // convert dateStr to Date object
        const d = new Date(dateStr)
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    return (
        <>
            <div className="messages-page">
                {/*LEFT PANEL: Conversations List*/}
                <div className="chat-list-panel">
                    <div className="chat-list-header">
                        <h2 className="chat-list-title">Messages</h2>
                        <p className="chat-list-sub">{conversations.length} conversations</p>
                    </div>

                    <div className="chat-search-wrapper">
                        <span className="search-icon">🔍</span>
                        <input
                            className="chat-search-input"
                            type="text"
                            placeholder="Search users..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>

                    <div className="chat-list-body">
                        {search.trim() ? (
                            searchedUsers.length === 0 ? (
                                <div className="empty-state">
                                    <span className="empty-icon">🔍</span>
                                    <p>No users found</p>
                                </div>
                            ) : (
                                searchedUsers.map(user => (
                                    <div
                                        key={user._id}
                                        className={`chat-list-item ${selectedUser?._id === user._id ? 'active' : ''}`}
                                        onClick={() => startChatWithUser(user)}
                                    >
                                        <div className="chat-avatar-wrapper">
                                            <img
                                                src={user.profilePicture
                                                    ? `${BASE_URL}${user.profilePicture}`
                                                    : 'https://cdn-icons-png.flaticon.com/512/149/149071.png'}
                                                alt={user.username}
                                                className="chat-avatar"
                                            />
                                        </div>
                                        <div className="chat-info">
                                            <div className="chat-info-top">
                                                <span className="chat-username">{user.username}</span>
                                            </div>
                                            <p className="chat-last-msg text-primary">
                                                Start chatting...
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )
                        ) : conversations.length === 0 ? (
                            <div className="empty-state">
                                <span className="empty-icon">💭</span>
                                <p>No conversations yet</p>
                            </div>
                        ) : (
                            conversations.map(conv => {
                                const otherUser = conv.participants.find(p => p._id !== currentUserId) || conv.participants[0]
                                const isActive = selectedConv?._id === conv._id

                                return (
                                    <div
                                        key={conv._id}
                                        className={`chat-list-item ${isActive ? 'active' : ''}`}
                                        onClick={() => fetchMessages(conv)}
                                    >
                                        <div className="chat-avatar-wrapper">
                                            <img
                                                src={otherUser.profilePicture
                                                    ? `${BASE_URL}${otherUser.profilePicture}`
                                                    : 'https://cdn-icons-png.flaticon.com/512/149/149071.png'}
                                                alt={otherUser.username}
                                                className="chat-avatar"
                                            />
                                            <span className="online-dot" />
                                        </div>
                                        <div className="chat-info">
                                            <div className="chat-info-top">
                                                <span className="chat-username">{otherUser.username}</span>
                                                <span className="chat-time">
                                                    {conv.lastMessage ? formatTime(conv.lastMessage.createdAt) : ''}
                                                </span>
                                            </div>
                                            <p className="chat-last-msg">
                                                {conv.lastMessage?.message || 'Start a conversation...'}
                                            </p>
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </div>

                {/* ── RIGHT PANEL: Chat Window ── */}
                <div className="chat-window-panel">
                    {!selectedUser ? (
                        <div className="no-chat-selected">
                            <div className="no-chat-icon">💌</div>
                            <h3>Select a conversation</h3>
                            <p>Choose a chat from the left to start messaging</p>
                        </div>
                    ) : (
                        <>
                            {/* Chat Header */}
                            <div className="chat-window-header">
                                <div className="chat-avatar-wrapper">
                                    <img
                                        src={selectedUser.profilePicture
                                            ? `${BASE_URL}${selectedUser.profilePicture}`
                                            : 'https://cdn-icons-png.flaticon.com/512/149/149071.png'}
                                        alt={selectedUser.username}
                                        className="chat-avatar"
                                    />
                                    <span className="online-dot" />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h5 className="chat-window-username">{selectedUser.username}</h5>
                                    <span className="chat-window-status">Online</span>
                                </div>
                                <button
                                    className="close-chat-btn text-danger me-2"
                                    onClick={handleDeleteConversation}
                                    title="Delete entire conversation"
                                    style={{ fontSize: '1.2rem', background: 'transparent', border: 'none' }}
                                >
                                    🗑️
                                </button>
                                <button
                                    className="close-chat-btn"
                                    onClick={() => { setSelectedUser(null); setSelectedConv(null); setMessages([]) }}
                                    title="Close chat"
                                >
                                    ✕
                                </button>
                            </div>

                            {/* Messages Bubbles */}
                            <div className="chat-messages-body">
                                {messages.length === 0 ? (
                                    <div className="empty-chat">
                                        <span className='fs-1'>👋</span>
                                        <p >No messages yet. Say hi!</p>
                                    </div>
                                ) : (
                                    messages.map((msg, idx) => {
                                        const msgSenderId = msg.senderId?._id || msg.senderId
                                        const isMe = String(msgSenderId) === String(currentUserId)

                                        return (
                                            <div
                                                key={msg._id || idx}
                                                className={`message-row ${isMe ? 'me' : 'other'}`}
                                            >
                                                {!isMe && (
                                                    <img
                                                        src={selectedUser.profilePicture
                                                            ? `${BASE_URL}${selectedUser.profilePicture}`
                                                            : 'https://cdn-icons-png.flaticon.com/512/149/149071.png'}
                                                        alt=""
                                                        className="bubble-avatar"
                                                    />
                                                )}
                                                <div className={`message-bubble ${isMe ? 'bubble-me' : 'bubble-other'}`}>
                                                    <div className="d-flex justify-content-between align-items-start gap-2">
                                                        <p className="mb-0">{msg.message}</p>
                                                    </div>
                                                    <span className="bubble-time">{formatTime(msg.createdAt)}</span>
                                                    {isMe && (
                                                        <div className="message-options">
                                                            <Dropdown align="end">
                                                                <Dropdown.Toggle variant="link" className="p-0 border-0 no-caret">
                                                                    <BsThreeDots size={16} style={{ color: isMe ? 'white' : 'var(--text-color)', opacity: 0.8 }} />
                                                                </Dropdown.Toggle>
                                                                <Dropdown.Menu size="sm">
                                                                    <Dropdown.Item onClick={() => handleEditMessage(msg)} style={{ fontSize: '0.8rem' }}>Edit</Dropdown.Item>
                                                                    <Dropdown.Item className="text-danger" onClick={() => handleDeleteMessage(msg._id)} style={{ fontSize: '0.8rem' }}>Delete</Dropdown.Item>
                                                                </Dropdown.Menu>
                                                            </Dropdown>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input Area */}
                            <div className="chat-input-area">
                                <form className="chat-input-form" onSubmit={handleSendMessage}>
                                    <input
                                        type="text"
                                        className="chat-input"
                                        placeholder="Type a message..."
                                        value={newMessage}
                                        onChange={e => setNewMessage(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                    />
                                    <button type="submit" className="send-btn" disabled={!newMessage.trim()}>
                                        <FiSend size={20} />
                                    </button>
                                </form>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Edit Message Modal */}
            <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Edit Message</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleUpdateSubmit}>
                        <Form.Group className="mb-3">
                            <Form.Control
                                as="textarea"
                                rows={3}
                                value={editMessageText}
                                onChange={(e) => setEditMessageText(e.target.value)}
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
        </>
    )
}
