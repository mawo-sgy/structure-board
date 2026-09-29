import { T } from '../theme.js';
import { AutoInput } from '../controls.jsx';

export default function HeadingBody({ block, patch }) {
  return (
    <AutoInput
      value={block.text}
      placeholder="Heading"
      min={6}
      onChange={(v) => patch({ text: v })}
      style={{
        font: `700 22px/1.3 ${T.sans}`, letterSpacing: '-0.01em', color: T.ink,
        ...(block.w ? { width: '100%' } : null),
      }}
    />
  );
}
