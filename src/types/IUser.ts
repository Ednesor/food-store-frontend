export interface IUser {
    id: number;
    name: string;
    email: string;
    role: "ADMIN" | "CLIENTE";
}