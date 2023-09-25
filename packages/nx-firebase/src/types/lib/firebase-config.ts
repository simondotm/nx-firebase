export interface FirebaseFunction {
  predeploy?: string[]
  source: string
  codebase: string
  runtime: string // 'nodejs16' | 'nodejs18' | 'nodejs20'
  ignore?: string[]
}

export interface FirebaseHosting {
  target?: string
  public: string
  ignore?: string[]
  redirects?: {
    source: string
    destination: string
    type: number
  }[]
  rewrites?: {
    source: string
    destination: string
    dynamicLinks?: boolean
    function?: {
      functionId: string
      region?: string
      pinTag?: boolean
    }
    run?: {
      serviceId: string
      region: string
    }
  }
  cleanUrls?: boolean
  trailingSlash?: boolean
  appAssociation?: 'AUTO'
  headers?: {
    source: string
    headers: {
      key: string
      value: string
    }[]
  }[]
}

export interface FirebaseConfig {
  database: {
    rules: string
  }
  firestore: {
    rules: string
    indexes: string
  }
  hosting: FirebaseHosting | FirebaseHosting[]
  storage: {
    rules: string
  }
  functions: FirebaseFunction | FirebaseFunction[]
  emulators: {
    functions: {
      port: number
    }
    firestore: {
      port: number
    }
    hosting: {
      port: number
    }
    auth: {
      port: number
    }
    pubsub: {
      port: number
    }
  }
}
