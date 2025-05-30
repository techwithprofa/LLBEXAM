'use client';

import React, { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { toast } from 'react-hot-toast';

interface GameQuestion {
  id: number;
  question: string;
  options: string[];
  correct: number;
  hint: string;
  solution: string;
}

interface GameMetadata {
  category: string;
  difficulty: string;
  totalQuestions: number;
  timePerQuestion: number;
  evaluationCriteria: {
    accuracy: number;
    logicalThinking: number;
    timeManagement: number;
    creativity: number;
  };
  instructions: string;
}

interface GameData {
  [key: string]: GameQuestion[] | GameMetadata;
}

interface GameDataItem {
  main_subject: string;
  main_subj_context: {
    sub_subject: string;
  };
}

export default function AddGame() {
  const [mainSubject, setMainSubject] = useState('');
  const [subSubject, setSubSubject] = useState('');
  const [gameName, setGameName] = useState('');
  const [jsonText, setJsonText] = useState('');
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [mainSubjects, setMainSubjects] = useState<string[]>([]);
  const [subSubjects, setSubSubjects] = useState<string[]>([]);
  const [isNewMainSubject, setIsNewMainSubject] = useState(false);
  const [isNewSubSubject, setIsNewSubSubject] = useState(false);
  const [newMainSubject, setNewMainSubject] = useState('');
  const [newSubSubject, setNewSubSubject] = useState('');

  const generateGameId = () => {
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    return `game_${timestamp}_${randomStr}`;
  };

  const generateId = () => {
    return Math.random().toString(36).substr(2, 9);
  };

  const loadSubjects = async () => {
    try {
      const response = await fetch('/api/subjects');
      const data = await response.json();
      
      if (!data.main_subjects) {
        setMainSubjects([]);
        setSubSubjects([]);
        return;
      }
      
      // Extract unique main subjects
      const uniqueMainSubjects = Array.from(new Set(
        data.main_subjects.map((item: GameDataItem) => item.main_subject)
      )) as string[];
      setMainSubjects(uniqueMainSubjects);
      
      // Update sub subjects if main subject is selected
      if (mainSubject) {
        updateSubSubjects(data.main_subjects, mainSubject);
      }
    } catch (error) {
      console.error('Error loading subjects:', error);
      toast.error('Failed to load subjects');
    }
  };

  const updateSubSubjects = (mainSubjects: any[], selectedMainSubject: string) => {
    const matchingMainSubject = mainSubjects.find(
      (item: any) => item.main_subject === selectedMainSubject
    );
    
    if (matchingMainSubject && matchingMainSubject.main_subject_context) {
      const uniqueSubSubjects = Array.from(new Set(
        matchingMainSubject.main_subject_context.map(
          (item: { sub_subject: string }) => item.sub_subject
        )
      )) as string[];
      setSubSubjects(uniqueSubSubjects);
    } else {
      setSubSubjects([]);
    }
  };

  // Load subjects on component mount
  useEffect(() => {
    loadSubjects();
  }, []);

  // Update sub subjects when main subject changes
  useEffect(() => {
    if (mainSubject && !isNewMainSubject) {
      fetch('/api/subjects')
        .then(response => response.json())
        .then(data => {
          if (data.main_subjects) {
            updateSubSubjects(data.main_subjects, mainSubject);
          }
        })
        .catch(error => {
          console.error('Error updating sub subjects:', error);
          toast.error('Failed to load sub subjects');
        });
    }
  }, [mainSubject, isNewMainSubject]);

  const validateGameData = (data: any): boolean => {
    try {
      // Check if data has questions array and metadata
      const questionsArray = Object.values(data).find(val => Array.isArray(val)) as any[];
      if (!data.metadata || !questionsArray) {
        return false;
      }

      // Validate metadata (with more flexible requirements)
      const metadata = data.metadata;
      if (!metadata.category || 
          !metadata.difficulty || 
          typeof metadata.totalQuestions !== 'number' || 
          !metadata.instructions) {
        return false;
      }

      // Validate each question
      return questionsArray.every(q => 
        typeof q.id === 'number' &&
        typeof q.question === 'string' &&
        Array.isArray(q.options) &&
        typeof q.correct === 'number' &&
        typeof q.hint === 'string' &&
        typeof q.solution === 'string'
      );
    } catch (error) {
      return false;
    }
  };

  const handleJsonTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setJsonText(text);
    
    try {
      if (text.trim() === '') {
        setGameData(null);
        return;
      }

      const parsedData = JSON.parse(text);
      if (validateGameData(parsedData)) {
        setGameData(parsedData);
      } else {
        setGameData(null);
        toast.error('Invalid game data structure');
      }
    } catch (error) {
      console.error('Error parsing game data:', error);
      setGameData(null);
    }
  };

  const handleConfirmSave = async () => {
    try {
      if (!gameData) {
        toast.error('Invalid game data');
        return;
      }

      const newGameEntry = {
        main_subjects: [
          {
            main_subject: isNewMainSubject ? newMainSubject : mainSubject,
            main_subject_context: [
              {
                sub_subject: isNewSubSubject ? newSubSubject : subSubject,
                sub_subject_context: [
                  {
                    id: generateId(),
                    name: gameName,
                    ...gameData
                  }
                ]
              }
            ]
          }
        ]
      };

      const response = await fetch('/api/games', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newGameEntry),
      });

      const responseData = await response.json();
      console.log('Response:', response.status, responseData);

      if (response.ok) {
        toast.success('Game saved successfully!');
        resetForm();
        await loadSubjects();
        setIsDialogOpen(false);
      } else {
        console.error('Failed to save game:', responseData);
        toast.error(responseData.error || 'Failed to save game');
      }
    } catch (error) {
      console.error('Error saving game:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to save game: ${errorMessage}`);
    }
  };

  const resetForm = () => {
    setMainSubject('');
    setSubSubject('');
    setGameName('');
    setJsonText('');
    setGameData(null);
    setIsNewMainSubject(false);
    setIsNewSubSubject(false);
    setNewMainSubject('');
    setNewSubSubject('');
  };

  const handleMainSubjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === 'new') {
      setIsNewMainSubject(true);
      setMainSubject('');
      setNewMainSubject('');
      setSubSubject('');
      setNewSubSubject('');
      setIsNewSubSubject(true);
    } else {
      setIsNewMainSubject(false);
      setMainSubject(value);
      setSubSubject('');
      setIsNewSubSubject(false);
    }
  };

  const handleSubSubjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === 'new') {
      setIsNewSubSubject(true);
      setSubSubject('');
      setNewSubSubject('');
    } else {
      setIsNewSubSubject(false);
      setSubSubject(value);
      setNewSubSubject('');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-8">
          <div className="border-b pb-6">
            <h1 className="text-3xl font-bold text-gray-900">Add New Game</h1>
            <p className="mt-2 text-gray-600">Create a new game by filling out the details below</p>
          </div>
          
          <div className="grid grid-cols-1 gap-8">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Game Name</label>
              <input
                type="text"
                value={gameName}
                onChange={(e) => setGameName(e.target.value)}
                placeholder="Enter game name"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 text-gray-900"
              />
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Main Subject</label>
                <select
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md text-gray-900"
                  value={isNewMainSubject ? 'new' : mainSubject}
                  onChange={handleMainSubjectChange}
                >
                  <option value="">Select Main Subject</option>
                  {mainSubjects.map((subject) => (
                    <option key={subject} value={subject}>
                      {subject}
                    </option>
                  ))}
                  <option value="new">+ Add New Main Subject</option>
                </select>
              </div>

              {isNewMainSubject && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">New Main Subject Name</label>
                  <input
                    type="text"
                    value={newMainSubject}
                    onChange={(e) => setNewMainSubject(e.target.value)}
                    placeholder="Enter new main subject name"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900"
                  />
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Sub Subject</label>
                <select
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md text-gray-900"
                  value={isNewSubSubject ? 'new' : subSubject}
                  onChange={handleSubSubjectChange}
                  disabled={!mainSubject && !isNewMainSubject}
                >
                  <option value="">Select Sub Subject</option>
                  {!isNewMainSubject && subSubjects.map((subject) => (
                    <option key={subject} value={subject}>
                      {subject}
                    </option>
                  ))}
                  <option value="new">+ Add New Sub Subject</option>
                </select>
              </div>

              {isNewSubSubject && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">New Sub Subject Name</label>
                  <input
                    type="text"
                    value={newSubSubject}
                    onChange={(e) => setNewSubSubject(e.target.value)}
                    placeholder="Enter new sub subject name"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900"
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Game Data (JSON)</label>
              <textarea
                value={jsonText}
                onChange={handleJsonTextChange}
                placeholder="Enter game data in JSON format"
                rows={10}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 font-mono text-gray-900"
              />
              {jsonText && (
                <div className="mt-2 text-sm">
                  {gameData ? (
                    <p className="text-green-600">✓ Valid JSON format</p>
                  ) : (
                    <p className="text-red-600">✗ Invalid JSON format</p>
                  )}
                </div>
              )}
            </div>

            <div className="pt-4">
              <button
                onClick={() => setIsDialogOpen(true)}
                disabled={!gameName || (!mainSubject && !newMainSubject) || (!subSubject && !newSubSubject) || !gameData}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-150 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Game
              </button>
            </div>
          </div>
        </div>
      </div>

      <Dialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        className="fixed inset-0 z-10 overflow-y-auto"
      >
        <div className="flex min-h-screen items-center justify-center">
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
          <Dialog.Panel className="relative mx-auto max-w-md rounded-2xl bg-white p-8 shadow-xl">
            <Dialog.Title className="text-xl font-semibold text-gray-900 mb-4">
              Confirm Save
            </Dialog.Title>
            <p className="text-gray-600 mb-6">
              Are you sure you want to save this game? This action cannot be undone.
            </p>
            <div className="flex space-x-4">
              <button
                onClick={() => setIsDialogOpen(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition duration-150"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSave}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-150"
              >
                Confirm
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
}
