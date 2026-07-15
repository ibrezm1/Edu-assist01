import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Row, Col, Card, Form, Button, Spinner, Stack, Badge, Alert } from 'react-bootstrap';

import { ArrowLeft, Send, User, Bot, Trash2, ExternalLink, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { aiService } from '../services/aiService';



const Chat = ({ settings, onBack, chatHistory = [], setChatHistory, backgroundTasks = {}, triggerGenerationTask, dismissBackgroundTask }) => {
    const location = useLocation();
    const messages = chatHistory;

    const [pendingContext, setPendingContext] = useState(() => {
        return location.state && location.state.initialMessage ? location.state.initialMessage : null;
    });
    const [contextLabel, setContextLabel] = useState(() => {
        return location.state && location.state.contextLabel ? location.state.contextLabel : null;
    });
    const [input, setInput] = useState('');

    const activeTasks = Object.values(backgroundTasks).filter(t => t.nodeId === 'chat');
    const loading = activeTasks.some(t => t.taskType === 'chat' && t.status === 'generating');
    const chatError = activeTasks.find(t => t.taskType === 'chat' && t.status === 'failed')?.error || null;

    const scrollRef = useRef(null);
    const inputRef = useRef(null);

    const getSuggestionChips = () => {
        if (!contextLabel) {
            return [
                "Summarize my learning path",
                "Explain the active topic",
                "Suggest study techniques"
            ];
        }
        if (contextLabel.startsWith("Flashcard")) {
            return [
                "Explain this concept",
                "Give me a real-world example",
                "Test me on this topic"
            ];
        }
        if (contextLabel.startsWith("Quiz Score")) {
            return [
                "How can I improve my score?",
                "Give me a study guide",
                "Test me again"
            ];
        }
        if (contextLabel.startsWith("Quiz Q")) {
            return [
                "Why is this option correct?",
                "Explain why other options are wrong",
                "Give me a similar question"
            ];
        }
        return [
            "Explain the details",
            "Give me examples"
        ];
    };

    const handleChipClick = (chipText) => {
        setInput(chipText);
        if (inputRef.current) {
            inputRef.current.focus();
        }
    };

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, loading]);

    const handleSend = (e) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        let userMsgContent = input;
        if (pendingContext) {
            userMsgContent = `${pendingContext}\n\nUser Question: ${input}`;
        }

        const userMsg = { role: 'user', content: userMsgContent };
        const displayedUserMsg = { role: 'user', content: input };

        const newMessagesForAI = [...messages, userMsg];
        const newMessagesForUI = [...messages, displayedUserMsg];

        setChatHistory(newMessagesForUI);
        localStorage.setItem('getpath_chat_history', JSON.stringify(newMessagesForUI));
        setInput('');

        setPendingContext(null);
        setContextLabel(null);

        // Clear any previous failed chat tasks
        const failedTask = activeTasks.find(t => t.taskType === 'chat' && t.status === 'failed');
        if (failedTask) {
            dismissBackgroundTask(failedTask.id);
        }

        triggerGenerationTask('chat', 'AI Chat Assistant', 'chat', JSON.stringify(newMessagesForAI));
    };

    const clearChat = () => {
        if (window.confirm('Clear chat history?')) {
            const initial = [{ role: 'assistant', content: 'Hello! I am your personal Course Craft AI. How can I help you with your learning journey today?' }];
            setChatHistory(initial);
            localStorage.setItem('getpath_chat_history', JSON.stringify(initial));
            activeTasks.forEach(task => dismissBackgroundTask(task.id));
        }
    };

    return (
        <Row className="justify-content-center h-100">
            <Col md={12} lg={10} className="d-flex flex-column" style={{ minHeight: '80vh' }}>
                <div className={`mb-4 d-flex ${onBack ? 'justify-content-between' : 'justify-content-end'} align-items-center`}>
                    {onBack && (
                        <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={onBack}
                            className="rounded-2 d-flex align-items-center gap-2 px-3 py-2 border-opacity-50"
                        >
                            <ArrowLeft size={16} />
                            <span>Go Back</span>
                        </Button>
                    )}
                    <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={clearChat}
                        className="rounded-2 d-flex align-items-center gap-2 px-3 py-2 border-opacity-50"
                    >
                        <Trash2 size={16} />
                        <span>Clear Chat</span>
                    </Button>
                </div>

                {contextLabel && (
                    <Alert 
                        variant="info" 
                        className="bg-info bg-opacity-10 border-info text-info py-2 px-3 mb-3 d-flex justify-content-between align-items-center"
                        style={{ fontSize: '0.85rem' }}
                    >
                        <span>ℹ️ Context for <strong>{contextLabel}</strong> added. It will be sent with your next question.</span>
                        <Button 
                            variant="link" 
                            className="p-0 text-info text-decoration-none fw-bold ms-2" 
                            style={{ fontSize: '0.75rem' }}
                            onClick={() => {
                                setPendingContext(null);
                                setContextLabel(null);
                            }}
                        >
                            Clear
                        </Button>
                    </Alert>
                )}

                <Card className="themed-card shadow-lg flex-grow-1 d-flex flex-column overflow-hidden">
                    <Card.Header className="bg-transparent border-secondary py-3 d-flex align-items-center gap-2">
                        <div className="bg-primary rounded-circle p-2 d-flex align-items-center justify-content-center">
                            <Bot size={20} className="text-white" />
                        </div>
                        <div>
                            <h5 className="mb-0 themed-text-primary">Course Craft</h5>
                            <small className="themed-text-secondary">Powered by Google AI</small>
                        </div>
                    </Card.Header>

                    <Card.Body
                        ref={scrollRef}
                        className="p-4 overflow-auto d-flex flex-column gap-3"
                        style={{ height: '500px' }}
                    >
                        <AnimatePresence initial={false}>
                            {messages.map((msg, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    className={`d-flex ${msg.role === 'user' ? 'justify-content-end' : 'justify-content-start'}`}
                                >
                                    <div
                                        className={`p-3 rounded-4 max-w-75 shadow-sm ${msg.role === 'user'
                                            ? 'bg-primary text-white'
                                            : 'themed-input'
                                            }`}
                                        style={{ maxWidth: '80%' }}

                                    >
                                        <div className="d-flex align-items-center gap-2 mb-1">
                                            {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                                            <span className="fw-bold x-small uppercase" style={{ fontSize: '0.7rem', letterSpacing: '0.05em' }}>
                                                {msg.role === 'user' ? 'YOU' : 'GEMINI'}
                                            </span>
                                        </div>
                                        <div className="markdown-content">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                {typeof msg.content === 'object' ? msg.content.text : msg.content}
                                            </ReactMarkdown>
                                        </div>


                                        {msg.content?.sources && msg.content.sources.length > 0 && (
                                            <div className="mt-3 pt-2 border-top border-secondary">
                                                <div className="d-flex align-items-center gap-1 mb-2 opacity-75">
                                                    <Globe size={12} />
                                                    <span style={{ fontSize: '0.65rem', fontWeight: 'bold' }}>SOURCES</span>
                                                </div>
                                                <div className="d-flex flex-wrap gap-2">
                                                    {msg.content.sources.map((source, sIdx) => (
                                                        <a
                                                            key={sIdx}
                                                            href={source.url}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="text-decoration-none"
                                                        >
                                                            <Badge
                                                                bg="light"
                                                                text="dark"
                                                                className="bg-opacity-10 text-white border border-secondary py-1 px-2 d-flex align-items-center gap-1"
                                                            >
                                                                <span className="text-truncate" style={{ maxWidth: '120px' }}>{source.title}</span>
                                                                <ExternalLink size={10} />
                                                            </Badge>
                                                        </a>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                </motion.div>
                            ))}
                        </AnimatePresence>
                        {loading && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="d-flex justify-content-start align-items-center gap-2"
                            >
                                <div className="themed-input p-3 rounded-4 shadow-sm d-flex align-items-center gap-2">
                                    <Spinner animation="grow" size="sm" variant="primary" />
                                    <Spinner animation="grow" size="sm" variant="primary" />
                                    <Spinner animation="grow" size="sm" variant="primary" />
                                </div>
                                <small className="text-secondary opacity-75">Gemini is answering in the background. You can safely return to the roadmap.</small>
                            </motion.div>
                        )}
                        {chatError && (
                            <Alert variant="danger" className="bg-danger bg-opacity-10 border-danger text-white py-2 px-3 mb-0 rounded-4">
                                <span>Failed to generate response: {chatError}</span>
                                <div className="mt-2 d-flex gap-2">
                                    <Button 
                                        variant="outline-light" 
                                        size="sm" 
                                        onClick={() => {
                                            const failedTask = activeTasks.find(t => t.taskType === 'chat' && t.status === 'failed');
                                            if (failedTask) {
                                                dismissBackgroundTask(failedTask.id);
                                                triggerGenerationTask('chat', 'AI Chat Assistant', 'chat', failedTask.contextInfo);
                                            }
                                        }}
                                    >
                                        Retry
                                    </Button>
                                    <Button 
                                        variant="link" 
                                        className="text-white text-decoration-none p-0 small" 
                                        onClick={() => {
                                            const failedTask = activeTasks.find(t => t.taskType === 'chat' && t.status === 'failed');
                                            if (failedTask) dismissBackgroundTask(failedTask.id);
                                        }}
                                    >
                                        Dismiss
                                    </Button>
                                </div>
                            </Alert>
                        )}
                    </Card.Body>

                    <Card.Footer className="bg-transparent border-secondary p-4">
                        {/* Suggestion Chips */}
                        <div className="d-flex flex-wrap gap-2 mb-3">
                            {getSuggestionChips().map((chipText, cIdx) => (
                                <Button
                                    key={cIdx}
                                    variant="outline-primary"
                                    size="sm"
                                    onClick={() => handleChipClick(chipText)}
                                    disabled={loading}
                                    className="rounded-pill px-3 py-1"
                                    style={{ fontSize: '0.8rem' }}
                                >
                                    {chipText}
                                </Button>
                            ))}
                        </div>
                        <Form onSubmit={handleSend}>
                            <Stack direction="horizontal" gap={2}>
                                <Form.Control
                                    ref={inputRef}
                                    className="themed-input border-0 py-3 px-4"
                                    placeholder="Ask anything about your learning path..."
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    disabled={loading}
                                    style={{ borderRadius: '25px' }}
                                />
                                <Button
                                    type="submit"
                                    variant="primary"
                                    className="rounded-circle p-3 d-flex align-items-center justify-content-center"
                                    disabled={loading || !input.trim()}
                                    style={{ width: '54px', height: '54px' }}
                                >
                                    <Send size={20} />
                                </Button>
                            </Stack>
                        </Form>
                    </Card.Footer>
                </Card>
            </Col>
        </Row>
    );
};

export default Chat;
