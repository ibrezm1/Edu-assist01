import React, { useState, useEffect } from 'react';
import { aiService } from '../services/aiService';
import { storageService } from '../services/storageService';

import { motion } from 'framer-motion';
import { Row, Col, Card, Button, Form, InputGroup, Badge, Spinner, Collapse, Container } from 'react-bootstrap';
import { CheckCircle, PlayCircle, BookOpen, Lock, Edit2, FileText, GraduationCap, Code2, Play, RefreshCw, XCircle, Book } from 'lucide-react';
import TopNavigation from './TopNavigation';
import ActiveTasksPanel from './ActiveTasksPanel';


const TaskTimer = ({ task }) => {
    const [elapsed, setElapsed] = useState(() => {
        if (task.status === 'generating') {
            return Math.max(0, Math.round((Date.now() - task.timestamp) / 1000));
        }
        return task.duration || 0;
    });

    useEffect(() => {
        if (task.status !== 'generating') {
            setElapsed(task.duration || 0);
            return;
        }

        const interval = setInterval(() => {
            setElapsed(Math.max(0, Math.round((Date.now() - task.timestamp) / 1000)));
        }, 1000);

        return () => clearInterval(interval);
    }, [task.status, task.timestamp, task.duration]);

    return (
        <span className="text-secondary small ms-2 fw-semibold animate-pulse" style={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
            {task.status === 'generating' ? `${elapsed}s elapsed` : `(took ${elapsed}s)`}
        </span>
    );
};


const PathView = ({ settings, topic, assessmentResults, onOpenNode, completedNodes, pathData, setPathData, onHome, onOpenChat, onOpenSettings, backgroundTasks = {}, triggerGenerationTask, dismissBackgroundTask, killBackgroundTask, onOpenAssessment, onOpenPath, dismissAllTasks }) => {


    const [loading, setLoading] = useState(!pathData);
    const isFinalized = !!pathData?.isFinalized;
    const [refinementText, setRefinementText] = useState('');
    const [highlightedIds, setHighlightedIds] = useState({});
    const [showSummary, setShowSummary] = useState(false);

    const activeRefineTask = Object.values(backgroundTasks).find(
        t => t.taskType === 'refine' && t.nodeTitle === topic && t.status === 'generating'
    );
    const refining = !!activeRefineTask;

    useEffect(() => {
        window.getpath_setHighlightedIds = setHighlightedIds;
        return () => {
            window.getpath_setHighlightedIds = null;
        };
    }, []);

    const renderBadgeIndicator = (node, taskType, label, icon) => {
        const nodeTasks = Object.values(backgroundTasks).filter(t => t.nodeId === node.id && t.taskType === taskType);
        nodeTasks.sort((a, b) => b.timestamp - a.timestamp);
        const latestTask = nodeTasks[0];

        let hasContent = false;
        if (taskType === 'resources') hasContent = !!node.resources;
        else if (taskType === 'flashcards') hasContent = node.flashcards && node.flashcards.length > 0;
        else if (taskType === 'papers') hasContent = node.researchPapers && node.researchPapers.length > 0;
        else if (taskType === 'books') hasContent = node.books && node.books.length > 0;
        else if (taskType === 'problems') hasContent = node.practiceProblems && node.practiceProblems.length > 0;
        else if (taskType === 'quiz') hasContent = node.quiz && node.quiz.length > 0;

        let status = 'idle';
        if (latestTask) {
            status = latestTask.status;
        }

        let bg = 'secondary';
        let text = 'text-secondary';
        let isSpinning = false;

        if (status === 'generating') {
            bg = 'warning';
            text = 'text-warning';
            isSpinning = true;
        } else if (hasContent) {
            bg = 'primary';
            text = 'text-primary';
        } else {
            bg = 'secondary';
            text = 'text-secondary';
        }

        const subViewMap = {
            'resources': 'main',
            'flashcards': 'flashcards',
            'papers': 'papers',
            'books': 'books',
            'problems': 'problems',
            'quiz': 'quiz'
        };

        const handleBadgeClick = (e) => {
            e.stopPropagation();
            if (!hasContent && status !== 'generating') {
                let contextInfo = "";
                if (taskType === 'quiz') contextInfo = node.title + ": " + node.description;
                else contextInfo = node.description;
                triggerGenerationTask(node.id, node.title, taskType, contextInfo);
                return;
            }
            localStorage.setItem(`getpath_active_subview_${node.id}`, subViewMap[taskType] || 'main');
            if (taskType === 'flashcards') {
                localStorage.setItem(`getpath_current_card_index_${node.id}`, '0');
            }
            onOpenNode(node);
        };

        return (
            <Badge 
                bg={bg} 
                className={`bg-opacity-10 d-inline-flex align-items-center gap-1 py-1 px-2 border border-${bg} border-opacity-25 rounded-pill hover-action-row`}
                style={{ fontSize: '0.7rem', cursor: 'pointer', transition: 'background-color 0.2s ease, border-color 0.2s ease' }}
                onClick={handleBadgeClick}
                title={`Click to open ${label}`}
            >
                {isSpinning ? <Spinner animation="border" size="sm" className="me-1" style={{ width: '10px', height: '10px' }} /> : icon}
                <span className={text}>{label}</span>
            </Badge>
        );
    };


    const activePathTask = Object.values(backgroundTasks).find(
        t => t.taskType === 'path' && t.nodeTitle === topic
    );

    const isGenerating = activePathTask?.status === 'generating';
    const isFailed = activePathTask?.status === 'failed';
    const errorMsg = activePathTask?.error;

    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
        if (pathData) {
            setLoading(false);
        } else if (!isGenerating && !isFailed) {
            setLoading(false);
        } else {
            setLoading(true);
        }
    }, [pathData, isGenerating, isFailed]);

    useEffect(() => {
        if (!activePathTask || activePathTask.status !== 'generating') return;
        setElapsed(Math.max(0, Math.round((Date.now() - activePathTask.timestamp) / 1000)));
        const interval = setInterval(() => {
            setElapsed(Math.max(0, Math.round((Date.now() - activePathTask.timestamp) / 1000)));
        }, 1000);
        return () => clearInterval(interval);
    }, [activePathTask]);



    // Clear highlighted IDs when the topic changes
    useEffect(() => {
        setHighlightedIds([]);
    }, [topic]);

    const handleToggleFinalized = async (status) => {
        try {
            storageService.finalizePath(topic, status);
            setPathData({ ...pathData, isFinalized: status });
        } catch (e) {
            alert("Failed to update path status.");
        }
    };


    const handleRefine = () => {
        if (!refinementText.trim()) return;
        
        triggerGenerationTask(
            null, 
            topic, 
            'refine', 
            JSON.stringify({ currentNodes: pathData.nodes, feedback: refinementText })
        );
        
        setRefinementText('');
    };

    if (isFailed) return (
        <Container className="py-5">
            <Row className="justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
                <Col md={8} lg={6} className="text-center">
                    <Card className="themed-card shadow-lg p-5">
                        <Card.Body>
                            <XCircle size={48} className="text-danger mb-4" />
                            <h3 className="themed-text-primary mb-3 fw-bold">Failed to Generate Learning Plan</h3>
                            <p className="themed-text-secondary small mb-4">{errorMsg || 'Please verify your settings and connection.'}</p>
                            <div className="d-flex justify-content-center gap-3">
                                <Button variant="outline-primary" onClick={onHome}>Go Home</Button>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );

    if (loading || isGenerating) return (
        <Container className="py-5">
            <Row className="justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
                <Col md={8} lg={6} className="text-center">
                    <Card className="themed-card shadow-lg p-5">
                        <Card.Body className="d-flex flex-column align-items-center justify-content-center">
                            <Spinner animation="border" variant="primary" className="mb-4" />
                            <h3 className="themed-text-primary mb-3 fw-bold">Generating Learning Plan ({elapsed}s)...</h3>
                            <p className="themed-text-secondary small mb-4">
                                Tailoring curriculum structure and topic checkpoints to your level.
                            </p>
                            <Button variant="outline-secondary" size="sm" onClick={onHome}>
                                Go Back Home
                            </Button>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );

    const handleGenerate = () => {
        if (!topic) return;
        const savedAssessment = localStorage.getItem(`getpath_assessment_results_${topic.toLowerCase()}`);
        if (savedAssessment) {
            triggerGenerationTask(null, topic, 'path', savedAssessment);
        } else {
            if (onOpenAssessment) {
                onOpenAssessment(topic);
            }
        }
    };

    if (!pathData || !pathData.nodes || pathData.nodes.length === 0) return (
        <Container className="py-5">
            <Row className="justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
                <Col md={8} lg={6} className="text-center">
                    <Card className="themed-card shadow-lg p-5">
                        <Card.Body>
                            <h3 className="themed-text-primary mb-3 fw-bold">No Active Learning Plan</h3>
                            <p className="themed-text-secondary small mb-4">Would you like to generate your learning plan or return home?</p>
                            <div className="d-flex justify-content-center gap-3">
                                <Button variant="primary" onClick={handleGenerate}>Generate Plan</Button>
                                <Button variant="outline-secondary" onClick={onHome}>Go Home</Button>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );

    return (
        <div className="content-wrapper">
                <TopNavigation
                    title={`${topic} Path`}
                    onBack={onHome}
                    onChat={onOpenChat}
                    onSettings={onOpenSettings}
                    theme={settings.theme}
                >
                    <div className="d-flex flex-column flex-lg-row gap-2 w-100 w-lg-auto">
                        <Button
                            variant="outline-secondary"
                            size="sm"
                            className={`d-flex align-items-center gap-2 justify-content-center ${showSummary ? 'active' : ''}`}
                            onClick={() => setShowSummary(!showSummary)}
                        >
                            {showSummary ? <FileText size={16} className="text-primary" /> : <FileText size={16} />}
                            <span>{showSummary ? 'Hide' : 'Show'} Summary</span>
                        </Button>

                        {isFinalized && (
                            <Button
                                variant="outline-primary"
                                size="sm"
                                className="d-flex align-items-center gap-2 justify-content-center"
                                onClick={() => handleToggleFinalized(false)}
                            >
                                <Edit2 size={16} />
                                <span>Edit Structure</span>
                            </Button>
                        )}
                    </div>
                </TopNavigation>

                <div className="mb-4 text-center">
                    <h1 className="fw-bold themed-text-primary">{topic} Mastery Path</h1>

                    <Collapse in={showSummary}>
                        <div>
                            <p className="themed-text-secondary lead mb-3 px-4">{pathData.summary}</p>
                        </div>
                    </Collapse>
                </div>

                <ActiveTasksPanel
                    backgroundTasks={backgroundTasks}
                    dismissBackgroundTask={dismissBackgroundTask}
                    killBackgroundTask={killBackgroundTask}
                    triggerGenerationTask={triggerGenerationTask}
                    onOpenAssessment={onOpenAssessment}
                    onOpenPath={onOpenPath}
                    onOpenChat={onOpenChat}
                    onOpenNode={onOpenNode}
                    pathData={pathData}
                    dismissAllTasks={dismissAllTasks}
                />

                <div className="d-flex flex-column gap-3">
                    {pathData.nodes.map((node, index) => {
                        const isCompleted = completedNodes.includes(node.id);
                        const isLocked = false; // index > 0 && !completedNodes.includes(pathData.nodes[index - 1].id);
                        const highlightType = highlightedIds[node.id];
                        const isHighlighted = !!highlightType;

                        return (
                            <motion.div
                                key={node.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={isHighlighted ? { opacity: 1, x: 0, scale: [1, 1.02, 1] } : { opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1, duration: 0.3 }}
                                onClick={() => isFinalized && !isLocked && onOpenNode(node)}
                            >
                                <Card
                                    className={`themed-card ${isFinalized && !isLocked ? 'cursor-pointer' : ''}`}

                                    style={{
                                        opacity: isFinalized && isLocked ? 0.5 : 1,
                                        cursor: isFinalized && !isLocked ? 'pointer' : 'default',
                                        borderLeft: `4px solid ${isFinalized ? (isLocked ? 'gray' : 'var(--bs-primary)') : 'gray'}`,
                                        borderColor: highlightType === 'added' ? 'var(--bs-success)' : (highlightType === 'modified' ? 'var(--bs-warning)' : ''),
                                        boxShadow: highlightType === 'added' ? '0 0 15px rgba(25, 135, 84, 0.25)' : (highlightType === 'modified' ? '0 0 15px rgba(255, 193, 7, 0.25)' : '')
                                    }}
                                >
                                    <Card.Body>
                                        {highlightType === 'added' && (
                                            <Badge bg="success" text="white" className="position-absolute top-0 end-0 m-2">
                                                NEWLY ADDED
                                            </Badge>
                                        )}
                                        {highlightType === 'modified' && (
                                            <Badge bg="warning" text="dark" className="position-absolute top-0 end-0 m-2">
                                                MODIFIED
                                            </Badge>
                                        )}
                                        <div className="d-flex align-items-center gap-2 mb-2">
                                            <div className="flex-shrink-0 d-flex align-items-center">
                                                {!isFinalized ? <BookOpen size={20} className="themed-text-secondary" /> :
                                                    isLocked ? <Lock size={20} /> : isCompleted ? <CheckCircle size={20} className="text-success" /> : <PlayCircle size={20} className="text-primary" />}
                                            </div>
                                            <Card.Title className="themed-text-primary mb-0">{node.title}</Card.Title>
                                        </div>
                                        <div>
                                            <Card.Text className="themed-text-secondary mb-1">{node.description}</Card.Text>
                                            <Badge bg="secondary" className="bg-opacity-10 mb-2">{node.estimatedTime}</Badge>

                                            {isFinalized && !isLocked && (
                                                 <div className="d-flex flex-wrap gap-2 mt-1" onClick={(e) => e.stopPropagation()}>
                                                     {renderBadgeIndicator(node, 'resources', 'Resources', <Play size={10} />)}
                                                     {renderBadgeIndicator(node, 'flashcards', 'Flashcards', <BookOpen size={10} />)}
                                                     {renderBadgeIndicator(node, 'papers', 'Papers', <GraduationCap size={10} />)}
                                                     {renderBadgeIndicator(node, 'books', 'Books', <Book size={10} />)}
                                                     {renderBadgeIndicator(node, 'problems', 'Tasks', <Code2 size={10} />)}
                                                     {renderBadgeIndicator(node, 'quiz', 'Quiz', <CheckCircle size={10} />)}
                                                 </div>
                                            )}
                                        </div>
                                    </Card.Body>
                                </Card>
                            </motion.div>
                        );
                    })}
                </div>

                {!isFinalized && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <Card className="mt-4 themed-card border-primary shadow">

                            <Card.Body>
                                <Card.Title className="mb-3 themed-text-primary">Customize your Journey</Card.Title>
                                <Card.Text className="themed-text-secondary mb-3">
                                    Review the topics above. Do you want to add or change anything before we finalize the curriculum?
                                </Card.Text>
                                <InputGroup className="mb-3">
                                    <Form.Control
                                        placeholder="e.g. 'Add a section on performance optimization' or 'Remove the basics'"
                                        value={refinementText}
                                        onChange={(e) => setRefinementText(e.target.value)}
                                        className="themed-input"

                                    />
                                    <Button variant="primary" onClick={handleRefine} disabled={refining}>
                                        {refining ? 'Updating...' : 'Update Path'}
                                    </Button>
                                </InputGroup>
                                <hr className="border-secondary my-3" />
                                <div className="text-end">
                                    <Button variant="success" size="lg" onClick={() => handleToggleFinalized(true)}>
                                        Looks Good, Start Learning!
                                    </Button>
                                </div>

                            </Card.Body>
                        </Card>
                    </motion.div>
                )}

                <Card className="mt-4 themed-card border-secondary border-opacity-10 shadow-sm">
                    <Card.Body className="py-3 px-4 d-flex flex-column align-items-center">
                        <div className="text-secondary small mb-2 fw-semibold">
                            Search Quest "{topic}" on:
                        </div>
                        <div className="d-flex flex-wrap justify-content-center gap-2">
                            <Button 
                                variant="outline-secondary" 
                                size="sm" 
                                className="rounded-pill px-3 py-1 text-decoration-none"
                                onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(topic)}`, '_blank')}
                            >
                                Google
                            </Button>
                            <Button 
                                variant="outline-secondary" 
                                size="sm" 
                                className="rounded-pill px-3 py-1 text-decoration-none"
                                onClick={() => window.open(`https://duckduckgo.com/?q=${encodeURIComponent(topic)}`, '_blank')}
                            >
                                DuckDuckGo
                            </Button>
                            <Button 
                                variant="outline-secondary" 
                                size="sm" 
                                className="rounded-pill px-3 py-1 text-decoration-none"
                                onClick={() => window.open(`https://www.perplexity.ai/search?q=${encodeURIComponent(topic)}`, '_blank')}
                            >
                                Perplexity
                            </Button>
                            <Button 
                                variant="outline-secondary" 
                                size="sm" 
                                className="rounded-pill px-3 py-1 text-decoration-none"
                                onClick={() => window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(topic)}`, '_blank')}
                            >
                                YouTube
                            </Button>
                            <Button 
                                variant="outline-secondary" 
                                size="sm" 
                                className="rounded-pill px-3 py-1 text-decoration-none"
                                onClick={() => window.open(`https://news.google.com/search?q=${encodeURIComponent(topic)}`, '_blank')}
                            >
                                Google News
                            </Button>
                            <Button 
                                variant="outline-secondary" 
                                size="sm" 
                                className="rounded-pill px-3 py-1 text-decoration-none"
                                onClick={() => window.open(`https://www.bing.com/news/search?q=${encodeURIComponent(topic)}`, '_blank')}
                            >
                                Bing News
                            </Button>
                        </div>
                    </Card.Body>
                </Card>
        </div>
    );
};

export default PathView;
