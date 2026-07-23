import React from 'react';
import { Row, Col, Card, Button, Spinner, Alert, Badge } from 'react-bootstrap';
import { Brain, CheckCircle, Copy, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import TopNavigation from '../TopNavigation';

const ProblemsView = ({
    node,
    settings,
    theme,
    problemsLoading,
    problemsError,
    activeProblemGroup,
    setActiveProblemGroup,
    completedTasks,
    copiedTaskId,
    groupMetaData,
    handleToggleTaskCompleted,
    handleCopyTask,
    startPracticeProblems,
    onBack,
    onOpenChat,
    onOpenSettings
}) => {
    const hasProblems = node.practiceProblems && node.practiceProblems.length > 0;
    const filteredProblems = hasProblems ? node.practiceProblems.filter(p => p.group === activeProblemGroup) : [];

    return (
        <div className="content-wrapper-narrow">
            <TopNavigation
                title={`Practice: ${node.title}`}
                onBack={onBack}
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
                                            className={`flex-grow-1 py-2 text-decoration-none rounded-3 d-flex align-items-center justify-content-center ${activeProblemGroup === g
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
                                                <Card className={`border-0 themed-card bg-opacity-10 shadow-sm ${isCompleted ? 'bg-success bg-opacity-10 border-start border-success border-3' : 'bg-secondary'
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
                                                        <div className="d-flex gap-2 flex-wrap align-items-center w-100 mt-2">
                                                            {settings?.enableMetaAI !== false && (
                                                                <Button
                                                                    variant="outline-success"
                                                                    size="sm"
                                                                    className="py-1 px-2 rounded-3 d-flex align-items-center gap-1 border-opacity-50 text-decoration-none"
                                                                    style={{ fontSize: '0.75rem' }}
                                                                    href={`https://wa.me/13135550002?text=${encodeURIComponent('Only provide hints, guiding questions, intuition, and partial steps and not the complete answer for this practice task: ' + prob.title + ' - ' + prob.description)}`}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    title="Ask Meta AI on WhatsApp"
                                                                >
                                                                    <span>Meta AI</span>
                                                                </Button>
                                                            )}
                                                            {settings?.enableChatGPT !== false && (
                                                                <Button
                                                                    variant="outline-warning"
                                                                    size="sm"
                                                                    className="py-1 px-2 rounded-3 d-flex align-items-center gap-1 border-opacity-50 text-decoration-none"
                                                                    style={{ fontSize: '0.75rem' }}
                                                                    href={`https://chatgpt.com/?q=${encodeURIComponent('Only provide hints, guiding questions, intuition, and partial steps and not the complete answer for this practice task: ' + prob.title + ' - ' + prob.description)}&hints=search&temporary-chat=true`}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    title="Ask ChatGPT"
                                                                >
                                                                    <span>ChatGPT</span>
                                                                </Button>
                                                            )}
                                                            {settings?.enablePerplexity !== false && (
                                                                <Button
                                                                    variant="outline-secondary"
                                                                    size="sm"
                                                                    className="py-1 px-2 rounded-3 d-flex align-items-center gap-1 border-opacity-50 text-decoration-none"
                                                                    style={{ fontSize: '0.75rem' }}
                                                                    href={`https://www.perplexity.ai/search?q=${encodeURIComponent('Only provide hints, guiding questions, intuition, and partial steps and not the complete answer for this practice task: ' + prob.title + ' - ' + prob.description)}&copilot=false`}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    title="Ask Perplexity AI"
                                                                >
                                                                    <span>Perplexity</span>
                                                                </Button>
                                                            )}
                                                            {settings?.enableDuckAI !== false && (
                                                                <Button
                                                                    variant="outline-info"
                                                                    size="sm"
                                                                    className="py-1 px-2 rounded-3 d-flex align-items-center gap-1 border-opacity-50 text-decoration-none"
                                                                    style={{ fontSize: '0.75rem' }}
                                                                    href={`https://duck.ai/chat?q=${encodeURIComponent('Only provide hints, guiding questions, intuition, and partial steps and not the complete answer for this practice task: ' + prob.title + ' - ' + prob.description)}`}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    title="Ask Duck.ai Chat"
                                                                >
                                                                    <span>Duck.ai</span>
                                                                </Button>
                                                            )}
                                                        </div>
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
        </div>
    );
};

export default ProblemsView;
