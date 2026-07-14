import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

import { Row, Col, Card, Button, Spinner, ListGroup, Badge, Alert, Stack } from 'react-bootstrap';
import { CheckCircle, XCircle, ExternalLink, Play, ArrowLeft, RefreshCw, BookOpen, FileText, Sparkles, ChevronLeft, ChevronRight, RotateCcw, LayoutGrid, List, Code2, Award, Copy, Check, Layers, GraduationCap, Brain, Baby, Shield, Sword, Swords } from 'lucide-react';
import { aiService } from '../services/aiService';

import { storageService } from '../services/storageService';
import TopNavigation from './TopNavigation';
import ResourcesView from './subviews/ResourcesView';
import FlashcardsView from './subviews/FlashcardsView';
import PapersView from './subviews/PapersView';
import ProblemsView from './subviews/ProblemsView';
import QuizView from './subviews/QuizView';



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

    const groupMetaData = {
        'A': { title: 'Baby Level (Trivial)', badgeBg: 'success', description: 'Simple, direct verification exercises to validate environment setup and basic syntax.', icon: Baby },
        'B': { title: 'Novice Level (Intermediate)', badgeBg: 'primary', description: 'Practical tasks covering core features, logic implementations, and common use cases.', icon: Shield },
        'C': { title: 'Warrior Level (Difficult)', badgeBg: 'warning', description: 'Complex scenarios involving architecture integration, performance concerns, and state handling.', icon: Sword },
        'D': { title: 'Soldier Level (Very Difficult)', badgeBg: 'danger', description: 'Advanced open-ended problems challenging algorithmic bounds, performance, or system designs.', icon: Swords }
    };

    if (showQuiz) {
        return (
            <QuizView
                node={node}
                topic={topic}
                theme={theme}
                quizLoading={quizLoading}
                quizError={quizError}
                quizQuestions={quizQuestions}
                currentQuizIndex={currentQuizIndex}
                quizAnswers={quizAnswers}
                quizScore={quizScore}
                loadingMoreQuiz={loadingMoreQuiz}
                startQuiz={startQuiz}
                loadMoreQuizQuestions={loadMoreQuizQuestions}
                handleQuizAnswer={handleQuizAnswer}
                nextQuizQuestion={nextQuizQuestion}
                onBack={() => {
                    localStore.removeItem('getpath_active_subview');
                    localStore.removeItem('getpath_quiz_questions');
                    localStore.removeItem('getpath_current_quiz_index');
                    localStore.removeItem('getpath_quiz_answers');
                    localStore.removeItem('getpath_quiz_score');
                    setShowQuiz(false);
                }}
                onOpenChat={onOpenChat}
                onOpenSettings={onOpenSettings}
                setShowQuiz={setShowQuiz}
                setQuizScore={setQuizScore}
                setCurrentQuizIndex={setCurrentQuizIndex}
                setQuizAnswers={setQuizAnswers}
            />
        );
    }

    if (activeSubView === 'flashcards') {
        return (
            <FlashcardsView
                node={node}
                topic={topic}
                theme={theme}
                flashcardsLoading={flashcardsLoading}
                flashcardsError={flashcardsError}
                loadingMoreFlashcards={loadingMoreFlashcards}
                cardViewMode={cardViewMode}
                setCardViewMode={setCardViewMode}
                currentCardIndex={currentCardIndex}
                isFlipped={isFlipped}
                setIsFlipped={setIsFlipped}
                startFlashcards={startFlashcards}
                loadMoreFlashcards={loadMoreFlashcards}
                handlePrevCard={handlePrevCard}
                handleNextCard={handleNextCard}
                onBack={() => {
                    localStore.removeItem('getpath_active_subview');
                    localStore.removeItem('getpath_current_card_index');
                    setActiveSubView('main');
                    setIsFlipped(false);
                    setCurrentCardIndex(0);
                }}
                onOpenChat={onOpenChat}
                onOpenSettings={onOpenSettings}
            />
        );
    }

    if (activeSubView === 'papers') {
        return (
            <PapersView
                node={node}
                topic={topic}
                theme={theme}
                papersLoading={papersLoading}
                papersError={papersError}
                startResearchPapers={startResearchPapers}
                onBack={() => {
                    localStore.removeItem('getpath_active_subview');
                    setActiveSubView('main');
                }}
                onOpenChat={onOpenChat}
                onOpenSettings={onOpenSettings}
            />
        );
    }

    if (activeSubView === 'problems') {
        return (
            <ProblemsView
                node={node}
                topic={topic}
                theme={theme}
                problemsLoading={problemsLoading}
                problemsError={problemsError}
                activeProblemGroup={activeProblemGroup}
                setActiveProblemGroup={setActiveProblemGroup}
                completedTasks={completedTasks}
                copiedTaskId={copiedTaskId}
                groupMetaData={groupMetaData}
                handleToggleTaskCompleted={handleToggleTaskCompleted}
                handleCopyTask={handleCopyTask}
                startPracticeProblems={startPracticeProblems}
                onBack={() => {
                    localStore.removeItem('getpath_active_subview');
                    setActiveSubView('main');
                }}
                onOpenChat={onOpenChat}
                onOpenSettings={onOpenSettings}
            />
        );
    }

    return (
        <ResourcesView
            node={node}
            theme={theme}
            resourcesLoading={resourcesLoading}
            resourceError={resourceError}
            quizLoading={quizLoading}
            handleRefreshResources={handleRefreshResources}
            startFlashcards={startFlashcards}
            startPracticeProblems={startPracticeProblems}
            startResearchPapers={startResearchPapers}
            startQuiz={startQuiz}
            onBack={() => {
                localStore.removeItem('getpath_active_subview');
                localStore.removeItem('getpath_quiz_questions');
                localStore.removeItem('getpath_current_quiz_index');
                localStore.removeItem('getpath_quiz_answers');
                localStore.removeItem('getpath_quiz_score');
                localStore.removeItem('getpath_current_card_index');
                onBack();
            }}
            onOpenChat={onOpenChat}
            onOpenSettings={onOpenSettings}
        />
    );
};

export default NodeContent;
