'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import gameData from '../../Data/Game_data.json';
import confetti from 'canvas-confetti';
import ScoreReport from './ScoreReport';

interface Question {
  id: number;
  question: string;
  options: string[];
  correct: number;
  hint: string;
  solution: string;
}

interface RandomizedQuestion extends Question {
  randomizedOptions: string[];
  originalToRandomizedMap: number[];
  randomizedToOriginalMap: number[];
}

interface GameMetadata {
  category: string;
  difficulty: string;
  totalQuestions: number;
  timePerQuestion?: number;
  totalTime?: number;
  passingScore?: number;
  instructions: string;
  evaluationCriteria?: {
    patternRecognition?: number;
    ruleUnderstanding?: number;
    mathematicalSkills?: number;
    analyticalAbility?: number;
    ruleComprehension?: number;
    logicalThinking?: number;
    analyticalSkills?: number;
    accuracyOfConclusions?: number;
    timeManagement?: number;
  };
  scoringCriteria?: string;
}

interface LogicGame {
  id: string;
  name: string;
  logicQuestions: Question[];
  metadata: GameMetadata;
}

interface LetterNumberGame {
  id: string;
  name: string;
  letterNumberQuestions: Question[];
  metadata: GameMetadata;
}

interface SymbolCodingGame {
  id: string;
  name: string;
  symbolCodingQuestions: Question[];
  metadata: GameMetadata;
}

type Game = {
  id: string;
  name: string;
  questions: Question[];
  metadata: GameMetadata;
};

interface GamePlaygroundProps {
  gameId?: string;
  onGameComplete?: (score: number) => void;
}

interface ScoreData {
  questionId: number;
  points: number;
  usedHint: boolean;
  correct: boolean;
  timeTaken: number;
}

const POINTS_WITH_HINT = 5;
const POINTS_WITHOUT_HINT = 10;

