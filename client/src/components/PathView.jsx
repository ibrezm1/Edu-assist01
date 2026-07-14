import React, { useState, useEffect } from 'react';
import { aiService } from '../services/aiService';
import { storageService } from '../services/storageService';

import { motion } from 'framer-motion';
import { Row, Col, Card, Button, Form, InputGroup, Badge, Spinner, Collapse } from 'react-bootstrap';
import { CheckCircle, PlayCircle, BookOpen, Lock, Edit2, FileText, GraduationCap, Code2, Play, RefreshCw, XCircle } from 'lucide-react';
import TopNavigation from './TopNavigation';


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


const PathView = ({ settings, topic, assessmentResults, onOpenNode, completedNodes, pathData, setPathData, onHome, onOpenChat, onOpenSettings, backgroundTasks = {}, triggerGenerationTask, dismissBackgroundTask }) => {


    const [loading, setLoading] = useState(!pathData);
    const isFinalized = !!pathData?.isFinalized;
    const [refinementText, setRefinementText] = useState('');
    const [refining, setRefining] = useState(false);
    const [highlightedIds, setHighlightedIds] = useState([]);
    const [showSummary, setShowSummary] = useState(false);

    const renderBadgeIndicator = (node, taskType, label, icon) => {
        const nodeTasks = Object.values(backgroundTasks).filter(t => t.nodeId === node.id && t.taskType === taskType);
        nodeTasks.sort((a, b) => b.timestamp - a.timestamp);
        const latestTask = nodeTasks[0];

        let hasContent = false;
        if (taskType === 'resources') hasContent = !!node.resources;
        else if (taskType === 'flashcards') hasContent = node.flashcards && node.flashcards.length > 0;
        else if (taskType === 'papers') hasContent = node.researchPapers && node.researchPapers.length > 0;
        else if (taskType === 'problems') hasContent = node.practiceProblems && node.practiceProblems.length > 0;
        else if (taskType === 'quiz') hasContent = node.quiz && node.quiz.length > 0;

        let status = 'idle';
        if (latestTask) {
            status = latestTask.status;
        }

        let bg = 'secondary';
        let text = 'text-secondary';
        let isSpinning = false;
        let showTrigger = false;

        if (status === 'generating') {
            bg = 'primary';
            text = 'text-primary';
            isSpinning = true;
        } else if (hasContent) {
            bg = 'success';
            text = 'text-success';
        } else if (status === 'failed') {
            bg = 'danger';
            text = 'text-danger';
            showTrigger = true;
        } else {
            showTrigger = true;
        }

        const subViewMap = {
            'resources': 'main',
            'flashcards': 'flashcards',
            'papers': 'papers',
            'problems': 'problems',
            'quiz': 'quiz'
        };

        const handleBadgeClick = (e) => {
            e.stopPropagation();
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
                {showTrigger && !isSpinning && (
                    <Button 
                        variant="link" 
                        className={`p-0 text-decoration-none text-${bg} font-weight-bold ms-1`} 
                        style={{ fontSize: '0.65rem', lineHeight: 1 }}
                        onClick={(e) => {
                            e.stopPropagation();
                            let contextInfo = "";
                            if (taskType === 'quiz') contextInfo = node.title + ": " + node.description;
                            else contextInfo = node.description;
                            triggerGenerationTask(node.id, node.title, taskType, contextInfo);
                        }}
                    >
                        [+ Gen]
                    </Button>
                )}
            </Badge>
        );
    };


    useEffect(() => {
        const generatePath = async () => {
            if (!topic || pathData) {
                if (pathData) setLoading(false);
                return;
            }


            try {
                const data = await aiService.generatePath(topic, assessmentResults, settings);
                setPathData(data);
                storageService.savePath(topic, data);
                setLoading(false);
            } catch (err) {
                console.error(err);
                const msg = err.message || 'Failed to generating path.';
                alert(`${msg}\n\nPlease check your API Key in Settings.`);
                setLoading(false);
            }

        };
        generatePath();
    }, [settings, topic, assessmentResults, pathData, setPathData]);



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


    const handleRefine = async () => {

        if (!refinementText.trim()) return;
        setRefining(true);
        try {
            const data = await aiService.refinePath(topic, pathData.nodes, refinementText, settings);
            const newNodes = data.nodes;



            // Calculate changes to highlight
            const oldNodesMap = new Map(pathData.nodes.map(n => [n.id, n]));
            const changes = [];

            newNodes.forEach(n => {
                if (!oldNodesMap.has(n.id)) {
                    changes.push(n.id); // Newly added
                } else {
                    const old = oldNodesMap.get(n.id);
                    // Check if significant content changed
                    if (old.title !== n.title || old.description !== n.description) {
                        changes.push(n.id); // Modified
                    }
                }
            });

            setHighlightedIds(changes);
            const updatedPath = { ...pathData, nodes: newNodes };
            setPathData(updatedPath);
            storageService.savePath(topic, updatedPath);
            setRefinementText('');


            // Remove highlight after 5 seconds
            setTimeout(() => setHighlightedIds([]), 5000);

        } catch (e) {
            alert("Failed to refine path.");
        } finally {
            setRefining(false);
        }
    };

    if (loading) return (
        <div className="text-center mt-5">
            <Spinner animation="border" variant="primary" />
            <h2 className="mt-3">Generating your personalized learning path...</h2>
            <p className="text-secondary">Analyzing your assessment results to tailor the content.</p>
        </div>
    );

    if (!pathData) return <div className="text-center mt-5 text-danger">Failed to load path.</div>;

    return (
        <Row className="justify-content-center">
            <Col md={10} lg={8}>
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

                {Object.keys(backgroundTasks).length > 0 && (
                    <Card className="themed-card border-secondary mb-4 shadow-sm">
                        <Card.Header className="border-secondary py-2 bg-secondary bg-opacity-10 d-flex justify-content-between align-items-center">
                            <span className="fw-bold themed-text-primary d-flex align-items-center gap-2" style={{ fontSize: '0.9rem' }}>
                                <RefreshCw size={14} className="text-primary spin-slow" /> Active Background Tasks (Latest First)
                            </span>
                        </Card.Header>
                        <Card.Body className="p-3">
                            <div className="d-flex flex-column gap-2">
                                {Object.values(backgroundTasks)
                                    .sort((a, b) => b.timestamp - a.timestamp)
                                    .map(task => {
                                        const isGenerating = task.status === 'generating';
                                        const isCompleted = task.status === 'completed';
                                        const isFailed = task.status === 'failed';
                                        
                                        return (
                                            <div 
                                                key={task.id} 
                                                className="d-flex align-items-center justify-content-between border border-secondary border-opacity-25 rounded p-2 bg-secondary bg-opacity-5 hover-action-row" 
                                                style={{ fontSize: '0.85rem', cursor: 'pointer', transition: 'background-color 0.2s ease' }}
                                                title="Click to go to this task and view progress"
                                                onClick={() => {
                                                    if (task.taskType === 'chat') {
                                                        onOpenChat();
                                                        return;
                                                    }
                                                    const matchingNode = pathData.nodes.find(n => n.id === task.nodeId);
                                                    if (matchingNode) {
                                                        const subViewMap = {
                                                            'flashcards': 'flashcards',
                                                            'quiz': 'quiz',
                                                            'papers': 'papers',
                                                            'problems': 'problems',
                                                            'resources': 'main'
                                                        };
                                                        localStorage.setItem(`getpath_active_subview_${task.nodeId}`, subViewMap[task.taskType] || 'main');
                                                        if (task.taskType === 'flashcards') {
                                                            localStorage.setItem(`getpath_current_card_index_${task.nodeId}`, '0');
                                                        }
                                                        onOpenNode(matchingNode);
                                                    }
                                                }}
                                            >
                                                <div className="d-flex align-items-center gap-2">
                                                    {isGenerating && <Spinner animation="border" size="sm" variant="primary" style={{ width: '12px', height: '12px' }} />}
                                                    {isCompleted && <CheckCircle size={14} className="text-success" />}
                                                    {isFailed && <XCircle size={14} className="text-danger" />}
                                                    <span>
                                                        <strong className="themed-text-primary">{task.nodeTitle}</strong>:{" "}
                                                        <span className="text-secondary text-capitalize">{task.taskType}</span>{" "}
                                                        {isGenerating && <span className="text-primary">(Generating...)</span>}
                                                        {isCompleted && <span className="text-success">(Completed!)</span>}
                                                        {isFailed && <span className="text-danger">(Failed: {task.error})</span>}
                                                        <TaskTimer task={task} />
                                                    </span>
                                                </div>
                                                <div className="d-flex gap-2">
                                                    {isFailed && (
                                                        <Button 
                                                            variant="outline-primary" 
                                                            size="sm" 
                                                            className="py-0 px-2"
                                                            style={{ fontSize: '0.75rem' }}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                dismissBackgroundTask(task.id);
                                                                triggerGenerationTask(task.nodeId, task.nodeTitle, task.taskType, task.contextInfo);
                                                            }}
                                                        >
                                                            Retry
                                                        </Button>
                                                    )}
                                                    {(isCompleted || isFailed) && (
                                                        <Button 
                                                            variant="outline-secondary" 
                                                            size="sm" 
                                                            className="py-0 px-2 text-white" 
                                                            style={{ fontSize: '0.75rem' }}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                dismissBackgroundTask(task.id);
                                                            }}
                                                        >
                                                            Dismiss
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                        </Card.Body>
                    </Card>
                )}

                <div className="d-flex flex-column gap-3">
                    {pathData.nodes.map((node, index) => {
                        const isCompleted = completedNodes.includes(node.id);
                        const isLocked = false; // index > 0 && !completedNodes.includes(pathData.nodes[index - 1].id);
                        const isHighlighted = highlightedIds.includes(node.id);

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
                                        borderColor: isHighlighted ? 'var(--bs-warning)' : ''
                                    }}
                                >
                                    <Card.Body className="d-flex align-items-center">
                                        {isHighlighted && (
                                            <Badge bg="warning" text="dark" className="position-absolute top-0 end-0 m-2">
                                                UPDATED
                                            </Badge>
                                        )}
                                        <div className="me-3">
                                            {!isFinalized ? <BookOpen size={24} className="themed-text-secondary" /> :
                                                isLocked ? <Lock size={24} /> : isCompleted ? <CheckCircle size={24} className="text-success" /> : <PlayCircle size={24} className="text-primary" />}
                                        </div>
                                        <div className="flex-grow-1">
                                            <Card.Title className="themed-text-primary">{node.title}</Card.Title>


                                            <Card.Text className="themed-text-secondary mb-1">{node.description}</Card.Text>
                                            <Badge bg="secondary" className="bg-opacity-10">{node.estimatedTime}</Badge>

                                            {isFinalized && !isLocked && (
                                                 <div className="d-flex flex-wrap gap-2 mt-2" onClick={(e) => e.stopPropagation()}>
                                                     {renderBadgeIndicator(node, 'resources', 'Resources', <Play size={10} />)}
                                                     {renderBadgeIndicator(node, 'flashcards', 'Flashcards', <BookOpen size={10} />)}
                                                     {renderBadgeIndicator(node, 'papers', 'Papers', <GraduationCap size={10} />)}
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
                                    <Button variant="outline-light" onClick={handleRefine} disabled={refining}>
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
            </Col>
        </Row>
    );
};

export default PathView;
