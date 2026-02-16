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
    program_level: 'undergraduate' | 'graduate' | '';
    program_id: number | '';
    selected_courses: number[];
    term: 'FS' | 'SS' | 'US';
    department: string;
}

// ADD THIS - Tutor Registration Data
export interface TutorRegistrationData {
    email: string;
    password: string;
    name: string;
    idNumber: string;
    term: 'FS' | 'SS' | 'US';
    program_level: 'undergraduate' | 'graduate' | '';
    program_id: number | '';
    selected_courses: number[];
    department: string;
}

export type TermOption = 'FS' | 'SS' | 'US';