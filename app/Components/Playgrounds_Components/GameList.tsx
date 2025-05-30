'use client';

import { useState } from 'react';
import gameData from '../../Data/Game_data.json';
import { motion } from 'framer-motion';

interface GameQuestion {
  id: number;
  question: string;
  options: string[];
  correct: number;
  hint?: string;
  solution?: string;
}

interface GameMetadata {
  category: string;
  difficulty: string;
  totalQuestions: number;
  timePerQuestion: number;
  instructions?: string;
}

interface Game {
  id: string;
  name: string;
  symbolCodingQuestions?: GameQuestion[];
  numberSeriesQuestions?: GameQuestion[];
  primeNumberQuestions?: GameQuestion[];
  letterSequenceQuestions?: GameQuestion[];
  groupReasoningQuestions?: GameQuestion[];
  mathematicalPatternQuestions?: GameQuestion[];
  symbolPatternQuestions?: GameQuestion[];
  multipleRulesQuestions?: GameQuestion[];
  patternQuestions?: GameQuestion[];
  sequencePatternQuestions?: GameQuestion[];
  metadata: GameMetadata;
}

interface SubSubject {
  sub_subject: string;
  sub_subject_context: Game[];
}

interface MainSubject {
  main_subject: string;
  main_subject_context: SubSubject[];
}

interface GameListProps {
  onGameSelect?: (gameId: string) => void;
}

const GameList = ({ onGameSelect }: GameListProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMainSubject, setSelectedMainSubject] = useState<string | null>(null);
  const [selectedSubSubject, setSelectedSubSubject] = useState<string | null>(null);

  // Get all games with their hierarchy
  const getAllGames = () => {
    return gameData.main_subjects as MainSubject[];
  };

  const mainSubjects = getAllGames();

  // Filter games based on search term
  const getFilteredGames = () => {
    const filteredSubjects = mainSubjects.filter(main => {
      const mainSubjectMatch = main.main_subject.toLowerCase().includes(searchTerm.toLowerCase());
      
      const hasMatchingSubSubjects = main.main_subject_context.some(sub => {
        const subSubjectMatch = sub.sub_subject.toLowerCase().includes(searchTerm.toLowerCase());
        
        const hasMatchingGames = sub.sub_subject_context.some(game => 
          game.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          game.metadata.category.toLowerCase().includes(searchTerm.toLowerCase())
        );

        return subSubjectMatch || hasMatchingGames;
      });

      return mainSubjectMatch || hasMatchingSubSubjects;
    });

    return filteredSubjects;
  };

  const filteredGames = getFilteredGames();

  return (
    <div className="w-90 bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Search Bar */}
      <div className="sticky top-0 bg-white/80 backdrop-blur-sm p-4 shadow-sm z-10">
        <div className="max-w-3xl mx-auto">
          <input
            type="text"
            placeholder="Search games, subjects, or categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-sm hover:shadow-md"
          />
        </div>
      </div>

      {/* Games Grid */}
      <div className="max-w-7xl mx-auto p-4">
        <div className="grid gap-6">
          {filteredGames.map((mainSubject, index) => (
            <motion.div
              key={mainSubject.main_subject}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              <div
                className="p-4 cursor-pointer bg-blue-50 rounded-t-xl"
                onClick={() => setSelectedMainSubject(
                  selectedMainSubject === mainSubject.main_subject ? null : mainSubject.main_subject
                )}
              >
                <h2 className="text-xl font-semibold text-gray-800">
                  {mainSubject.main_subject}
                </h2>
              </div>

              {selectedMainSubject === mainSubject.main_subject && (
                <div className="p-4">
                  {mainSubject.main_subject_context.map((subSubject) => (
                    <div key={subSubject.sub_subject} className="mb-4">
                      <div
                        className="p-3 bg-gray-50 rounded-lg cursor-pointer mb-2"
                        onClick={() => setSelectedSubSubject(
                          selectedSubSubject === subSubject.sub_subject ? null : subSubject.sub_subject
                        )}
                      >
                        <h3 className="text-lg font-medium text-gray-700">
                          {subSubject.sub_subject}
                        </h3>
                      </div>

                      {selectedSubSubject === subSubject.sub_subject && (
                        <div className="grid gap-3 pl-4">
                          {subSubject.sub_subject_context.map((game) => (
                            <motion.div
                              key={game.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              className="bg-white p-4 rounded-lg border border-gray-100 hover:border-blue-200 cursor-pointer transition-all duration-200"
                              onClick={() => onGameSelect?.(game.id)}
                            >
                              <div className="flex justify-between items-center">
                                <h4 className="text-md font-medium text-gray-800">
                                  {game.name}
                                </h4>
                                <div className="flex items-center space-x-2">
                                  <span className="px-2 py-1 bg-blue-50 text-blue-600 text-sm rounded-md">
                                    {game.metadata.difficulty}
                                  </span>
                                  <span className="px-2 py-1 bg-green-50 text-green-600 text-sm rounded-md">
                                    {game.metadata.totalQuestions} Questions
                                  </span>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GameList;
