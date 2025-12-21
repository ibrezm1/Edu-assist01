import React, { useState, useEffect, useRef } from 'react';
import { Row, Col, Card, Form, Button, Spinner, Stack, Badge } from 'react-bootstrap';

import { ArrowLeft, Send, User, Bot, Trash2, ExternalLink, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { aiService } from '../services/aiService';


const Chat = ({ settings, onBack }) => {
    const [messages, setMessages] = useState([
        { role: 'assistant', content: 'Hello! I am your personal Gemini tutor. How can I help you with your learning journey today?' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, loading]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMsg = { role: 'user', content: input };
        const newMessages = [...messages, userMsg];
        setMessages(newMessages);
        setInput('');
        setLoading(true);

        try {
            const response = await aiService.chat(newMessages, settings);
            setMessages(prev => [...prev, { role: 'assistant', content: response }]);
        } catch (err) {

            console.error(err);
            setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please check your API key and try again.' }]);
        } finally {
            setLoading(false);
        }
    };

    const clearChat = () => {
        if (window.confirm('Clear chat history?')) {
            setMessages([{ role: 'assistant', content: 'Hello! I am your personal Gemini tutor. How can I help you with your learning journey today?' }]);
        }
    };

    return (
        <Row className="justify-content-center h-100">
            <Col md={10} lg={8} className="d-flex flex-column" style={{ minHeight: '80vh' }}>
                <div className="mb-4 d-flex justify-content-between align-items-center">
                    <Button variant="link" onClick={onBack} className="themed-text-primary text-decoration-none p-0 d-flex align-items-center opacity-75">
                        <ArrowLeft size={18} className="me-2" /> Back to Dashboard
                    </Button>
                    <Button variant="link" onClick={clearChat} className="text-danger text-decoration-none p-0 d-flex align-items-center opacity-75">
                        <Trash2 size={18} className="me-2" /> Clear Chat
                    </Button>
                </div>

                <Card className="themed-card shadow-lg flex-grow-1 d-flex flex-column overflow-hidden">
                    <Card.Header className="bg-transparent border-secondary py-3 d-flex align-items-center gap-2">
                        <div className="bg-primary rounded-circle p-2 d-flex align-items-center justify-content-center">
                            <Bot size={20} className="text-white" />
                        </div>
                        <div>
                            <h5 className="mb-0 themed-text-primary">Gemini Tutor</h5>
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
                                        style={{ maxWidth: '80%', whiteSpace: 'pre-wrap' }}
                                    >
                                        <div className="d-flex align-items-center gap-2 mb-1">
                                            {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                                            <span className="fw-bold x-small uppercase" style={{ fontSize: '0.7rem', letterSpacing: '0.05em' }}>
                                                {msg.role === 'user' ? 'YOU' : 'GEMINI'}
                                            </span>
                                        </div>
                                        <div>
                                            {typeof msg.content === 'object' ? msg.content.text : msg.content}
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
                                className="d-flex justify-content-start"
                            >
                                <div className="themed-input p-3 rounded-4 shadow-sm d-flex align-items-center gap-2">
                                    <Spinner animation="grow" size="sm" variant="primary" />
                                    <Spinner animation="grow" size="sm" variant="primary" />
                                    <Spinner animation="grow" size="sm" variant="primary" />
                                </div>
                            </motion.div>
                        )}
                    </Card.Body>

                    <Card.Footer className="bg-transparent border-secondary p-4">
                        <Form onSubmit={handleSend}>
                            <Stack direction="horizontal" gap={2}>
                                <Form.Control
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
