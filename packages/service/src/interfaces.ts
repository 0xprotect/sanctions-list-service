export interface IApiResponse {
    success: boolean
    data: any
    error?: any
}

export interface IUpdateResult {
    updated: boolean,
    actions: {
        add: string[],
        delete: string[]
    }
}

export interface IFileInfo {
    name: string,
    url: string,
    contents: string
}

export interface ISha256Values {
    [key: string]: string
}


export interface ISyncResponse {
    cloudStorage: IUpdateResult,
    db: IUpdateResult,
    smartContract: IUpdateResult
}