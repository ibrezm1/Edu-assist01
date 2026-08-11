import React, { useState } from 'react';
import { Row, Col, Card, Button, Spinner, Alert, Badge, Dropdown } from 'react-bootstrap';
import { BookOpen, ExternalLink, Star, Code2 } from 'lucide-react';
import TopNavigation from '../TopNavigation';
import AskAiDropdown from '../AskAiDropdown';
import JsonEditorModal from '../JsonEditorModal';

const BooksView = ({
    node,
    topic,
    theme,
    booksLoading,
    booksError,
    startBooks,
    onBack,
    onOpenChat,
    onOpenSettings,
    settings,
    updateNodeBooks
}) => {
    const [showJsonModal, setShowJsonModal] = useState(false);

    const handleSaveBooksJson = (parsed) => {
        updateNodeBooks(node.id, parsed);
        setShowJsonModal(false);
    };

    const validateBooksSchema = (parsed) => {
        if (!Array.isArray(parsed)) {
            throw new Error("JSON must be a valid array of books.");
        }
        parsed.forEach((item, i) => {
            if (!item.title) throw new Error(`Book [index ${i}] is missing 'title' field.`);
            if (!item.author) throw new Error(`Book [index ${i}] is missing 'author' field.`);
            if (!item.description) throw new Error(`Book [index ${i}] is missing 'description' field.`);
        });
    };

    const hasBooks = node.books && node.books.length > 0;

    return (
        <div className="content-wrapper">
            <TopNavigation
                title={`Books: ${node.title}`}
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
                        <BookOpen size={18} className="text-primary" /> Top Recommended Books
                    </h5>
                </Card.Header>
                <Card.Body className="p-4">
                    {booksLoading ? (
                        <div className="text-center py-5">
                            <Spinner animation="border" variant="light" className="mb-3" />
                            <p className="themed-text-secondary mb-1">Searching and compiling the top rated books via Web Search...</p>
                            <small className="text-secondary d-block mt-2">You can safely return to the roadmap or browse other pages; generation continues in the background.</small>
                        </div>
                    ) : booksError ? (
                        <Alert variant="danger" className="bg-danger bg-opacity-10 border-danger text-white">
                            {booksError}
                            <div className="mt-3">
                                <Button variant="outline-light" size="sm" onClick={startBooks}>Retry</Button>
                            </div>
                        </Alert>
                    ) : !hasBooks ? (
                        <div className="text-center py-5 themed-text-secondary">
                            <p>No books recommended yet.</p>
                            <Button variant="primary" onClick={startBooks}>Find Recommended Books</Button>
                        </div>
                    ) : (
                        <div className="d-flex flex-column gap-3">
                            <div className="d-flex align-items-center gap-2 mb-2 p-3 bg-secondary bg-opacity-10 rounded-3 border border-secondary border-opacity-10 flex-wrap">
                                <Dropdown className="px-0 rounded-pill">
                                    <Dropdown.Toggle
                                        id="top-search-books"
                                        variant="outline-primary"
                                        size="sm"
                                        style={{ fontSize: '0.8rem' }}
                                    >
                                        Search Books
                                    </Dropdown.Toggle>
                                    <Dropdown.Menu popperConfig={{ strategy: 'fixed' }}>
                                        <Dropdown.Item
                                            href={`https://books.google.com/books?q=${encodeURIComponent(node.title)}`}
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            Google Books
                                        </Dropdown.Item>
                                    </Dropdown.Menu>
                                </Dropdown>

                                <AskAiDropdown
                                    id="top-ask-ai"
                                    title="Ask AI"
                                    prompt={`What are the top books or textbooks to study: ${node.title} - ${node.description}`}
                                    settings={settings}
                                    variant="outline-info"
                                    size="sm"
                                    className="rounded-pill"
                                />
                            </div>

                            <div className="d-flex flex-column gap-3" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                                {node.books.map((book, i) => {
                                    const googleBooksUrl = `https://www.google.com/search?tbm=bks&q=${encodeURIComponent(book.title + ' ' + (book.author || ''))}`;
                                    const amazonUrl = `https://www.amazon.com/s?k=${encodeURIComponent(book.title + ' ' + (book.author || '') + ' book')}`;

                                    return (
                                        <Card key={i} className="bg-secondary bg-opacity-10 border-0 mb-2">
                                            <Card.Body className="p-3">
                                                <div className="d-flex justify-content-between align-items-start gap-2 mb-2 flex-wrap flex-md-nowrap">
                                                    <div>
                                                        <h6 className="themed-text-primary fw-bold mb-1">{book.title}</h6>
                                                        <small className="text-secondary d-block mb-2">
                                                            by {book.author || 'Unknown Author'}
                                                        </small>
                                                    </div>
                                                    {book.rating && (
                                                        <Badge bg="warning" className="text-dark d-flex align-items-center gap-1 py-1 px-2 mb-2 mb-md-0" style={{ fontSize: '0.8rem', height: 'fit-content' }}>
                                                            <Star size={12} fill="currentColor" className="text-dark" />
                                                            <span>{book.rating} / 5</span>
                                                        </Badge>
                                                    )}
                                                </div>
                                                <p className="small themed-text-secondary mb-3" style={{ fontSize: '0.85rem' }}>
                                                    {book.description}
                                                </p>
                                                <div className="d-flex flex-wrap gap-2 align-items-center">
                                                    {book.url && (
                                                        <Button
                                                            href={book.url.startsWith('http') ? book.url : `https://www.google.com/search?q=${encodeURIComponent(book.url)}`}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            variant="primary"
                                                            size="sm"
                                                            className="px-3 py-1"
                                                            style={{ fontSize: '0.8rem' }}
                                                        >
                                                            Buy or View Book <ExternalLink size={12} className="ms-1" />
                                                        </Button>
                                                    )}
                                                    <div className="dropdown-wrapper" onClick={(e) => e.stopPropagation()}>
                                                        <Dropdown className="px-0 py-0">
                                                            <Dropdown.Toggle
                                                                id={`search-book-${i}`}
                                                                variant="outline-primary"
                                                                size="sm"
                                                                style={{ fontSize: '0.8rem' }}
                                                            >
                                                                Search Book
                                                            </Dropdown.Toggle>
                                                            <Dropdown.Menu popperConfig={{ strategy: 'fixed' }}>
                                                                <Dropdown.Item
                                                                    href={googleBooksUrl}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                >
                                                                    Google Books
                                                                </Dropdown.Item>
                                                                <Dropdown.Item
                                                                    href={amazonUrl}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                >
                                                                    Amazon Books
                                                                </Dropdown.Item>
                                                            </Dropdown.Menu>
                                                        </Dropdown>
                                                    </div>

                                                     <div className="dropdown-wrapper" onClick={(e) => e.stopPropagation()}>
                                                         <AskAiDropdown
                                                             id={`ask-ai-book-${i}`}
                                                             title="Ask AI"
                                                             prompt={`Summarize the key takeaways, chapters overview, and study advice for the book: "${book.title}" by ${book.author || 'Unknown'}. Explain in English only.`}
                                                             settings={settings}
                                                             variant="outline-info"
                                                             size="sm"
                                                             className="px-0 py-0"
                                                         />
                                                     </div>
                                                </div>
                                            </Card.Body>
                                        </Card>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </Card.Body>
            </Card>

            <JsonEditorModal
                show={showJsonModal}
                onHide={() => setShowJsonModal(false)}
                title="Edit Recommended Books JSON"
                data={node.books}
                onSave={handleSaveBooksJson}
                validateSchema={validateBooksSchema}
            />
        </div>
    );
};

export default BooksView;
