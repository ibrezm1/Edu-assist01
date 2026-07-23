import React, { useState } from 'react';
import { Row, Col, Card, Button, Spinner, Alert, ListGroup, Stack, Badge, Dropdown, DropdownButton } from 'react-bootstrap';
import { ChevronLeft, ChevronRight, Sparkles, Layers, LayoutGrid, List } from 'lucide-react';
import { motion } from 'framer-motion';
import TopNavigation from '../TopNavigation';

const FlashcardsView = ({
    node,
    settings,
    topic,
    theme,
    flashcardsLoading,
    flashcardsError,
    loadingMoreFlashcards,
    cardViewMode,
    setCardViewMode,
    currentCardIndex,
    isFlipped,
    setIsFlipped,
    startFlashcards,
    loadMoreFlashcards,
    handlePrevCard,
    handleNextCard,
    onBack,
    onOpenChat,
    onOpenSettings
}) => {
    const [copiedButtonId, setCopiedButtonId] = useState(null);

    const handleCopyAndOpen = (buttonId, textToCopy, urlToOpen) => {
        navigator.clipboard.writeText(textToCopy);
        setCopiedButtonId(buttonId);
        setTimeout(() => {
            setCopiedButtonId(null);
            if (urlToOpen) {
                window.open(urlToOpen, '_blank');
            }
        }, 1000);
    };

    const hasCards = node.flashcards && node.flashcards.length > 0;
    const activeCard = hasCards && node.flashcards[currentCardIndex] ? node.flashcards[currentCardIndex] : { front: '', back: '' };

    return (
        <div className="content-wrapper-narrow">
            <TopNavigation
                title={`Study: ${node.title}`}
                onBack={onBack}
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

                            <div className="d-flex justify-content-center gap-2 flex-wrap mb-2 mt-1">
                                <div className="dropdown-wrapper" onClick={(e) => e.stopPropagation()}>
                                    <DropdownButton
                                        id="ask-ai-flashcard-hint"
                                        title="Ask AI Hint"
                                        variant="outline-info"
                                        size="sm"
                                        className="px-0"
                                        style={{ fontSize: '0.75rem' }}
                                    >
                                        {settings?.enableChatGPT !== false && (
                                            <Dropdown.Item
                                                href={`https://chatgpt.com/?q=${encodeURIComponent('Only provide hints, guiding questions, intuition, and partial steps and not the complete answer for this flashcard question: ' + activeCard.front)}&hints=search&temporary-chat=true`}
                                                target="_blank"
                                                rel="noreferrer"
                                            >
                                                ChatGPT
                                            </Dropdown.Item>
                                        )}
                                        {settings?.enablePerplexity !== false && (
                                            <Dropdown.Item
                                                href={`https://www.perplexity.ai/search?q=${encodeURIComponent('Only provide hints, guiding questions, intuition, and partial steps and not the complete answer for this flashcard question: ' + activeCard.front)}&copilot=false`}
                                                target="_blank"
                                                rel="noreferrer"
                                            >
                                                Perplexity
                                            </Dropdown.Item>
                                        )}
                                        <Dropdown.Item
                                            onClick={() => handleCopyAndOpen('fc-kimi', `Only provide hints, guiding questions, intuition, and partial steps and not the complete answer for this flashcard question: ${activeCard.front}`, 'https://kimi.moonshot.cn')}
                                        >
                                            {copiedButtonId === 'fc-kimi' ? 'Copied & Opening Kimi...' : 'Kimi Chat'}
                                        </Dropdown.Item>
                                        <Dropdown.Item
                                            onClick={() => handleCopyAndOpen('fc-longcat', `Only provide hints, guiding questions, intuition, and partial steps and not the complete answer for this flashcard question: ${activeCard.front}`, 'https://longcat.chat')}
                                        >
                                            {copiedButtonId === 'fc-longcat' ? 'Copied & Opening Longcat...' : 'Longcat Chat'}
                                        </Dropdown.Item>
                                        <Dropdown.Item
                                            onClick={() => handleCopyAndOpen('fc-deepseek', `Only provide hints, guiding questions, intuition, and partial steps and not the complete answer for this flashcard question: ${activeCard.front}`, 'https://chat.deepseek.com')}
                                        >
                                            {copiedButtonId === 'fc-deepseek' ? 'Copied & Opening DeepSeek...' : 'DeepSeek Chat'}
                                        </Dropdown.Item>
                                        {settings?.enableDuckAI !== false && (
                                            <Dropdown.Item
                                                href={`https://duck.ai/chat?q=${encodeURIComponent('Only provide hints, guiding questions, intuition, and partial steps and not the complete answer for this flashcard question: ' + activeCard.front)}`}
                                                target="_blank"
                                                rel="noreferrer"
                                            >
                                                Duck.ai
                                            </Dropdown.Item>
                                        )}
                                    </DropdownButton>
                                </div>
                            </div>

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
                            <ListGroup variant="flush" className="bg-transparent" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                                {node.flashcards.map((card, i) => (
                                    <ListGroup.Item key={i} className="bg-transparent border-secondary py-3 px-0">
                                        <div className="fw-bold themed-text-primary mb-2">Q{i + 1}: {card.front}</div>
                                        <div className="text-secondary small bg-secondary bg-opacity-10 rounded-3 p-3">{card.back}</div>
                                        <div className="d-flex gap-2 flex-wrap align-items-center mt-2">
                                            {settings?.enableChatGPT !== false && (
                                                <Button
                                                    variant="outline-warning"
                                                    size="sm"
                                                    className="py-1 px-2 rounded-3 d-flex align-items-center gap-1 border-opacity-50 text-decoration-none"
                                                    style={{ fontSize: '0.75rem' }}
                                                    href={`https://chatgpt.com/?q=${encodeURIComponent('Only provide hints, guiding questions, intuition, and partial steps and not the complete answer for this flashcard question: ' + card.front)}&hints=search&temporary-chat=true`}
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
                                                    href={`https://www.perplexity.ai/search?q=${encodeURIComponent('Only provide hints, guiding questions, intuition, and partial steps and not the complete answer for this flashcard question: ' + card.front)}&copilot=false`}
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
                                                    href={`https://duck.ai/chat?q=${encodeURIComponent('Only provide hints, guiding questions, intuition, and partial steps and not the complete answer for this flashcard question: ' + card.front)}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    title="Ask Duck.ai Chat for a hint"
                                                >
                                                    <span>Duck.ai Hint</span>
                                                </Button>
                                            )}
                                        </div>
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
        </div>
    );
};

export default FlashcardsView;
