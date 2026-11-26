function clean(line: string) {
  return line
    .replace(/[\p{Extended_Pictographic}\uFE0F\u200D]/gu, "")
    .replace(/^[\s✓✔✅•–-]+/u, "")
    .trim();
}

export function descriptionLines(description: string) {
  return description
    .split(/\r?\n/)
    .map((line) => ({
      text: clean(line),
      bullet: /^\s*[-•✓✔✅🔹]/u.test(line),
    }))
    .filter((line) => line.text);
}

export function ProductDescription({ description }: { description: string }) {
  const lines = descriptionLines(description);
  const blocks: React.ReactNode[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.bullet) {
      const items = [line.text];
      while (lines[i + 1]?.bullet) items.push(lines[++i].text);
      blocks.push(
        <ul key={i}>
          {items.map((text, index) => (
            <li key={index}>{text}</li>
          ))}
        </ul>,
      );
    } else if (line.text.endsWith(":") && line.text.length < 100) {
      blocks.push(<h3 key={i}>{line.text.slice(0, -1)}</h3>);
    } else {
      blocks.push(<p key={i}>{line.text}</p>);
    }
  }
  return <div className="product-description-content">{blocks}</div>;
}
