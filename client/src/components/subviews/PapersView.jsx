import React, { useState } from 'react';
import { Row, Col, Card, Button, Spinner, Alert, Dropdown } from 'react-bootstrap';
import { GraduationCap, ExternalLink, Copy, Check, Code2 } from 'lucide-react';
import TopNavigation from '../TopNavigation';
import AskAiDropdown from '../AskAiDropdown';
import JsonEditorModal from '../JsonEditorModal';

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
    settings = {},
    updateNodeResearchPapers
}) => {
    const hasPapers = node.researchPapers && node.researchPapers.length > 0;
    const [copiedIndex, setCopiedIndex] = useState(null);
    const [copiedLinkId, setCopiedLinkId] = useState(null);
    const [showJsonModal, setShowJsonModal] = useState(false);

    const handleSavePapersJson = (parsed) => {
        updateNodeResearchPapers(node.id, parsed);
        setShowJsonModal(false);
    };

    const validatePapersSchema = (parsed) => {
        if (!Array.isArray(parsed)) {
            throw new Error("JSON must be a valid array of research papers.");
        }
        parsed.forEach((item, i) => {
            if (!item.title) throw new Error(`Paper [index ${i}] is missing 'title' field.`);
            if (!item.author) throw new Error(`Paper [index ${i}] is missing 'author' field.`);
            if (!item.description) throw new Error(`Paper [index ${i}] is missing 'description' field.`);
        });
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
                                                <div className="dropdown-wrapper" onClick={(e) => e.stopPropagation()}>
                                                    <Dropdown className="px-0">
                                                        <Dropdown.Toggle
                                                            id={`search-db-dropdown-${i}`}
                                                            variant="outline-primary"
                                                            size="sm"
                                                            style={{ fontSize: '0.8rem' }}
                                                        >
                                                            Search Database
                                                        </Dropdown.Toggle>
                                                        <Dropdown.Menu popperConfig={{ strategy: 'fixed' }}>
                                                            <Dropdown.Item
                                                                href={`https://scholar.google.com/scholar?q=${encodeURIComponent(paper.title)}`}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                            >
                                                                Google Scholar
                                                            </Dropdown.Item>
                                                            <Dropdown.Item
                                                                href={`https://www.semanticscholar.org/search?q=${encodeURIComponent(paper.title)}`}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                            >
                                                                Semantic Scholar
                                                            </Dropdown.Item>
                                                            <Dropdown.Item
                                                                href={`https://arxiv.org/search/?query=${encodeURIComponent(paper.title)}&searchtype=all&abstracts=show&order=-announced_date_first&size=50`}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                            >
                                                                ArXiv
                                                            </Dropdown.Item>
                                                            <Dropdown.Item
                                                                href={`https://consensus.app/results/?q=${encodeURIComponent(paper.title)}`}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                            >
                                                                Consensus
                                                            </Dropdown.Item>
                                                            <Dropdown.Item
                                                                href={`https://www.google.com/search?q=${encodeURIComponent(paper.title)}`}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                            >
                                                                Google Web
                                                            </Dropdown.Item>
                                                        </Dropdown.Menu>
                                                    </Dropdown>
                                                </div>

                                                <div className="dropdown-wrapper" onClick={(e) => e.stopPropagation()}>
                                                    <AskAiDropdown
                                                        id={`ask-ai-dropdown-${i}`}
                                                        title="Ask AI"
                                                        prompt={`Explain the methodology, findings, and contributions of the research paper: "${paper.title}" (Key Idea: ${paper.keyIdea}). Explain in English only.`}
                                                        settings={settings}
                                                        variant="outline-info"
                                                        size="sm"
                                                        className="px-0"
                                                    />
                                                </div>

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

            <JsonEditorModal
                show={showJsonModal}
                onHide={() => setShowJsonModal(false)}
                title="Edit Research Papers JSON"
                data={node.researchPapers}
                onSave={handleSavePapersJson}
                validateSchema={validatePapersSchema}
            />
        </div>
    );
};

export default PapersView;
