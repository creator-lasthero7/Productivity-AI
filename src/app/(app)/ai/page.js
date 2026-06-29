'use client';

import { useState, useEffect, useRef } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import { useApp } from '@/context/AppContext';
import styles from './ai.module.css';

export default function AIPage() {
  const { tasks, habits, addTask, addHabit, toggleTask, preferences } = useApp();
  
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'assistant',
      content: "Hello! I am your Productivity AI Assistant. ⚡\nI have read/write access to your tasks, habits, and calendar. You can speak or type commands like:\n\n• \"*Add high priority task Finish hackathon project tomorrow*\"\n• \"*Create habit Meditate daily*\"\n• \"*Complete task Finish PRD*\"\n\nHow can I help you optimize your day?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState(null);
  const recognitionRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Setup speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        setSpeechSupported(true);
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
          setIsRecording(true);
        };

        recognition.onresult = (event) => {
          const speechToText = event.results[0][0].transcript;
          setInputVal(speechToText);
          handleProcessCommand(speechToText);
        };

        recognition.onerror = (event) => {
          console.error('Speech recognition error', event);
          setIsRecording(false);
        };

        recognition.onend = () => {
          setIsRecording(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  const toggleMic = () => {
    if (!speechSupported) {
      alert('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  // Speak a specific message on demand
  const handleSpeak = (msgId, text) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    // If already speaking this message, stop it
    if (speakingMsgId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
      return;
    }

    // Stop any ongoing speech
    window.speechSynthesis.cancel();

    const cleanText = text.replace(/\*\*/g, '').replace(/\*/g, '').replace(/<[^>]*>/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    utterance.onstart = () => setSpeakingMsgId(msgId);
    utterance.onend = () => setSpeakingMsgId(null);
    utterance.onerror = () => setSpeakingMsgId(null);

    window.speechSynthesis.speak(utterance);
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputVal.trim()) return;
    handleProcessCommand(inputVal.trim());
    setInputVal('');
  };

  // Natural Language Command Parser
  const handleProcessCommand = async (commandText) => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Append User Message
    const userMsg = {
      id: Date.now(),
      role: 'user',
      content: commandText,
      timestamp
    };
    
    setMessages((prev) => [...prev, userMsg]);

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: commandText, tasks, habits })
      });
      
      if (!res.ok) throw new Error('API request failed');
      
      const { reply, action } = await res.json();
      let actionTaken = false;

      // Handle parsed AI action operations
      if (action && action.type !== 'NONE') {
        if (action.type === 'CREATE_TASK' && action.payload?.title) {
          addTask({
            title: action.payload.title,
            priority: action.payload.priority || 'MEDIUM',
            category: action.payload.category || 'Work',
            dueDate: action.payload.dueDate || new Date().toISOString().split('T')[0],
            dueTime: action.payload.dueTime || '12:00 PM',
            marker: { type: 'EMOJI', value: action.payload.emoji || '📝' },
            subtasks: []
          });
          actionTaken = true;
        } else if (action.type === 'CREATE_HABIT' && action.payload?.name) {
          addHabit({
            name: action.payload.name,
            emoji: action.payload.emoji || '🔥',
            target: 7
          });
          actionTaken = true;
        } else if (action.type === 'COMPLETE_TASK' && action.payload?.id) {
          toggleTask(Number(action.payload.id));
          actionTaken = true;
        }
      }

      const assistantMsg = {
        id: Date.now() + 1,
        role: 'assistant',
        content: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actionTaken
      };

      setMessages((prev) => [...prev, assistantMsg]);

      // If Voice Feedback is enabled in settings, auto-speak the response
      if (preferences.voiceConfirmations) {
        // Need to wait slightly for state to update so button UI syncs
        setTimeout(() => handleSpeak(assistantMsg.id, reply), 100);
      }
    } catch (err) {
      console.error('Failed to get response from AI assistant:', err);
      
      const assistantMsg = {
        id: Date.now() + 1,
        role: 'assistant',
        content: "⚠️ I encountered an error connecting to the AI brain. Please verify that the local dev server is running properly.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actionTaken: false
      };
      
      setMessages((prev) => [...prev, assistantMsg]);
    }
  };

  return (
    <>
      <PageHeader title="AI Productivity Assistant" />

      <div className={`page-content ${styles.aiPage}`}>
        <div className={`glass-card ${styles.chatContainer} page-enter`}>
          {/* Chat Messages */}
          <div className={styles.messagesList}>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`${styles.messageWrapper} ${
                  msg.role === 'user' ? styles.userWrapper : styles.assistantWrapper
                }`}
              >
                {msg.role === 'assistant' && (
                  <div className={styles.avatar}>✨</div>
                )}
                <div
                  className={`${styles.bubble} ${
                    msg.role === 'user' ? styles.userBubble : styles.assistantBubble
                  } ${msg.actionTaken ? styles.actionBubble : ''}`}
                >
                  <div
                    className={styles.msgContent}
                    dangerouslySetInnerHTML={{
                      __html: msg.content
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        .replace(/\*(.*?)\*/g, '<em>$1</em>')
                        .replace(/\n/g, '<br />')
                    }}
                  />
                  <div className={styles.bubbleFooter}>
                    <div className={styles.timestamp}>{msg.timestamp}</div>
                    {msg.role === 'assistant' && (
                      <button
                        className={`${styles.speakBtn} ${speakingMsgId === msg.id ? styles.speakBtnActive : ''}`}
                        onClick={() => handleSpeak(msg.id, msg.content)}
                        title={speakingMsgId === msg.id ? 'Stop speaking' : 'Listen to response'}
                        aria-label={speakingMsgId === msg.id ? 'Stop speaking' : 'Listen to response'}
                      >
                        {speakingMsgId === msg.id ? '🔇' : '🔊'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Typing Wave / Recording Indicator */}
          {isRecording && (
            <div className={styles.recordingWaves}>
              <div className={styles.wave} />
              <div className={styles.wave} />
              <div className={styles.wave} />
              <div className={styles.wave} />
              <span>AI is listening to your voice... Speak now!</span>
            </div>
          )}

          {/* Input Panel */}
          <form onSubmit={handleSend} className={styles.inputForm}>
            <button
              type="button"
              onClick={toggleMic}
              className={`${styles.micBtn} ${isRecording ? styles.micActive : ''}`}
              title={speechSupported ? 'Record Voice Command' : 'Voice not supported'}
            >
              🎤
            </button>
            <input
              type="text"
              placeholder="Ask AI or command: 'Add task finish homework tomorrow'..."
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              className={styles.chatInput}
              disabled={isRecording}
            />
            <button type="submit" className="btn btn-primary" disabled={!inputVal.trim()}>
              Send ⚡
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
