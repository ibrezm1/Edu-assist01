import React from 'react';
import { Row, Col, Card, Button, Spinner, Alert, Stack } from 'react-bootstrap';
import { CheckCircle, XCircle, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import TopNavigation from '../TopNavigation';

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
    setQuizAnswers
}) => {
    const hasQuestions = quizQuestions && quizQuestions.length > 0;
    const currentQuestion = hasQuestions && quizQuestions[currentQuizIndex] 
        ? quizQuestions[currentQuizIndex] 
        : { id: '', text: '', options: [], reasoning: '', correctAnswerIndex: 0 };

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

                                <div className="d-flex justify-content-center gap-2 flex-wrap mt-3 mb-2">
                                    {settings?.enableChatGPT !== false && (
                                        <Button 
                                            variant="outline-warning" 
                                            size="sm" 
                                            className="py-1 px-2 rounded-3 d-flex align-items-center gap-1 border-opacity-50 text-decoration-none"
                                            style={{ fontSize: '0.75rem' }}
                                            href={`https://chatgpt.com/?q=${encodeURIComponent('Only provide hints, guiding questions, intuition, and partial steps and not the complete answer for this quiz question: ' + currentQuestion.text + '\nOptions:\n' + currentQuestion.options.map((opt, i) => `${i + 1}. ${opt}`).join('\n'))}&hints=search&temporary-chat=true`}
                                            target="_blank"
                                            rel="noreferrer"
                                            title="Ask ChatGPT for a hint"
                                        >
                                            <span>ChatGPT Hint</span>
                                        </Button>
                                    )}
                                    {settings?.enablePerplexity !== false && (
                                        <Button 
                                            variant="outline-secondary" 
                                            size="sm" 
                                            className="py-1 px-2 rounded-3 d-flex align-items-center gap-1 border-opacity-50 text-decoration-none"
                                            style={{ fontSize: '0.75rem' }}
                                            href={`https://www.perplexity.ai/search?q=${encodeURIComponent('Only provide hints, guiding questions, intuition, and partial steps and not the complete answer for this quiz question: ' + currentQuestion.text + '\nOptions:\n' + currentQuestion.options.map((opt, i) => `${i + 1}. ${opt}`).join('\n'))}&copilot=false`}
                                            target="_blank"
                                            rel="noreferrer"
                                            title="Ask Perplexity AI for a hint"
                                        >
                                            <span>Perplexity Hint</span>
                                        </Button>
                                    )}
                                    {settings?.enableDuckAI !== false && (
                                        <Button 
                                            variant="outline-info" 
                                            size="sm" 
                                            className="py-1 px-2 rounded-3 d-flex align-items-center gap-1 border-opacity-50 text-decoration-none"
                                            style={{ fontSize: '0.75rem' }}
                                            href={`https://duck.ai/chat?q=${encodeURIComponent('Only provide hints, guiding questions, intuition, and partial steps and not the complete answer for this quiz question: ' + currentQuestion.text + '\nOptions:\n' + currentQuestion.options.map((opt, i) => `${i + 1}. ${opt}`).join('\n'))}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            title="Ask Duck.ai Chat for a hint"
                                        >
                                            <span>Duck.ai Hint</span>
                                        </Button>
                                    )}
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
        </div>
    );
};

export default QuizView;
