//------------------------------
// <auto-generated>
//     Generated using the Swagen tool
//     Generator: angular
//     Mode: ng-typescript
// </auto-generated>
//------------------------------
// Tavant.Rpos.Api
// Tavant RPOS UI Services API
// Base URL: http://rpos-dev.azurewebsites.net/

import { Injectable, Inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs/Rx';

import { environment } from '../../environments/environment';

import { ApiCustomizations } from './customizations.ts';

export interface IAssetsLiabilitiesClient {
    assetsLiabilitiesGetAssetsLiabilities(applicationId: string, borrowerId: string, coBorrowerId: string): Observable<AssetsLiabilities>;

    assetsLiabilitiesSaveAssetsLiabilities(assetsLiabilities: AssetsLiabilities): Observable<AssetsLiabilities>;
}

export interface IDataClient {
    /**
     * Retrieves all branches for the organization.
     */
    branchSearchBranches(startRecord: number, recordCount: number): Observable<BranchSearchResult>;

    branchUpsertBranches(branches: Branch[]): Observable<Branch>;

    branchGetBranch(id: string): Observable<Branch>;

    branchDeleteBranch(id: string): Observable<any>;
}

export interface IRateSheetClient {
    rateSheetSearchRateSheets(startRecord: number, recordCount: number): Observable<RateSheetSearchResults>;
}

export interface IUiRateSheetClient {
    uiRateSheetGetDailyRateSheet(): Observable<DailyRateSheet>;

    uiRateSheetGetArchiveRateSheets(): Observable<any>;
}

@Injectable()
export class AssetsLiabilitiesClient implements IAssetsLiabilitiesClient {
    private readonly _baseUrl: string;

    constructor(private readonly _http: HttpClient) {
        this._baseUrl = environment.baseUri || 'http://rpos-dev.azurewebsites.net/';
    }

    public assetsLiabilitiesGetAssetsLiabilities(applicationId: string, borrowerId: string, coBorrowerId: string): Observable<AssetsLiabilities> {
        const resourceUrl: string = '/api/assets-liabilities';
        const queryParams: {[key: string]: string} = {
            applicationId: encodeURIComponent('' + applicationId),
            borrowerId: encodeURIComponent('' + borrowerId),
            coBorrowerId: encodeURIComponent('' + coBorrowerId)
        };
        const url = this.buildServiceUrl(resourceUrl, queryParams);

        const options = {
            headers: new Headers({
                'Accept': 'application/json'
            }),
        };
        return this._http.get<AssetsLiabilities>(url, options)
            .subscribe((response: HttpResponse<AssetsLiabilities>) => response.data)
            .catch((err: HttpErrorResponse) => Observable.throw(this.createError(err)));
    }

    public assetsLiabilitiesSaveAssetsLiabilities(assetsLiabilities: AssetsLiabilities): Observable<AssetsLiabilities> {
        if (assetsLiabilities == undefined || assetsLiabilities == null) {
            throw new Error(`The parameter 'assetsLiabilities' must be defined.`);
        }

        const resourceUrl: string = '/api/assets-liabilities';
        const url = this.buildServiceUrl(resourceUrl);

        const options = {
            headers: new Headers({
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }),
        };
        return this._http.put<AssetsLiabilities>(url, assetsLiabilities, options)
            .subscribe((response: HttpResponse<AssetsLiabilities>) => response.data)
            .catch((err: HttpErrorResponse) => Observable.throw(this.createError(err)));
    }

    private buildServiceUrl(resourceUrl: string, queryParams?: {[key: string]: string}): string {
        let url: string = this._baseUrl;
        const baseUrlSlash: boolean = url[url.length - 1] === '/';
        const resourceUrlSlash: boolean = resourceUrl && resourceUrl[0] === '/';
        if (!baseUrlSlash && !resourceUrlSlash) {
            url += '/';
        } else if (baseUrlSlash && resourceUrlSlash) {
            url = url.substr(0, url.length - 1);
        }
        url += resourceUrl;

        if (!queryParams) {
            return url;
        }

        let isFirst: boolean = true;
        for (const p in queryParams) {
            if (queryParams.hasOwnProperty(p) && queryParams[p]) {
                const separator: string = isFirst ? '?' : '&';
                url += `${separator}${p}=${queryParams[p]}`;
                isFirst = false;
            }
        }
        return url;
    }

    private createError(err: HttpErrorResponse): WebApiClientError {
        const headers = err.headers.keys().reduce((accumulate: { [key: string]: string[] }, key: string) => {
            accumulate[key] = err.headers.getAll(key);
            return accumulate;
        }, {});
        return new WebApiClientError(err.message, err.status, headers);
    }
}

@Injectable()
export class DataClient implements IDataClient {
    private readonly _baseUrl: string;

    constructor(private readonly _http: HttpClient) {
        this._baseUrl = environment.baseUri || 'http://rpos-dev.azurewebsites.net/';
    }

    /**
     * Retrieves all branches for the organization.
     */
    public branchSearchBranches(startRecord: number, recordCount: number): Observable<BranchSearchResult> {
        const resourceUrl: string = '/data/branches';
        const queryParams: {[key: string]: string} = {
            startRecord: encodeURIComponent('' + startRecord),
            recordCount: encodeURIComponent('' + recordCount)
        };
        const url = this.buildServiceUrl(resourceUrl, queryParams);

        const options = {
            headers: new Headers({
                'Accept': 'application/json'
            }),
        };
        return this._http.get<BranchSearchResult>(url, options)
            .subscribe((response: HttpResponse<BranchSearchResult>) => response.data)
            .catch((err: HttpErrorResponse) => Observable.throw(this.createError(err)));
    }

    public branchUpsertBranches(branches: Branch[]): Observable<Branch> {
        if (branches == undefined || branches == null) {
            throw new Error(`The parameter 'branches' must be defined.`);
        }

        const resourceUrl: string = '/data/branches';
        const url = this.buildServiceUrl(resourceUrl);

        const options = {
            headers: new Headers({
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }),
        };
        return this._http.post<Branch>(url, branches, options)
            .subscribe((response: HttpResponse<Branch>) => response.data)
            .catch((err: HttpErrorResponse) => Observable.throw(this.createError(err)));
    }

    public branchGetBranch(id: string): Observable<Branch> {
        if (id == undefined || id == null) {
            throw new Error(`The parameter 'id' must be defined.`);
        }

        const resourceUrl: string = '/data/branches/{id}'
            .replace('{id}', encodeURIComponent('' + id));
        const url = this.buildServiceUrl(resourceUrl);

        const options = {
            headers: new Headers({
                'Accept': 'application/json'
            }),
        };
        return this._http.get<Branch>(url, options)
            .subscribe((response: HttpResponse<Branch>) => response.data)
            .catch((err: HttpErrorResponse) => Observable.throw(this.createError(err)));
    }

    public branchDeleteBranch(id: string): Observable<any> {
        if (id == undefined || id == null) {
            throw new Error(`The parameter 'id' must be defined.`);
        }

        const resourceUrl: string = '/data/branches/{id}'
            .replace('{id}', encodeURIComponent('' + id));
        const url = this.buildServiceUrl(resourceUrl);

        const options = {
            headers: new Headers({
                'Accept': 'application/json'
            }),
        };
        return this._http.delete<any>(url, options)
            .subscribe((response: HttpResponse<any>) => response.data)
            .catch((err: HttpErrorResponse) => Observable.throw(this.createError(err)));
    }

    private buildServiceUrl(resourceUrl: string, queryParams?: {[key: string]: string}): string {
        let url: string = this._baseUrl;
        const baseUrlSlash: boolean = url[url.length - 1] === '/';
        const resourceUrlSlash: boolean = resourceUrl && resourceUrl[0] === '/';
        if (!baseUrlSlash && !resourceUrlSlash) {
            url += '/';
        } else if (baseUrlSlash && resourceUrlSlash) {
            url = url.substr(0, url.length - 1);
        }
        url += resourceUrl;

        if (!queryParams) {
            return url;
        }

        let isFirst: boolean = true;
        for (const p in queryParams) {
            if (queryParams.hasOwnProperty(p) && queryParams[p]) {
                const separator: string = isFirst ? '?' : '&';
                url += `${separator}${p}=${queryParams[p]}`;
                isFirst = false;
            }
        }
        return url;
    }

    private createError(err: HttpErrorResponse): WebApiClientError {
        const headers = err.headers.keys().reduce((accumulate: { [key: string]: string[] }, key: string) => {
            accumulate[key] = err.headers.getAll(key);
            return accumulate;
        }, {});
        return new WebApiClientError(err.message, err.status, headers);
    }
}

@Injectable()
export class RateSheetClient implements IRateSheetClient {
    private readonly _baseUrl: string;

    constructor(private readonly _http: HttpClient) {
        this._baseUrl = environment.baseUri || 'http://rpos-dev.azurewebsites.net/';
    }

    public rateSheetSearchRateSheets(startRecord: number, recordCount: number): Observable<RateSheetSearchResults> {
        const resourceUrl: string = '/api/rate-sheets';
        const queryParams: {[key: string]: string} = {
            startRecord: encodeURIComponent('' + startRecord),
            recordCount: encodeURIComponent('' + recordCount)
        };
        const url = this.buildServiceUrl(resourceUrl, queryParams);

        const options = {
            headers: new Headers({
                'Accept': 'application/json'
            }),
        };
        return this._http.get<RateSheetSearchResults>(url, options)
            .subscribe((response: HttpResponse<RateSheetSearchResults>) => response.data)
            .catch((err: HttpErrorResponse) => Observable.throw(this.createError(err)));
    }

    private buildServiceUrl(resourceUrl: string, queryParams?: {[key: string]: string}): string {
        let url: string = this._baseUrl;
        const baseUrlSlash: boolean = url[url.length - 1] === '/';
        const resourceUrlSlash: boolean = resourceUrl && resourceUrl[0] === '/';
        if (!baseUrlSlash && !resourceUrlSlash) {
            url += '/';
        } else if (baseUrlSlash && resourceUrlSlash) {
            url = url.substr(0, url.length - 1);
        }
        url += resourceUrl;

        if (!queryParams) {
            return url;
        }

        let isFirst: boolean = true;
        for (const p in queryParams) {
            if (queryParams.hasOwnProperty(p) && queryParams[p]) {
                const separator: string = isFirst ? '?' : '&';
                url += `${separator}${p}=${queryParams[p]}`;
                isFirst = false;
            }
        }
        return url;
    }

    private createError(err: HttpErrorResponse): WebApiClientError {
        const headers = err.headers.keys().reduce((accumulate: { [key: string]: string[] }, key: string) => {
            accumulate[key] = err.headers.getAll(key);
            return accumulate;
        }, {});
        return new WebApiClientError(err.message, err.status, headers);
    }
}

@Injectable()
export class UiRateSheetClient implements IUiRateSheetClient {
    private readonly _baseUrl: string;

    constructor(private readonly _http: HttpClient) {
        this._baseUrl = environment.baseUri || 'http://rpos-dev.azurewebsites.net/';
    }

    public uiRateSheetGetDailyRateSheet(): Observable<DailyRateSheet> {
        const resourceUrl: string = '/ui/rate-sheets/daily';
        const url = this.buildServiceUrl(resourceUrl);

        const options = {
            headers: new Headers({
                'Accept': 'application/json'
            }),
        };
        return this._http.get<DailyRateSheet>(url, options)
            .subscribe((response: HttpResponse<DailyRateSheet>) => response.data)
            .catch((err: HttpErrorResponse) => Observable.throw(this.createError(err)));
    }

    public uiRateSheetGetArchiveRateSheets(): Observable<any> {
        const resourceUrl: string = '/ui/rate-sheets/archive';
        const url = this.buildServiceUrl(resourceUrl);

        const options = {
            headers: new Headers({
                'Accept': 'application/json'
            }),
        };
        return this._http.get<any>(url, options)
            .subscribe((response: HttpResponse<any>) => response.data)
            .catch((err: HttpErrorResponse) => Observable.throw(this.createError(err)));
    }

    private buildServiceUrl(resourceUrl: string, queryParams?: {[key: string]: string}): string {
        let url: string = this._baseUrl;
        const baseUrlSlash: boolean = url[url.length - 1] === '/';
        const resourceUrlSlash: boolean = resourceUrl && resourceUrl[0] === '/';
        if (!baseUrlSlash && !resourceUrlSlash) {
            url += '/';
        } else if (baseUrlSlash && resourceUrlSlash) {
            url = url.substr(0, url.length - 1);
        }
        url += resourceUrl;

        if (!queryParams) {
            return url;
        }

        let isFirst: boolean = true;
        for (const p in queryParams) {
            if (queryParams.hasOwnProperty(p) && queryParams[p]) {
                const separator: string = isFirst ? '?' : '&';
                url += `${separator}${p}=${queryParams[p]}`;
                isFirst = false;
            }
        }
        return url;
    }

    private createError(err: HttpErrorResponse): WebApiClientError {
        const headers = err.headers.keys().reduce((accumulate: { [key: string]: string[] }, key: string) => {
            accumulate[key] = err.headers.getAll(key);
            return accumulate;
        }, {});
        return new WebApiClientError(err.message, err.status, headers);
    }
}

export class WebApiClientError extends Error {
    constructor(public message: string, public statusCode: number, public headers: { [key: string]: string[] }) {
        super(message);
    }
}

export interface Address {
    lines?: string[];
    city?: string;
    state?: string;
    zip?: string;
    id?: string;
}

export interface Asset {
    assetType?: AssetTypeAsset;
    borrowerId?: string;
    companyName?: string;
    addressLines?: string[];
    city?: string;
    state?: string;
    zipCode?: string;
    remarks?: string;
    checkingSavings?: CheckingSavings[];
    stocksAndBonds?: StocksAndBonds[];
    autoOwned?: AutoOwned[];
    lifeInsurance?: LifeInsurance;
    others?: Other[];
    retirementFundsBalance?: number;
    netWorthBusinessBalance?: number;
    totalBalance?: number;
    recordStatus?: RecordStatusAsset;
    id?: string;
}

export interface AssetHeader {
    appDepositDesc?: string;
    appDepositAmt?: number;
    earnestDesc?: string;
    earnestAmt?: number;
    cashTowardsPurchaseIncludeInNetWorth?: boolean;
    id?: string;
}

export interface AssetsLiabilities {
    applicationId?: string;
    statementCompleted?: StatementCompletedAssetsLiabilities;
    vacancyFactor?: number;
    subjectPropertyAddress?: Address;
    borrowerAddress?: BorrowerAddress;
    coBorrowerAddress?: BorrowerAddress;
    assetHeader?: AssetHeader;
    assets?: Asset[];
    liabilities?: Liability[];
    realEstateOwnedList?: RealEstateOwned[];
    id?: string;
}

export interface AssetsLiabilitiesRequest {
    applicationId?: string;
    borrowerId?: string;
    coBorrowerId?: string;
}

export interface AutoOwned {
    autosOwned?: string;
    balanceOrMarketValue?: number;
    id?: string;
}

export interface BorrowerAddress {
    borrowerId?: string;
    address?: Address;
    id?: string;
}

export interface Branch {
    name?: string;
    id?: string;
}

export interface BranchFilterCriteria {
    field?: FieldBranchFilterCriteria;
    operation?: OperationBranchFilterCriteria;
    value?: any;
}

export interface BranchSearchCriteria {
    filters?: BranchFilterCriteria[];
    sortSpecs?: BranchSortSpec[];
    startRecord?: number;
    recordCount?: number;
}

export interface BranchSearchResult {
    data?: Branch[];
    totalCount?: number;
}

export interface BranchSortSpec {
    field?: FieldBranchFilterCriteria;
    order?: OrderBranchSortSpec;
}

export interface CheckingSavings {
    accountType?: AccountTypeCheckingSavings;
    accountNumber?: string;
    balanceOrMarketValue?: number;
    recordStatus?: RecordStatusAsset;
    id?: string;
}

export interface DailyRateSheet {
    branches?: BranchSearchResult;
    rateSheets?: RateSheetSearchResults;
}

export interface Error {
    errorCode?: string;
    correlationId?: string;
    debug?: string;
}

export interface Liability {
    liabilityType?: LiabilityTypeLiability;
    borrowerId?: string;
    accountType?: AccountTypeLiability;
    companyName?: string;
    addressLines?: string[];
    city?: string;
    state?: string;
    zipCode?: string;
    accountNumber?: string;
    unpaidBalance?: number;
    notCounted?: boolean;
    toBePaidOff?: boolean;
    omitted?: boolean;
    listedOnCreditReport?: boolean;
    resubordinated?: boolean;
    defaultPaymentLeft?: number;
    overrideDefault?: boolean;
    overridePaymentLeft?: string;
    monthlyPayment?: number;
    atrNotes?: string;
    otherNotes?: string;
    isLinkedToReo?: boolean;
    reoId?: string;
    lienPosition?: number;
    mortgagePayments?: number;
    otherExpenceType?: OtherExpenceTypeLiability;
    otherExpenseOwedTo?: string;
    otherExpenseAmount?: number;
    otherExpenseQmatrNotes?: string;
    jobExpenseDesc1?: string;
    jobExpenseAmount1?: number;
    jobExpenseDesc2?: string;
    jobExpenseAmount2?: number;
    jobExpense1QmatrNotes?: string;
    jobExpense2QmatrNotes?: string;
    recordStatus?: RecordStatusAsset;
    id?: string;
}

export interface LifeInsurance {
    faceAmountName?: number;
    balanceOrMarketValue?: number;
    id?: string;
}

export interface Other {
    assetName?: string;
    balanceOrMarketValue?: number;
    id?: string;
}

export interface RateSheet {
    name?: string;
    fileType?: string;
    branchId?: string;
    fromDate?: Date;
    toDate?: Date;
    id?: string;
}

export interface RateSheetFilterCriteria {
    field?: FieldRateSheetFilterCriteria;
    operation?: OperationBranchFilterCriteria;
    value?: any;
}

export interface RateSheetSearchCriteria {
    filters?: RateSheetFilterCriteria[];
    sortSpecs?: RateSheetSortSpec[];
    startRecord?: number;
    recordCount?: number;
}

export interface RateSheetSearchResults {
    data?: RateSheet[];
    totalCount?: number;
}

export interface RateSheetSortSpec {
    field?: FieldRateSheetFilterCriteria;
    order?: OrderBranchSortSpec;
}

export interface RealEstateOwned {
    borrowerId?: string;
    isCurrentResidence?: boolean;
    isSubjectProperty?: boolean;
    propertyAddresses?: string[];
    city?: string;
    state?: string;
    zipCode?: string;
    propertyStatus?: PropertyStatusRealEstateOwned;
    typeOfProperty?: TypeOfPropertyRealEstateOwned;
    presentMarketValue?: number;
    amountOfMortgages?: number;
    grossRentalIncome?: number;
    vacancyFactor?: number;
    overrideVacancyFactor?: boolean;
    overrideVacancyFactorValue?: number;
    incomeLessVacancy?: number;
    mortgagePayments?: number;
    includeTandI?: boolean;
    insMainTaxHoa?: number;
    netRentalIncome?: number;
    overrideDefaultNri?: boolean;
    overrideNriValue?: number;
    piti?: number;
    overrideDefaultPiti?: boolean;
    overridePitiValue?: number;
    linkedToLiability?: boolean;
    linkedLiabilities?: Liability[];
    totalReoValue?: number;
    recordStatus?: RecordStatusAsset;
    id?: string;
}

export interface StocksAndBonds {
    bankName?: string;
    balanceOrMarketValue?: number;
    id?: string;
}

export type AccountTypeCheckingSavings = 'NotAssigned' | 'Savings' | 'Checkings' | 'CashDepositOnSaleContract' | 'GiftNotDeposited' | 'CertificateOfDeposit' | 'MoneyMarketFund' | 'MutualFunds' | 'Stocks' | 'Bonds' | 'SecuredBorrowedFundsNotDeposited' | 'BridgeLoanNotDeposited' | 'RetairementFunds' | 'NetWorthOfBusinessOwned' | 'TrustFunds' | 'OtherNonLiquidAsset' | 'OtherLiquidAsset' | 'NetProceedsFromSaleOfRealEstate' | 'NetEquity' | 'CashOnHand' | 'GiftOfEquity';

export type AccountTypeLiability = 'NotAssigned' | 'Revolving' | 'Installment' | 'Mortgage' | 'Heloc' | 'Liens' | 'LeasePayments' | 'Open' | 'Taxes' | 'Other';

export type AssetTypeAsset = 'NotAssigned' | 'CheckingAndSaving' | 'StocksAndBonds' | 'AutoOwned' | 'OtherAssets' | 'LifeInsurance' | 'RetirementFunds' | 'NetWorthBusiness';

export type FieldBranchFilterCriteria = 'Name';

export type FieldRateSheetFilterCriteria = 'Name' | 'FileType' | 'BranchId' | 'FromDate' | 'ToDate';

export type LiabilityTypeLiability = 'NotAssigned' | 'Banking' | 'Other';

export type OperationBranchFilterCriteria = 'Equals' | 'DoesNotEqual' | 'GreaterThan' | 'GreaterThanOrEqual' | 'LessThan' | 'LessThanOrEqual' | 'Like';

export type OrderBranchSortSpec = 'Ascending' | 'Descending';

export type OtherExpenceTypeLiability = 'NotAssigned' | 'Alimony' | 'ChildSupport' | 'SeperateMaintance' | 'OtherExpense';

export type PropertyStatusRealEstateOwned = 'NotAssigned' | 'Sold' | 'PendingSale' | 'Rental' | 'Retained';

export type RecordStatusAsset = 'NotAssigned' | 'New' | 'Update' | 'Delete';

export type StatementCompletedAssetsLiabilities = 'NotAssigned' | 'Jointly' | 'NotJointly';

export type TypeOfPropertyRealEstateOwned = 'NotAssigned' | 'SingleFamily' | 'Condominium' | 'TownHouse' | 'CoOperative' | 'TwoToFourUnitProperty' | 'MultiFamilyMoreThanFourUnits' | 'ManufacturedMobileHome' | 'CommercialNonResidential' | 'MixedUseResidential' | 'Farm' | 'HomeAndBusinessCombined' | 'Land';
