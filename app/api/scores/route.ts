import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

interface Score {
  timestamp: string;
  [key: string]: any; // This allows for flexible score data properties
}

interface ScoreData {
  scores: Score[];
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const scoreFilePath = path.join(process.cwd(), 'app/Data/Score_report.json');
    
    // Read existing scores
    let scoreData: ScoreData = { scores: [] };
    if (fs.existsSync(scoreFilePath)) {
      const fileContent = fs.readFileSync(scoreFilePath, 'utf-8');
      scoreData = JSON.parse(fileContent);
    }

    // Add new score with timestamp
    const newScore: Score = {
      ...data,
      timestamp: new Date().toISOString(),
    };
    scoreData.scores.push(newScore);

    // Write back to file
    fs.writeFileSync(scoreFilePath, JSON.stringify(scoreData, null, 2));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving score:', error);
    return NextResponse.json({ success: false, error: 'Failed to save score' }, { status: 500 });
  }
}
