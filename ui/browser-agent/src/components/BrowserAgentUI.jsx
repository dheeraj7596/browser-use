import React, { useState } from 'react';
import { Send } from 'lucide-react';

const BrowserAgentUI = () => {
  const [input, setInput] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  try {
    const response = await fetch('http://localhost:8000/run-agent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ task: input }),
    });
    const data = await response.json();
    setResponse(data.result);
  } catch (error) {
    setResponse('Error: ' + error.message);
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="min-h-screen bg-orange-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-orange-800">B.AI</h1>
          <p className="text-orange-600 mt-2">Your Intelligent Browser Assistant</p>
        </header>

        {/* Chat Interface */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          {/* Response Area */}
          <div className="min-h-[200px] mb-6 p-4 bg-gray-50 rounded-lg">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
              </div>
            ) : (
              <pre className="whitespace-pre-wrap">{response}</pre>
            )}
          </div>

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter your task here..."
              className="flex-1 p-3 border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2"
            >
              <Send size={20} />
              <span>Send</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BrowserAgentUI;