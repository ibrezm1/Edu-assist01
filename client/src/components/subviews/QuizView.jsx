import React, { useState } from 'react';
import { Row, Col, Card, Button, Spinner, Alert, Stack } from 'react-bootstrap';
import { CheckCircle, XCircle, Sparkles, Code2 } from 'lucide-react';
import { motion } from 'framer-motion';
import TopNavigation from '../TopNavigation';
import AskAiDropdown from '../AskAiDropdown';
import JsonEditorModal from '../JsonEditorModal';

const QuizView = ({
    node,
    settings,
    topic,
    theme,
    quizLoading,
    quizError,
    quizQuestions,
    currentQuizIndex,
    quizAnswers,
    quizScore,
    loadingMoreQuiz,
    startQuiz,
    loadMoreQuizQuestions,
    handleQuizAnswer,
    nextQuizQuestion,
    onBack,
    onOpenChat,
    onOpenSettings,
    setShowQuiz,
    setQuizScore,
    setCurrentQuizIndex,
    setQuizAnswers,
    updateNodeQuiz,
    setQuizQuestions
}) => {
    const [showJsonModal, setShowJsonModal] = useState(false);

    const handleSaveQuizJson = (parsed) => {
        updateNodeQuiz(node.id, parsed);
        setQuizQuestions(parsed);
        localStorage.setItem(`getpath_quiz_questions_${node.id}`, JSON.stringify(parsed));
        setShowJsonModal(false);
    };

    const validateQuizSchema = (parsed) => {
        if (!Array.isArray(parsed)) {
            throw new Error("JSON must be a valid array of quiz questions.");
        }
        parsed.forEach((item, i) => {
            if (!item.id) throw new Error(`Question [index ${i}] is missing 'id' field.`);
            if (!item.text) throw new Error(`Question [index ${i}] is missing 'text' field.`);
            if (!Array.isArray(item.options) || item.options.length < 2) {
                throw new Error(`Question [index ${i}] options must be an array of at least 2 strings.`);
            }
            if (typeof item.correctAnswerIndex !== 'number' || item.correctAnswerIndex < 0 || item.correctAnswerIndex >= item.options.length) {
                throw new Error(`Question [index ${i}] correctAnswerIndex must be a valid number matching options index.`);
            }
        });
    };

    const hasQuestions = quizQuestions && quizQuestions.length > 0;
    const currentQuestion = hasQuestions && quizQuestions[currentQuizIndex]
        ? quizQuestions[currentQuizIndex]
        : { id: '', text: '', options: [], reasoning: '', correctAnswerIndex: 0 };

    let rightAnswersCount = 0;
    let wrongAnswersCount = 0;
    if (hasQuestions) {
        quizQuestions.forEach(q => {
            const answer = quizAnswers[q.id];
            if (answer !== undefined) {
                if (answer === q.correctAnswerIndex) {
                    rightAnswersCount++;
                } else {
                    wrongAnswersCount++;
                }
            }
        });
    }

    return (
        <div className="content-wrapper-narrow">
            <TopNavigation
                title={`Test: ${node.title}`}
                onBack={onBack}
                onChat={() => {
                    if (hasQuestions) {
                        const question = currentQuestion;
                        const context = `I have a question about this quiz question for the topic "${topic}" -> "${node.title}":\n\nQuestion: ${question.text}\nOptions:\n${question.options.map((opt, i) => `${i + 1}. ${opt}`).join('\n')}\nCorrect Option: Option ${question.correctAnswerIndex + 1} (${question.options[question.correctAnswerIndex]})\nReasoning: ${question.reasoning}`;
                        const label = `Quiz Q: "${question.text.substring(0, 30)}${question.text.length > 30 ? '...' : ''}"`;
                        onOpenChat(context, label);
                    } else {
                        onOpenChat();
                    }
                }}
                onSettings={onOpenSettings}
                theme={theme}
            >
                <Button
                    variant="outline-info"
                    size="sm"
                    className="d-flex align-items-center gap-2 justify-content-center text-nowrap"
                    onClick={() => setShowJsonModal(true)}
                >
                    <Code2 size={16} />
                    <span>Edit JSON</span>
                </Button>
            </TopNavigation>
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
                            <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3 pb-3 border-bottom border-secondary border-opacity-10">
                                <span className="themed-text-secondary small fw-medium">
                                    Question {currentQuizIndex + 1} of {quizQuestions.length}
                                </span>
                                <div className="d-flex gap-3 small fw-medium">
                                    <span className="text-success d-flex align-items-center gap-1">
                                        <CheckCircle size={14} />
                                        <span>{rightAnswersCount} Correct</span>
                                    </span>
                                    <span className="text-danger d-flex align-items-center gap-1">
                                        <XCircle size={14} />
                                        <span>{wrongAnswersCount} Incorrect</span>
                                    </span>
                                </div>
                            </div>
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

                            <div className="d-flex justify-content-center gap-2 flex-wrap mt-3 mb-2" onClick={(e) => e.stopPropagation()}>
                                <AskAiDropdown
                                    id="ask-ai-quiz-hint"
                                    title="Ask AI Hint"
                                    prompt={`Only provide hints, guiding questions, intuition, and partial steps and not the complete answer for this quiz question: ${currentQuestion.text}\nOptions:\n${currentQuestion.options.map((opt, i) => `${i + 1}. ${opt}`).join('\n')}. Explain in English only.`}
                                    settings={settings}
                                    variant="outline-info"
                                    size="sm"
                                />
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

            <JsonEditorModal
                show={showJsonModal}
                onHide={() => setShowJsonModal(false)}
                title="Edit Quiz Questions JSON"
                data={node.quiz}
                onSave={handleSaveQuizJson}
                validateSchema={validateQuizSchema}
            />
        </div>
    );
};

export default QuizView;
