import type { ProgramGroup, Course, TuteeRegistrationData } from '../types/course.types';

const API_BASE = 'http://localhost:5001/api';

export const tuteeService = {
    // Fetch all programs
    async fetchPrograms(): Promise<ProgramGroup> {
        const response = await fetch(`${API_BASE}/programs`);
        if (!response.ok) throw new Error('Failed to fetch programs');
        return response.json();
    },

    // Fetch courses for specific program
    async fetchProgramCourses(programId: number): Promise<Course[]> {
        const response = await fetch(`${API_BASE}/programs/${programId}/courses`);
        if (!response.ok) throw new Error('Failed to fetch courses');
        return response.json();
    },

    // Register tutee
    async registerTutee(data: TuteeRegistrationData) {
        const response = await fetch('http://localhost:5001/tutees', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        if (!response.ok) throw new Error(result.message);
        return result;
    }
};