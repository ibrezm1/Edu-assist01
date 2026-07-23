import React, { useState, useEffect } from 'react';
import { Card, Button, Spinner, Badge } from 'react-bootstrap';
import { CheckCircle, XCircle, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';

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

const ActiveTasksPanel = ({
    backgroundTasks = {},
    dismissBackgroundTask,
    killBackgroundTask,
    triggerGenerationTask,
    onOpenAssessment,
    onOpenPath,
    onOpenChat,
    onOpenNode,
    pathData,
    dismissAllTasks,
    dismissCompletedTasks
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const tasks = Object.values(backgroundTasks);
    const taskCount = tasks.length;
    const isAnyRunning = tasks.some(t => t.status === 'generating');
    const isAnyFailed = tasks.some(t => t.status === 'failed');
    const hasCompleted = tasks.some(t => t.status === 'completed');

    if (taskCount === 0) return null;

    return (
        <Card className="themed-card mb-4 shadow-sm">
            <Card.Header 
                className="task-notification-header py-2 d-flex justify-content-between align-items-center"
                style={{ cursor: 'pointer' }}
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <span className="fw-bold themed-text-primary d-flex align-items-center gap-2" style={{ fontSize: '0.9rem' }}>
                    <RefreshCw size={14} className={`text-primary ${isAnyRunning ? 'spin-slow' : ''}`} /> 
                    Background Tasks ({taskCount})
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    {isAnyRunning && (
                        <Spinner 
                            animation="grow" 
                            size="sm" 
                            variant="primary" 
                            className="ms-1"
                            style={{ width: '8px', height: '8px' }} 
                            title="Background task in progress"
                        />
                    )}
                    {isAnyFailed && (
                        <span 
                            className="bg-danger rounded-circle d-inline-block ms-1" 
                            style={{ width: '8px', height: '8px' }} 
                            title="Some background tasks failed" 
                        />
                    )}
                </span>
                <div className="d-flex align-items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    {dismissCompletedTasks && hasCompleted && (
                        <Button 
                            variant="outline-secondary" 
                            size="sm" 
                            className="py-0 px-2"
                            style={{ fontSize: '0.75rem' }}
                            onClick={dismissCompletedTasks}
                        >
                            Dismiss Completed
                        </Button>
                    )}
                    {dismissAllTasks && (
                        <Button 
                            variant="outline-danger" 
                            size="sm" 
                            className="py-0 px-2"
                            style={{ fontSize: '0.75rem' }}
                            onClick={dismissAllTasks}
                        >
                            Dismiss All
                        </Button>
                    )}
                </div>
            </Card.Header>
            {isExpanded && (
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
                                    className="d-flex align-items-center justify-content-between rounded p-2 task-notification-row" 
                                    style={{ fontSize: '0.85rem', cursor: 'pointer', transition: 'background-color 0.2s ease' }}
                                    title="Click to go to this task and view progress"
                                    onClick={() => {
                                        if (task.taskType === 'chat' && onOpenChat) {
                                            onOpenChat();
                                            return;
                                        }
                                        if (task.taskType === 'assessment' && onOpenAssessment) {
                                            onOpenAssessment(task.nodeTitle);
                                            return;
                                        }
                                        if ((task.taskType === 'path' || task.taskType === 'refine') && onOpenPath) {
                                            onOpenPath(task.nodeTitle);
                                            return;
                                        }
                                        if (onOpenNode && pathData?.nodes) {
                                            const matchingNode = pathData.nodes.find(n => n.id === task.nodeId);
                                            if (matchingNode) {
                                                const subViewMap = {
                                                    'flashcards': 'flashcards',
                                                    'more-flashcards': 'flashcards',
                                                    'quiz': 'quiz',
                                                    'more-quiz': 'quiz',
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
                                        }
                                    }}
                                >
                                    <div className="d-flex align-items-center gap-2">
                                        {isGenerating && <Spinner animation="border" size="sm" variant="primary" style={{ width: '12px', height: '12px' }} />}
                                        {isCompleted && <CheckCircle size={14} className="text-success" />}
                                        {isFailed && <XCircle size={14} className="text-danger" />}
                                        <span>
                                            <strong className="themed-text-primary">{task.nodeTitle}</strong>:{" "}
                                            <span className="text-secondary text-capitalize">
                                                {task.taskType === 'more-flashcards' ? 'More Flashcards' :
                                                 task.taskType === 'more-quiz' ? 'More Quiz Questions' :
                                                 task.taskType === 'papers' ? 'Research Papers' :
                                                 task.taskType === 'problems' ? 'Practice Tasks' :
                                                 task.taskType === 'assessment' ? 'Diagnostic Assessment' :
                                                 task.taskType === 'path' ? 'Learning Plan' :
                                                 task.taskType === 'refine' ? 'Customizing Path' :
                                                 task.taskType}
                                            </span>{" "}
                                            {isGenerating && <span className="text-primary">(Generating...)</span>}
                                            {isCompleted && <span className="text-success">(Completed!)</span>}
                                            {isFailed && <span className="text-danger">(Failed: {task.error})</span>}
                                            {task.model && (
                                                <Badge bg="secondary" className="bg-opacity-10 text-secondary border border-secondary border-opacity-25 ms-2" style={{ fontSize: '0.7rem' }}>
                                                    {task.model}
                                                </Badge>
                                            )}
                                            <TaskTimer task={task} />
                                        </span>
                                    </div>
                                    <div className="d-flex gap-2">
                                        {isGenerating && killBackgroundTask && (
                                            <Button 
                                                variant="outline-danger" 
                                                size="sm" 
                                                className="py-0 px-2"
                                                style={{ fontSize: '0.75rem' }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    killBackgroundTask(task.id);
                                                }}
                                            >
                                                Kill
                                            </Button>
                                        )}
                                        {isFailed && dismissBackgroundTask && triggerGenerationTask && (
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
                                        {(isCompleted || isFailed) && dismissBackgroundTask && (
                                            <Button 
                                                variant="outline-secondary" 
                                                size="sm" 
                                                className="py-0 px-2" 
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
            )}
        </Card>
    );
};

export default ActiveTasksPanel;
