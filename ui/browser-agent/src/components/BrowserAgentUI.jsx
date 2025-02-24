import React, { useState, useEffect, useRef } from 'react';
import { Send, ChevronLeft, ChevronRight } from 'lucide-react';

// Helper function for robust URL detection and linking
const linkify = (text) => {
  if (!text || typeof text !== 'string') return text;

  // Create an array to hold all the segments (text and links)
  const segments = [];
  let currentPosition = 0;
  const textLength = text.length;

  // Define a regex for URL detection
  // This handles URLs with or without http/https, with or without www
  // Also handles URLs inside markdown links and parentheses
  const urlRegex = /\bhttps?:\/\/[-A-Za-z0-9+&@#/%?=~_|!:,.;]*[-A-Za-z0-9+&@#/%=~_|]/g;

  // Find all matches
  let match;
  while ((match = urlRegex.exec(text)) !== null) {
    const matchStart = match.index;
    const matchEnd = matchStart + match[0].length;

    // Add text before the URL
    if (matchStart > currentPosition) {
      segments.push({
        type: 'text',
        content: text.substring(currentPosition, matchStart)
      });
    }

    // Add the URL as a link
    segments.push({
      type: 'link',
      url: match[0],
      content: match[0]
    });

    // Update position
    currentPosition = matchEnd;
  }

  // Add any remaining text after the last URL
  if (currentPosition < textLength) {
    segments.push({
      type: 'text',
      content: text.substring(currentPosition)
    });
  }

  // Convert segments to React elements
  return segments.map((segment, index) => {
    if (segment.type === 'text') {
      return <span key={`text-${index}`}>{segment.content}</span>;
    } else {
      return (
        <a
          key={`link-${index}`}
          href={segment.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline break-all"
        >
          {segment.content}
        </a>
      );
    }
  });
};

const BrowserAgentUI = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [screenshots, setScreenshots] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const wsRef = useRef(null);
  const chatContainerRef = useRef(null);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8000/ws');
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket Connected');
    };

    ws.onmessage = (event) => {
      console.log('Received message:', event.data);
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'screenshot') {
          setScreenshots(prev => {
            const newScreenshots = [...prev];
            newScreenshots[data.window_index] = data.screenshot;
            return newScreenshots;
          });
        }
      } catch (error) {
        console.error('Error processing message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
    };
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input;
    setInput('');
    setScreenshots([]);
    setActiveTab(0);
    setMessages(prev => [...prev, { type: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:8000/run-agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ task: userMessage }),
      });
      const data = await response.json();
      setMessages(prev => [...prev, { type: 'assistant', content: data.result || data.error }]);
    } catch (error) {
      setMessages(prev => [...prev, { type: 'assistant', content: 'Error: ' + error.message }]);
    } finally {
      setIsLoading(false);
    }
  };

  const goToNextTab = () => {
    if (activeTab < screenshots.length - 1) {
      setActiveTab(activeTab + 1);
    }
  };

  const goToPrevTab = () => {
    if (activeTab > 0) {
      setActiveTab(activeTab - 1);
    }
  };

  // Filter out undefined screenshots and get the length
  const validScreenshots = screenshots.filter(Boolean);
  const windowCount = validScreenshots.length;

  return (
    <div className="fixed inset-0 bg-orange-50">
      <header className="absolute top-0 left-0 right-0 text-center py-4 bg-white shadow-sm">
        <h1 className="text-4xl font-bold text-orange-800">B.AI</h1>
      </header>

      <div className="absolute inset-0 pt-16">
        <div className="flex h-full">
          {/* Chat Section */}
          <div className="w-1/2 p-6">
            <div className="bg-white rounded-lg shadow-lg h-full p-6 flex flex-col">
              <div
                ref={chatContainerRef}
                className="flex-1 overflow-auto mb-4 space-y-4"
              >
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        message.type === 'user' 
                          ? 'bg-orange-600 text-white' 
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {message.type === 'user' ? (
                        <pre className="whitespace-pre-wrap font-sans">{message.content}</pre>
                      ) : (
                        <div className="whitespace-pre-wrap font-sans">
                          {linkify(message.content)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-lg p-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Enter your task here..."
                  className="flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
                >
                  <Send size={20} />
                </button>
              </form>
            </div>
          </div>

          {/* Screenshots Section with Tabs */}
          <div className="w-1/2 p-6">
            <div className="bg-white rounded-lg shadow-lg h-full p-6 flex flex-col">
              {/* Tab Navigation */}
              {windowCount > 0 && (
                <div className="flex justify-between items-center mb-4">
                  <button
                    onClick={goToPrevTab}
                    disabled={activeTab === 0}
                    className="p-2 rounded-full bg-orange-100 text-orange-800 hover:bg-orange-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <div className="text-lg font-medium">
                    Window {activeTab + 1} of {windowCount}
                  </div>
                  <button
                    onClick={goToNextTab}
                    disabled={activeTab >= windowCount - 1}
                    className="p-2 rounded-full bg-orange-100 text-orange-800 hover:bg-orange-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight size={24} />
                  </button>
                </div>
              )}

              {/* Tab Content */}
              <div className="flex-1 border rounded-lg bg-gray-100 overflow-hidden">
                {windowCount > 0 && activeTab < windowCount ? (
                  <img
                    src={`data:image/png;base64,${validScreenshots[activeTab]}`}
                    alt={`Browser ${activeTab + 1}`}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-gray-400">
                      {isLoading ? "Loading browser windows..." : "No browser windows available"}
                    </span>
                  </div>
                )}
              </div>

              {/* Tab Indicators - Only show if we have multiple windows */}
              {windowCount > 1 && (
                <div className="flex justify-center space-x-2 mt-4">
                  {validScreenshots.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveTab(index)}
                      className={`w-3 h-3 rounded-full ${activeTab === index ? 'bg-orange-600' : 'bg-orange-300'}`}
                      aria-label={`View window ${index + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrowserAgentUI;