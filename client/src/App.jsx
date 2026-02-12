import React, { useState, useEffect } from 'react';
import { Container, Button } from 'react-bootstrap';
import { Settings as SettingsIcon, MessageSquare } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';


import Onboarding from './components/Onboarding';
import Assessment from './components/Assessment';
import PathView from './components/PathView';
import NodeContent from './components/NodeContent';
import Settings from './components/Settings';
import Chat from './components/Chat';
import { storageService } from './services/storageService';

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [topic, setTopic] = useState('');
  const [step, setStep] = useState(() => {
    // Initial sync with URL
    const hash = window.location.hash.replace(/^#\//, '') || 'onboarding';
    return hash;
  });

  const [assessmentResults, setAssessmentResults] = useState(null);
  const [currentNode, setCurrentNode] = useState(null);
  const [completedNodes, setCompletedNodes] = useState([]);
  const [pathData, setPathData] = useState(null);
  const [settings, setSettings] = useState(() => {
    return storageService.getSettings();
  });

  // Sync step state with URL changes
  useEffect(() => {
    const path = location.pathname.replace(/^\//, '') || 'onboarding';
    setStep(path);
  }, [location.pathname]);


  const refreshSettings = () => {
    setSettings(storageService.getSettings());
  };

  const handleOpenSettings = () => {
    navigate('/settings');
  };

  const handleOpenChat = () => {
    navigate('/chat');
  };


  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme || 'dark');
  }, [settings.theme]);

  const handleStart = (topicName) => {
    setTopic(topicName);
    navigate('/assessment');
  };

  const handleSelectSavedPath = (data) => {
    setTopic(data.topic);
    setPathData(data);
    navigate('/path');
  };


  const handleAssessmentComplete = (results) => {
    setAssessmentResults(results);
    navigate('/path');
  };


  const handleOpenNode = (node) => {
    setCurrentNode(node);
    navigate('/node');
  };


  const updateNodeResources = (nodeId, resources) => {
    if (!pathData) return;
    const updatedNodes = pathData.nodes.map(n => {
      if (n.id === nodeId) {
        return { ...n, resources };
      }
      return n;
    });
    setPathData({ ...pathData, nodes: updatedNodes });
    if (currentNode && currentNode.id === nodeId) {
      setCurrentNode({ ...currentNode, resources });
    }
  };

  const handleCompleteNode = (success) => {
    if (success && currentNode) {
      if (!completedNodes.includes(currentNode.id)) {
        setCompletedNodes([...completedNodes, currentNode.id]);
      }
    }
    navigate('/path');
    setCurrentNode(null);
  };


  const handleGoHome = () => {
    navigate('/onboarding');
    setTopic('');
    setPathData(null);
    setAssessmentResults(null);
    setCompletedNodes([]);
  };


  return (
    <div className="min-vh-100 transition-theme" style={{ background: 'var(--bg-color)', color: 'var(--text-primary)', transition: 'background-color 0.3s ease, color 0.3s ease' }}>
      <Container className="py-4">
        {step === 'onboarding' && (
          <Onboarding
            onStart={handleStart}
            onSelectSavedPath={handleSelectSavedPath}
            onOpenSettings={handleOpenSettings}
            apiKey={settings.apiKey}
            demoMode={settings.demoMode}
            onSync={refreshSettings}
            theme={settings.theme}
          />
        )}

        {step === 'settings' && (
          <Settings
            onBack={() => {
              refreshSettings();
              navigate(-1);
            }}
            onSync={refreshSettings}
          />
        )}

        {step === 'chat' && (
          <Chat
            settings={settings}
            onBack={() => navigate(-1)}
          />
        )}

        {step === 'assessment' && (
          <Assessment
            topic={topic}
            settings={settings}
            onComplete={handleAssessmentComplete}
            onCancel={handleGoHome}
            theme={settings.theme}
          />
        )}
        {step === 'path' && (
          <PathView
            topic={topic}
            settings={settings}
            assessmentResults={assessmentResults}
            onOpenNode={handleOpenNode}
            completedNodes={completedNodes}
            pathData={pathData}
            setPathData={setPathData}
            updateNodeResources={updateNodeResources}
            onHome={handleGoHome}
            onOpenChat={handleOpenChat}
            onOpenSettings={handleOpenSettings}
          />
        )}

        {step === 'node' && currentNode && (
          <NodeContent
            node={currentNode}
            topic={topic}
            settings={settings}
            onBack={() => navigate('/path')}
            onCompleteNode={handleCompleteNode}
            updateNodeResources={updateNodeResources}
            onOpenChat={handleOpenChat}
            onOpenSettings={handleOpenSettings}
            theme={settings.theme}
          />
        )}

      </Container>
    </div>
  );
}

export default App;
