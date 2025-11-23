import {
    ApplicationDTO,
    ApplicationPublic,
    BidDTO,
    BidPublic,
    ApplicationFilters,
    LoadType,
    PaymentCondition,
    PaymentMethod,
    TransportType,
    BidStatus,
} from "@/models";

export interface IRepository {
    getApplicationById(id: number): Promise<ApplicationPublic | null>;
    createApplication(dto: ApplicationDTO): Promise<ApplicationPublic>;
    deleteApplicationById(id: number): Promise<boolean>;
    getApplications(filters: ApplicationFilters): Promise<ApplicationPublic[]>;

    getBidById(id: number): Promise<BidPublic | null>;
    createBid(dto: BidDTO): Promise<BidPublic>;
    getBidsApplicationId(id: number): Promise<BidPublic[]>;
    updateBidStatus(id: number, status: BidStatus, updated_by: number): Promise<BidPublic>;

    getLoadTypes(): Promise<LoadType[]>;
    getTransportTypes(): Promise<TransportType[]>;
    getPaymentConditions(): Promise<PaymentCondition[]>;
    getPaymentMethods(): Promise<PaymentMethod[]>;
}
