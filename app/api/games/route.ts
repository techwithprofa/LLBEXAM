import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: Request) {
  try {
    const newGame = await req.json();
    console.log('Received new game data:', newGame);
    
    const dataFilePath = path.join(process.cwd(), 'app/Data/Game_data.json');
    
    // Read existing data
    let data;
    try {
      const fileContents = fs.readFileSync(dataFilePath, 'utf8');
      data = JSON.parse(fileContents);
      console.log('Current data:', data);
    } catch {
      data = { main_subjects: [] };
      console.log('Initializing new data structure');
    }

    // Find if main subject exists
    const mainSubject = newGame.main_subjects[0];
    let existingMainSubject = data.main_subjects.find(
      (ms: any) => ms.main_subject === mainSubject.main_subject
    );

    if (!existingMainSubject) {
      // Add new main subject
      existingMainSubject = {
        main_subject: mainSubject.main_subject,
        main_subject_context: []
      };
      data.main_subjects.push(existingMainSubject);
      console.log('Added new main subject:', existingMainSubject);
    }

    // Find if sub subject exists
    const subSubject = mainSubject.main_subject_context[0];
    let existingSubSubject = existingMainSubject.main_subject_context.find(
      (ss: any) => ss.sub_subject === subSubject.sub_subject
    );

    if (!existingSubSubject) {
      // Add new sub subject with empty sub_subject_context array
      existingSubSubject = {
        sub_subject: subSubject.sub_subject,
        sub_subject_context: []
      };
      existingMainSubject.main_subject_context.push(existingSubSubject);
      console.log('Added new sub subject:', existingSubSubject);
    }

    // Add or update the game in sub_subject_context array
    const newGameData = subSubject.sub_subject_context[0];
    if (existingSubSubject.sub_subject_context === null) {
      existingSubSubject.sub_subject_context = [];
    }
    existingSubSubject.sub_subject_context.push(newGameData);

    // Write updated data back to file
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
    console.log('Successfully updated game data');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in POST /api/games:', error);
    return NextResponse.json(
      { error: 'Failed to save game' },
      { status: 500 }
    );
  }
}
