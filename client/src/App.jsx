import React, { useState, useEffect } from 'react';
import { Container } from 'react-bootstrap';
import { useNavigate, useLocation } from 'react-router-dom';

import Onboarding from './components/Onboarding';
import Assessment from './components/Assessment';
import PathView from './components/PathView';
import NodeContent from './components/NodeContent';
import Settings from './components/Settings';
import Chat from './components/Chat';
import MainLayout from './components/MainLayout';
import { storageService } from './services/storageService';
import { aiService } from './services/aiService';

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [topic, setTopic] = useState(() => {
    return localStorage.getItem('getpath_current_topic') || '';
  });

  const [backgroundTasks, setBackgroundTasks] = useState(() => {
    try {
      const saved = localStorage.getItem('getpath_background_tasks');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  const [step, setStep] = useState(() => {
    const path = window.location.hash.replace(/^#\//, '') || 'onboarding';
    return path;
  });

  const [assessmentResults, setAssessmentResults] = useState(null);

  const [pathData, setPathData] = useState(() => {
    const savedTopic = localStorage.getItem('getpath_current_topic');
    if (savedTopic) {
      return storageService.getPath(savedTopic) || null;
    }
    return null;
  });

  const [currentNode, setCurrentNode] = useState(() => {
    const nodeId = localStorage.getItem('getpath_current_node_id');
    const savedTopic = localStorage.getItem('getpath_current_topic');
    if (savedTopic && nodeId) {
      const data = storageService.getPath(savedTopic);
      if (data && data.nodes) {
        return data.nodes.find(n => n.id === nodeId) || null;
      }
    }
    return null;
  });

  const [completedNodes, setCompletedNodes] = useState(() => {
    const savedTopic = localStorage.getItem('getpath_current_topic');
    if (savedTopic) {
      try {
        const data = localStorage.getItem(`completed_nodes_${savedTopic.toLowerCase()}`);
        return data ? JSON.parse(data) : [];
      } catch (e) {
        return [];
      }
    }
    return [];
  });

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

  const handleOpenChat = (context, label) => {
    if (context && typeof context === 'string') {
      navigate('/chat', { state: { initialMessage: context, contextLabel: label } });
    } else {
      navigate('/chat');
    }
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme || 'dark');
  }, [settings.theme]);

  const handleStart = (topicName) => {
    setTopic(topicName);
    localStorage.setItem('getpath_current_topic', topicName);
    setPathData(null);
    setCompletedNodes([]);
    localStorage.removeItem(`completed_nodes_${topicName.toLowerCase()}`);
    navigate('/assessment');
  };

  const handleSelectSavedPath = (data) => {
    setTopic(data.topic);
    localStorage.setItem('getpath_current_topic', data.topic);
    setPathData(data);

    try {
      const saved = localStorage.getItem(`completed_nodes_${data.topic.toLowerCase()}`);
      setCompletedNodes(saved ? JSON.parse(saved) : []);
    } catch (e) {
      setCompletedNodes([]);
    }

    navigate('/path');
  };

  const handleAssessmentComplete = (results) => {
    setAssessmentResults(results);
    navigate('/path');
  };

  const handleOpenNode = (node) => {
    setCurrentNode(node);
    localStorage.setItem('getpath_current_node_id', node.id);
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

  const updateNodeFlashcards = (nodeId, flashcards) => {
    if (!pathData) return;
    const updatedNodes = pathData.nodes.map(n => {
      if (n.id === nodeId) {
        return { ...n, flashcards };
      }
      return n;
    });
    setPathData({ ...pathData, nodes: updatedNodes });
    if (currentNode && currentNode.id === nodeId) {
      setCurrentNode({ ...currentNode, flashcards });
    }
  };

  const updateNodeResearchPapers = (nodeId, researchPapers) => {
    if (!pathData) return;
    const updatedNodes = pathData.nodes.map(n => {
      if (n.id === nodeId) {
        return { ...n, researchPapers };
      }
      return n;
    });
    setPathData({ ...pathData, nodes: updatedNodes });
    if (currentNode && currentNode.id === nodeId) {
      setCurrentNode({ ...currentNode, researchPapers });
    }
  };

  const updateNodePracticeProblems = (nodeId, practiceProblems) => {
    if (!pathData) return;
    const updatedNodes = pathData.nodes.map(n => {
      if (n.id === nodeId) {
        return { ...n, practiceProblems };
      }
      return n;
    });
    setPathData({ ...pathData, nodes: updatedNodes });
    if (currentNode && currentNode.id === nodeId) {
      setCurrentNode({ ...currentNode, practiceProblems });
    }
  };

  const updateNodeQuiz = (nodeId, quiz) => {
    if (!pathData) return;
    const updatedNodes = pathData.nodes.map(n => {
      if (n.id === nodeId) {
        return { ...n, quiz };
      }
      return n;
    });
    setPathData({ ...pathData, nodes: updatedNodes });
    if (currentNode && currentNode.id === nodeId) {
      setCurrentNode({ ...currentNode, quiz });
    }
  };

  const triggerGenerationTask = (nodeId, nodeTitle, taskType, contextInfo) => {
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const newTask = {
      id: taskId,
      nodeId,
      nodeTitle,
      taskType,
      status: 'generating',
      timestamp: Date.now(),
      error: null
    };

    setBackgroundTasks(prev => {
      const next = { ...prev, [taskId]: newTask };
      localStorage.setItem('getpath_background_tasks', JSON.stringify(next));
      return next;
    });

    // Run async background task
    (async () => {
      try {
        let result;
        if (taskType === 'flashcards') {
          result = await aiService.generateFlashcards(topic, nodeTitle, contextInfo, settings);
          if (result && result.flashcards) {
            updateNodeFlashcards(nodeId, result.flashcards);
            storageService.updateFlashcards(topic, nodeTitle, result.flashcards);
          } else {
            throw new Error("No flashcards generated.");
          }
        } else if (taskType === 'quiz') {
          result = await aiService.generateQuiz(contextInfo, settings);
          if (result && result.questions) {
            updateNodeQuiz(nodeId, result.questions);
            storageService.updateQuiz(topic, nodeTitle, result.questions);
          } else {
            throw new Error("No quiz questions generated.");
          }
        } else if (taskType === 'papers') {
          result = await aiService.generateResearchPapers(topic, nodeTitle, settings);
          if (result && result.papers) {
            updateNodeResearchPapers(nodeId, result.papers);
            storageService.updateResearchPapers(topic, nodeTitle, result.papers);
          } else {
            throw new Error("No papers generated.");
          }
        } else if (taskType === 'problems') {
          result = await aiService.generatePracticeProblems(topic, nodeTitle, contextInfo, settings);
          if (result && result.problems) {
            updateNodePracticeProblems(nodeId, result.problems);
            storageService.updatePracticeProblems(topic, nodeTitle, result.problems);
          } else {
            throw new Error("No practice problems generated.");
          }
        } else if (taskType === 'resources') {
          result = await aiService.generateResources(topic, nodeTitle, contextInfo, settings);
          if (result && result.resources) {
            updateNodeResources(nodeId, result.resources);
            storageService.updateResources(topic, nodeTitle, result.resources);
          } else {
            throw new Error("No resources generated.");
          }
        }

        // Update task status to completed
        setBackgroundTasks(prev => {
          if (!prev[taskId]) return prev;
          const updated = { ...prev[taskId], status: 'completed' };
          const next = { ...prev, [taskId]: updated };
          localStorage.setItem('getpath_background_tasks', JSON.stringify(next));
          return next;
        });
      } catch (err) {
        console.error("Background task failed:", err);
        setBackgroundTasks(prev => {
          if (!prev[taskId]) return prev;
          const updated = { ...prev[taskId], status: 'failed', error: err.message || String(err) };
          const next = { ...prev, [taskId]: updated };
          localStorage.setItem('getpath_background_tasks', JSON.stringify(next));
          return next;
        });
      }
    })();
  };

  const dismissBackgroundTask = (taskId) => {
    setBackgroundTasks(prev => {
      const next = { ...prev };
      delete next[taskId];
      localStorage.setItem('getpath_background_tasks', JSON.stringify(next));
      return next;
    });
  };

  const handleCompleteNode = (success) => {
    if (success && currentNode) {
      let nextCompleted = completedNodes;
      if (!completedNodes.includes(currentNode.id)) {
        nextCompleted = [...completedNodes, currentNode.id];
        setCompletedNodes(nextCompleted);
      }
      try {
        localStorage.setItem(`completed_nodes_${topic.toLowerCase()}`, JSON.stringify(nextCompleted));
      } catch (e) {
        console.error("Failed to save completed nodes", e);
      }
    }
    navigate('/path');
    setCurrentNode(null);
    localStorage.removeItem('getpath_current_node_id');
  };

  const handleGoHome = () => {
    navigate('/onboarding');
    setTopic('');
    setPathData(null);
    setAssessmentResults(null);
    setCompletedNodes([]);
    localStorage.removeItem('getpath_current_topic');
    localStorage.removeItem('getpath_current_node_id');
  };

  const activeTab = ['path', 'node'].includes(step)
    ? 'path'
    : step === 'chat'
      ? 'chat'
      : step === 'settings'
        ? 'settings'
        : 'dashboard';

  const handleTabSelect = (tabId) => {
    if (tabId === 'dashboard') navigate('/onboarding');
    else if (tabId === 'path') navigate('/path');
    else if (tabId === 'chat') navigate('/chat');
    else if (tabId === 'settings') navigate('/settings');
  };

  const renderContent = () => {
    return (
      <>
        {step === 'onboarding' && (
          <Onboarding
            onStart={handleStart}
            onSelectSavedPath={handleSelectSavedPath}
            onOpenSettings={handleOpenSettings}
            apiKey={settings.provider === 'openrouter' ? settings.openrouterKey : settings.apiKey}
            demoMode={settings.demoMode}
            onSync={refreshSettings}
            theme={settings.theme}
          />
        )}

        {step === 'settings' && (
          <Settings
            onBack={() => navigate(-1)}
            onSync={refreshSettings}
          />
        )}

        {step === 'chat' && (
          <Chat
            onBack={() => navigate(-1)}
            settings={settings}
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
            backgroundTasks={backgroundTasks}
            triggerGenerationTask={triggerGenerationTask}
            dismissBackgroundTask={dismissBackgroundTask}
          />
        )}

        {step === 'node' && currentNode && (
          <NodeContent
            node={currentNode}
            topic={topic}
            settings={settings}
            onBack={() => {
              setCurrentNode(null);
              localStorage.removeItem('getpath_current_node_id');
              navigate('/path');
            }}
            onCompleteNode={handleCompleteNode}
            updateNodeResources={updateNodeResources}
            updateNodeFlashcards={updateNodeFlashcards}
            updateNodeResearchPapers={updateNodeResearchPapers}
            updateNodePracticeProblems={updateNodePracticeProblems}
            updateNodeQuiz={updateNodeQuiz}
            onOpenChat={handleOpenChat}
            onOpenSettings={handleOpenSettings}
            theme={settings.theme}
            backgroundTasks={backgroundTasks}
            triggerGenerationTask={triggerGenerationTask}
            dismissBackgroundTask={dismissBackgroundTask}
          />
        )}
      </>
    );
  };

  return (
    <div className="min-vh-100 transition-theme" style={{ background: 'var(--bg-color)', color: 'var(--text-primary)', transition: 'background-color 0.3s ease, color 0.3s ease' }}>
      {step === 'assessment' ? (
        <Container className="py-4">
          {renderContent()}
        </Container>
      ) : (
        <MainLayout
          currentTab={activeTab}
          onTabSelect={handleTabSelect}
          hasActivePath={!!pathData}
        >
          <Container fluid className="py-2">
            {renderContent()}
          </Container>
        </MainLayout>
      )}
    </div>
  );
}

export default App;
