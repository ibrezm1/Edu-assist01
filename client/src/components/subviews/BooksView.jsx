import React from 'react';
import { Row, Col, Card, Button, Spinner, Alert, Badge } from 'react-bootstrap';
import { BookOpen, ExternalLink, Star } from 'lucide-react';
import TopNavigation from '../TopNavigation';

const BooksView = ({
    node,
    topic,
    theme,
    booksLoading,
    booksError,
    startBooks,
    onBack,
    onOpenChat,
    onOpenSettings
}) => {
    const hasBooks = node.books && node.books.length > 0;

    return (
        <div className="content-wrapper">
            <TopNavigation
                title={`Books: ${node.title}`}
                onBack={onBack}
                onChat={onOpenChat}
                onSettings={onOpenSettings}
                theme={theme}
            />
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
                                <Button 
                                    variant="outline-primary" 
                                    size="sm" 
                                    className="d-flex align-items-center gap-2 py-1 px-3 rounded-pill"
                                    href={`https://books.google.com/books?q=${encodeURIComponent(node.title)}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    title="Search this topic on Google Books"
                                >
                                    <span style={{ fontSize: '0.8rem' }}>Google Books</span>
                                </Button>
                                <Button 
                                    variant="outline-secondary" 
                                    size="sm" 
                                    className="d-flex align-items-center gap-2 py-1 px-3 rounded-pill"
                                    href={`https://www.perplexity.ai/search?q=${encodeURIComponent('What are the top books or textbooks to study: ' + node.title + ' - ' + node.description)}&focus=internet`}
                                    target="_blank"
                                    rel="noreferrer"
                                    title="Search books on this topic using Perplexity"
                                >
                                    <span style={{ fontSize: '0.8rem' }}>Perplexity</span>
                                </Button>
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
                                                    <Button 
                                                        variant="outline-light" 
                                                        size="sm" 
                                                        className="px-2 py-1"
                                                        style={{ fontSize: '0.8rem' }}
                                                        href={googleBooksUrl}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        title="Search this book on Google Books"
                                                    >
                                                        Google Books
                                                    </Button>
                                                    <Button 
                                                        variant="outline-info" 
                                                        size="sm" 
                                                        className="px-2 py-1"
                                                        style={{ fontSize: '0.8rem' }}
                                                        href={amazonUrl}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        title="Search this book on Amazon"
                                                    >
                                                        Amazon
                                                    </Button>
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
        </div>
    );
};

export default BooksView;
