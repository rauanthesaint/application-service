import { Application, ApplicationDTO, ApplicationPublic, LoadType } from "@/models";

export interface IRepository {
    getApplicationById(id: number): Promise<ApplicationPublic | null>;
    createApplication(dto: ApplicationDTO): Promise<ApplicationPublic>;

    getLoadTypes(): Promise<LoadType[]>;
}
