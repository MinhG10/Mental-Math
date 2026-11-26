export const byId = id => document.getElementById(id);

export function element(tag, className = '', text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

export function setText(node, value) {
  if (node.textContent !== value) node.textContent = value;
}

export function message(node, text) {
  setText(node, text || '');
  node.hidden = !text;
}

export function fillOptions(select, items) {
  for (const [value, label] of items) select.add(new Option(label, value));
}
