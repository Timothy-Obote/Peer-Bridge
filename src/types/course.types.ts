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
}

export type TermOption = 'FS' | 'SS' | 'US';