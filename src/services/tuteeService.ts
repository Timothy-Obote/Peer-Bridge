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

    // Register tutee (updated with all new fields)
    async registerTutee(data: {
        email: string;
        password: string;
        name: string;
        id_number: string;
        gender: string;               // new
        year_of_study: string;         // new
        gpa: string;                   // new
        whatsapp: string;              // new
        program_level: string;
        program_id: number;
        selectedCourses: number[];
        term: string;
        term_year: string;             // new
        department: string;
    }) {
        // Debug logs
        console.log('Registration Payload:');
        console.log('Email:', data.email);
        console.log('Name:', data.name);
        console.log('ID Number:', data.id_number);
        console.log('Gender:', data.gender);
        console.log('Year of Study:', data.year_of_study);
        console.log('GPA:', data.gpa);
        console.log('WhatsApp:', data.whatsapp);
        console.log('Program Level:', data.program_level);
        console.log('Program ID:', data.program_id);
        console.log('Selected Courses:', data.selectedCourses);
        console.log('Term:', data.term);
        console.log('Term Year:', data.term_year);
        console.log('Department:', data.department);

        const payload = {
            email: data.email,
            password: data.password,
            name: data.name,
            id_number: data.id_number,
            gender: data.gender,
            year_of_study: data.year_of_study,
            gpa: data.gpa,
            whatsapp: data.whatsapp,
            program_level: data.program_level,
            program_id: data.program_id,
            selectedCourses: data.selectedCourses,
            term: data.term,
            term_year: data.term_year,
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