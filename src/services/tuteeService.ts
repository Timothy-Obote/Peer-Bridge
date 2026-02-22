import type { ProgramGroup, Course } from '../types/course.types';

const API_BASE = `${import.meta.env.VITE_API_URL}/api`;

export const tuteeService = {
    // Fetch all programs
    async fetchPrograms(): Promise<ProgramGroup> {
        console.log('Fetching programs...');
        const response = await fetch(`${API_BASE}/programs`);
        if (!response.ok) throw new Error('Failed to fetch programs');
        return response.json();
    },

    // Fetch courses for specific program
    async fetchProgramCourses(programId: number): Promise<Course[]> {
        console.log(`Fetching courses for program ID: ${programId}`);
        const response = await fetch(`${API_BASE}/programs/${programId}/courses`);
        if (!response.ok) throw new Error('Failed to fetch courses');
        return response.json();
    },

    // Register tutee
    async registerTutee(data: {
        email: string;
        password: string;
        name: string;
        id_number: string;          // ✅ matches backend
        program_level: string;
        program_id: number;
        selectedCourses: number[];  // ✅ matches backend
        term: string;
        department: string;
    }) {
        // Debug logs
        console.log('Registration Payload:');
        console.log('Email:', data.email);
        console.log('Name:', data.name);
        console.log('ID Number:', data.id_number);
        console.log('Program Level:', data.program_level);
        console.log('Program ID:', data.program_id);
        console.log('Selected Courses:', data.selectedCourses);
        console.log('Term:', data.term);
        console.log('Department:', data.department);

        const payload = {
            email: data.email,
            password: data.password,
            name: data.name,
            id_number: data.id_number,
            program_level: data.program_level,
            program_id: data.program_id,
            selectedCourses: data.selectedCourses,
            term: data.term,
            department: data.department
        };

        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/tutees`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            console.error('Registration failed:', result.message);
            throw new Error(result.message);
        }
        
        console.log('Registration successful');
        return result;
    }
};