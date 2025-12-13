import React, { useState } from 'react';
import { motion } from 'framer-motion';

const Onboarding = ({ onStart }) => {
    const [apiKey, setApiKey] = useState('');
    const [topic, setTopic] = useState('');
    const [serverHasKey, setServerHasKey] = useState(false);
    const [loading, setLoading] = useState(false);

    React.useEffect(() => {
        fetch('http://localhost:3000/api/config')
            .then(res => res.json())
            .then(data => {
                if (data.hasServerKey) setServerHasKey(true);
            })
            .catch(err => console.error(err));
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (topic && (apiKey || serverHasKey)) {
            onStart(apiKey, topic);
        } else if (!topic) {
            alert("Please enter a topic");
        } else {
            alert("Please enter an API Key");
        }
    };

    return (
        <div className="auth-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
            <motion.div
                className="glass-panel"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ width: '100%', maxWidth: '500px' }}
            >
                <h1 style={{ textAlign: 'center', marginBottom: '2rem' }}>GetPath</h1>
                <p style={{ textAlign: 'center', marginBottom: '2rem', color: 'var(--text-secondary)' }}>
                    Personalized AI Learning Paths tailored to your knowledge.
                </p>

                <form onSubmit={handleSubmit}>
                    {serverHasKey ? (
                        <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981', borderRadius: '8px', color: '#10b981', textAlign: 'center' }}>
                            ✅ AI Service Configured
                        </div>
                    ) : (
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Gemini API Key</label>
                            <input
                                type="password"
                                className="input-field"
                                placeholder="Enter your Google Gemini API Key"
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                required
                            />
                            <small style={{ color: 'var(--text-secondary)' }}>
                                Your key is only used for this session and not stored.
                            </small>
                        </div>
                    )}

                    <div style={{ marginBottom: '2rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>What do you want to learn?</label>
                        <input
                            type="text"
                            className="input-field"
                            placeholder="e.g. React, Quantum Physics, Gardening..."
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" className="btn" style={{ width: '100%' }}>
                        Start Learning Journey
                    </button>
                </form>
            </motion.div>
        </div>
    );
};

export default Onboarding;
