import { uid } from '../theme.js';
import ArrayBody from './ArrayBlock.jsx';
import ListBody from './LinkedListBlock.jsx';
import TreeNodeBody from './TreeNodeBlock.jsx';
import MatrixBody from './MatrixBlock.jsx';
import StackBody from './StackBlock.jsx';
import QueueBody from './QueueBlock.jsx';
import StructBody from './StructBlock.jsx';
import MemoryBody from './MemoryBlock.jsx';
import TableBody from './TableBlock.jsx';
import VariablesBody from './VariablesBlock.jsx';
import NoteBody from './NoteBlock.jsx';
import PostItBody from './PostItBlock.jsx';
import HeadingBody from './HeadingBlock.jsx';
import CodeBody from './CodeBlock.jsx';

export const BLOCK_DEFS = {
  array:     { label: 'Array',       Body: ArrayBody,     create: () => ({ elemType: 'int', name: 'arr', cells: ['', '', '', ''] }) },
  matrix:    { label: '2D array',    Body: MatrixBody,    create: () => ({ elemType: 'int', name: 'm', rows: Array.from({ length: 3 }, () => ['', '', '', '']) }) },
  list:      { label: 'List node',   Body: ListBody,      create: () => ({ name: 'node', value: '' }) },
  tree:      { label: 'Tree node',   Body: TreeNodeBody,  create: () => ({ value: '' }) },
  stack:     { label: 'Stack',       Body: StackBody,     create: () => ({ name: 's', items: [] }) },
  queue:     { label: 'Queue',       Body: QueueBody,     create: () => ({ name: 'q', items: [] }) },
  struct:    { label: 'Struct',      Body: StructBody,    create: () => ({ name: 'Node', instance: 'n', fields: [{ id: uid(), type: 'int', name: 'value', value: '' }, { id: uid(), type: 'struct Node*', name: 'next', value: '' }] }) },
  memory:    { label: 'Memory',      Body: MemoryBody,    create: () => ({ rows: [{ addr: '0x1000', name: 'x', type: 'int', value: '42' }, { addr: '0x1008', name: 'p', type: 'int*', value: '0x1000' }] }) },
  table:     { label: 'Table',       Body: TableBody,     create: () => ({ cols: ['i', 'tab[i]', 'max'], rows: [['', '', ''], ['', '', '']] }) },
  variables: { label: 'Variable',    Body: VariablesBody, create: () => ({ varType: 'int', name: 'x', value: '' }) },
  pointer:   { label: 'Pointer',     Body: VariablesBody, create: () => ({ varType: 'int*', name: 'p', value: '' }) },
  note:      { label: 'Note',        Body: NoteBody,      w: 280, create: () => ({ text: '' }) },
  postit:    { label: 'Post-it',     Body: PostItBody,    w: 200, color: 'yellow', create: () => ({ text: '' }) },
  heading:   { label: 'Heading',     Body: HeadingBody,   create: () => ({ text: 'Section title' }) },
  code:      { label: 'Code',        Body: CodeBody,      w: 420, create: () => ({ title: 'main.c', text: 'int main(void) {\n    \n    return 0;\n}' }) },
};

export const MENUS = [
  { label: 'Structures', types: ['array', 'matrix', 'list', 'tree', 'stack', 'queue', 'struct', 'memory'] },
  { label: 'Tables', types: ['table', 'variables', 'pointer'] },
  { label: 'Notes', types: ['note', 'postit', 'heading'] },
];

export function createBlock(type, x, y) {
  const def = BLOCK_DEFS[type];
  return {
    id: uid(), type, x: Math.round(x), y: Math.round(y), color: def.color ?? null,
    ...(def.w ? { w: def.w } : {}),
    ...def.create(),
  };
}
