export interface IUser {
    id: number;
    name: string;
    email: string;
    roles: "ADMIN" | "CLIENTE";
}