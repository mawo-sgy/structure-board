import { uid } from './theme.js';

// Starter boards for common exercises. Each build() returns a fresh board state.
const view0 = () => ({ x: 20, y: 10, s: 1 });
const clone = (x) => JSON.parse(JSON.stringify(x));

// A board that opens on step 1 of a recorded walkthrough; press → to replay.
// frames: [{ label, note, blocks, links }]
function walkthrough(frames) {
  const steps = frames.map((f) => ({ id: uid(), label: f.label || '', note: f.note || '', blocks: clone(f.blocks), links: clone(f.links) }));
  return { view: view0(), blocks: clone(frames[0].blocks), links: clone(frames[0].links), steps, viewing: steps[0].id };
}

export const TEMPLATES = [
  {
    key: 'bubble',
    name: 'Bubble sort',
    build: () => ({
      view: view0(),
      links: [],
      blocks: [
        { id: 'h', type: 'heading', x: 60, y: 40, color: null, text: 'Bubble sort — trace' },
        { id: 'a', type: 'array', x: 60, y: 104, color: null, elemType: 'int', name: 'tab', cells: ['5', '1', '4', '2', '8'],
          markers: [{ id: 'mj', name: 'j', index: 0, color: 'blue' }, { id: 'mj1', name: 'j+1', index: 1, color: 'green' }] },
        { id: 'vn', type: 'variables', x: 420, y: 98, color: null, varType: 'int', name: 'n', value: '5' },
        { id: 'vi', type: 'variables', x: 500, y: 98, color: null, varType: 'int', name: 'i', value: '0' },
        { id: 'c', type: 'code', x: 60, y: 270, w: 440, color: null, title: 'bubble_sort.c', text:
          'void bubble_sort(int tab[], int n) {\n    for (int i = 0; i < n - 1; i++) {\n        for (int j = 0; j < n - 1 - i; j++) {\n            if (tab[j] > tab[j + 1]) {\n                int tmp = tab[j];\n                tab[j] = tab[j + 1];\n                tab[j + 1] = tmp;\n            }\n        }\n    }\n}' },
        { id: 't', type: 'table', x: 560, y: 270, color: null, cols: ['i', 'j', 'tab[j]', 'tab[j+1]', 'swap?'], rows: [['', '', '', '', ''], ['', '', '', '', ''], ['', '', '', '', '']] },
        { id: 'n', type: 'note', x: 560, y: 440, w: 300, color: null, text: 'Move j and j+1, swap the cells when needed,\nthen press S to save a step.\nReplay the pass with ← / →.' },
      ],
    }),
  },
  {
    key: 'reverse',
    name: 'Reverse a linked list',
    build: () => ({
      view: view0(),
      blocks: [
        { id: 'h', type: 'heading', x: 60, y: 40, color: null, text: 'Reverse a linked list' },
        { id: 'n1', type: 'list', x: 60, y: 110, color: null, value: '1' },
        { id: 'n2', type: 'list', x: 210, y: 110, color: null, value: '2' },
        { id: 'n3', type: 'list', x: 360, y: 110, color: null, value: '3' },
        { id: 'n4', type: 'list', x: 510, y: 110, color: null, value: '4' },
        { id: 'pprev', type: 'variables', x: 60, y: 230, color: 'red', varType: 'Node*', name: 'prev', value: '' },
        { id: 'pcurr', type: 'variables', x: 170, y: 230, color: 'blue', varType: 'Node*', name: 'curr', value: '' },
        { id: 'pnext', type: 'variables', x: 280, y: 230, color: 'green', varType: 'Node*', name: 'next', value: '' },
        { id: 'c', type: 'code', x: 60, y: 360, w: 420, color: null, title: 'reverse.c', text:
          'Node* reverse(Node* head) {\n    Node* prev = NULL;\n    Node* curr = head;\n    while (curr != NULL) {\n        Node* next = curr->next;\n        curr->next = prev;\n        prev = curr;\n        curr = next;\n    }\n    return prev;\n}' },
        { id: 'nt', type: 'note', x: 540, y: 360, w: 320, color: null, text: 'Each iteration re-points one next arrow:\n    1. next = curr->next\n    2. drag curr\'s next cell onto prev\n    3. move prev, then curr\nPress S after each iteration.' },
      ],
      links: [
        { id: 'l1', from: 'n1', to: 'n2', next: true, slot: 'next' },
        { id: 'l2', from: 'n2', to: 'n3', next: true, slot: 'next' },
        { id: 'l3', from: 'n3', to: 'n4', next: true, slot: 'next' },
        { id: 'l4', from: 'pcurr', to: 'n1', next: true, slot: 'ptr' },
      ],
    }),
  },
  {
    key: 'bsearch',
    name: 'Binary search',
    build: () => ({
      view: view0(),
      links: [],
      blocks: [
        { id: 'h', type: 'heading', x: 60, y: 40, color: null, text: 'Binary search' },
        { id: 'a', type: 'array', x: 60, y: 104, color: null, elemType: 'int', name: 'tab', cells: ['1', '3', '4', '7', '9', '11', '15'],
          markers: [{ id: 'lo', name: 'lo', index: 0, color: 'blue' }, { id: 'mid', name: 'mid', index: 3, color: 'yellow' }, { id: 'hi', name: 'hi', index: 6, color: 'red' }] },
        { id: 'vt', type: 'variables', x: 460, y: 98, color: null, varType: 'int', name: 'target', value: '9' },
        { id: 'c', type: 'code', x: 60, y: 280, w: 460, color: null, title: 'binary_search.c', text:
          'int binary_search(int tab[], int n, int target) {\n    int lo = 0, hi = n - 1;\n    while (lo <= hi) {\n        int mid = lo + (hi - lo) / 2;\n        if (tab[mid] == target) return mid;\n        if (tab[mid] < target) lo = mid + 1;\n        else hi = mid - 1;\n    }\n    return -1;\n}' },
        { id: 't', type: 'table', x: 580, y: 280, color: null, cols: ['lo', 'hi', 'mid', 'tab[mid]'], rows: [['0', '6', '3', '7'], ['', '', '', ''], ['', '', '', '']] },
      ],
    }),
  },
  {
    key: 'insertion',
    name: 'Insertion sort',
    build: () => ({
      view: view0(),
      links: [],
      blocks: [
        { id: 'h', type: 'heading', x: 60, y: 40, color: null, text: 'Insertion sort — trace' },
        { id: 'a', type: 'array', x: 60, y: 104, color: null, elemType: 'int', name: 'tab', cells: ['5', '2', '4', '6', '1', '3'],
          markers: [{ id: 'mi', name: 'i', index: 1, color: 'blue' }, { id: 'mj', name: 'j', index: 0, color: 'green' }] },
        { id: 'vk', type: 'variables', x: 420, y: 98, color: 'yellow', varType: 'int', name: 'key', value: '2' },
        { id: 'vi', type: 'variables', x: 510, y: 98, color: null, varType: 'int', name: 'i', value: '1' },
        { id: 'vj', type: 'variables', x: 590, y: 98, color: null, varType: 'int', name: 'j', value: '0' },
        { id: 'c', type: 'code', x: 60, y: 270, w: 460, color: null, title: 'insertion_sort.c', text:
          'void insertion_sort(int tab[], int n) {\n    for (int i = 1; i < n; i++) {\n        int key = tab[i];\n        int j = i - 1;\n        while (j >= 0 && tab[j] > key) {\n            tab[j + 1] = tab[j];   // shift right\n            j--;\n        }\n        tab[j + 1] = key;\n    }\n}' },
        { id: 't', type: 'table', x: 580, y: 270, color: null, cols: ['i', 'key', 'j', 'tab after'], rows: [['', '', '', ''], ['', '', '', ''], ['', '', '', '']] },
        { id: 'n', type: 'note', x: 580, y: 420, w: 320, color: null, text: 'Everything left of i is already sorted.\nLift key out, shift bigger values one cell right,\nthen drop key into the gap.\nPress S after each shift.' },
      ],
    }),
  },
  {
    key: 'stackarr',
    name: 'Stack using an array',
    build: () => ({
      view: view0(),
      links: [],
      blocks: [
        { id: 'h', type: 'heading', x: 60, y: 40, color: null, text: 'Stack using an array' },
        { id: 'a', type: 'array', x: 60, y: 104, color: 'blue', elemType: 'int', name: 'data', cells: ['4', '7', '2', '', '', ''],
          markers: [{ id: 'mt', name: 'top', index: 2, color: 'red' }] },
        { id: 'vt', type: 'variables', x: 420, y: 98, color: null, varType: 'int', name: 'top', value: '2' },
        { id: 'vc', type: 'variables', x: 500, y: 98, color: null, varType: '#define', name: 'CAP', value: '6' },
        { id: 's', type: 'stack', x: 640, y: 98, color: null, name: 's', items: ['4', '7', '2'] },
        { id: 'c', type: 'code', x: 60, y: 280, w: 460, color: null, title: 'stack.c', text:
          '#define CAP 6\nint data[CAP];\nint top = -1;          // index of the top element\n\nvoid push(int x) {\n    if (top == CAP - 1) return;   // full\n    data[++top] = x;\n}\n\nint pop(void) {\n    if (top == -1) return -1;     // empty\n    return data[top--];\n}' },
        { id: 'n', type: 'note', x: 580, y: 300, w: 330, color: null, text: 'The stack block on the right is the idea;\nthe array on the left is how C stores it.\nPush 5: move top one cell right, write 5.\nPop: read data[top], then move top left.\nPress S after each operation.' },
      ],
    }),
  },
  {
    key: 'circular',
    name: 'Queue as a circular buffer',
    build: () => ({
      view: view0(),
      links: [],
      blocks: [
        { id: 'h', type: 'heading', x: 60, y: 40, color: null, text: 'Queue as a circular buffer' },
        { id: 'a', type: 'array', x: 60, y: 104, color: null, elemType: 'int', name: 'buf', cells: ['', '', '3', '8', '5', ''],
          markers: [{ id: 'mh', name: 'head', index: 2, color: 'blue' }, { id: 'mt', name: 'tail', index: 5, color: 'green' }] },
        { id: 'vh', type: 'variables', x: 420, y: 98, color: 'blue', varType: 'int', name: 'head', value: '2' },
        { id: 'vt', type: 'variables', x: 510, y: 98, color: 'green', varType: 'int', name: 'tail', value: '5' },
        { id: 'vc', type: 'variables', x: 600, y: 98, color: null, varType: 'int', name: 'count', value: '3' },
        { id: 'c', type: 'code', x: 60, y: 280, w: 480, color: null, title: 'ring_queue.c', text:
          '#define CAP 6\nint buf[CAP];\nint head = 0, tail = 0, count = 0;\n\nvoid enqueue(int x) {\n    if (count == CAP) return;        // full\n    buf[tail] = x;\n    tail = (tail + 1) % CAP;         // wrap around\n    count++;\n}\n\nint dequeue(void) {\n    if (count == 0) return -1;       // empty\n    int x = buf[head];\n    head = (head + 1) % CAP;\n    count--;\n    return x;\n}' },
        { id: 'n', type: 'note', x: 600, y: 280, w: 320, color: null, text: 'head = oldest element, tail = next free cell.\nTry: enqueue 9, then enqueue 1 —\ntail wraps from 5 back to 0.\n% CAP is what turns the array into a ring.\nPress S after each operation.' },
      ],
    }),
  },
  {
    key: 'tree',
    name: 'Binary tree walk',
    build: () => {
      const node = (id, x, y, value) => ({ id, type: 'tree', x, y, color: null, value });
      const edge = (from, slot, to) => ({ id: `${from}${slot}`, from, to, next: true, slot });
      return {
        view: view0(),
        blocks: [
          { id: 'h', type: 'heading', x: 60, y: 40, color: null, text: 'Binary search tree — in-order walk' },
          { id: 'root', type: 'variables', x: 80, y: 104, color: 'blue', varType: 'Node*', name: 'root', value: '' },
          node('t8', 360, 110, '8'),
          node('t3', 200, 220, '3'),
          node('t10', 520, 220, '10'),
          node('t1', 110, 330, '1'),
          node('t6', 290, 330, '6'),
          node('t14', 610, 330, '14'),
          { id: 'calls', type: 'stack', x: 800, y: 110, color: null, name: 'calls', items: [] },
          { id: 'out', type: 'queue', x: 560, y: 460, color: 'green', name: 'printed', items: [] },
          { id: 'c', type: 'code', x: 60, y: 460, w: 440, color: null, title: 'inorder.c', text:
            'typedef struct Node {\n    int value;\n    struct Node *left, *right;\n} Node;\n\nvoid inorder(Node* n) {\n    if (n == NULL) return;\n    inorder(n->left);\n    printf("%d ", n->value);\n    inorder(n->right);\n}' },
          { id: 'n', type: 'note', x: 560, y: 580, w: 360, color: null, text: 'In-order = left subtree, node, right subtree.\nPush each call on "calls", pop it when it returns,\nenqueue a value when it is printed.\nOn a BST the output comes out sorted:\n    1 3 6 8 10 14' },
        ],
        links: [
          { id: 'lroot', from: 'root', to: 't8', next: true, slot: 'ptr' },
          edge('t8', 'left', 't3'), edge('t8', 'right', 't10'),
          edge('t3', 'left', 't1'), edge('t3', 'right', 't6'),
          edge('t10', 'right', 't14'),
        ],
      };
    },
  },
  {
    key: 'malloc',
    name: 'malloc / free walkthrough',
    build: () => {
      const base = [
        { id: 'h', type: 'heading', x: 60, y: 40, color: null, text: 'malloc / free walkthrough' },
        { id: 'ls', type: 'note', x: 60, y: 96, w: 160, color: null, text: 'Stack (main)' },
        { id: 'lh', type: 'note', x: 300, y: 96, w: 160, color: null, text: 'Heap' },
        { id: 'p', type: 'variables', x: 80, y: 140, color: 'blue', varType: 'int*', name: 'p', value: '' },
        { id: 'c', type: 'code', x: 60, y: 300, w: 420, color: null, title: 'heap.c', text:
          'int main(void) {\n    int *p = NULL;\n    p = malloc(3 * sizeof(int));\n    p[0] = 10; p[1] = 20; p[2] = 30;\n    free(p);\n    p = NULL;\n    return 0;\n}' },
        { id: 'n', type: 'note', x: 540, y: 300, w: 330, color: null, text: 'Press → to replay one line at a time.\nThe note above the step bar says what\nthe line did to memory.' },
      ];
      const heap = (cells, color = null, name = 'block') => ({
        id: 'heap', type: 'array', x: 300, y: 150, color, elemType: 'int', name, cells, markers: [],
      });
      const ptr = [{ id: 'lp', from: 'p', to: 'heap', next: true, slot: 'ptr' }];
      return walkthrough([
        { label: 'p = NULL', note: 'int *p = NULL; — p lives on the stack and points nowhere yet.', blocks: base, links: [] },
        { label: 'malloc', note: 'malloc reserves 12 bytes on the heap and returns their address. The contents are garbage until written.',
          blocks: [...base, heap(['?', '?', '?'])], links: ptr },
        { label: 'write', note: 'p[0], p[1], p[2] write through the pointer into the heap block.',
          blocks: [...base, heap(['10', '20', '30'])], links: ptr },
        { label: 'free', note: 'free(p) gives the block back. p still holds the old address: it is now a dangling pointer.',
          blocks: [...base, heap(['10', '20', '30'], 'red', 'freed')], links: ptr },
        { label: 'p = NULL', note: 'p = NULL; — p no longer leads to freed memory, so a mistaken use fails loudly instead of silently.',
          blocks: [...base, heap(['10', '20', '30'], 'red', 'freed')], links: [] },
      ]);
    },
  },
];
