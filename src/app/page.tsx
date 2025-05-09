'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare, Database, FileText } from 'lucide-react';
import { useState, useTransition } from 'react';
import { generateSQL, executeSQLQuery, getNaturalResponse } from './actions';

export default function Home() {
  const [userInput, setUserInput] = useState('');
  const [sqlQuery, setSqlQuery] = useState('');
  const [dbResponse, setDbResponse] = useState('');
  const [naturalResponse, setNaturalResponse] = useState('');
  const [strategy, setStrategy] = useState<'zero_shot' | 'single_domain_double_shot' | 'cross_domain_few_shot'>('zero_shot');
  const [isPending, startTransition] = useTransition();

  const handleSubmit = () => {
    if (!userInput.trim()) {
      alert('Please enter a query before submitting.');
      return;
    }

    startTransition(async () => {
      try {
        const generatedQuery = await generateSQL(userInput, strategy);
        setSqlQuery(generatedQuery);

        const response = await executeSQLQuery(generatedQuery);
        setDbResponse(response);

        const naturalResponseText = await getNaturalResponse(userInput, response);
        setNaturalResponse(naturalResponseText);
      } catch (error) {
        console.error('Error:', error);
        alert('Failed to generate SQL query.');
      }
    });
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-purple-500">Natural Language SQL Querier</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Step 1: Chat Input */}
          <Card className="p-6 bg-zinc-900 border-purple-500/20 border">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="w-5 h-5 text-purple-500" />
              <h2 className="text-xl font-bold">Natural Language Query</h2>
            </div>
            <select
              value={strategy}
              onChange={(e) => setStrategy(e.target.value as 'zero_shot' | 'single_domain_double_shot' | 'cross_domain_few_shot')}
              className="w-full mb-4 p-2 bg-zinc-800 border border-purple-500/20 text-white rounded"
            >
              <option value="zero_shot">Zero Shot</option>
              <option value="single_domain_double_shot">Single Domain Double Shot</option>
              <option value="cross_domain_few_shot">Cross-domain Few-shot</option>
            </select>
            <Textarea
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Ask your question here..."
              className="min-h-[120px] bg-zinc-800 border-purple-500/20 mb-4"
            />
            <Button
              onClick={handleSubmit}
              className="w-full bg-purple-500 hover:bg-purple-600"
              disabled={isPending}
            >
              {isPending ? 'Generating...' : 'Generate SQL Query'}
            </Button>
          </Card>

          {/* Step 2: SQL Query */}
          <Card className="p-6 bg-zinc-900 border-purple-500/20 border">
            <div className="flex items-center gap-2 mb-4">
              <Database className="w-5 h-5 text-purple-500" />
              <h2 className="text-xl font-bold">Generated SQL Query</h2>
            </div>
            <div className="bg-zinc-800 rounded-lg p-4 min-h-[120px] font-mono text-sm">
              {sqlQuery || 'SQL query will appear here...'}
            </div>
          </Card>

          {/* Step 3: Database Response */}
          <Card className="p-6 bg-zinc-900 border-purple-500/20 border">
            <div className="flex items-center gap-2 mb-4">
              <Database className="w-5 h-5 text-green-500" />
              <h2 className="text-xl font-bold">Database Response</h2>
            </div>
            <div className="bg-zinc-800 rounded-lg p-4 min-h-[120px] font-mono text-sm">
              {dbResponse || 'Database response will appear here...'}
            </div>
          </Card>

          {/* Step 4: Natural Language Response */}
          <Card className="p-6 bg-zinc-900 border-purple-500/20 border">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-blue-500" />
              <h2 className="text-xl font-bold">Natural Language Response</h2>
            </div>
            <div className="bg-zinc-800 rounded-lg p-4 min-h-[120px]">
              {naturalResponse || 'Natural language response will appear here...'}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}