import qs from 'qs';

class ApiError extends Error {
  public response: any;

  constructor(m: string, response: Promise<Response>) {
    super(m);
    this.response = response;
  }
}

export const resolveResult = (response?: Response) => {
  if (typeof response === "undefined") {
    return Promise.resolve(response);
  }
  const contentType = response.headers.get('Content-Type');
  if (contentType && contentType.indexOf('application/json') !== -1) {
    return response.json();
  }
  return response.text();
};

interface ApiInit extends RequestInit {
  json?: {};
  api?: string;
  endpoint: string | string[];
  query?: any;
  onStart?: ApiCallback;
  onStop?: ApiCallback;
}

interface ApiCallback {
  (): void;
}

interface AuthState {
  site?: {
    protocol: string;
    domain: string;
  };
  auth?: {
    meId: string;
    keychain: {
      [entity: string]: {
        [api: string]: {
          base_url: string;
          token_type?: 'Bearer';
          access_token: string;
        };
      };
    };
  };
}

export const selectKeychain = (state?: AuthState) =>
  state && state.auth && state.auth.keychain[state.auth.meId];

export const selectApiInfo = (api: string, state?: AuthState) => {
  const keychain = selectKeychain(state);
  if (!keychain) {
    throw new Error('No APIs found!');
  }

  const obj = keychain[api];
  if (!obj) {
    throw new Error(
      `Api ${api} not found as any of the listed APIs: [${Object.keys(keychain).join(', ')}]`,
    );
  }

  const { base_url, access_token } = obj;
  const token_type = obj.token_type || 'Bearer'; // tslint:disable-line:variable-name

  return {
    base_url,
    token_type,
    access_token,
    authorization: access_token
      ? { Authorization: `${token_type} ${access_token}` } // prettier-ignore
      : {},
  };
};

export const callApi = (options: ApiInit, state?: AuthState, ignoreErrors?: boolean | number[]) => {
  const { json, api, headers, onStart, onStop, ..._ } = options;
  // tslint:disable-next-line:prefer-const
  let { body, method, endpoint, credentials, query, ...__ } = _;
  const init: RequestInit = __;

  if (json) {
    // Stringify json
    body = JSON.stringify(json);
  }

  if (Array.isArray(endpoint)) {
    // Join endpoint as a list with '/'
    endpoint = endpoint.join('/');
  }

  // Trim and clean duplicated slashes
  endpoint = endpoint.replace(/^\/+|\/+$|([^:]\/)\/+/g, '$1');
  if (endpoint) {
    endpoint = `${endpoint}/`;
  }

  const initHeaders: { [key: string]: string } = {};

  if (api) {
    const { base_url, authorization } = selectApiInfo(api, state);

    // Add API base URL if url isn't full
    if (!/^(?:https?:)?\/\//.test(endpoint)) {
      endpoint = `${base_url}/${endpoint}`;
    }

    Object.assign(initHeaders, headers, authorization);
  } else {
    if (!/^(?:https?:)?\/\//.test(endpoint) && state && state.site) {
      const protocol = state.site.protocol;
      const domain = state.site.domain;
      endpoint = `${protocol}://${domain}/${endpoint}`;
      if (!credentials) {
        credentials = 'same-origin';
      }
    }
    Object.assign(initHeaders, headers);
  }

  // Add Authorization and default headers
  if (body) {
    if (!initHeaders['Content-Type']) {
      initHeaders['Content-Type'] = 'application/json';
    }
    init.body = body;
  }
  if (!initHeaders['Accept']) {
    initHeaders['Accept'] = 'application/json';
  }

  init.headers = initHeaders;

  if (query) {
    // Stringify and add query string
    if (typeof query === 'object') {
      query = qs.stringify(query);
    }
    if (query) {
      endpoint += `?${query}`;
    }
  }

  if (!method) {
    // Setup default method
    if (init.body) {
      method = 'POST';
    } else {
      method = 'GET';
    }
  }

  if (credentials) {
    init.credentials = credentials;
  }

  init.method = method;

  if (process.env.NODE_ENV === 'development') {
    console.log(`🕸  %cfetch ${endpoint}\n`, 'bold rgb(0, 136, 255)', init);
  }

  onStart && onStart(); // Show spinner
  return fetch(endpoint, init)
    .catch((error: Error) => {
      onStop && onStop(); // Hide spinner with error
      if (ignoreErrors === true) {
        return resolveResult().then(result => {
          if (process.env.NODE_ENV === 'development') {
            console.log(
              `🔥  %c${method} ${endpoint} => [IGNORED EXCEPTION]\n`,
              'bold rgb(68, 136, 68)',
              error,
            );
          }
          return result;
        });
      }
      if (process.env.NODE_ENV === 'development') {
        console.error(
          `🔥  %c${method} ${endpoint} => [EXCEPTION]\n`,
          'bold rgb(255, 34, 0)',
          error,
        );
      }
      throw error;
    })
    .then((response: Response) => {
      onStop && onStop(); // Hide spinner
      if (!response.ok) {
        if (
          ignoreErrors &&
          (ignoreErrors === true || ignoreErrors.indexOf(response.status) !== -1)
        ) {
          return resolveResult().then(result => {
            if (process.env.NODE_ENV === 'development') {
              console.log(
                `💥  %c${method} ${response.url} => [IGNORED ${response.status}]`,
                'bold rgb(68, 136, 68)',
              );
            }
            return result;
          });
        }
        const error = new ApiError(
          `${method} ${response.url} => [${response.status}] ${response.statusText}`,
          resolveResult(response).then(result => {
            if (process.env.NODE_ENV === 'development') {
              console.error(
                `💥  %c${method} ${response.url} => [${response.status}]\n`,
                'bold rgb(255, 68, 0)',
                result,
              );
            }
            return result;
          }),
        );
        throw error;
      }
      return resolveResult(response).then(result => {
        if (process.env.NODE_ENV === 'development') {
          console.log(
            `💊  %c${method} ${response.url} => [${response.status}]\n`,
            'bold rgb(68, 136, 68)',
            result,
          );
        }
        return result;
      });
    });
};
