import React, { useState } from 'react';
import { Row, Col, Card, Button, Spinner, Alert } from 'react-bootstrap';
import { GraduationCap, ExternalLink, Copy, Check } from 'lucide-react';
import TopNavigation from '../TopNavigation';

const PapersView = ({
    node,
    topic,
    theme,
    papersLoading,
    papersError,
    startResearchPapers,
    onBack,
    onOpenChat,
    onOpenSettings,
    settings = {}
}) => {
    const hasPapers = node.researchPapers && node.researchPapers.length > 0;
    const [copiedIndex, setCopiedIndex] = useState(null);
    const [copiedButtonId, setCopiedButtonId] = useState(null);
    const [copiedLinkId, setCopiedLinkId] = useState(null);

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

    const handleCopyLink = (linkId, url) => {
        navigator.clipboard.writeText(url);
        setCopiedLinkId(linkId);
        setTimeout(() => setCopiedLinkId(null), 2000);
    };

    const handleCopyPaper = (index, paper) => {
        const isDirectUrl = paper.url &&
            paper.url.startsWith('http') &&
            !paper.url.includes('google.com/search') &&
            !paper.url.includes('google.com/scholar') &&
            !paper.url.includes('consensus.app/results') &&
            !paper.url.includes('?q=') &&
            !paper.url.includes('&q=');

        const text = `Title: ${paper.title}\nKey Idea: ${paper.keyIdea}${isDirectUrl ? `\nURL: ${paper.url}` : ''}`;
        navigator.clipboard.writeText(text);
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    return (
        <div className="content-wrapper">
            <TopNavigation
                title={`Papers: ${node.title}`}
                onBack={onBack}
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
                        <div className="d-flex flex-column gap-3">
                            <div className="d-flex align-items-center gap-2 mb-2 p-3 bg-secondary bg-opacity-10 rounded-3 border border-secondary border-opacity-10 flex-wrap">
                                <Button
                                    variant="outline-primary"
                                    size="sm"
                                    className="d-flex align-items-center gap-2 py-1 px-3 rounded-pill"
                                    href={`https://scholar.google.com/scholar?q=${encodeURIComponent(node.title)}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    title="Search this topic on Google Scholar"
                                >
                                    <span style={{ fontSize: '0.8rem' }}>Google Scholar</span>
                                </Button>
                                <Button
                                    variant="outline-info"
                                    size="sm"
                                    className="d-flex align-items-center gap-2 py-1 px-3 rounded-pill"
                                    href={`https://www.semanticscholar.org/search?q=${encodeURIComponent(node.title)}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    title="Search this topic on Semantic Scholar"
                                >
                                    <span style={{ fontSize: '0.8rem' }}>Semantic Scholar</span>
                                </Button>
                                <Button
                                    variant="outline-primary"
                                    size="sm"
                                    className="d-flex align-items-center gap-2 py-1 px-3 rounded-pill"
                                    href={`https://scholar.google.com/scholar_labs/search?q=${encodeURIComponent(node.title)}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    title="Search this topic on Google Scholar Labs"
                                >
                                    <span style={{ fontSize: '0.8rem' }}>Google Scholar Labs</span>
                                </Button>
                            </div>

                            <div className="d-flex flex-column gap-3" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                                {node.researchPapers.map((paper, i) => (
                                    <Card key={i} className="bg-secondary bg-opacity-10 border-0 mb-2">
                                        <Card.Body className="p-3">
                                            <h6 className="themed-text-primary fw-bold mb-2">{paper.title}</h6>
                                            <p className="small themed-text-secondary mb-3" style={{ fontSize: '0.85rem' }}>
                                                <strong>Key Idea:</strong> {paper.keyIdea}
                                            </p>
                                            <div className="d-flex flex-wrap gap-2 align-items-center">
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
                                                <Button
                                                    variant="outline-primary"
                                                    size="sm"
                                                    className="px-2"
                                                    style={{ fontSize: '0.8rem' }}
                                                    href={`https://scholar.google.com/scholar?q=${encodeURIComponent(paper.title)}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    title="Search this paper on Google Scholar"
                                                >
                                                    Google Scholar
                                                </Button>
                                                <Button
                                                    variant="outline-info"
                                                    size="sm"
                                                    className="px-2"
                                                    style={{ fontSize: '0.8rem' }}
                                                    href={`https://www.semanticscholar.org/search?q=${encodeURIComponent(paper.title)}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    title="Search this paper on Semantic Scholar"
                                                >
                                                    Semantic Scholar
                                                </Button>
                                                <Button
                                                    variant="outline-warning"
                                                    size="sm"
                                                    className="px-2"
                                                    style={{ fontSize: '0.8rem' }}
                                                    href={`https://arxiv.org/search/?query=${encodeURIComponent(paper.title)}&searchtype=all&abstracts=show&order=-announced_date_first&size=50`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    title="Search this paper on ArXiv"
                                                >
                                                    ArXiv
                                                </Button>
                                                <Button
                                                    variant="outline-success"
                                                    size="sm"
                                                    className="px-2"
                                                    style={{ fontSize: '0.8rem' }}
                                                    href={`https://www.google.com/search?q=${encodeURIComponent(paper.title)}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    title="Search this paper on Google"
                                                >
                                                    Google
                                                </Button>
                                                {settings.enablePerplexity !== false && (
                                                    <Button
                                                        variant="outline-info"
                                                        size="sm"
                                                        className="px-2"
                                                        style={{ fontSize: '0.8rem' }}
                                                        href={`https://www.perplexity.ai/search?q=${encodeURIComponent(`Explain the methodology, findings, and contributions of the research paper: "${paper.title}" (Key Idea: ${paper.keyIdea})`)}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        title="Search this paper on Perplexity"
                                                    >
                                                        Perplexity
                                                    </Button>
                                                )}
                                                {settings.enableChatGPT !== false && (
                                                    <Button
                                                        variant="outline-success"
                                                        size="sm"
                                                        className="px-2"
                                                        style={{ fontSize: '0.8rem' }}
                                                        href={`https://chatgpt.com/?q=${encodeURIComponent(`Explain the methodology, findings, and contributions of the research paper: "${paper.title}" (Key Idea: ${paper.keyIdea})`)}&hints=search&temporary-chat=true`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        title="Search this paper on ChatGPT (with Web Search)"
                                                    >
                                                        ChatGPT
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="outline-secondary"
                                                    size="sm"
                                                    className="px-2"
                                                    style={{ fontSize: '0.8rem' }}
                                                    href={`https://grok.com/?q=${encodeURIComponent(`Explain the methodology, findings, and contributions of the research paper: "${paper.title}" (Key Idea: ${paper.keyIdea})`)}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    title="Search this paper on Grok"
                                                >
                                                    Grok
                                                </Button>
                                                <Button
                                                    variant="outline-warning"
                                                    size="sm"
                                                    className="px-2"
                                                    style={{ fontSize: '0.8rem' }}
                                                    href={`https://chat.mistral.ai/chat?q=${encodeURIComponent(`Explain the methodology, findings, and contributions of the research paper: "${paper.title}" (Key Idea: ${paper.keyIdea})`)}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    title="Search this paper on Mistral"
                                                >
                                                    Mistral
                                                </Button>
                                                <Button
                                                    variant="outline-primary"
                                                    size="sm"
                                                    className="px-2"
                                                    style={{ fontSize: '0.8rem' }}
                                                    href={`https://consensus.app/results/?q=${encodeURIComponent(paper.title)}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    title="Search this paper on Consensus"
                                                >
                                                    Consensus
                                                </Button>
                                                <Button
                                                    variant="outline-info"
                                                    size="sm"
                                                    className="px-2"
                                                    style={{ fontSize: '0.8rem' }}
                                                    onClick={() => handleCopyAndOpen(`paper-${i}-kimi`, `Explain the methodology, findings, and contributions of the research paper: "${paper.title}" (Key Idea: ${paper.keyIdea})`, 'https://kimi.moonshot.cn')}
                                                    title="Copy prompt and open Kimi Chat"
                                                >
                                                    {copiedButtonId === `paper-${i}-kimi` ? 'Copied!' : 'Kimi'}
                                                </Button>
                                                <Button
                                                    variant="outline-warning"
                                                    size="sm"
                                                    className="px-2"
                                                    style={{ fontSize: '0.8rem' }}
                                                    onClick={() => handleCopyAndOpen(`paper-${i}-longcat`, `Explain the methodology, findings, and contributions of the research paper: "${paper.title}" (Key Idea: ${paper.keyIdea})`, 'https://longcat.chat')}
                                                    title="Copy prompt and open Longcat Chat"
                                                >
                                                    {copiedButtonId === `paper-${i}-longcat` ? 'Copied!' : 'Longcat'}
                                                </Button>
                                                <Button
                                                    variant="outline-primary"
                                                    size="sm"
                                                    className="px-2"
                                                    style={{ fontSize: '0.8rem' }}
                                                    onClick={() => handleCopyAndOpen(`paper-${i}-deepseek`, `Explain the methodology, findings, and contributions of the research paper: "${paper.title}" (Key Idea: ${paper.keyIdea})`, 'https://chat.deepseek.com')}
                                                    title="Copy prompt and open DeepSeek"
                                                >
                                                    {copiedButtonId === `paper-${i}-deepseek` ? 'Copied!' : 'DeepSeek'}
                                                </Button>
                                                {paper.url && (
                                                    <Button
                                                        variant="outline-secondary"
                                                        size="sm"
                                                        className="px-2"
                                                        style={{ fontSize: '0.8rem' }}
                                                        onClick={() => handleCopyLink(`paper-${i}-link`, paper.url)}
                                                        title="Copy paper URL to clipboard"
                                                    >
                                                        {copiedLinkId === `paper-${i}-link` ? (
                                                            <span className="d-flex align-items-center gap-1"><Check size={12} className="text-success" /> Copied Link</span>
                                                        ) : (
                                                            <span className="d-flex align-items-center gap-1"><Copy size={12} /> Copy Link</span>
                                                        )}
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="outline-secondary"
                                                    size="sm"
                                                    className="px-2"
                                                    style={{ fontSize: '0.8rem' }}
                                                    onClick={() => handleCopyPaper(i, paper)}
                                                    title="Copy paper details to clipboard"
                                                >
                                                    {copiedIndex === i ? (
                                                        <span className="d-flex align-items-center gap-1"><Check size={12} className="text-success" /> Copied</span>
                                                    ) : (
                                                        <span className="d-flex align-items-center gap-1"><Copy size={12} /> Copy</span>
                                                    )}
                                                </Button>
                                            </div>
                                        </Card.Body>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}
                </Card.Body>
            </Card>
        </div>
    );
};

export default PapersView;
