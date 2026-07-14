import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

import { Row, Col, Card, Button, Spinner, ListGroup, Badge, Alert, Stack } from 'react-bootstrap';
import { CheckCircle, XCircle, ExternalLink, Play, ArrowLeft, RefreshCw, BookOpen, FileText, Sparkles, ChevronLeft, ChevronRight, RotateCcw, LayoutGrid, List, Code2, Award, Copy, Check, Layers, GraduationCap, Brain, Baby, Shield, Sword, Swords } from 'lucide-react';
import { aiService } from '../services/aiService';

import { storageService } from '../services/storageService';
import TopNavigation from './TopNavigation';



const NodeContent = ({ node, settings, topic, onBack, onCompleteNode, updateNodeResources, updateNodeFlashcards, updateNodeResearchPapers, updateNodePracticeProblems, updateNodeQuiz, onOpenChat, onOpenSettings, theme, backgroundTasks = {}, triggerGenerationTask, dismissBackgroundTask }) => {

    const localStore = {
        getItem: (key) => localStorage.getItem(key.startsWith('getpath_') ? `${key}_${node.id}` : key),
        setItem: (key, val) => localStorage.setItem(key.startsWith('getpath_') ? `${key}_${node.id}` : key, val),
        removeItem: (key) => localStorage.removeItem(key.startsWith('getpath_') ? `${key}_${node.id}` : key)
    };

    const [showQuiz, setShowQuiz] = useState(() => {
        const saved = localStore.getItem('getpath_active_subview');
        return saved === 'quiz';
    });
    const [quizQuestions, setQuizQuestions] = useState(() => {
        try {
            const saved = localStore.getItem('getpath_quiz_questions');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    });
    const [currentQuizIndex, setCurrentQuizIndex] = useState(() => {
        const saved = localStore.getItem('getpath_current_quiz_index');
        return saved ? parseInt(saved) : 0;
    });
    const [quizAnswers, setQuizAnswers] = useState(() => {
        try {
            const saved = localStore.getItem('getpath_quiz_answers');
            return saved ? JSON.parse(saved) : {};
        } catch (e) {
            return {};
        }
    });
    const [quizScore, setQuizScore] = useState(() => {
        const saved = localStore.getItem('getpath_quiz_score');
        return saved && saved !== 'null' ? parseInt(saved) : null;
    });
    const [loadingMoreQuiz, setLoadingMoreQuiz] = useState(false);
    const [loadingMoreFlashcards, setLoadingMoreFlashcards] = useState(false);
    const [loadingMoreFlashcardsError, setLoadingMoreFlashcardsError] = useState(null);

    const activeTasks = Object.values(backgroundTasks).filter(t => t.nodeId === node.id);
    
    const resourcesLoading = activeTasks.some(t => t.taskType === 'resources' && t.status === 'generating');
    const resourceError = activeTasks.find(t => t.taskType === 'resources' && t.status === 'failed')?.error || null;

    const [activeSubView, setActiveSubView] = useState(() => {
        const saved = localStore.getItem('getpath_active_subview');
        return saved && saved !== 'quiz' ? saved : 'main';
    }); // 'main', 'flashcards', 'papers'
    const [cardViewMode, setCardViewMode] = useState('flip'); // 'flip' or 'list'
    const [currentCardIndex, setCurrentCardIndex] = useState(() => {
        const saved = localStore.getItem('getpath_current_card_index');
        return saved ? parseInt(saved) : 0;
    });
    const [isFlipped, setIsFlipped] = useState(false);

    const flashcardsLoading = activeTasks.some(t => t.taskType === 'flashcards' && t.status === 'generating');
    const flashcardsError = activeTasks.find(t => t.taskType === 'flashcards' && t.status === 'failed')?.error || null;

    const papersLoading = activeTasks.some(t => t.taskType === 'papers' && t.status === 'generating');
    const papersError = activeTasks.find(t => t.taskType === 'papers' && t.status === 'failed')?.error || null;

    const problemsLoading = activeTasks.some(t => t.taskType === 'problems' && t.status === 'generating');
    const problemsError = activeTasks.find(t => t.taskType === 'problems' && t.status === 'failed')?.error || null;

    const quizLoading = activeTasks.some(t => t.taskType === 'quiz' && t.status === 'generating');
    const quizError = activeTasks.find(t => t.taskType === 'quiz' && t.status === 'failed')?.error || null;
    const [activeProblemGroup, setActiveProblemGroup] = useState('A');
    const [copiedTaskId, setCopiedTaskId] = useState(null);
    const [completedTasks, setCompletedTasks] = useState(() => {
        try {
            const data = localStore.getItem(`completed_tasks_${node.id}`);
            return data ? JSON.parse(data) : {};
        } catch (e) {
            return {};
        }
    });


    // Auto-reset out of bound indices
    useEffect(() => {
        if (node.flashcards && currentCardIndex >= node.flashcards.length) {
            setCurrentCardIndex(0);
        }
    }, [node.flashcards, currentCardIndex]);

    useEffect(() => {
        if (quizQuestions && currentQuizIndex >= quizQuestions.length) {
            setCurrentQuizIndex(0);
        }
    }, [quizQuestions, currentQuizIndex]);

    // Auto-recover empty views
    useEffect(() => {
        if (showQuiz && (!quizQuestions || quizQuestions.length === 0) && !quizLoading) {
            startQuiz();
        }
    }, [showQuiz, quizQuestions, quizLoading]);

    useEffect(() => {
        if (activeSubView === 'flashcards' && (!node.flashcards || node.flashcards.length === 0) && !flashcardsLoading) {
            startFlashcards();
        }
    }, [activeSubView, node.flashcards, flashcardsLoading]);

    useEffect(() => {
        if (node.quiz && node.quiz.length > 0) {
            setQuizQuestions(node.quiz);
            localStore.setItem('getpath_quiz_questions', JSON.stringify(node.quiz));
        }
    }, [node.quiz]);

    useEffect(() => {
        if (!node.resources && !resourcesLoading && !resourceError) {
            triggerGenerationTask(node.id, node.title, 'resources', node.description);
        }
    }, [node.resources, node.id, node.title, node.description, resourcesLoading, resourceError]);

    const handleRefreshResources = () => {
        if (resourcesLoading) return;
        triggerGenerationTask(node.id, node.title, 'resources', node.description);
    };




    const startQuiz = () => {
        setShowQuiz(true);
        localStore.setItem('getpath_active_subview', 'quiz');

        // Check if quiz is already cached in local storage state
        if (quizQuestions && quizQuestions.length > 0) {
            return;
        }

        // Check if quiz is already cached in memory/props
        if (node.quiz && node.quiz.length > 0) {
            setQuizQuestions(node.quiz);
            localStore.setItem('getpath_quiz_questions', JSON.stringify(node.quiz));
            return;
        }

        triggerGenerationTask(node.id, node.title, 'quiz', node.title + ": " + node.description);
        
        // Clear prior states
        setCurrentQuizIndex(0);
        localStore.setItem('getpath_current_quiz_index', '0');
        setQuizAnswers({});
        localStore.setItem('getpath_quiz_answers', '{}');
        setQuizScore(null);
        localStore.setItem('getpath_quiz_score', 'null');
    };

    const handleQuizAnswer = (idx) => {
        if (quizAnswers[quizQuestions[currentQuizIndex].id] !== undefined) return;
        const updatedAnswers = { ...quizAnswers, [quizQuestions[currentQuizIndex].id]: idx };
        setQuizAnswers(updatedAnswers);
        localStore.setItem('getpath_quiz_answers', JSON.stringify(updatedAnswers));
    };



    const nextQuizQuestion = () => {
        if (currentQuizIndex < quizQuestions.length - 1) {
            const nextIdx = currentQuizIndex + 1;
            setCurrentQuizIndex(nextIdx);
            localStore.setItem('getpath_current_quiz_index', nextIdx);
        } else {
            // Finish
            let score = 0;
            quizQuestions.forEach(q => {
                if (quizAnswers[q.id] === q.correctAnswerIndex) score++;
            });
            setQuizScore(score);
            localStore.setItem('getpath_quiz_score', score);
            if (score >= quizQuestions.length - 1) { // Allow 1 mistake maybe? Or strict.
                onCompleteNode(true);
            }
        }
    };
    const loadMoreQuizQuestions = async () => {
        setLoadingMoreQuiz(true);
        try {
            const existingTitles = quizQuestions.map(q => q.text).join(", ");
            const context = `${node.title}: ${node.description}\n\nNote: Please generate 3 NEW unique questions. Do NOT generate questions similar to these existing ones: ${existingTitles}`;
            const data = await aiService.generateQuiz(context, { ...settings, quizQuestions: 3 });
            
            const maxId = quizQuestions.reduce((max, q) => {
                const parsed = parseInt(q.id);
                return isNaN(parsed) ? max : Math.max(max, parsed);
            }, 0);
            
            const newQuestions = data.questions.map((q, index) => {
                const newId = maxId + index + 1;
                return {
                    ...q,
                    id: newId
                };
            });

            const updatedQuestions = [...quizQuestions, ...newQuestions];
            setQuizQuestions(updatedQuestions);
            localStore.setItem('getpath_quiz_questions', JSON.stringify(updatedQuestions));
            updateNodeQuiz(node.id, updatedQuestions);
            storageService.updateQuiz(topic, node.title, updatedQuestions);
            setCurrentQuizIndex(quizQuestions.length);
            localStore.setItem('getpath_current_quiz_index', quizQuestions.length);
            setQuizScore(null);
            localStore.setItem('getpath_quiz_score', 'null');
        } catch (e) {
            console.error("Failed to load more quiz questions:", e);
            alert("Failed to load additional questions. Please try again.");
        } finally {
            setLoadingMoreQuiz(false);
        }
    };
    const startFlashcards = () => {
        setActiveSubView('flashcards');
        localStore.setItem('getpath_active_subview', 'flashcards');
        setCurrentCardIndex(0);
        localStore.setItem('getpath_current_card_index', '0');
        if (node.flashcards && node.flashcards.length > 0) return;

        triggerGenerationTask(node.id, node.title, 'flashcards', node.description);
    };

    const loadMoreFlashcards = async () => {
        setLoadingMoreFlashcards(true);
        setLoadingMoreFlashcardsError(null);
        try {
            const existingFronts = (node.flashcards || []).map(fc => fc.front).join(", ");
            const descriptionOverride = `${node.description}\n\nNote: Please generate exactly 3 NEW study flashcards that are different from these existing cards: ${existingFronts}`;
            
            const data = await aiService.generateFlashcards(topic, node.title, descriptionOverride, settings);
            if (data && data.flashcards) {
                const maxId = (node.flashcards || []).reduce((max, fc) => {
                    const parsed = parseInt(fc.id);
                    return isNaN(parsed) ? max : Math.max(max, parsed);
                }, 0);
                
                const newCards = data.flashcards.slice(0, 3).map((fc, index) => {
                    const newId = maxId + index + 1;
                    return {
                        ...fc,
                        id: newId
                    };
                });
                
                const updatedCards = [...(node.flashcards || []), ...newCards];
                updateNodeFlashcards(node.id, updatedCards);
                storageService.updateFlashcards(topic, node.title, updatedCards);
                
                const newIndex = (node.flashcards || []).length;
                setCurrentCardIndex(newIndex);
                localStore.setItem('getpath_current_card_index', newIndex);
                setIsFlipped(false);
            } else {
                throw new Error("No additional flashcards returned in AI response.");
            }
        } catch (e) {
            console.error(e);
            setLoadingMoreFlashcardsError("Failed to add more flashcards: " + e.message);
        } finally {
            setLoadingMoreFlashcards(false);
        }
    };

    const startResearchPapers = () => {
        setActiveSubView('papers');
        localStore.setItem('getpath_active_subview', 'papers');
        if (node.researchPapers && node.researchPapers.length > 0) return;

        triggerGenerationTask(node.id, node.title, 'papers', node.description);
    };

    const startPracticeProblems = () => {
        setActiveSubView('problems');
        localStore.setItem('getpath_active_subview', 'problems');
        if (node.practiceProblems && node.practiceProblems.length > 0) return;

        triggerGenerationTask(node.id, node.title, 'problems', node.description);
    };

    const handleToggleTaskCompleted = (taskId) => {
        const nextCompleted = {
            ...completedTasks,
            [taskId]: !completedTasks[taskId]
        };
        setCompletedTasks(nextCompleted);
        try {
            localStore.setItem(`completed_tasks_${node.id}`, JSON.stringify(nextCompleted));
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
            setCurrentCardIndex(prev => {
                const nextIdx = prev > 0 ? prev - 1 : node.flashcards.length - 1;
                localStore.setItem('getpath_current_card_index', nextIdx);
                return nextIdx;
            });
        }, 150);
    };

    const handleNextCard = () => {
        setIsFlipped(false);
        setTimeout(() => {
            setCurrentCardIndex(prev => {
                const nextIdx = prev < node.flashcards.length - 1 ? prev + 1 : 0;
                localStore.setItem('getpath_current_card_index', nextIdx);
                return nextIdx;
            });
        }, 150);
    };

    if (showQuiz) {
        const hasQuestions = quizQuestions && quizQuestions.length > 0;
        const currentQuestion = hasQuestions && quizQuestions[currentQuizIndex] 
            ? quizQuestions[currentQuizIndex] 
            : { id: '', text: '', options: [], reasoning: '', correctAnswerIndex: 0 };
        return (
            <Row className="justify-content-center">
                <Col md={8} lg={6}>
                    <TopNavigation
                        title={`Checkpoint: ${node.title}`}
                        onBack={() => {
                            localStore.removeItem('getpath_active_subview');
                            localStore.removeItem('getpath_quiz_questions');
                            localStore.removeItem('getpath_current_quiz_index');
                            localStore.removeItem('getpath_quiz_answers');
                            localStore.removeItem('getpath_quiz_score');
                            setShowQuiz(false);
                        }}
                        onChat={() => {
                            if (hasQuestions) {
                                if (quizScore !== null) {
                                    const context = `I just finished taking the quiz for the module "${node.title}" on the topic of "${topic}".\nI scored ${quizScore} out of ${quizQuestions.length}. Can you explain more about this topic?`;
                                    const label = `Quiz Score: ${quizScore}/${quizQuestions.length}`;
                                    onOpenChat(context, label);
                                } else {
                                    const question = currentQuestion;
                                    const context = `I have a question about this quiz question for the topic "${topic}" -> "${node.title}":\n\nQuestion: ${question.text}\nOptions:\n${question.options.map((opt, i) => `${i + 1}. ${opt}`).join('\n')}\nCorrect Option: Option ${question.correctAnswerIndex + 1} (${question.options[question.correctAnswerIndex]})\nReasoning: ${question.reasoning}`;
                                    const label = `Quiz Q: "${question.text.substring(0, 30)}${question.text.length > 30 ? '...' : ''}"`;
                                    onOpenChat(context, label);
                                }
                            } else {
                                onOpenChat();
                            }
                        }}
                        onSettings={onOpenSettings}
                        theme={theme}
                    />
                    <Card className="themed-card shadow-lg">

                        <Card.Header className="border-secondary d-flex justify-content-between align-items-center">
                            <h3 className="mb-0 themed-text-primary">Checkpoint: {node.title}</h3>
                        </Card.Header>
                        <Card.Body className="p-4">
                            {quizLoading ? (
                                <div className="text-center py-5">
                                    <Spinner animation="border" variant="light" className="mb-3" />
                                    <p className="themed-text-secondary mb-1">Generating custom quiz questions for this topic...</p>
                                    <small className="text-secondary d-block mt-2">You can safely return to the roadmap or browse other pages; generation continues in the background.</small>
                                </div>
                            ) : quizError ? (
                                <Alert variant="danger" className="bg-danger bg-opacity-10 border-danger text-white">
                                    {quizError}
                                    <div className="mt-3">
                                        <Button variant="outline-light" size="sm" onClick={startQuiz}>Retry</Button>
                                    </div>
                                </Alert>
                            ) : quizScore !== null ? (
                                <div className="text-center">
                                    <h3 className="mb-4 themed-text-primary">You scored {quizScore} / {quizQuestions.length}</h3>


                                    {quizScore >= quizQuestions.length - 1 ? (
                                        <div>
                                            <p className="text-success fs-4 mb-4">Great job! Node Completed.</p>
                                            <Stack direction="horizontal" gap={3} className="justify-content-center flex-wrap">
                                                <Button variant="success" size="lg" onClick={onBack}>Return to Path</Button>
                                                <Button 
                                                    variant="outline-primary" 
                                                    size="lg"
                                                    onClick={loadMoreQuizQuestions}
                                                    disabled={loadingMoreQuiz}
                                                    className="d-flex align-items-center justify-content-center"
                                                >
                                                    {loadingMoreQuiz ? (
                                                        <>
                                                            <Spinner animation="border" size="sm" className="me-2" />
                                                            <span>Generating...</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Sparkles size={16} className="me-2" />
                                                            <span>Take 3 More Questions</span>
                                                        </>
                                                    )}
                                                </Button>
                                            </Stack>
                                        </div>
                                    ) : (
                                        <div>
                                            <p className="text-danger fs-4 mb-4">You need to review the material.</p>
                                            <Stack direction="horizontal" gap={3} className="justify-content-center flex-wrap">
                                                <Button variant="outline-light" size="lg" onClick={() => {
                                                    setShowQuiz(false);
                                                    setQuizScore(null);
                                                    setCurrentQuizIndex(0);
                                                    setQuizAnswers({});
                                                }}>Try Again / Review</Button>
                                                <Button 
                                                    variant="outline-primary" 
                                                    size="lg"
                                                    onClick={loadMoreQuizQuestions}
                                                    disabled={loadingMoreQuiz}
                                                    className="d-flex align-items-center justify-content-center"
                                                >
                                                    {loadingMoreQuiz ? (
                                                        <>
                                                            <Spinner animation="border" size="sm" className="me-2" />
                                                            <span>Generating...</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Sparkles size={16} className="me-2" />
                                                            <span>Take 3 More Questions</span>
                                                        </>
                                                    )}
                                                </Button>
                                            </Stack>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div>
                                    <p className="text-muted mb-2">Question {currentQuizIndex + 1} of {quizQuestions.length}</p>
                                    <h4 className="mb-4 themed-text-primary">{currentQuestion.text}</h4>


                                    <div className="d-grid gap-3">
                                        {currentQuestion.options.map((opt, i) => {
                                            const isSelected = quizAnswers[currentQuestion.id] === i;
                                            const isCorrect = i === currentQuestion.correctAnswerIndex;
                                            const showFeedback = quizAnswers[currentQuestion.id] !== undefined;

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

                                    {quizAnswers[currentQuestion.id] !== undefined && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="mt-4"
                                        >
                                            <Alert variant={quizAnswers[currentQuestion.id] === currentQuestion.correctAnswerIndex ? 'success' : 'danger'} className="bg-transparent border-secondary themed-text-primary">

                                                <div className="fw-bold mb-1">
                                                    {quizAnswers[currentQuestion.id] === currentQuestion.correctAnswerIndex ? 'Correct!' : 'Incorrect'}
                                                </div>
                                                <div className="small text-secondary">
                                                    {currentQuestion.reasoning}
                                                </div>
                                            </Alert>
                                        </motion.div>
                                    )}

                                    <div className="text-end mt-4">
                                        <Button
                                            variant="light"
                                            onClick={nextQuizQuestion}
                                            disabled={quizAnswers[currentQuestion.id] === undefined}
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
        const activeCard = hasCards && node.flashcards[currentCardIndex] ? node.flashcards[currentCardIndex] : { front: '', back: '' };
        return (
            <Row className="justify-content-center">
                <Col md={8} lg={6}>
                    <TopNavigation
                        title={`Study: ${node.title}`}
                        onBack={() => {
                            localStore.removeItem('getpath_active_subview');
                            localStore.removeItem('getpath_current_card_index');
                            setActiveSubView('main');
                            setIsFlipped(false);
                            setCurrentCardIndex(0);
                        }}
                        onChat={() => {
                            if (hasCards) {
                                const card = activeCard;
                                const context = `I have a question about this flashcard for the topic "${topic}" -> "${node.title}":\n\nFront side (Question): ${card.front}\nBack side (Answer): ${card.back}`;
                                const label = `Flashcard: "${card.front.substring(0, 30)}${card.front.length > 30 ? '...' : ''}"`;
                                onOpenChat(context, label);
                            } else {
                                onOpenChat();
                            }
                        }}
                        onSettings={onOpenSettings}
                        theme={theme}
                    />
                    <Card className="themed-card shadow-lg">
                        <Card.Header className="border-secondary d-flex justify-content-between align-items-center py-3">
                            <h5 className="mb-0 themed-text-primary d-flex align-items-center gap-2">
                                <Layers size={18} className="text-primary" /> Study Flashcards
                            </h5>
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
                                    <p className="themed-text-secondary mb-1">Generating custom flashcards for this topic...</p>
                                    <small className="text-secondary d-block mt-2">You can safely return to the roadmap or browse other pages; generation continues in the background.</small>
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
                                                    {activeCard.front}
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
                                                    {activeCard.back}
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

                                    <div className="text-center mt-4 pt-3 border-top border-secondary border-opacity-10">
                                        <Button
                                            variant="outline-primary"
                                            onClick={loadMoreFlashcards}
                                            disabled={loadingMoreFlashcards}
                                            className="d-inline-flex align-items-center gap-2"
                                        >
                                            {loadingMoreFlashcards ? (
                                                <>
                                                    <Spinner animation="border" size="sm" />
                                                    <span>Generating...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Sparkles size={16} />
                                                    <span>Take 3 More Flashcards</span>
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    {/* List Mode */}
                                    <ListGroup variant="flush" className="bg-transparent" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                                        {node.flashcards.map((card, i) => (
                                            <ListGroup.Item key={i} className="bg-transparent border-secondary py-3 px-0">
                                                <div className="fw-bold themed-text-primary mb-2">Q{i + 1}: {card.front}</div>
                                                <div className="text-secondary small bg-secondary bg-opacity-10 rounded-3 p-3">{card.back}</div>
                                            </ListGroup.Item>
                                        ))}
                                    </ListGroup>
                                    <div className="text-center mt-4 pt-3 border-top border-secondary border-opacity-10">
                                        <Button
                                            variant="outline-primary"
                                            onClick={loadMoreFlashcards}
                                            disabled={loadingMoreFlashcards}
                                            className="d-inline-flex align-items-center gap-2"
                                        >
                                            {loadingMoreFlashcards ? (
                                                <>
                                                    <Spinner animation="border" size="sm" />
                                                    <span>Generating...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Sparkles size={16} />
                                                    <span>Take 3 More Flashcards</span>
                                                </>
                                            )}
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

    if (activeSubView === 'papers') {
        const hasPapers = node.researchPapers && node.researchPapers.length > 0;
        return (
            <Row className="justify-content-center">
                <Col md={8} lg={6}>
                    <TopNavigation
                        title={`Papers: ${node.title}`}
                        onBack={() => {
                            localStore.removeItem('getpath_active_subview');
                            setActiveSubView('main');
                        }}
                        onChat={onOpenChat}
                        onSettings={onOpenSettings}
                        theme={theme}
                    />
                    <Card className="themed-card shadow-lg">
                        <Card.Header className="border-secondary py-3">
                            <h5 className="mb-0 themed-text-primary d-flex align-items-center gap-2">
                                <GraduationCap size={18} className="text-info" /> Latest Research Papers
                            </h5>
                        </Card.Header>
                        <Card.Body className="p-4">
                            {papersLoading ? (
                                <div className="text-center py-5">
                                    <Spinner animation="border" variant="light" className="mb-3" />
                                    <p className="themed-text-secondary mb-1">Searching scholarly databases via Web Search...</p>
                                    <small className="text-secondary d-block mt-2">You can safely return to the roadmap or browse other pages; generation continues in the background.</small>
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
            'A': { title: 'Baby Level (Trivial)', badgeBg: 'success', description: 'Simple, direct verification exercises to validate environment setup and basic syntax.', icon: Baby },
            'B': { title: 'Novice Level (Intermediate)', badgeBg: 'primary', description: 'Practical tasks covering core features, logic implementations, and common use cases.', icon: Shield },
            'C': { title: 'Warrior Level (Difficult)', badgeBg: 'warning', description: 'Complex scenarios involving architecture integration, performance concerns, and state handling.', icon: Sword },
            'D': { title: 'Soldier Level (Very Difficult)', badgeBg: 'danger', description: 'Advanced open-ended problems challenging algorithmic bounds, performance, or system designs.', icon: Swords }
        };

        return (
            <Row className="justify-content-center">
                <Col md={8} lg={6}>
                    <TopNavigation
                        title={`Practice: ${node.title}`}
                        onBack={() => {
                            localStore.removeItem('getpath_active_subview');
                            setActiveSubView('main');
                        }}
                        onChat={onOpenChat}
                        onSettings={onOpenSettings}
                        theme={theme}
                    />
                    <Card className="themed-card shadow-lg">
                        <Card.Header className="border-secondary py-3">
                           <div className="d-flex align-items-center justify-content-between">
                                <h5 className="mb-0 themed-text-primary d-flex align-items-center gap-2">
                                    <Brain size={20} className="text-warning" /> Practice Tasks
                                </h5>
                                <Badge bg="secondary" className="bg-opacity-25 themed-text-secondary">Problems Only</Badge>
                            </div>
                        </Card.Header>
                        <Card.Body className="p-4">
                            {problemsLoading ? (
                                <div className="text-center py-5">
                                    <Spinner animation="border" variant="light" className="mb-3" />
                                    <p className="themed-text-secondary mb-1">Generating graded practice challenges (Baby to Soldier)...</p>
                                    <small className="text-secondary d-block mt-2">You can safely return to the roadmap or browse other pages; generation continues in the background.</small>
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
                                        {['A', 'B', 'C', 'D'].map(g => {
                                            const GroupIcon = groupMetaData[g].icon;
                                            return (
                                                <Button
                                                    key={g}
                                                    variant={activeProblemGroup === g ? groupMetaData[g].badgeBg : 'link'}
                                                    className={`flex-grow-1 py-2 text-decoration-none rounded-3 d-flex align-items-center justify-content-center ${
                                                        activeProblemGroup === g 
                                                            ? 'text-white shadow-sm' 
                                                            : 'themed-text-secondary'
                                                    }`}
                                                    title={groupMetaData[g].title}
                                                    onClick={() => setActiveProblemGroup(g)}
                                                >
                                                    <GroupIcon size={18} />
                                                </Button>
                                            );
                                        })}
                                    </div>

                                    <div className="mb-4 p-3 bg-secondary bg-opacity-5 rounded-3 border border-secondary border-opacity-10">
                                        <h6 className={`fw-bold text-${groupMetaData[activeProblemGroup].badgeBg} mb-1 d-flex align-items-center gap-2`}>
                                            {React.createElement(groupMetaData[activeProblemGroup].icon, { size: 16 })} {groupMetaData[activeProblemGroup].title}
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
                    onBack={() => {
                        localStore.removeItem('getpath_active_subview');
                        localStore.removeItem('getpath_quiz_questions');
                        localStore.removeItem('getpath_current_quiz_index');
                        localStore.removeItem('getpath_quiz_answers');
                        localStore.removeItem('getpath_quiz_score');
                        localStore.removeItem('getpath_current_card_index');
                        onBack();
                    }}
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
                                    {!resourceError && node.resources && node.resources.map((res, i) => {
                                        const resourceUrl = res.url.startsWith('http') ? res.url : `https://www.google.com/search?q=${encodeURIComponent(res.url)}`;
                                        return (
                                            <Card 
                                                key={i} 
                                                as="a"
                                                href={resourceUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="bg-secondary bg-opacity-10 border-0 mb-3 text-decoration-none resource-card"
                                            >
                                                <Card.Body className="d-flex align-items-start gap-3">
                                                    <div className="mt-1 flex-shrink-0">
                                                        {res.type === 'video' ? <Play size={24} className="text-danger" /> : <ExternalLink size={24} className="text-primary" />}
                                                    </div>
                                                    <div className="flex-grow-1">
                                                        <h5 className="mb-1 themed-text-primary resource-card-title">{res.title}</h5>
                                                        <p className="themed-text-secondary small mb-0">{res.description}</p>
                                                    </div>
                                                </Card.Body>
                                            </Card>
                                        );
                                    })}

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
                                             <Layers size={20} className="text-primary" />
                                             <span className="fw-semibold small text-center">Study Flashcards</span>
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
                                             <Brain size={20} className="text-warning" />
                                             <span className="fw-semibold small text-center">Practice Tasks</span>
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
                                             <GraduationCap size={20} className="text-info" />
                                             <span className="fw-semibold small text-center">Research Papers</span>
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
                                                     <span className="small text-center">Generating...</span>
                                                 </>
                                             ) : (
                                                 <>
                                                     <CheckCircle size={20} />
                                                     <span className="fw-semibold small text-center">Take Quiz</span>
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
