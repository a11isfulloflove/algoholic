export const RESULT_PREFIX = '@@R@@'

export interface HarnessTest {
  args: unknown[]
}

export function buildHarness(
  userCode: string,
  functionName: string,
  tests: HarnessTest[],
): string {
  return `${userCode}
;(function () {
  var __fnName = ${JSON.stringify(functionName)};
  var __tests = ${JSON.stringify(tests)};
  function __out(o) { console.log('${RESULT_PREFIX}' + JSON.stringify(o)) }
  var __fn = null
  try {
    var __m = module.exports
    if (typeof __m === 'function') __fn = __m
    else if (__m && typeof __m[__fnName] === 'function') __fn = __m[__fnName]
  } catch (__e) {}
  if (!__fn) {
    __out({ i: -1, err: 'could not find the exported function "' + __fnName + '" — keep the export in your solution' })
  } else {
    for (var __i = 0; __i < __tests.length; __i++) {
      var __r = { i: __i }
      try {
        var __got = __fn.apply(null, __tests[__i].args)
        try {
          __r.got = __got === undefined ? null : __got
          JSON.stringify(__r.got)
        } catch (__se) {
          delete __r.got
          __r.err = 'result cannot be serialized: ' + (__se && __se.message ? __se.message : String(__se))
        }
      } catch (__e) {
        __r.err = __e && __e.message ? __e.message : String(__e)
      }
      __out(__r)
    }
  }
})();
`
}
