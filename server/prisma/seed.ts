import { PrismaClient, Prisma } from '@prisma/client'

const prisma = new PrismaClient()

interface TestSeed {
  args: unknown[]
  expected: unknown
}

interface ProblemSeed {
  slug: string
  title: string
  categorySlug: string
  difficulty: 'EASY' | 'MEDIUM' | 'HARD'
  description: string
  functionName: string
  starterCodeJs: string
  starterCodeTs: string
  samples: TestSeed[]
  hidden: TestSeed[]
}

const categories = [
  { slug: 'arrays', name: 'Arrays' },
  { slug: 'strings', name: 'Strings' },
  { slug: 'hash-table', name: 'Hash Table' },
  { slug: 'stack', name: 'Stack' },
  { slug: 'binary-search', name: 'Binary Search' },
  { slug: 'math', name: 'Math' },
  { slug: 'dynamic-programming', name: 'Dynamic Programming' },
]

const judgeNote =
  'Keep the function name and the export unchanged — the judge calls your exported function.'

const problems: ProblemSeed[] = [
  {
    slug: 'two-sum',
    title: 'Two Sum',
    categorySlug: 'arrays',
    difficulty: 'EASY',
    functionName: 'twoSum',
    description: [
      'Given an array of integers **nums** and an integer **target**, return the indices of the two numbers that add up to **target**.',
      'Each input has exactly one solution, and you may not use the same element twice. Return the indices in ascending order.',
      '### Examples',
      '- nums = [2,7,11,15], target = 9 → **[0,1]** (2 + 7 = 9)',
      '- nums = [3,2,4], target = 6 → **[1,2]** (2 + 4 = 6)',
      '### Constraints',
      '- 2 <= nums.length <= 1000',
      '- -10^9 <= nums[i] <= 10^9',
      '- exactly one valid answer exists',
      '',
      judgeNote,
    ].join('\n'),
    starterCodeJs: [
      'function twoSum(nums, target) {',
      '  // your code here',
      '}',
      '',
      'module.exports = twoSum',
    ].join('\n'),
    starterCodeTs: [
      'export function twoSum(nums: number[], target: number): number[] {',
      '  // your code here',
      '}',
    ].join('\n'),
    samples: [
      { args: [[2, 7, 11, 15], 9], expected: [0, 1] },
      { args: [[3, 2, 4], 6], expected: [1, 2] },
      { args: [[3, 3], 6], expected: [0, 1] },
    ],
    hidden: [
      { args: [[1, 5, 3, 7, 9], 16], expected: [3, 4] },
      { args: [[5, 75, 25], 100], expected: [1, 2] },
      { args: [[-3, 4, 3, 90], 0], expected: [0, 2] },
      { args: [[0, 4, 3, 0], 0], expected: [0, 3] },
      { args: [[2, 5, 5, 11], 10], expected: [1, 2] },
      { args: [[1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 19], expected: [8, 9] },
      { args: [[-1, -2, -3, -4, -5], -8], expected: [2, 4] },
      { args: [[150, 24, 79, 50, 88, 345, 3], 200], expected: [0, 3] },
    ],
  },
  {
    slug: 'valid-anagram',
    title: 'Valid Anagram',
    categorySlug: 'hash-table',
    difficulty: 'EASY',
    functionName: 'isAnagram',
    description: [
      'Given two strings **s** and **t**, return **true** if **t** is an anagram of **s**, and **false** otherwise.',
      'An anagram is a word formed by rearranging the letters of another word, using all the original letters exactly once.',
      '### Examples',
      '- s = "anagram", t = "nagaram" → **true**',
      '- s = "rat", t = "car" → **false**',
      '### Constraints',
      '- 1 <= s.length, t.length <= 5 * 10^4',
      '- s and t contain lowercase english letters only',
      '',
      judgeNote,
    ].join('\n'),
    starterCodeJs: [
      'function isAnagram(s, t) {',
      '  // your code here',
      '}',
      '',
      'module.exports = isAnagram',
    ].join('\n'),
    starterCodeTs: [
      'export function isAnagram(s: string, t: string): boolean {',
      '  // your code here',
      '}',
    ].join('\n'),
    samples: [
      { args: ['anagram', 'nagaram'], expected: true },
      { args: ['rat', 'car'], expected: false },
    ],
    hidden: [
      { args: ['listen', 'silent'], expected: true },
      { args: ['a', 'ab'], expected: false },
      { args: ['ab', 'a'], expected: false },
      { args: ['aacc', 'ccac'], expected: false },
      { args: ['', ''], expected: true },
      { args: ['ab', 'ba'], expected: true },
      { args: ['abc', 'cba'], expected: true },
      { args: ['aab', 'abb'], expected: false },
    ],
  },
  {
    slug: 'contains-duplicate',
    title: 'Contains Duplicate',
    categorySlug: 'arrays',
    difficulty: 'EASY',
    functionName: 'containsDuplicate',
    description: [
      'Given an integer array **nums**, return **true** if any value appears at least twice in the array, and **false** if every element is distinct.',
      '### Examples',
      '- nums = [1,2,3,1] → **true** (1 appears twice)',
      '- nums = [1,2,3,4] → **false**',
      '### Constraints',
      '- 1 <= nums.length <= 10^5',
      '- -10^9 <= nums[i] <= 10^9',
      '',
      judgeNote,
    ].join('\n'),
    starterCodeJs: [
      'function containsDuplicate(nums) {',
      '  // your code here',
      '}',
      '',
      'module.exports = containsDuplicate',
    ].join('\n'),
    starterCodeTs: [
      'export function containsDuplicate(nums: number[]): boolean {',
      '  // your code here',
      '}',
    ].join('\n'),
    samples: [
      { args: [[1, 2, 3, 1]], expected: true },
      { args: [[1, 2, 3, 4]], expected: false },
    ],
    hidden: [
      { args: [[1, 1, 1, 3, 3, 4, 3, 2, 4, 2]], expected: true },
      { args: [[]], expected: false },
      { args: [[1]], expected: false },
      { args: [[10, 9, 8, 7, 6, 5, 4, 3, 2, 1]], expected: false },
      { args: [[0, 4, 5, 0, 3, 6]], expected: true },
      { args: [[-1, -2, -3, -1]], expected: true },
      { args: [[1000000000, 999999999, 1000000000]], expected: true },
    ],
  },
  {
    slug: 'best-time-to-buy-and-sell-stock',
    title: 'Best Time to Buy and Sell Stock',
    categorySlug: 'arrays',
    difficulty: 'EASY',
    functionName: 'maxProfit',
    description: [
      'You are given an array **prices** where prices[i] is the price of a stock on day i.',
      'Choose one day to buy and a later day to sell. Return the maximum profit. If no profit is possible, return **0**.',
      '### Examples',
      '- prices = [7,1,5,3,6,4] → **5** (buy at 1, sell at 6)',
      '- prices = [7,6,4,3,1] → **0** (prices only fall, no transaction)',
      '### Constraints',
      '- 1 <= prices.length <= 10^5',
      '- 0 <= prices[i] <= 10^4',
      '',
      judgeNote,
    ].join('\n'),
    starterCodeJs: [
      'function maxProfit(prices) {',
      '  // your code here',
      '}',
      '',
      'module.exports = maxProfit',
    ].join('\n'),
    starterCodeTs: [
      'export function maxProfit(prices: number[]): number {',
      '  // your code here',
      '}',
    ].join('\n'),
    samples: [
      { args: [[7, 1, 5, 3, 6, 4]], expected: 5 },
      { args: [[7, 6, 4, 3, 1]], expected: 0 },
    ],
    hidden: [
      { args: [[2, 4, 1]], expected: 2 },
      { args: [[1, 2]], expected: 1 },
      { args: [[3, 3]], expected: 0 },
      { args: [[2, 1, 2, 1, 0, 1, 2]], expected: 2 },
      { args: [[3, 2, 6, 5, 0, 3]], expected: 4 },
      { args: [[1]], expected: 0 },
      { args: [[]], expected: 0 },
    ],
  },
  {
    slug: 'valid-parentheses',
    title: 'Valid Parentheses',
    categorySlug: 'stack',
    difficulty: 'EASY',
    functionName: 'isValid',
    description: [
      'Given a string **s** containing only the characters ()[]{}, determine if the input string is valid.',
      'A string is valid if open brackets are closed by the same type of bracket, and in the correct order.',
      '### Examples',
      '- s = "()[]{}" → **true**',
      '- s = "(]" → **false**',
      '- s = "([)]" → **false**',
      '### Constraints',
      '- 1 <= s.length <= 10^4',
      '- s consists of parentheses only',
      '',
      judgeNote,
    ].join('\n'),
    starterCodeJs: [
      'function isValid(s) {',
      '  // your code here',
      '}',
      '',
      'module.exports = isValid',
    ].join('\n'),
    starterCodeTs: [
      'export function isValid(s: string): boolean {',
      '  // your code here',
      '}',
    ].join('\n'),
    samples: [
      { args: ['()[]{}'], expected: true },
      { args: ['(]'], expected: false },
    ],
    hidden: [
      { args: ['('], expected: false },
      { args: [')('], expected: false },
      { args: ['([)]'], expected: false },
      { args: ['{[]}'], expected: true },
      { args: [''], expected: true },
      { args: ['((((()))))'], expected: true },
      { args: ['((('], expected: false },
      { args: [']'], expected: false },
    ],
  },
  {
    slug: 'binary-search',
    title: 'Binary Search',
    categorySlug: 'binary-search',
    difficulty: 'EASY',
    functionName: 'search',
    description: [
      'Given a sorted (in ascending order) integer array **nums** and an integer **target**, return the index of **target**, or **-1** if it is not in the array.',
      'Your algorithm must run in O(log n) time.',
      '### Examples',
      '- nums = [-1,0,3,5,9,12], target = 9 → **4**',
      '- nums = [-1,0,3,5,9,12], target = 2 → **-1**',
      '### Constraints',
      '- 1 <= nums.length <= 10^4',
      '- all values in nums are unique',
      '',
      judgeNote,
    ].join('\n'),
    starterCodeJs: [
      'function search(nums, target) {',
      '  // your code here',
      '}',
      '',
      'module.exports = search',
    ].join('\n'),
    starterCodeTs: [
      'export function search(nums: number[], target: number): number {',
      '  // your code here',
      '}',
    ].join('\n'),
    samples: [
      { args: [[-1, 0, 3, 5, 9, 12], 9], expected: 4 },
      { args: [[-1, 0, 3, 5, 9, 12], 2], expected: -1 },
    ],
    hidden: [
      { args: [[5], 5], expected: 0 },
      { args: [[5], -5], expected: -1 },
      { args: [[1, 3, 5, 7, 9, 11, 13], 11], expected: 5 },
      { args: [[1, 3, 5, 7, 9, 11, 13], 1], expected: 0 },
      { args: [[1, 3, 5, 7, 9, 11, 13], 14], expected: -1 },
      { args: [[2, 5], 5], expected: 1 },
      { args: [[-9, -7, -5, -3], -7], expected: 1 },
      { args: [[1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 6], expected: 5 },
    ],
  },
  {
    slug: 'climbing-stairs',
    title: 'Climbing Stairs',
    categorySlug: 'math',
    difficulty: 'EASY',
    functionName: 'climbStairs',
    description: [
      'You are climbing a staircase with **n** steps. Each time you can climb either 1 or 2 steps. In how many distinct ways can you reach the top?',
      '### Examples',
      '- n = 2 → **2** (1+1, 2)',
      '- n = 3 → **3** (1+1+1, 1+2, 2+1)',
      '### Constraints',
      '- 1 <= n <= 45',
      '',
      judgeNote,
    ].join('\n'),
    starterCodeJs: [
      'function climbStairs(n) {',
      '  // your code here',
      '}',
      '',
      'module.exports = climbStairs',
    ].join('\n'),
    starterCodeTs: [
      'export function climbStairs(n: number): number {',
      '  // your code here',
      '}',
    ].join('\n'),
    samples: [
      { args: [2], expected: 2 },
      { args: [3], expected: 3 },
    ],
    hidden: [
      { args: [1], expected: 1 },
      { args: [4], expected: 5 },
      { args: [5], expected: 8 },
      { args: [10], expected: 89 },
      { args: [20], expected: 10946 },
      { args: [30], expected: 1346269 },
      { args: [35], expected: 14930352 },
    ],
  },
  {
    slug: 'maximum-subarray',
    title: 'Maximum Subarray',
    categorySlug: 'dynamic-programming',
    difficulty: 'MEDIUM',
    functionName: 'maxSubArray',
    description: [
      'Given an integer array **nums**, find the contiguous subarray with the largest sum and return that sum.',
      '### Examples',
      '- nums = [-2,1,-3,4,-1,2,1,-5,4] → **6** (subarray [4,-1,2,1])',
      '- nums = [1] → **1**',
      '### Constraints',
      '- 1 <= nums.length <= 10^5',
      '- -10^4 <= nums[i] <= 10^4',
      '',
      judgeNote,
    ].join('\n'),
    starterCodeJs: [
      'function maxSubArray(nums) {',
      '  // your code here',
      '}',
      '',
      'module.exports = maxSubArray',
    ].join('\n'),
    starterCodeTs: [
      'export function maxSubArray(nums: number[]): number {',
      '  // your code here',
      '}',
    ].join('\n'),
    samples: [
      { args: [[-2, 1, -3, 4, -1, 2, 1, -5, 4]], expected: 6 },
      { args: [[1]], expected: 1 },
    ],
    hidden: [
      { args: [[5, 4, -1, 7, 8]], expected: 23 },
      { args: [[-1]], expected: -1 },
      { args: [[-2, -1]], expected: -1 },
      { args: [[0]], expected: 0 },
      { args: [[-2, 1]], expected: 1 },
      { args: [[1, 2, -1, 3, 4, -5, 6]], expected: 10 },
      { args: [[8, -19, 5, -4, 20]], expected: 21 },
      { args: [[-5, -2, -8, -1]], expected: -1 },
    ],
  },
  {
    slug: 'merge-intervals',
    title: 'Merge Intervals',
    categorySlug: 'arrays',
    difficulty: 'MEDIUM',
    functionName: 'merge',
    description: [
      'Given an array of **intervals** where intervals[i] = [start, end], merge all overlapping intervals and return the result sorted by start.',
      'Intervals that touch at a point (end == start of another) count as overlapping.',
      '### Examples',
      '- intervals = [[1,3],[2,6],[8,10],[15,18]] → **[[1,6],[8,10],[15,18]]**',
      '- intervals = [[1,4],[4,5]] → **[[1,5]]**',
      '### Constraints',
      '- 1 <= intervals.length <= 10^4',
      '- intervals[i].length == 2',
      '- 0 <= start <= end <= 10^4',
      '',
      judgeNote,
    ].join('\n'),
    starterCodeJs: [
      'function merge(intervals) {',
      '  // your code here',
      '}',
      '',
      'module.exports = merge',
    ].join('\n'),
    starterCodeTs: [
      'export function merge(intervals: number[][]): number[][] {',
      '  // your code here',
      '}',
    ].join('\n'),
    samples: [
      { args: [[[1, 3], [2, 6], [8, 10], [15, 18]]], expected: [[1, 6], [8, 10], [15, 18]] },
      { args: [[[1, 4], [4, 5]]], expected: [[1, 5]] },
    ],
    hidden: [
      { args: [[[1, 4], [0, 4]]], expected: [[0, 4]] },
      { args: [[[1, 4], [2, 3]]], expected: [[1, 4]] },
      { args: [[]], expected: [] },
      { args: [[[1, 1]]], expected: [[1, 1]] },
      { args: [[[1, 10], [2, 3], [4, 5], [11, 12]]], expected: [[1, 10], [11, 12]] },
      { args: [[[5, 6], [1, 2]]], expected: [[1, 2], [5, 6]] },
      { args: [[[3, 5], [1, 4], [9, 10], [2, 7]]], expected: [[1, 7], [9, 10]] },
      { args: [[[1, 3], [5, 8], [4, 10], [20, 25]]], expected: [[1, 3], [4, 10], [20, 25]] },
    ],
  },
  {
    slug: 'longest-substring-without-repeating-characters',
    title: 'Longest Substring Without Repeating Characters',
    categorySlug: 'strings',
    difficulty: 'MEDIUM',
    functionName: 'lengthOfLongestSubstring',
    description: [
      'Given a string **s**, find the length of the longest substring without repeating characters.',
      'A substring is a contiguous sequence of characters — not a subsequence.',
      '### Examples',
      '- s = "abcabcbb" → **3** ("abc")',
      '- s = "bbbbb" → **1** ("b")',
      '- s = "pwwkew" → **3** ("wke")',
      '### Constraints',
      '- 0 <= s.length <= 5 * 10^4',
      '- s consists of english letters, digits, symbols and spaces',
      '',
      judgeNote,
    ].join('\n'),
    starterCodeJs: [
      'function lengthOfLongestSubstring(s) {',
      '  // your code here',
      '}',
      '',
      'module.exports = lengthOfLongestSubstring',
    ].join('\n'),
    starterCodeTs: [
      'export function lengthOfLongestSubstring(s: string): number {',
      '  // your code here',
      '}',
    ].join('\n'),
    samples: [
      { args: ['abcabcbb'], expected: 3 },
      { args: ['bbbbb'], expected: 1 },
      { args: ['pwwkew'], expected: 3 },
    ],
    hidden: [
      { args: [''], expected: 0 },
      { args: ['a'], expected: 1 },
      { args: ['au'], expected: 2 },
      { args: ['dvdf'], expected: 3 },
      { args: ['abba'], expected: 2 },
      { args: ['tmmzuxt'], expected: 5 },
      { args: ['abcdef'], expected: 6 },
      { args: ['anviaj'], expected: 5 },
      { args: ['aabaab!bb'], expected: 3 },
    ],
  },
]

async function main() {
  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      create: category,
      update: category,
    })
  }

  for (const p of problems) {
    const tests = [
      ...p.samples.map((t, i) => ({ ...t, isSample: true, orderIndex: i })),
      ...p.hidden.map((t, i) => ({ ...t, isSample: false, orderIndex: p.samples.length + i })),
    ].map((t) => ({
      args: t.args as Prisma.InputJsonValue,
      expected: t.expected as Prisma.InputJsonValue,
      isSample: t.isSample,
      orderIndex: t.orderIndex,
    }))

    await prisma.problem.upsert({
      where: { slug: p.slug },
      create: {
        slug: p.slug,
        title: p.title,
        description: p.description,
        difficulty: p.difficulty,
        category: { connect: { slug: p.categorySlug } },
        functionName: p.functionName,
        starterCodeJs: p.starterCodeJs,
        starterCodeTs: p.starterCodeTs,
        tests: { create: tests },
      },
      update: {
        title: p.title,
        description: p.description,
        difficulty: p.difficulty,
        category: { connect: { slug: p.categorySlug } },
        functionName: p.functionName,
        starterCodeJs: p.starterCodeJs,
        starterCodeTs: p.starterCodeTs,
        tests: { deleteMany: {}, create: tests },
      },
    })
  }

  const [problemCount, testCount, categoryCount] = await Promise.all([
    prisma.problem.count(),
    prisma.testCase.count(),
    prisma.category.count(),
  ])
  console.log(
    `[seed] done: ${problemCount} problems, ${testCount} tests, ${categoryCount} categories`,
  )
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