const GamePlayground = ({ gameId = 'mambwejzi', onGameComplete }: GamePlaygroundProps) => {
  const [game, setGame] = useState<Game | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isAnswered, setIsAnswered] = useState(false);
  const [scores, setScores] = useState<ScoreData[]>([]);
  const [showScoreReport, setShowScoreReport] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [randomizedQuestions, setRandomizedQuestions] = useState<RandomizedQuestion[]>([]);

  // Function to randomize options for a question
  const randomizeOptions = (question: Question): RandomizedQuestion => {
    const originalOptions = [...question.options];
    const randomizedOptions: string[] = [];
    const originalToRandomizedMap: number[] = [];
    const randomizedToOriginalMap: number[] = [];
    
    // Create a copy of indices
    const availableIndices = originalOptions.map((_, index) => index);
    
    // Randomly select options and map their positions
    while (availableIndices.length > 0) {
      const randomIndex = Math.floor(Math.random() * availableIndices.length);
      const originalIndex = availableIndices[randomIndex];
      const newIndex = randomizedOptions.length;
      
      randomizedOptions.push(originalOptions[originalIndex]);
      originalToRandomizedMap[originalIndex] = newIndex;
      randomizedToOriginalMap[newIndex] = originalIndex;
      availableIndices.splice(randomIndex, 1);
    }
    
    return {
      ...question,
      randomizedOptions,
      originalToRandomizedMap,
      randomizedToOriginalMap
    };
  };

  // Modify the useEffect that loads the game to include randomization
  useEffect(() => {
    const findGameById = (id: string) => {
      for (const mainSubject of gameData.main_subjects) {
        for (const subSubject of mainSubject.main_subject_context) {
          const foundGame = subSubject.sub_subject_context.find(g => g.id === id);
          if (foundGame) {
            // Find the key that contains 'questions' and is an array
            const questionsKey = Object.keys(foundGame).find(key => 
              Array.isArray(foundGame[key as keyof typeof foundGame]) && 
              key.toLowerCase().includes('question')
            );
            
            if (questionsKey) {
              // Get the questions array with proper type assertion
              const questions = (foundGame[questionsKey as keyof typeof foundGame] as unknown) as Question[];
              const randomizedQuestions = questions.map(q => randomizeOptions(q));
              setRandomizedQuestions(randomizedQuestions);
              setGame({
                id: foundGame.id,
                name: foundGame.name,
                questions: questions,
                metadata: foundGame.metadata
              });
            }
          }
        }
      }
    };

    if (gameId) {
      findGameById(gameId);
    }
  }, [gameId]);

  const getCurrentQuestion = () => {
    if (!randomizedQuestions.length) return null;
    return randomizedQuestions[currentQuestionIndex];
  };

  const handleAnswerSelect = (answerIndex: number) => {
    if (isAnswered || !getCurrentQuestion()) return;
    
    const currentQuestion = getCurrentQuestion()!;
    const originalAnswerIndex = currentQuestion.randomizedToOriginalMap[answerIndex];
    const isCorrect = originalAnswerIndex === currentQuestion.correct;
    
    setSelectedAnswer(answerIndex);
    setIsAnswered(true);
    
    // Update scores
    setScores(prev => [...prev, {
      questionId: currentQuestion.id,
      points: isCorrect ? (showHint ? POINTS_WITH_HINT : POINTS_WITHOUT_HINT) : 0,
      usedHint: showHint,
      correct: isCorrect,
      timeTaken: timeLeft
    }]);

    if (isCorrect) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      // Move to next question after a short delay
      setTimeout(() => {
        handleNextQuestion();
      }, 1500); // 1.5 second delay
    }
  };

  const getTotalQuestions = () => {
    if (!game) return 0;
    return game.questions.length;
  };

  // Timer effect
  useEffect(() => {
    if (!gameStarted || isAnswered || showScoreReport) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameStarted, isAnswered, showScoreReport]);

  const handleTimeUp = () => {
    if (!isAnswered && game) {
      const currentQuestion = getCurrentQuestion();
      if (!currentQuestion) return;
      
      setScores(prev => [...prev, {
        questionId: currentQuestion.id,
        points: 0,
        usedHint: showHint,
        correct: false,
        timeTaken: timeLeft
      }]);
      
      handleNextQuestion();
    }
  };

  const handleStartGame = () => {
    if (game?.metadata?.timePerQuestion) {
      // Convert minutes to seconds (timePerQuestion is in minutes)
      setTimeLeft(game.metadata.timePerQuestion * 60);
    } else {
      // Default to 2 minutes if not specified
      setTimeLeft(120);
    }
    setGameStarted(true);
  };

  const handleShowHint = () => {
    setShowHint(true);
  };

  const handleNextQuestion = () => {
    if (game && currentQuestionIndex < getTotalQuestions() - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowHint(false);
      setIsAnswered(false);
      if (game?.metadata?.timePerQuestion) {
        // Convert minutes to seconds
        setTimeLeft(game.metadata.timePerQuestion * 60);
      } else {
        setTimeLeft(120); // Default to 2 minutes if not specified
      }
    } else {
      setShowScoreReport(true);
    }
  };

  const handleEndGame = async () => {
    if (game && scores.length > 0) {
      const totalScore = scores.reduce((sum, score) => sum + score.points, 0);
      const scoreData = {
        gameId: game.id,
        gameName: game.name,
        totalScore,
        scores,
        questionsAttempted: scores.length,
        totalQuestions: getTotalQuestions()
      };

      try {
        const response = await fetch('/api/scores', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(scoreData),
        });

        if (!response.ok) {
          console.error('Failed to save score');
        }
      } catch (error) {
        console.error('Error saving score:', error);
      }
    }

    setGameStarted(false);
    setCurrentQuestionIndex(0);
    setScores([]);
    setSelectedAnswer(null);
    setShowHint(false);
    setIsAnswered(false);
    setTimeLeft(0);
    setShowScoreReport(false);
  };

  if (!game) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="p-8 bg-white rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Loading game...</h2>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        </div>
      </div>
    );
  }

  const currentQuestion = getCurrentQuestion();
  if (!currentQuestion) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="p-8 bg-white rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold mb-4 text-red-600">Error</h2>
          <p className="text-gray-700">Could not load question data.</p>
        </div>
      </div>
    );
  }

  if (showScoreReport && game) {
    return (
      <ScoreReport
        totalPoints={scores.reduce((sum, score) => sum + score.points, 0)}
        correctAnswers={scores.filter(score => score.correct).length}
        incorrectAnswers={scores.filter(score => !score.correct).length}
        questionScores={scores.map((score, index) => ({
          questionNumber: index + 1,
          points: score.points
        }))}
        maxPossibleScore={getTotalQuestions() * POINTS_WITHOUT_HINT}
        onPlayAgain={() => {
          setCurrentQuestionIndex(0);
          setSelectedAnswer(null);
          setShowHint(false);
          setTimeLeft(0);
          setIsAnswered(false);
          setScores([]);
          setShowScoreReport(false);
          setGameStarted(false);
        }}
      />
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4 md:p-8"
    >
      {!gameStarted ? (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-8 text-center"
        >
          <h2 className="text-3xl font-bold text-gray-800 mb-4">{game.name}</h2>
          <p className="text-gray-600 mb-8">Ready to test your knowledge?</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleStartGame}
            className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg"
          >
            Start Game
          </motion.button>
        </motion.div>
      ) : (
        <div className="min-h-screen bg-gray-100 p-4">
          <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <div className="text-xl font-semibold text-gray-800">
                Question {currentQuestionIndex + 1} of {getTotalQuestions()}
              </div>
              <div className="flex gap-4">
                <div className="text-lg font-medium text-blue-600">
                  Time Left: {timeLeft}s
                </div>
                <button
                  onClick={handleEndGame}
                  className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                >
                  End Game
                </button>
              </div>
            </div>
            {/* Question Card */}
            <motion.div
              layout
              key={currentQuestion.id}
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -100, opacity: 0 }}
              className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden"
            >
              <div className="p-6 md:p-8">
                <h3 className="text-xl md:text-2xl font-semibold text-gray-800 mb-6">
                  {currentQuestion.question}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentQuestion.randomizedOptions.map((option, index) => (
                    <motion.button
                      key={index}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleAnswerSelect(index)}
                      disabled={isAnswered}
                      className={`p-4 rounded-xl text-left transition-all duration-200 text-gray-900 ${
                        isAnswered
                          ? index === currentQuestion.randomizedToOriginalMap.indexOf(currentQuestion.correct)
                            ? 'bg-green-100 border-green-500'
                            : index === selectedAnswer
                            ? 'bg-red-100 border-red-500'
                            : 'bg-gray-50'
                          : 'bg-gray-50 hover:bg-indigo-50 hover:shadow-md'
                      } ${
                        selectedAnswer === index ? 'border-2' : 'border'
                      } border-gray-200`}
                    >
                      {option}
                    </motion.button>
                  ))}
                </div>

                {!isAnswered && !showHint && currentQuestion.hint && (
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowHint(true)}
                    className="mt-6 px-4 py-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    Need a hint? (-{POINTS_WITHOUT_HINT - POINTS_WITH_HINT} points)
                  </motion.button>
                )}

                {showHint && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 p-4 bg-indigo-50 rounded-lg text-indigo-700"
                  >
                    💡 {currentQuestion.hint}
                  </motion.div>
                )}

                {/* Solution Display */}
                {isAnswered && selectedAnswer !== currentQuestion.randomizedToOriginalMap.indexOf(currentQuestion.correct) && currentQuestion.solution && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">Solution Explanation:</h4>
                    <p className="text-gray-800">{currentQuestion.solution}</p>
                  </motion.div>
                )}

                {/* Next Question Button - Only show for incorrect answers */}
                {isAnswered && selectedAnswer !== currentQuestion.randomizedToOriginalMap.indexOf(currentQuestion.correct) && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 flex justify-center"
                  >
                    <motion.button
                      onClick={handleNextQuestion}
                      className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {currentQuestionIndex < getTotalQuestions() - 1 ? 'Next Question' : 'View Results'}
                    </motion.button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default GamePlayground;
