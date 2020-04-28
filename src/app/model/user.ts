export interface User {
    uuid: string;
    user: string;
    role?: string;
    action?: string;
    dead?: boolean;
    checked?: boolean;
    vote?: string[];
    tokill?: boolean;
}
