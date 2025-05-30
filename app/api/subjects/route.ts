import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const dataFilePath = path.join(process.cwd(), 'app/Data/Game_data.json');
    
    // Check if file exists
    if (!fs.existsSync(dataFilePath)) {
      // Create initial structure if file doesn't exist
      const initialData = {
        main_subjects: []
      };
      fs.writeFileSync(dataFilePath, JSON.stringify(initialData, null, 2));
      return NextResponse.json(initialData);
    }

    // Read file contents
    const fileContents = fs.readFileSync(dataFilePath, 'utf8');
    
    // Validate file is not empty
    if (!fileContents.trim()) {
      const initialData = {
        main_subjects: []
      };
      fs.writeFileSync(dataFilePath, JSON.stringify(initialData, null, 2));
      return NextResponse.json(initialData);
    }

    // Parse JSON with error handling
    try {
      const data = JSON.parse(fileContents);
      
      // Validate data structure
      if (!data || !Array.isArray(data.main_subjects)) {
        const initialData = {
          main_subjects: []
        };
        fs.writeFileSync(dataFilePath, JSON.stringify(initialData, null, 2));
        return NextResponse.json(initialData);
      }
      
      return NextResponse.json(data);
    } catch (parseError) {
      console.error('Error parsing JSON:', parseError);
      // Reset to initial structure if JSON is invalid
      const initialData = {
        main_subjects: []
      };
      fs.writeFileSync(dataFilePath, JSON.stringify(initialData, null, 2));
      return NextResponse.json(initialData);
    }
  } catch (error) {
    console.error('Error reading subjects:', error);
    return NextResponse.json({ error: 'Failed to read subjects' }, { status: 500 });
  }
}
