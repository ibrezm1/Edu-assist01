import React, { useState, useEffect, useRef } from 'react';
import { Container } from 'react-bootstrap';
import { useNavigate, useLocation } from 'react-router-dom';

import Onboarding from './components/Onboarding';
import Assessment from './components/Assessment';
import PathView from './components/PathView';
import NodeContent from './components/NodeContent';
import Settings from './components/Settings';
import Chat from './components/Chat';
import MainLayout from './components/MainLayout';
import ActiveTasksPanel from './components/ActiveTasksPanel';
import { storageService } from './services/storageService';
import { aiService } from './services/aiService';

function App() {
  const navigate = useNavigate();
  const abortControllersRef = useRef({});
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

  const [chatHistory, setChatHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('getpath_chat_history');
      return saved ? JSON.parse(saved) : [
        { role: 'assistant', content: 'Hello! I am your personal Course Craft AI. How can I help you with your learning journey today?' }
      ];
    } catch (e) {
      return [
        { role: 'assistant', content: 'Hello! I am your personal Course Craft AI. How can I help you with your learning journey today?' }
      ];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('getpath_chat_history', JSON.stringify(chatHistory));
    } catch (e) {
      console.error('Failed to save chat history:', e);
    }
  }, [chatHistory]);

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

  // Swipe right from left edge to go back on mobile devices
  useEffect(() => {
    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;

    const handleTouchStart = (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchMove = (e) => {
      touchEndX = e.touches[0].clientX;
      touchEndY = e.touches[0].clientY;
    };

    const handleTouchEnd = () => {
      const diffX = touchEndX - touchStartX;
      const diffY = touchEndY - touchStartY;

      // Start within 45px of the left edge and swipe right by more than 80px
      const isEdgeSwipe = touchStartX > 0 && touchStartX < 45;
      
      // Ensure the swipe is mostly horizontal
      const isHorizontal = diffX > 80 && Math.abs(diffY) < 50;

      // Don't exit the app if we are at root paths
      const path = window.location.pathname;
      const isRootPath = path === '/' || path === '/onboarding' || path.endsWith('/Edu-assist01') || path.endsWith('/Edu-assist01/');

      if (isEdgeSwipe && isHorizontal && !isRootPath) {
        navigate(-1);
      }

      // Reset coordinates
      touchStartX = 0;
      touchStartY = 0;
      touchEndX = 0;
      touchEndY = 0;
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [navigate]);

  const handleStart = (topicName) => {
    setTopic(topicName);
    localStorage.setItem('getpath_current_topic', topicName);
    setPathData(null);
    setCompletedNodes([]);
    localStorage.removeItem(`completed_nodes_${topicName.toLowerCase()}`);
    localStorage.removeItem(`getpath_assessment_questions_${topicName.toLowerCase()}`);
    localStorage.removeItem(`getpath_assessment_results_${topicName.toLowerCase()}`);
    
    if (storageService.savePath) {
      storageService.savePath(topicName, null);
    }
    
    triggerGenerationTask(null, topicName, 'assessment', topicName);
    navigate('/assessment');
  };

  const handleSelectSavedPath = (data) => {
    setTopic(data.topic);
    localStorage.setItem('getpath_current_topic', data.topic);
    setPathData(data);

    try {
      const saved = localStorage.getItem(`completed_nodes_${data.topic.toLowerCase()}`);
      const listFromStorage = saved ? JSON.parse(saved) : [];
      const completedFromNodes = (data.nodes || []).filter(n => n.completed).map(n => n.id);
      const combined = Array.from(new Set([...listFromStorage, ...completedFromNodes]));
      setCompletedNodes(combined);
    } catch (e) {
      setCompletedNodes([]);
    }

    navigate('/path');
  };

  const handleAssessmentComplete = (results) => {
    setAssessmentResults(results);
    localStorage.setItem(`getpath_assessment_results_${topic.toLowerCase()}`, JSON.stringify(results));
    
    triggerGenerationTask(null, topic, 'path', JSON.stringify(results));
    navigate('/path');
  };

  const handleOpenAssessment = (topicName) => {
    setTopic(topicName);
    localStorage.setItem('getpath_current_topic', topicName);
    navigate('/assessment');
  };

  const handleOpenPath = (topicName) => {
    setTopic(topicName);
    localStorage.setItem('getpath_current_topic', topicName);
    
    // Load pathData if it is already saved in storage
    const savedPlan = storageService.getPath(topicName);
    if (savedPlan) {
      setPathData(savedPlan);
    } else {
      setPathData(null);
    }
    
    navigate('/path');
  };

  const handleOpenNode = (node) => {
    setCurrentNode(node);
    localStorage.setItem('getpath_current_node_id', node.id);
    navigate('/node');
  };

  const updateNodeResources = (nodeId, resources) => {
    setPathData(prev => {
      if (!prev) return prev;
      const updatedNodes = prev.nodes.map(n => {
        if (n.id === nodeId) {
          return { ...n, resources };
        }
        return n;
      });
      return { ...prev, nodes: updatedNodes };
    });
    setCurrentNode(prev => (prev && prev.id === nodeId) ? { ...prev, resources } : prev);
  };

  const updateNodeFlashcards = (nodeId, flashcards) => {
    setPathData(prev => {
      if (!prev) return prev;
      const updatedNodes = prev.nodes.map(n => {
        if (n.id === nodeId) {
          return { ...n, flashcards };
        }
        return n;
      });
      return { ...prev, nodes: updatedNodes };
    });
    setCurrentNode(prev => (prev && prev.id === nodeId) ? { ...prev, flashcards } : prev);
  };

  const updateNodeResearchPapers = (nodeId, researchPapers) => {
    setPathData(prev => {
      if (!prev) return prev;
      const updatedNodes = prev.nodes.map(n => {
        if (n.id === nodeId) {
          return { ...n, researchPapers };
        }
        return n;
      });
      return { ...prev, nodes: updatedNodes };
    });
    setCurrentNode(prev => (prev && prev.id === nodeId) ? { ...prev, researchPapers } : prev);
  };

  const updateNodePracticeProblems = (nodeId, practiceProblems) => {
    setPathData(prev => {
      if (!prev) return prev;
      const updatedNodes = prev.nodes.map(n => {
        if (n.id === nodeId) {
          return { ...n, practiceProblems };
        }
        return n;
      });
      return { ...prev, nodes: updatedNodes };
    });
    setCurrentNode(prev => (prev && prev.id === nodeId) ? { ...prev, practiceProblems } : prev);
  };

  const updateNodeQuiz = (nodeId, quiz) => {
    setPathData(prev => {
      if (!prev) return prev;
      const updatedNodes = prev.nodes.map(n => {
        if (n.id === nodeId) {
          return { ...n, quiz };
        }
        return n;
      });
      return { ...prev, nodes: updatedNodes };
    });
    setCurrentNode(prev => (prev && prev.id === nodeId) ? { ...prev, quiz } : prev);
  };

  const updateNodeBooks = (nodeId, books) => {
    setPathData(prev => {
      if (!prev) return prev;
      const updatedNodes = prev.nodes.map(n => {
        if (n.id === nodeId) {
          return { ...n, books };
        }
        return n;
      });
      return { ...prev, nodes: updatedNodes };
    });
    setCurrentNode(prev => (prev && prev.id === nodeId) ? { ...prev, books } : prev);
  };

  const triggerGenerationTask = (nodeId, nodeTitle, taskType, contextInfo) => {
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const controller = new AbortController();
    abortControllersRef.current[taskId] = controller;

    const newTask = {
      id: taskId,
      nodeId,
      nodeTitle,
      taskType,
      status: 'generating',
      timestamp: Date.now(),
      error: null,
      contextInfo
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
        if (taskType === 'chat') {
          const messagesForAI = JSON.parse(contextInfo);
          result = await aiService.chat(messagesForAI, settings);
          if (controller.signal.aborted) return;
          if (result) {
            const currentHistoryRaw = localStorage.getItem('getpath_chat_history');
            let currentHistory = currentHistoryRaw ? JSON.parse(currentHistoryRaw) : [];
            currentHistory = [...currentHistory, { role: 'assistant', content: result }];
            localStorage.setItem('getpath_chat_history', JSON.stringify(currentHistory));
            setChatHistory(currentHistory);
          } else {
            throw new Error("Empty response received from assistant.");
          }
        } else if (taskType === 'more-flashcards') {
          const currentNode = pathData?.nodes?.find(n => n.id === nodeId);
          const currentCards = currentNode?.flashcards || [];
          const existingFronts = currentCards.map(fc => fc.front).join(", ");
          const descriptionOverride = `${contextInfo}\n\nNote: Please generate exactly 3 NEW study flashcards that are different from these existing cards: ${existingFronts}`;
          
          result = await aiService.generateFlashcards(topic, nodeTitle, descriptionOverride, settings);
          if (controller.signal.aborted) return;
          if (result && result.flashcards) {
            const latestNode = storageService.getPath(topic)?.nodes?.find(n => n.id === nodeId);
            const latestCards = latestNode?.flashcards || [];
            
            const maxId = latestCards.reduce((max, fc) => {
              const parsed = parseInt(fc.id);
              return isNaN(parsed) ? max : Math.max(max, parsed);
            }, 0);
            
            const newCards = result.flashcards.slice(0, 3).map((fc, index) => {
              const newId = maxId + index + 1;
              return { ...fc, id: newId };
            });
            const updatedCards = [...latestCards, ...newCards];
            updateNodeFlashcards(nodeId, updatedCards);
            storageService.updateFlashcards(topic, nodeTitle, updatedCards);
            
            if (localStorage.getItem('getpath_current_node_id') === nodeId) {
              const newIndex = latestCards.length;
              localStorage.setItem(`getpath_current_card_index_${nodeId}`, String(newIndex));
            }
          } else {
            throw new Error("No additional flashcards generated.");
          }
        } else if (taskType === 'more-quiz') {
          const currentNode = pathData?.nodes?.find(n => n.id === nodeId);
          const currentQuestions = currentNode?.quiz || [];
          const existingTitles = currentQuestions.map(q => q.text).join(", ");
          const context = `${nodeTitle}: ${contextInfo}\n\nNote: Please generate 3 NEW unique questions. Do NOT generate questions similar to these existing ones: ${existingTitles}`;
          
          result = await aiService.generateQuiz(context, { ...settings, quizQuestions: 3 });
          if (controller.signal.aborted) return;
          if (result && result.questions) {
            const latestNode = storageService.getPath(topic)?.nodes?.find(n => n.id === nodeId);
            const latestQuestions = latestNode?.quiz || [];
            
            const maxId = latestQuestions.reduce((max, q) => {
              const parsed = parseInt(q.id);
              return isNaN(parsed) ? max : Math.max(max, parsed);
            }, 0);
            
            const newQuestions = result.questions.map((q, index) => {
              const newId = maxId + index + 1;
              return { ...q, id: newId };
            });
            const updatedQuestions = [...latestQuestions, ...newQuestions];
            updateNodeQuiz(nodeId, updatedQuestions);
            storageService.updateQuiz(topic, nodeTitle, updatedQuestions);
            
            if (localStorage.getItem('getpath_current_node_id') === nodeId) {
              localStorage.setItem(`getpath_current_quiz_index_${nodeId}`, String(latestQuestions.length));
              localStorage.setItem(`getpath_quiz_score_${nodeId}`, 'null');
            }
          } else {
            throw new Error("No additional quiz questions generated.");
          }
        } else if (taskType === 'flashcards') {
          result = await aiService.generateFlashcards(topic, nodeTitle, contextInfo, settings);
          if (controller.signal.aborted) return;
          if (result && result.flashcards) {
            updateNodeFlashcards(nodeId, result.flashcards);
            storageService.updateFlashcards(topic, nodeTitle, result.flashcards);
          } else {
            throw new Error("No flashcards generated.");
          }
        } else if (taskType === 'quiz') {
          const currentNode = pathData?.nodes?.find(n => n.id === nodeId);
          const currentQuestions = currentNode?.quiz || [];
          let context = contextInfo;
          if (currentQuestions.length > 0) {
            const existingTitles = currentQuestions.map(q => q.text).join(", ");
            context = `${nodeTitle}: ${contextInfo}\n\nNote: Please generate 3 NEW unique questions. Do NOT generate questions similar to these existing ones: ${existingTitles}`;
          }

          result = await aiService.generateQuiz(context, settings);
          if (controller.signal.aborted) return;
          if (result && result.questions) {
            const latestNode = storageService.getPath(topic)?.nodes?.find(n => n.id === nodeId);
            const latestQuestions = latestNode?.quiz || [];
            
            const maxId = latestQuestions.reduce((max, q) => {
              const parsed = parseInt(q.id);
              return isNaN(parsed) ? max : Math.max(max, parsed);
            }, 0);
            const newQuestions = result.questions.map((q, index) => {
              const newId = maxId + index + 1;
              return { ...q, id: newId };
            });
            const updatedQuestions = [...latestQuestions, ...newQuestions];
            updateNodeQuiz(nodeId, updatedQuestions);
            storageService.updateQuiz(topic, nodeTitle, updatedQuestions);
            
            if (localStorage.getItem('getpath_current_node_id') === nodeId && latestQuestions.length > 0) {
              localStorage.setItem(`getpath_current_quiz_index_${nodeId}`, String(latestQuestions.length));
              localStorage.setItem(`getpath_quiz_score_${nodeId}`, 'null');
            }
          } else {
            throw new Error("No quiz questions generated.");
          }
        } else if (taskType === 'assessment') {
          result = await aiService.generateAssessment(nodeTitle, settings);
          if (controller.signal.aborted) return;
          if (result && result.questions) {
            localStorage.setItem('getpath_assessment_questions_' + nodeTitle.toLowerCase(), JSON.stringify(result.questions));
          } else {
            throw new Error("No assessment questions generated.");
          }
        } else if (taskType === 'path') {
          const assessmentResults = JSON.parse(contextInfo);
          result = await aiService.generatePath(nodeTitle, assessmentResults, settings);
          if (controller.signal.aborted) return;
          if (result) {
            setPathData(result);
            storageService.savePath(nodeTitle, result);
          } else {
            throw new Error("No learning path generated.");
          }
        } else if (taskType === 'refine') {
          const { currentNodes, feedback } = JSON.parse(contextInfo);
          result = await aiService.refinePath(nodeTitle, currentNodes, feedback, settings);
          if (controller.signal.aborted) return;
          if (result && result.nodes) {
            const newNodes = result.nodes;
            const oldNodesMap = new Map(currentNodes.map(n => [n.id, n]));
            const changes = {}; // map of node.id -> 'added' | 'modified'
            newNodes.forEach(n => {
              if (!oldNodesMap.has(n.id)) {
                changes[n.id] = 'added';
              } else {
                const old = oldNodesMap.get(n.id);
                if (old.title !== n.title || old.description !== n.description) {
                  changes[n.id] = 'modified';
                }
              }
            });

            setPathData(prev => {
              if (prev && prev.topic.toLowerCase() === nodeTitle.toLowerCase()) {
                if (window.getpath_setHighlightedIds) {
                  window.getpath_setHighlightedIds(changes);
                  setTimeout(() => {
                    if (window.getpath_setHighlightedIds) {
                      window.getpath_setHighlightedIds({});
                    }
                  }, 15000);
                }
                return { ...prev, nodes: newNodes };
              }
              return prev;
            });

            const currentSaved = storageService.getPath(nodeTitle) || {};
            storageService.savePath(nodeTitle, { ...currentSaved, nodes: newNodes });
          } else {
            throw new Error("Failed to customize learning path.");
          }
        } else if (taskType === 'papers') {
          result = await aiService.generateResearchPapers(topic, nodeTitle, settings);
          if (controller.signal.aborted) return;
          if (result && result.papers) {
            updateNodeResearchPapers(nodeId, result.papers);
            storageService.updateResearchPapers(topic, nodeTitle, result.papers);
          } else {
            throw new Error("No papers generated.");
          }
        } else if (taskType === 'books') {
          result = await aiService.generateBooks(topic, nodeTitle, settings);
          if (controller.signal.aborted) return;
          if (result && result.books) {
            updateNodeBooks(nodeId, result.books);
            storageService.updateBooks(topic, nodeTitle, result.books);
          } else {
            throw new Error("No books generated.");
          }
        } else if (taskType === 'problems') {
          result = await aiService.generatePracticeProblems(topic, nodeTitle, contextInfo, settings);
          if (controller.signal.aborted) return;
          if (result && result.problems) {
            updateNodePracticeProblems(nodeId, result.problems);
            storageService.updatePracticeProblems(topic, nodeTitle, result.problems);
          } else {
            throw new Error("No practice problems generated.");
          }
        } else if (taskType === 'resources') {
          result = await aiService.generateResources(topic, nodeTitle, contextInfo, settings);
          if (controller.signal.aborted) return;
          if (result && result.resources) {
            updateNodeResources(nodeId, result.resources);
            storageService.updateResources(topic, nodeTitle, result.resources);
          } else {
            throw new Error("No resources generated.");
          }
        }

        if (controller.signal.aborted) return;

        // Update task status to completed
        setBackgroundTasks(prev => {
          if (!prev[taskId]) return prev;
          if (prev[taskId].status !== 'generating') return prev;
          const duration = Math.round((Date.now() - prev[taskId].timestamp) / 1000);
          const updated = { ...prev[taskId], status: 'completed', duration };
          const next = { ...prev, [taskId]: updated };
          localStorage.setItem('getpath_background_tasks', JSON.stringify(next));
          return next;
        });
      } catch (err) {
        if (controller.signal.aborted) return;
        console.error("Background task failed:", err);
        setBackgroundTasks(prev => {
          if (!prev[taskId]) return prev;
          if (prev[taskId].status !== 'generating') return prev;
          const duration = Math.round((Date.now() - prev[taskId].timestamp) / 1000);
          const updated = { ...prev[taskId], status: 'failed', duration, error: err.message || String(err) };
          const next = { ...prev, [taskId]: updated };
          localStorage.setItem('getpath_background_tasks', JSON.stringify(next));
          return next;
        });
      } finally {
        delete abortControllersRef.current[taskId];
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

  const killBackgroundTask = (taskId) => {
    if (abortControllersRef.current[taskId]) {
      abortControllersRef.current[taskId].abort();
      delete abortControllersRef.current[taskId];
    }
    setBackgroundTasks(prev => {
      if (!prev[taskId]) return prev;
      const duration = Math.round((Date.now() - prev[taskId].timestamp) / 1000);
      const updated = { ...prev[taskId], status: 'failed', duration, error: 'Killed by user' };
      const next = { ...prev, [taskId]: updated };
      localStorage.setItem('getpath_background_tasks', JSON.stringify(next));
      return next;
    });
  };

  const dismissAllTasks = () => {
    Object.keys(abortControllersRef.current).forEach(taskId => {
      if (abortControllersRef.current[taskId]) {
        abortControllersRef.current[taskId].abort();
        delete abortControllersRef.current[taskId];
      }
    });
    setBackgroundTasks({});
    localStorage.removeItem('getpath_background_tasks');
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
        storageService.updateNodeCompletion(topic, currentNode.id, true);
        setPathData(prev => {
          if (!prev || !prev.nodes) return prev;
          const updatedNodes = prev.nodes.map(n => {
            if (n.id === currentNode.id) {
              return { ...n, completed: true, completedAt: Date.now() };
            }
            return n;
          });
          return { ...prev, nodes: updatedNodes };
        });
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
          <div className="d-flex flex-column gap-4">
            <Onboarding
              onStart={handleStart}
              onSelectSavedPath={handleSelectSavedPath}
              onOpenSettings={handleOpenSettings}
              apiKey={settings.provider === 'openrouter' ? settings.openrouterKey : settings.apiKey}
              demoMode={settings.demoMode}
              onSync={refreshSettings}
              theme={settings.theme}
              backgroundTasks={backgroundTasks}
            />
            <ActiveTasksPanel
              backgroundTasks={backgroundTasks}
              dismissBackgroundTask={dismissBackgroundTask}
              killBackgroundTask={killBackgroundTask}
              triggerGenerationTask={triggerGenerationTask}
              onOpenAssessment={handleOpenAssessment}
              onOpenPath={handleOpenPath}
              onOpenChat={handleOpenChat}
              onOpenNode={handleOpenNode}
              pathData={pathData}
              dismissAllTasks={dismissAllTasks}
            />
          </div>
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
            chatHistory={chatHistory}
            setChatHistory={setChatHistory}
            backgroundTasks={backgroundTasks}
            triggerGenerationTask={triggerGenerationTask}
            dismissBackgroundTask={dismissBackgroundTask}
          />
        )}

        {step === 'assessment' && (
          <Assessment
            topic={topic}
            settings={settings}
            onComplete={handleAssessmentComplete}
            onCancel={handleGoHome}
            theme={settings.theme}
            backgroundTasks={backgroundTasks}
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
            killBackgroundTask={killBackgroundTask}
            onOpenAssessment={handleOpenAssessment}
            onOpenPath={handleOpenPath}
            dismissAllTasks={dismissAllTasks}
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
            updateNodeBooks={updateNodeBooks}
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
