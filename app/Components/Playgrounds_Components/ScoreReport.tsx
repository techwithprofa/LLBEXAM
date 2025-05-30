import React from 'react';
import { motion } from 'framer-motion';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import confetti from 'canvas-confetti';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface ScoreReportProps {
  totalPoints: number;
  correctAnswers: number;
  incorrectAnswers: number;
  questionScores: { questionNumber: number; points: number }[];
  maxPossibleScore: number;
  onPlayAgain: () => void;
}

const ScoreReport: React.FC<ScoreReportProps> = ({
  totalPoints,
  correctAnswers,
  incorrectAnswers,
  questionScores,
  maxPossibleScore,
  onPlayAgain,
}) => {
  // Trigger confetti effect on component mount
  React.useEffect(() => {
    const duration = 5 * 1000;
    const animationEnd = Date.now() + duration;

    const randomInRange = (min: number, max: number) => {
      return Math.random() * (max - min) + min;
    };

    // Initial celebratory burst
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });

    // Continuous smaller bursts
    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      confetti({
        particleCount: 2,
        angle: randomInRange(55, 125),
        spread: randomInRange(50, 70),
        origin: { y: 0.6 },
        colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD']
      });
    }, 80);

    return () => clearInterval(interval);
  }, []);

  // Chart data with enhanced styling
  const chartData = {
    labels: questionScores.map((score) => `Q${score.questionNumber}`),
    datasets: [
      {
        label: 'Points Earned',
        data: questionScores.map((score) => score.points),
        backgroundColor: 'rgba(99, 102, 241, 0.6)',
        borderColor: 'rgba(99, 102, 241, 1)',
        borderWidth: 2,
        borderRadius: 8,
        barThickness: 24,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          font: {
            size: 14,
            family: "'Inter', sans-serif",
          },
          padding: 20,
        },
      },
      title: {
        display: true,
        text: 'Performance Breakdown',
        font: {
          size: 18,
          family: "'Inter', sans-serif",
          weight: "bold" as const,
        },
        padding: { bottom: 30 },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
    animation: {
      duration: 2000,
    },
  };

  const scorePercentage = (totalPoints / maxPossibleScore) * 100;
  const scoreGrade = 
    scorePercentage >= 90 ? 'Outstanding!' :
    scorePercentage >= 80 ? 'Excellent!' :
    scorePercentage >= 70 ? 'Great Job!' :
    scorePercentage >= 60 ? 'Good Effort!' : 'Keep Practicing!';

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto p-8 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl shadow-xl"
    >
      {/* Score Overview */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2 }}
      >
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="bg-white p-6 rounded-xl shadow-lg text-center"
        >
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.3 }}
            className="text-4xl font-bold text-indigo-600 mb-2"
          >
            {totalPoints}
          </motion.div>
          <p className="text-gray-600">Total Points</p>
          <motion.div 
            className="mt-2 text-sm text-indigo-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            out of {maxPossibleScore}
          </motion.div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          className="bg-white p-6 rounded-xl shadow-lg text-center"
        >
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.4 }}
            className="text-4xl font-bold text-green-500 mb-2"
          >
            {correctAnswers}
          </motion.div>
          <p className="text-gray-600">Correct Answers</p>
          <motion.div 
            className="mt-2 text-sm text-green-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            {((correctAnswers / (correctAnswers + incorrectAnswers)) * 100).toFixed(1)}% accuracy
          </motion.div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          className="bg-white p-6 rounded-xl shadow-lg text-center"
        >
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.5 }}
            className="text-4xl font-bold text-rose-500 mb-2"
          >
            {incorrectAnswers}
          </motion.div>
          <p className="text-gray-600">Incorrect Answers</p>
        </motion.div>
      </motion.div>

      {/* Performance Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-white p-6 rounded-xl shadow-lg mb-8"
      >
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Question Performance</h3>
        <Bar data={chartData} options={chartOptions} className="max-h-[300px]" />
      </motion.div>

      {/* Play Again Button */}
      <motion.button
        onClick={onPlayAgain}
        className="w-full md:w-auto px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        Play Again
      </motion.button>
    </motion.div>
  );
};

export default ScoreReport;
