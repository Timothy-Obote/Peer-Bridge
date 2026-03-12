export interface Program {
    id: number;
    program_name: string;
    program_level: 'undergraduate' | 'graduate';
    department: string;
}

export interface Course {
    id: number;
    unit_code: string;
    unit_name: string;
    credits: number;
}

export interface ProgramGroup {
    undergraduate: Program[];
    graduate: Program[];
}

export interface TuteeRegistrationData {
    email: string;
    password: string;
    name: string;
    idNumber: string;
    gender: string;
    year_of_study: string;
    gpa: string;
    whatsapp: string;
    program_level: 'undergraduate' | 'graduate' | '';
    program_id: number | '';
    selected_courses: number[];
    term: 'FS' | 'SS' | 'US';
    term_year: string;
    department: string;
}

export interface TutorRegistrationData {
    email: string;
    password: string;
    name: string;
    idNumber: string;
    gender: string;
    year_of_study: string;
    gpa: string;
    whatsapp: string;
    term: 'FS' | 'SS' | 'US';
    term_year: string;
    program_level: 'undergraduate' | 'graduate' | '';
    program_id: number | '';
    selected_courses: number[];
    department: string;
}

export type TermOption = 'FS' | 'SS' | 'US';