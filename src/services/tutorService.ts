import type { ProgramGroup, Course, TutorRegistrationData } from '../types/course.types';

const API_BASE = `${import.meta.env.VITE_API_URL}/api`;

export const tutorService = {
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

    // Register tutor
    async registerTutor(data: TutorRegistrationData) {
        console.log('Tutor Registration Payload:');
        console.log('Email:', data.email);
        console.log('Name:', data.name);
        console.log('Program ID:', data.program_id);
        console.log('Selected Courses:', data.selected_courses);
        console.log('Department:', data.department);

        const payload = {
            email: data.email,
            password: data.password,
            name: data.name,
            idNumber: data.idNumber,
            term: data.term,
            program_level: data.program_level,
            program_id: data.program_id,
            selected_courses: data.selected_courses,
            department: data.department
        };

        const response = await fetch(`${API_BASE}/tutors`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json'
            },
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