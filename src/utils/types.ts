export type Response<T> = {
    success: boolean;
    payload?: T;
    message?: string;
};
