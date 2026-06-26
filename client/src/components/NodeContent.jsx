import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

import { Row, Col, Card, Button, Spinner, ListGroup, Badge, Alert, Stack } from 'react-bootstrap';
import { CheckCircle, XCircle, ExternalLink, Play, ArrowLeft, RefreshCw, BookOpen, FileText, Sparkles, ChevronLeft, ChevronRight, RotateCcw, LayoutGrid, List, Code2, Award, Copy, Check } from 'lucide-react';
import { aiService } from '../services/aiService';

import { storageService } from '../services/storageService';
import TopNavigation from './TopNavigation';



const NodeContent = ({ node, settings, topic, onBack, onCompleteNode, updateNodeResources, updateNodeFlashcards, updateNodeResearchPapers, updateNodePracticeProblems, onOpenChat, onOpenSettings, theme }) => {

    const [showQuiz, setShowQuiz] = useState(false);
    const [quizQuestions, setQuizQuestions] = useState([]);
    const [quizLoading, setQuizLoading] = useState(false);
    const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
    const [quizAnswers, setQuizAnswers] = useState({});
    const [quizScore, setQuizScore] = useState(null);

    const [resourcesLoading, setResourcesLoading] = useState(!node.resources);
    const [resourceError, setResourceError] = useState(null);

    const [activeSubView, setActiveSubView] = useState('main'); // 'main', 'flashcards', 'papers'
    const [cardViewMode, setCardViewMode] = useState('flip'); // 'flip' or 'list'
    const [currentCardIndex, setCurrentCardIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);

    const [flashcardsLoading, setFlashcardsLoading] = useState(false);
    const [flashcardsError, setFlashcardsError] = useState(null);

    const [papersLoading, setPapersLoading] = useState(false);
    const [papersError, setPapersError] = useState(null);

    const [problemsLoading, setProblemsLoading] = useState(false);
    const [problemsError, setProblemsError] = useState(null);
    const [activeProblemGroup, setActiveProblemGroup] = useState('A');
    const [copiedTaskId, setCopiedTaskId] = useState(null);
    const [completedTasks, setCompletedTasks] = useState(() => {
        try {
            const data = localStorage.getItem(`completed_tasks_${node.id}`);
            return data ? JSON.parse(data) : {};
        } catch (e) {
            return {};
        }
    });


    useEffect(() => {
        // Lazy load resources if not present
        const fetchResources = async () => {
            if (node.resources) {
                setResourcesLoading(false);
                return;
            }

            setResourcesLoading(true);
            setResourceError(null);
            try {
                const data = await aiService.generateResources(topic, node.title, node.description, settings);
                if (data && data.resources) {
                    updateNodeResources(node.id, data.resources);
                    storageService.updateResources(topic, node.title, data.resources);
                } else {
                    throw new Error("No resources found in AI response.");
                }
                setResourcesLoading(false);
            } catch (e) {
                console.error(e);
                setResourceError(e.message || "Failed to load resources.");
                setResourcesLoading(false);
            }
        };
        fetchResources();
    }, [settings, topic, node.id, updateNodeResources]); // Use node.id to avoid unnecessary re-runs

    const handleRefreshResources = async () => {
        if (resourcesLoading) return;

        setResourcesLoading(true);
        setResourceError(null);
        try {
            const data = await aiService.generateResources(topic, node.title, node.description, settings);
            if (data && data.resources) {
                updateNodeResources(node.id, data.resources);
                storageService.updateResources(topic, node.title, data.resources);
            } else {
                throw new Error("No resources found in AI response.");
            }
        } catch (e) {
            console.error(e);
            setResourceError("Failed to refresh resources. Please try again.");
        } finally {
            setResourcesLoading(false);
        }
    };




    const startQuiz = async () => {
        setQuizLoading(true);
        try {
            const data = await aiService.generateQuiz(node.title + ": " + node.description, settings);
            setQuizQuestions(data.questions);
            setShowQuiz(true);

        } catch (e) {

            alert('Failed to load quiz');
        } finally {
            setQuizLoading(false);
        }
    };

    const handleQuizAnswer = (idx) => {
        if (quizAnswers[quizQuestions[currentQuizIndex].id] !== undefined) return;
        setQuizAnswers({ ...quizAnswers, [quizQuestions[currentQuizIndex].id]: idx });
    };



    const nextQuizQuestion = () => {
        if (currentQuizIndex < quizQuestions.length - 1) {
            setCurrentQuizIndex(c => c + 1);
        } else {
            // Finish
            let score = 0;
            quizQuestions.forEach(q => {
                if (quizAnswers[q.id] === q.correctAnswerIndex) score++;
            });
            setQuizScore(score);
            if (score >= quizQuestions.length - 1) { // Allow 1 mistake maybe? Or strict.
                onCompleteNode(true);
            }
        }
    };
    const startFlashcards = async () => {
        setActiveSubView('flashcards');
        if (node.flashcards && node.flashcards.length > 0) return;

        setFlashcardsLoading(true);
        setFlashcardsError(null);
        try {
            const data = await aiService.generateFlashcards(topic, node.title, node.description, settings);
            if (data && data.flashcards) {
                updateNodeFlashcards(node.id, data.flashcards);
                storageService.updateFlashcards(topic, node.title, data.flashcards);
            } else {
                throw new Error("No flashcards returned in AI response.");
            }
        } catch (e) {
            console.error("Flashcards Error:", e);
            setFlashcardsError(e.message || "Failed to generate study flashcards.");
        } finally {
            setFlashcardsLoading(false);
        }
    };

    const startResearchPapers = async () => {
        setActiveSubView('papers');
        if (node.researchPapers && node.researchPapers.length > 0) return;

        setPapersLoading(true);
        setPapersError(null);
        try {
            const data = await aiService.generateResearchPapers(topic, node.title, settings);
            if (data && data.papers) {
                updateNodeResearchPapers(node.id, data.papers);
                storageService.updateResearchPapers(topic, node.title, data.papers);
            } else {
                throw new Error("No research papers returned in AI response.");
            }
        } catch (e) {
            console.error("Research Papers Error:", e);
            setPapersError(e.message || "Failed to fetch research papers.");
        } finally {
            setPapersLoading(false);
        }
    };

    const startPracticeProblems = async () => {
        setActiveSubView('problems');
        if (node.practiceProblems && node.practiceProblems.length > 0) return;

        setProblemsLoading(true);
        setProblemsError(null);
        try {
            const data = await aiService.generatePracticeProblems(topic, node.title, node.description, settings);
            if (data && data.problems) {
                updateNodePracticeProblems(node.id, data.problems);
                storageService.updatePracticeProblems(topic, node.title, data.problems);
            } else {
                throw new Error("No practice problems returned in AI response.");
            }
        } catch (e) {
            console.error("Practice Problems Error:", e);
            setProblemsError(e.message || "Failed to generate study practice tasks.");
        } finally {
            setProblemsLoading(false);
        }
    };

    const handleToggleTaskCompleted = (taskId) => {
        const nextCompleted = {
            ...completedTasks,
            [taskId]: !completedTasks[taskId]
        };
        setCompletedTasks(nextCompleted);
        try {
            localStorage.setItem(`completed_tasks_${node.id}`, JSON.stringify(nextCompleted));
        } catch (e) {
            console.error("Failed to save completed task status", e);
        }
    };

    const handleCopyTask = (taskId, text) => {
        navigator.clipboard.writeText(text);
        setCopiedTaskId(taskId);
        setTimeout(() => setCopiedTaskId(null), 2000);
    };

    const handlePrevCard = () => {
        setIsFlipped(false);
        setTimeout(() => {
            setCurrentCardIndex(prev => (prev > 0 ? prev - 1 : node.flashcards.length - 1));
        }, 150);
    };

    const handleNextCard = () => {
        setIsFlipped(false);
        setTimeout(() => {
            setCurrentCardIndex(prev => (prev < node.flashcards.length - 1 ? prev + 1 : 0));
        }, 150);
    };

    if (showQuiz) {
        return (
            <Row className="justify-content-center">
                <Col md={8} lg={6}>
                    <TopNavigation
                        title={`Checkpoint: ${node.title}`}
                        onBack={() => setShowQuiz(false)}
                        onChat={onOpenChat}
                        onSettings={onOpenSettings}
                        theme={theme}
                    />
                    <Card className="themed-card shadow-lg">

                        <Card.Header className="border-secondary d-flex justify-content-between align-items-center">
                            <h3 className="mb-0 themed-text-primary">Checkpoint: {node.title}</h3>
                        </Card.Header>
                        <Card.Body className="p-4">
                            {quizScore !== null ? (
                                <div className="text-center">
                                    <h3 className="mb-4 themed-text-primary">You scored {quizScore} / {quizQuestions.length}</h3>


                                    {quizScore >= quizQuestions.length - 1 ? (
                                        <div>
                                            <p className="text-success fs-4 mb-4">Great job! Node Completed.</p>
                                            <Button variant="success" size="lg" onClick={onBack}>Return to Path</Button>
                                        </div>
                                    ) : (
                                        <div>
                                            <p className="text-danger fs-4 mb-4">You need to review the material.</p>
                                            <Button variant="outline-light" onClick={() => {
                                                setShowQuiz(false);
                                                setQuizScore(null);
                                                setCurrentQuizIndex(0);
                                                setQuizAnswers({});
                                            }}>Try Again / Review</Button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div>
                                    <p className="text-muted mb-2">Question {currentQuizIndex + 1} of {quizQuestions.length}</p>
                                    <h4 className="mb-4 themed-text-primary">{quizQuestions[currentQuizIndex].text}</h4>


                                    <div className="d-grid gap-3">
                                        {quizQuestions[currentQuizIndex].options.map((opt, i) => {
                                            const isSelected = quizAnswers[quizQuestions[currentQuizIndex].id] === i;
                                            const isCorrect = i === quizQuestions[currentQuizIndex].correctAnswerIndex;
                                            const showFeedback = quizAnswers[quizQuestions[currentQuizIndex].id] !== undefined;

                                            let variant = 'outline-secondary';
                                            if (showFeedback) {
                                                if (isCorrect) variant = 'success';
                                                else if (isSelected) variant = 'danger';
                                            }

                                            return (
                                                <Button
                                                    key={i}
                                                    variant={variant}
                                                    className={`text-start d-flex justify-content-between align-items-center ${isSelected && !showFeedback ? 'text-white' : ''}`}
                                                    onClick={() => handleQuizAnswer(i)}
                                                    disabled={showFeedback}
                                                >
                                                    <span>{opt}</span>
                                                    {showFeedback && isCorrect && <CheckCircle size={18} />}
                                                    {showFeedback && isSelected && !isCorrect && <XCircle size={18} />}
                                                </Button>
                                            );
                                        })}
                                    </div>

                                    {quizAnswers[quizQuestions[currentQuizIndex].id] !== undefined && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="mt-4"
                                        >
                                            <Alert variant={quizAnswers[quizQuestions[currentQuizIndex].id] === quizQuestions[currentQuizIndex].correctAnswerIndex ? 'success' : 'danger'} className="bg-transparent border-secondary themed-text-primary">

                                                <div className="fw-bold mb-1">
                                                    {quizAnswers[quizQuestions[currentQuizIndex].id] === quizQuestions[currentQuizIndex].correctAnswerIndex ? 'Correct!' : 'Incorrect'}
                                                </div>
                                                <div className="small text-secondary">
                                                    {quizQuestions[currentQuizIndex].reasoning}
                                                </div>
                                            </Alert>
                                        </motion.div>
                                    )}

                                    <div className="text-end mt-4">
                                        <Button
                                            variant="light"
                                            onClick={nextQuizQuestion}
                                            disabled={quizAnswers[quizQuestions[currentQuizIndex].id] === undefined}
                                        >
                                            Next
                                        </Button>
                                    </div>

                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        );
    }

    if (activeSubView === 'flashcards') {
        const hasCards = node.flashcards && node.flashcards.length > 0;
        return (
            <Row className="justify-content-center">
                <Col md={8} lg={6}>
                    <TopNavigation
                        title={`Study: ${node.title}`}
                        onBack={() => {
                            setActiveSubView('main');
                            setIsFlipped(false);
                            setCurrentCardIndex(0);
                        }}
                        onChat={onOpenChat}
                        onSettings={onOpenSettings}
                        theme={theme}
                    />
                    <Card className="themed-card shadow-lg">
                        <Card.Header className="border-secondary d-flex justify-content-between align-items-center py-3">
                            <h5 className="mb-0 themed-text-primary">Study Flashcards</h5>
                            {hasCards && (
                                <Stack direction="horizontal" gap={2}>
                                    <Button
                                        variant={cardViewMode === 'flip' ? 'primary' : 'outline-secondary'}
                                        size="sm"
                                        onClick={() => setCardViewMode('flip')}
                                        title="Interactive Mode"
                                        className="d-flex align-items-center gap-1"
                                    >
                                        <LayoutGrid size={14} /> Flip
                                    </Button>
                                    <Button
                                        variant={cardViewMode === 'list' ? 'primary' : 'outline-secondary'}
                                        size="sm"
                                        onClick={() => setCardViewMode('list')}
                                        title="List Mode"
                                        className="d-flex align-items-center gap-1"
                                    >
                                        <List size={14} /> List
                                    </Button>
                                </Stack>
                            )}
                        </Card.Header>
                        <Card.Body className="p-4">
                            {flashcardsLoading ? (
                                <div className="text-center py-5">
                                    <Spinner animation="border" variant="light" className="mb-3" />
                                    <p className="themed-text-secondary">Generating custom flashcards for this topic...</p>
                                </div>
                            ) : flashcardsError ? (
                                <Alert variant="danger" className="bg-danger bg-opacity-10 border-danger text-white">
                                    {flashcardsError}
                                    <div className="mt-3">
                                        <Button variant="outline-light" size="sm" onClick={startFlashcards}>Retry</Button>
                                    </div>
                                </Alert>
                            ) : !hasCards ? (
                                <div className="text-center py-5 themed-text-secondary">
                                    <p>No flashcards generated yet.</p>
                                    <Button variant="primary" onClick={startFlashcards}>Generate Flashcards</Button>
                                </div>
                            ) : cardViewMode === 'flip' ? (
                                <div>
                                    {/* Flashcard container */}
                                    <div 
                                        className="flashcard-container mb-4" 
                                        onClick={() => setIsFlipped(!isFlipped)}
                                        style={{ cursor: 'pointer', perspective: '1000px', width: '100%', height: '280px' }}
                                    >
                                        <motion.div
                                            animate={{ rotateY: isFlipped ? 180 : 0 }}
                                            transition={{ duration: 0.4, ease: "easeInOut" }}
                                            style={{ 
                                                width: '100%', 
                                                height: '100%', 
                                                position: 'relative', 
                                                transformStyle: 'preserve-3d' 
                                            }}
                                        >
                                            {/* Front Side */}
                                            <div
                                                className="d-flex flex-column align-items-center justify-content-center p-4 border rounded-4 shadow-sm"
                                                style={{
                                                    position: 'absolute',
                                                    width: '100%',
                                                    height: '100%',
                                                    backfaceVisibility: 'hidden',
                                                    background: 'rgba(255, 255, 255, 0.05)',
                                                    borderColor: 'rgba(255, 255, 255, 0.1)',
                                                    boxShadow: 'var(--glass-shadow)',
                                                    overflow: 'hidden'
                                                }}
                                            >
                                                <Badge bg="primary" className="mb-3 bg-opacity-25 text-primary">Question</Badge>
                                                <h4 className="text-center themed-text-primary px-3 mb-0" style={{ fontSize: '1.25rem', lineHeight: '1.5', overflowWrap: 'anywhere' }}>
                                                    {node.flashcards[currentCardIndex].front}
                                                </h4>
                                                <div className="text-secondary small mt-auto opacity-50">Tap card to flip</div>
                                            </div>

                                            {/* Back Side */}
                                            <div
                                                className="d-flex flex-column align-items-center justify-content-center p-4 border rounded-4 shadow-sm"
                                                style={{
                                                    position: 'absolute',
                                                    width: '100%',
                                                    height: '100%',
                                                    backfaceVisibility: 'hidden',
                                                    transform: 'rotateY(180deg)',
                                                    background: 'rgba(13, 110, 253, 0.1)',
                                                    borderColor: 'rgba(13, 110, 253, 0.2)',
                                                    boxShadow: 'var(--glass-shadow)',
                                                    overflow: 'hidden'
                                                }}
                                            >
                                                <Badge bg="success" className="mb-3 bg-opacity-25 text-success">Key Idea</Badge>
                                                <p className="text-center themed-text-primary px-3 mb-0" style={{ fontSize: '1.1rem', lineHeight: '1.5', overflowWrap: 'anywhere' }}>
                                                    {node.flashcards[currentCardIndex].back}
                                                </p>
                                                <div className="text-secondary small mt-auto opacity-50">Tap card to flip back</div>
                                            </div>
                                        </motion.div>
                                    </div>

                                    {/* Mobile friendly navigation controls */}
                                    <div className="d-flex justify-content-between align-items-center mt-4">
                                        <Button
                                            variant="outline-secondary"
                                            onClick={handlePrevCard}
                                            className="d-flex align-items-center gap-1 px-3 py-2 rounded-3"
                                        >
                                            <ChevronLeft size={16} /> Prev
                                        </Button>
                                        <span className="small text-muted fw-bold">
                                            {currentCardIndex + 1} / {node.flashcards.length}
                                        </span>
                                        <Button
                                            variant="outline-secondary"
                                            onClick={handleNextCard}
                                            className="d-flex align-items-center gap-1 px-3 py-2 rounded-3"
                                        >
                                            Next <ChevronRight size={16} />
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                // List Mode
                                <ListGroup variant="flush" className="bg-transparent" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                                    {node.flashcards.map((card, i) => (
                                        <ListGroup.Item key={i} className="bg-transparent border-secondary py-3 px-0">
                                            <div className="fw-bold themed-text-primary mb-2">Q{i + 1}: {card.front}</div>
                                            <div className="text-secondary small bg-secondary bg-opacity-10 rounded-3 p-3">{card.back}</div>
                                        </ListGroup.Item>
                                    ))}
                                </ListGroup>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        );
    }

    if (activeSubView === 'papers') {
        const hasPapers = node.researchPapers && node.researchPapers.length > 0;
        return (
            <Row className="justify-content-center">
                <Col md={8} lg={6}>
                    <TopNavigation
                        title={`Papers: ${node.title}`}
                        onBack={() => setActiveSubView('main')}
                        onChat={onOpenChat}
                        onSettings={onOpenSettings}
                        theme={theme}
                    />
                    <Card className="themed-card shadow-lg">
                        <Card.Header className="border-secondary py-3">
                            <h5 className="mb-0 themed-text-primary">Latest Research Papers</h5>
                        </Card.Header>
                        <Card.Body className="p-4">
                            {papersLoading ? (
                                <div className="text-center py-5">
                                    <Spinner animation="border" variant="light" className="mb-3" />
                                    <p className="themed-text-secondary">Searching scholarly databases via Web Search...</p>
                                </div>
                            ) : papersError ? (
                                <Alert variant="danger" className="bg-danger bg-opacity-10 border-danger text-white">
                                    {papersError}
                                    <div className="mt-3">
                                        <Button variant="outline-light" size="sm" onClick={startResearchPapers}>Retry</Button>
                                    </div>
                                </Alert>
                            ) : !hasPapers ? (
                                <div className="text-center py-5 themed-text-secondary">
                                    <p>No research papers found yet.</p>
                                    <Button variant="primary" onClick={startResearchPapers}>Search Research Papers</Button>
                                </div>
                            ) : (
                                <div className="d-flex flex-column gap-3" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                                    {node.researchPapers.map((paper, i) => (
                                        <Card key={i} className="bg-secondary bg-opacity-10 border-0 mb-2">
                                            <Card.Body className="p-3">
                                                <h6 className="themed-text-primary fw-bold mb-2">{paper.title}</h6>
                                                <p className="small themed-text-secondary mb-3" style={{ fontSize: '0.85rem' }}>
                                                    <strong>Key Idea:</strong> {paper.keyIdea}
                                                </p>
                                                {paper.url && (
                                                    <Button
                                                        href={paper.url.startsWith('http') ? paper.url : `https://www.google.com/search?q=${encodeURIComponent(paper.url)}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        variant="outline-light"
                                                        size="sm"
                                                        className="px-3"
                                                        style={{ fontSize: '0.8rem' }}
                                                    >
                                                        Read Paper <ExternalLink size={12} className="ms-1" />
                                                    </Button>
                                                )}
                                            </Card.Body>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        );
    }

    if (activeSubView === 'problems') {
        const hasProblems = node.practiceProblems && node.practiceProblems.length > 0;
        const filteredProblems = hasProblems ? node.practiceProblems.filter(p => p.group === activeProblemGroup) : [];

        const groupMetaData = {
            'A': { title: 'Group A: Trivial', badgeBg: 'success', description: 'Simple, direct verification exercises to validate environment setup and basic syntax.' },
            'B': { title: 'Group B: Intermediate', badgeBg: 'primary', description: 'Practical tasks covering core features, logic implementations, and common use cases.' },
            'C': { title: 'Group C: Difficult', badgeBg: 'warning', description: 'Complex scenarios involving architecture integration, performance concerns, and state handling.' },
            'D': { title: 'Group D: Very Difficult', badgeBg: 'danger', description: 'Advanced open-ended problems challenging algorithmic bounds, performance, or system designs.' }
        };

        return (
            <Row className="justify-content-center">
                <Col md={8} lg={6}>
                    <TopNavigation
                        title={`Practice: ${node.title}`}
                        onBack={() => setActiveSubView('main')}
                        onChat={onOpenChat}
                        onSettings={onOpenSettings}
                        theme={theme}
                    />
                    <Card className="themed-card shadow-lg">
                        <Card.Header className="border-secondary py-3">
                            <div className="d-flex align-items-center justify-content-between">
                                <h5 className="mb-0 themed-text-primary d-flex align-items-center gap-2">
                                    <Code2 size={20} className="text-warning" /> Practice Tasks
                                </h5>
                                <Badge bg="secondary" className="bg-opacity-25 themed-text-secondary">Problems Only</Badge>
                            </div>
                        </Card.Header>
                        <Card.Body className="p-4">
                            {problemsLoading ? (
                                <div className="text-center py-5">
                                    <Spinner animation="border" variant="light" className="mb-3" />
                                    <p className="themed-text-secondary">Generating graded practice challenges (Group A to D)...</p>
                                </div>
                            ) : problemsError ? (
                                <Alert variant="danger" className="bg-danger bg-opacity-10 border-danger text-white">
                                    {problemsError}
                                    <div className="mt-3">
                                        <Button variant="outline-light" size="sm" onClick={startPracticeProblems}>Retry</Button>
                                    </div>
                                </Alert>
                            ) : !hasProblems ? (
                                <div className="text-center py-5 themed-text-secondary">
                                    <p>No practice tasks generated yet.</p>
                                    <Button variant="primary" onClick={startPracticeProblems}>Generate Practice Tasks</Button>
                                </div>
                            ) : (
                                <div>
                                    <div className="d-flex justify-content-between gap-1 mb-4 p-1 bg-secondary bg-opacity-10 rounded-3">
                                        {['A', 'B', 'C', 'D'].map(g => (
                                            <Button
                                                key={g}
                                                variant={activeProblemGroup === g ? groupMetaData[g].badgeBg : 'link'}
                                                className={`flex-grow-1 py-2 text-decoration-none rounded-3 fw-bold small ${
                                                    activeProblemGroup === g 
                                                        ? 'text-white shadow-sm' 
                                                        : 'themed-text-secondary'
                                                }`}
                                                style={{ fontSize: '0.85rem' }}
                                                onClick={() => setActiveProblemGroup(g)}
                                            >
                                                Group {g}
                                            </Button>
                                        ))}
                                    </div>

                                    <div className="mb-4 p-3 bg-secondary bg-opacity-5 rounded-3 border border-secondary border-opacity-10">
                                        <h6 className={`fw-bold text-${groupMetaData[activeProblemGroup].badgeBg} mb-1`}>
                                            {groupMetaData[activeProblemGroup].title}
                                        </h6>
                                        <p className="small themed-text-secondary mb-0">
                                            {groupMetaData[activeProblemGroup].description}
                                        </p>
                                    </div>

                                    <div className="d-flex flex-column gap-3" style={{ maxHeight: '420px', overflowY: 'auto' }}>
                                        {filteredProblems.length === 0 ? (
                                            <div className="text-center py-4 text-muted small">
                                                No tasks found in this group.
                                            </div>
                                        ) : (
                                            filteredProblems.map((prob, i) => {
                                                const isCompleted = !!completedTasks[prob.id];
                                                return (
                                                    <motion.div
                                                        key={prob.id || i}
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ duration: 0.2 }}
                                                    >
                                                        <Card className={`border-0 themed-card bg-opacity-10 shadow-sm ${
                                                            isCompleted ? 'bg-success bg-opacity-10 border-start border-success border-3' : 'bg-secondary'
                                                        }`}>
                                                            <Card.Body className="p-3">
                                                                <div className="d-flex align-items-start justify-content-between gap-2 mb-2">
                                                                    <h6 className={`fw-bold mb-0 ${isCompleted ? 'text-success text-decoration-line-through' : 'themed-text-primary'}`}>
                                                                        {prob.title}
                                                                    </h6>
                                                                    <div className="d-flex gap-2 align-items-center">
                                                                        <Button
                                                                            variant="link"
                                                                            className="p-0 text-secondary hover-text-white"
                                                                            onClick={() => handleCopyTask(prob.id, `${prob.title}\n\n${prob.description}`)}
                                                                            title="Copy task details"
                                                                        >
                                                                            {copiedTaskId === prob.id ? <Check size={16} className="text-success" /> : <Copy size={16} />}
                                                                        </Button>
                                                                        <Button
                                                                            variant="link"
                                                                            className="p-0 text-secondary"
                                                                            onClick={() => handleToggleTaskCompleted(prob.id)}
                                                                            title={isCompleted ? "Mark incomplete" : "Mark completed"}
                                                                        >
                                                                            <CheckCircle size={18} className={isCompleted ? 'text-success' : 'text-muted'} />
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                                <p className="small themed-text-secondary mb-0" style={{ whiteSpace: 'pre-wrap' }}>
                                                                    {prob.description}
                                                                </p>
                                                            </Card.Body>
                                                        </Card>
                                                    </motion.div>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        );
    }

    return (
        <Row className="justify-content-center">
            <Col md={10} lg={8}>
                <TopNavigation
                    title={node.title}
                    onBack={onBack}
                    onChat={onOpenChat}
                    onSettings={onOpenSettings}
                    theme={theme}
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                >
                    <Card className="themed-card shadow-lg">

                        <Card.Body className="p-4">


                            <p className="lead themed-text-secondary mb-5">{node.description}</p>


                            {resourceError && (
                                <Alert variant="danger" className="bg-danger bg-opacity-10 border-danger text-white">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <span>{resourceError}</span>
                                        <Button
                                            variant="outline-danger"
                                            size="sm"
                                            onClick={() => window.location.reload()} // Simple retry for now
                                        >
                                            Retry
                                        </Button>
                                    </div>
                                </Alert>
                            )}

                            <Stack direction="horizontal" className="justify-content-between align-items-center mb-4">
                                <h4 className="mb-0 themed-text-primary">Recommended Resources</h4>
                                <Button
                                    variant="outline-primary"
                                    size="sm"
                                    onClick={handleRefreshResources}
                                    disabled={resourcesLoading}
                                    className="d-flex align-items-center gap-2"
                                    title={resourcesLoading ? 'Refreshing...' : 'Refresh links'}
                                >
                                    <RefreshCw size={14} className={resourcesLoading ? 'spinner-spin' : ''} />
                                    <span className="d-none d-md-inline">{resourcesLoading ? 'Refreshing...' : 'Refresh links'}</span>
                                </Button>
                            </Stack>

                            {resourcesLoading ? (

                                <div className="text-center py-5">
                                    <Spinner animation="border" variant="light" className="mb-3" />
                                    <p className="themed-text-secondary">Curating the best resources for you...</p>

                                </div>
                            ) : (
                                <div className="d-flex flex-column gap-3">
                                    {!resourceError && node.resources && node.resources.map((res, i) => (
                                        <Card key={i} className="bg-secondary bg-opacity-10 border-0 mb-3">
                                            <Card.Body className="d-flex flex-column flex-md-row align-items-md-start gap-3">
                                                <div className="d-flex gap-3 flex-grow-1">
                                                    <div className="mt-1 flex-shrink-0">
                                                        {res.type === 'video' ? <Play size={24} className="text-danger" /> : <ExternalLink size={24} className="text-primary" />}
                                                    </div>
                                                    <div>
                                                        <h5 className="mb-1 themed-text-primary">{res.title}</h5>
                                                        <p className="themed-text-secondary small mb-0">{res.description}</p>
                                                    </div>
                                                </div>
                                                <div className="mt-2 mt-md-0 ms-md-auto w-100 w-md-auto">
                                                    <Button
                                                        href={res.url.startsWith('http') ? res.url : `https://www.google.com/search?q=${encodeURIComponent(res.url)}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        variant="outline-light"
                                                        size="sm"
                                                        className="w-100 px-4"
                                                    >
                                                        View
                                                    </Button>
                                                </div>
                                            </Card.Body>
                                        </Card>
                                    ))}

                                    {!resourceError && (!node.resources || node.resources.length === 0) && !resourcesLoading && (
                                        <div className="text-center py-4 themed-text-secondary">

                                            No resources found for this module.
                                        </div>
                                    )}
                                </div>
                            )}

                             <div className="mt-5 pt-3 border-top border-secondary">
                                 <p className="themed-text-secondary text-center mb-4">Select your next study step:</p>
                                 <Row className="g-3 justify-content-center">
                                     <Col xs={6} md={3}>
                                         <Button
                                             variant="outline-primary"
                                             className="w-100 h-100 py-3 d-flex flex-column align-items-center justify-content-center gap-2 rounded-3 border-opacity-50"
                                             onClick={startFlashcards}
                                             disabled={resourcesLoading}
                                             title="Study Flashcards"
                                         >
                                             <Sparkles size={20} className="text-primary" />
                                             <span className="d-none d-md-inline fw-semibold small">Study Flashcards</span>
                                         </Button>
                                     </Col>
                                     <Col xs={6} md={3}>
                                         <Button
                                             variant="outline-warning"
                                             className="w-100 h-100 py-3 d-flex flex-column align-items-center justify-content-center gap-2 rounded-3 border-opacity-50"
                                             onClick={startPracticeProblems}
                                             disabled={resourcesLoading}
                                             title="Practice Tasks"
                                         >
                                             <Code2 size={20} className="text-warning" />
                                             <span className="d-none d-md-inline fw-semibold small">Practice Tasks</span>
                                         </Button>
                                     </Col>
                                     <Col xs={6} md={3}>
                                         <Button
                                             variant="outline-info"
                                             className="w-100 h-100 py-3 d-flex flex-column align-items-center justify-content-center gap-2 rounded-3 border-opacity-50"
                                             onClick={startResearchPapers}
                                             disabled={resourcesLoading}
                                             title="Research Papers"
                                         >
                                             <BookOpen size={20} className="text-info" />
                                             <span className="d-none d-md-inline fw-semibold small">Research Papers</span>
                                         </Button>
                                     </Col>
                                     <Col xs={6} md={3}>
                                         <Button
                                             variant="primary"
                                             className="w-100 h-100 py-3 d-flex flex-column align-items-center justify-content-center gap-2 rounded-3"
                                             onClick={startQuiz}
                                             disabled={quizLoading || resourcesLoading}
                                             title="Take Quiz"
                                         >
                                             {quizLoading ? (
                                                 <>
                                                     <Spinner animation="border" size="sm" />
                                                     <span className="d-none d-md-inline small">Generating...</span>
                                                 </>
                                             ) : (
                                                 <>
                                                     <CheckCircle size={20} />
                                                     <span className="d-none d-md-inline fw-semibold small">Take Quiz</span>
                                                 </>
                                             )}
                                         </Button>
                                     </Col>
                                 </Row>
                             </div>
                        </Card.Body>
                    </Card>
                </motion.div>
            </Col>
        </Row>
    );
};

export default NodeContent;
