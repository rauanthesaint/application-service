export type Response<T = undefined> = {
    success: boolean;
    payload: T;
    message?: string;
};
