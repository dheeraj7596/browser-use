import React, { useState, useEffect, useRef } from 'react';
import { Send } from 'lucide-react';

const BrowserAgentUI = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [screenshots, setScreenshots] = useState([]);
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
                      <pre className="whitespace-pre-wrap font-sans">{message.content}</pre>
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

          {/* Screenshots Section */}
          <div className="w-1/2 p-6">
            <div className="bg-white rounded-lg shadow-lg h-full p-6">
              <div className="grid grid-cols-2 grid-rows-2 gap-4 h-full">
                {Array(4).fill(null).map((_, index) => (
                  <div
                    key={index}
                    className="border rounded-lg overflow-hidden bg-gray-100"
                  >
                    {screenshots[index] ? (
                      <img
                        src={`data:image/png;base64,${screenshots[index]}`}
                        alt={`Browser ${index + 1}`}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <span className="text-gray-400">Window {index + 1}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrowserAgentUI;