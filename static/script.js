// Updated script.js with reasoning support


export function detectLanguage(code) {
  const patterns = [
    { lang: "javascript", regex: /\b(function|const|let|var|=>|console\.log|import |export |document\.|window\.|async|await|fetch|Promise)\b/g, weight: 2 },
    { lang: "python",   regex: /\b(def |import |from |print\(|class |self\.|lambda |async def |if __name__ == ["']__main__["']|try:|except |with |open\()/g, weight: 2 },
    { lang: "php",      regex: /<\?php|echo\s+["'].*["'];|function\s+\w+\(|\$[a-zA-Z_][a-zA-Z0-9_]*\s*=/g, weight: 5 },
    { lang: "java",     regex: /\b(public|private|protected|class\s+\w+|static\s+void\s+main|System\.out\.println|import\s+java\.)\b/g, weight: 3 },
    { lang: "c",        regex: /\b(#include\s+<.+?>|int\s+main\(\)|printf\(|scanf\(|return\s+\d+;)\b/g, weight: 3 },
    { lang: "cpp",      regex: /\b(#include\s+<.+?>|std::cout|cout|cin|std::cin|std::vector|std::string|namespace\s+\w+|class\s+\w+|new |delete |->)\b/g, weight: 3 },
    { lang: "html",     regex: /<\s*(!DOCTYPE\s+html|html|head|body|div|span|p|a|img|script|link|meta|title|h[1-6])[\s>]/gi, weight: 3 },
    { lang: "css",      regex: /\b(color|background|margin|padding|font-size|display|position|grid|flex|justify-content|align-items|border|width|height)\s*:[^;]+;/g, weight: 2 },
    { lang: "yaml",     regex: /^(?!.*;)\s*[A-Za-z0-9_-]+:\s+[^:\n]+$/gm, weight: 3 },
    { lang: "json",     regex: /^\s*(\{[\s\S]*\}|\[[\s\S]*\])\s*$/gm, weight: 3 },
    { lang: "bash",     regex: /(^#!\/bin\/bash)|\b(echo|cd|ls|rm|grep|chmod|chown|sudo|export|alias|source|curl|wget)\b/g, weight: 3 },
    { lang: "ruby",     regex: /\b(def |class |module |end|puts |require |include |attr_accessor |begin |rescue |elsif |unless)\b/g, weight: 2 },
    { lang: "swift",    regex: /\b(let |var |func |print\(|import Foundation|class |struct |enum |if |else |switch |case |guard |defer)\b/g, weight: 2 },
    { lang: "go",       regex: /\b(package |import |func |defer |go |chan |interface |map |struct |type |var |fmt\.)\b/g, weight: 3 },
    { lang: "kotlin",   regex: /\b(fun |val |var |class |object |companion |data class |import |when |is |as |println\()/g, weight: 2 },
    { lang: "typescript",regex:/\b(let|const|var|function|interface\s+\w+|type\s+\w+\s*=|enum\s+\w+|public |private |readonly |implements)\b/g, weight: 2 },
    { lang: "sql",      regex: /\b(SELECT|INSERT|UPDATE|DELETE|FROM|WHERE|JOIN|INNER JOIN|LEFT JOIN|RIGHT JOIN|GROUP BY|ORDER BY|LIMIT|HAVING)\b/gi, weight: 3 },
    { lang: "xml",      regex: /^\s*<\?xml\b[^>]*\?>/g, weight: 3 },
    { lang: "dockerfile",regex:/\b(FROM |RUN |CMD |LABEL |EXPOSE |ENV |ADD |COPY |ENTRYPOINT |WORKDIR |VOLUME)\b/g, weight: 3 },
    { lang: "makefile", regex: /^[a-zA-Z0-9_-]+:\s*\n\s*(\t|\s{4})\w+/gm, weight: 3 }
  ];

  let scores = {};
  for (const { lang, regex, weight } of patterns) {
    const matchCount = (code.match(regex) || []).length;
    if (matchCount) scores[lang] = (scores[lang] || 0) + matchCount * weight;
  }

  const detected = Object.keys(scores).reduce((best, lang) => {
    if (best === null || scores[lang] > scores[best]) return lang;
    return best;
  }, null);

  return detected || "markdown";
}

// --- TABLE HELPERS ---
function splitRow(row) {
  let r = row.trim();
  if (r.startsWith('|')) r = r.slice(1);
  if (r.endsWith('|')) r = r.slice(0, -1);
  return r.split('|').map(c => c.trim());
}

function isTableSeparator(line) {
  const cells = splitRow(line).filter(c => c.length);
  return cells.length && cells.every(c => /^:?-{3,}:?$/.test(c));
}

function parseTableBlock(header, sep, rows) {
  const headers = splitRow(header);
  const aligns = splitRow(sep).map(cell => {
    if (cell.startsWith(':') && cell.endsWith(':')) return 'center';
    if (cell.startsWith(':')) return 'left';
    if (cell.endsWith(':')) return 'right';
    return 'left';
  });
  let thead = '<thead><tr>' + headers.map((h,i) => `<th class="align-${aligns[i]||'left'}">${h}</th>`).join('') + '</tr></thead>';
  let tbody = '<tbody>' + rows.map(r => {
    const cells = splitRow(r);
    return '<tr>' + headers.map((_,i) => `<td class="align-${aligns[i]||'left'}">${cells[i]||''}</td>`).join('') + '</tr>';
  }).join('') + '</tbody>';
  return `<div class="tbl-out"><table class="chatgpt-table">${thead}${tbody}</table></div>`;
}

function handleTableFormatting(text) {
  const lines = text.split('\n');
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('|') && lines[i+1] && isTableSeparator(lines[i+1])) {
      const header = lines[i], sep = lines[i+1];
      const rows = [];
      i += 2;
      while (lines[i] && lines[i].includes('|')) { rows.push(lines[i++]); }
      out.push(parseTableBlock(header, sep, rows));
      i--;
    } else out.push(lines[i]);
  }
  return out.join('\n');
}

// --- ESCAPE HTML ---
function escapeHtml(str) {
  return str.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
}

// --- REASONING PARSER ---
// --- REASONING PARSER — improved streaming support ---
function parseReasoning(text) {
  const thinkingBlocks = [];
  // Matches each <think>…</think> or an unterminated <think>… at end-of-string
  text = text.replace(
    /<think>([\s\S]*?)(?:<\/think>|$)/g,
    (match, content) => {
      // complete if we actually saw a closing tag
      const complete = /<\/think>$/.test(match);
      thinkingBlocks.push({ content: content.trim(), complete });
      return `@@THINK${thinkingBlocks.length - 1}@@`;
    }
  );
  return { text, thinkingBlocks };
}

function parseExecCode(text) {
  const execCodeBlocks = [];
  

  text = text.replace(/###CODE_EXEC([\s\S]*?)###CODE_EXEC/g, (match, code) => {
    // Clean up the code - remove leading/trailing whitespace but preserve internal formatting
    const cleanCode = code.trim();
    execCodeBlocks.push(cleanCode);
    return `@@EXEC${execCodeBlocks.length-1}@@`;
  });
  
  return { text, execCodeBlocks };
}

// Add this function to restore exec-code blocks
function restoreExecCodeBlocks(text, execCodeBlocks) {
  return text.replace(/@@EXEC(\d+)@@/g, (_, i) => {
    const code = execCodeBlocks[i];
    const escapedCode = escapeHtml(code);
    
    return `<div class="exec-code-container">
      <div class="exec-code-header"  onclick="toggleExecCode(this)" > 
        <span class="exec-code-label"><svg width="20px" height="20px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 16C10.6193 16 9.5 17.1193 9.5 18.5C9.5 19.8807 10.6193 21 12 21C13.3807 21 14.5 19.8807 14.5 18.5C14.5 17.1193 13.3807 16 12 16ZM12 16V12M5.5 8C6.88071 8 8 6.88071 8 5.5C8 4.11929 6.88071 3 5.5 3C4.11929 3 3 4.11929 3 5.5C3 6.88071 4.11929 8 5.5 8ZM5.5 8V8.8C5.5 9.92011 5.5 10.4802 5.71799 10.908C5.90973 11.2843 6.21569 11.5903 6.59202 11.782C7.01984 12 7.57989 12 8.7 12H15.3C16.4201 12 16.9802 12 17.408 11.782C17.7843 11.5903 18.0903 11.2843 18.282 10.908C18.5 10.4802 18.5 9.92011 18.5 8.8V8M18.5 8C19.8807 8 21 6.88071 21 5.5C21 4.11929 19.8807 3 18.5 3C17.1193 3 16 4.11929 16 5.5C16 6.88071 17.1193 8 18.5 8Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></svg>Code Executed</span>
        <button class="exec-code-toggle" title="Show/Hide Code">
          <svg class="exec-code-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="16 18 22 12 16 6"></polyline>
            <polyline points="8 6 2 12 8 18"></polyline>
          </svg>
        </button>
      </div>
      <div class="exec-code-content" style="display: none;">
        <pre class="exec-code-pre"><code>${escapedCode}</code></pre>
      </div>
    </div>`;
  });
}

// Add this JavaScript function for toggling - make it globally accessible
window.toggleExecCode = function(button) {
  const container = button.closest('.exec-code-container');
  const content = container.querySelector('.exec-code-content');
  const icon = button.querySelector('.exec-code-icon');
  
  if (content.style.display === 'none') {
    content.style.display = 'block';
    icon.style.transform = 'rotate(90deg)';
    button.title = 'Hide Code';
  } else {
    content.style.display = 'none';
    icon.style.transform = 'rotate(0deg)';
    button.title = 'Show Code';
  }
}
// --- STREAMING CODE BLOCK PARSER ---
export function parseMarkdown(text) {
  const codeBlocks = [], inlineCodes = [];
  
  const { text: execParsedText, execCodeBlocks } = parseExecCode(text);
  text = execParsedText;

  // Parse reasoning blocks first
  const { text: reasoningParsedText, thinkingBlocks } = parseReasoning(text);
  text = reasoningParsedText;

  // Handle streaming and complete code blocks
  text = text.replace(/```(\w+)?\n([\s\S]*?)```/g, (_, lang, code) => {
    codeBlocks.push({ lang: lang || detectLanguage(code), code, complete: true });
    return `@@CB${codeBlocks.length-1}@@`;
  });
  text = text.replace(/```(\w+)?\n([\s\S]*)$/gm, (match, lang, code) => {
    const before = text.slice(0, text.indexOf(match));
    const openCount = (before.match(/```/g) || []).length;
    if (openCount % 2 === 0) {
      codeBlocks.push({ lang: lang || detectLanguage(code), code, complete: false });
      return `@@CB${codeBlocks.length-1}@@`;
    }
    return match;
  });

  // Handle inline code
  text = text.replace(/`([^`]+)`/g, (_, c) => {
    inlineCodes.push(c);
    return `@@IC${inlineCodes.length-1}@@`;
  });

  // Escape HTML
  text = escapeHtml(text);

  text = text.replace(
    /\\begin\{(bmatrix|pmatrix)\}([\s\S]+?)\\end\{\1\}/g,
    '<div class="math-block">\\[$0\\]</div>'
  );
  text = text.replace(
    /(?<=\W|^)(\d+)\/(\d+)(?=\W|$)/g,
    '<span class="math-inline">\\($1/$2\\)</span>'
  );
  text = text.replace(/\\\[((?:.|\n)+?)\\\]/g, '<div class="math-block">\\[$1\\]</div>');
  text = text.replace(/\\\((.+?)\\\)/g, '<span class="math-inline">\\($1\\)</span>');
  // Math Blocks (KaTeX)
  text = text.replace(/\$\$([\s\S]+?)\$\$/g, '<div class="math-block">\\[$1\\]</div>');
  text = text.replace(/\$([^\$]+?)\$/g, '<span class="math-inline">\\($1\\)</span>');
  // Format block math environments: \[ ... \]
  

  
function convertYouTubeLinksToThumbnails(text) {
    // Regex to capture various YouTube video IDs
    // Group 1: The custom ID (e.g., #1, #2) - not used for video/thumbnail URLs
    // Group 2: The actual YouTube video ID (11 characters, alphanumeric, hyphen, underscore)
    const customYouTubeRegex = /\|\s*#(\d+)\s*\|\s*\((?:https?:\/\/(?:www\.)?(?:m\.)?)?(?:youtube\.com(?:\/watch\?v=|\/embed\/|\/v\/|\/shorts\/)|youtu\.be\/|googleusercontent\.com\/youtube\.com\/\d{1}\/[a-zA-Z0-9_-]+\/)([a-zA-Z0-9_-]{11})(?:\S+)?\)/g;

    return text.replace(customYouTubeRegex, (match, customId, youtubeVideoId) => {
        // Construct the standard YouTube video URL
        const videoUrl = `https://www.youtube.com/watch?v=${youtubeVideoId}`;
        // Construct the standard YouTube thumbnail URL (using hqdefault for good quality)
        const thumbnailUrl = `https://img.youtube.com/vi/${youtubeVideoId}/hqdefault.jpg`;

        // Return the HTML for the thumbnail preview div
        return `
          <div class="youtube-thumbnail-preview">
            <a href="${videoUrl}" target="_blank" rel="noopener noreferrer">
              <img src="${thumbnailUrl}" alt="YouTube video thumbnail">
              <div class="play-button"><div class="play-button-bg">▶</div></div>
            </a>
          </div>
        `;
    });
}


text = convertYouTubeLinksToThumbnails(text);

text = text.replace(/\|\s*#\d+\s*\|\s*\(\s*(https?:\/\/[^)]+?)\s*\)/g, (match, url) => {
    try {
        const domain = new URL(url).hostname;
        // Construct the HTML for the clickable logo
        return `
            <a href="${url}" target="_blank" class="source-link">
                <img src="https://www.google.com/s2/favicons?sz=32&domain=${domain}" class="logo" alt="Favicon for ${domain}" onerror="this.onerror=null;this.src='https://placehold.co/32x32/cccccc/ffffff?text=?'">
                <span>${domain}</span>
            </a>
        `;
    } catch (e) {
        console.error("Invalid URL detected:", url, e);
        return `[Invalid Link: ${url}]`; // Fallback for malformed URLs
    }
});


const regex = /^:::\(src\)([\s\S]*?):::\(src\)\n*/gm;
text= text.replace(regex, '<div class="src-con" id="srcCon" >$1<span class="src-con-txt">Sources</span></div><br>');

text = text.replace(/\[\[!\]\]\((https?:\/\/[^)]+)\)/g, (match, url) => {
  try {
      const domain = new URL(url).hostname;
      // Construct the HTML for the clickable logo
      return `
          <a href="${url}" target="_blank" class="source-link-r">
              <img src="https://www.google.com/s2/favicons?sz=32&domain=${domain}" class="logo" alt="Favicon for ${domain}" onerror="this.onerror=null;this.src='https://placehold.co/32x32/cccccc/ffffff?text=?'">
          </a>
      `;
  } catch (e) {
      console.error("Invalid URL detected:", url, e);
      return `[Invalid Link: ${url}]`; // Fallback for malformed URLs
  }
});





// Optional: Wrap equations with `\[ ... \]` or `$$ ... $$` inside <pre> if from code input
// Or sanitize/escape HTML elsewhere before parsing if needed


  // Admonitions
  text = text.replace(/^:::(note|warning|tip)\s*$/gm, '<div class="$1 admonition">');
  text = text.replace(/^:::\s*$/gm, '</div>');

  // Task Lists
  text = text.replace(/^- \[ \] (.*)$/gm, '<li class="task-list-item"><input type="checkbox" disabled> $1</li>');
  text = text.replace(/^- \[x\] (.*)$/gm, '<li class="task-list-item"><input type="checkbox" checked disabled> $1</li>');
  text = text.replace(/(<li class="task-list-item".*?<\/li>)/gs, (m) => `<ul class="task-list">${m}</ul>`);

  // Handle table formatting
  text = handleTableFormatting(text);

  // Headings
  text = text.replace(/^######\s+(.*)$/gm, '<h6>$1</h6>')
             .replace(/^#####\s+(.*)$/gm, '<h5>$1</h5>')
             .replace(/^####\s+(.*)$/gm, '<h4>$1</h4>')
             .replace(/^###\s+(.*)$/gm, '<h3>$1</h3>')
             .replace(/^##\s+(.*)$/gm, '<h2>$1</h2>')
             .replace(/^#\s+(.*)$/gm, '<h1>$1</h1>');

  // Formatting
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
             .replace(/\*(.*?)\*/g, '<em>$1</em>')
             .replace(/~~(.*?)~~/g, '<del>$1</del>')
             .replace(/__(.*?)__/g, '<u>$1</u>')


  // Blockquotes, HR, Links, Lists
  text = text.replace(/^>\s+(.*)$/gm, '<blockquote>$1</blockquote>')
             .replace(/^---$/gm, '<hr>')
             .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
             .replace(/^\*\s+(.*)$/gm, '<li>$1</li>')
             .replace(/(<li>.*?<\/li>)/gs, '<ul>$1</ul>')
             .replace(/^\d+\.\s+(.*)$/gm, '<li>$1</li>')
             .replace(/(<ol>.*?<\/ol>)/gs, '<ol>$1</ol>');
  
  

  text = '<p>' + text.replace(/\n\n+/g, '</p><p>') + '</p>';
  text = text.replace(/<p><\/p>/g, '');

  // Restore inline codes
  text = text.replace(/@@IC(\d+)@@/g, (_, i) => `<code>${escapeHtml(inlineCodes[i])}</code>`);

// --- RESTORING THINKING BLOCKS in parseMarkdown() ---
  text = text.replace(/@@THINK(\d+)@@/g, (_, i) => {
  const { content, complete } = thinkingBlocks[i];
  // choose label and animation based on whether we closed the block
  const label = complete ? 'Thought result' : 'Thinking';
  
  return `<div class="thinking-block ${complete ? 'complete' : 'streaming'}">
      <button class="thinking-toggle" onclick="toggleThinking(this)"><div class="thinking-header">
  
        <div>
          <span class="thinking-label">
            <svg class="think-logo" width="21" height="21" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2.656 17.344c-1.016-1.015-1.15-2.75-.313-4.925.325-.825.73-1.617 1.205-2.365L3.582 10l-.033-.054c-.5-.799-.91-1.596-1.206-2.365-.836-2.175-.703-3.91.313-4.926.56-.56 1.364-.86 2.335-.86 1.425 0 3.168.636 4.957 1.756l.053.034.053-.034c1.79-1.12 3.532-1.757 4.957-1.757.972 0 1.776.3 2.335.86 1.014 1.015 1.148 2.752.312 4.926a13.892 13.892 0 0 1-1.206 2.365l-.034.054.034.053c.5.8.91 1.596 1.205 2.365.837 2.175.704 3.911-.311 4.926-.56.56-1.364.861-2.335.861-1.425 0-3.168-.637-4.957-1.757L10 16.415l-.053.033c-1.79 1.12-3.532 1.757-4.957 1.757-.972 0-1.776-.3-2.335-.86zm13.631-4.399c-.187-.488-.429-.988-.71-1.492l-.075-.132-.092.12a22.075 22.075 0 0 1-3.968 3.968l-.12.093.132.074c1.308.734 2.559 1.162 3.556 1.162.563 0 1.006-.138 1.298-.43.3-.3.436-.774.428-1.346-.008-.575-.159-1.264-.449-2.017zm-6.345 1.65l.058.042.058-.042a19.881 19.881 0 0 0 4.551-4.537l.043-.058-.043-.058a20.123 20.123 0 0 0-2.093-2.458 19.732 19.732 0 0 0-2.458-2.08L10 5.364l-.058.042A19.883 19.883 0 0 0 5.39 9.942L5.348 10l.042.059c.631.874 1.332 1.695 2.094 2.457a19.74 19.74 0 0 0 2.458 2.08zm6.366-10.902c-.293-.293-.736-.431-1.298-.431-.998 0-2.248.429-3.556 1.163l-.132.074.12.092a21.938 21.938 0 0 1 3.968 3.968l.092.12.074-.132c.282-.504.524-1.004.711-1.492.29-.753.442-1.442.45-2.017.007-.572-.129-1.045-.429-1.345zM3.712 7.055c.202.514.44 1.013.712 1.493l.074.13.092-.119a21.94 21.94 0 0 1 3.968-3.968l.12-.092-.132-.074C7.238 3.69 5.987 3.262 4.99 3.262c-.563 0-1.006.138-1.298.43-.3.301-.436.774-.428 1.346.007.575.159 1.264.448 2.017zm0 5.89c-.29.753-.44 1.442-.448 2.017-.008.572.127 1.045.428 1.345.293.293.736.431 1.298.431.997 0 2.247-.428 3.556-1.162l.131-.074-.12-.093a21.94 21.94 0 0 1-3.967-3.968l-.093-.12-.074.132a11.712 11.712 0 0 0-.71 1.492z" fill="currentColor" stroke="currentColor" stroke-width=".1"></path><path d="M10.706 11.704A1.843 1.843 0 0 1 8.155 10a1.845 1.845 0 1 1 2.551 1.704z" fill="currentColor" stroke="currentColor" stroke-width=".2"></path></svg>${label}
          </span>
        </div>
        <div>
          <svg class="thinking-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="6,9 12,15 18,9"></polyline>
          </svg>
        </div>
      </div>
    </button>
  
    <div class="thinking-content is-open">
      ${parseMarkdown(content)}
    </div>
  </div>`;
});


  // Restore code blocks
  text = text.replace(/@@CB(\d+)@@/g, (_, i) => {
    const { lang, code, complete } = codeBlocks[i];
    const statusClass = complete ? 'complete' : 'streaming';
    const streamingIndicator = complete ? '' : '<span class="streaming-indicator">●</span>';
    
    if (lang === 'mermaid') {
      return `<div class="mermaid">${escapeHtml(code)}</div>`;
    }
    
    return `<div class="code-container ${statusClass}" data-language="${lang}">
      <div class="code-header">
        <span class="language-label">${lang.toLowerCase()}</span>
        ${streamingIndicator}
        <div class="code-actions">
          <button class="collapse-button" data-index="${i}" title="Collapse">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevrons-down-up size-4"><path d="m7 20 5-5 5 5"></path><path d="m7 4 5 5 5-5"></path></svg>
          </button>
          <button class="wrap-button" data-index="${i}" title="Toggle Wrap">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-wrap-text size-4"><line x1="3" x2="21" y1="6" y2="6"></line><path d="M3 12h15a3 3 0 1 1 0 6h-4"></path><polyline points="16 16 14 18 16 20"></polyline><line x1="3" x2="10" y1="18" y2="18"></line></svg>
          </button>
          ${lang === 'python' ? `
            <button class="run-button" data-index="${i}" data-language="${lang}" title="Run Code">
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-play size-4"><polygon points="6 3 20 12 6 21 6 3"></polygon></svg>
            </button>
            ` : ''}
          <button class="copy-button" data-index="${i}" title="Copy">
            <svg width="15px" height="15px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M7.5 3H14.6C16.8402 3 17.9603 3 18.816 3.43597C19.5686 3.81947 20.1805 4.43139 20.564 5.18404C21 6.03969 21 7.15979 21 9.4V16.5M6.2 21H14.3C15.4201 21 15.9802 21 16.408 20.782C16.7843 20.5903 17.0903 20.2843 17.282 19.908C17.5 19.4802 17.5 18.9201 17.5 17.8V9.7C17.5 8.57989 17.5 8.01984 17.282 7.59202C17.0903 7.21569 16.7843 6.90973 16.408 6.71799C15.9802 6.5 15.4201 6.5 14.3 6.5H6.2C5.0799 6.5 4.51984 6.5 4.09202 6.71799C3.71569 6.90973 3.40973 7.21569 3.21799 7.59202C3 8.01984 3 8.57989 3 9.7V17.8C3 18.9201 3 19.4802 3.21799 19.908C3.40973 20.2843 3.71569 20.5903 4.09202 20.782C4.51984 21 5.0799 21 6.2 21Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
      <div class="code-content">
        <pre class="code-pre"><code class="language-${lang}" data-code="${escapeHtml(code).replace(/"/g, '&quot;')}">${escapeHtml(code)}</code></pre>
      </div>
      <div class="code-output" style="display: none;">
        <div class="output-content"></div>
      </div>
    </div>`;
  });

  text = restoreExecCodeBlocks(text, execCodeBlocks);

  return text;
}

// Add global function for thinking toggle
window.toggleThinking = function(button) {
  const thinkingBlock = button.closest('.thinking-block');
  const content = thinkingBlock.querySelector('.thinking-content');
  const chevron = button.querySelector('.thinking-chevron');

  const isOpen = content.classList.contains('is-open');

  if (isOpen) {
      // If it's open, we want to close it:
      // 1. Remove the 'is-open' class to trigger the collapse animation
      content.classList.remove('is-open');
      chevron.style.transform = 'rotate(-90deg)'; // Rotate chevron to point down/left

      // 2. Wait for the transition to finish before setting display to 'none'
      // This ensures the animation completes before the element is removed from flow.
      content.addEventListener('transitionend', function handler() {
          // Check if 'is-open' class is still not present (means it truly finished closing)
          if (!content.classList.contains('is-open')) {
              content.style.display = 'none';
          }
          // Remove the event listener to prevent multiple calls
          content.removeEventListener('transitionend', handler);
      }, { once: true }); // The { once: true } option ensures the listener is removed after it fires once

  } else {
      // If it's closed, we want to open it:
      // 1. Immediately set display to 'block' so the element is in the DOM for layout calculation.
      content.style.display = 'block';

      // 2. A tiny delay is often necessary before adding the 'is-open' class.
      // This allows the browser to acknowledge `display: block` before applying transitions.
      setTimeout(() => {
          content.classList.add('is-open');
          chevron.style.transform = 'rotate(0deg)'; // Rotate chevron to point up/right or straight
      }, 10); // 10ms is usually enough
  }
};

// --- COPY BUTTON HANDLER ---
document.addEventListener('click', e => {
  if (e.target.closest('.copy-button')) {
    const btn = e.target.closest('.copy-button');
    const idx = btn.dataset.index;
    const codeEl = document.querySelectorAll('.code-container pre code')[idx];
    
    if (codeEl) {
      navigator.clipboard.writeText(codeEl.innerText);

      btn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" class="icon copied" viewBox="0 0 24 24" width="15" height="14" fill="currentColor">
          <path d="M20.285 6.709l-11.025 11.025-5.543-5.543 1.414-1.414 4.129 4.129 9.611-9.611z"/>
        </svg>
      `;

      setTimeout(() => {
        btn.innerHTML = `
         <svg width="15px" height="15px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M7.5 3H14.6C16.8402 3 17.9603 3 18.816 3.43597C19.5686 3.81947 20.1805 4.43139 20.564 5.18404C21 6.03969 21 7.15979 21 9.4V16.5M6.2 21H14.3C15.4201 21 15.9802 21 16.408 20.782C16.7843 20.5903 17.0903 20.2843 17.282 19.908C17.5 19.4802 17.5 18.9201 17.5 17.8V9.7C17.5 8.57989 17.5 8.01984 17.282 7.59202C17.0903 7.21569 16.7843 6.90973 16.408 6.71799C15.9802 6.5 15.4201 6.5 14.3 6.5H6.2C5.0799 6.5 4.51984 6.5 4.09202 6.71799C3.71569 6.90973 3.40973 7.21569 3.21799 7.59202C3 8.01984 3 8.57989 3 9.7V17.8C3 18.9201 3 19.4802 3.21799 19.908C3.40973 20.2843 3.71569 20.5903 4.09202 20.782C4.51984 21 5.0799 21 6.2 21Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        `;
      }, 2000);
    }
  }
});


document.addEventListener('click', e => {
  if (e.target.closest('.collapse-button')) {
    const btn = e.target.closest('.collapse-button');
    const container = btn.closest('.code-container');
    const content = container.querySelector('.code-content');
    const currentSvg = btn.querySelector('svg'); // Get the current SVG element
    const code = container.querySelector('code').textContent;
    const lineCount = code.split('\n').length;

    // Define your SVG strings
    const expandSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevrons-up-down size-4"><path d="m7 15 5 5 5-5"></path><path d="m7 9 5-5 5 5"></path></svg>`;
    const collapseSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevrons-down-up size-4"><path d="m7 20 5-5 5 5"></path><path d="m7 4 5 5 5-5"></path></svg>`;

    let hiddenLinesDiv = container.querySelector('.hidden-lines');

    if (content.style.display === 'none') {
      // Expanding
      content.style.display = 'block';
      // Replace the SVG with the collapse SVG
      currentSvg.outerHTML = collapseSvg; 
      btn.title = 'Collapse';
      if (hiddenLinesDiv) {
        hiddenLinesDiv.remove();
      }
    } else {
      // Collapsing
      content.style.display = 'none';
      // Replace the SVG with the expand SVG
      currentSvg.outerHTML = expandSvg; 
      btn.title = 'Expand';

      if (!hiddenLinesDiv) {
        hiddenLinesDiv = document.createElement('div');
        hiddenLinesDiv.className = 'hidden-lines';
        hiddenLinesDiv.innerHTML = `<span>${lineCount} hidden lines</span>`;
        container.appendChild(hiddenLinesDiv);
      }
    }
  }
});

// --- WRAP BUTTON HANDLER ---
document.addEventListener('click', e => {
  if (e.target.closest('.wrap-button')) {
    const btn = e.target.closest('.wrap-button');
    const container = btn.closest('.code-container');
    const pre = container.querySelector('.code-pre');
    
    if (pre.classList.contains('wrapped')) {
      pre.classList.remove('wrapped');
      btn.title = 'Toggle Wrap';
    } else {
      pre.classList.add('wrapped');
      btn.title = 'Remove Wrap';
    }
  }
});

// --- RUN BUTTON HANDLER ---
document.addEventListener('click', async e => {
  if (e.target.closest('.run-button')) {
    const btn = e.target.closest('.run-button');
    const container = btn.closest('.code-container');
    const code = btn.dataset.code || container.querySelector('code').getAttribute('data-code');
    const language = btn.dataset.language;
    const outputDiv = container.querySelector('.code-output');
    const outputContent = container.querySelector('.output-content');
    
    // Show loading state
    btn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <path d="M12 6v6l4 2"></path>
      </svg>
    `;
    btn.disabled = true;
    
    // Show output section
    outputDiv.style.display = 'block';
    outputContent.innerHTML = '<div class="loading">Running code...</div>';
    
    try {
      const response = await fetch('/run_code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: code,
          language: language
        })
      });
      
      const result = await response.json();
      
      if (result.status === 'success') {
        outputContent.innerHTML = `<pre class="output-success">${escapeHtml(result.output)}</pre>`;
      } else {
        outputContent.innerHTML = `<pre class="output-error">${escapeHtml(result.error)}</pre>`;
      }
    } catch (error) {
      outputContent.innerHTML = `<pre class="output-error">Error: Failed to execute code - ${error.message}</pre>`;
    } finally {
      // Restore run button
      btn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="5,3 19,12 5,21"></polygon>
        </svg>
      `;
      btn.disabled = false;
    }
  }
});

