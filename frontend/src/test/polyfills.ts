/**
 * Runs before every other setup file (vitest `setupFiles` order). Under jsdom, AbortController /
 * AbortSignal come from jsdom while fetch/Request come from Node's undici, whose brand check rejects
 * them ("Expected signal to be an instance of AbortSignal"). This breaks React Router data routers
 * and fetch through MSW. Tests don't exercise aborts, so Request drops `signal` here. Browsers have a
 * single implementation, so production code is unaffected.
 */
const NodeRequest = globalThis.Request;

class TestRequest extends NodeRequest {
  constructor(input: RequestInfo | URL, init?: RequestInit) {
    if (init && 'signal' in init) {
      const { signal: _dropped, ...rest } = init;
      super(input, rest);
    } else {
      super(input, init);
    }
  }
}

globalThis.Request = TestRequest as typeof Request;
export {};
